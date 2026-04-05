export type AppToastTone = "success" | "error" | "info";

export type AppToast = {
  message: string;
  tone?: AppToastTone;
};

export function applyToastSearchParams(url: URL, toast?: AppToast | null) {
  url.searchParams.delete("toast");
  url.searchParams.delete("toastType");
  url.searchParams.delete("success");
  url.searchParams.delete("error");

  if (!toast?.message) {
    return url;
  }

  url.searchParams.set("toast", toast.message);

  if (toast.tone && toast.tone !== "info") {
    url.searchParams.set("toastType", toast.tone);
  }

  return url;
}
