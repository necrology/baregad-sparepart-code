export type DashboardUserRole = "admin" | "staff";
export type DashboardUserStatus = "active" | "inactive";

export type DashboardUser = {
  id: string;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  role: DashboardUserRole;
  levelId: string;
  levelName: string;
  levelCode: string;
  status: DashboardUserStatus;
  isWhatsAppAdmin: boolean;
  locked: boolean;
  createdAt: string;
  updatedAt: string;
};

export type StorefrontWhatsAppAdmin = {
  id: string;
  fullName: string;
  phone: string;
  levelName: string;
  levelCode: string;
  whatsAppUrl: string;
};
