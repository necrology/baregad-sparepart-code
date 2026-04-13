"use client";

import { type FormEvent, useState } from "react";
import { submitProductReview } from "@/entities/product-review/api/product-review-service";
import { RatingInput } from "@/shared/ui/rating-input";

type ProductReviewFormProps = {
  slug: string;
};

type FormFeedback = {
  tone: "success" | "error";
  message: string;
};

function resolveResponseMessage(payload: unknown, fallback: string) {
  if (
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    typeof payload.message === "string" &&
    payload.message.trim()
  ) {
    return payload.message;
  }

  return fallback;
}

export function ProductReviewForm({ slug }: ProductReviewFormProps) {
  const [formVersion, setFormVersion] = useState(0);
  const [isPending, setIsPending] = useState(false);
  const [feedback, setFeedback] = useState<FormFeedback | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      setIsPending(true);
      setFeedback(null);

      await submitProductReview(slug, {
        customerName: String(formData.get("customerName") ?? ""),
        customerEmail: String(formData.get("customerEmail") ?? ""),
        rating: Number(formData.get("rating") ?? 0),
        comment: String(formData.get("comment") ?? ""),
      });

      form.reset();
      setFormVersion((currentValue) => currentValue + 1);
      setFeedback({
        tone: "success",
        message: "Ulasan berhasil dikirim dan akan tampil setelah dicek terlebih dahulu.",
      });
    } catch (error) {
      setFeedback({
        tone: "error",
        message:
          error instanceof Error && error.message.trim()
            ? resolveResponseMessage(error, error.message)
            : "Ulasan belum bisa dikirim.",
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 grid gap-3">
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
          Nama
        </span>
        <input
          name="customerName"
          required
          placeholder="Contoh: Dimas Pratama"
          className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
          Email
        </span>
        <input
          name="customerEmail"
          type="email"
          required
          placeholder="nama@email.com"
          className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
        />
      </label>
      <div>
        <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
          Rating
        </span>
        <RatingInput key={formVersion} name="rating" defaultValue={5} />
      </div>
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
          Komentar
        </span>
        <textarea
          name="comment"
          required
          rows={5}
          minLength={12}
          placeholder="Ceritakan pengalaman penggunaan, kualitas barang, atau proses pengirimannya."
          className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
        />
      </label>
      {feedback ? (
        <div
          className={`rounded-[1.1rem] border px-4 py-3 text-sm leading-6 ${
            feedback.tone === "success"
              ? "border-brand/20 bg-brand-soft/60 text-brand-deep"
              : "border-[#d8e2ee] bg-[#24374d] text-white"
          }`}
        >
          {feedback.message}
        </div>
      ) : null}
      <button
        type="submit"
        disabled={isPending}
        className="rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-deep hover:text-white focus-visible:text-white disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? "Mengirim ulasan..." : "Kirim Ulasan"}
      </button>
    </form>
  );
}
