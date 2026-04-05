import { type NextRequest, NextResponse } from "next/server";
import { getCatalog } from "@/entities/product/api/product-service";
import { parseCatalogQuery } from "@/entities/product/model/catalog";

export async function GET(request: NextRequest) {
  const query = parseCatalogQuery(request.nextUrl.searchParams);
  const catalog = await getCatalog(query);

  return NextResponse.json(catalog);
}
