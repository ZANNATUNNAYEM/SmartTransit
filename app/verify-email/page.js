'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function VerifyEmailPage() {
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState(
    'Verifying your email address...'
  );

  useEffect(() => {
    async function verifyEmail() {
      try {
        const searchParams = new URLSearchParams(
          window.location.search
        );

        const token = searchParams.get('token');

        if (!token) {
          setStatus('error');
          setMessage(
            'The email verification token is missing.'
          );
          return;
        }

        const response = await fetch(
          '/api/auth/verify-email',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          setStatus('error');
          setMessage(
            data.error ||
              'Email verification could not be completed.'
          );
          return;
        }

        setStatus('success');
        setMessage(data.message);
      } catch (error) {
        console.error(
          'Email verification request failed:',
          error
        );

        setStatus('error');
        setMessage(
          'Unable to verify your email. Please try again.'
        );
      }
    }

    verifyEmail();
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
        <Link
          href="/"
          className="text-2xl font-bold text-blue-700"
        >
          SmartTransit
        </Link>

        {status === 'loading' && (
          <>
            <div className="mx-auto mt-8 h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-700" />

            <h1 className="mt-6 text-2xl font-bold text-slate-900">
              Verifying email
            </h1>

            <p className="mt-3 text-sm text-slate-600">
              {message}
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mx-auto mt-8 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl font-bold text-green-700">
              ✓
            </div>

            <h1 className="mt-6 text-2xl font-bold text-slate-900">
              Email verified
            </h1>

            <p className="mt-3 text-sm leading-6 text-green-700">
              {message}
            </p>

            <Link
              href="/login"
              className="mt-7 inline-block w-full rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white transition hover:bg-blue-800"
            >
              Continue to login
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mx-auto mt-8 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl font-bold text-red-700">
              ×
            </div>

            <h1 className="mt-6 text-2xl font-bold text-slate-900">
              Verification failed
            </h1>

            <p className="mt-3 text-sm leading-6 text-red-700">
              {message}
            </p>

            <Link
              href="/login"
              className="mt-7 inline-block w-full rounded-lg bg-slate-800 px-5 py-3 font-semibold text-white transition hover:bg-slate-900"
            >
              Return to login
            </Link>
          </>
        )}
      </section>
    </main>
  );
}