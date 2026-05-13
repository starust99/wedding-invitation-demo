export type LodgingGuest = {
  fullName: string;
  idNumber: string;
  isChild: boolean;
  age?: number;
};

export type RSVPResponse = {
  id: string;
  inviteeId?: string;
  inviteToken?: string;
  displayLabel?: string;
  name: string;
  phone: string;
  attending: "yes" | "no" | "maybe";
  guestCount: number;
  guestGroup: string;
  dietaryNote?: string;
  transportNeeded: boolean;
  accommodationNeeded: boolean;
  stayingGuestCount?: number;
  lodgingGuests: LodgingGuest[];
  checkInDate?: string;
  checkOutDate?: string;
  roomType?: string;
  childrenCount: number;
  elderlySupportNeeded: boolean;
  notes?: string;
  submittedAt: string;
};

export const rsvpStorageKey = "wedding-demo-rsvp-responses";

export function readRSVPResponses(): RSVPResponse[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(rsvpStorageKey);
    if (!raw) return [];
    return JSON.parse(raw) as RSVPResponse[];
  } catch {
    return [];
  }
}

export function saveRSVPResponse(response: Omit<RSVPResponse, "id" | "submittedAt">): RSVPResponse {
  const next: RSVPResponse = {
    ...response,
    id: crypto.randomUUID(),
    submittedAt: new Date().toISOString(),
  };

  const responses = readRSVPResponses();
  const existing = responses.find((item) => {
    if (next.inviteeId && item.inviteeId === next.inviteeId) return true;
    if (next.inviteToken && item.inviteToken === next.inviteToken) return true;
    return false;
  });
  const saved = existing ? { ...existing, ...next, id: existing.id } : next;
  const withoutPrevious = responses.filter((item) => item.id !== saved.id);

  window.localStorage.setItem(rsvpStorageKey, JSON.stringify([saved, ...withoutPrevious]));
  window.dispatchEvent(new Event("wedding-rsvp-updated"));
  return saved;
}

export function clearRSVPResponses() {
  window.localStorage.removeItem(rsvpStorageKey);
  window.dispatchEvent(new Event("wedding-rsvp-updated"));
}

export function removeRSVPResponses(predicate: (response: RSVPResponse) => boolean) {
  if (typeof window === "undefined") return [];

  const responses = readRSVPResponses();
  const next = responses.filter((response) => !predicate(response));
  window.localStorage.setItem(rsvpStorageKey, JSON.stringify(next));
  window.dispatchEvent(new Event("wedding-rsvp-updated"));
  return next;
}

export function attendingLabel(value: RSVPResponse["attending"]) {
  if (value === "yes") return "Xác nhận tham dự";
  if (value === "no") return "Rất tiếc không tham dự";
  return "Cần thêm thời gian xác nhận";
}

export function countLodgingChildren(guests: LodgingGuest[]) {
  return guests.filter((guest) => guest.isChild && typeof guest.age === "number" && guest.age < 11).length;
}

export function formatLodgingGuestLabel(guest: LodgingGuest) {
  const parts = [guest.fullName];
  if (guest.isChild) {
    parts.push(`trẻ em${typeof guest.age === "number" ? ` ${guest.age} tuổi` : ""}`);
  } else {
    parts.push("người lớn");
    if (guest.idNumber) parts.push(`CCCD ${guest.idNumber}`);
  }
  return parts.filter(Boolean).join(" · ");
}

export function summarizeLodgingGuests(guests: LodgingGuest[]) {
  if (guests.length === 0) return "Chưa có người lưu trú";
  return guests.map(formatLodgingGuestLabel).join(" | ");
}
