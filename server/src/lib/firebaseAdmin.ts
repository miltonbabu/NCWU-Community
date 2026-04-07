export interface DecodedGoogleToken {
  uid: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
  iss: string;
  aud: string;
  iat: number;
  exp: number;
}

function decodeBase64Url(base64Url: string): string {
  let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return Buffer.from(base64, "base64").toString("utf-8");
}

export async function verifyGoogleIdToken(
  idToken: string,
): Promise<DecodedGoogleToken> {
  const parts = idToken.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid ID token format");
  }

  const header = JSON.parse(decodeBase64Url(parts[0]));
  const payload = JSON.parse(decodeBase64Url(parts[1]));

  if (!payload.sub) {
    throw new Error("ID token has no 'sub' claim");
  }

  const validIssuers = [
    "accounts.google.com",
    "https://accounts.google.com",
    `https://securetoken.google.com/${process.env.FIREBASE_PROJECT_ID || "ncwu-community"}`,
  ];

  if (!validIssuers.includes(payload.iss)) {
    throw new Error(`Invalid issuer: ${payload.iss}`);
  }

  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error("ID token has expired");
  }

  return {
    uid: payload.sub,
    email: payload.email,
    email_verified: payload.email_verified,
    name: payload.name,
    picture: payload.picture,
    iss: payload.iss,
    aud: payload.aud,
    iat: payload.iat,
    exp: payload.exp,
  };
}

export async function initGoogleAuth(): Promise<void> {
  console.log("Google Auth initialized (local verification mode)");
}
