import "server-only";
import type { Order } from "@/entities/order/model/types";
import type { Product } from "@/entities/product/model/types";
import { backendFetchJson } from "@/shared/api/backend-client";
import { getAdminAuthorizationHeaders } from "@/shared/auth/admin-auth";
import { getBackendRuntimeConfig } from "@/shared/config/env";

export type AdminOverview = {
  metrics: Array<{
    label: string;
    value: string;
    note: string;
    tone: "brand" | "accent" | "warning" | "ink";
  }>;
  lowStockProducts: Product[];
  recentOrders: Order[];
  categoryShare: Array<{
    label: string;
    total: number;
  }>;
  source: "mock" | "backend";
  backendAvailable: boolean;
};

function buildEmptyOverview(backendAvailable: boolean): AdminOverview {
  return {
    metrics: [
      {
        label: "Produk Aktif",
        value: "0",
        note: "Menunggu data produk dari backend",
        tone: "brand",
      },
      {
        label: "Order Hari Ini",
        value: "0",
        note: "Belum ada pesanan yang terbaca",
        tone: "accent",
      },
      {
        label: "Perlu Restock",
        value: "0",
        note: "Belum ada produk stok tipis",
        tone: "warning",
      },
      {
        label: "Gross Revenue",
        value: "Rp 0",
        note: "Ringkasan omzet akan tampil setelah backend aktif",
        tone: "ink",
      },
    ],
    lowStockProducts: [],
    recentOrders: [],
    categoryShare: [],
    source: "backend",
    backendAvailable,
  };
}

export async function getAdminOverview() {
  const config = getBackendRuntimeConfig();
  const headers = await getAdminAuthorizationHeaders();

  if (!config.enabled || !headers) {
    return buildEmptyOverview(config.enabled);
  }

  try {
    const response = await backendFetchJson<AdminOverview>("/admin/overview", {
      headers,
    });

    return {
      ...response,
      source: "backend" as const,
      backendAvailable: true,
    };
  } catch {
    return buildEmptyOverview(config.enabled);
  }
}
