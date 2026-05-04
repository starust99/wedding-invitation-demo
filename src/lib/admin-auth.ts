import { cookies } from "next/headers";

export const adminSessionCookie = "wedding_admin_session";

function getAdminPassword() {
  return process.env.ADMIN_PASSWORD || "demo-admin";
}

export function isValidAdminPassword(password: string) {
  return password === getAdminPassword();
}

export async function hasAdminSession() {
  const cookieStore = await cookies();
  return cookieStore.get(adminSessionCookie)?.value === getAdminPassword();
}
