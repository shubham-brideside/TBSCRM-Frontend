export interface Stage {
  id: number;
  pipelineId: number;
  name: string;
  order: number;
  probability?: number | null;
  color?: string | null;
  active: boolean;
  rottenFlag?: boolean | null;
  rottenDays?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface Pipeline {
  id: number;
  name: string;
  category?: string | null;
  team?: string | null;
  organization?: string | null;
  description?: string | null;
  active: boolean;
  dealProbabilityEnabled?: boolean | null;
  displayOrder?: number | null;
  ownerUserId?: number | null;
  ownerName?: string | null;
  stages: Stage[];
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface StageRequest {
  name: string;
  order?: number;
  active?: boolean;
  probability?: number | null;
  rottenFlag?: boolean;
  rottenDays?: number;
}

export interface StageUpdateRequest {
  name?: string;
  order?: number;
  active?: boolean;
  probability?: number | null;
  rottenFlag?: boolean;
  rottenDays?: number;
}

export interface StageOrderRequest {
  orderedStageIds: number[];
}

export interface PipelineRequest {
  name: string;
  category?: string | null;
  team?: string | null;
  organization?: string | null;
  description?: string | null;
  active?: boolean;
  dealProbabilityEnabled?: boolean;
  displayOrder?: number;
  ownerUserId?: number;
}

export interface PipelineUpdateRequest extends Partial<PipelineRequest> {}



