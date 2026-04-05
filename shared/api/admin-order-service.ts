import "server-only";
import type { Order } from "@/entities/order/model/types";
import { backendFetchJson } from "@/shared/api/backend-client";
import { getAdminAuthorizationHeaders } from "@/shared/auth/admin-auth";
import { getBackendRuntimeConfig } from "@/shared/config/env";

export async function getAdminOrders() {
  const config = getBackendRuntimeConfig();
  const headers = await getAdminAuthorizationHeaders();

  if (!config.enabled || !headers) {
    return [] as Order[];
  }

  try {
    return await backendFetchJson<Order[]>("/admin/orders", {
      headers,
    });
  } catch {
    return [] as Order[];
  }
}
