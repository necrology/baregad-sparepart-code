"use client";

import { AppRuntimeProvider } from "@/shared/runtime/app-runtime-provider";
import { GlobalNetworkActivity } from "@/shared/ui/global-network-activity";

type AppProvidersProps = {
  children: React.ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <AppRuntimeProvider>
      <GlobalNetworkActivity />
      {children}
    </AppRuntimeProvider>
  );
}
