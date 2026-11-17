import { z } from "zod";
import { AppError } from "@/modules/shared/app-error";
import { getManuscriptForReviewer } from "@/modules/editorial/application/use-cases";
import { createPostgresEditorialRepository } from "@/modules/editorial/infrastructure/postgres-repository";
import { isPdfPayload } from "@/modules/submissions/application/file-validation";
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
    // Access is resolved against an active reviewer assignment before the
    // private object is touched, so a leaked storage key is not enough.
    const file = await getManuscriptForReviewer(
      createPostgresEditorialRepository(getDatabase()),
      actorUserId,
      submissionId,
      manuscriptId,
    );

    const storage = createPrivateSubmissionStorage();
    const stored = await storage.read(file.storageKey);

    if (
      stored.content.byteLength !== file.byteSize ||
      stored.sha256 !== file.sha256 ||
      !isPdfPayload(stored.content)
    ) {
      throw new AppError(
        "STORAGE_INTEGRITY_FAILURE",
        "The stored manuscript failed its integrity check.",
      );
    }

    const responseBody = new Uint8Array(new ArrayBuffer(file.byteSize));
    responseBody.set(stored.content);

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
      if (
        error.code === "STORAGE_NOT_CONFIGURED" ||
        error.code === "STORAGE_INTEGRITY_FAILURE"
      ) {
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
