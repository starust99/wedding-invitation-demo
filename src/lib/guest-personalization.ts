export type GuestIdentity = {
  name?: string;
  honorific?: string;
  group?: string;
};

const guestStorageKey = "wedding-demo-guest-identity";

function clean(value: string | null) {
  return value?.trim() || undefined;
}

export function readGuestIdentityFromSearch(search: string): GuestIdentity {
  const params = new URLSearchParams(search);
  return {
    name: clean(params.get("guest") ?? params.get("name")),
    honorific: clean(params.get("honorific") ?? params.get("title")),
    group: clean(params.get("group")),
  };
}

export function readStoredGuestIdentity(): GuestIdentity {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(guestStorageKey);
    return raw ? JSON.parse(raw) as GuestIdentity : {};
  } catch {
    return {};
  }
}

export function writeStoredGuestIdentity(identity: GuestIdentity) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(guestStorageKey, JSON.stringify(identity));
}

export function resolveGuestIdentity(search: string): GuestIdentity {
  const fromSearch = readGuestIdentityFromSearch(search);
  const stored = readStoredGuestIdentity();
  const identity = {
    ...stored,
    ...Object.fromEntries(Object.entries(fromSearch).filter(([, value]) => Boolean(value))),
  } as GuestIdentity;

  if (identity.name || identity.honorific || identity.group) {
    writeStoredGuestIdentity(identity);
  }

  return identity;
}

export function formatGuestName(identity: GuestIdentity) {
  if (!identity.name) return "quý khách";
  return [identity.honorific, identity.name].filter(Boolean).join(" ");
}
