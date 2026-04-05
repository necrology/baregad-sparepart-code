export type UserLevelStatus = "active" | "inactive";

export type UserLevel = {
  id: string;
  name: string;
  code: string;
  description: string;
  status: UserLevelStatus;
  createdAt: string;
  updatedAt: string;
};
