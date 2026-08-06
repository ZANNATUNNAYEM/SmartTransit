'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showResendForm, setShowResendForm] =
    useState(false);

  const [resendEmail, setResendEmail] = useState('');
  const [resendError, setResendError] = useState('');
  const [resendMessage, setResendMessage] =
    useState('');

  const [isResending, setIsResending] =
    useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));

    setError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const normalizedEmail = formData.email
      .toLowerCase()
      .trim();

    if (!normalizedEmail || !formData.password) {
      setError('Email and password are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      setResendError('');
      setResendMessage('');

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: normalizedEmail,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login failed.');

        if (
          typeof data.error === 'string' &&
          data.error
            .toLowerCase()
            .includes('verify your email')
        ) {
          setResendEmail(normalizedEmail);
          setShowResendForm(true);
        }

        return;
      }

      router.replace(data.redirectTo);
      router.refresh();
    } catch (requestError) {
      console.error(
        'Login request failed:',
        requestError
      );

      setError(
        'Unable to connect to the server. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResendVerification(event) {
    event.preventDefault();

    const normalizedEmail = resendEmail
      .toLowerCase()
      .trim();

    if (!normalizedEmail) {
      setResendError('Email address is required.');
      return;
    }

    try {
      setIsResending(true);
      setResendError('');
      setResendMessage('');

      const response = await fetch(
        '/api/auth/resend-verification',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: normalizedEmail,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setResendError(
          data.error ||
            'Verification email could not be sent.'
        );
        return;
      }

      setResendMessage(data.message);
    } catch (requestError) {
      console.error(
        'Resend verification request failed:',
        requestError
      );

      setResendError(
        'Unable to send the verification email. Please try again.'
      );
    } finally {
      setIsResending(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="text-2xl font-bold text-blue-700"
          >
            SmartTransit
          </Link>

          <h1 className="mt-5 text-3xl font-bold text-slate-900">
            Sign in
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            Access your passenger or driver dashboard
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Email address
            </label>

            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Password
            </label>

            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-blue-700 px-4 py-3 font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting
              ? 'Signing in...'
              : 'Sign in'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setShowResendForm((current) => !current);
            setResendEmail(
              formData.email.toLowerCase().trim()
            );
            setResendError('');
            setResendMessage('');
          }}
          className="mt-5 w-full text-center text-sm font-semibold text-blue-700 hover:underline"
        >
          Did not receive the verification email?
        </button>

        {showResendForm && (
          <form
            onSubmit={handleResendVerification}
            className="mt-5 space-y-4 rounded-xl border border-blue-100 bg-blue-50 p-5"
          >
            <div>
              <label
                htmlFor="resendEmail"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Registration email
              </label>

              <input
                id="resendEmail"
                type="email"
                value={resendEmail}
                onChange={(event) => {
                  setResendEmail(event.target.value);
                  setResendError('');
                  setResendMessage('');
                }}
                placeholder="you@example.com"
                required
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {resendError && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {resendError}
              </div>
            )}

            {resendMessage && (
              <div
                role="status"
                className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
              >
                {resendMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isResending}
              className="w-full rounded-lg border border-blue-700 bg-white px-4 py-3 font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isResending
                ? 'Sending verification email...'
                : 'Resend verification email'}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-slate-600">
          Do not have an account?{' '}
          <Link
            href="/register"
            className="font-semibold text-blue-700 hover:underline"
          >
            Register
          </Link>
        </p>

        <p className="mt-4 text-center text-xs leading-5 text-slate-500">
          Driver accounts can sign in only after email
          verification and administrator approval.
        </p>
      </section>
    </main>
  );
}