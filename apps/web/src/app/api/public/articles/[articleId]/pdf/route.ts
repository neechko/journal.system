import { z } from "zod";
import { AppError } from "@/modules/shared/app-error";
import { createPostgresProductionRepository } from "@/modules/production/infrastructure/postgres-repository";
import { createPublicStorage } from "@/modules/production/infrastructure/public-storage";
import { isPdfPayload } from "@/modules/submissions/application/file-validation";
import { getDatabase } from "@/server/db/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const publicHeaders = {
  "Cache-Control": "public, max-age=31536000, immutable",
  "Content-Security-Policy": "default-src 'none'; sandbox",
  "Cross-Origin-Resource-Policy": "cross-origin",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
};

function emptyResponse(status: number): Response {
  return new Response(null, { status, headers: publicHeaders });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ articleId: string }> },
): Promise<Response> {
  const { articleId } = await params;
  if (!z.uuid().safeParse(articleId).success) {
    return emptyResponse(404);
  }

  try {
    const productionRepo = createPostgresProductionRepository(getDatabase());
    const article = await productionRepo.findArticleVersion(articleId);

    if (!article || article.status !== "published" || !article.pdfFileId) {
      return emptyResponse(404);
    }

    const storage = createPublicStorage();
    const file = await storage.read(article.pdfFileId);

    if (
      file.content.byteLength !== file.byteSize ||
      !isPdfPayload(file.content) ||
      file.contentType !== "application/pdf"
    ) {
      throw new AppError("STORAGE_INTEGRITY_FAILURE", "The stored PDF failed its integrity check.");
    }

    const responseBody = new Uint8Array(new ArrayBuffer(file.byteSize));
    responseBody.set(file.content);

    const fileName = article.doi
      ? `article-${article.doi.replace(/[^a-zA-Z0-9]/g, "-")}.pdf`
      : `article-${articleId}.pdf`;

    return new Response(responseBody, {
      headers: {
        ...publicHeaders,
        "Content-Disposition": `inline; filename="${fileName}"`,
        "Content-Length": String(file.byteSize),
        "Content-Type": "application/pdf",
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      if (error.code === "NOT_FOUND") {
        return emptyResponse(404);
      }
      if (error.code === "STORAGE_NOT_CONFIGURED") {
        return new Response("Public file storage is unavailable.", {
          status: 503,
          headers: {
            ...publicHeaders,
            "Content-Type": "text/plain; charset=utf-8",
          },
        });
      }
    }
    throw error;
  }
}