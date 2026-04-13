"use client";

import { AppRuntimeProvider } from "@/shared/runtime/app-runtime-provider";

type AppProvidersProps = {
  children: React.ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return <AppRuntimeProvider>{children}</AppRuntimeProvider>;
}
