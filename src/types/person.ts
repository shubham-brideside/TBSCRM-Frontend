export interface Person {
  id: number;
  name: string;
  instagramId?: string | null;
  email?: string | null;
  phone?: string | null;
  weddingDate?: string | null;
  venue?: string | null;
  organization?: string | null;
  manager?: string | null;
  category?: string | null;
  source?: string | null;
  createdDate?: string | null;
  eventType?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface PersonSummary {
  person: Person;
  dealsCount: number;
}

export interface FilterMeta {
  categories: string[];
  organizations: string[];
  managers: string[];
  venues: string[];
}

export interface PersonFilters {
  q?: string;
  category?: string;
  organization?: string;
  manager?: string;
  dateFrom?: string;
  dateTo?: string;
  weddingVenue?: string;
  weddingDate?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface PersonFilterCondition {
  field: string;
  operator: string;
  value: string;
}

export interface SavedPersonFilter {
  name: string;
  conditions: PersonFilterCondition[];
}

