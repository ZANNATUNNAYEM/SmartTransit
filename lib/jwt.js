import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'placeholder_jwt_secret_change_me';

function base64url(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64urlDecode(str) {
  let decodedStr = str.replace(/-/g, '+').replace(/_/g, '/');
  while (decodedStr.length % 4) {
    decodedStr += '=';
  }
  return Buffer.from(decodedStr, 'base64').toString('utf8');
}

/**
 * Signs a payload as HS256 JWT
 * @param {object} payload 
 * @param {number} expiresInSeconds (Default 24h = 86400s)
 * @returns {string} token
 */
export function signToken(payload, expiresInSeconds = 86400) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const fullPayload = { ...payload, exp };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(fullPayload));

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Verifies a HS256 JWT and returns payload if valid
 * @param {string} token 
 * @returns {object|null} payload or null if invalid
 */
export function verifyToken(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    const [encodedHeader, encodedPayload, signature] = parts;
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');

    if (signature !== expectedSignature) {
      return null;
    }

    const payload = JSON.parse(base64urlDecode(encodedPayload));
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
      return null; // token expired
    }

    return payload;
  } catch (error) {
    return null;
  }
}
