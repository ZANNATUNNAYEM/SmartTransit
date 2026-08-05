import crypto from 'node:crypto';

const ACCESS_TOKEN_EXPIRY_SECONDS = 15 * 60; // 15 minutes
const REFRESH_TOKEN_EXPIRY_SECONDS = 7 * 24 * 60 * 60; // 7 days

function getSecret(environmentVariableName) {
  const secret = process.env[environmentVariableName];

  if (
    !secret ||
    secret.startsWith('placeholder_') ||
    secret.includes('change_me')
  ) {
    throw new Error(
      `${environmentVariableName} is missing or insecure. Add a secure value to .env.local.`
    );
  }

  return secret;
}

function encodeBase64Url(value) {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function decodeBase64Url(value) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function createSignature(encodedHeader, encodedPayload, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');
}

function safelyCompareSignatures(receivedSignature, expectedSignature) {
  const receivedBuffer = Buffer.from(receivedSignature, 'utf8');
  const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

  if (receivedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
}

function signJwt(payload, secret, expiresInSeconds, tokenType) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new TypeError('JWT payload must be an object');
  }

  const issuedAt = Math.floor(Date.now() / 1000);

  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const completePayload = {
    ...payload,
    tokenType,
    iat: issuedAt,
    exp: issuedAt + expiresInSeconds,
  };

  const encodedHeader = encodeBase64Url(JSON.stringify(header));
  const encodedPayload = encodeBase64Url(
    JSON.stringify(completePayload)
  );

  const signature = createSignature(
    encodedHeader,
    encodedPayload,
    secret
  );

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

function verifyJwt(token, secret, expectedTokenType) {
  try {
    if (typeof token !== 'string' || !token.trim()) {
      return null;
    }

    const parts = token.split('.');

    if (parts.length !== 3) {
      return null;
    }

    const [encodedHeader, encodedPayload, receivedSignature] =
      parts;

    const header = JSON.parse(decodeBase64Url(encodedHeader));

    if (header.alg !== 'HS256' || header.typ !== 'JWT') {
      return null;
    }

    const expectedSignature = createSignature(
      encodedHeader,
      encodedPayload,
      secret
    );

    if (
      !safelyCompareSignatures(
        receivedSignature,
        expectedSignature
      )
    ) {
      return null;
    }

    const payload = JSON.parse(decodeBase64Url(encodedPayload));
    const currentTime = Math.floor(Date.now() / 1000);

    if (
      typeof payload.exp !== 'number' ||
      currentTime >= payload.exp
    ) {
      return null;
    }

    if (
      expectedTokenType &&
      payload.tokenType !== expectedTokenType
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function signAccessToken(
  payload,
  expiresInSeconds = ACCESS_TOKEN_EXPIRY_SECONDS
) {
  return signJwt(
    payload,
    getSecret('JWT_SECRET'),
    expiresInSeconds,
    'access'
  );
}

export function signRefreshToken(
  payload,
  expiresInSeconds = REFRESH_TOKEN_EXPIRY_SECONDS
) {
  return signJwt(
    payload,
    getSecret('JWT_REFRESH_SECRET'),
    expiresInSeconds,
    'refresh'
  );
}

export function verifyAccessToken(token) {
  return verifyJwt(
    token,
    getSecret('JWT_SECRET'),
    'access'
  );
}

export function verifyRefreshToken(token) {
  return verifyJwt(
    token,
    getSecret('JWT_REFRESH_SECRET'),
    'refresh'
  );
}

/*
 * Backward-compatible functions used by the existing admin
 * authentication code. The default remains 24 hours.
 */
export function signToken(payload, expiresInSeconds = 86400) {
  return signAccessToken(payload, expiresInSeconds);
}

export function verifyToken(token) {
  return verifyAccessToken(token);
}