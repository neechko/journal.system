import { z } from "zod";
import { AppError } from "@/modules/shared/app-error";
import { submitReview } from "@/modules/editorial/application/use-cases";
import { createPostgresEditorialRepository } from "@/modules/editorial/infrastructure/postgres-repository";
import { createPostgresTenancyRepository } from "@/modules/tenancy/infrastructure/postgres-repository";
import { auth, isOidcConfigured } from "@/server/auth";
import { getDatabase } from "@/server/db/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const submitReviewSchema = z.object({
  submissionId: z.uuid(),
  assignmentId: z.uuid(),
  recommendation: z.enum(["accept", "minor_revision", "major_revision", "reject"]),
  commentsToAuthor: z.string().min(1).max(10000),
  commentsToEditor: z.string().max(10000).nullable().optional(),
  originality: z.coerce.number().int().min(1).max(5).nullable().optional(),
  methodology: z.coerce.number().int().min(1).max(5).nullable().optional(),
  clarity: z.coerce.number().int().min(1).max(5).nullable().optional(),
  significance: z.coerce.number().int().min(1).max(5).nullable().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ submissionId: string }> },
) {
  if (!isOidcConfigured) {
    return new Response("Not found", { status: 404 });
  }

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const formData = await request.formData();
  const parsed = submitReviewSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return new Response("Invalid input", { status: 400 });
  }

  const { submissionId } = await params;
  if (submissionId !== parsed.data.submissionId) {
    return new Response("Invalid input", { status: 400 });
  }

  try {
    await submitReview(
      createPostgresEditorialRepository(getDatabase()),
      createPostgresTenancyRepository(getDatabase()),
      {
        assignmentId: parsed.data.assignmentId,
        reviewerUserId: userId,
        recommendation: parsed.data.recommendation,
        commentsToAuthor: parsed.data.commentsToAuthor,
        commentsToEditor: parsed.data.commentsToEditor ?? null,
        scores: {
          originality: parsed.data.originality ?? null,
          methodology: parsed.data.methodology ?? null,
          clarity: parsed.data.clarity ?? null,
          significance: parsed.data.significance ?? null,
          overall: null,
        },
      }
    );
  } catch (error) {
    if (error instanceof AppError) {
      const status =
        error.code === "NOT_FOUND"
          ? 404
          : error.code === "FORBIDDEN"
            ? 403
            : error.code === "CONFLICT" || error.code === "INVALID_STATE"
              ? 409
              : 400;
      return new Response(error.message, { status });
    }
    throw error;
  }

  return new Response(null, {
    status: 303,
    headers: { Location: `/reviewer/submissions/${parsed.data.submissionId}` },
  });
}