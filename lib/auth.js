import { cookies } from 'next/headers';
import { verifyToken } from './jwt.js';

/**
 * Verifies admin session from cookie.
 * Works seamlessly in Next.js 13, 14, 15, and 16.
 * @returns {Promise<object|null>} decoded token payload or null
 */
export async function verifyAdmin() {
  try {
    const cookieStoreOrPromise = cookies();
    const cookieStore = cookieStoreOrPromise instanceof Promise 
      ? await cookieStoreOrPromise 
      : cookieStoreOrPromise;
      
    const token = cookieStore.get('admin_session')?.value;
    if (!token) {
      return null;
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return null;
    }

    return payload;
  } catch (error) {
    console.error('Error verifying admin session:', error);
    return null;
  }
}
