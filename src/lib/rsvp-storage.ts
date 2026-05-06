export type RSVPResponse = {
  id: string;
  name: string;
  phone: string;
  attending: "yes" | "no" | "maybe";
  guestCount: number;
  guestGroup: string;
  dietaryNote?: string;
  transportNeeded: boolean;
  accommodationNeeded: boolean;
  stayingGuestCount?: number;
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
  window.localStorage.setItem(rsvpStorageKey, JSON.stringify([next, ...responses]));
  window.dispatchEvent(new Event("wedding-rsvp-updated"));
  return next;
}

export function clearRSVPResponses() {
  window.localStorage.removeItem(rsvpStorageKey);
  window.dispatchEvent(new Event("wedding-rsvp-updated"));
}

export function attendingLabel(value: RSVPResponse["attending"]) {
  if (value === "yes") return "Trân trọng tham dự";
  if (value === "no") return "Rất tiếc vắng mặt";
  return "Cần thêm thời gian xác nhận";
}
