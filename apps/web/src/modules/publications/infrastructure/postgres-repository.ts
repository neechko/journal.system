import { and, asc, desc, eq, isNotNull, sql } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "@/server/db/schema";
import type {
  PublicationsRepository,
  PublishedArticle,
  PublishedArticleAuthor,
  PublishedArticleSummary,
  PublishedIssue,
  PublishedIssueArticle,
  PublishedIssueSummary,
  PublishedJournalReference,
  PublishedVolumeReference,
} from "../application/ports";

function parseAuthors(value: unknown): PublishedArticleAuthor[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item, index) => ({
      name: typeof item.name === "string" ? item.name : "Unknown author",
      affiliation: typeof item.affiliation === "string" ? item.affiliation : null,
      orcid: typeof item.orcid === "string" ? item.orcid : null,
      email: typeof item.email === "string" ? item.email : null,
      isCorresponding: item.isCorresponding === true,
      order: typeof item.order === "number" ? item.order : index + 1,
    }))
    .sort((a, b) => a.order - b.order);
}

function mapJournal(row: {
  journalId: string;
  journalTitle: string;
  journalSlug: string;
  organizationName: string;
  organizationSlug: string;
}): PublishedJournalReference {
  return {
    id: row.journalId,
    title: row.journalTitle,
    slug: row.journalSlug,
    organizationName: row.organizationName,
    organizationSlug: row.organizationSlug,
  };
}

export function createPostgresPublicationsRepository<
  TQueryResult extends PgQueryResultHKT,
>(
  database: PgDatabase<TQueryResult, typeof schema>,
): PublicationsRepository {
  return {
    async findPublishedArticle({
      organizationSlug,
      journalSlug,
      articleId,
    }): Promise<PublishedArticle | null> {
      const [row] = await database
        .select({
          id: schema.articleVersions.id,
          title: schema.articleVersions.title,
          abstract: schema.articleVersions.abstract,
          keywords: schema.articleVersions.keywords,
          authors: schema.articleVersions.authors,
          pdfFileId: schema.articleVersions.pdfFileId,
          htmlContent: schema.articleVersions.htmlContent,
          publishedAt: schema.articleVersions.publishedAt,
          journalId: schema.journals.id,
          journalTitle: schema.journals.title,
          journalSlug: schema.journals.slug,
          organizationName: schema.organizations.name,
          organizationSlug: schema.organizations.slug,
          issueId: schema.issues.id,
          issueNumber: schema.issues.number,
          issueYear: schema.issues.year,
          issueLabel: schema.issues.label,
          volumeId: schema.volumes.id,
          volumeNumber: schema.volumes.number,
          volumeYear: schema.volumes.year,
          volumeLabel: schema.volumes.label,
          pageStart: schema.issueArticles.pageStart,
          pageEnd: schema.issueArticles.pageEnd,
          articleType: schema.issueArticles.articleType,
        })
        .from(schema.articleVersions)
        .innerJoin(
          schema.submissions,
          eq(schema.submissions.id, schema.articleVersions.submissionId),
        )
        .innerJoin(
          schema.journals,
          eq(schema.journals.id, schema.submissions.journalId),
        )
        .innerJoin(
          schema.organizations,
          eq(schema.organizations.id, schema.journals.organizationId),
        )
        .leftJoin(
          schema.issueArticles,
          eq(schema.issueArticles.articleId, schema.articleVersions.id),
        )
        .leftJoin(schema.issues, eq(schema.issues.id, schema.issueArticles.issueId))
        .leftJoin(schema.volumes, eq(schema.volumes.id, schema.issues.volumeId))
        .where(
          and(
            eq(schema.articleVersions.id, articleId),
            eq(schema.articleVersions.status, "published"),
            isNotNull(schema.articleVersions.publishedAt),
            eq(schema.journals.slug, journalSlug),
            eq(schema.organizations.slug, organizationSlug),
            isNotNull(schema.journals.publishedAt),
          ),
        )
        .limit(1);

      if (!row || !row.publishedAt) {
        return null;
      }

      const volume: PublishedVolumeReference | null =
        row.volumeId && row.volumeNumber !== null
          ? {
              id: row.volumeId,
              number: row.volumeNumber,
              year: row.volumeYear ?? row.issueYear ?? row.publishedAt.getFullYear(),
              label: row.volumeLabel,
            }
          : null;

      return {
        id: row.id,
        title: row.title,
        abstract: row.abstract,
        keywords: row.keywords,
        authors: parseAuthors(row.authors),
        // The schema has no verified deposit evidence, so public reads omit DOI.
        doi: null,
        pdfFileId: row.pdfFileId,
        htmlContent: row.htmlContent,
        pageStart: row.pageStart,
        pageEnd: row.pageEnd,
        articleType: row.articleType,
        publishedAt: row.publishedAt,
        journal: mapJournal(row),
        issue:
          row.issueId && row.issueNumber !== null && row.issueYear !== null
            ? {
                id: row.issueId,
                number: row.issueNumber,
                year: row.issueYear,
                label: row.issueLabel,
              }
            : null,
        volume,
      };
    },

    async findPublishedIssue({
      organizationSlug,
      journalSlug,
      issueId,
    }): Promise<PublishedIssue | null> {
      const [issueRow] = await database
        .select({
          id: schema.issues.id,
          number: schema.issues.number,
          year: schema.issues.year,
          label: schema.issues.label,
          description: schema.issues.description,
          publishedAt: schema.issues.publishedAt,
          journalId: schema.journals.id,
          journalTitle: schema.journals.title,
          journalSlug: schema.journals.slug,
          organizationName: schema.organizations.name,
          organizationSlug: schema.organizations.slug,
          volumeId: schema.volumes.id,
          volumeNumber: schema.volumes.number,
          volumeYear: schema.volumes.year,
          volumeLabel: schema.volumes.label,
        })
        .from(schema.issues)
        .innerJoin(schema.journals, eq(schema.journals.id, schema.issues.journalId))
        .innerJoin(
          schema.organizations,
          eq(schema.organizations.id, schema.journals.organizationId),
        )
        .leftJoin(schema.volumes, eq(schema.volumes.id, schema.issues.volumeId))
        .where(
          and(
            eq(schema.issues.id, issueId),
            eq(schema.issues.status, "published"),
            eq(schema.journals.slug, journalSlug),
            eq(schema.organizations.slug, organizationSlug),
          ),
        )
        .limit(1);

      if (!issueRow || !issueRow.publishedAt) {
        return null;
      }

      const articleRows = await database
        .select({
          id: schema.articleVersions.id,
          title: schema.articleVersions.title,
          abstract: schema.articleVersions.abstract,
          authors: schema.articleVersions.authors,
          pdfFileId: schema.articleVersions.pdfFileId,
          pageStart: schema.issueArticles.pageStart,
          pageEnd: schema.issueArticles.pageEnd,
          order: schema.issueArticles.order,
          articleType: schema.issueArticles.articleType,
        })
        .from(schema.issueArticles)
        .innerJoin(
          schema.articleVersions,
          eq(schema.articleVersions.id, schema.issueArticles.articleId),
        )
        .where(
          and(
            eq(schema.issueArticles.issueId, issueId),
            eq(schema.articleVersions.status, "published"),
          ),
        )
        .orderBy(asc(schema.issueArticles.order));

      const articles: PublishedIssueArticle[] = articleRows.map((row) => ({
        id: row.id,
        title: row.title,
        abstract: row.abstract,
        authors: parseAuthors(row.authors),
        doi: null,
        pdfFileId: row.pdfFileId,
        pageStart: row.pageStart,
        pageEnd: row.pageEnd,
        order: row.order,
        articleType: row.articleType,
      }));

      return {
        id: issueRow.id,
        number: issueRow.number,
        year: issueRow.year,
        label: issueRow.label,
        description: issueRow.description,
        publishedAt: issueRow.publishedAt,
        journal: mapJournal(issueRow),
        volume: issueRow.volumeId
          ? {
              id: issueRow.volumeId,
              number: issueRow.volumeNumber ?? 0,
              year: issueRow.volumeYear ?? issueRow.year,
              label: issueRow.volumeLabel,
            }
          : null,
        articles,
      };
    },

    async listPublishedArticles(
      { organizationSlug, journalSlug },
      limit,
    ): Promise<PublishedArticleSummary[]> {
      const rows = await database
        .select({
          id: schema.articleVersions.id,
          title: schema.articleVersions.title,
          authors: schema.articleVersions.authors,
          publishedAt: schema.articleVersions.publishedAt,
          articleType: schema.issueArticles.articleType,
          pageStart: schema.issueArticles.pageStart,
          pageEnd: schema.issueArticles.pageEnd,
          issueId: schema.issues.id,
          issueNumber: schema.issues.number,
          issueYear: schema.issues.year,
          volumeNumber: schema.volumes.number,
        })
        .from(schema.articleVersions)
        .innerJoin(
          schema.submissions,
          eq(schema.submissions.id, schema.articleVersions.submissionId),
        )
        .innerJoin(
          schema.journals,
          eq(schema.journals.id, schema.submissions.journalId),
        )
        .innerJoin(
          schema.organizations,
          eq(schema.organizations.id, schema.journals.organizationId),
        )
        .leftJoin(
          schema.issueArticles,
          eq(schema.issueArticles.articleId, schema.articleVersions.id),
        )
        .leftJoin(schema.issues, eq(schema.issues.id, schema.issueArticles.issueId))
        .leftJoin(schema.volumes, eq(schema.volumes.id, schema.issues.volumeId))
        .where(
          and(
            eq(schema.articleVersions.status, "published"),
            isNotNull(schema.articleVersions.publishedAt),
            eq(schema.journals.slug, journalSlug),
            eq(schema.organizations.slug, organizationSlug),
            isNotNull(schema.journals.publishedAt),
          ),
        )
        .orderBy(desc(schema.articleVersions.publishedAt))
        .limit(Math.min(Math.max(limit, 1), 50));

      return rows
        .filter((row) => row.publishedAt !== null)
        .map((row) => ({
          id: row.id,
          title: row.title,
          authors: parseAuthors(row.authors),
          doi: null,
          publishedAt: row.publishedAt as Date,
          articleType: row.articleType,
          pageStart: row.pageStart,
          pageEnd: row.pageEnd,
          issueId: row.issueId,
          issueNumber: row.issueNumber,
          issueYear: row.issueYear,
          volumeNumber: row.volumeNumber,
        }));
    },

    async listPublishedIssues({
      organizationSlug,
      journalSlug,
    }): Promise<PublishedIssueSummary[]> {
      const rows = await database
        .select({
          id: schema.issues.id,
          number: schema.issues.number,
          year: schema.issues.year,
          label: schema.issues.label,
          publishedAt: schema.issues.publishedAt,
          volumeNumber: schema.volumes.number,
          volumeLabel: schema.volumes.label,
          articleCount: sql<number>`(
            select count(*)::int
            from ${schema.issueArticles}
            inner join ${schema.articleVersions}
              on ${schema.articleVersions.id} = ${schema.issueArticles.articleId}
            where ${schema.issueArticles.issueId} = ${schema.issues.id}
              and ${schema.articleVersions.status} = 'published'
          )`,
        })
        .from(schema.issues)
        .innerJoin(schema.journals, eq(schema.journals.id, schema.issues.journalId))
        .innerJoin(
          schema.organizations,
          eq(schema.organizations.id, schema.journals.organizationId),
        )
        .leftJoin(schema.volumes, eq(schema.volumes.id, schema.issues.volumeId))
        .where(
          and(
            eq(schema.issues.status, "published"),
            isNotNull(schema.issues.publishedAt),
            eq(schema.journals.slug, journalSlug),
            eq(schema.organizations.slug, organizationSlug),
            isNotNull(schema.journals.publishedAt),
          ),
        )
        .orderBy(desc(schema.issues.year), desc(schema.issues.number));

      return rows
        .filter((row) => row.publishedAt !== null)
        .map((row) => ({
          id: row.id,
          number: row.number,
          year: row.year,
          label: row.label,
          publishedAt: row.publishedAt as Date,
          volumeNumber: row.volumeNumber,
          volumeLabel: row.volumeLabel,
          articleCount: row.articleCount,
        }));
    },
  };
}
