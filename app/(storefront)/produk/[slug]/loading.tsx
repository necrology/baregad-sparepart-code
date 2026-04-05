import { Container } from "@/shared/ui/container";

export default function ProductDetailLoading() {
  return (
    <Container className="py-10">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="surface-panel h-[32rem] animate-pulse rounded-[2.5rem]" />
        <div className="space-y-5">
          <div className="surface-panel h-24 animate-pulse rounded-[2rem]" />
          <div className="surface-panel h-40 animate-pulse rounded-[2rem]" />
          <div className="surface-panel h-72 animate-pulse rounded-[2rem]" />
        </div>
      </div>
    </Container>
  );
}
