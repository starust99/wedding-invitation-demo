import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const adminSessionCookie = "wedding_admin_session";
export const adminSessionMaxAgeSeconds = 60 * 60 * 24 * 7;

const adminSessionTokenVersion = "v1";
const fallbackDevelopmentAdminPassword = "demo-admin";

function getEnvValue(name: string) {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

function getAdminPassword() {
  const password = getEnvValue("ADMIN_PASSWORD");
  if (password) return password;
  return process.env.NODE_ENV === "production" ? null : fallbackDevelopmentAdminPassword;
}

function getSessionSecret(adminPassword: string) {
  return getEnvValue("ADMIN_SESSION_SECRET") ?? adminPassword;
}

function signAdminSession(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function isAdminAuthConfigured() {
  return getAdminPassword() !== null;
}

export function isValidAdminPassword(password: string) {
  const adminPassword = getAdminPassword();
  return adminPassword !== null && safeEqual(password, adminPassword);
}

export function createAdminSessionToken() {
  const adminPassword = getAdminPassword();
  if (!adminPassword) return null;

  const expiresAt = Date.now() + adminSessionMaxAgeSeconds * 1000;
  const payload = `${adminSessionTokenVersion}.${expiresAt}`;
  const signature = signAdminSession(payload, getSessionSecret(adminPassword));

  return `${payload}.${signature}`;
}

function isValidAdminSessionToken(token: string | undefined) {
  if (!token || token.length > 256) return false;

  const [version, expiresAtValue, signature, extra] = token.split(".");
  if (extra || version !== adminSessionTokenVersion || !expiresAtValue || !signature) return false;

  const expiresAt = Number(expiresAtValue);
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= Date.now()) return false;

  const adminPassword = getAdminPassword();
  if (!adminPassword) return false;

  const expectedSignature = signAdminSession(`${version}.${expiresAtValue}`, getSessionSecret(adminPassword));
  return safeEqual(signature, expectedSignature);
}

export async function hasAdminSession() {
  const cookieStore = await cookies();
  return isValidAdminSessionToken(cookieStore.get(adminSessionCookie)?.value);
}
