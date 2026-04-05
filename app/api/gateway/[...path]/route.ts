import { type NextRequest, NextResponse } from "next/server";
import { getBackendRuntimeConfig } from "@/shared/config/env";

type GatewayRouteProps = {
  params: Promise<{
    path: string[];
  }>;
};

const requestHeaderAllowList = new Set([
  "accept",
  "content-type",
  "authorization",
  "x-request-id",
  "x-correlation-id",
]);

const responseHeaderAllowList = new Set(["content-type", "cache-control", "etag"]);

async function handleProxy(request: NextRequest, { params }: GatewayRouteProps) {
  const config = getBackendRuntimeConfig();

  if (!config.enabled) {
    return NextResponse.json(
      { message: "BACKEND_API_BASE_URL belum diatur." },
      { status: 503 },
    );
  }

  const { path } = await params;
  const target = new URL(path.join("/"), `${config.baseUrl}/`);

  request.nextUrl.searchParams.forEach((value, key) => {
    target.searchParams.append(key, value);
  });

  const headers = new Headers();

  request.headers.forEach((value, key) => {
    if (requestHeaderAllowList.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  if (config.token && !headers.has("authorization")) {
    headers.set("authorization", `Bearer ${config.token}`);
  }

  const init: RequestInit = {
    method: request.method,
    headers,
    cache: "no-store",
  };

  if (!["GET", "HEAD"].includes(request.method)) {
    init.body = await request.arrayBuffer();
  }

  try {
    const response = await fetch(target, init);
    const body = await response.arrayBuffer();
    const responseHeaders = new Headers();

    response.headers.forEach((value, key) => {
      if (responseHeaderAllowList.has(key.toLowerCase())) {
        responseHeaders.set(key, value);
      }
    });

    return new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch {
    return NextResponse.json(
      { message: "Proxy request ke backend gagal." },
      { status: 502 },
    );
  }
}

export function GET(request: NextRequest, context: GatewayRouteProps) {
  return handleProxy(request, context);
}

export function POST(request: NextRequest, context: GatewayRouteProps) {
  return handleProxy(request, context);
}

export function PUT(request: NextRequest, context: GatewayRouteProps) {
  return handleProxy(request, context);
}

export function PATCH(request: NextRequest, context: GatewayRouteProps) {
  return handleProxy(request, context);
}

export function DELETE(request: NextRequest, context: GatewayRouteProps) {
  return handleProxy(request, context);
}
