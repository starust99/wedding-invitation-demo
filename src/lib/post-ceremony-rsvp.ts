type PostCeremonyPartyInput = {
  invited: boolean;
  attendingCeremony: boolean;
  attendingBanquet: boolean;
  answer: unknown;
  allowFallback?: boolean;
};

export type PostCeremonyPartyResolution =
  | { ok: true; applies: false; value: undefined }
  | { ok: true; applies: true; value: boolean }
  | { ok: false; applies: true; error: string };

export function doesPostCeremonyPartyApply({
  invited,
  attendingCeremony,
  attendingBanquet,
  allowFallback = true,
}: Omit<PostCeremonyPartyInput, "answer">) {
  return invited ? attendingCeremony : allowFallback && !attendingBanquet;
}

export function resolvePostCeremonyPartyAnswer({
  invited,
  attendingCeremony,
  attendingBanquet,
  answer,
  allowFallback = true,
}: PostCeremonyPartyInput): PostCeremonyPartyResolution {
  const applies = doesPostCeremonyPartyApply({ invited, attendingCeremony, attendingBanquet, allowFallback });
  if (!applies) return { ok: true, applies: false, value: undefined };
  if (typeof answer !== "boolean") {
    return {
      ok: false,
      applies: true,
      error: "Vui lòng chọn phản hồi cho Tiệc thân mật.",
    };
  }
  return { ok: true, applies: true, value: answer };
}
