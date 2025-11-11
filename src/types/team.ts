export interface TeamUser {
  id: number;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  role?: string | null;
  displayName?: string | null;
}

export interface Team {
  id: number;
  name: string;
  manager?: TeamUser | null;
  members: TeamUser[];
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface TeamRequest {
  name: string;
  managerId?: number | null;
  memberIds?: number[];
}

export interface TeamUpdateRequest extends TeamRequest {
  clearManager?: boolean;
}

export type TeamManagerOption = TeamUser;
export type TeamMemberOption = TeamUser;

