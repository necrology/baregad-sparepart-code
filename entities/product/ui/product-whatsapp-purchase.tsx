"use client";

import Link from "next/link";
import { useId, useRef, type MouseEvent } from "react";
import { CloseIcon, WhatsAppIcon } from "@/shared/ui/app-icons";

type ProductWhatsAppOption = {
  id: string;
  label: string;
  description: string;
  href: string;
};

type ProductWhatsAppPurchaseProps = {
  options: ProductWhatsAppOption[];
  supportTeamLabel?: string;
};

export function ProductWhatsAppPurchase({
  options,
  supportTeamLabel = "tim Baregad",
}: ProductWhatsAppPurchaseProps) {
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

  if (options.length === 0) {
    return (
      <div className="rounded-[1.2rem] border border-line bg-white/70 px-4 py-3 text-sm leading-6 text-ink-soft">
        Admin WhatsApp belum tersedia saat ini. Silakan cek kembali nanti atau
        hubungi {supportTeamLabel} melalui kontak utama.
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#1fb45a] hover:text-white hover:shadow-[0_8px_20px_rgba(37,211,102,0.24)] focus-visible:text-white sm:text-sm"
      >
        <WhatsAppIcon className="h-4 w-4" />
        Beli via Admin WA
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="admin-dialog"
        onClick={handleBackdropClick}
      >
        <div className="flex min-h-full w-full items-center justify-center py-4">
          <div className="surface-strong w-full max-w-2xl rounded-[2rem] border border-line p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 id={titleId} className="font-display text-2xl font-semibold text-ink">
                  Pilih admin WhatsApp
                </h3>
                <p id={descriptionId} className="mt-2 text-sm leading-7 text-ink-soft">
                  Pilih admin yang ingin kamu hubungi untuk melanjutkan pembelian produk ini.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                aria-label="Tutup modal"
                title="Tutup modal"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-rose-700 transition hover:border-rose-300 hover:bg-rose-100"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="mt-5 grid gap-3">
              {options.map((option, index) => (
                <Link
                  key={option.id}
                  href={option.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group rounded-[1.4rem] border border-[#CDEFD9] bg-[#F4FCF7] p-4 transition hover:border-[#8DDEAE] hover:bg-[#E9F9EF]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#138A4B]">
                        Admin {index + 1}
                      </p>
                      <p className="mt-2 text-base font-semibold text-ink">{option.label}</p>
                      <p className="mt-1 text-sm leading-6 text-ink-soft">{option.description}</p>
                    </div>
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_10px_24px_rgba(37,211,102,0.24)] transition group-hover:scale-105">
                      <WhatsAppIcon className="h-5 w-5" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </dialog>
    </>
  );
}
