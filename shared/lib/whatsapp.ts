import { formatRupiah } from "@/shared/lib/currency";

export function normalizeWhatsAppPhone(value: string) {
  const digits = value.replace(/\D/g, "");

  if (digits.length < 10) {
    return "";
  }

  if (digits.startsWith("0")) {
    return `62${digits.slice(1)}`;
  }

  if (digits.startsWith("62")) {
    return digits;
  }

  return digits;
}

export function buildWhatsAppUrl(phone: string, message?: string) {
  const normalizedPhone = normalizeWhatsAppPhone(phone);

  if (!normalizedPhone) {
    return "";
  }

  if (!message?.trim()) {
    return `https://wa.me/${normalizedPhone}`;
  }

  const params = new URLSearchParams({
    text: message.trim(),
  });

  return `https://wa.me/${normalizedPhone}?${params.toString()}`;
}

type ProductInquiryInput = {
  name: string;
  sku: string;
  price: number;
};

export function buildProductInquiryMessage(
  product: ProductInquiryInput,
  adminName?: string,
  greetingLabel = "admin Baregad",
) {
  const greeting = adminName?.trim()
    ? `Halo ${adminName}, saya ingin pesan sparepart berikut:`
    : `Halo ${greetingLabel}, saya ingin pesan sparepart berikut:`;

  return [
    greeting,
    "",
    `Produk: ${product.name}`,
    `SKU: ${product.sku}`,
    `Harga: ${formatRupiah(product.price)}`,
    "",
    "Mohon info ketersediaan stok dan proses pembeliannya ya.",
  ].join("\n");
}
