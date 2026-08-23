'use client';

import Image from 'next/image';
import Script from 'next/script';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const MapView = dynamic(
  () => import('@/components/MapView'),
  {
    ssr: false,
  }
);

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
  const [activeMenu,setActiveMenu] = useState("dashboard");
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  // Smart Route Planning states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [recentSearches, setRecentSearches] = useState([]);
  const [isLoadingRecentSearches, setIsLoadingRecentSearches] = useState(false);
  const [travelHistory, setTravelHistory] = useState([]);
  const [emergencyReports, setEmergencyReports] = useState([]);
  const [isLoadingEmergencyReports, setIsLoadingEmergencyReports] = useState(false);
  const [lostItems, setLostItems] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [isLoadingFeedbacks, setIsLoadingFeedbacks] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackTripId, setFeedbackTripId] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isLoadingLostItems, setIsLoadingLostItems] = useState(false);
  const [showLostItemForm, setShowLostItemForm] = useState(false);
  const [lostItemDescription, setLostItemDescription] = useState('');
  const [submittingLostItem, setSubmittingLostItem] = useState(false);
  const [lostItemMessage, setLostItemMessage] = useState('');
  const [showEmergencyForm, setShowEmergencyForm] = useState(false);
  const [emergencyForm, setEmergencyForm] = useState({
    category: 'Medical Emergency',
    description: '',
  });
  const [submittingEmergency, setSubmittingEmergency] = useState(false);
  const [emergencyMessage, setEmergencyMessage] = useState('');
  const [isLoadingTravelHistory, setIsLoadingTravelHistory] = useState(false); 
  const [frequentDestinations, setFrequentDestinations] = useState([]);
  const [isLoadingFrequentDestinations, setIsLoadingFrequentDestinations] = useState(false);
  const [travelSuggestions, setTravelSuggestions] = useState([]);
  const [isLoadingTravelSuggestions, setIsLoadingTravelSuggestions] = useState(false);
  const [fromStopId, setFromStopId] = useState('');
  const [toStopId, setToStopId] = useState('');
  const [isStartingJourney, setIsStartingJourney] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const [favorites, setFavorites] = useState({
    favoriteRoutes: [],
    favoriteStops: [],
  });

  const [eta, setEta] = useState(null);

  const [nearbyStops, setNearbyStops] = useState([]);

  const [isFindingStops, setIsFindingStops] = useState(false);
  const [liveBus, setLiveBus] = useState(null);
  const [isLoadingLiveBus, setIsLoadingLiveBus] = useState(true);
  
  useEffect(() => {

    if (
      typeof window === 'undefined'
    ) {
      return;
    }


    if (
      window.__smartTransitOneSignalInitStarted
    ) {
      return;
    }


    window.__smartTransitOneSignalInitStarted =
      true;


    window.OneSignalDeferred =
      window.OneSignalDeferred || [];


    window.OneSignalDeferred.push(
      async function (OneSignal) {

        try {

          await OneSignal.init({
            appId:
              'a11bd766-0b39-4a44-85bc-a952fddba44c',

            allowLocalhostAsSecureOrigin:
              true,

            serviceWorkerPath:
              'OneSignalSDKWorker.js',

            notifyButton: {
              enable: false,
            },

            notificationClickHandlerMatch:
              'origin',

            notificationClickHandlerAction:
              'focus',

            defaultIcon:
              '/icons/notification-icon.png',
          });


          console.log(
            'OneSignal initialized successfully.'
          );

          const subscriptionId =
            OneSignal.User.PushSubscription.id;

          if (subscriptionId) {

            const response =
              await fetch(
                '/api/notifications/subscribe',
                {
                  method: 'POST',

                  headers: {
                    'Content-Type':
                      'application/json',
                  },

                  credentials: 'include',

                  body: JSON.stringify({
                    subscriptionId,
                  }),
                }
              );

            const data =
              await response.json();

            if (!response.ok) {

              console.error(
                'Connecting OneSignal subscription failed:',
                data.error
              );

            } else {

              console.log(
                'OneSignal subscription connected to SmartTransit user.'
              );

            }

          }

        } catch (error) {

          console.error(
            'OneSignal initialization failed:',
            error
          );


          window.__smartTransitOneSignalInitStarted =
            false;

        }

      }
    );


  }, []);
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
        await loadLiveBus();
        await loadRecentSearches();
        await loadTravelHistory();
        await loadEmergencyReports();
        await fetchLostItems();
        await fetchFeedbacks();
        await loadFrequentDestinations();
        await loadTravelSuggestions();
        await loadNotifications();
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
  async function loadRecentSearches() {
    try {
      setIsLoadingRecentSearches(true);

      const response = await fetch(
        '/api/passenger/recent-searches',
        {
          cache: 'no-store',
          credentials: 'include',
        }
      );

      const data = await response.json();

      if (response.ok) {
        setRecentSearches(
          data.recentSearches || []
        );
      }

    } catch (error) {

      console.error(
        'Recent searches error:',
        error
      );

    } finally {

      setIsLoadingRecentSearches(false);

    }
  }
  async function loadTravelHistory() {
    try {
      setIsLoadingTravelHistory(true);

      const response = await fetch(
        '/api/passenger/journeys',
        {
          cache: 'no-store',
          credentials: 'include',
        }
      );

      const data = await response.json();

      if (response.ok) {
        setTravelHistory(
          data.journeys || []
        );
      }

    } catch (error) {

      console.error(
        'Travel history error:',
        error
      );

    } finally {

      setIsLoadingTravelHistory(false);

    }
  }

  async function loadEmergencyReports() {

    try {

      setIsLoadingEmergencyReports(true);


      const response =
        await fetch(
          '/api/passenger/emergency-reports',
          {
            cache:'no-store',
            credentials:'include',
          }
        );


      const data =
        await response.json();


      if(response.ok){

        setEmergencyReports(
          data.reports || []
        );

      }


    } catch(error){

      console.error(
        'Emergency reports loading failed:',
        error
      );


    } finally {

      setIsLoadingEmergencyReports(false);

    }

  }  

  async function submitEmergencyReport() {

    try {

      setSubmittingEmergency(true);
      setEmergencyMessage('');


      // Get current location
      const position =
        await new Promise((resolve, reject) => {

          navigator.geolocation.getCurrentPosition(
            resolve,
            reject
          );

        });


      const latitude =
        position.coords.latitude;

      const longitude =
        position.coords.longitude;


      // Get current active journey
      const journeyResponse =
        await fetch(
          '/api/passenger/journeys',
          {
            credentials: 'include',
            cache: 'no-store',
          }
        );


      const journeyData =
        await journeyResponse.json();


      const activeJourney =
        journeyData.journeys?.find(
          (journey) =>
            journey.status === "active"
        );


      const activeBus =
        activeJourney?.busId?._id ||
        activeJourney?.busId;


      if (!activeBus) {

        setEmergencyMessage(
          'No active bus found for this journey.'
        );

        return;

      }

      let location = null;


      if(navigator.geolocation){

      await new Promise((resolve)=>{

      navigator.geolocation.getCurrentPosition(
      
      (position)=>{

      location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };

      resolve();

      },

      ()=>{
        resolve();
      }

      );

      });

      }

      const response =
        await fetch(
          '/api/passenger/emergency-reports',
          {
            method:'POST',

            headers:{
              'Content-Type':'application/json'
            },

            credentials:'include',

            body:JSON.stringify({

              busId: activeBus,

              latitude,

              longitude,

              category:
                emergencyForm.category,

              description:
                emergencyForm.description,

            })

          }
        );


      const data =
        await response.json();


      if(response.ok){

        setEmergencyMessage(
          'Emergency report submitted successfully.'
        );


        setEmergencyForm({

          category:'Medical Emergency',

          description:'',

        });


        loadEmergencyReports();


      }else{

        setEmergencyMessage(
          data.error ||
          'Unable to submit report.'
        );

      }


    } catch(error){

      console.error(
        'Emergency submission error:',
        error
      );


      setEmergencyMessage(
        'Location permission is required.'
      );


    } finally {

      setSubmittingEmergency(false);

    }

  }

  async function fetchLostItems() {

    try {

      setIsLoadingLostItems(true);


      const response =
        await fetch(
          '/api/passenger/lost-items',
          {
            cache:'no-store',
            credentials:'include',
          }
        );


      const data =
        await response.json();


      if (response.ok) {

        setLostItems(
          data.reports || []
        );

      }


    } catch(error) {

      console.error(
        'Fetch lost items error:',
        error
      );

    } finally {

      setIsLoadingLostItems(false);

    }

  }



  async function submitLostItem() {
    const journeyResponse =
      await fetch(
        '/api/passenger/journeys',
        {
          credentials: 'include',
          cache: 'no-store',
        }
      );


    const journeyData =
      await journeyResponse.json();    
    const activeJourney =
      journeyData.journeys?.find(
        (journey) =>
          journey.status === "active"
      );

    const activeBus =
      activeJourney?.busId?._id ||
      activeJourney?.busId;
    if (!lostItemDescription.trim()) {

      setLostItemMessage(
        'Please describe the lost item.'
      );

      return;

    }


    try {

      setSubmittingLostItem(true);


      const response =
        await fetch(
          '/api/passenger/lost-items',
          {
            method:'POST',

            headers:{
              'Content-Type':'application/json',
            },

            body:JSON.stringify({
              busId:activeBus,
              tripId:activeJourney?._id,
              description:
                lostItemDescription,

            }),

          }
        );


      const data =
        await response.json();


      if (response.ok) {

        setLostItemMessage(
          'Lost item report submitted successfully.'
        );


        setLostItemDescription('');


        fetchLostItems();


      } else {

        setLostItemMessage(
          data.error ||
          'Unable to submit lost item report.'
        );

      }


    } catch(error) {

      console.error(
        'Submit lost item error:',
        error
      );


      setLostItemMessage(
        'Something went wrong.'
      );


    } finally {

      setSubmittingLostItem(false);

    }

  }

  async function fetchFeedbacks() {

    try {

      setIsLoadingFeedbacks(true);


      const response =
        await fetch(
          '/api/passenger/feedback',
          {
            cache:'no-store',
            credentials:'include',
          }
        );


      const data =
        await response.json();


      if(response.ok){

        setFeedbacks(
          data.feedbacks || []
        );

      }


    } catch(error){

      console.error(
        'Fetch feedback error:',
        error
      );

    } finally {

      setIsLoadingFeedbacks(false);

    }

  }

  async function submitFeedback(){

    if(!feedbackTripId){

      setFeedbackMessage(
        'Please select a completed trip.'
      );

      return;

    }


    try{

      setSubmittingFeedback(true);


      const response =
        await fetch(
          '/api/passenger/feedback',
          {
            method:'POST',

            headers:{
              'Content-Type':'application/json',
            },

            credentials:'include',

            body:JSON.stringify({

              tripId:
                feedbackTripId,

              rating:
                feedbackRating,

              comment:
                feedbackComment,

            }),

          }
        );


      const data =
        await response.json();


      if(response.ok){

        setFeedbackMessage(
          'Feedback submitted successfully.'
        );


        setFeedbackComment('');

        setFeedbackRating(5);

        setFeedbackTripId('');


        fetchFeedbacks();


      } else {

        setFeedbackMessage(
          data.error ||
          'Unable to submit feedback.'
        );

      }


    }catch(error){

      console.error(
        'Submit feedback error:',
        error
      );


      setFeedbackMessage(
        'Something went wrong.'
      );


    }finally{

      setSubmittingFeedback(false);

    }

  }


  async function loadFrequentDestinations() {
    try {
      setIsLoadingFrequentDestinations(true);

      const response = await fetch(
        '/api/passenger/frequent-destinations',
        {
          cache: 'no-store',
          credentials: 'include',
        }
      );

      const data = await response.json();

      if (response.ok) {
        setFrequentDestinations(
          data.destinations || []
        );
      }

    } catch (error) {

      console.error(
        'Frequent destinations error:',
        error
      );

    } finally {

      setIsLoadingFrequentDestinations(false);

    }
  }
  async function loadTravelSuggestions() {
    try {
      setIsLoadingTravelSuggestions(true);

      const response = await fetch(
        '/api/passenger/travel-suggestions',
        {
          cache: 'no-store',
          credentials: 'include',
        }
      );

      const data = await response.json();

      if (response.ok) {
        setTravelSuggestions(
          data.suggestions || []
        );
      }

    } catch (error) {

      console.error(
        'Travel suggestions error:',
        error
      );

    } finally {

      setIsLoadingTravelSuggestions(false);

    }
  }
  async function loadNotifications() {
    try {
      setIsLoadingNotifications(true);

      const response = await fetch(
        '/api/notifications',
        {
          cache: 'no-store',
          credentials: 'include',
        }
      );

      const data = await response.json();

      if (response.ok) {
        setNotifications(
          data.notifications || []
        );

        setUnreadNotificationCount(
          data.unreadCount || 0
        );
      }

    } catch (error) {

      console.error(
        'Loading notifications failed:',
        error
      );

    } finally {

      setIsLoadingNotifications(false);

    }
  }
  useEffect(() => {

    if (!user) {
      return;
    }

    loadNotifications();

    const interval = setInterval(() => {
      loadNotifications();
    }, 10000);


    return () => {
      clearInterval(interval);
    };

  }, [user]);

  async function markNotificationAsRead( notificationId) {
    try {

      const response = await fetch(
        `/api/notifications/${notificationId}`,
        {
          method: 'PATCH',
          credentials: 'include',
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        console.error(
          'Mark notification as read failed:',
          data.error
        );
        return;
      }

      setNotifications((currentNotifications) =>
        currentNotifications.map(
          (notification) =>
            notification._id === notificationId
              ? {
                  ...notification,
                  read: true,
                }
              : notification
        )
      );

      setUnreadNotificationCount(
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
  async function loadLiveBus() {

    try {

      const response =
        await fetch(
          '/api/passenger/bus-location',
          {
            cache:'no-store',
          }
        );


      const data =
        await response.json();


      if(response.ok){

        setLiveBus(
          data.bus
        );

      }


    } catch(error){

      console.error(
        'Live bus loading failed:',
        error
      );

    } finally {

      setIsLoadingLiveBus(false);

    }

  }

  useEffect(() => {

    const interval =
      setInterval(
        loadLiveBus,
        10000
      );


    return () =>
      clearInterval(interval);


  }, []);


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
  async function startJourney() {
    if (!searchResults?.buses?.length) {
      return;
    }

    if (!fromStopId || !toStopId) {
      alert('Please select both your starting stop and destination.');
      return;
    }

    if (fromStopId === toStopId) {
      alert('Starting stop and destination cannot be the same.');
      return;
    }

    try {
      setIsStartingJourney(true);

      const bus = searchResults.buses[0];

      const response = await fetch(
        '/api/passenger/journeys',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            busId: bus._id,
            routeId: bus.routeId?._id,
            fromStopId,
            toStopId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.error ||
          'Unable to start journey.'
        );
        return;
      }

      await loadTravelHistory();

      setFromStopId('');
      setToStopId('');

      alert('Journey started successfully.');

    } catch (error) {

      console.error(
        'Starting journey failed:',
        error
      );

      alert(
        'Unable to start journey. Please try again.'
      );

    } finally {

      setIsStartingJourney(false);

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

  async function removeFavourite(type, id) {

    try {

      const response =
        await fetch(
          '/api/passenger/favorites',
          {
            method:'DELETE',

            headers:{
              'Content-Type':'application/json',
            },

            credentials:'include',

            body:JSON.stringify({
              type,
              id,
            }),
          }
        );


      const data =
        await response.json();


      if(response.ok){

        await loadFavorites();

      }
      else{

        alert(
          data.error ||
          'Unable to remove favourite'
        );

      }


    } catch(error){

      console.error(
        'Remove favourite error:',
        error
      );

      alert(
        'Failed to remove favourite'
      );

    }

  }

  async function updateJourneyStatus(journeyId, status) {
    try {
      const response = await fetch(
        `/api/passenger/journeys/${journeyId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            status,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Unable to update journey');
        return;
      }

      await loadTravelHistory();

      alert(`Journey ${status}`);

    } catch (error) {
      console.error(
        'Updating journey failed:',
        error
      );

      alert('Unable to update journey');
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
      <div className="flex">  
        <Script
          src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
          strategy="afterInteractive"
        />
        <aside className="
          w-64
          min-h-screen
          bg-white
          border-r
          p-5
        ">

          <h1 className="
            text-2xl
            font-bold
            text-blue-700
            mb-8
          ">
            SmartTransit
          </h1>


          <p className="
            text-xs
            text-slate-500
            mb-4
          ">
            PASSENGER DASHBOARD
          </p>


          <nav className="space-y-2">


            <button
              onClick={() => setActiveMenu("dashboard")}
              className="
                w-full
                rounded-lg
                px-4
                py-3
                text-left
                text-slate-700
                font-medium
                hover:bg-blue-50
              "
            >
              🏠 Dashboard
            </button>


            <button
              onClick={() => setActiveMenu("search")}
              className="
                w-full
                rounded-lg
                px-4
                py-3
                text-left
                text-slate-700
                font-medium
                hover:bg-blue-50
              "
            >
              🔍 Search & Tracking
            </button>


            <button
              onClick={() => setActiveMenu("favourites")}
              className="
                w-full
                rounded-lg
                px-4
                py-3
                text-left
                text-slate-700
                font-medium
                hover:bg-blue-50
              "
            >
              ⭐ Favourites
            </button>


            <button
              onClick={() => setActiveMenu("history")}
              className="
                w-full
                rounded-lg
                px-4
                py-3
                text-left
                text-slate-700
                font-medium
                hover:bg-blue-50
              "
            >
              🧳 Travel History
            </button>


            <button
              onClick={() => setActiveMenu("feedback")}
              className="
                w-full
                rounded-lg
                px-4
                py-3
                text-left
                text-slate-700
                font-medium
                hover:bg-blue-50
              "
            >
              ⭐ Feedback
            </button>


            <button
              onClick={() => setActiveMenu("lost")}
              className="
                w-full
                rounded-lg
                px-4
                py-3
                text-left
                text-slate-700
                font-medium
                hover:bg-blue-50
              "
            >
              🎒 Lost & Found
            </button>


            <button
              onClick={() => setActiveMenu("emergency")}
              className="
                w-full
                rounded-lg
                px-4
                py-3
                text-left
                text-slate-700
                font-medium
                hover:bg-blue-50
              "
            >
              🚨 Emergency Reports
            </button>


            <button
              onClick={() => setActiveMenu("account")}
              className="
                w-full
                rounded-lg
                px-4
                py-3
                text-left
                text-slate-700
                font-medium
                hover:bg-blue-50
              "
            >
              👤 Account Information
            </button>


          </nav>


        </aside>

        <div className="flex-1">
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
                
              <div className="relative">

                <button
                  type="button"
                  onClick={() =>
                    setShowNotifications(
                      !showNotifications
                    )
                  }
                  className="relative flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-xl hover:bg-slate-200"
                  aria-label="Notifications"
                >
                  🔔

                  {unreadNotificationCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-bold text-white">
                      {unreadNotificationCount > 9
                        ? '9+'
                        : unreadNotificationCount}
                    </span>
                  )}
                </button>


                {showNotifications && (

                  <div className="absolute right-0 z-50 mt-3 w-80 rounded-xl border border-slate-200 bg-white shadow-xl">

                    <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">

                      <h3 className="font-bold text-slate-900">
                        Notifications
                      </h3>

                      {unreadNotificationCount > 0 && (
                        <span className="text-xs font-semibold text-blue-700">
                          {unreadNotificationCount} unread
                        </span>
                      )}

                    </div>


                    <div className="max-h-96 overflow-y-auto">

                      {isLoadingNotifications ? (

                        <p className="p-4 text-sm text-slate-500">
                          Loading notifications...
                        </p>

                      ) : notifications.length > 0 ? (

                        <div>

                          {notifications.map(
                            (notification) => (

                              <button
                                type="button"
                                key={notification._id}
                                onClick={() => {
                                  if (!notification.read) {
                                    markNotificationAsRead(
                                      notification._id
                                    );
                                  }
                                }}
                                className={`block w-full border-b border-slate-100 px-4 py-3 text-left ${
                                  notification.read
                                    ? 'bg-white'
                                    : 'bg-blue-50 hover:bg-blue-100'
                                }`}
                              >

                                <div className="flex items-start gap-3">

                                  <span className="text-lg">
                                    {notification.type === 'delay'
                                      ? '⏰'
                                      : notification.type === 'cancellation'
                                      ? '❌'
                                      : notification.type === 'emergency'
                                      ? '🚨'
                                      : notification.type === 'schedule'
                                      ? '📅'
                                      : notification.type === 'diversion'
                                      ? '🔀'
                                      : '🔔'}
                                  </span>


                                  <div className="min-w-0 flex-1">

                                    <p className="text-sm font-semibold capitalize text-slate-900">
                                      {notification.type}
                                    </p>

                                    <p className="mt-1 text-sm text-slate-600">
                                      {notification.message}
                                    </p>

                                    <p className="mt-1 text-xs text-slate-400">
                                      {notification.createdAt
                                        ? new Date(
                                            notification.createdAt
                                          ).toLocaleString()
                                        : ''}
                                    </p>

                                  </div>


                                  {!notification.read && (
                                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                                  )}

                                </div>

                              </button>

                            )
                          )}

                        </div>

                      ) : (

                        <p className="p-4 text-sm text-slate-500">
                          No notifications yet.
                        </p>

                      )}

                    </div>

                  </div>

                )}

              </div>

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




          {activeMenu === "dashboard" && (
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






            {/* Report Emergency */}
            <article className="mt-8 rounded-2xl bg-white p-6 shadow-sm">

              <div className="flex items-center justify-between">

                <div>

                  <h3 className="text-xl font-bold text-slate-900">
                    🚨 Report Emergency
                  </h3>

                  <p className="text-sm text-slate-700 mt-1">
                    Report accidents, medical emergencies, harassment, or suspicious activities.
                  </p>

                </div>


                <button
                  onClick={() =>
                    setShowEmergencyForm(!showEmergencyForm)
                  }
                  className="
                    rounded-xl
                    bg-red-600
                    px-5
                    py-2
                    text-white
                    font-semibold
                  "
                >
                  {showEmergencyForm ? 'Close' : 'Report'}
                </button>

              </div>


              {showEmergencyForm && (

                <div className="mt-6 space-y-4">


                  <select

                    value={emergencyForm.category}

                    onChange={(e)=>
                      setEmergencyForm(prev=>({
                        ...prev,
                        category:e.target.value
                      }))
                    }

                    className="
                      w-full
                      rounded-xl
                      border-slate-300
                      p-3
                      text-slate-900
                      bg-white
                    "

                  >

                    <option>
                      Medical Emergency
                    </option>

                    <option>
                      Accident
                    </option>

                    <option>
                      Harassment
                    </option>

                    <option>
                      Suspicious Activity
                    </option>

                  </select>



                  <textarea

                    value={emergencyForm.description}

                    onChange={(e)=>
                      setEmergencyForm(prev=>({
                        ...prev,
                        description:e.target.value
                      }))
                    }

                    placeholder="Describe the emergency..."

                    className="
                      w-full
                      rounded-xl
                      border
                      border-slate-300
                      p-3
                      min-h-32
                      text-slate-900
                      placeholder:text-slate-500
                    "

                  />



                  <button

                    disabled={submittingEmergency}

                    onClick={submitEmergencyReport}

                    className="
                      w-full
                      rounded-xl
                      bg-red-600
                      py-3
                      text-white
                      font-bold
                    "

                  >

                    {submittingEmergency
                      ? 'Submitting...'
                      : 'Submit Emergency Report'
                    }

                  </button>



                  {emergencyMessage && (

                    <p className="text-sm font-semibold text-green-700">

                      {emergencyMessage}

                    </p>

                  )}


                </div>

              )}

            </article>


            

            



            
            {/*Frequently Visited Destinations*/}
            <article className="mt-8 rounded-2xl bg-white p-6 shadow-sm">

              <h3 className="text-xl font-bold text-slate-900">
                📍 Frequently Visited Destinations
              </h3>

              {isLoadingFrequentDestinations ? (

                <p className="mt-4 text-sm text-slate-500">
                  Loading destinations...
                </p>

              ) : frequentDestinations.length > 0 ? (

                <div className="mt-5 space-y-3">

                  {frequentDestinations.map(
                    (destination) => (

                      <div
                        key={destination.stopId}
                        className="flex items-center justify-between rounded-xl bg-slate-50 p-4"
                      >

                        <div>

                          <p className="font-semibold text-slate-900">
                            📍 {destination.name}
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            Frequently visited destination
                          </p>

                        </div>

                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                          {destination.visitCount}{' '}
                          {destination.visitCount === 1
                            ? 'visit'
                            : 'visits'}
                        </span>

                      </div>

                    )
                  )}

                </div>

              ) : (

                <p className="mt-4 text-sm text-slate-500">
                  No frequently visited destinations yet.
                </p>

              )}

            </article>
            
            {/*Recommended for You*/}
            <article className="mt-8 rounded-2xl bg-white p-6 shadow-sm">

              <h3 className="text-xl font-bold text-slate-900">
                💡 Recommended for You
              </h3>

              <p className="mt-2 text-sm text-slate-600">
                Personalized travel suggestions based on your previous journeys and saved preferences.
              </p>

              {isLoadingTravelSuggestions ? (

                <p className="mt-4 text-sm text-slate-500">
                  Finding recommendations...
                </p>

              ) : travelSuggestions.length > 0 ? (

                <div className="mt-5 grid gap-4 sm:grid-cols-2">

                  {travelSuggestions.map((suggestion) => (

                    <div
                      key={`${suggestion.type}-${suggestion.routeId || suggestion.stopId}`}
                      className="rounded-xl border border-slate-200 p-4"
                    >

                      <div className="flex items-start justify-between gap-3">

                        <div>

                          <p className="font-semibold text-slate-900">
                            {suggestion.type === 'recent-route'
                              ? '🚌'
                              : suggestion.type === 'frequent-destination'
                              ? '📍'
                              : suggestion.type === 'favorite-route'
                              ? '⭐'
                              : '🚏'}{' '}
                            {suggestion.title}
                          </p>

                          <p className="mt-2 text-sm text-slate-600">
                            {suggestion.description}
                          </p>

                          <div className="mt-3">

                            <p className="text-xs font-medium text-slate-500">
                              Recommended because:
                            </p>

                            <p className="mt-1 text-xs text-slate-600">
                              {suggestion.reason}
                            </p>

                          </div>
                          {suggestion.score >= 120 && (
                            <span className="mt-3 inline-block rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                              Highly recommended
                            </span>
                          )}

                        </div>

                      </div>

                    </div>

                  ))}

                </div>

              ) : (

                <p className="mt-4 text-sm text-slate-500">
                  No travel suggestions available yet.
                </p>

              )}

            </article>

          </div>
          </section>
          )}

          {activeMenu === "favourites" && (
          <>
            {/*Favourite routes & stops*/}    
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
                      (route)=>(

                        <div
                          key={route._id}
                          className="
                            flex
                            items-center
                            justify-between
                            rounded-xl
                            border
                            p-3
                          "
                        >

                          <span className="text-slate-900 font-medium">

                            {route.name}

                          </span>


                          <button

                            onClick={() =>
                              removeFavourite(
                                'route',
                                route._id
                              )
                            }

                            className="
                              rounded-lg
                              bg-red-500
                              px-3
                              py-1
                              text-sm
                              font-semibold
                              text-white
                            "

                          >

                            Remove

                          </button>


                        </div>

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

                  <div className="mt-3 space-y-3">

                    {favorites.favoriteStops.map(
                      (stop)=>(

                        <div
                          key={stop._id}
                          className="
                            flex
                            items-center
                            justify-between
                            rounded-xl
                            border
                            p-3
                          "
                        >

                          <span className="text-slate-900 font-medium">
                            {stop.name}
                          </span>


                          <button
                            onClick={() =>
                              removeFavourite(
                                'stop',
                                stop._id
                              )
                            }
                            className="
                              rounded-lg
                              bg-red-500
                              px-3
                              py-1
                              text-sm
                              font-semibold
                              text-white
                            "
                          >
                            Remove
                          </button>


                        </div>

                      )
                    )}

                  </div>

                ) : (

                  <p className="mt-2 text-sm text-slate-500">
                    No saved stops yet.
                  </p>

                )}

              </div>
            </article>
          </>
          )}

          {activeMenu === "search" && (
          <>
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


              {/* Recent Searches */}

              <div className="mt-6 border-t border-slate-200 pt-5">

                <h4 className="text-base font-bold text-slate-900">
                  🕘 Recent Searches
                </h4>

                {isLoadingRecentSearches ? (

                  <p className="mt-3 text-sm text-slate-500">
                    Loading recent searches...
                  </p>

                ) : recentSearches.length > 0 ? (

                  <div className="mt-3 space-y-2">

                    {recentSearches.map((search) => (

                      <div
                        key={`${search.busId?._id}-${search.searchedAt}`}
                        className="rounded-lg bg-slate-50 p-3"
                      >

                        <p className="font-semibold text-slate-900">
                          🚌 {search.busId?.busNumber || 'Bus'}
                        </p>

                        <p className="mt-1 text-sm text-slate-600">
                          🛣 {search.busId?.routeId?.name ||
                            'Route information unavailable'}
                        </p>

                        {search.busId?.routeId?.distance !== undefined && (
                          <p className="mt-1 text-xs text-slate-500">
                            📏 {search.busId.routeId.distance} km
                            {' • '}
                            ⏱ {search.busId.routeId.estimatedDuration} min
                          </p>
                        )}

                      </div>

                    ))}

                  </div>

                ) : (

                  <p className="mt-3 text-sm text-slate-500">
                    No recent searches yet.
                  </p>

                )}

              </div>

            </article>



          {searchResults && (

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
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
          <div className="mt-5 border-t border-slate-200 pt-5">

            <h5 className="font-semibold text-slate-900">
              🧳 Start Journey
            </h5>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">

              <div>
                <label
                  htmlFor="from-stop"
                  className="block text-sm font-medium text-slate-700"
                >
                  From Stop
                </label>

                <select
                  id="from-stop"
                  value={fromStopId}
                  onChange={(event) =>
                    setFromStopId(event.target.value)
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500"
                >
                  <option value="">
                    Select starting stop
                  </option>

                  {searchResults.buses[0].routeId?.stops?.map(
                    (stop) => (
                      <option
                        key={stop._id}
                        value={stop._id}
                      >
                        {stop.name}
                      </option>
                    )
                  )}
                </select>
              </div>


              <div>
                <label
                  htmlFor="to-stop"
                  className="block text-sm font-medium text-slate-700"
                >
                  To Stop
                </label>

                <select
                  id="to-stop"
                  value={toStopId}
                  onChange={(event) =>
                    setToStopId(event.target.value)
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500"
                >
                  <option value="">
                    Select destination
                  </option>

                  {searchResults.buses[0].routeId?.stops?.map(
                    (stop) => (
                      <option
                        key={stop._id}
                        value={stop._id}
                      >
                        {stop.name}
                      </option>
                    )
                  )}
                </select>
              </div>

            </div>


            <button
              type="button"
              onClick={startJourney}
              disabled={isStartingJourney}
              className="mt-4 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isStartingJourney
                ? 'Starting Journey...'
                : 'Start Journey'}
            </button>

          </div>

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


          </div>



          
          </section>
          <article className="mt-8 rounded-2xl bg-white p-6 shadow-sm">

            <h3 className="text-xl font-bold text-slate-900">
              🚌 Live Bus Tracking
            </h3>

            {isLoadingLiveBus ? (

              <p className="mt-4 text-sm text-slate-500">
                Loading live location...
              </p>

            ) : liveBus ? (

              <div className="mt-5">

                <div className="mb-4 grid gap-3 sm:grid-cols-3">

                  <div className="rounded-lg bg-blue-50 p-4">
                    <p className="text-sm text-slate-500">
                      Bus Number
                    </p>

                    <p className="font-bold text-slate-900">
                      {liveBus.busNumber}
                    </p>
                  </div>


                  <div className="rounded-lg bg-green-50 p-4">
                    <p className="text-sm text-slate-500">
                      Status
                    </p>

                    <p className="font-bold capitalize text-slate-900">
                      {liveBus.status}
                    </p>
                  </div>


                  <div className="rounded-lg bg-purple-50 p-4">
                    <p className="text-sm text-slate-500">
                      Tracking
                    </p>

                    <p className="font-bold text-green-700">
                      Live
                    </p>
                  </div>

                </div>


                <MapView
                  busLocation={liveBus.currentLocation}
                  busId={liveBus._id}
                  stops={[]}
                />

              </div>

            ) : (

              <p className="mt-4 text-sm text-slate-500">
                No live bus available.
              </p>

            )}

          </article>        
          </div>

          )}
          </>
          )}
          {activeMenu === "history" && (
          <>
            {/* Active Journey*/}
            <article className="mt-8 rounded-2xl bg-white p-6 shadow-sm">

              <h3 className="text-xl font-bold text-slate-900">
                🚌 Active Journey
              </h3>


              {travelHistory.filter(
                (journey) => journey.status === "active"
              ).length > 0 ? (

                <div className="mt-5 space-y-3">

                  {travelHistory
                    .filter(
                      (journey) => journey.status === "active"
                    )
                    .map((journey) => (

                      <div
                        key={journey._id}
                        className="rounded-xl border border-blue-200 bg-blue-50 p-4"
                      >

                        <p className="font-semibold text-slate-900">
                          🚌 {journey.busId?.busNumber || 'Bus'}
                        </p>


                        <p className="mt-1 text-sm text-slate-600">
                          🛣 {journey.routeId?.name ||
                            'Route information unavailable'}
                        </p>


                        <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">

                          <p>
                            📍 From:{' '}
                            {journey.fromStopId?.name ||
                              'Not specified'}
                          </p>


                          <p>
                            📍 To:{' '}
                            {journey.toStopId?.name ||
                              'Not specified'}
                          </p>

                        </div>


                        <div className="mt-4 flex gap-3">

                          <button
                            type="button"
                            onClick={() =>
                              updateJourneyStatus(
                                journey._id,
                                "completed"
                              )
                            }
                            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                          >
                            Complete Journey
                          </button>


                          <button
                            type="button"
                            onClick={() =>
                              updateJourneyStatus(
                                journey._id,
                                "cancelled"
                              )
                            }
                            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                          >
                            Cancel Journey
                          </button>

                        </div>

                      </div>

                    ))}

                </div>

              ) : (

                <p className="mt-4 text-sm text-slate-500">
                  No active journey.
                </p>

              )}

            </article>

            {/* Travel History*/}    
            <article className="mt-8 rounded-2xl bg-white p-6 shadow-sm">

              <h3 className="text-xl font-bold text-slate-900">
                🧳 Travel History
              </h3>

              {isLoadingTravelHistory ? (

                <p className="mt-4 text-sm text-slate-500">
                  Loading travel history...
                </p>

              ) : travelHistory.length > 0 ? (

                <div className="mt-5 space-y-3">

                  {travelHistory.filter( (journey) => journey.status === "completed" || journey.status === "cancelled").map((journey) => (

                    <div
                      key={journey._id}
                      className="rounded-xl border border-slate-200 p-4"
                    >

                      <div className="flex items-start justify-between gap-4">

                        <div>

                          <p className="font-semibold text-slate-900">
                            🚌 {journey.busId?.busNumber || 'Bus'}
                          </p>

                          <p className="mt-1 text-sm text-slate-600">
                            🛣 {journey.routeId?.name ||
                              'Route information unavailable'}
                          </p>

                        </div>

                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                          {journey.status}
                        </span>

                      </div>

                      <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">

                        <p>
                          📍 From:{' '}
                          {journey.fromStopId?.name ||
                            'Not specified'}
                        </p>

                        <p>
                          📍 To:{' '}
                          {journey.toStopId?.name ||
                            'Not specified'}
                        </p>

                      </div>

                      <p className="mt-3 text-xs text-slate-400">
                        🕘{' '}
                        {journey.journeyDate
                          ? new Date(
                              journey.journeyDate
                            ).toLocaleString()
                          : 'Date unavailable'}
                      </p>

                    </div>

                  ))}

                </div>

              ) : (

                <p className="mt-4 text-sm text-slate-500">
                  No travel history yet.
                </p>

              )}

            </article>
          </>
          )}

          {activeMenu === "lost" && (
          <>
            {/* Lost and Found */}
            <article className="mt-8 rounded-2xl bg-white p-6 shadow-sm">

              <div className="flex items-center justify-between">

                <div>

                  <h3 className="text-xl font-bold text-slate-900">
                    🧳 Lost and Found
                  </h3>

                  <p className="mt-1 text-sm text-slate-700">
                    Report lost belongings and track recovery status.
                  </p>

                </div>


                <button
                  onClick={() =>
                    setShowLostItemForm(!showLostItemForm)
                  }
                  className="
                    rounded-xl
                    bg-blue-600
                    px-5
                    py-2
                    text-white
                    font-semibold
                  "
                >
                  {showLostItemForm ? 'Close' : 'Report Lost Item'}
                </button>

              </div>


              {showLostItemForm && (

                <div className="mt-6 space-y-4">


                  <textarea

                    value={lostItemDescription}

                    onChange={(e)=>
                      setLostItemDescription(
                        e.target.value
                      )
                    }

                    placeholder="Describe your lost item..."

                    className="
                      w-full
                      rounded-xl
                      border
                      border-slate-300
                      p-3
                      min-h-32
                      text-slate-900
                      placeholder:text-slate-500
                    "

                  />


                  <button

                    disabled={submittingLostItem}

                    onClick={submitLostItem}

                    className="
                      w-full
                      rounded-xl
                      bg-blue-600
                      py-3
                      text-white
                      font-bold
                    "

                  >

                    {submittingLostItem
                      ? 'Submitting...'
                      : 'Submit Lost Item Report'
                    }

                  </button>


                  {lostItemMessage && (

                    <p className="text-sm font-semibold text-green-700">

                      {lostItemMessage}

                    </p>

                  )}

                </div>

              )}


              <div className="mt-8">

                <h4 className="font-bold text-slate-900">
                  My Lost Item Reports
                </h4>


                {isLoadingLostItems ? (

                  <p className="mt-3 text-sm text-slate-500">
                    Loading reports...
                  </p>

                ) : lostItems.length > 0 ? (

                  <div className="mt-4 space-y-3">

                    {lostItems.map((item)=>(

                      <div
                        key={item._id}
                        className="
                          rounded-xl
                          border
                          border-slate-200
                          p-4
                        "
                      >

                        <p className="font-semibold text-slate-900">
                          🧳 {item.description}
                        </p>


                        <p className="mt-2 text-sm text-slate-600">
                          Status:
                          {' '}
                          {item.status}
                        </p>


                        <p className="mt-1 text-xs text-slate-400">
                          Submitted:
                          {' '}
                          {item.createdAt
                            ? new Date(
                                item.createdAt
                              ).toLocaleString()
                            : ''
                          }
                        </p>


                      </div>

                    ))}

                  </div>

                ) : (

                  <p className="mt-3 text-sm text-slate-500">
                    No lost item reports yet.
                  </p>

                )}

              </div>


            </article>
          </>
          )}

          {activeMenu === "feedback" && (
          <>
            {/* Feedback and Ratings */}
            <article className="mt-8 rounded-2xl bg-white p-6 shadow-sm">

              <div className="flex items-center justify-between">

                <div>

                  <h3 className="text-xl font-bold text-slate-900">
                    ⭐ Journey Feedback
                  </h3>

                  <p className="mt-1 text-sm text-slate-700">
                    Rate your completed journeys and share your experience.
                  </p>

                </div>


                <button
                  onClick={() =>
                    setShowFeedbackForm(!showFeedbackForm)
                  }
                  className="
                    rounded-xl
                    bg-blue-600
                    px-5
                    py-2
                    text-white
                    font-semibold
                  "
                >

                  {showFeedbackForm
                    ? 'Close'
                    : 'Give Feedback'
                  }

                </button>

              </div>



              {showFeedbackForm && (

                <div className="mt-6 space-y-4">


                  <select

                    value={feedbackTripId}

                    onChange={(e)=>
                      setFeedbackTripId(
                        e.target.value
                      )
                    }

                    className="
                      w-full
                      rounded-xl
                      border
                      p-3
                      text-slate-900
                    "

                  >

                    <option value="">
                      Select Completed Journey
                    </option>


                    {travelHistory
                      .filter(
                        (journey)=>
                          journey.status === "completed"
                      )
                      .map((journey)=>(

                        <option
                          key={journey._id}
                          value={journey._id}
                        >

                          {journey.busId?.busNumber || 'Bus'}
                          {' - '}
                          {journey.routeId?.name || 'Route'}

                        </option>

                      ))}


                  </select>



                  <div>

                    <p className="font-semibold text-slate-900">
                      Rating
                    </p>


                    <div className="mt-2 flex gap-2">


                      {[1,2,3,4,5].map((star)=>(

                        <button

                          key={star}

                          onClick={()=>
                            setFeedbackRating(star)
                          }

                          className="text-3xl"

                        >

                          {star <= feedbackRating
                            ? '⭐'
                            : '☆'
                          }

                        </button>

                      ))}


                    </div>

                  </div>



                  <textarea

                    value={feedbackComment}

                    onChange={(e)=>
                      setFeedbackComment(
                        e.target.value
                      )
                    }

                    placeholder="Write your feedback..."

                    className="
                      min-h-32
                      w-full
                      rounded-xl
                      border
                      p-3
                      text-slate-900
                      placeholder:text-slate-500
                    "

                  />



                  <button

                    disabled={submittingFeedback}

                    onClick={submitFeedback}

                    className="
                      w-full
                      rounded-xl
                      bg-blue-600
                      py-3
                      font-bold
                      text-white
                    "

                  >

                    {submittingFeedback
                      ? 'Submitting...'
                      : 'Submit Feedback'
                    }

                  </button>



                  {feedbackMessage && (

                    <p className="
                      text-sm
                      font-semibold
                      text-green-700
                    ">

                      {feedbackMessage}

                    </p>

                  )}


                </div>

              )}




              <div className="mt-8">


                <h4 className="font-bold text-slate-900">
                  My Previous Feedback
                </h4>



                {isLoadingFeedbacks ? (

                  <p className="mt-3 text-sm text-slate-500">
                    Loading feedback...
                  </p>


                ) : feedbacks.length > 0 ? (


                  <div className="mt-4 space-y-3">


                    {feedbacks.map((feedback)=>(


                      <div

                        key={feedback._id}

                        className="
                          rounded-xl
                          border
                          border-slate-200
                          p-4
                        "

                      >


                        <p className="font-semibold text-slate-900">

                          {feedback.tripId?.busId?.busNumber ||
                          'Journey'}

                        </p>



                        <p className="mt-2">

                          {'⭐'.repeat(
                            feedback.rating
                          )}

                        </p>



                        <p className="mt-2 text-sm text-slate-700">

                          {feedback.comment || 'No comment'}

                        </p>


                      </div>


                    ))}


                  </div>


                ) : (


                  <p className="mt-3 text-sm text-slate-500">

                    No feedback submitted yet.

                  </p>


                )}


              </div>


            </article>
          </>
          )}  

          {activeMenu === "emergency" && (
          <>  
            {/* Emergency Reports */}
            <article className="mt-8 rounded-2xl bg-white p-6 shadow-sm">

              <h3 className="text-xl font-bold text-slate-900">
                🚨 My Emergency Reports
              </h3>


              {isLoadingEmergencyReports ? (

                <p className="mt-4 text-sm text-slate-500">
                  Loading emergency reports...
                </p>

              ) : emergencyReports.length > 0 ? (

                <div className="mt-5 space-y-4">

                  {emergencyReports.map((report) => (

                    <div
                      key={report._id}
                      className="rounded-xl border border-slate-200 p-4"
                    >

                      <div className="flex items-start justify-between gap-4">

                        <div>

                          <p className="font-semibold text-slate-900">
                            🚨 {report.category}
                          </p>


                          <p className="mt-2 text-sm text-slate-600">
                            {report.description}
                          </p>


                          {report.busId && (
                            <p className="mt-2 text-sm text-slate-600">
                              🚌 Bus:
                              {' '}
                              {report.busId.busNumber}
                            </p>
                          )}


                          <p className="mt-2 text-xs text-slate-400">
                            Submitted:
                            {' '}
                            {report.createdAt
                              ? new Date(
                                  report.createdAt
                                ).toLocaleString()
                              : ''}
                          </p>

                        </div>


                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                            report.status === 'resolved'
                              ? 'bg-green-100 text-green-700'
                              : report.status === 'investigating'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {report.status}
                        </span>


                      </div>

                    </div>

                  ))}

                </div>

              ) : (

                <p className="mt-4 text-sm text-slate-500">
                  No emergency reports submitted yet.
                </p>

              )}

            </article>
          </>
          )}     

          {activeMenu === "account" && (
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
          )}
     
        </div>
      </div>
    </main>
  );
}