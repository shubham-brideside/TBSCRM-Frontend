export interface Stage {
  id: number;
  pipelineId: number;
  name: string;
  order: number;
  probability?: number | null;
  color?: string | null;
  active: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface PipelineOrganization {
  id: number;
  name: string;
}

export interface PipelineTeam {
  id: number;
  name: string;
}

export interface Pipeline {
  id: number;
  name: string;
  category?: string | null;
  teamId?: number | null;
  team?: PipelineTeam | null;
  organization?: PipelineOrganization | null;
  isDeleted?: boolean;
  stages: Stage[];
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface StageRequest {
  name: string;
  order?: number;
  active?: boolean;
  probability?: number | null;
}

export interface StageUpdateRequest {
  name?: string;
  order?: number;
  active?: boolean;
  probability?: number | null;
}

export interface StageOrderRequest {
  orderedStageIds: number[];
}

export interface PipelineRequest {
  name: string;
  category?: string | null;
  teamId?: number | null;
  organizationId?: number | null;
}

export interface PipelineUpdateRequest {
  name?: string;
  category?: string | null;
  teamId?: number | null;
  organizationId?: number | null;
  deleted?: boolean;
}
