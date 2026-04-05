"use client";

import { useState } from "react";
import { cn } from "@/shared/lib/cn";
import { StarIcon } from "@/shared/ui/rating-stars";

type RatingInputProps = {
  name: string;
  defaultValue?: number;
  className?: string;
};

const ratingLabels = ["Buruk", "Kurang", "Cukup", "Bagus", "Sangat puas"] as const;

function normalizeValue(value: number) {
  if (Number.isInteger(value) && value >= 1 && value <= 5) {
    return value;
  }

  return 5;
}

export function RatingInput({
  name,
  defaultValue = 5,
  className,
}: RatingInputProps) {
  const [selectedValue, setSelectedValue] = useState(normalizeValue(defaultValue));
  const [hoveredValue, setHoveredValue] = useState<number | null>(null);
  const activeValue = hoveredValue ?? selectedValue;

  return (
    <div className={cn("space-y-2", className)}>
      <input type="hidden" name={name} value={selectedValue} />
      <div
        role="radiogroup"
        aria-label="Pilih rating"
        onMouseLeave={() => setHoveredValue(null)}
        className="flex items-center gap-1"
      >
        {Array.from({ length: 5 }, (_, index) => {
          const rating = index + 1;
          const isActive = rating <= activeValue;

          return (
            <button
              key={rating}
              type="button"
              role="radio"
              aria-checked={selectedValue === rating}
              aria-label={`${rating} bintang`}
              onClick={() => setSelectedValue(rating)}
              onMouseEnter={() => setHoveredValue(rating)}
              onFocus={() => setHoveredValue(rating)}
              onBlur={() => setHoveredValue(null)}
              className={cn(
                "inline-flex h-11 w-11 items-center justify-center rounded-full border transition",
                isActive
                  ? "border-[#f0b247]/30 bg-[#fff5de] text-[#f0b247]"
                  : "border-line bg-white/80 text-[#dce5ef] hover:border-[#f0b247]/20 hover:text-[#f0b247]",
              )}
            >
              <StarIcon className="h-5 w-5" />
            </button>
          );
        })}
      </div>
      <p className="text-sm text-ink-soft">
        {selectedValue}/5 - {ratingLabels[selectedValue - 1]}
      </p>
    </div>
  );
}
