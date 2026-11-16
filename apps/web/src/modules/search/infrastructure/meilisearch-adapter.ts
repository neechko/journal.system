import { Meilisearch } from "meilisearch";
import "server-only";
import { AppError } from "@/modules/shared/app-error";
import type {
  SearchIndex,
  SearchDocumentJournal,
  SearchDocumentArticle,
  SearchResult,
  SearchOptions,
} from "../application/ports";

const MEILI_HOST = process.env.MEILISEARCH_HOST ?? "http://localhost:7700";
const MEILI_API_KEY = process.env.MEILISEARCH_API_KEY ?? "";

const JOURNALS_INDEX = "journals";
const ARTICLES_INDEX = "articles";

export class MeilisearchAdapter implements SearchIndex {
  private client: Meilisearch;

  constructor() {
    this.client = new Meilisearch({
      host: MEILI_HOST,
      apiKey: MEILI_API_KEY,
    });
  }

  async initialize(): Promise<void> {
    try {
      // Create journals index
      await this.client.createIndex(JOURNALS_INDEX, { primaryKey: "id" });
      await this.client.index(JOURNALS_INDEX).updateSettings({
        searchableAttributes: [
          "title",
          "description",
          "aimsScope",
          "organizationName",
          "organizationSlug",
        ],
        filterableAttributes: [
          "organizationId",
          "organizationSlug",
          "publishedAt",
        ],
        sortableAttributes: ["publishedAt", "title"],
        rankingRules: [
          "words",
          "typo",
          "proximity",
          "attribute",
          "sort",
          "exactness",
        ],
      });

      // Create articles index
      await this.client.createIndex(ARTICLES_INDEX, { primaryKey: "id" });
      await this.client.index(ARTICLES_INDEX).updateSettings({
        searchableAttributes: [
          "title",
          "abstract",
          "keywords",
          "authors",
          "journalTitle",
          "journalSlug",
        ],
        filterableAttributes: [
          "journalId",
          "journalSlug",
          "organizationId",
          "organizationSlug",
          "publishedAt",
          "status",
        ],
        sortableAttributes: ["publishedAt", "title"],
        rankingRules: [
          "words",
          "typo",
          "proximity",
          "attribute",
          "sort",
          "exactness",
        ],
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("index_already_exists")
      ) {
        return;
      }
      throw new AppError("SEARCH_INIT_FAILED", "Failed to initialize search indexes");
    }
  }

  async indexJournal(document: SearchDocumentJournal): Promise<void> {
    await this.client.index(JOURNALS_INDEX).addDocuments([document]);
  }

  async indexArticle(document: SearchDocumentArticle): Promise<void> {
    await this.client.index(ARTICLES_INDEX).addDocuments([document]);
  }

  async deleteJournal(journalId: string): Promise<void> {
    await this.client.index(JOURNALS_INDEX).deleteDocument(journalId);
  }

  async deleteArticle(articleId: string): Promise<void> {
    await this.client.index(ARTICLES_INDEX).deleteDocument(articleId);
  }

  async searchJournals(
    query: string,
    options: SearchOptions = {}
  ): Promise<SearchResult<SearchDocumentJournal>> {
    const { offset = 0, limit = 20, filters, sort } = options;

    const searchParams: Record<string, unknown> = {
      q: query,
      offset,
      limit,
      attributesToRetrieve: [
        "id",
        "title",
        "slug",
        "description",
        "organizationName",
        "organizationSlug",
        "publishedAt",
      ],
    };

    if (filters) {
      searchParams.filter = filters;
    }

    if (sort) {
      searchParams.sort = [sort];
    }

    const result = await this.client.index(JOURNALS_INDEX).search<SearchDocumentJournal>(query, searchParams);

    return {
      hits: result.hits,
      totalHits: result.estimatedTotalHits ?? result.hits.length,
      offset,
      limit,
      hasNextPage: offset + limit < (result.estimatedTotalHits ?? result.hits.length),
    };
  }

  async searchArticles(
    query: string,
    options: SearchOptions = {}
  ): Promise<SearchResult<SearchDocumentArticle>> {
    const { offset = 0, limit = 20, filters, sort } = options;

    const searchParams: Record<string, unknown> = {
      q: query,
      offset,
      limit,
      attributesToRetrieve: [
        "id",
        "title",
        "abstract",
        "keywords",
        "authors",
        "journalTitle",
        "journalSlug",
        "organizationSlug",
        "publishedAt",
        "doi",
      ],
    };

    if (filters) {
      searchParams.filter = filters;
    }

    if (sort) {
      searchParams.sort = [sort];
    }

    const result = await this.client.index(ARTICLES_INDEX).search<SearchDocumentArticle>(query, searchParams);

    return {
      hits: result.hits,
      totalHits: result.estimatedTotalHits ?? result.hits.length,
      offset,
      limit,
      hasNextPage: offset + limit < (result.estimatedTotalHits ?? result.hits.length),
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.client.health();
      return true;
    } catch {
      return false;
    }
  }
}

export function createSearchIndex(): SearchIndex {
  return new MeilisearchAdapter();
}