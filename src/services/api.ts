import axios from 'axios';
import {
  type Person,
  type PersonSummary,
  type FilterMeta,
  type PersonFilters,
  type PageResponse,
  type PersonFilterCondition,
  type SavedPersonFilter,
} from '../types/person';
import { clearAuthSession, getStoredToken } from '../utils/authToken';

// Use relative path to go through Vite proxy (configured in vite.config.ts)
const API_BASE_URL = '/api/persons';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  paramsSerializer: {
    indexes: null, // Don't use array notation for params
  },
});

// Attach Authorization header for protected endpoints
api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    (config.headers = config.headers || {}).Authorization = `Bearer ${token}`;
  }
  return config;
});

// Basic 401 handler (no redirect logic; backend may provide refresh endpoints)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      console.warn('Unauthorized (401) when calling persons API. Clearing session.');
      clearAuthSession();
    }
    return Promise.reject(error);
  },
);

export const personsApi = {
  // List persons with filters
  list: async (filters: PersonFilters = {}): Promise<PageResponse<Person>> => {
    const params: Record<string, string> = {};
    if (filters.q) params.q = filters.q;
    if (filters.category) params.category = filters.category;
    if (filters.organization) params.organization = filters.organization;
    if (filters.manager) params.manager = filters.manager;
    if (filters.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters.dateTo) params.dateTo = filters.dateTo;
    if (filters.weddingVenue) params.weddingVenue = filters.weddingVenue;
    if (filters.weddingDate) params.weddingDate = filters.weddingDate;
    if (filters.page !== undefined) params.page = filters.page.toString();
    if (filters.size !== undefined) params.size = filters.size.toString();
    if (filters.sort) params.sort = filters.sort;

    try {
      const fullUrl = `${API_BASE_URL}?${new URLSearchParams(params).toString()}`;
      console.log('Fetching persons from:', fullUrl);
      const response = await api.get<PageResponse<Person>>('', { params });
      console.log('Persons response received:', response.status);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching persons:', error);
      console.error('Request URL:', error.config?.url);
      console.error('Full URL:', error.config?.baseURL + error.config?.url);
      throw error;
    }
  },

  // Get person by ID
  get: async (id: number): Promise<Person> => {
    const response = await api.get<Person>(`/${id}`);
    return response.data;
  },

  // Get person summary (with deals count)
  getSummary: async (id: number): Promise<PersonSummary> => {
    const response = await api.get<PersonSummary>(`/${id}/summary`);
    return response.data;
  },

  // Create person
  create: async (person: Partial<Person>): Promise<Person> => {
    const response = await api.post<Person>('', person);
    return response.data;
  },

  // Update person
  update: async (id: number, person: Partial<Person>): Promise<Person> => {
    const response = await api.put<Person>(`/${id}`, person);
    return response.data;
  },

  // Delete person
  delete: async (id: number): Promise<void> => {
    await api.delete(`/${id}`);
  },

  // Bulk delete
  bulkDelete: async (ids: number[]): Promise<number> => {
    const params = new URLSearchParams();
    ids.forEach(id => params.append('ids', id.toString()));
    const response = await api.delete<number>(`?${params.toString()}`);
    return response.data;
  },

  // Merge persons
  merge: async (targetId: number, duplicateIds: number[]): Promise<Person> => {
    const response = await api.post<Person>(`/${targetId}/merge`, { duplicateIds });
    return response.data;
  },

  // Get filter metadata
  getFilters: async (): Promise<FilterMeta> => {
    const response = await api.get<FilterMeta>('/filters');
    return response.data;
  },

  // Saved filters
  listCustomFilters: async (): Promise<SavedPersonFilter[]> => {
    const response = await api.get<Record<string, PersonFilterCondition[]>>('/custom-filters');
    const map = response.data || {};
    return Object.entries(map).map(([name, conditions]) => ({ name, conditions: conditions ?? [] }));
  },

  saveCustomFilter: async (name: string, conditions: PersonFilterCondition[]): Promise<void> => {
    await api.post<void>('/custom-filters', {
      name,
      conditions,
    });
  },

  deleteCustomFilter: async (name: string): Promise<void> => {
    await api.delete<void>(`/custom-filters/${encodeURIComponent(name)}`);
  },

  applyCustomFilter: async (
    conditions: PersonFilterCondition[],
    pagination: Pick<PersonFilters, 'page' | 'size' | 'sort'> = {},
  ): Promise<PageResponse<Person>> => {
    const response = await api.post<PageResponse<Person>>('/apply-filter', {
      conditions,
    }, {
      params: {
        page: pagination.page,
        size: pagination.size,
        sort: pagination.sort,
      },
    });
    return response.data;
  },

  // Get managers by category
  getManagersByCategory: async (category?: string): Promise<string[]> => {
    const params = category ? `?category=${encodeURIComponent(category)}` : '';
    const response = await api.get<string[]>(`/managers${params}`);
    return response.data;
  },
};

