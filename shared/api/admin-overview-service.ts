import type { Order } from "@/entities/order/model/types";
import type { Product } from "@/entities/product/model/types";
import { backendFetchJson } from "@/shared/api/backend-client";
import { getPublicBackendBaseUrl } from "@/shared/config/public-env";

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
        note: "Belum ada data barang yang tampil",
        tone: "brand",
      },
      {
        label: "Pesanan Hari Ini",
        value: "0",
        note: "Belum ada pesanan masuk hari ini",
        tone: "accent",
      },
      {
        label: "Stok Tipis",
        value: "0",
        note: "Belum ada stok yang perlu diperhatikan",
        tone: "warning",
      },
      {
        label: "Omzet",
        value: "Rp 0",
        note: "Ringkasan omzet akan muncul saat pesanan mulai tercatat",
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

export async function getAdminOverview(token: string | null | undefined) {
  const backendEnabled = !!getPublicBackendBaseUrl();

  if (!backendEnabled || !token?.trim()) {
    return buildEmptyOverview(backendEnabled);
  }

  try {
    const response = await backendFetchJson<AdminOverview>("/admin/overview", {
      token,
    });

    return {
      ...response,
      source: "backend" as const,
      backendAvailable: true,
    };
  } catch {
    return buildEmptyOverview(backendEnabled);
  }
}
