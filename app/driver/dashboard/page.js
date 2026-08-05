'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

function getInitials(name) {
  if (!name) {
    return 'D';
  }

  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

export default function DriverDashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    async function loadUser() {
      try {
        let response = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        });

        if (response.status === 401) {
          const refreshResponse = await fetch(
            '/api/auth/refresh',
            {
              method: 'POST',
              credentials: 'include',
            }
          );

          if (!refreshResponse.ok) {
            router.replace('/login');
            return;
          }

          response = await fetch('/api/auth/me', {
            method: 'GET',
            credentials: 'include',
            cache: 'no-store',
          });
        }

        const data = await response.json();

        if (!response.ok) {
          setError(
            data.error || 'Unable to load your account.'
          );
          return;
        }

        if (data.user.role !== 'driver') {
          router.replace(data.redirectTo || '/login');
          return;
        }

        setUser(data.user);
      } catch (requestError) {
        console.error(
          'Driver dashboard request failed:',
          requestError
        );

        setError(
          'Unable to connect to the server. Please try again.'
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();
  }, [router]);

  async function handleLogout() {
    try {
      setIsLoggingOut(true);

      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (requestError) {
      console.error(
        'Logout request failed:',
        requestError
      );
    } finally {
      router.replace('/login');
      router.refresh();
      setIsLoggingOut(false);
    }
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-slate-600">
          Loading driver dashboard...
        </p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <section className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
          <h1 className="text-2xl font-bold text-slate-900">
            Unable to open dashboard
          </h1>

          <p className="mt-3 text-sm text-red-600">
            {error}
          </p>

          <button
            type="button"
            onClick={() => router.replace('/login')}
            className="mt-6 rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800"
          >
            Return to login
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-2xl font-bold text-blue-700">
              SmartTransit
            </h1>

            <p className="text-sm text-slate-500">
              Driver Dashboard
            </p>
          </div>

          <div className="flex items-center gap-4">
            {user?.profileImageUrl ? (
              <Image
                src={user.profileImageUrl}
                alt={`${user.name}'s profile`}
                width={48}
                height={48}
                className="h-12 w-12 rounded-full object-cover ring-2 ring-emerald-100"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-700">
                {getInitials(user?.name)}
              </div>
            )}

            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="rounded-lg bg-red-600 px-5 py-2.5 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoggingOut
                ? 'Signing out...'
                : 'Sign out'}
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-col items-center gap-6 rounded-2xl bg-gradient-to-r from-emerald-700 to-emerald-500 p-8 text-center text-white shadow-lg sm:flex-row sm:text-left">
          {user?.profileImageUrl ? (
            <Image
              src={user.profileImageUrl}
              alt={`${user.name}'s profile picture`}
              width={112}
              height={112}
              priority
              className="h-28 w-28 rounded-full object-cover ring-4 ring-white/40 shadow-lg"
            />
          ) : (
            <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-white/20 text-3xl font-bold ring-4 ring-white/30">
              {getInitials(user?.name)}
            </div>
          )}

          <div>
            <p className="text-sm font-medium text-emerald-100">
              Approved driver account
            </p>

            <h2 className="mt-2 text-3xl font-bold">
              Welcome, {user?.name}
            </h2>

            <p className="mt-2 text-emerald-100">
              Manage your assigned bus, trips, and operational
              activities.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <article className="rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">
              Driver information
            </h3>

            <dl className="mt-5 space-y-4 text-sm">
              <div>
                <dt className="text-slate-500">Full name</dt>
                <dd className="font-medium text-slate-900">
                  {user?.name}
                </dd>
              </div>

              <div>
                <dt className="text-slate-500">Email</dt>
                <dd className="font-medium text-slate-900">
                  {user?.email}
                </dd>
              </div>

              <div>
                <dt className="text-slate-500">
                  Phone number
                </dt>
                <dd className="font-medium text-slate-900">
                  {user?.phone}
                </dd>
              </div>

              <div>
                <dt className="text-slate-500">
                  Driving licence
                </dt>
                <dd className="font-medium text-slate-900">
                  {user?.driverDetails?.licenseNo ||
                    'Not available'}
                </dd>
              </div>

              <div>
                <dt className="text-slate-500">
                  Transport organization
                </dt>
                <dd className="font-medium text-slate-900">
                  {user?.driverDetails?.orgName ||
                    'Not available'}
                </dd>
              </div>

              <div>
                <dt className="text-slate-500">
                  Email verification
                </dt>
                <dd className="font-medium text-green-700">
                  {user?.isEmailVerified
                    ? 'Verified'
                    : 'Not verified'}
                </dd>
              </div>

              <div>
                <dt className="text-slate-500">
                  Account status
                </dt>
                <dd className="font-medium capitalize text-green-700">
                  {user?.status}
                </dd>
              </div>
            </dl>
          </article>

          <article className="rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">
              Assigned bus
            </h3>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              Your assigned bus and route information will
              appear here.
            </p>

            <button
              type="button"
              disabled
              className="mt-6 rounded-lg bg-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-500"
            >
              No bus assigned
            </button>
          </article>

          <article className="rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">
              Trip management
            </h3>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              Start trips, end trips, and update operational
              status from this section.
            </p>

            <button
              type="button"
              disabled
              className="mt-6 rounded-lg bg-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-500"
            >
              Coming soon
            </button>
          </article>
        </div>
      </section>
    </main>
  );
}