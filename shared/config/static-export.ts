export function isStaticExportEnabled() {
  return (
    process.env.NEXT_STATIC_EXPORT === "true" ||
    process.env.NEXT_PUBLIC_STATIC_EXPORT === "true"
  );
}
