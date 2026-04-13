import type { Order } from "@/entities/order/model/types";
import { backendFetchJson } from "@/shared/api/backend-client";
import { getPublicBackendBaseUrl } from "@/shared/config/public-env";

export async function getAdminOrders(token: string | null | undefined) {
  if (!getPublicBackendBaseUrl() || !token?.trim()) {
    return [] as Order[];
  }

  try {
    return await backendFetchJson<Order[]>("/admin/orders", {
      token,
    });
  } catch {
    return [] as Order[];
  }
}
