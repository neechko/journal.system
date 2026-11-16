export namespace SearchDocument {
  export interface Journal {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    aimsScope: string | null;
    authorGuidelines: string | null;
    organizationId: string;
    organizationName: string;
    organizationSlug: string;
    publishedAt: string;
  }

  export interface Article {
    id: string;
    title: string;
    abstract: string | null;
    keywords: string[];
    authors: string[];
    journalId: string;
    journalTitle: string;
    journalSlug: string;
    organizationId: string;
    organizationSlug: string;
    publishedAt: string;
    doi: string | null;
    status: string;
  }
}

export interface SearchResult<T> {
  hits: T[];
  totalHits: number;
  offset: number;
  limit: number;
  hasNextPage: boolean;
}

export interface SearchOptions {
  offset?: number;
  limit?: number;
  filters?: string;
  sort?: string;
}

export interface SearchIndex {
  initialize(): Promise<void>;
  indexJournal(document: SearchDocument.Journal): Promise<void>;
  indexArticle(document: SearchDocument.Article): Promise<void>;
  deleteJournal(journalId: string): Promise<void>;
  deleteArticle(articleId: string): Promise<void>;
  searchJournals(query: string, options?: SearchOptions): Promise<SearchResult<SearchDocument.Journal>>;
  searchArticles(query: string, options?: SearchOptions): Promise<SearchResult<SearchDocument.Article>>;
  healthCheck(): Promise<boolean>;
}