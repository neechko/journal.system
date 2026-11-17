import { sanitizeArticleHtml, sanitizePlainText } from "./sanitize";
import type {
  JournalLookup,
  PublicationsRepository,
  PublishedArticleLookup,
  PublishedIssueLookup,
} from "./ports";

export interface PublicArticleView {
  id: string;
  title: string;
  abstract: string | null;
  keywords: string[];
  authors: {
    name: string;
    affiliation: string | null;
    orcid: string | null;
    email: string | null;
    isCorresponding: boolean;
    order: number;
  }[];
  doi: string | null;
  htmlContent: string | null;
  hasPdf: boolean;
  pageStart: number | null;
  pageEnd: number | null;
  articleType: string | null;
  publishedAt: Date;
  journal: {
    id: string;
    title: string;
    slug: string;
    organizationName: string;
    organizationSlug: string;
  };
  issue: { id: string; number: number; year: number; label: string | null } | null;
  volume: { id: string; number: number; year: number; label: string | null } | null;
}

export interface PublicIssueArticleView {
  id: string;
  title: string;
  abstract: string | null;
  authors: PublicArticleView["authors"];
  doi: string | null;
  hasPdf: boolean;
  pageStart: number | null;
  pageEnd: number | null;
  order: number;
  articleType: string | null;
}

export interface PublicIssueView {
  id: string;
  number: number;
  year: number;
  label: string | null;
  description: string | null;
  publishedAt: Date;
  journal: PublicArticleView["journal"];
  volume: PublicArticleView["volume"];
  articles: PublicIssueArticleView[];
}

/**
 * Public article read. Applies the sanitizer so callers never receive raw
 * stored HTML, and replaces the internal PDF file id with a boolean flag the
 * presentation layer turns into the public download route.
 */
export async function getPublishedArticle(
  repository: PublicationsRepository,
  lookup: PublishedArticleLookup,
): Promise<PublicArticleView | null> {
  const article = await repository.findPublishedArticle(lookup);
  if (!article) {
    return null;
  }

  return {
    id: article.id,
    title: sanitizePlainText(article.title),
    abstract: article.abstract ? sanitizePlainText(article.abstract) : null,
    keywords: article.keywords.map(sanitizePlainText),
    authors: article.authors.map((author) => ({
      ...author,
      name: sanitizePlainText(author.name),
      affiliation: author.affiliation ? sanitizePlainText(author.affiliation) : null,
    })),
    doi: article.doi,
    htmlContent: article.htmlContent ? sanitizeArticleHtml(article.htmlContent) : null,
    hasPdf: Boolean(article.pdfFileId),
    pageStart: article.pageStart,
    pageEnd: article.pageEnd,
    articleType: article.articleType,
    publishedAt: article.publishedAt,
    journal: article.journal,
    issue: article.issue,
    volume: article.volume,
  };
}

/**
 * Public issue read. Article titles and abstracts are sanitised because they
 * are rendered in a list before the reader opens the article page.
 */
export async function getPublishedIssue(
  repository: PublicationsRepository,
  lookup: PublishedIssueLookup,
): Promise<PublicIssueView | null> {
  const issue = await repository.findPublishedIssue(lookup);
  if (!issue) {
    return null;
  }

  return {
    id: issue.id,
    number: issue.number,
    year: issue.year,
    label: issue.label ? sanitizePlainText(issue.label) : null,
    description: issue.description ? sanitizePlainText(issue.description) : null,
    publishedAt: issue.publishedAt,
    journal: issue.journal,
    volume: issue.volume,
    articles: issue.articles.map((article) => ({
      id: article.id,
      title: sanitizePlainText(article.title),
      abstract: article.abstract ? sanitizePlainText(article.abstract) : null,
      authors: article.authors.map((author) => ({
        ...author,
        name: sanitizePlainText(author.name),
      })),
      doi: article.doi,
      hasPdf: Boolean(article.pdfFileId),
      pageStart: article.pageStart,
      pageEnd: article.pageEnd,
      order: article.order,
      articleType: article.articleType,
    })),
  };
}

export interface PublicArticleSummaryView {
  id: string;
  title: string;
  authors: PublicArticleView["authors"];
  doi: string | null;
  publishedAt: Date;
  articleType: string | null;
  pageStart: number | null;
  pageEnd: number | null;
  issueId: string | null;
  issueNumber: number | null;
  issueYear: number | null;
  volumeNumber: number | null;
}

export async function listPublishedArticles(
  repository: PublicationsRepository,
  lookup: JournalLookup,
  limit = 10,
): Promise<PublicArticleSummaryView[]> {
  const articles = await repository.listPublishedArticles(lookup, limit);

  return articles.map((article) => ({
    ...article,
    title: sanitizePlainText(article.title),
    authors: article.authors.map((author) => ({
      ...author,
      name: sanitizePlainText(author.name),
    })),
  }));
}

export interface PublicIssueSummaryView {
  id: string;
  number: number;
  year: number;
  label: string | null;
  publishedAt: Date;
  volumeNumber: number | null;
  volumeLabel: string | null;
  articleCount: number;
}

export async function listPublishedIssues(
  repository: PublicationsRepository,
  lookup: JournalLookup,
): Promise<PublicIssueSummaryView[]> {
  const issues = await repository.listPublishedIssues(lookup);

  return issues.map((issue) => ({
    ...issue,
    label: issue.label ? sanitizePlainText(issue.label) : null,
    volumeLabel: issue.volumeLabel ? sanitizePlainText(issue.volumeLabel) : null,
  }));
}
