import { cn } from "@/shared/lib/cn";

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn(align === "center" ? "text-center" : "text-left", className)}>
      {eyebrow ? (
        <span className="inline-flex rounded-full bg-brand-soft px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-brand-deep sm:text-xs">
          {eyebrow}
        </span>
      ) : null}
      <h2 className="mt-3 font-display text-lg font-semibold tracking-tight text-ink sm:text-xl lg:text-2xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-3 max-w-3xl text-sm leading-6 text-ink-soft sm:text-base">
          {description}
        </p>
      ) : null}
    </div>
  );
}
