const knownSalutationClusters = [
  "Cha",
  "Gia đình chú thím",
  "Gia đình cô dượng",
  "Gia đình cô chú",
  "Gia đình cậu mợ",
  "Gia đình anh chị",
  "Vợ chồng đồng nghiệp",
  "Vợ chồng chú thím",
  "Vợ chồng dì dượng",
  "Vợ chồng cô dượng",
  "Vợ chồng cô chú",
  "Vợ chồng cậu mợ",
  "Vợ chồng anh chị",
  "Vợ chồng cháu",
  "Vợ chồng bạn",
  "Vợ chồng bác",
  "Vợ chồng anh",
  "Vợ chồng chị",
  "Vợ chồng em",
  "Gia đình đồng nghiệp",
  "Gia đình dượng",
  "Gia đình thím",
  "Gia đình cháu",
  "Gia đình bạn",
  "Gia đình bác",
  "Gia đình chú",
  "Gia đình cậu",
  "Gia đình anh",
  "Gia đình chị",
  "Gia đình em",
  "Gia đình cô",
  "Gia đình dì",
  "Gia đình mợ",
  "Gia đình",
  "Ông bà",
  "Bố mẹ",
  "Ba mẹ",
  "Cha mẹ",
  "Cô dượng",
  "Cô chú",
  "Cậu mợ",
  "Anh chị",
  "Hai bạn",
  "Hai em",
  "Đồng nghiệp",
  "Dượng",
  "Thím",
  "Cháu",
  "Bạn",
  "Bác",
  "Chú",
  "Cậu",
  "Anh",
  "Chị",
  "Em",
  "Ba",
  "Bà",
  "Bố",
  "Mẹ",
  "Cô",
  "Dì",
  "Mợ",
] as const;

function normalize(value: string) {
  return value
    .toLocaleLowerCase("vi")
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeExact(value: string) {
  return value.toLocaleLowerCase("vi").replace(/\s+/g, " ").trim();
}

export function capitalizeFirst(value: string) {
  const clean = value.trim();
  return clean ? clean.charAt(0).toLocaleUpperCase("vi") + clean.slice(1) : clean;
}

export function lowercaseFirst(value: string) {
  const clean = value.trim();
  return clean ? clean.charAt(0).toLocaleLowerCase("vi") + clean.slice(1) : clean;
}

export function inferSalutationCluster(fullGuestName: string) {
  const exactName = normalizeExact(fullGuestName);
  const exactMatch = knownSalutationClusters.find((cluster) => {
    const exactCluster = normalizeExact(cluster);
    return exactName === exactCluster || exactName.startsWith(`${exactCluster} `);
  });
  if (exactMatch) return exactMatch;

  const normalizedName = normalize(fullGuestName);
  const matched = knownSalutationClusters.find((cluster) => {
    const normalizedCluster = normalize(cluster);
    return normalizedName === normalizedCluster || normalizedName.startsWith(`${normalizedCluster} `);
  });
  return matched ?? "";
}

export function resolveSalutationCluster(explicitCluster: string | undefined, fullGuestName: string) {
  return explicitCluster?.trim() || inferSalutationCluster(fullGuestName) || "Quý khách";
}

export function canonicalizeGuestFullName(fullGuestName: string, salutationCluster: string) {
  const full = fullGuestName.trim();
  const cluster = salutationCluster.trim();
  if (!full || !cluster || cluster === "Quý khách") return full;

  const normalizedFull = normalize(full);
  const normalizedCluster = normalize(cluster);
  if (normalizedFull !== normalizedCluster && !normalizedFull.startsWith(`${normalizedCluster} `)) return full;

  const clusterWordCount = normalizedCluster.split(" ").length;
  const suffix = full.split(/\s+/).slice(clusterWordCount).join(" ");
  return [cluster, suffix].filter(Boolean).join(" ");
}
