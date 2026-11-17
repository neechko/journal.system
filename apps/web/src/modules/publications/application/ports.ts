/**
 * Public reading contracts.
 *
 * Everything in this module is reachable by anonymous visitors, so the shapes
 * here are deliberately narrower than the editorial/production DTOs: no
 * internal ids beyond the ones used in public URLs, no workflow state, no
 * storage keys.
 */

export interface PublishedArticleAuthor {
  name: string;
  affiliation: string | null;
  orcid: string | null;
  email: string | null;
  isCorresponding: boolean;
  order: number;
}

export interface PublishedJournalReference {
  id: string;
  title: string;
  slug: string;
  organizationName: string;
  organizationSlug: string;
}

export interface PublishedIssueReference {
  id: string;
  number: number;
  year: number;
  label: string | null;
}

export interface PublishedVolumeReference {
  id: string;
  number: number;
  year: number;
  label: string | null;
}

export interface PublishedArticle {
  id: string;
  title: string;
  abstract: string | null;
  keywords: string[];
  authors: PublishedArticleAuthor[];
  doi: string | null;
  pdfFileId: string | null;
  htmlContent: string | null;
  pageStart: number | null;
  pageEnd: number | null;
  articleType: string | null;
  publishedAt: Date;
  journal: PublishedJournalReference;
  issue: PublishedIssueReference | null;
  volume: PublishedVolumeReference | null;
}

export interface PublishedIssueArticle {
  id: string;
  title: string;
  abstract: string | null;
  authors: PublishedArticleAuthor[];
  doi: string | null;
  pdfFileId: string | null;
  pageStart: number | null;
  pageEnd: number | null;
  order: number;
  articleType: string | null;
}

export interface PublishedIssue {
  id: string;
  number: number;
  year: number;
  label: string | null;
  description: string | null;
  publishedAt: Date;
  journal: PublishedJournalReference;
  volume: PublishedVolumeReference | null;
  articles: PublishedIssueArticle[];
}

export interface PublishedArticleLookup {
  organizationSlug: string;
  journalSlug: string;
  articleId: string;
}

export interface PublishedIssueLookup {
  organizationSlug: string;
  journalSlug: string;
  issueId: string;
}

export interface JournalLookup {
  organizationSlug: string;
  journalSlug: string;
}

export interface PublishedArticleSummary {
  id: string;
  title: string;
  authors: PublishedArticleAuthor[];
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

export interface PublishedIssueSummary {
  id: string;
  number: number;
  year: number;
  label: string | null;
  publishedAt: Date;
  volumeNumber: number | null;
  volumeLabel: string | null;
  articleCount: number;
}

export interface PublicationsRepository {
  findPublishedArticle(
    lookup: PublishedArticleLookup,
  ): Promise<PublishedArticle | null>;

  findPublishedIssue(
    lookup: PublishedIssueLookup,
  ): Promise<PublishedIssue | null>;

  listPublishedArticles(
    lookup: JournalLookup,
    limit: number,
  ): Promise<PublishedArticleSummary[]>;

  listPublishedIssues(
    lookup: JournalLookup,
  ): Promise<PublishedIssueSummary[]>;
}
