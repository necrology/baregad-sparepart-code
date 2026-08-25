"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, type MouseEvent } from "react";
import { getStorefrontWhatsAppAdmins } from "@/entities/user/api/whatsapp-admin-service";
import type { StorefrontWhatsAppAdmin } from "@/entities/user/model/types";
import type { PublicAppConfig } from "@/shared/config/app";
import { buildWhatsAppUrl } from "@/shared/lib/whatsapp";
import { CloseIcon } from "@/shared/ui/app-icons";

type StorefrontWhatsAppFloatProps = {
  branding: PublicAppConfig;
};

const whatsappLogoUrl =
  "https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg";

function buildStorefrontWhatsAppMessage(
  adminName?: string,
  greetingLabel = "admin Baregad",
) {
  const greeting = adminName?.trim()
    ? `Halo ${adminName}, saya ingin tanya soal sparepart di Baregad.`
    : `Halo ${greetingLabel}, saya ingin tanya soal sparepart di Baregad.`;

  return [
    greeting,
    "",
    "Boleh bantu rekomendasi produk yang cocok dan cek stok yang tersedia?",
  ].join("\n");
}

export function StorefrontWhatsAppFloat({
  branding,
}: StorefrontWhatsAppFloatProps) {
  const pathname = usePathname();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const [admins, setAdmins] = useState<StorefrontWhatsAppAdmin[]>([]);

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

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      const nextAdmins = await getStorefrontWhatsAppAdmins();
      if (!isMounted) {
        return;
      }

      setAdmins(nextAdmins);
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  if (admins.length === 0 || pathname === "/admin-login") {
    return null;
  }

  return (
    <>
      <div className="pointer-events-none fixed bottom-5 right-4 z-40 sm:bottom-6 sm:right-6">
        <button
          type="button"
          onClick={openModal}
          aria-label={`Hubungi ${branding.supportTeamLabel} lewat WhatsApp`}
          title={`Hubungi ${branding.supportTeamLabel} lewat WhatsApp`}
          className="pointer-events-auto inline-flex h-14 w-14 items-center justify-center rounded-full border border-line bg-white/96 shadow-[0_20px_44px_rgba(17,24,39,0.16)] transition hover:-translate-y-0.5 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366]"
        >
          <span
            aria-hidden="true"
            className="h-7 w-7 bg-contain bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${whatsappLogoUrl})` }}
          />
        </button>
      </div>

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
                  Pilih admin yang ingin kamu hubungi untuk bertanya soal sparepart dan cek stok.
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
              {admins.map((admin, index) => {
                const href =
                  buildWhatsAppUrl(
                    admin.phone,
                    buildStorefrontWhatsAppMessage(
                      admin.fullName,
                      branding.whatsappGreetingLabel,
                    ),
                  ) || admin.whatsAppUrl;

                return (
                  <Link
                    key={admin.id}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    onClick={closeModal}
                    className="group rounded-[1.4rem] border border-[#CDEFD9] bg-[#F4FCF7] p-4 transition hover:border-[#8DDEAE] hover:bg-[#E9F9EF]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#138A4B]">
                          Admin {index + 1}
                        </p>
                        <p className="mt-2 text-base font-semibold text-ink">
                          {admin.fullName}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-ink-soft">
                          {admin.levelName
                            ? `${admin.levelName} siap bantu cek stok dan rekomendasi produk.`
                            : "Admin siap bantu cek stok dan rekomendasi produk."}
                        </p>
                      </div>
                      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_10px_24px_rgba(37,211,102,0.24)] transition group-hover:scale-105">
                        <span
                          aria-hidden="true"
                          className="h-5 w-5 bg-contain bg-center bg-no-repeat"
                          style={{ backgroundImage: `url(${whatsappLogoUrl})` }}
                        />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </dialog>
    </>
  );
}
