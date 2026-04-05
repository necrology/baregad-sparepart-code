import { cn } from "@/shared/lib/cn";

type ContainerProps = {
  children: React.ReactNode;
  className?: string;
};

export function Container({ children, className }: ContainerProps) {
  return (
    <div
      className={cn("mx-auto w-full max-w-7xl px-3 sm:px-4 lg:px-4", className)}
    >
      {children}
    </div>
  );
}
