import crypto from "crypto";

const DEFAULT_EXP_SECONDS = 30 * 24 * 60 * 60; // 30 hari

export type MobileTokenPayload = {
  employeeId: number;
  email: string;
  exp: number; // unix timestamp (detik)
};

function getSecret() {
  const secret = process.env.MOBILE_JWT_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      "MOBILE_JWT_SECRET atau JWT_SECRET belum diset di environment (.env)"
    );
  }
  return secret;
}

function base64UrlEncode(input: string | Buffer) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(input: string) {
  const padLength = (4 - (input.length % 4)) % 4;
  const padded = input.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(padLength);
  return Buffer.from(padded, "base64").toString("utf8");
}

export function signEmployeeToken(
  employeeId: number,
  email: string,
  options?: { expiresInSeconds?: number }
): string {
  const secret = getSecret();
  const expSeconds = options?.expiresInSeconds ?? DEFAULT_EXP_SECONDS;
  const payload: MobileTokenPayload = {
    employeeId,
    email,
    exp: Math.floor(Date.now() / 1000) + expSeconds,
  };

  const payloadJson = JSON.stringify(payload);
  const payloadB64 = base64UrlEncode(payloadJson);

  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(payloadB64);
  const signature = base64UrlEncode(hmac.digest());

  return `${payloadB64}.${signature}`;
}

export function verifyEmployeeToken(token: string): MobileTokenPayload | null {
  try {
    const secret = getSecret();
    const parts = token.split(".");
    if (parts.length !== 2) return null;

    const [payloadB64, signature] = parts;

    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(payloadB64);
    const expectedSig = base64UrlEncode(hmac.digest());

    if (signature !== expectedSig) return null;

    const payloadJson = base64UrlDecode(payloadB64);
    const payload = JSON.parse(payloadJson) as MobileTokenPayload;

    if (!payload.exp || typeof payload.employeeId !== "number") return null;
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) return null;

    return payload;
  } catch {
    return null;
  }
}
