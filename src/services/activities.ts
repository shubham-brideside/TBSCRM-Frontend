import axios from 'axios';
import { clearAuthSession, getStoredToken } from '../utils/authToken';

const api = axios.create({
  baseURL: '/api/activities',
  headers: { 'Content-Type': 'application/json' },
});

// Attach Authorization header for protected endpoints
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
      console.warn('Unauthorized (401) when calling activities API. Clearing session.');
      clearAuthSession();
    }
    return Promise.reject(error);
  },
);

export type Activity = {
  id: number;
  subject?: string;
  category: 'Activity' | 'Call' | 'Meeting scheduler';
  dealName?: string;
  instagramId?: string;
  phone?: string;
  organization?: string;
  dueDate?: string;
  date?: string;
  startTime?: string;
  assignedUser?: string;
  scheduleBy?: string;
  priority?: string;
  status?: string;
  callType?: string;
  notes?: string;
  personId: number;
  done?: boolean;
};

export type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

export const activitiesApi = {
  list: (params: Partial<{ personId: number; category: string; page: number; size: number }>) =>
    api.get<PageResponse<Activity>>('', { params }).then(r => r.data),
  create: (activity: Partial<Activity>) =>
    api.post<Activity>('', activity).then(r => r.data),
};


