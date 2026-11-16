import { randomUUID } from "node:crypto";

export type ArticleVersionStatus =
  | "draft"
  | "in_copyedit"
  | "in_typeset"
  | "proof_ready"
  | "proof_approved"
  | "published"
  | "withdrawn";

export interface ArticleVersion {
  id: string;
  submissionId: string;
  version: number;
  status: ArticleVersionStatus;
  title: string;
  abstract: string | null;
  keywords: string[];
  authors: ArticleAuthor[];
  doi: string | null;
  manuscriptFileId: string | null;
  xmlContent: string | null;
  pdfFileId: string | null;
  htmlContent: string | null;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
  publishedBy: string | null;
}

export interface ArticleAuthor {
  id: string;
  userId: string | null;
  name: string;
  email: string | null;
  affiliation: string | null;
  orcid: string | null;
  isCorresponding: boolean;
  order: number;
}

export function createArticleVersion(
  submissionId: string,
  version: number,
  title: string,
  abstract: string | null,
  keywords: string[],
  authors: ArticleAuthor[]
): ArticleVersion {
  const now = new Date();
  return {
    id: randomUUID(),
    submissionId,
    version,
    status: "draft",
    title,
    abstract,
    keywords,
    authors,
    doi: null,
    manuscriptFileId: null,
    xmlContent: null,
    pdfFileId: null,
    htmlContent: null,
    createdAt: now,
    updatedAt: now,
    publishedAt: null,
    publishedBy: null,
  };
}

export function updateArticleVersion(
  article: ArticleVersion,
  updates: Partial<Pick<ArticleVersion, "title" | "abstract" | "keywords" | "authors">>
): ArticleVersion {
  return {
    ...article,
    ...updates,
    updatedAt: new Date(),
  };
}

export function transitionArticleStatus(
  article: ArticleVersion,
  newStatus: ArticleVersionStatus,
  actorUserId: string | null = null
): ArticleVersion {
  const validTransitions: Record<ArticleVersionStatus, ArticleVersionStatus[]> = {
    draft: ["in_copyedit", "withdrawn"],
    in_copyedit: ["in_typeset", "draft", "withdrawn"],
    in_typeset: ["proof_ready", "in_copyedit", "withdrawn"],
    proof_ready: ["proof_approved", "in_typeset", "withdrawn"],
    proof_approved: ["published", "in_typeset", "withdrawn"],
    published: ["withdrawn"],
    withdrawn: [],
  };

  if (!validTransitions[article.status].includes(newStatus)) {
    throw new Error(`Invalid status transition from ${article.status} to ${newStatus}`);
  }

  return {
    ...article,
    status: newStatus,
    updatedAt: new Date(),
    ...(newStatus === "published" ? { publishedAt: new Date(), publishedBy: actorUserId } : {}),
  };
}

export function assignDoi(article: ArticleVersion, doi: string): ArticleVersion {
  if (article.doi) {
    throw new Error("Article already has a DOI");
  }
  return { ...article, doi, updatedAt: new Date() };
}

export function setManuscriptFile(article: ArticleVersion, fileId: string): ArticleVersion {
  return { ...article, manuscriptFileId: fileId, updatedAt: new Date() };
}

export function setXmlContent(article: ArticleVersion, xml: string): ArticleVersion {
  return { ...article, xmlContent: xml, updatedAt: new Date() };
}

export function setPdfFile(article: ArticleVersion, fileId: string): ArticleVersion {
  return { ...article, pdfFileId: fileId, updatedAt: new Date() };
}

export function setHtmlContent(article: ArticleVersion, html: string): ArticleVersion {
  return { ...article, htmlContent: html, updatedAt: new Date() };
}

export function isArticleReadyForPublication(article: ArticleVersion): boolean {
  return article.status === "proof_approved" && !!article.doi && !!article.pdfFileId;
}

export function canEditArticle(article: ArticleVersion): boolean {
  return article.status !== "published" && article.status !== "withdrawn";
}