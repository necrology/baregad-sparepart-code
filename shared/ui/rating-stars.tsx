import { cn } from "@/shared/lib/cn";

type StarIconProps = {
  className?: string;
};

type RatingStarsProps = {
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
  valueLabel?: string;
  metaLabel?: string;
};

const sizeClassMap = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-5 w-5",
} as const;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function StarIcon({ className }: StarIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 2.6l2.77 5.61 6.19.9-4.48 4.36 1.06 6.16L12 16.72 6.46 19.63l1.06-6.16L3.04 9.11l6.19-.9L12 2.6z" />
    </svg>
  );
}

export function RatingStars({
  value,
  max = 5,
  size = "md",
  className,
  valueLabel,
  metaLabel,
}: RatingStarsProps) {
  const normalizedValue = clamp(value, 0, max);
  const starSizeClassName = sizeClassMap[size];

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <div className="flex items-center gap-1" aria-label={`Rating ${normalizedValue} dari ${max}`}>
        {Array.from({ length: max }, (_, index) => {
          const fillRatio = clamp(normalizedValue - index, 0, 1);

          return (
            <span key={index} className="relative inline-flex">
              <StarIcon className={cn(starSizeClassName, "text-[#dce5ef]")} />
              <span
                className="absolute inset-y-0 left-0 overflow-hidden"
                style={{ width: `${fillRatio * 100}%` }}
              >
                <StarIcon className={cn(starSizeClassName, "text-[#f0b247]")} />
              </span>
            </span>
          );
        })}
      </div>
      {valueLabel ? (
        <span className="text-sm font-semibold text-ink">{valueLabel}</span>
      ) : null}
      {metaLabel ? <span className="text-xs text-muted sm:text-sm">{metaLabel}</span> : null}
    </div>
  );
}
