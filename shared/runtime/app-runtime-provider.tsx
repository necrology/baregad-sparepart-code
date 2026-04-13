"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { BackendRequestError, backendFetchJson } from "@/shared/api/backend-client";
import { getPublicAppConfig } from "@/shared/api/public-app-config-service";
import {
  clearStoredAdminAuth,
  isAdminAuthExpired,
  readStoredAdminAuth,
  writeStoredAdminAuth,
  type AdminLoginResult,
  type AdminSession,
  type StoredAdminAuth,
} from "@/shared/auth/admin-auth";
import {
  defaultPublicAppConfig,
  type PublicAppConfig,
} from "@/shared/config/app";

type BrandingContextValue = {
  branding: PublicAppConfig;
  isBrandingReady: boolean;
  refreshBranding: () => Promise<PublicAppConfig>;
};

type AdminSessionContextValue = {
  session: AdminSession | null;
  token: string | null;
  expiresAt: string | null;
  isReady: boolean;
  isAuthenticating: boolean;
  login: (payload: {
    username: string;
    password: string;
  }) => Promise<AdminLoginResult>;
  logout: () => void;
  refreshSession: () => Promise<AdminSession | null>;
};

type AppRuntimeProviderProps = {
  children: React.ReactNode;
};

const BrandingContext = createContext<BrandingContextValue | null>(null);
const AdminSessionContext = createContext<AdminSessionContextValue | null>(null);

function replaceIconLinks(href: string) {
  document.head
    .querySelectorAll<HTMLLinkElement>(
      'link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]',
    )
    .forEach((link) => {
      link.remove();
    });

  ["icon", "shortcut icon", "apple-touch-icon"].forEach((rel) => {
    const link = document.createElement("link");
    link.setAttribute("rel", rel);
    link.setAttribute("href", href);
    link.setAttribute("data-managed-icon", "true");
    document.head.appendChild(link);
  });
}

export function AppRuntimeProvider({ children }: AppRuntimeProviderProps) {
  const [branding, setBranding] = useState(defaultPublicAppConfig);
  const [isBrandingReady, setIsBrandingReady] = useState(false);
  const [session, setSession] = useState<AdminSession | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const refreshBranding = useCallback(async () => {
    try {
      const nextBranding = await getPublicAppConfig();
      setBranding(nextBranding);
      return nextBranding;
    } catch {
      return defaultPublicAppConfig;
    } finally {
      setIsBrandingReady(true);
    }
  }, []);

  const logout = useCallback(() => {
    clearStoredAdminAuth();
    setSession(null);
    setToken(null);
    setExpiresAt(null);
    setIsReady(true);
    setIsAuthenticating(false);
  }, []);

  const refreshSession = useCallback(async (storedAuthOverride?: StoredAdminAuth | null) => {
    const storedAuth = storedAuthOverride ?? readStoredAdminAuth();
    const currentToken = storedAuth?.token ?? null;

    if (!currentToken?.trim()) {
      setIsReady(true);
      return null;
    }

    try {
      setIsAuthenticating(true);

      const nextSession = await backendFetchJson<AdminSession>("/admin/auth/me", {
        token: currentToken,
      });

      if (storedAuth) {
        writeStoredAdminAuth({
          ...storedAuth,
          user: nextSession,
        });
      }

      setSession(nextSession);
      setToken(currentToken);
      setExpiresAt(storedAuth?.expiresAt ?? null);
      setIsReady(true);
      return nextSession;
    } catch (error) {
      if (error instanceof BackendRequestError && error.status === 401) {
        logout();
        return null;
      }

      setIsReady(true);
      return null;
    } finally {
      setIsAuthenticating(false);
    }
  }, [logout]);

  const login = useCallback(async (payload: { username: string; password: string }) => {
    try {
      setIsAuthenticating(true);

      const result = await backendFetchJson<AdminLoginResult>("/admin/auth/login", {
        method: "POST",
        json: payload,
      });

      writeStoredAdminAuth(result);
      setSession(result.user);
      setToken(result.token);
      setExpiresAt(result.expiresAt);
      setIsReady(true);
      return result;
    } finally {
      setIsAuthenticating(false);
    }
  }, []);

  useEffect(() => {
    void refreshBranding();
  }, [refreshBranding]);

  useEffect(() => {
    const storedAuth = readStoredAdminAuth();

    if (!storedAuth || isAdminAuthExpired(storedAuth.expiresAt)) {
      logout();
      return;
    }

    setSession(storedAuth.user);
    setToken(storedAuth.token);
    setExpiresAt(storedAuth.expiresAt);
    setIsReady(true);
    void refreshSession(storedAuth);
  }, [logout, refreshSession]);

  useEffect(() => {
    if (!branding.faviconUrl.trim()) {
      return;
    }

    replaceIconLinks(branding.faviconUrl);
  }, [branding.faviconUrl]);

  return (
    <BrandingContext.Provider
      value={{
        branding,
        isBrandingReady,
        refreshBranding,
      }}
    >
      <AdminSessionContext.Provider
        value={{
          session,
          token,
          expiresAt,
          isReady,
          isAuthenticating,
          login,
          logout,
          refreshSession,
        }}
      >
        {children}
      </AdminSessionContext.Provider>
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  const context = useContext(BrandingContext);

  if (!context) {
    throw new Error("useBranding must be used within AppRuntimeProvider.");
  }

  return context;
}

export function useAdminSession() {
  const context = useContext(AdminSessionContext);

  if (!context) {
    throw new Error("useAdminSession must be used within AppRuntimeProvider.");
  }

  return context;
}
