type PostCeremonyPartyInput = {
  invited: boolean;
  attendingCeremony: boolean;
  answer: unknown;
};

export type PostCeremonyPartyResolution =
  | { ok: true; applies: false; value: undefined }
  | { ok: true; applies: true; value: boolean }
  | { ok: false; applies: true; error: string };

export function resolvePostCeremonyPartyAnswer({
  invited,
  attendingCeremony,
  answer,
}: PostCeremonyPartyInput): PostCeremonyPartyResolution {
  const applies = invited && attendingCeremony;
  if (!applies) return { ok: true, applies: false, value: undefined };
  if (typeof answer !== "boolean") {
    return {
      ok: false,
      applies: true,
      error: "Vui lòng chọn phản hồi cho tiệc sau Thánh lễ.",
    };
  }
  return { ok: true, applies: true, value: answer };
}
