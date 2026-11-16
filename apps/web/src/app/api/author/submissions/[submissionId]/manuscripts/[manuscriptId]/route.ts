import { z } from "zod";
import { AppError } from "@/modules/shared/app-error";
import { getManuscriptForAuthor } from "@/modules/submissions/application/use-cases";
import { createPostgresSubmissionRepository } from "@/modules/submissions/infrastructure/postgres-repository";
import { createPrivateSubmissionStorage } from "@/modules/submissions/infrastructure/local-private-storage";
import { auth, isOidcConfigured } from "@/server/auth";
import { getDatabase } from "@/server/db/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const privateHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  "Content-Security-Policy": "default-src 'none'; sandbox",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
};

function emptyResponse(status: number): Response {
  return new Response(null, { status, headers: privateHeaders });
}

export async function GET(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{ submissionId: string; manuscriptId: string }>;
  },
): Promise<Response> {
  if (!isOidcConfigured) {
    return emptyResponse(404);
  }

  const actorUserId = (await auth())?.user?.id;
  if (!actorUserId) {
    return emptyResponse(401);
  }

  const { submissionId, manuscriptId } = await params;
  if (
    !z.uuid().safeParse(submissionId).success ||
    !z.uuid().safeParse(manuscriptId).success
  ) {
    return emptyResponse(404);
  }

  try {
    const storage = createPrivateSubmissionStorage();
    const { file, content } = await getManuscriptForAuthor(
      createPostgresSubmissionRepository(getDatabase()),
      storage,
      actorUserId,
      submissionId,
      manuscriptId,
    );

    const responseBody = new Uint8Array(new ArrayBuffer(file.byteSize));
    responseBody.set(content);

    return new Response(responseBody, {
      headers: {
        ...privateHeaders,
        "Content-Disposition": `attachment; filename="manuscript-v${file.version}.pdf"`,
        "Content-Length": String(file.byteSize),
        "Content-Type": file.contentType,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      if (error.code === "NOT_FOUND") {
        return emptyResponse(404);
      }
      if (error.code === "STORAGE_NOT_CONFIGURED") {
        return new Response("Private file storage is unavailable.", {
          status: 503,
          headers: {
            ...privateHeaders,
            "Content-Type": "text/plain; charset=utf-8",
          },
        });
      }
    }
    throw error;
  }
}
