"use client";

import Image from "next/image";
import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from "react";
import { submitProductReview } from "@/entities/product-review/api/product-review-service";
import {
  formatProductReviewMaxImageSize,
  productReviewImageAccept,
  validateProductReviewImageFile,
} from "@/entities/product-review/model/review-photo";
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
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!selectedImage) {
      setSelectedImageUrl(null);
      return;
    }

    const nextObjectUrl = URL.createObjectURL(selectedImage);
    setSelectedImageUrl(nextObjectUrl);

    return () => {
      URL.revokeObjectURL(nextObjectUrl);
    };
  }, [selectedImage]);

  function clearSelectedImage() {
    setSelectedImage(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] ?? null;

    if (!nextFile) {
      clearSelectedImage();
      return;
    }

    const validationMessage = validateProductReviewImageFile(nextFile);

    if (validationMessage) {
      clearSelectedImage();
      setFeedback({
        tone: "error",
        message: validationMessage,
      });
      return;
    }

    setSelectedImage(nextFile);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const imageValidationMessage = validateProductReviewImageFile(selectedImage);

    if (imageValidationMessage) {
      setFeedback({
        tone: "error",
        message: imageValidationMessage,
      });
      return;
    }

    try {
      setIsPending(true);
      setFeedback(null);

      await submitProductReview(slug, {
        customerName: String(formData.get("customerName") ?? ""),
        customerEmail: String(formData.get("customerEmail") ?? ""),
        rating: Number(formData.get("rating") ?? 0),
        comment: String(formData.get("comment") ?? ""),
        imageFile: selectedImage,
      });

      form.reset();
      clearSelectedImage();
      setFormVersion((currentValue) => currentValue + 1);
      setFeedback({
        tone: "success",
        message: selectedImage
          ? "Ulasan dan foto berhasil dikirim. Keduanya akan tampil setelah dicek terlebih dahulu."
          : "Ulasan berhasil dikirim dan akan tampil setelah dicek terlebih dahulu.",
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
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
          Foto ulasan
        </span>
        <input
          key={formVersion}
          ref={fileInputRef}
          type="file"
          accept={productReviewImageAccept}
          onChange={handleImageChange}
          className="w-full rounded-xl border border-dashed border-line bg-white/80 px-3 py-2.5 text-sm text-ink-soft outline-none transition file:mr-3 file:rounded-full file:border-0 file:bg-brand-soft file:px-3 file:py-2 file:text-xs file:font-semibold file:text-brand-deep hover:border-brand focus:border-brand"
        />
        <p className="mt-2 text-xs leading-6 text-ink-soft">
          Opsional. Unggah JPG, PNG, atau WebP dengan ukuran maksimal{" "}
          {formatProductReviewMaxImageSize()}.
        </p>
      </label>
      {selectedImageUrl ? (
        <div className="rounded-[1.2rem] border border-line bg-white/75 p-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-ink">Preview foto ulasan</p>
              <p className="mt-1 text-xs text-ink-soft">{selectedImage?.name}</p>
            </div>
            <button
              type="button"
              onClick={clearSelectedImage}
              className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-ink transition hover:bg-white"
            >
              Hapus foto
            </button>
          </div>
          <div className="relative mt-3 aspect-[4/3] overflow-hidden rounded-[1rem] border border-line bg-white">
            <Image
              src={selectedImageUrl}
              alt="Preview foto ulasan"
              fill
              sizes="(max-width: 640px) 100vw, 420px"
              className="object-cover object-center"
              unoptimized
            />
          </div>
        </div>
      ) : null}
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
