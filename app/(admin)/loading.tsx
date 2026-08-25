import { AppRouteLoading } from "@/shared/ui/app-loading";

export default function AdminLoading() {
  return (
    <AppRouteLoading
      eyebrow="Membuka dashboard"
      title="Sedang menyiapkan area admin"
      description="Ringkasan toko, data katalog, dan kontrol pengelolaan sedang dimuat."
    />
  );
}
