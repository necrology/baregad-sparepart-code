export type AppParameterStatus = "active" | "inactive";

export type AppParameter = {
  id: string;
  label: string;
  key: string;
  groupName: string;
  value: string;
  description: string;
  isPublic: boolean;
  status: AppParameterStatus;
  createdAt: string;
  updatedAt: string;
};
