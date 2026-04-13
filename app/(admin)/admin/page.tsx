"use client";

import { useCallback, useEffect, useState } from "react";
import { getCatalog } from "@/entities/product/api/product-service";
import { createSparepartCategoryShare } from "@/entities/product/model/sparepart-category";
import type { Product } from "@/entities/product/model/types";
import {
  getAdminOverview,
  type AdminOverview,
} from "@/shared/api/admin-overview-service";
import { useAdminPageAccess } from "@/shared/auth/admin-page-access";
import { formatRupiah } from "@/shared/lib/currency";
import { formatDate } from "@/shared/lib/date";

const toneMap = {
  brand: "bg-brand-soft text-brand-deep",
  accent: "bg-accent-soft text-accent",
  warning: "bg-[#d9e6f4] text-[#2b527c]",
  ink: "bg-[#e9f1f9] text-ink",
} as const;

export default function AdminDashboardPage() {
  const { token, isAllowed, isReady } = useAdminPageAccess();
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [catalogItems, setCatalogItems] = useState<Product[]>([]);

  const loadDashboard = useCallback(async () => {
    if (!token?.trim()) {
      return;
    }

    const [nextOverview, catalog] = await Promise.all([
      getAdminOverview(token),
      getCatalog({ sort: "popular" }),
    ]);

    setOverview(nextOverview);
    setCatalogItems(catalog.items);
  }, [token]);

  useEffect(() => {
    if (!isAllowed) {
      return;
    }

    const loadTimer = window.setTimeout(() => {
      void loadDashboard();
    }, 0);

    return () => {
      window.clearTimeout(loadTimer);
    };
  }, [isAllowed, loadDashboard]);

  if (!isReady || !isAllowed || !overview) {
    return (
      <div className="surface-panel rounded-[1.8rem] p-6 text-sm text-ink-soft">
        Sedang menyiapkan ringkasan toko...
      </div>
    );
  }

  const categoryShare = createSparepartCategoryShare(catalogItems);

  return (
    <div className="space-y-3 sm:space-y-4">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {overview.metrics.map((metric) => (
          <article
            key={metric.label}
            className="surface-panel rounded-[2rem] p-3.5"
          >
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${toneMap[metric.tone]}`}
            >
              {metric.label}
            </span>
            <p className="mt-4 font-display text-3xl font-semibold text-ink">
              {metric.value}
            </p>
            <p className="mt-3 text-sm leading-7 text-ink-soft">
              {metric.note}
            </p>
          </article>
        ))}
      </section>

      <section className="grid gap-3.5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="surface-panel rounded-[2rem] p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted">
                Pesanan terbaru
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold text-ink">
                Pantau pesanan yang baru masuk
              </h2>
            </div>
            <span className="rounded-full border border-line bg-white/70 px-4 py-2 text-sm font-semibold text-ink-soft">
              {overview.recentOrders.length} pesanan terlihat
            </span>
          </div>
          <div className="mt-4 space-y-2.5">
            {overview.recentOrders.map((order) => (
              <div
                key={order.id}
                className="grid gap-3 rounded-[1.5rem] border border-line bg-white/65 p-4 lg:grid-cols-[1.2fr_0.9fr_0.7fr_auto]"
              >
                <div>
                  <p className="text-sm font-semibold text-ink">{order.id}</p>
                  <p className="mt-1 text-sm text-ink-soft">
                    {order.customerName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted">Motor</p>
                  <p className="mt-1 text-sm font-semibold text-ink">
                    {order.vehicle}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted">Status</p>
                  <p className="mt-1 text-sm font-semibold text-ink">
                    {order.status}
                  </p>
                </div>
                <div className="text-left lg:text-right">
                  <p className="text-sm font-semibold text-ink">
                    {formatRupiah(order.total)}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {formatDate(order.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3.5">
          <div className="surface-panel rounded-[2rem] p-4">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted">
              Perhatian stok
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-ink">
              Produk stok tipis
            </h2>
            <div className="mt-4 space-y-2.5">
              {overview.lowStockProducts.map((product) => (
                <div
                  key={product.id}
                  className="rounded-[1.4rem] border border-line bg-white/65 p-4"
                >
                  <p className="font-semibold text-ink">{product.name}</p>
                  <div className="mt-2 flex items-center justify-between text-sm text-ink-soft">
                    <span>{product.brand}</span>
                    <span>{product.stock} unit</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="surface-panel rounded-[2rem] p-4">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted">
              Distribusi kategori
            </p>
            <div className="mt-4 space-y-2.5">
              {categoryShare.map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-ink">{item.label}</span>
                    <span className="text-ink-soft">{item.total} SKU</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-white/70">
                    <div
                      className="h-full rounded-full bg-brand"
                      style={{ width: `${Math.max(14, item.total * 12)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
