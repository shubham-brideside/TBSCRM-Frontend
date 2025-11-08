import axios from 'axios';
import type { Organization, OrganizationOwner, OrganizationRequest } from '../types/organization';
import { clearAuthSession, getStoredToken } from '../utils/authToken';

const api = axios.create({
  baseURL: '/api/organizations',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    (config.headers = config.headers || {}).Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      clearAuthSession();
    }
    return Promise.reject(error);
  },
);

const unwrap = <T,>(payload: any): T => {
  if (payload && typeof payload === 'object' && 'data' in payload && payload.data !== undefined) {
    return payload.data as T;
  }
  return payload as T;
};

export const organizationsApi = {
  list: async (): Promise<Organization[]> => {
    const response = await api.get('');
    return unwrap<Organization[]>(response.data);
  },

  listOwners: async (): Promise<OrganizationOwner[]> => {
    const response = await api.get('/owners');
    return unwrap<OrganizationOwner[]>(response.data);
  },

  get: async (id: number): Promise<Organization> => {
    const response = await api.get(`/${id}`);
    return unwrap<Organization>(response.data);
  },

  create: async (payload: OrganizationRequest): Promise<Organization> => {
    const response = await api.post('', payload);
    return unwrap<Organization>(response.data);
  },

  update: async (id: number, payload: OrganizationRequest): Promise<Organization> => {
    const response = await api.put(`/${id}`, payload);
    return unwrap<Organization>(response.data);
  },

  remove: async (id: number): Promise<void> => {
    await api.delete(`/${id}`);
  },
};


