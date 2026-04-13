type AdminNavigationRole = "admin" | "staff";

type AdminNavigationItem = {
  href: string;
  label: string;
  roles: readonly AdminNavigationRole[];
  levelCodes?: readonly string[];
};

export const storefrontNavigation = [
  { href: "/", label: "Beranda" },
  { href: "/katalog", label: "Katalog" },
  { href: "/katalog?sort=latest", label: "Terbaru" },
] as const;

export const adminNavigation = [
  { href: "/admin", label: "Ringkasan", roles: ["admin", "staff"] },
  {
    href: "/admin/produk",
    label: "Barang",
    roles: ["admin"],
    levelCodes: ["admin", "admin-baregad"],
  },
  { href: "/admin/pesanan", label: "Pesanan", roles: ["admin"] },
  { href: "/admin/parameter-aplikasi", label: "Pengaturan", roles: ["admin"] },
  {
    href: "/admin/ulasan",
    label: "Ulasan",
    roles: ["admin"],
    levelCodes: ["admin", "admin-baregad"],
  },
  { href: "/admin/pengguna", label: "Akun", roles: ["admin"] },
  { href: "/admin/level-user", label: "Hak Akses", roles: ["admin"] },
] as const satisfies readonly AdminNavigationItem[];
