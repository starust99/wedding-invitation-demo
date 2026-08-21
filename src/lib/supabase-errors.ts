export function isMissingSupabaseColumn(
  error: { code?: string; message?: string } | null | undefined,
  column: string,
) {
  return Boolean(
    error
    && (error.code === "42703" || error.code === "PGRST204")
    && error.message?.includes(column),
  );
}
