import axios from 'axios';
import {
  type Pipeline,
  type PipelineRequest,
  type PipelineUpdateRequest,
  type Stage,
  type StageOrderRequest,
  type StageRequest,
  type StageUpdateRequest,
} from '../types/pipeline';
import { clearAuthSession, getStoredToken } from '../utils/authToken';

const api = axios.create({
  baseURL: '/api/pipelines',
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
      console.warn('Unauthorized (401) when calling pipelines API. Clearing session.');
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

export const pipelinesApi = {
  list: async (params: { active?: boolean; includeStages?: boolean } = {}): Promise<Pipeline[]> => {
    const query = {
      includeStages: true,
      ...params,
    };
    const response = await api.get('', { params: query });
    return unwrap<Pipeline[]>(response.data);
  },

  get: async (pipelineId: number, includeStages = true): Promise<Pipeline> => {
    const response = await api.get(`/${pipelineId}`, {
      params: { includeStages },
    });
    return unwrap<Pipeline>(response.data);
  },

  create: async (payload: PipelineRequest): Promise<Pipeline> => {
    const response = await api.post('', payload);
    return unwrap<Pipeline>(response.data);
  },

  update: async (pipelineId: number, payload: PipelineUpdateRequest): Promise<Pipeline> => {
    const response = await api.patch(`/${pipelineId}`, payload);
    return unwrap<Pipeline>(response.data);
  },

  delete: async (pipelineId: number, hard?: boolean): Promise<void> => {
    await api.delete(`/${pipelineId}`, {
      params: hard ? { hard } : undefined,
    });
  },

  createStage: async (pipelineId: number, payload: StageRequest): Promise<Stage> => {
    const response = await api.post<Stage>(`/${pipelineId}/stages`, payload);
    return unwrap<Stage>(response.data);
  },

  updateStage: async (pipelineId: number, stageId: number, payload: StageUpdateRequest): Promise<Stage> => {
    const response = await api.patch<Stage>(`/${pipelineId}/stages/${stageId}`, payload);
    return unwrap<Stage>(response.data);
  },

  deleteStage: async (pipelineId: number, stageId: number, hard?: boolean): Promise<void> => {
    await api.delete<void>(`/${pipelineId}/stages/${stageId}`, {
      params: hard ? { hard } : undefined,
    });
  },

  reorderStages: async (pipelineId: number, request: StageOrderRequest): Promise<void> => {
    await api.post<void>(`/${pipelineId}/stages/reorder`, request);
  },
};


