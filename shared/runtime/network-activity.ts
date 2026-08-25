export const NETWORK_ACTIVITY_EVENT = "baregad:network-activity";

export type NetworkActivityDetail = {
  delta: 1 | -1;
};

export function dispatchNetworkActivity(delta: 1 | -1) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<NetworkActivityDetail>(NETWORK_ACTIVITY_EVENT, {
      detail: { delta },
    }),
  );
}
