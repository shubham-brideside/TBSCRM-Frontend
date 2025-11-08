export interface OrganizationOwner {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  displayName: string;
}

export interface Organization {
  id: number;
  name: string;
  owner?: OrganizationOwner | null;
  address?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface OrganizationRequest {
  name: string;
  ownerId?: number | null;
  address?: string | null;
}


