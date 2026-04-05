import { NextResponse } from "next/server";
import { getProductBySlug } from "@/entities/product/api/product-service";

type ProductDetailRouteProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(_: Request, { params }: ProductDetailRouteProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product.item) {
    return NextResponse.json(
      { message: "Produk tidak ditemukan." },
      { status: 404 },
    );
  }

  return NextResponse.json(product);
}
