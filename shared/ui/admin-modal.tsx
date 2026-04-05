"use client";

import { useId, useRef, type MouseEvent, type ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

type AdminModalProps = {
  title: string;
  description?: string;
  triggerLabel: string;
  triggerClassName?: string;
  panelClassName?: string;
  disabled?: boolean;
  children: ReactNode;
};

export function AdminModal({
  title,
  description,
  triggerLabel,
  triggerClassName,
  panelClassName,
  disabled,
  children,
}: AdminModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  function openModal() {
    if (!dialogRef.current?.open) {
      dialogRef.current?.showModal();
    }
  }

  function closeModal() {
    dialogRef.current?.close();
  }

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) {
      closeModal();
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        disabled={disabled}
        className={cn(
          "rounded-full border border-brand-deep bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-deep hover:text-white focus-visible:text-white disabled:cursor-not-allowed disabled:border-line disabled:bg-white/70 disabled:text-muted",
          triggerClassName,
        )}
      >
        {triggerLabel}
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className="admin-dialog"
        onClick={handleBackdropClick}
      >
        <div className="flex min-h-full w-full items-center justify-center py-4">
          <div
            className={cn(
              "surface-strong w-full max-w-3xl rounded-[2rem] border border-line p-4 sm:p-4",
              panelClassName,
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3
                  id={titleId}
                  className="font-display text-2xl font-semibold text-ink"
                >
                  {title}
                </h3>
                {description ? (
                  <p
                    id={descriptionId}
                    className="mt-2 text-sm leading-7 text-ink-soft"
                  >
                    {description}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink transition hover:bg-white/70"
              >
                Tutup
              </button>
            </div>

            <div className="mt-4">{children}</div>
          </div>
        </div>
      </dialog>
    </>
  );
}
