'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MapView from '@/components/MapView';
function getInitials(name) {
  if (!name) {
    return 'P';
  }

  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

export default function PassengerDashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Smart Route Planning states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  const [favorites, setFavorites] = useState({
    favoriteRoutes: [],
    favoriteStops: [],
  });

  const [eta, setEta] = useState(null);

  const [nearbyStops, setNearbyStops] = useState([]);

  const [isFindingStops, setIsFindingStops] = useState(false);

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
            data.error ||
            'Unable to load your account.'
          );
          return;
        }


        if (data.user.role !== 'passenger') {
          router.replace(
            data.redirectTo || '/login'
          );
          return;
        }


        setUser(data.user);
        await loadFavorites();
      } catch (requestError) {

        console.error(
          'Passenger dashboard request failed:',
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

  async function loadETA(busId) {
    try {
      const response = await fetch(
        `/api/passenger/eta?busId=${busId}`,
        {
          cache: 'no-store',
        }
      );

      const data = await response.json();

      if (response.ok) {
        setEta(data);
      }

    } catch (error) {
      console.error(
        'Loading ETA failed:',
        error
      );
    }
  }

  async function handleSearch() {

    if (!searchQuery.trim()) {
      return;
    }


    try {

      setIsSearching(true);


      const response = await fetch(
        `/api/passenger/search?query=${encodeURIComponent(searchQuery)}`,
        {
          method: 'GET',
          cache: 'no-store',
        }
      );


      const data = await response.json();


      if (!response.ok) {

        console.error(
          'Search failed:',
          data.error
        );

        return;
      }


      setSearchResults(data);

      if (data.buses.length > 0) {
        await loadETA(
          data.buses[0]._id
        );
      }


    } catch (error) {

      console.error(
        'Passenger search failed:',
        error
      );


    } finally {

      setIsSearching(false);

    }

  }

  async function findNearbyStops() {

    if (typeof window === 'undefined') {
      return;
    }


    if (!navigator.geolocation) {
      alert(
        'Geolocation is not supported by your browser'
      );
      return;
    }
    setIsFindingStops(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat =
            position.coords.latitude;
          const lng =
            position.coords.longitude;
          const response =
            await fetch(
              `/api/passenger/nearby-stops?lat=${lat}&lng=${lng}`,
              {
                cache:'no-store'
              }
            );
          const data =
            await response.json();

          if (response.ok) {
            setNearbyStops(
              data.stops
            );
          }

        } catch(error) {
          console.error(
            'Nearby stop search failed:',
            error
          );
        } finally {
          setIsFindingStops(false);
        }
      },
      (error)=>{
        console.error(
          'GPS error:',
          error
        );
        alert(
          'Please allow location access to find nearby bus stops.'
        );
        setIsFindingStops(false);
      }
    );
  }

  async function loadFavorites() {
    try {
      const response = await fetch(
        '/api/passenger/favorites',
        {
          cache: 'no-store',
          credentials: 'include',
        }
      );

      const data =
        await response.json();

      if (response.ok) {
        setFavorites(data);
      }

    } catch (error) {
      console.error(
        'Loading favorites failed:',
        error
      );
    }
  }

  async function saveRoute(routeId) {
    try {
      const response = await fetch(
        '/api/passenger/favorites/route',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            routeId,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        await loadFavorites();
        alert('Route saved to favourites');
      } else {
        alert(data.error);
      }

    } catch (error) {
      console.error(
        'Saving route failed:',
        error
      );
    }
  }


  async function saveStop(stopId) {
    try {
      const response = await fetch(
        '/api/passenger/favorites/stop',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            stopId,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        await loadFavorites();
        alert('Stop saved to favourites');
      } else {
        alert(data.error);
      }

    } catch (error) {
      console.error(
        'Saving stop failed:',
        error
      );
    }
  }

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
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-lg font-semibold text-slate-700">
          Loading passenger dashboard...
        </p>
      </main>
    );
  }


  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <section className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">

          <h1 className="text-2xl font-bold text-slate-900">
            Unable to open dashboard
          </h1>


          <p className="mt-3 text-sm text-red-600">
            {error}
          </p>


          <button
            type="button"
            onClick={() =>
              router.replace('/login')
            }
            className="mt-6 rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800"
          >
            Return to login
          </button>

        </section>
      </main>
    );
  }



  return (
    <main className="min-h-screen bg-slate-50">

      <header className="border-b bg-white shadow-sm">

        <div className="mx-auto flex w-full max-w-screen-2xl items-center justify-between px-6 py-5">


          <div>

            <h1 className="text-2xl font-bold text-blue-700">
              SmartTransit
            </h1>


            <p className="text-sm text-slate-500">
              Passenger Dashboard
            </p>

          </div>



          <div className="flex items-center gap-4">


            {user?.profileImageUrl ? (

              <Image
                src={user.profileImageUrl}
                alt={`${user.name}'s profile`}
                width={48}
                height={48}
                className="h-12 w-12 rounded-full object-cover ring-2 ring-blue-100"
              />

            ) : (

              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">

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





      <section className="mx-auto w-full max-w-screen-2xl px-6 py-10">


        <div className="flex flex-col items-center gap-6 rounded-2xl bg-gradient-to-r from-blue-700 to-blue-500 p-8 text-center text-white shadow-lg sm:flex-row sm:text-left">


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

            <p className="text-sm font-medium text-blue-100">
              Welcome back
            </p>


            <h2 className="mt-2 text-3xl font-bold">
              {user?.name}
            </h2>


            <p className="mt-2 text-blue-100">
              Plan journeys and access your personalized passenger services.
            </p>


          </div>


        </div>





        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">

          <article className="rounded-2xl bg-white p-6 shadow-sm">

            <h3 className="text-lg font-bold text-slate-900">
              Nearby Bus Stops
            </h3>


            <button
              type="button"
              onClick={findNearbyStops}
              disabled={isFindingStops}
              className="mt-4 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
            >

              {isFindingStops
                ? 'Finding...'
                : 'Find Nearby Stops'}

            </button>



            {nearbyStops.length > 0 && (

              <ul className="mt-5 space-y-3">

                {nearbyStops.map((stop)=>(

                  <li
                    key={stop._id}
                    className="rounded-lg bg-slate-100 p-3 text-sm"
                  >

                    <p className="font-semibold text-slate-900">
                      📍 {stop.name}
                    </p>


                    <p className="text-slate-600">
                      {stop.distance} km away
                    </p>

                  </li>

                ))}

              </ul>

            )}

          </article>

          <article className="rounded-2xl bg-white p-6 shadow-sm">

            <h3 className="text-lg font-bold text-slate-900">
              Account information
            </h3>


            <dl className="mt-5 space-y-4 text-sm">


              <div>
                <dt className="text-slate-500">
                  Full name
                </dt>

                <dd className="font-medium text-slate-900">
                  {user?.name}
                </dd>
              </div>



              <div>
                <dt className="text-slate-500">
                  Email
                </dt>

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
              Search transportation
            </h3>


            <p className="mt-3 text-sm leading-6 text-slate-600">
              Search buses, routes, destinations, and nearby bus stops.
            </p>



            <div className="mt-5 flex gap-3">


              <input
                type="text"
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(event.target.value)
                }
                placeholder="Search bus, route, or stop"
                className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-900 placeholder:text-slate-500 outline-none focus:border-blue-500"
              />



              <button
                type="button"
                onClick={handleSearch}
                disabled={isSearching}
                className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
              >

                {isSearching
                  ? 'Searching...'
                  : 'Search'}

              </button>


            </div>



          </article>






          <article className="rounded-2xl bg-white p-6 shadow-sm">

            <h3 className="text-lg font-bold text-slate-900">
              Favourite routes & stops
            </h3>
            <div className="mt-5">
              <h4 className="font-semibold text-slate-700">
                🛣 Saved Routes
              </h4>

              {favorites.favoriteRoutes.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {favorites.favoriteRoutes.map(
                    (route) => (
                      <li
                        key={route._id}
                        className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-800"
                      >
                        {route.name}
                      </li>

                    )
                  )}

                </ul>

              ) : (

                <p className="mt-2 text-sm text-slate-500">
                  No saved routes yet.
                </p>

              )}

            </div>

            <div className="mt-6">

              <h4 className="font-semibold text-slate-700">
                📍 Saved Stops
              </h4>

              {favorites.favoriteStops.length > 0 ? (

                <ul className="mt-3 space-y-2">

                  {favorites.favoriteStops.map(
                    (stop) => (

                      <li
                        key={stop._id}
                        className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800"
                      >
                        {stop.name}
                      </li>

                    )
                  )}

                </ul>

              ) : (

                <p className="mt-2 text-sm text-slate-500">
                  No saved stops yet.
                </p>

              )}

            </div>

          </article>

        </div>

        {searchResults && (

        <section className="mt-8 w-full rounded-2xl bg-white p-6 shadow-sm">


        <h3 className="text-xl font-bold text-slate-900">
          Transportation Results
        </h3>



        <div className="mt-6 grid gap-6 lg:grid-cols-2">


        {/* Left Side - Details */}

        <div className="space-y-5">


        {searchResults.buses.length > 0 && (

        <div className="rounded-xl border border-slate-200 p-5">

        <h4 className="text-lg font-bold text-slate-900">
        🚌 Bus Information
        </h4>


        <p className="mt-3 text-sm text-slate-700">
        <strong>Bus Number:</strong>{" "}
        {searchResults.buses[0].busNumber}
        </p>


        <p className="mt-2 text-sm text-slate-700">
        <strong>Status:</strong>{" "}
        {searchResults.buses[0].status}
        </p>
        {eta && (
        <>
        <p className="mt-2 text-sm text-slate-700">
        <strong>Distance Remaining:</strong>{" "}
        {eta.distanceRemaining} km
        </p>

        <p className="mt-2 text-sm text-slate-700">
        <strong>Estimated Arrival:</strong>{" "}
        {eta.etaMinutes} minutes
        </p>
        </>
        )}

        <p className="mt-2 text-sm text-slate-700">
        <strong>Driver:</strong>{" "}
        {searchResults.buses[0].driverId?.name}
        </p>


        </div>

        )}



        {searchResults.routes.length > 0 && (

        <div className="rounded-xl border border-slate-200 p-5">

        <h4 className="text-lg font-bold text-slate-900">
        🛣 Route Information
        </h4>

        <p className="mt-3 text-sm text-slate-700">
        <strong>
        Route:
        </strong>{" "}
        {searchResults.routes[0].name}
        </p>

        <p className="mt-2 text-sm text-slate-700">
        <strong>
        Distance:
        </strong>{" "}
        {searchResults.routes[0].distance} km
        </p>

        <p className="mt-2 text-sm text-slate-700">
        <strong>
        Estimated Time:
        </strong>{" "}
        {searchResults.routes[0].estimatedDuration} minutes
        </p>


        <button
        type="button"
        onClick={() =>
          saveRoute(searchResults.routes[0]._id)
        }
        className="mt-5 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
        >
        ⭐ Save Route
        </button>


        </div>

        )}




        {searchResults.routes.length > 0 && (

        <div className="rounded-xl border border-slate-200 p-5">


        <h4 className="text-lg font-bold text-slate-900">
        📍 Route Stops
        </h4>


        <ul className="mt-3 space-y-2">

        {searchResults.routes[0].stops.map(
        (stop)=>(

        <li
        key={stop._id}
        className="flex items-center justify-between text-sm text-slate-700"
        >
        <span>
        {stop.name}
        </span>

        <button
        type="button"
        onClick={() =>
          saveStop(stop._id)
        }
        className="rounded-md bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-200"
        >
        ⭐ Save
        </button>
        </li>
        )
        )}


        </ul>


        </div>

        )}


        </div>





        {/* Right Side - Map Placeholder */}

        <div className="overflow-hidden rounded-xl">

          <MapView

            busLocation={
              searchResults.buses[0]?.currentLocation
            }

            busId={
              searchResults.buses[0]?._id
            }

            stops={
              searchResults.routes[0]?.stops || []
            }

          />

        </div>



        </div>



        </section>

        )}



      </section>


    </main>
  );
}