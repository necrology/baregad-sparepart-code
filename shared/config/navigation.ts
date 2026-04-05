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
  { href: "/katalog?sort=promo", label: "Promo" },
] as const;

export const adminNavigation = [
  { href: "/admin", label: "Dashboard", roles: ["admin", "staff"] },
  {
    href: "/admin/produk",
    label: "Produk",
    roles: ["admin"],
    levelCodes: ["admin", "admin-baregad"],
  },
  { href: "/admin/pesanan", label: "Pesanan", roles: ["admin"] },
  { href: "/admin/parameter-aplikasi", label: "Parameter", roles: ["admin"] },
  {
    href: "/admin/ulasan",
    label: "Ulasan",
    roles: ["admin"],
    levelCodes: ["admin", "admin-baregad"],
  },
  { href: "/admin/pengguna", label: "User", roles: ["admin"] },
  { href: "/admin/level-user", label: "Level", roles: ["admin"] },
] as const satisfies readonly AdminNavigationItem[];
