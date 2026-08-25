"use client";

import { useEffect, useRef, useState } from "react";
import {
  NETWORK_ACTIVITY_EVENT,
  type NetworkActivityDetail,
} from "@/shared/runtime/network-activity";
import { cn } from "@/shared/lib/cn";
import { AppLoadingBeacon } from "@/shared/ui/app-loading";

const SHOW_DELAY_MS = 120;
const HIDE_DELAY_MS = 220;

export function GlobalNetworkActivity() {
  const [activeCount, setActiveCount] = useState(0);
  const [visible, setVisible] = useState(false);
  const showTimerRef = useRef<number | null>(null);
  const hideTimerRef = useRef<number | null>(null);

  useEffect(() => {
    function clearTimers() {
      if (showTimerRef.current) {
        window.clearTimeout(showTimerRef.current);
        showTimerRef.current = null;
      }

      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    }

    function updateVisibility(nextCount: number) {
      if (nextCount > 0) {
        if (!visible && !showTimerRef.current) {
          showTimerRef.current = window.setTimeout(() => {
            setVisible(true);
            showTimerRef.current = null;
          }, SHOW_DELAY_MS);
        }

        if (hideTimerRef.current) {
          window.clearTimeout(hideTimerRef.current);
          hideTimerRef.current = null;
        }

        return;
      }

      if (showTimerRef.current) {
        window.clearTimeout(showTimerRef.current);
        showTimerRef.current = null;
      }

      hideTimerRef.current = window.setTimeout(() => {
        setVisible(false);
        hideTimerRef.current = null;
      }, HIDE_DELAY_MS);
    }

    function handleActivity(event: Event) {
      const detail = (event as CustomEvent<NetworkActivityDetail>).detail;

      setActiveCount((currentValue) => {
        const nextValue = Math.max(0, currentValue + detail.delta);
        updateVisibility(nextValue);
        return nextValue;
      });
    }

    window.addEventListener(NETWORK_ACTIVITY_EVENT, handleActivity);

    return () => {
      clearTimers();
      window.removeEventListener(NETWORK_ACTIVITY_EVENT, handleActivity);
    };
  }, [visible]);

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 top-3 z-[220] flex justify-center px-4 transition duration-300",
        visible ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0",
      )}
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="min-w-[min(92vw,21rem)] max-w-xl rounded-[1.6rem] border border-white/80 bg-white/84 px-4 py-3 shadow-[0_24px_80px_rgba(24,50,76,0.18)] backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <AppLoadingBeacon compact className="h-10 w-10" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-brand-deep">
              Sinkronisasi
            </p>
            <p className="truncate text-sm text-ink-soft">
              {activeCount > 1
                ? `${activeCount} proses sedang berjalan`
                : "Sedang mengambil data terbaru"}
            </p>
          </div>
          <span className="rounded-full border border-brand/10 bg-brand-soft/70 px-2.5 py-1 text-[11px] font-semibold text-brand-deep">
            {activeCount}
          </span>
        </div>

        <div className="mt-3 overflow-hidden rounded-full bg-brand-soft/70">
          <div className="app-loader-progress h-1.5 w-1/2 rounded-full bg-gradient-to-r from-brand via-brand-deep to-brand" />
        </div>
      </div>
    </div>
  );
}
