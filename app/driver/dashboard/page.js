'use client';

import Image from 'next/image';
import Script from 'next/script';
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
  const [assignedBus, setAssignedBus] = useState(null);
  const [activeTrip, setActiveTrip] = useState(null);
  const [tripLoading, setTripLoading] = useState(false);
  const [tripMessage, setTripMessage] = useState('');
  const [busStatus, setBusStatus] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [locationSharing, setLocationSharing] = useState(false);
  const [locationMessage, setLocationMessage] = useState('');
  const [tripHistory, setTripHistory] = useState([]);
  const [tripStats, setTripStats] = useState({
    totalTrips: 0,
    completedTrips: 0,
    totalDistance: 0,
    averageDuration: 0,
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  async function loadAssignedBus() {
    try {
      const response = await fetch(
        '/api/driver/bus',
        {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        }
      );

      const data = await response.json();

      if (response.ok) {
        setAssignedBus(data.bus);

        if (data.bus) {
          setBusStatus(data.bus.status);
        }
      }
    } catch (error) {
      console.error(
        'Loading assigned bus failed:',
        error
      );
    }
  }

  async function loadTripHistory() {
    try {
      const response = await fetch(
        '/api/driver/trips',
        {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        }
      );

      const data = await response.json();

      if (response.ok) {
        const trips = data.trips || [];

        setTripHistory(trips);

        const completed =
          trips.filter(
            (trip) =>
              trip.status === 'completed'
          );

        const totalDistance =
          completed.reduce(
            (sum, trip) =>
              sum + (trip.distance || 0),
            0
          );

        const averageDuration =
          completed.length
            ? Math.round(
                completed.reduce(
                  (sum, trip) =>
                    sum +
                    (trip.actualDuration || 0),
                  0
                ) / completed.length
              )
            : 0;

        setTripStats({
          totalTrips: trips.length,
          completedTrips: completed.length,
          totalDistance,
          averageDuration,
        });
      }
    } catch (error) {
      console.error(
        'Trip history loading failed:',
        error
      );
    }
  }
  async function loadNotifications(showLoading = false) {
    try {
      if (showLoading) {
        setNotificationsLoading(true);
      }

      const response = await fetch(
        '/api/notifications',
        {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setNotifications(
          data.notifications || []
        );

        setUnreadCount(
          data.unreadCount || 0
        );
      } else {
        console.error(
          'Notification loading failed:',
          data
        );
      }
    } catch (error) {
      console.error(
        'Notification loading error:',
        error
      );
    } finally {
      if (showLoading) {
        setNotificationsLoading(false);
      }
    }
  }


  async function markNotificationAsRead(
    notificationId
  ) {
    try {
      const response = await fetch(
        `/api/notifications/${notificationId}`,
        {
          method: 'PATCH',
          credentials: 'include',
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(
          'Mark notification as read failed:',
          data
        );
        return;
      }

      setNotifications(
        (currentNotifications) =>
          currentNotifications.map(
            (notification) =>
              notification._id ===
              notificationId
                ? {
                    ...notification,
                    read: true,
                  }
                : notification
          )
      );

      setUnreadCount(
        (currentCount) =>
          Math.max(0, currentCount - 1)
      );
    } catch (error) {
      console.error(
        'Mark notification as read error:',
        error
      );
    }
  }


  function formatNotificationDate(
    dateValue
  ) {
    if (!dateValue) {
      return '';
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return date.toLocaleString([], {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  }
  /*
   * Initialize OneSignal for the logged-in driver.
   */
  useEffect(() => {
    async function loadUser() {
      try {
        let response = await fetch(
          '/api/auth/me',
          {
            method: 'GET',
            credentials: 'include',
            cache: 'no-store',
          }
        );

        if (response.status === 401) {
          const refreshResponse =
            await fetch(
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

          response = await fetch(
            '/api/auth/me',
            {
              method: 'GET',
              credentials: 'include',
              cache: 'no-store',
            }
          );
        }

        const data =
          await response.json();

        if (!response.ok) {
          setError(
            data.error ||
              'Unable to load your account.'
          );
          return;
        }

        if (data.user.role !== 'driver') {
          router.replace(
            data.redirectTo ||
              '/login'
          );
          return;
        }

        setUser(data.user);
        await loadNotifications(true);
        /*
         * OneSignal setup.
         *
         * The SDK is loaded using the <Script>
         * component below.
         */
        try {
          if (
            typeof window !==
            'undefined'
          ) {
            window.OneSignalDeferred =
              window.OneSignalDeferred ||
              [];

            if (
              !window.__smartTransitOneSignalInitStarted
            ) {
              window.__smartTransitOneSignalInitStarted =
                true;

              window.OneSignalDeferred.push(
                async function (
                  OneSignal
                ) {
                  try {
                    await OneSignal.init({
                      appId:
                        'a11bd766-0b39-4a44-85bc-a952fddba44c',

                      safari_web_id:
                        'web.onesignal.auto.21fd847c-14e1-48c8-a072-78170e2e9023',

                      notifyButton: {
                        enable: true,
                      },

                      allowLocalhostAsSecureOrigin:
                        true,
                    });

                    console.log(
                      'OneSignal initialized successfully.'
                    );

                    /*
                     * Get the real subscription ID
                     * generated by OneSignal.
                     */
                    const subscriptionId =
                      OneSignal
                        .User
                        .PushSubscription
                        .id;

                    if (
                      subscriptionId
                    ) {
                      console.log(
                        'OneSignal subscription ID:',
                        subscriptionId
                      );

                      /*
                       * Send the subscription ID
                       * to SmartTransit.
                       *
                       * The API uses the currently
                       * logged-in user's access token,
                       * so this will attach the
                       * subscription to Karim.
                       */
                      const subscribeResponse =
                        await fetch(
                          '/api/notifications/subscribe',
                          {
                            method: 'POST',

                            headers: {
                              'Content-Type':
                                'application/json',
                            },

                            credentials:
                              'include',

                            body:
                              JSON.stringify({
                                subscriptionId,
                              }),
                          }
                        );

                      const subscribeData =
                        await subscribeResponse.json();

                      if (
                        subscribeResponse.ok
                      ) {
                        console.log(
                          'OneSignal subscription connected to SmartTransit user.',
                          subscribeData
                        );
                      } else {
                        console.error(
                          'OneSignal subscription connection failed:',
                          subscribeData
                        );
                      }
                    } else {
                      console.log(
                        'OneSignal subscription ID not available yet.'
                      );

                      /*
                       * Ask for notification permission
                       * if a subscription has not yet
                       * been created.
                       */
                      try {
                        await OneSignal
                          .Notifications
                          .requestPermission();

                        const newSubscriptionId =
                          OneSignal
                            .User
                            .PushSubscription
                            .id;

                        if (
                          newSubscriptionId
                        ) {
                          console.log(
                            'OneSignal subscription created:',
                            newSubscriptionId
                          );

                          const subscribeResponse =
                            await fetch(
                              '/api/notifications/subscribe',
                              {
                                method: 'POST',

                                headers: {
                                  'Content-Type':
                                    'application/json',
                                },

                                credentials:
                                  'include',

                                body:
                                  JSON.stringify({
                                    subscriptionId:
                                      newSubscriptionId,
                                  }),
                              }
                            );

                          const subscribeData =
                            await subscribeResponse.json();

                          if (
                            subscribeResponse.ok
                          ) {
                            console.log(
                              'OneSignal subscription connected to SmartTransit user.',
                              subscribeData
                            );
                          } else {
                            console.error(
                              'OneSignal subscription connection failed:',
                              subscribeData
                            );
                          }
                        }
                      } catch (
                        permissionError
                      ) {
                        console.error(
                          'OneSignal permission request failed:',
                          permissionError
                        );
                      }
                    }
                  } catch (
                    oneSignalInitError
                  ) {
                    console.error(
                      'OneSignal initialization failed:',
                      oneSignalInitError
                    );
                  }
                }
              );
            }
          }
        } catch (
          oneSignalError
        ) {
          console.error(
            'OneSignal setup failed:',
            oneSignalError
          );
        }

        await loadAssignedBus();
        await loadTripHistory();
      } catch (error) {
        console.error(
          'Driver dashboard request failed:',
          error
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

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      loadNotifications(false);
    }, 10000);

    return () => clearInterval(intervalId);
  }, [user]);

  async function updateLocation(
    latitude,
    longitude
  ) {
    try {
      const response =
        await fetch(
          '/api/driver/location',
          {
            method: 'PUT',

            headers: {
              'Content-Type':
                'application/json',
            },

            credentials:
              'include',

            body: JSON.stringify({
              latitude,
              longitude,
            }),
          }
        );

      const data =
        await response.json();

      if (response.ok) {
        setLocationMessage(
          'Location updated'
        );
      } else {
        setLocationMessage(
          data.error ||
            'Location update failed'
        );
      }
    } catch (error) {
      console.error(
        'Location update error:',
        error
      );

      setLocationMessage(
        'Location update failed'
      );
    }
  }

  function startLocationSharing() {
    if (!navigator.geolocation) {
      setLocationMessage(
        'GPS not supported'
      );
      return;
    }

    setLocationSharing(true);

    navigator.geolocation.watchPosition(
      (position) => {
        const {
          latitude,
          longitude,
        } = position.coords;

        updateLocation(
          latitude,
          longitude
        );
      },

      (error) => {
        console.error(
          'GPS error:',
          error
        );

        setLocationMessage(
          'GPS permission denied'
        );
      },

      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000,
      }
    );
  }

  async function startTrip() {
    try {
      setTripLoading(true);
      setTripMessage('');

      const response =
        await fetch(
          '/api/driver/trips',
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            credentials:
              'include',

            body: JSON.stringify({
              busId:
                assignedBus._id,

              routeId:
                assignedBus
                  .routeId
                  ._id,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setTripMessage(
          data.error ||
            'Unable to start trip'
        );
        return;
      }

      setActiveTrip(data.trip);

      setTripMessage(
        'Trip started successfully'
      );
    } catch (error) {
      console.error(
        'Start trip failed:',
        error
      );

      setTripMessage(
        'Something went wrong'
      );
    } finally {
      setTripLoading(false);
    }
  }

  async function endTrip() {
    try {
      setTripLoading(true);
      setTripMessage('');

      const response =
        await fetch(
          '/api/driver/trips',
          {
            method: 'PUT',

            headers: {
              'Content-Type':
                'application/json',
            },

            credentials:
              'include',

            body: JSON.stringify({
              tripId:
                activeTrip._id,

              distance: 12.5,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setTripMessage(
          data.error ||
            'Unable to end trip'
        );
        return;
      }

      setActiveTrip(null);

      setTripMessage(
        'Trip completed successfully'
      );
    } catch (error) {
      console.error(
        'End trip failed:',
        error
      );

      setTripMessage(
        'Something went wrong'
      );
    } finally {
      setTripLoading(false);
    }
  }

  async function updateBusStatus() {
    try {
      setStatusLoading(true);
      setStatusMessage('');

      const response =
        await fetch(
          '/api/driver/status',
          {
            method: 'PUT',

            headers: {
              'Content-Type':
                'application/json',
            },

            credentials:
              'include',

            body: JSON.stringify({
              status: busStatus,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setStatusMessage(
          data.error ||
            'Unable to update status'
        );
        return;
      }

      setAssignedBus(data.bus);

      setStatusMessage(
        'Status updated successfully'
      );
    } catch (error) {
      console.error(
        'Status update failed:',
        error
      );

      setStatusMessage(
        'Something went wrong'
      );
    } finally {
      setStatusLoading(false);
    }
  }

  async function handleLogout() {
    try {
      setIsLoggingOut(true);

      await fetch(
        '/api/auth/logout',
        {
          method: 'POST',
          credentials: 'include',
        }
      );
    } catch (error) {
      console.error(
        'Logout request failed:',
        error
      );
    } finally {
      router.replace('/login');
      router.refresh();
      setIsLoggingOut(false);
    }
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p>
          Loading driver dashboard...
        </p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <section className="rounded-xl bg-white p-8 shadow">
          <h2 className="text-xl font-bold">
            Unable to open dashboard
          </h2>

          <p className="mt-3 text-sm text-red-600">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              router.replace('/login')
            }
            className="mt-6 rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white"
          >
            Return to login
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">

      <Script
        src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
        strategy="afterInteractive"
      />

      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              SmartTransit
            </h1>

            <p className="text-sm text-slate-500">
              Driver Dashboard
            </p>
          </div>

          <div className="flex items-center gap-4">

            {/* Notification bell */}
            <div className="relative">

              <button
                type="button"
                onClick={() => {
                  const opening =
                    !notificationsOpen;

                  setNotificationsOpen(opening);

                  if (opening) {
                    loadNotifications(true);
                  }
                }}
                aria-label="Notifications"
                aria-expanded={notificationsOpen}
                className="relative flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-6 w-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 17h5l-1.4-1.6A2 2 0 0 1 18 14.1V11a6 6 0 1 0-12 0v3.1a2 2 0 0 1-.6 1.3L4 17h5m6 0a3 3 0 0 1-6 0m6 0H9"
                  />
                </svg>

                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white">
                    {unreadCount > 99
                      ? '99+'
                      : unreadCount}
                  </span>
                )}
              </button>


              {notificationsOpen && (
                <div className="absolute right-0 z-50 mt-3 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">

                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">

                    <div>
                      <h3 className="font-bold text-slate-900">
                        Notifications
                      </h3>

                      <p className="text-xs text-slate-500">
                        {unreadCount} unread
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        loadNotifications(true)
                      }
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                    >
                      Refresh
                    </button>

                  </div>


                  {/* Notification list */}
                  <div className="max-h-96 overflow-y-auto">

                    {notificationsLoading ? (

                      <div className="px-4 py-8 text-center text-sm text-slate-500">
                        Loading notifications...
                      </div>

                    ) : notifications.length === 0 ? (

                      <div className="px-4 py-8 text-center text-sm text-slate-500">
                        No notifications.
                      </div>

                    ) : (

                      notifications.map(
                        (notification) => (

                          <button
                            key={notification._id}
                            type="button"
                            onClick={() => {
                              if (
                                !notification.read
                              ) {
                                markNotificationAsRead(
                                  notification._id
                                );
                              }
                            }}
                            className={`block w-full border-b border-slate-100 px-4 py-4 text-left transition hover:bg-slate-50 ${
                              notification.read
                                ? 'bg-white'
                                : 'bg-emerald-50/70'
                            }`}
                          >

                            <div className="flex gap-3">

                              {/* Status dot */}
                              <div
                                className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                                  notification.read
                                    ? 'bg-slate-300'
                                    : 'bg-emerald-600'
                                }`}
                              />

                              <div className="min-w-0 flex-1">

                                <div className="flex items-start justify-between gap-2">

                                  <p className="text-sm font-semibold text-slate-900">
                                    {notification.title ||
                                      notification.type ||
                                      'Notification'}
                                  </p>

                                  {!notification.read && (
                                    <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                                      New
                                    </span>
                                  )}

                                </div>

                                <p className="mt-1 text-sm leading-5 text-slate-600">
                                  {notification.message}
                                </p>

                                <p className="mt-2 text-[11px] text-slate-400">
                                  {formatNotificationDate(
                                    notification.createdAt
                                  )}
                                </p>

                              </div>

                            </div>

                          </button>

                        )
                      )

                    )}

                  </div>

                </div>
              )}

            </div>


            {/* Driver profile */}
            {user?.profileImageUrl ? (

              <Image
                src={user.profileImageUrl}
                alt={`${user.name}'s profile`}
                width={48}
                height={48}
                className="h-12 w-12 rounded-full object-cover"
              />

            ) : (

              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-700">
                {getInitials(user?.name)}
              </div>

            )}


            {/* Logout */}
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="rounded-lg bg-red-600 px-5 py-2.5 font-semibold text-white"
            >
              {isLoggingOut
                ? 'Signing out...'
                : 'Sign out'}
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-10">

        <div className="rounded-2xl bg-gradient-to-r from-emerald-700 to-emerald-500 p-8 text-white">

          <h2 className="text-3xl font-bold">
            Welcome, {user?.name}
          </h2>

          <p className="mt-2 text-emerald-100">
            Manage your assigned bus,
            trips, and operational
            activities.
          </p>

        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">

          <article className="rounded-2xl bg-white p-6 shadow-sm">

            <h3 className="text-lg font-bold text-slate-900">
              Driver Information
            </h3>

            <p className="mt-3 text-sm text-slate-700">
              {user?.email}
            </p>

            <p className="mt-2 text-sm text-slate-700">
              License:
              {' '}
              {user?.driverDetails?.licenseNo}
            </p>

          </article>

          <article className="rounded-2xl bg-white p-6 shadow-sm">

            <h3 className="text-lg font-bold text-slate-900">
              Assigned Bus
            </h3>

            {assignedBus ? (

              <div className="mt-4 space-y-2 text-sm text-slate-700">

                <p>
                  <strong>
                    Bus Number:
                  </strong>
                  {' '}
                  {assignedBus.busNumber}
                </p>

                <p>
                  <strong>
                    Capacity:
                  </strong>
                  {' '}
                  {assignedBus.capacity}
                </p>

                <p>
                  <strong>
                    Route:
                  </strong>
                  {' '}
                  {assignedBus.routeId?.name ||
                    'Not assigned'}
                </p>

                <p>
                  <strong>
                    Status:
                  </strong>
                  {' '}
                  {assignedBus.status}
                </p>

                <div className="mt-4">

                  <select
                    value={busStatus}
                    onChange={(e) =>
                      setBusStatus(
                        e.target.value
                      )
                    }
                    className="rounded-lg border px-3 py-2 text-sm"
                  >

                    <option value="active">
                      Running
                    </option>

                    <option value="delayed">
                      Delayed
                    </option>

                    <option value="maintenance">
                      Maintenance
                    </option>

                    <option value="breakdown">
                      Breakdown
                    </option>

                  </select>

                  <button
                    type="button"
                    onClick={
                      updateBusStatus
                    }
                    disabled={
                      statusLoading
                    }
                    className="ml-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {statusLoading
                      ? 'Updating...'
                      : 'Update'}
                  </button>

                  {statusMessage && (
                    <p className="mt-2 text-sm text-emerald-700">
                      {statusMessage}
                    </p>
                  )}

                </div>

                <div className="mt-5">

                  <button
                    type="button"
                    onClick={
                      startLocationSharing
                    }
                    disabled={
                      locationSharing
                    }
                    className="rounded-lg bg-purple-600 px-4 py-2 font-semibold text-white disabled:opacity-50"
                  >
                    {locationSharing
                      ? 'Sharing Location...'
                      : 'Start Live Location'}
                  </button>

                  {locationMessage && (
                    <p className="mt-2 text-sm text-emerald-700">
                      {locationMessage}
                    </p>
                  )}

                </div>

              </div>

            ) : (

              <p className="mt-3 text-sm text-slate-500">
                No bus assigned
              </p>

            )}

          </article>

          <article className="rounded-2xl bg-white p-6 shadow-sm">

            <h3 className="text-lg font-bold text-slate-900">
              Trip Management
            </h3>

            <p className="mt-3 text-sm text-slate-600">
              Start trips, update status,
              and maintain trip records.
            </p>

            {tripMessage && (
              <p className="mt-3 text-sm text-emerald-700">
                {tripMessage}
              </p>
            )}

            {!activeTrip ? (

              <button
                type="button"
                onClick={startTrip}
                disabled={
                  tripLoading ||
                  !assignedBus
                }
                className="mt-5 rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white disabled:opacity-50"
              >
                {tripLoading
                  ? 'Starting...'
                  : 'Start Trip'}
              </button>

            ) : (

              <button
                type="button"
                onClick={endTrip}
                disabled={
                  tripLoading
                }
                className="mt-5 rounded-lg bg-red-600 px-4 py-2 font-semibold text-white disabled:opacity-50"
              >
                {tripLoading
                  ? 'Ending...'
                  : 'End Trip'}
              </button>

            )}

          </article>

        </div>

        <div className="mt-6">

          <article className="rounded-2xl bg-white p-6 shadow-sm">

            <h3 className="text-lg font-bold text-slate-900">
              Trip Performance
            </h3>

            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">

              <div className="rounded-lg bg-slate-100 p-4">
                <p className="text-slate-500">
                  Total Trips
                </p>

                <p className="text-xl font-bold text-slate-900">
                  {tripStats.totalTrips}
                </p>
              </div>

              <div className="rounded-lg bg-slate-100 p-4">
                <p className="text-slate-500">
                  Completed
                </p>

                <p className="text-xl font-bold text-slate-900">
                  {tripStats.completedTrips}
                </p>
              </div>

              <div className="rounded-lg bg-slate-100 p-4">
                <p className="text-slate-500">
                  Distance
                </p>

                <p className="text-xl font-bold text-slate-900">
                  {tripStats.totalDistance} km
                </p>
              </div>

              <div className="rounded-lg bg-slate-100 p-4">
                <p className="text-slate-500">
                  Avg Duration
                </p>

                <p className="text-xl font-bold text-slate-900">
                  {tripStats.averageDuration} min
                </p>
              </div>

            </div>

          </article>

        </div>

      </section>

    </main>
  );
}