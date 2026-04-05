import Link from "next/link";
import { cn } from "@/shared/lib/cn";

type ActionTone = "default" | "success" | "warning" | "danger" | "muted";

type ActionBaseProps = {
  label: string;
  icon: React.ReactNode;
  tone?: ActionTone;
  className?: string;
};

const toneClassMap: Record<ActionTone, string> = {
  default:
    "border-line bg-white/80 text-ink-soft hover:border-brand/30 hover:bg-brand-soft hover:text-brand-deep",
  success:
    "border-brand/20 bg-brand-soft/60 text-brand-deep hover:border-brand/35 hover:bg-brand-soft",
  warning:
    "border-accent/20 bg-accent-soft/70 text-accent hover:border-accent/35 hover:bg-accent-soft",
  danger:
    "border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-300 hover:bg-rose-100",
  muted:
    "border-line bg-white/65 text-muted hover:border-line-strong hover:bg-white/80 hover:text-ink-soft",
};

function AdminIconActionShell({
  label,
  className,
  tone = "default",
  children,
}: {
  label: string;
  tone?: ActionTone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span className="group relative inline-flex">
      <span
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-xl border transition",
          toneClassMap[tone],
          className,
        )}
      >
        {children}
      </span>
      <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 hidden -translate-x-1/2 rounded-lg bg-[#1f2129] px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap text-white shadow-[0_18px_44px_rgba(0,0,0,0.34)] group-hover:flex">
        {label}
      </span>
    </span>
  );
}

type AdminIconLinkProps = ActionBaseProps & {
  href: string;
};

export function AdminIconLink({
  href,
  label,
  icon,
  tone = "default",
  className,
}: AdminIconLinkProps) {
  return (
    <Link href={href} aria-label={label} title={label}>
      <AdminIconActionShell label={label} tone={tone} className={className}>
        {icon}
      </AdminIconActionShell>
    </Link>
  );
}

type AdminIconButtonProps = ActionBaseProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children">;

export function AdminIconButton({
  label,
  icon,
  tone = "default",
  className,
  type = "button",
  ...props
}: AdminIconButtonProps) {
  return (
    <button type={type} aria-label={label} title={label} {...props}>
      <AdminIconActionShell label={label} tone={tone} className={className}>
        {icon}
      </AdminIconActionShell>
    </button>
  );
}

export function AdminIconStatic({
  label,
  icon,
  tone = "muted",
  className,
}: ActionBaseProps) {
  return (
    <AdminIconActionShell label={label} tone={tone} className={className}>
      {icon}
    </AdminIconActionShell>
  );
}
