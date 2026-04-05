import { cn } from "@/shared/lib/cn";

type IconProps = {
  className?: string;
};

function IconBase({
  className,
  children,
  viewBox = "0 0 24 24",
}: IconProps & {
  children: React.ReactNode;
  viewBox?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox={viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-4 w-4", className)}
    >
      {children}
    </svg>
  );
}

export function EditIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M12 20h9" />
      <path d="m16.5 3.5 4 4L8 20l-5 1 1-5 12.5-12.5Z" />
    </IconBase>
  );
}

export function TrashIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 10v6" />
      <path d="M14 10v6" />
    </IconBase>
  );
}

export function CheckIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="m5 12 4 4L19 6" />
    </IconBase>
  );
}

export function EyeOffIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
      <path d="M9.9 4.2A10.6 10.6 0 0 1 12 4c5 0 8.8 3.1 10 8-0.4 1.5-1.1 2.8-2 4" />
      <path d="M6.2 6.2C4.4 7.6 3.2 9.6 2 12c1.2 4.9 5 8 10 8 1 0 2-.1 2.9-.4" />
    </IconBase>
  );
}

export function CloseIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </IconBase>
  );
}

export function LockIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 1 1 8 0v3" />
    </IconBase>
  );
}

export function SearchIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </IconBase>
  );
}

export function WhatsAppIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 32 32"
      fill="currentColor"
      className={cn("h-4 w-4", className)}
    >
      <path d="M19.1 17.7c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.8.2-.2.3-.9 1-.9 1.1-.2.2-.3.2-.6.1-.3-.2-1.1-.4-2.1-1.3-.8-.7-1.4-1.6-1.5-1.9-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.1-.8-2-1.1-2.7-.3-.7-.6-.6-.8-.6h-.7c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1 2.8 1.1 3c.1.2 2 3.2 5 4.5.7.3 1.3.5 1.7.7.7.2 1.4.2 1.9.1.6-.1 1.8-.8 2.1-1.5.3-.7.3-1.3.2-1.5-.1-.2-.3-.2-.6-.4Z" />
      <path d="M27.3 15.5c0 6.2-5.1 11.2-11.3 11.2-2 0-4-.5-5.7-1.5L4.5 27l1.7-5.6a11 11 0 0 1-1.8-5.9C4.4 9.3 9.5 4.3 15.8 4.3S27.3 9.3 27.3 15.5Zm-11.5-9A9.1 9.1 0 0 0 6.7 15.5c0 1.8.5 3.5 1.4 4.9l.2.3-1 3.3 3.4-1 .3.2c1.4.8 3 1.3 4.8 1.3a9.1 9.1 0 0 0 9.1-9c0-5-4.1-9-9.1-9Z" />
    </svg>
  );
}
