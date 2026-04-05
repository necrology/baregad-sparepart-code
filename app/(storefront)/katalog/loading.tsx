import { Container } from "@/shared/ui/container";

export default function CatalogLoading() {
  return (
    <Container className="py-10">
      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="surface-panel h-[28rem] animate-pulse rounded-[2rem]" />
        <div className="space-y-5">
          <div className="surface-panel h-28 animate-pulse rounded-[2rem]" />
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="surface-strong h-[21rem] animate-pulse rounded-[1.5rem]"
              />
            ))}
          </div>
        </div>
      </div>
    </Container>
  );
}
