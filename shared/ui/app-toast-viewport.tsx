"use client";

import { startTransition, useEffect, useEffectEvent, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/shared/lib/cn";
import type { AppToastTone } from "@/shared/lib/toast";

type ToastState = {
  id: string;
  message: string;
  tone: AppToastTone;
};

type ToastCardProps = {
  toast: ToastState;
  onDismiss: (id: string) => void;
};

function normalizeToastTone(value: string | null): AppToastTone {
  switch (value) {
    case "success":
    case "error":
      return value;
    default:
      return "info";
  }
}

function createToastId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function ToastCard({ toast, onDismiss }: ToastCardProps) {
  const dismissToast = useEffectEvent(() => {
    onDismiss(toast.id);
  });

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      dismissToast();
    }, 4200);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [toast.id]);

  return (
    <div
      className={cn(
        "pointer-events-auto w-full rounded-[1.4rem] border px-4 py-3 shadow-[0_20px_48px_rgba(24,46,72,0.18)] backdrop-blur-xl transition",
        toast.tone === "success"
          ? "border-brand/20 bg-white/96 text-brand-deep"
          : toast.tone === "error"
            ? "border-[#c9d9ea] bg-[#24374d] text-white"
            : "border-line bg-white/96 text-ink",
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
            toast.tone === "success"
              ? "bg-brand-soft text-brand-deep"
              : toast.tone === "error"
                ? "bg-white/14 text-white"
                : "bg-brand-soft text-brand-deep",
          )}
        >
          {toast.tone === "success" ? "OK" : toast.tone === "error" ? "ER" : "IN"}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-70">
            {toast.tone === "success"
              ? "Berhasil"
              : toast.tone === "error"
                ? "Perhatian"
                : "Informasi"}
          </p>
          <p className="mt-1 text-sm leading-6">{toast.message}</p>
        </div>
        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          className={cn(
            "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition",
            toast.tone === "error"
              ? "bg-white/10 text-white hover:bg-white/16"
              : "bg-brand-soft/70 text-brand-deep hover:bg-brand-soft",
          )}
          aria-label="Tutup notifikasi"
        >
          x
        </button>
      </div>
    </div>
  );
}

export function AppToastViewport() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const lastHandledKey = useRef<string | null>(null);

  useEffect(() => {
    const message = searchParams.get("toast");

    if (!message) {
      lastHandledKey.current = null;
      return;
    }

    const handledKey = `${pathname}?${searchParams.toString()}`;

    if (lastHandledKey.current === handledKey) {
      return;
    }

    lastHandledKey.current = handledKey;

    const enqueueTimeoutId = window.setTimeout(() => {
      setToasts((currentToasts) => [
        ...currentToasts,
        {
          id: createToastId(),
          message,
          tone: normalizeToastTone(searchParams.get("toastType")),
        },
      ]);
    }, 0);

    const nextSearchParams = new URLSearchParams(searchParams.toString());
    nextSearchParams.delete("toast");
    nextSearchParams.delete("toastType");
    nextSearchParams.delete("success");
    nextSearchParams.delete("error");

    const nextUrl = nextSearchParams.toString()
      ? `${pathname}?${nextSearchParams.toString()}`
      : pathname;

    startTransition(() => {
      router.replace(nextUrl, { scroll: false });
    });

    return () => {
      window.clearTimeout(enqueueTimeoutId);
    };
  }, [pathname, router, searchParams]);

  function dismissToast(id: string) {
    setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== id));
  }

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed top-4 right-4 z-[140] flex w-[min(92vw,24rem)] flex-col gap-3">
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={dismissToast} />
      ))}
    </div>
  );
}
