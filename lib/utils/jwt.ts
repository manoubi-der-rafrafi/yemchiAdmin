export type JwtPayload = {
  exp?: number;
  role?: string;
  roles?: string[];
  authorities?: string[];
  sub?: string;
  email?: string;
  [key: string]: unknown;
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const base64UrlToBytes = (input: string) => {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const bytesToBase64Url = (bytes: Uint8Array) => {
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const timingSafeEqual = (a: Uint8Array, b: Uint8Array) => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
};

export const verifyJwt = async (
  token: string,
  secret: string
): Promise<JwtPayload | null> => {
  try {
    const [header, payload, signature] = token.split(".");
    if (!header || !payload || !signature) return null;

    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const expectedSignature = new Uint8Array(
      await crypto.subtle.sign("HMAC", key, encoder.encode(`${header}.${payload}`))
    );
    const providedSignature = base64UrlToBytes(signature);

    if (!timingSafeEqual(expectedSignature, providedSignature)) {
      return null;
    }

    const decodedPayload = decoder.decode(base64UrlToBytes(payload));
    const parsed = JSON.parse(decodedPayload) as JwtPayload;

    if (parsed.exp && Date.now() / 1000 > parsed.exp) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};
