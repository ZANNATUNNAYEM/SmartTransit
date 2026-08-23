'use client';
/* eslint-disable react-hooks/set-state-in-effect */
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
);

export default function AdminDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Fleet Management');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [emergencyReports, setEmergencyReports] = useState([]);
  const [lostItems, setLostItems] = useState([]);
  const [isLoadingLostItems, setIsLoadingLostItems] = useState(false);
  const [feedbacks, setFeedbacks] = useState([]);
  const [isLoadingFeedbacks, setIsLoadingFeedbacks] = useState(false);
  const [emergencyLoading, setEmergencyLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  // Complaints & Optimization states
  const [complaints, setComplaints] = useState([]);
  const [isLoadingComplaints, setIsLoadingComplaints] = useState(false);
  const [selectedComplaintId, setSelectedComplaintId] = useState('');
  const [complaintNote, setComplaintNote] = useState('');
  const [isSubmittingComplaintNote, setIsSubmittingComplaintNote] = useState(false);
  
  const [optimizationRecommendations, setOptimizationRecommendations] = useState(null);
  const [isLoadingOptimization, setIsLoadingOptimization] = useState(false);
  // Loaded database states
  const [stats, setStats] = useState(null);
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [stops, setStops] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Analytics Dashboard states
  const [analyticsStartDate, setAnalyticsStartDate] = useState('');
  const [analyticsEndDate, setAnalyticsEndDate] = useState('');
  const [analyticsRouteFilter, setAnalyticsRouteFilter] = useState('');
  const [analyticsDriverFilter, setAnalyticsDriverFilter] = useState('');
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  
  // Fetch result states
  const [routePopularity, setRoutePopularity] = useState([]);
  const [averageDelays, setAverageDelays] = useState([]);
  const [completedTrips, setCompletedTrips] = useState([]);
  const [completedTripsGroup, setCompletedTripsGroup] = useState('route'); // 'route' | 'bus' | 'driver'
  const [busUtilization, setBusUtilization] = useState([]);
  const [driverPerformance, setDriverPerformance] = useState([]);
  const [peakHours, setPeakHours] = useState([]);
  
  // Search query states
  const [driverSearchQuery, setDriverSearchQuery] = useState('');
  const [busSearchQuery, setBusSearchQuery] = useState('');

  // Fleet Management sub-tab view state
  const [fleetSubView, setFleetSubView] = useState('buses'); // 'buses' | 'routes' | 'drivers' | 'trips'
  const [trips, setTrips] = useState([]);

  // Requests page states
  const [requestFilter, setRequestFilter] = useState('pending'); // 'pending' or 'all'

  // Form states for Route Assignment panel
  const [selectedBusId, setSelectedBusId] = useState('');
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Modal Control States
  const [showAddBusModal, setShowAddBusModal] = useState(false);
  const [showAddRouteModal, setShowAddRouteModal] = useState(false);
  const [showAddScheduleModal, setShowAddScheduleModal] = useState(false);
  const [showAddStopModal, setShowAddStopModal] = useState(false);

  // Notification Center states
  const [notificationType, setNotificationType] = useState('delay');
  const [notificationBusId, setNotificationBusId] = useState('');
  const [delayMinutes, setDelayMinutes] = useState(10);
  const [notificationRouteId, setNotificationRouteId] = useState('');
  const [notificationScheduleId, setNotificationScheduleId] = useState('');
  const [diversionDetails, setDiversionDetails] = useState('');
  const [notificationTripId, setNotificationTripId] = useState('');
  const [cancellationMessage, setCancellationMessage] = useState('');
  const [emergencyMessage, setEmergencyMessage] = useState('');
  const [isSendingNotification, setIsSendingNotification] = useState(false);
  const [notificationSendMessage, setNotificationSendMessage] = useState('');
  const [notificationSendError, setNotificationSendError] = useState('');

  // Add Bus Form State
  const [busForm, setBusForm] = useState({
    busNumber: '',
    capacity: 40,
    status: 'active',
    routeId: '',
    driverId: ''
  });

  // Add Route Form State
  const [routeForm, setRouteForm] = useState({
    name: '',
    distance: 10,
    estimatedDuration: 30,
    stops: []
  });

  // Add Schedule Form State
  const [scheduleForm, setScheduleForm] = useState({
    routeId: '',
    busId: '',
    departureTimes: '',
    frequency: ''
  });

  // Add Bus Stop Form State
  const [stopForm, setStopForm] = useState({
    name: '',
    latitude: 23.8103,
    longitude: 90.4125
  });

  // Fetch all centralized transit data
  async function fetchAllData() {
    try {
      setError('');
      
      // Fetch overview statistics
      const statsRes = await fetch('/api/admin/analytics/overview');
      if (statsRes.status === 401) {
        router.replace('/admin/login');
        return;
      }
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.summary);
      }

      // Fetch Buses
      const busesRes = await fetch('/api/admin/buses');
      if (busesRes.ok) {
        const busesData = await busesRes.json();
        setBuses(busesData);
      }

      // Fetch Routes
      const routesRes = await fetch('/api/admin/routes');
      if (routesRes.ok) {
        const routesData = await routesRes.json();
        setRoutes(routesData);
      }

      // Fetch Schedules
      const schedulesRes = await fetch('/api/admin/schedules');
      if (schedulesRes.ok) {
        const schedulesData = await schedulesRes.json();
        setSchedules(schedulesData);
      }

      // Fetch Stops
      const stopsRes = await fetch('/api/admin/bus-stops');
      if (stopsRes.ok) {
        const stopsData = await stopsRes.json();
        setStops(stopsData);
      }

      // Fetch Drivers
      const driversRes = await fetch('/api/admin/drivers');
      if (driversRes.ok) {
        const driversData = await driversRes.json();
        setDrivers(driversData);
      }

    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Connection failed. Please refresh pages.');
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchAnalyticsData() {
    setAnalyticsLoading(true);
    try {
      const params = new URLSearchParams();
      if (analyticsStartDate) params.append('startDate', analyticsStartDate);
      if (analyticsEndDate) params.append('endDate', analyticsEndDate);
      
      const paramStr = params.toString() ? `?${params.toString()}` : '';

      const [resPop, resDelays, resCompleted, resUtilization, resPerformance, resPeak] = await Promise.all([
        fetch(`/api/admin/analytics/route-popularity${paramStr}`),
        fetch(`/api/admin/analytics/average-delay${paramStr}`),
        fetch(`/api/admin/analytics/completed-trips${paramStr}${paramStr ? '&' : '?'}groupBy=${completedTripsGroup}`),
        fetch(`/api/admin/analytics/bus-utilization${paramStr}`),
        fetch(`/api/admin/analytics/driver-performance${paramStr}`),
        fetch(`/api/admin/analytics/peak-hours${paramStr}`)
      ]);

      if (resPop.ok) setRoutePopularity(await resPop.json());
      if (resDelays.ok) setAverageDelays(await resDelays.json());
      if (resCompleted.ok) setCompletedTrips(await resCompleted.json());
      if (resUtilization.ok) setBusUtilization(await resUtilization.json());
      if (resPerformance.ok) setDriverPerformance(await resPerformance.json());
      if (resPeak.ok) setPeakHours(await resPeak.json());

    } catch (err) {
      console.error('Error fetching analytics data:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  }

  async function fetchLostItems() {

    try {

      setIsLoadingLostItems(true);


      const response =
        await fetch(
          '/api/admin/lost-items',
          {
            credentials:'include',
            cache:'no-store',
          }
        );


      const data =
        await response.json();


      if(response.ok){

        setLostItems(
          data.reports || []
        );

      }


    } catch(error){

      console.error(
        'Fetch lost items error:',
        error
      );


    } finally {

      setIsLoadingLostItems(false);

    }

  }

  async function fetchFeedbacks() {

    try {

      setIsLoadingFeedbacks(true);


      const response =
        await fetch(
          '/api/admin/feedback',
          {
            credentials:'include',
            cache:'no-store',
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

  async function fetchComplaints() {
    try {
      setIsLoadingComplaints(true);
      const response = await fetch('/api/admin/complaints', {
        credentials: 'include',
        cache: 'no-store',
      });
      const data = await response.json();
      if (response.ok) {
        setComplaints(data.complaints || []);
      }
    } catch (error) {
      console.error('Fetch admin complaints error:', error);
    } finally {
      setIsLoadingComplaints(false);
    }
  }

  async function updateComplaintStatus(complaintId, status, resolutionNote = '') {
    try {
      setIsSubmittingComplaintNote(true);
      const response = await fetch('/api/admin/complaints', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          complaintId,
          status,
          resolutionNote,
        }),
      });

      if (response.ok) {
        setSelectedComplaintId('');
        setComplaintNote('');
        await fetchComplaints();
      } else {
        const errData = await response.json();
        alert(errData.error || 'Failed to update complaint');
      }
    } catch (error) {
      console.error('Update complaint status error:', error);
    } finally {
      setIsSubmittingComplaintNote(false);
    }
  }

  async function fetchOptimizationRecommendations() {
    try {
      setIsLoadingOptimization(true);
      const response = await fetch('/api/admin/route-optimization', {
        credentials: 'include',
        cache: 'no-store',
      });
      const data = await response.json();
      if (response.ok) {
        setOptimizationRecommendations(data);
      }
    } catch (error) {
      console.error('Fetch optimization error:', error);
    } finally {
      setIsLoadingOptimization(false);
    }
  }

  useEffect(() => {
    if (activeTab === 'Analytics') {
      fetchAnalyticsData();
    }
  }, [activeTab, analyticsStartDate, analyticsEndDate]);

  useEffect(() => {
    if (activeTab === 'Analytics') {
      const fetchCompletedOnly = async () => {
        try {
          const params = new URLSearchParams();
          if (analyticsStartDate) params.append('startDate', analyticsStartDate);
          if (analyticsEndDate) params.append('endDate', analyticsEndDate);
          params.append('groupBy', completedTripsGroup);
          const res = await fetch(`/api/admin/analytics/completed-trips?${params.toString()}`);
          if (res.ok) setCompletedTrips(await res.json());
        } catch (e) {
          console.error(e);
        }
      };
      fetchCompletedOnly();
    }
  }, [completedTripsGroup]);

  useEffect(() => {
    if (activeTab === 'Fleet Management' && fleetSubView === 'trips') {
      const fetchTrips = async () => {
        try {
          const res = await fetch('/api/admin/trips');
          if (res.ok) setTrips(await res.json());
        } catch (e) {
          console.error(e);
        }
      };
      fetchTrips();
    }
  }, [activeTab, fleetSubView]);

  useEffect(()=>{

  if(activeTab === 'Emergency Reports'){
      loadEmergencyReports();
  }

  },[activeTab]);  

  useEffect(() => {

    if(activeTab === 'Lost & Found'){

      fetchLostItems();

    }

  }, [activeTab]);

  useEffect(() => {

    if(activeTab === 'Feedback & Ratings'){

      fetchFeedbacks();

    }

  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'Complaints Management') {
      fetchComplaints();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'Route Optimization') {
      fetchOptimizationRecommendations();
    }
  }, [activeTab]);


  useEffect(() => {
    if (activeTab === 'Notifications' && notificationType === 'trip_cancellation') {

      const fetchTrips = async () => {
        try {
          const res = await fetch('/api/admin/trips');

          if (res.ok) {
            const data = await res.json();
            setTrips(data);
          }

        } catch (error) {
          console.error(
            'Error loading trips:',
            error
          );
        }
      };

      fetchTrips();
    }

  }, [activeTab, notificationType]);

  useEffect(() => {
    fetchAllData();
    loadNotifications(true);
  }, [router]);
  useEffect(() => {
    const intervalId = setInterval(() => {
      loadNotifications(false);
    }, 30000);

    return () => clearInterval(intervalId);
  }, []);

  // Send administrative notification
  async function handleSendNotification(e) {
    e.preventDefault();

    setNotificationSendMessage('');
    setNotificationSendError('');

    if (notificationType === 'delay' && !notificationBusId) {
      setNotificationSendError('Please select a bus.');
      return;
    }


    try {
      setIsSendingNotification(true);

      let endpoint = '';
      let body = {};


      if (notificationType === 'delay') {
        endpoint = '/api/notifications/bus-delay';

        body = {
          busId: notificationBusId,
          delayMinutes: Number(delayMinutes),
        };
      }
      if (notificationType === 'route_diversion') {

        endpoint = '/api/notifications/route-diversion';

        body = {
          routeId: notificationRouteId,
          diversionDetails,
        };

      }
      if (notificationType === 'schedule_change') {
        const selectedSchedule = schedules.find(
          (schedule) => schedule._id === notificationScheduleId
        );

        endpoint = '/api/notifications/schedule-change';

        body = {
          scheduleId: notificationScheduleId,
          departureTimes: selectedSchedule?.departureTimes || [],
          frequency: selectedSchedule?.frequency || '',
        };
      }    

      if (notificationType === 'trip_cancellation') {

        endpoint = '/api/notifications/trip-cancellation';

        body = {
          tripId: notificationTripId,
          message: cancellationMessage,
        };

      }

      if (notificationType === 'emergency') {

        endpoint = '/api/notifications/emergency';

        body = {
          message: emergencyMessage,
        };

      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        setNotificationSendError(
          data.error || 'Failed to send notification.'
        );
        return;
      }

      setNotificationSendMessage(
        data.message || 'Notification sent successfully.'
      );

      // Refresh notifications shown in the admin bell
      await loadNotifications(true);

      // Refresh bus status because delay API changes it
      await fetchAllData();

    } catch (error) {
      console.error(
        'Notification sending error:',
        error
      );

      setNotificationSendError(
        'Unable to send notification. Please try again.'
      );
    } finally {
      setIsSendingNotification(false);
    }
  }

  async function handleLogout() {
    try {
      setIsLoggingOut(true);
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      router.push('/admin/login');
      router.refresh();
    } catch (err) {
      console.error('Logout failed:', err);
      setIsLoggingOut(false);
    }
  }

  async function updateEmergencyStatus(
    reportId,
    status
  ){

    const response =
      await fetch(
        '/api/admin/emergency-reports',
        {
          method:'PATCH',
          headers:{
            'Content-Type':'application/json'
          },
          credentials:'include',
          body:JSON.stringify({
            reportId,
            status
          })
        }
      );


    if(response.ok){

      loadEmergencyReports();

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
  useEffect(() => {

    loadNotifications();

    const interval = setInterval(() => {
        loadNotifications();
    }, 10000);


    return () => {
        clearInterval(interval);
    };

  }, []);
  async function loadEmergencyReports(){

    try{

      setEmergencyLoading(true);

      const response =
        await fetch(
          '/api/admin/emergency-reports',
          {
            credentials:'include',
            cache:'no-store'
          }
        );


      const data =
        await response.json();


      if(response.ok && data.success){

        setEmergencyReports(
          data.reports || []
        );

      }


    }catch(error){

      console.error(
        'Emergency report loading error:',
        error
      );

    }
    finally{

      setEmergencyLoading(false);

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
          Math.max(
            0,
            currentCount - 1
          )
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
  // Handle driver approval or rejection
  async function handleApproveDriver(driverId, action) {
    try {
      const res = await fetch(`/api/admin/drivers/${driverId}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Driver registration ${action === 'approve' ? 'approved' : 'rejected'} successfully!`);
        fetchAllData();
      } else {
        alert(data.error || 'Failed to update driver registration');
      }
    } catch (err) {
      console.error('Error reviewing driver request:', err);
    }
  }

  // Handle deleting driver request
  async function handleDeleteDriver(driverId) {
    if (!confirm('Are you sure you want to delete this driver request?')) return;
    try {
      const res = await fetch(`/api/admin/drivers/${driverId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok) {
        alert('Driver request deleted successfully!');
        fetchAllData();
      } else {
        alert(data.error || 'Failed to delete driver request');
      }
    } catch (err) {
      console.error('Error deleting driver request:', err);
    }
  }

  // Handle bus status toggle (Active / Disabled)
  async function toggleBusStatus(busId, currentStatus) {
    const nextStatus = currentStatus === 'active' ? 'disabled' : 'active';
    try {
      const res = await fetch(`/api/admin/buses/${busId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        setBuses(prev => prev.map(b => b._id === busId ? { ...b, status: nextStatus } : b));
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update bus status');
      }
    } catch (err) {
      console.error('Error toggling status:', err);
    }
  }

  // Handle bus deletion
  async function deleteBus(busId) {
    if (!confirm('Are you sure you want to delete this bus?')) return;
    try {
      const res = await fetch(`/api/admin/buses/${busId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setBuses(prev => prev.filter(b => b._id !== busId));
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete bus');
      }
    } catch (err) {
      console.error('Error deleting bus:', err);
    }
  }

  // Handle route deletion
  async function deleteRoute(routeId) {
    if (!confirm('Are you sure you want to delete this route?')) return;
    try {
      const res = await fetch(`/api/admin/routes/${routeId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setRoutes(prev => prev.filter(r => r._id !== routeId));
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete route');
      }
    } catch (err) {
      console.error('Error deleting route:', err);
    }
  }

  // Submit Bus Creation Form
  async function handleCreateBus(e) {
    e.preventDefault();
    if (!busForm.busNumber || !busForm.capacity) {
      alert('Bus number and capacity are required');
      return;
    }
    try {
      const res = await fetch('/api/admin/buses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          busNumber: busForm.busNumber,
          capacity: Number(busForm.capacity),
          status: busForm.status,
          routeId: busForm.routeId || null,
          driverId: busForm.driverId || null
        })
      });
      const data = await res.json();
      if (res.ok) {
        setShowAddBusModal(false);
        setBusForm({ busNumber: '', capacity: 40, status: 'active', routeId: '', driverId: '' });
        fetchAllData();
      } else {
        alert(data.error || 'Failed to create bus');
      }
    } catch (err) {
      console.error('Error creating bus:', err);
    }
  }

  // Route Assignment Panel Submit
  async function handleRouteAssignment(e) {
    e.preventDefault();
    if (!selectedBusId) {
      alert('Please select a bus');
      return;
    }
    try {
      setIsAssigning(true);
      const res = await fetch(`/api/admin/buses/${selectedBusId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          routeId: selectedRouteId || null,
          driverId: selectedDriverId || null
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert('Route and Driver assigned successfully!');
        setSelectedBusId('');
        setSelectedRouteId('');
        setSelectedDriverId('');
        fetchAllData();
      } else {
        alert(data.error || 'Assignment failed');
      }
    } catch (err) {
      console.error('Error assigning route:', err);
    } finally {
      setIsAssigning(false);
    }
  }

  // Submit Route Creation Form
  async function handleCreateRoute(e) {
    e.preventDefault();
    if (!routeForm.name || !routeForm.distance || !routeForm.estimatedDuration) {
      alert('Name, distance, and estimated duration are required');
      return;
    }
    try {
      const res = await fetch('/api/admin/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: routeForm.name,
          distance: Number(routeForm.distance),
          estimatedDuration: Number(routeForm.estimatedDuration),
          stops: routeForm.stops
        })
      });
      const data = await res.json();
      if (res.ok) {
        setShowAddRouteModal(false);
        setRouteForm({ name: '', distance: 10, estimatedDuration: 30, stops: [] });
        fetchAllData();
      } else {
        alert(data.error || 'Failed to create route');
      }
    } catch (err) {
      console.error('Error creating route:', err);
    }
  }

  // Submit Bus Stop Creation Form
  async function handleCreateStop(e) {
    e.preventDefault();
    if (!stopForm.name) {
      alert('Bus Stop Name is required');
      return;
    }
    try {
      const res = await fetch('/api/admin/bus-stops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: stopForm.name,
          latitude: Number(stopForm.latitude),
          longitude: Number(stopForm.longitude)
        })
      });
      const data = await res.json();
      if (res.ok) {
        setShowAddStopModal(false);
        setStopForm({ name: '', latitude: 23.8103, longitude: 90.4125 });
        fetchAllData();
      } else {
        alert(data.error || 'Failed to create stop');
      }
    } catch (err) {
      console.error('Error creating stop:', err);
    }
  }

  // Submit Schedule Creation Form
  async function handleCreateSchedule(e) {
    e.preventDefault();
    if (!scheduleForm.routeId || !scheduleForm.busId || !scheduleForm.departureTimes) {
      alert('Route, Bus, and Departure times are required');
      return;
    }
    const timesArray = scheduleForm.departureTimes.split(',').map(t => t.trim());
    try {
      const res = await fetch('/api/admin/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          routeId: scheduleForm.routeId,
          busId: scheduleForm.busId,
          departureTimes: timesArray,
          frequency: scheduleForm.frequency
        })
      });
      const data = await res.json();
      if (res.ok) {
        setShowAddScheduleModal(false);
        setScheduleForm({ routeId: '', busId: '', departureTimes: '', frequency: '' });
        fetchAllData();
      } else {
        alert(data.error || 'Failed to create schedule');
      }
    } catch (err) {
      console.error('Error creating schedule:', err);
    }
  }



  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex font-sans antialiased selection:bg-blue-500 selection:text-white">
      
      {/* LEFT SIDEBAR */}
      <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between shrink-0 print:hidden">
        <div>
          {/* Logo Brand Header */}
          <div className="px-6 py-6 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-extrabold text-blue-600 tracking-tight">SmartTransit</span>
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Admin Console</p>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {[
              { name: 'Dashboard', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
              { name: 'Requests', icon: 'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0L12 18l-8-5' },
              { name: 'Fleet Management', icon: 'M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z M13 11a4 4 0 01-8 0V7a4 4 0 018 0v4z' },
              { name: 'Route Planner', icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3' },
              { name: 'Live Tracking', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z' },
              { name: 'Schedules', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
              { name: 'Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
              { 
                name: 'Notifications', 
                icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9'
              },
              {
                name: 'Emergency Reports',
                icon: 'M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z'
              },
              {
                name: 'Lost & Found',
                icon: '🧳'
              },
              {
                name: 'Feedback & Ratings',
                icon: '⭐'
              },
              {
                name: 'Complaints Management',
                icon: '📋'
              },
              {
                name: 'Route Optimization',
                icon: '💡'
              }
            ].map((tab) => {
              const isActive = activeTab === tab.name;
              return (
                <button
                  key={tab.name}
                  onClick={() => setActiveTab(tab.name)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-150 ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 shadow-sm shadow-blue-500/5'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
                  </svg>
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sidebar Controls */}
        <div className="p-4 border-t border-slate-100 space-y-1">
          <button className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Settings</span>
          </button>
          
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>{isLoggingOut ? 'Logging Out...' : 'Logout'}</span>
          </button>
        </div>
      </aside>

      {/* RIGHT CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* TOP BAR / NAVIGATION */}
        <header className="h-20 bg-white border-b border-slate-200/80 flex items-center justify-between px-8 shrink-0 print:hidden">
          {/* Global Search */}
          <div className="w-96 relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search admin dashboard..."
              className="w-full pl-11 pr-4 py-2.5 bg-slate-100 border-none rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all duration-150"
            />
          </div>

          {/* User Info & Notifications */}
          <div className="flex items-center space-x-6">
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
                className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-50 hover:text-blue-600"
              >

                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>

                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                    {unreadCount > 99
                      ? '99+'
                      : unreadCount}
                  </span>
                )}

              </button>


              {notificationsOpen && (
                <div className="absolute right-0 z-50 mt-3 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">

                  {/* Notification Header */}

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


                  {/* Notification List */}

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
                                : 'bg-blue-50/60'
                            }`}
                          >

                            <div className="flex gap-3">

                              {/* Unread indicator */}

                              <div
                                className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                                  notification.read
                                    ? 'bg-slate-300'
                                    : 'bg-blue-600'
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
                                    <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-blue-600">
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

            <div className="flex items-center space-x-3 border-l border-slate-200 pl-6">
              <div className="text-right">
                <p className="text-sm font-bold text-slate-800">Zannatun</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Super Administrator</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">
                Z
              </div>
            </div>
          </div>
        </header>

        {/* SCREEN VIEWS */}
        <div className="flex-1 overflow-y-auto p-8">
          
          {/* VIEW: REQUESTS (DRIVER REGISTRATION) */}
          {activeTab === 'Requests' && (
            <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Driver Registration Requests</h2>
                  <p className="text-slate-500 text-sm mt-1">Review, approve, or reject pending driver credential submittals.</p>
                </div>
                <div className="flex bg-white border border-slate-200 rounded-xl p-1 space-x-1">
                  <button
                    onClick={() => setRequestFilter('pending')}
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                      requestFilter === 'pending' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Pending Requests ({drivers.filter(d => !d.isApproved).length})
                  </button>
                  <button
                    onClick={() => setRequestFilter('all')}
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                      requestFilter === 'all' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    All Drivers ({drivers.length})
                  </button>
                </div>
              </div>

              {/* Request Submissions Table */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                        <th className="pb-3">Driver Name</th>
                        <th className="pb-3">Contact</th>
                        <th className="pb-3">License Info</th>
                        <th className="pb-3">Organization</th>
                        <th className="pb-3">Current Status</th>
                        <th className="pb-3 text-right">Review Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                      {(requestFilter === 'pending' ? drivers.filter(d => !d.isApproved) : drivers).length === 0 ? (
                        <tr>
                          <td colSpan="6" className="py-8 text-center text-slate-400 font-medium">No driver registration files found matching filter.</td>
                        </tr>
                      ) : (
                        (requestFilter === 'pending' ? drivers.filter(d => !d.isApproved) : drivers).map((driver) => (
                          <tr key={driver._id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-4 font-bold text-slate-850">{driver.name}</td>
                            <td className="py-4">
                              <p className="text-xs text-slate-800">{driver.email}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">{driver.phone}</p>
                            </td>
                            <td className="py-4 font-mono text-xs">{driver.driverDetails?.licenseNo || '—'}</td>
                            <td className="py-4 text-xs">{driver.driverDetails?.orgName || '—'}</td>
                            <td className="py-4">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded tracking-wide uppercase ${
                                driver.isApproved 
                                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                                  : driver.status === 'rejected'
                                  ? 'bg-rose-50 text-rose-600 border border-rose-100'
                                  : 'bg-amber-50 text-amber-600 border border-amber-100'
                              }`}>
                                {driver.isApproved ? 'Approved' : driver.status}
                              </span>
                            </td>
                            <td className="py-4 text-right space-x-2">
                              {!driver.isApproved ? (
                                <>
                                  <button
                                    onClick={() => handleApproveDriver(driver._id, 'approve')}
                                    className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all"
                                  >
                                    Approve
                                  </button>
                                  {driver.status !== 'rejected' && (
                                    <button
                                      onClick={() => handleApproveDriver(driver._id, 'reject')}
                                      className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 font-bold text-slate-500 transition-all"
                                    >
                                      Reject
                                    </button>
                                  )}
                                </>
                              ) : (
                                <button
                                  onClick={() => handleApproveDriver(driver._id, 'reject')}
                                  className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 font-bold text-slate-500 transition-all"
                                >
                                  Revoke
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteDriver(driver._id)}
                                className="text-xs px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold transition-all"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: FLEET MANAGEMENT */}
          {activeTab === 'Fleet Management' && (
            <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn">
              {/* Header Title & Button */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Fleet Management</h2>
                  <p className="text-slate-500 text-sm mt-1">Manage your transit vehicles, routes, and operational schedules.</p>
                </div>
                <button
                  onClick={() => setShowAddBusModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl text-sm font-bold transition-all duration-150 flex items-center space-x-2 shadow-lg shadow-blue-500/10 hover:shadow-blue-600/15"
                >
                  <span>+ Add New Bus</span>
                </button>
              </div>

              {/* Stat Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { id: 'buses', title: 'Total Buses', value: stats?.totalBuses || buses.length, change: '+3% this month', icon: 'M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z', iconColor: 'text-blue-500 bg-blue-50', activeStyle: 'ring-2 ring-blue-500/80 bg-blue-50/10 border-blue-200' },
                  { id: 'routes', title: 'Active Routes', value: stats?.totalRoutes || routes.length, change: 'Stable', icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3', iconColor: 'text-orange-500 bg-orange-50', activeStyle: 'ring-2 ring-orange-500/80 bg-orange-50/10 border-orange-200' },
                  { id: 'drivers', title: 'Drivers Allocated', value: drivers.filter(d => d.isApproved).length, change: '98% Utilization', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', iconColor: 'text-slate-500 bg-slate-50', activeStyle: 'ring-2 ring-slate-500/80 bg-slate-50/10 border-slate-200' },
                  { id: 'trips', title: 'Today\'s Trips', value: stats?.totalTrips || '624', change: '+12 since 6AM', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', iconColor: 'text-emerald-500 bg-emerald-50', activeStyle: 'ring-2 ring-emerald-500/80 bg-emerald-50/10 border-emerald-200' }
                ].map((stat, idx) => {
                  const isSelectable = ['buses', 'routes', 'drivers', 'trips'].includes(stat.id);
                  const isActive = fleetSubView === stat.id;
                  
                  return (
                    <button
                      key={idx}
                      onClick={() => isSelectable && setFleetSubView(stat.id)}
                      disabled={!isSelectable}
                      className={`text-left bg-white border border-slate-200/80 rounded-2xl p-6 flex items-center justify-between transition-all duration-200 ${
                        isSelectable ? 'cursor-pointer hover:shadow-md hover:border-slate-300' : 'cursor-default'
                      } ${isActive ? stat.activeStyle : ''}`}
                    >
                      <div>
                        <span className="text-sm font-semibold text-slate-400">{stat.title}</span>
                        <p className="text-3xl font-extrabold text-slate-900 mt-2">{stat.value}</p>
                        <span className="text-xs font-bold text-emerald-500 mt-1 block">
                          {stat.change}
                        </span>
                      </div>
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.iconColor}`}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d={stat.icon} />
                        </svg>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Main Fleet Panels */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Dynamic Detail Card */}
                <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-6 flex flex-col justify-between min-h-[500px]">
                  <div>
                    {/* View: BUSES */}
                    {fleetSubView === 'buses' && (
                      <>
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-lg font-bold text-slate-900">Bus Inventory</h3>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-sm">
                            <thead>
                              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                                <th className="pb-3">Bus ID / Number</th>
                                <th className="pb-3">Driver</th>
                                <th className="pb-3">Route</th>
                                <th className="pb-3">Capacity</th>
                                <th className="pb-3">Status</th>
                                <th className="pb-3 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                              {buses.length === 0 ? (
                                <tr>
                                  <td colSpan="6" className="py-6 text-center text-slate-400">No buses registered in the system.</td>
                                </tr>
                              ) : (
                                buses.map((bus) => (
                                  <tr key={bus._id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="py-4 font-bold text-slate-800">{bus.busNumber}</td>
                                    <td className="py-4">{bus.driverId?.name || <span className="text-slate-400">Unassigned</span>}</td>
                                    <td className="py-4 text-blue-600 font-semibold">{bus.routeId?.name || <span className="text-slate-400">No Route</span>}</td>
                                    <td className="py-4 text-slate-400">{bus.capacity} Seats</td>
                                    <td className="py-4">
                                      <span className={`text-[10px] font-bold px-2 py-1 rounded-md tracking-wide uppercase ${
                                        bus.status === 'active' 
                                          ? 'bg-emerald-50 text-emerald-600' 
                                          : 'bg-rose-50 text-rose-600'
                                      }`}>
                                        {bus.status}
                                      </span>
                                    </td>
                                    <td className="py-4 text-right space-x-2">
                                      <button
                                        onClick={() => toggleBusStatus(bus._id, bus.status)}
                                        className="text-xs px-2.5 py-1 rounded bg-slate-100 hover:bg-blue-100 hover:text-blue-600 font-bold text-slate-600 transition-colors cursor-pointer"
                                      >
                                        {bus.status === 'active' ? 'Disable' : 'Enable'}
                                      </button>
                                      <button
                                        onClick={() => deleteBus(bus._id)}
                                        className="text-xs px-2.5 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold transition-colors cursor-pointer"
                                      >
                                        Delete
                                      </button>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}

                    {/* View: ROUTES */}
                    {fleetSubView === 'routes' && (
                      <>
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-lg font-bold text-slate-900">Active Route Inventory</h3>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-sm">
                            <thead>
                              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                                <th className="pb-3">Route Name</th>
                                <th className="pb-3">Distance</th>
                                <th className="pb-3">Duration</th>
                                <th className="pb-3">Stops</th>
                                <th className="pb-3 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                              {routes.length === 0 ? (
                                <tr>
                                  <td colSpan="5" className="py-6 text-center text-slate-400">No active routes registered.</td>
                                </tr>
                              ) : (
                                routes.map((route) => (
                                  <tr key={route._id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="py-4 font-bold text-slate-800">{route.name}</td>
                                    <td className="py-4 text-slate-550">{route.distance} km</td>
                                    <td className="py-4 text-slate-550">{route.estimatedDuration} mins</td>
                                    <td className="py-4">
                                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[11px] font-bold">
                                        {route.stops?.length || 0} stops
                                      </span>
                                    </td>
                                    <td className="py-4 text-right">
                                      <button
                                        onClick={() => deleteRoute(route._id)}
                                        className="text-xs px-2.5 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold transition-colors cursor-pointer"
                                      >
                                        Delete
                                      </button>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}

                    {/* View: DRIVERS */}
                    {fleetSubView === 'drivers' && (
                      <>
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-lg font-bold text-slate-900">Driver Directory</h3>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-sm">
                            <thead>
                              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                                <th className="pb-3">Driver Info</th>
                                <th className="pb-3">Assigned Vehicle</th>
                                <th className="pb-3">Approval</th>
                                <th className="pb-3 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                              {drivers.length === 0 ? (
                                <tr>
                                  <td colSpan="4" className="py-6 text-center text-slate-400">No registered drivers.</td>
                                </tr>
                              ) : (
                                drivers.map((driver) => {
                                  const assignedBus = buses.find(b => b.driverId?._id === driver._id);
                                  return (
                                    <tr key={driver._id} className="hover:bg-slate-50/50 transition-colors">
                                      <td className="py-4">
                                        <div className="font-bold text-slate-800">{driver.name}</div>
                                        <div className="text-[11px] text-slate-400">{driver.email}</div>
                                      </td>
                                      <td className="py-4 font-semibold text-blue-600">
                                        {assignedBus ? assignedBus.busNumber : <span className="text-slate-400 font-medium">None</span>}
                                      </td>
                                      <td className="py-4">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded tracking-wide uppercase ${
                                          driver.isApproved 
                                            ? 'bg-emerald-50 text-emerald-600' 
                                            : 'bg-amber-50 text-amber-600'
                                        }`}>
                                          {driver.isApproved ? 'Approved' : 'Pending'}
                                        </span>
                                      </td>
                                      <td className="py-4 text-right space-x-2">
                                        {!driver.isApproved ? (
                                          <button
                                            onClick={() => handleApproveDriver(driver._id, 'approve')}
                                            className="text-xs px-2.5 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-bold transition-colors cursor-pointer"
                                          >
                                            Approve
                                          </button>
                                        ) : (
                                          <button
                                            onClick={() => handleApproveDriver(driver._id, 'reject')}
                                            className="text-xs px-2.5 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-600 font-bold transition-colors cursor-pointer"
                                          >
                                            Suspend
                                          </button>
                                        )}
                                        <button
                                          onClick={() => handleDeleteDriver(driver._id)}
                                          className="text-xs px-2.5 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold transition-colors cursor-pointer"
                                        >
                                          Delete
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}

                    {/* View: TRIPS */}
                    {fleetSubView === 'trips' && (
                      <>
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-lg font-bold text-slate-900">{"Today's Active Trips"}</h3>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-sm">
                            <thead>
                              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                                <th className="pb-3">Bus Number</th>
                                <th className="pb-3">Route</th>
                                <th className="pb-3">Driver</th>
                                <th className="pb-3">Start Time</th>
                                <th className="pb-3">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                              {trips.length === 0 ? (
                                <tr>
                                  <td colSpan="5" className="py-6 text-center text-slate-400">No active trips recorded for today.</td>
                                </tr>
                              ) : (
                                trips.map((trip) => {
                                  const statusColors = {
                                    scheduled: 'bg-slate-100 text-slate-600',
                                    running: 'bg-blue-50 text-blue-605',
                                    delayed: 'bg-amber-50 text-amber-600',
                                    completed: 'bg-emerald-50 text-emerald-600',
                                    cancelled: 'bg-rose-50 text-rose-600'
                                  };
                                  return (
                                    <tr key={trip._id} className="hover:bg-slate-50/50 transition-colors">
                                      <td className="py-4 font-bold text-slate-800">{trip.busId?.busNumber || 'N/A'}</td>
                                      <td className="py-4 font-semibold text-blue-600">{trip.routeId?.name || 'N/A'}</td>
                                      <td className="py-4 font-medium">{trip.driverId?.name || 'N/A'}</td>
                                      <td className="py-4 text-xs text-slate-450">{new Date(trip.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                      <td className="py-4">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded tracking-wide uppercase ${
                                          statusColors[trip.status] || 'bg-slate-100 text-slate-600'
                                        }`}>
                                          {trip.status}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Right Column Assignment Dashboard */}
                <div className="space-y-8">
                  {/* Route Assignment Form */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-6">Route Assignment</h3>
                    <form onSubmit={handleRouteAssignment} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Select Bus</label>
                        <select
                          value={selectedBusId}
                          onChange={(e) => setSelectedBusId(e.target.value)}
                          required
                          className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                        >
                          <option value="">Select vehicle...</option>
                          {buses.map(b => (
                            <option key={b._id} value={b._id}>{b.busNumber}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Assign Route</label>
                        <select
                          value={selectedRouteId}
                          onChange={(e) => setSelectedRouteId(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                        >
                          <option value="">Select route...</option>
                          {routes.map(r => (
                            <option key={r._id} value={r._id}>{r.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Allocate Driver</label>
                        <select
                          value={selectedDriverId}
                          onChange={(e) => setSelectedDriverId(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                        >
                          <option value="">Select driver...</option>
                          {drivers.filter(d => d.isApproved).map(d => (
                            <option key={d._id} value={d._id}>{d.name} ({d.phone})</option>
                          ))}
                        </select>
                      </div>

                      <button
                        type="submit"
                        disabled={isAssigning}
                        className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all disabled:opacity-50"
                      >
                        {isAssigning ? 'Saving Assignment...' : 'Confirm Assignment'}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: ROUTE PLANNER */}
          {activeTab === 'Route Planner' && (
            <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Route Planner & Bus Stops</h2>
                  <p className="text-slate-500 text-sm mt-1">Configure paths, distances, and registered checkpoints.</p>
                </div>
                <div className="space-x-3">
                  <button onClick={() => setShowAddStopModal(true)} className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-5 py-3 rounded-xl text-sm font-bold transition-all">
                    + Add Bus Stop
                  </button>
                  <button onClick={() => setShowAddRouteModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-500/10">
                    + Create Route
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Routes List */}
                <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-6">Configured Routes</h3>
                  <div className="space-y-4">
                    {routes.length === 0 ? (
                      <p className="text-slate-400 text-center py-6 text-sm">No routes configured yet.</p>
                    ) : (
                      routes.map((route) => (
                        <div key={route._id} className="border border-slate-100 p-5 rounded-xl bg-slate-50/50 hover:bg-white transition-all">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-bold text-slate-800">{route.name}</p>
                              <p className="text-xs text-slate-400 mt-1">
                                Distance: {route.distance} km • Est. Duration: {route.estimatedDuration} mins
                              </p>
                            </div>
                            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                              {route.stops?.length || 0} Stops
                            </span>
                          </div>
                          {route.stops && route.stops.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-slate-100/50 flex flex-wrap gap-2">
                              {route.stops.map((stop, idx) => (
                                <span key={idx} className="text-[10px] font-bold px-2 py-1 bg-white border border-slate-200 rounded text-slate-500">
                                  {stop.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Bus Stops List */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-6">Registered Bus Stops</h3>
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    {stops.length === 0 ? (
                      <p className="text-slate-400 text-center py-6 text-sm">No stops created yet.</p>
                    ) : (
                      stops.map((stop) => (
                        <div key={stop._id} className="p-3.5 bg-slate-50 rounded-xl flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-slate-800">{stop.name}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              Coords: {stop.location?.coordinates?.join(', ') || 'None'}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: SCHEDULES */}
          {activeTab === 'Schedules' && (
            <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Transit Schedules</h2>
                  <p className="text-slate-500 text-sm mt-1">Assign and coordinate departure timings and frequencies.</p>
                </div>
                <button onClick={() => setShowAddScheduleModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-500/10">
                  + Create Schedule
                </button>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-2xl p-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                        <th className="pb-3">Route Name</th>
                        <th className="pb-3">Assigned Bus</th>
                        <th className="pb-3">Departure Times</th>
                        <th className="pb-3">Frequency</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                      {schedules.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="py-6 text-center text-slate-400">No schedules configured in the system.</td>
                        </tr>
                      ) : (
                        schedules.map((schedule) => (
                          <tr key={schedule._id}>
                            <td className="py-4 font-bold text-slate-800">{schedule.routeId?.name || 'Unknown Route'}</td>
                            <td className="py-4 text-blue-600 font-semibold">{schedule.busId?.busNumber || 'Unassigned'}</td>
                            <td className="py-4">
                              <div className="flex flex-wrap gap-1.5">
                                {schedule.departureTimes?.map((time, idx) => (
                                  <span key={idx} className="text-xs px-2 py-0.5 bg-slate-100 rounded text-slate-600 font-semibold">
                                    {time}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="py-4 text-slate-400">{schedule.frequency || 'Regular interval'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: LIVE TRACKING */}
          {activeTab === 'Live Tracking' && (
            <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn">
              <div>
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Live Tracking</h2>
                <p className="text-slate-500 text-sm mt-1">Real-time coordinates and active vehicle indicators.</p>
              </div>
              <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center text-slate-400 max-w-xl mx-auto space-y-4">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                </div>
                <h3 className="font-bold text-slate-850">Live Map View is active</h3>
                <p className="text-xs text-slate-400">All registered active buses ({buses.filter(b => b.status === 'active').length} units) are currently streaming coordinates over WebSocket server on port 3000.</p>
              </div>
            </div>
          )}

          {/* VIEW: ANALYTICS */}
          {activeTab === 'Analytics' && (
            <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn print:space-y-4 print:p-0">
              {/* Header Title & Export button */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
                <div>
                  <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Performance Analytics</h2>
                  <p className="text-slate-500 text-sm mt-1">Comprehensive overview of transit network performance and fleet metrics.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-blue-500/10 flex items-center space-x-1.5 transition-colors cursor-pointer">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    <span>Export PDF Report</span>
                  </button>
                </div>
              </div>

              {/* Print Header (Only visible when printing) */}
              <div className="hidden print:block border-b-2 border-slate-200 pb-4 mb-6">
                <h1 className="text-4xl font-extrabold text-slate-900">SmartTransit Performance Report</h1>
                <p className="text-slate-500 text-sm mt-1">Generated on: {new Date().toLocaleString()}</p>
                {(analyticsStartDate || analyticsEndDate) && (
                  <p className="text-slate-700 text-xs mt-1">
                    Date Range: {analyticsStartDate || 'Beginning'} to {analyticsEndDate || 'Present'}
                  </p>
                )}
              </div>

              {/* Filters Panel */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-wrap gap-4 items-end print:hidden">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Start Date</label>
                  <input
                    type="date"
                    value={analyticsStartDate}
                    onChange={(e) => setAnalyticsStartDate(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700"
                  />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">End Date</label>
                  <input
                    type="date"
                    value={analyticsEndDate}
                    onChange={(e) => setAnalyticsEndDate(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700"
                  />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Filter Route</label>
                  <select
                    value={analyticsRouteFilter}
                    onChange={(e) => setAnalyticsRouteFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700"
                  >
                    <option value="">All Routes</option>
                    {routes.map((r) => (
                      <option key={r._id} value={r._id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Filter Driver</label>
                  <select
                    value={analyticsDriverFilter}
                    onChange={(e) => setAnalyticsDriverFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700"
                  >
                    <option value="">All Drivers</option>
                    {drivers.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => {
                    setAnalyticsStartDate('');
                    setAnalyticsEndDate('');
                    setAnalyticsRouteFilter('');
                    setAnalyticsDriverFilter('');
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Clear Filters
                </button>
              </div>

              {analyticsLoading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-slate-500 text-sm font-semibold">Loading transit performance data...</p>
                </div>
              ) : (
                <div className="space-y-8 print:space-y-6">
                  {/* KPI Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 print:grid-cols-4 print:gap-4">
                    {[
                      {
                        title: 'Completed Trips',
                        value: stats?.completedTrips || '0',
                        sub: `Out of ${stats?.totalTrips || 0} scheduled`,
                        color: 'text-blue-600 bg-blue-50'
                      },
                      {
                        title: 'Average Delay',
                        value: `${stats?.averageDelayMinutes || 0} mins`,
                        sub: 'System-wide delay frequency',
                        color: 'text-orange-500 bg-orange-50'
                      },
                      {
                        title: 'Total Active Routes',
                        value: stats?.totalRoutes || '0',
                        sub: `${stats?.totalSchedules || 0} active schedules`,
                        color: 'text-emerald-500 bg-emerald-50'
                      },
                      {
                        title: 'Active Buses',
                        value: stats?.totalBuses || '0',
                        sub: `${buses.filter(b => b.status === 'active').length} in active status`,
                        color: 'text-indigo-500 bg-indigo-50'
                      }
                    ].map((stat, idx) => (
                      <div key={idx} className="bg-white border border-slate-200/80 rounded-2xl p-6 print:p-4 shadow-sm flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.title}</span>
                          <p className="text-3xl font-extrabold text-slate-900 mt-2">{stat.value}</p>
                          <span className="text-xs font-semibold text-slate-450 block mt-1">{stat.sub}</span>
                        </div>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold ${stat.color} print:hidden`}>
                          #
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Section 1: Route Popularity & Average Delay */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:grid-cols-1">
                    {/* Card 1: Route Popularity */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 page-break-inside">
                      <h3 className="text-lg font-bold text-slate-900">Route Popularity</h3>
                      <p className="text-xs text-slate-400">Total completed trip counts across transit routes</p>
                      
                      {(() => {
                        const dataList = analyticsRouteFilter
                          ? routePopularity.filter(r => r._id === analyticsRouteFilter)
                          : routePopularity;
                        
                        if (dataList.length === 0) {
                          return <p className="text-sm text-slate-400 py-20 text-center">No route popularity data available.</p>;
                        }

                        const labels = dataList.map(r => r.routeName);
                        const tripCounts = dataList.map(r => r.tripCount);

                        const chartData = {
                          labels,
                          datasets: [
                            {
                              label: 'Trips Completed',
                              data: tripCounts,
                              backgroundColor: 'rgba(59, 130, 246, 0.8)',
                              hoverBackgroundColor: 'rgba(37, 99, 235, 1)',
                              borderRadius: 8,
                              borderSkipped: false,
                            }
                          ]
                        };

                        const chartOptions = {
                          indexAxis: 'y',
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { display: false },
                            tooltip: {
                              backgroundColor: '#1e293b',
                              titleColor: '#ffffff',
                              bodyColor: '#ffffff',
                              padding: 10,
                              cornerRadius: 8
                            }
                          },
                          scales: {
                            x: {
                              grid: { color: 'rgba(241, 245, 249, 1)' },
                              ticks: { font: { weight: 'bold' }, color: '#94a3b8' }
                            },
                            y: {
                              grid: { display: false },
                              ticks: { font: { weight: 'bold' }, color: '#475569' }
                            }
                          }
                        };

                        const dynamicHeight = Math.max(256, dataList.length * 35);

                        return (
                          <div style={{ height: `${dynamicHeight}px` }} className="relative">
                            <Bar data={chartData} options={chartOptions} />
                          </div>
                        );
                      })()}
                    </div>

                    {/* Card 2: Average Delay by Route */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 page-break-inside">
                      <h3 className="text-lg font-bold text-slate-900">Average Delay by Route</h3>
                      <p className="text-xs text-slate-400">Average trip delay minutes per route</p>

                      {(() => {
                        const dataList = analyticsRouteFilter
                          ? averageDelays.filter(r => r._id === analyticsRouteFilter)
                          : averageDelays;

                        if (dataList.length === 0) {
                          return <p className="text-sm text-slate-400 py-20 text-center">No delay data available.</p>;
                        }

                        const labels = dataList.map(r => r.routeName);
                        const delayMins = dataList.map(r => r.averageDelayMinutes);

                        // Color mapping: red for > 10, orange for 5-10, green for < 5 mins
                        const backgroundColors = delayMins.map(val => {
                          if (val > 10) return 'rgba(239, 68, 68, 0.8)';
                          if (val >= 5) return 'rgba(245, 158, 11, 0.8)';
                          return 'rgba(16, 185, 129, 0.8)';
                        });
                        const hoverColors = delayMins.map(val => {
                          if (val > 10) return 'rgba(220, 38, 38, 1)';
                          if (val >= 5) return 'rgba(217, 119, 6, 1)';
                          return 'rgba(5, 150, 105, 1)';
                        });

                        const chartData = {
                          labels,
                          datasets: [
                            {
                              label: 'Avg. Delay (Minutes)',
                              data: delayMins,
                              backgroundColor: backgroundColors,
                              hoverBackgroundColor: hoverColors,
                              borderRadius: 8,
                            }
                          ]
                        };

                        const chartOptions = {
                          indexAxis: 'y',
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { display: false },
                            tooltip: {
                              backgroundColor: '#1e293b',
                              titleColor: '#ffffff',
                              bodyColor: '#ffffff',
                              padding: 10,
                              cornerRadius: 8
                            }
                          },
                          scales: {
                            x: {
                              grid: { color: 'rgba(241, 245, 249, 1)' },
                              ticks: { font: { weight: 'bold' }, color: '#94a3b8' }
                            },
                            y: {
                              grid: { display: false },
                              ticks: { font: { weight: 'bold' }, color: '#475569' }
                            }
                          }
                        };

                        const dynamicHeight = Math.max(256, dataList.length * 35);

                        return (
                          <div style={{ height: `${dynamicHeight}px` }} className="relative">
                            <Bar data={chartData} options={chartOptions} />
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Section 2: Completed Trips Breakdown & Peak hours */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:grid-cols-1">
                    {/* Card 1: Completed Trips GroupBy Breakdown */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 lg:col-span-1 page-break-inside">
                      <div className="flex items-center justify-between">
                        <h3 className="text-md font-bold text-slate-900">Completed Trips</h3>
                        <div className="flex bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold text-slate-500 print:hidden">
                          {['route', 'bus', 'driver'].map((group) => (
                            <button
                              key={group}
                              onClick={() => setCompletedTripsGroup(group)}
                              className={`px-2 py-1 rounded-md uppercase tracking-wider transition-colors cursor-pointer ${
                                completedTripsGroup === group ? 'bg-white text-blue-600 shadow-sm' : 'hover:text-slate-800'
                              }`}
                            >
                              {group}
                            </button>
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-slate-400">Grouped by {completedTripsGroup} view</p>

                      {completedTrips.length === 0 ? (
                        <p className="text-sm text-slate-400 py-20 text-center">No completed trip data found.</p>
                      ) : (
                        (() => {
                          const labels = completedTrips.map(item => item.label);
                          const counts = completedTrips.map(item => item.completedCount);

                          // Color palette generators
                          const baseColors = [
                            'rgba(99, 102, 241, 0.8)',  // Indigo
                            'rgba(16, 185, 129, 0.8)',  // Emerald
                            'rgba(245, 158, 11, 0.8)',  // Amber
                            'rgba(239, 68, 68, 0.8)',   // Red
                            'rgba(14, 165, 233, 0.8)',  // Sky
                            'rgba(139, 92, 246, 0.8)',  // Purple
                          ];

                          const chartData = {
                            labels,
                            datasets: [
                              {
                                data: counts,
                                backgroundColor: baseColors.slice(0, counts.length).concat(
                                  Array.from({ length: Math.max(0, counts.length - baseColors.length) }, (_, i) => `hsla(${(i * 45) % 360}, 70%, 60%, 0.8)`)
                                ),
                                borderWidth: 2,
                                borderColor: '#ffffff',
                              }
                            ]
                          };

                          const chartOptions = {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                position: 'bottom',
                                labels: {
                                  boxWidth: 10,
                                  font: { size: 10, weight: 'bold' },
                                  color: '#64748b'
                                }
                              },
                              tooltip: {
                                backgroundColor: '#1e293b',
                                padding: 10,
                                cornerRadius: 8
                              }
                            }
                          };

                          return (
                            <div className="h-64 relative">
                              <Doughnut data={chartData} options={chartOptions} />
                            </div>
                          );
                        })()
                      )}
                    </div>

                    {/* Card 2: Peak Hours Line chart */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 lg:col-span-2 page-break-inside">
                      <h3 className="text-lg font-bold text-slate-900">Peak Travel Hours</h3>
                      <p className="text-xs text-slate-400">Distribution of passenger travel activity and trip start times by hour of day</p>

                      {peakHours.length === 0 ? (
                        <p className="text-sm text-slate-400 py-20 text-center">No passenger activity records found.</p>
                      ) : (
                        (() => {
                          const fullHours = Array.from({ length: 24 }, (_, i) => {
                            const found = peakHours.find(p => p.hour === i);
                            return { hour: i, count: found ? found.tripCount : 0 };
                          });

                          const labels = fullHours.map(item => {
                            const hr = item.hour;
                            if (hr === 0) return '12 AM';
                            if (hr === 12) return '12 PM';
                            return hr > 12 ? `${hr - 12} PM` : `${hr} AM`;
                          });
                          const dataPoints = fullHours.map(item => item.count);

                          const chartData = {
                            labels,
                            datasets: [
                              {
                                label: 'Trips Started',
                                data: dataPoints,
                                borderColor: 'rgba(79, 70, 229, 1)',
                                borderWidth: 3,
                                pointBackgroundColor: 'rgba(79, 70, 229, 1)',
                                pointHoverRadius: 6,
                                tension: 0.4,
                                fill: true,
                                backgroundColor: (context) => {
                                  const ctx = context.chart.ctx;
                                  const gradient = ctx.createLinearGradient(0, 0, 0, 200);
                                  gradient.addColorStop(0, 'rgba(99, 102, 241, 0.35)');
                                  gradient.addColorStop(1, 'rgba(99, 102, 241, 0)');
                                  return gradient;
                                }
                              }
                            ]
                          };

                          const chartOptions = {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: { display: false },
                              tooltip: {
                                backgroundColor: '#1e293b',
                                padding: 10,
                                cornerRadius: 8
                              }
                            },
                            scales: {
                              x: {
                                grid: { display: false },
                                ticks: { font: { weight: 'bold' }, color: '#94a3b8', maxTicksLimit: 12 }
                              },
                              y: {
                                grid: { color: 'rgba(241, 245, 249, 1)' },
                                ticks: { font: { weight: 'bold' }, color: '#94a3b8' }
                              }
                            }
                          };

                          return (
                            <div className="h-64 relative">
                              <Line data={chartData} options={chartOptions} />
                            </div>
                          );
                        })()
                      )}
                    </div>
                  </div>

                  {/* Section 3: Driver Performance Table */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 page-break-inside">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">Driver Performance Evaluation</h3>
                        <p className="text-xs text-slate-400">Punctuality rates, total completed trips, and delays per driver</p>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Search driver..."
                          value={driverSearchQuery}
                          onChange={e => setDriverSearchQuery(e.target.value)}
                          className="px-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 max-w-xs text-slate-700 print:hidden"
                        />
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-150 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <th className="py-3 px-4">Driver Name</th>
                            <th className="py-3 px-4">Total Trips</th>
                            <th className="py-3 px-4">Completed</th>
                            <th className="py-3 px-4">Delayed Trips</th>
                            <th className="py-3 px-4">Total Delay</th>
                            <th className="py-3 px-4">Punctuality</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                          {driverPerformance.filter(d => {
                            const matchesDriver = analyticsDriverFilter ? d._id === analyticsDriverFilter : true;
                            const matchesSearch = driverSearchQuery
                              ? d.driverName.toLowerCase().includes(driverSearchQuery.toLowerCase()) ||
                                d.driverEmail.toLowerCase().includes(driverSearchQuery.toLowerCase())
                              : true;
                            return matchesDriver && matchesSearch;
                          }).length === 0 ? (
                            <tr>
                              <td colSpan="6" className="py-6 text-center text-slate-400">No driver records found.</td>
                            </tr>
                          ) : (
                            driverPerformance.filter(d => {
                              const matchesDriver = analyticsDriverFilter ? d._id === analyticsDriverFilter : true;
                              const matchesSearch = driverSearchQuery
                                ? d.driverName.toLowerCase().includes(driverSearchQuery.toLowerCase()) ||
                                  d.driverEmail.toLowerCase().includes(driverSearchQuery.toLowerCase())
                                : true;
                              return matchesDriver && matchesSearch;
                            }).map((driver) => {
                              const punct = driver.punctualityRate;
                              const punctColor = punct >= 90 ? 'bg-green-50 text-green-700 border-green-200' : punct >= 75 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-700 border-red-200';
                              
                              return (
                                <tr key={driver._id} className="hover:bg-slate-50/50">
                                  <td className="py-3.5 px-4 font-bold text-slate-800">
                                    <div>{driver.driverName}</div>
                                    <div className="text-[10px] text-slate-400 font-medium">{driver.driverEmail}</div>
                                  </td>
                                  <td className="py-3.5 px-4 font-semibold text-slate-600">{driver.totalTrips}</td>
                                  <td className="py-3.5 px-4 font-semibold text-emerald-600">{driver.completedTrips}</td>
                                  <td className="py-3.5 px-4 font-semibold text-rose-600">{driver.delayedTrips}</td>
                                  <td className="py-3.5 px-4 text-slate-500 font-medium">{driver.totalDelayMinutes} mins</td>
                                  <td className="py-3.5 px-4">
                                    <span className={`px-2 py-1 rounded-full border text-[10px] font-extrabold ${punctColor}`}>
                                      {punct}%
                                    </span>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Section 4: Bus & Fleet Utilization */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 page-break-inside">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">Bus & Fleet Utilization</h3>
                        <p className="text-xs text-slate-400">Comparison of completed trips vs scheduled trips per bus unit</p>
                      </div>
                      <input
                        type="text"
                        placeholder="Search bus number..."
                        value={busSearchQuery}
                        onChange={e => setBusSearchQuery(e.target.value)}
                        className="px-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 max-w-xs text-slate-700 print:hidden"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {busUtilization.filter(b => {
                        return busSearchQuery
                          ? b.busNumber.toLowerCase().includes(busSearchQuery.toLowerCase())
                          : true;
                      }).length === 0 ? (
                        <p className="text-sm text-slate-400 py-6 text-center col-span-3">No bus utilization data found.</p>
                      ) : (
                        busUtilization.filter(b => {
                          return busSearchQuery
                            ? b.busNumber.toLowerCase().includes(busSearchQuery.toLowerCase())
                            : true;
                        }).map((bus) => {
                          const rate = bus.utilizationRate;
                          const rateColor = rate >= 80 ? 'text-emerald-500' : rate >= 50 ? 'text-orange-500' : 'text-red-500';
                          const rateBg = rate >= 80 ? 'bg-emerald-500' : rate >= 50 ? 'bg-orange-500' : 'bg-red-500';
                          
                          return (
                            <div key={bus._id} className="border border-slate-100 rounded-xl p-4 space-y-3 hover:shadow-md transition-shadow">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-extrabold text-slate-800 text-sm">{bus.busNumber}</h4>
                                  <span className="text-[10px] text-slate-400 font-bold uppercase">Capacity: {bus.capacity} seats</span>
                                </div>
                                <span className={`text-xs font-bold ${rateColor}`}>{rate}% Utilized</span>
                              </div>
                              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div className={`${rateBg} h-full rounded-full transition-all duration-300`} style={{ width: `${rate}%` }}></div>
                              </div>
                              <div className="flex justify-between text-[10px] font-semibold text-slate-500">
                                <span>Completed: <strong className="text-slate-700">{bus.completedTrips}</strong></span>
                                <span>Cancelled: <strong className="text-slate-700">{bus.cancelledTrips}</strong></span>
                                <span>Total: <strong className="text-slate-700">{bus.totalTrips}</strong></span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW: EMERGENCY REPORTS */}

          {activeTab === 'Emergency Reports' && (

          <div className="max-w-7xl mx-auto space-y-8">

          <h2 className="text-3xl font-extrabold text-slate-900">
          Emergency Reports
          </h2>


          <div className="bg-white rounded-2xl border p-6">

          <table className="w-full text-sm">

          <thead>
          <tr className="border-b text-slate-400 uppercase text-xs">
          <th>Passenger</th>
          <th>Bus</th>
          <th>Category</th>
          <th>Description</th>
          <th>Location</th>
          <th>Status</th>
          <th>Action</th>
          </tr>
          </thead>


          <tbody>

          {emergencyReports.map(report=>(

          <tr key={report._id}
          className="border-b">

          <td>
          {report.passengerId?.name}
          </td>


          <td>
          {report.busId?.busNumber || 'N/A'}
          </td>


          <td>
          {report.category}
          </td>


          <td>
          {report.description}
          </td>


          <td>
          {report.location?.coordinates?.join(', ')}
          </td>


          <td>
          <span>
          {report.status}
          </span>
          </td>


          <td>

          <select
          value={report.status}
          onChange={
          (e)=>
          updateEmergencyStatus(
          report._id,
          e.target.value
          )
          }
          >

          <option value="pending">
          Pending
          </option>

          <option value="investigating">
          Investigating
          </option>

          <option value="resolved">
          Resolved
          </option>

          </select>

          </td>


          </tr>

          ))}

          </tbody>


          </table>

          </div>

          </div>

          )}

          {/* VIEW: LOST & FOUND */}

          {activeTab === 'Lost & Found' && (

            <div className="space-y-6">

              <h1 className="text-3xl font-extrabold text-slate-900">
                Lost & Found Management
              </h1>


              <div className="
                overflow-x-auto
                rounded-2xl
                border
                border-slate-200
                bg-white
                shadow-sm
              ">

                <table className="w-full text-sm">


                  <thead className="bg-slate-50">

                    <tr>

                      <th className="px-5 py-4 text-left">
                        Passenger
                      </th>

                      <th className="px-5 py-4 text-left">
                        Email
                      </th>

                      <th className="px-5 py-4 text-left">
                        Lost Item
                      </th>

                      <th className="px-5 py-4 text-left">
                        Status
                      </th>

                      <th className="px-5 py-4 text-left">
                        Action
                      </th>

                    </tr>

                  </thead>


                  <tbody>


                  {isLoadingLostItems ? (

                    <tr>

                      <td
                        colSpan="5"
                        className="p-6 text-center"
                      >

                        Loading lost items...

                      </td>

                    </tr>


                  ) : lostItems.length === 0 ? (

                    <tr>

                      <td
                        colSpan="5"
                        className="p-6 text-center"
                      >

                        No lost item reports found.

                      </td>

                    </tr>


                  ) : (

                    lostItems.map((item)=>(

                      <tr
                        key={item._id}
                        className="border-t"
                      >


                        <td className="px-5 py-4">

                          {item.passengerId?.name ||
                          'Unknown'}

                        </td>


                        <td className="px-5 py-4">

                          {item.passengerId?.email ||
                          '-'}

                        </td>


                        <td className="px-5 py-4">

                          {item.description}

                        </td>


                        <td className="px-5 py-4">

                          <span className="
                            rounded-full
                            bg-yellow-100
                            px-3
                            py-1
                            text-xs
                            font-semibold
                          ">

                            {item.status}

                          </span>

                        </td>


                        <td className="px-5 py-4">


                          <select

                            value={item.status}

                            onChange={async(e)=>{


                              await fetch(
                                '/api/admin/lost-items',
                                {

                                  method:'PATCH',

                                  headers:{
                                    'Content-Type':
                                    'application/json',
                                  },

                                  body:
                                  JSON.stringify({

                                    itemId:
                                    item._id,

                                    status:
                                    e.target.value,

                                  }),

                                }
                              );


                              fetchLostItems();


                            }}

                            className="
                              rounded-lg
                              border
                              px-3
                              py-2
                            "

                          >

                            <option value="reported">
                              Reported
                            </option>

                            <option value="found">
                              Found
                            </option>

                            <option value="claimed">
                              Claimed
                            </option>


                          </select>


                        </td>


                      </tr>

                    ))

                  )}


                  </tbody>


                </table>


              </div>


            </div>

          )}

          {/* VIEW: COMPLAINTS MANAGEMENT */}
          {activeTab === 'Complaints Management' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-extrabold text-slate-900">
                  📋 Centralized Complaints & Support
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                  Manage passenger complaints, safety hazards, and customer service requests.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                  <h2 className="font-bold text-slate-900 text-lg">Active Complaints</h2>
                  <span className="bg-blue-50 text-blue-700 font-bold px-3 py-1 rounded-full text-xs">
                    {complaints.length} Total
                  </span>
                </div>

                {isLoadingComplaints ? (
                  <div className="p-8 text-center text-slate-500 font-medium">Loading complaints...</div>
                ) : complaints.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {complaints.map((c) => (
                      <div key={c._id} className="p-6 hover:bg-slate-50/50 transition">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center space-x-3">
                              <span className="font-bold text-slate-900 text-base">{c.category}</span>
                              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                c.status === 'resolved'
                                  ? 'bg-green-50 text-green-700 border border-green-200'
                                  : c.status === 'in-progress'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}>
                                {c.status}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1">
                              Submitted by: <strong className="text-slate-600">{c.userId?.name || 'Passenger'}</strong> ({c.userId?.email || 'N/A'}) • Filed on {new Date(c.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <p className="mt-3 text-sm text-slate-700 bg-slate-50 rounded-xl p-3 border border-slate-100">
                          {c.description}
                        </p>

                        {c.relatedRouteId && (
                          <div className="mt-2 flex items-center space-x-2 text-xs text-slate-500">
                            <span>🗺️ Related Route: <strong>{c.relatedRouteId.name}</strong></span>
                          </div>
                        )}

                        {c.resolutionNote && (
                          <div className="mt-3 text-xs bg-green-50/40 text-green-800 rounded-xl p-3 border border-green-100/50">
                            <strong>Support Note:</strong> {c.resolutionNote}
                          </div>
                        )}

                        {c.status !== 'resolved' && (
                          <div className="mt-4 border-t border-slate-100 pt-4 flex flex-col space-y-3">
                            {selectedComplaintId === c._id ? (
                              <div className="space-y-2">
                                <label className="block text-xs font-semibold text-slate-700">Resolution Note</label>
                                <textarea
                                  value={complaintNote}
                                  onChange={(e) => setComplaintNote(e.target.value)}
                                  placeholder="Add resolution or update notes..."
                                  rows={2}
                                  className="w-full text-sm rounded-xl border border-slate-300 p-3 text-slate-900 focus:ring-2 focus:ring-blue-500"
                                />
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => updateComplaintStatus(c._id, 'resolved', complaintNote)}
                                    disabled={isSubmittingComplaintNote}
                                    className="bg-green-600 hover:bg-green-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition disabled:bg-green-300"
                                  >
                                    Resolve Complaint
                                  </button>
                                  <button
                                    onClick={() => updateComplaintStatus(c._id, 'in-progress', complaintNote)}
                                    disabled={isSubmittingComplaintNote}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition disabled:bg-blue-300"
                                  >
                                    Mark In-Progress
                                  </button>
                                  <button
                                    onClick={() => { setSelectedComplaintId(''); setComplaintNote(''); }}
                                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs px-4 py-2 rounded-lg transition"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => setSelectedComplaintId(c._id)}
                                className="self-start text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                              >
                                ✍️ Manage & Resolve
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-500 font-medium">No complaints found.</div>
                )}
              </div>
            </div>
          )}

          {/* VIEW: SMART ROUTE OPTIMIZATION */}
          {activeTab === 'Route Optimization' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-extrabold text-slate-900">
                  💡 Smart Route Optimization
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                  Intelligent recommendations to improve schedules, resolve overloading, and minimize delays based on historical logs.
                </p>
              </div>

              {isLoadingOptimization ? (
                <div className="p-12 text-center text-slate-500 font-medium">Analyzing historical transit logs...</div>
              ) : optimizationRecommendations ? (
                <div className="grid gap-6 md:grid-cols-3">
                  {/* Delayed Routes Card */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                      ⏰ Frequently Delayed Routes
                    </h2>
                    <div className="space-y-4">
                      {optimizationRecommendations.delayedRoutes?.map((r) => (
                        <div key={r.routeId} className="p-4 rounded-xl border border-slate-100 bg-slate-50">
                          <h3 className="font-bold text-slate-800">{r.routeName}</h3>
                          <div className="flex justify-between text-xs text-slate-500 mt-1">
                            <span>Avg Delay: <strong>{r.averageDelayMinutes}m</strong></span>
                            <span>Delayed Trips: <strong>{r.delayedTripsCount}/{r.totalTrips}</strong></span>
                          </div>
                          <p className="text-xs text-amber-800 mt-2 bg-amber-50 p-2.5 rounded-lg border border-amber-100">
                            {r.recommendation}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Overloaded Buses Card */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                      🚌 Overloaded Buses
                    </h2>
                    <div className="space-y-4">
                      {optimizationRecommendations.overloadedBuses?.map((b) => (
                        <div key={b.busId} className="p-4 rounded-xl border border-slate-100 bg-slate-50">
                          <h3 className="font-bold text-slate-800">Bus {b.busNumber}</h3>
                          <div className="flex justify-between text-xs text-slate-500 mt-1">
                            <span>Peak Load: <strong>{b.loadPercentage}%</strong></span>
                            <span>Count: <strong>{b.peakPassengerCount}/{b.capacity}</strong></span>
                          </div>
                          <p className="text-xs text-red-800 mt-2 bg-red-50 p-2.5 rounded-lg border border-red-100">
                            {b.recommendation}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Inefficient Schedules Card */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                      📅 Timetable & Schedule Suggestions
                    </h2>
                    <div className="space-y-4">
                      {optimizationRecommendations.inefficientSchedules?.map((s) => (
                        <div key={s.scheduleId} className="p-4 rounded-xl border border-slate-100 bg-slate-50">
                          <h3 className="font-bold text-slate-800">{s.routeName} ({s.departureTime})</h3>
                          <div className="flex justify-between text-xs text-slate-500 mt-1">
                            <span>Avg Load: <strong>{s.avgLoadPercentage}%</strong></span>
                            <span>Bus: <strong>{s.busNumber}</strong></span>
                          </div>
                          <p className="text-xs text-blue-800 mt-2 bg-blue-50 p-2.5 rounded-lg border border-blue-100">
                            {s.recommendation}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500">Failed to load recommendations.</div>
              )}
            </div>
          )}

          {activeTab === 'Feedback & Ratings' && (

            <div className="space-y-6">

              <div>

                <h1 className="text-3xl font-extrabold text-slate-900">
                  ⭐ Feedback & Ratings
                </h1>

                <p className="mt-2 text-sm text-slate-600">
                  Review passenger feedback and monitor service quality.
                </p>

              </div>


              <div
                className="
                  overflow-x-auto
                  rounded-2xl
                  border
                  border-slate-200
                  bg-white
                  shadow-sm
                "
              >

                <table className="w-full text-sm">


                  <thead className="bg-slate-50">

                    <tr>

                      <th className="px-5 py-4 text-left">
                        Passenger
                      </th>


                      <th className="px-5 py-4 text-left">
                        Bus
                      </th>


                      <th className="px-5 py-4 text-left">
                        Route
                      </th>


                      <th className="px-5 py-4 text-left">
                        Rating
                      </th>


                      <th className="px-5 py-4 text-left">
                        Comment
                      </th>

                    </tr>

                  </thead>



                  <tbody>


                  {isLoadingFeedbacks ? (

                    <tr>

                      <td
                        colSpan="5"
                        className="p-6 text-center"
                      >

                        Loading feedback...

                      </td>

                    </tr>


                  ) : feedbacks.length === 0 ? (

                    <tr>

                      <td
                        colSpan="5"
                        className="p-6 text-center"
                      >

                        No feedback available.

                      </td>

                    </tr>


                  ) : (


                    feedbacks.map((feedback)=>(


                      <tr
                        key={feedback._id}
                        className="border-t"
                      >


                        <td className="px-5 py-4">

                          <p className="font-semibold text-slate-900">

                            {feedback.userId?.name ||
                            'Unknown'}

                          </p>

                          <p className="text-xs text-slate-500">

                            {feedback.userId?.email}

                          </p>

                        </td>



                        <td className="px-5 py-4">

                          {feedback.tripId?.busId?.busNumber ||
                          '-'}

                        </td>



                        <td className="px-5 py-4">

                          {feedback.tripId?.routeId?.name ||
                          '-'}

                        </td>



                        <td className="px-5 py-4">

                          <span className="text-xl">

                            {'⭐'.repeat(
                              feedback.rating
                            )}

                          </span>

                        </td>



                        <td className="px-5 py-4">

                          {feedback.comment ||
                          'No comment'}

                        </td>


                      </tr>


                    ))


                  )}


                  </tbody>


                </table>


              </div>


            </div>

          )}

          {/* VIEW: NOTIFICATION CENTER */}
          {activeTab === 'Notifications' && (
            <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn">

              <div>
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  Notification Center
                </h2>

                <p className="text-slate-500 text-sm mt-1">
                  Send real-time operational notifications to SmartTransit passengers.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-8">

                {/* Notification Form */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6">

                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                        />
                      </svg>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        Send Passenger Notification
                      </h3>

                      <p className="text-xs text-slate-400 mt-1">
                        Notify passengers about operational changes.
                      </p>
                    </div>
                  </div>

                  <form
                    onSubmit={handleSendNotification}
                    className="space-y-5"
                  >

                    {/* Notification Type */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Notification Type
                      </label>

                      <select
                        value={notificationType}
                        onChange={(e) =>
                          setNotificationType(e.target.value)
                        }
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      >
                        <option value="delay">
                          Bus Delay
                        </option>
                        <option value="route_diversion">
                          Route Diversion
                        </option>
                        <option value="schedule_change">
                          Schedule Change
                        </option>
                        <option value="trip_cancellation">
                          Trip Cancellation
                        </option>
                        <option value="emergency">
                          Emergency Alert
                        </option>
                      </select>
                    </div>

                    {/* Bus / Route Selector */}
                    {notificationType === 'delay' ? (
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                          Select Bus
                        </label>

                        <select
                          value={notificationBusId}
                          onChange={(e) =>
                            setNotificationBusId(e.target.value)
                          }
                          required
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700"
                        >
                          <option value="">
                            Select bus...
                          </option>

                          {buses.map((bus) => (
                            <option key={bus._id} value={bus._id}>
                              {bus.busNumber}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : notificationType === 'route_diversion' ? (
                      <div>
                        Select Route...
                      </div>
                    ) : null}

                    {/* Diversion Details */}
                    {notificationType === 'route_diversion' && (
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                          Diversion Details
                        </label>

                        <textarea
                          value={diversionDetails}
                          onChange={(e) =>
                            setDiversionDetails(e.target.value)
                          }
                          placeholder="Enter route diversion details..."
                          required
                          rows="4"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                    )}

                    {/* Schedule Change */}
                    {notificationType === 'schedule_change' && (
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                          Select Schedule
                        </label>

                        <select
                          value={notificationScheduleId}
                          onChange={(e) =>
                            setNotificationScheduleId(e.target.value)
                          }
                          required
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700"
                        >
                          <option value="">
                            Select schedule...
                          </option>

                          {schedules.map((schedule) => (
                            <option
                              key={schedule._id}
                              value={schedule._id}
                            >
                              {schedule.departureTimes?.join(', ')}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}  
                         
                    {/* Trip Cancellation */}
                    {notificationType === 'trip_cancellation' && (
                      <>
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                            Select Trip
                          </label>

                          <select
                            value={notificationTripId}
                            onChange={(e) =>
                              setNotificationTripId(e.target.value)
                            }
                            required
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700"
                          >
                            <option value="">
                              Select trip...
                            </option>

                            {trips.filter( (trip) => trip.status === 'running' || trip.status === 'scheduled' || trip.status === 'delayed' ).map((trip) => (
                              <option
                                key={trip._id}
                                value={trip._id}
                              >
                                {trip.busId?.busNumber || 'Trip'} 
                                - {trip.status}
                              </option>
                            ))}

                          </select>
                        </div>


                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                            Cancellation Message
                          </label>

                          <textarea
                            value={cancellationMessage}
                            onChange={(e) =>
                              setCancellationMessage(e.target.value)
                            }
                            placeholder="Enter cancellation reason..."
                            required
                            rows="4"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700"
                          />

                        </div>
                      </>
                    )}

                    {/* Emergency Alert */}
                    {notificationType === 'emergency' && (
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                          Emergency Message
                        </label>

                        <textarea
                          value={emergencyMessage}
                          onChange={(e) =>
                            setEmergencyMessage(e.target.value)
                          }
                          placeholder="Enter emergency alert message..."
                          required
                          rows="4"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700"
                        />
                      </div>
                    )}

                    {/* Delay Minutes */}
                    {notificationType === 'delay' && (
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                          Delay Duration (Minutes)
                        </label>

                        <input
                          type="number"
                          min="1"
                          max="180"
                          value={delayMinutes}
                          onChange={(e) =>
                            setDelayMinutes(e.target.value)
                          }
                          required
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                    )}
                    {/* Preview */}
                    <div className="rounded-xl bg-amber-50 border border-amber-100 p-4">
                      <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                        Notification Preview
                      </p>

                      <p className="mt-2 text-sm text-amber-900">

                        {notificationType === 'delay' && notificationBusId
                          ? `Bus ${
                              buses.find(
                                (bus) =>
                                  bus._id === notificationBusId
                              )?.busNumber || ''
                            } is delayed by ${delayMinutes} minutes.`

                          : notificationType === 'route_diversion'
                          ? `Route diversion: ${diversionDetails || 'No details entered.'}`

                          : notificationType === 'schedule_change'
                          ? `Schedule changed for selected schedule.`

                          : notificationType === 'trip_cancellation'
                          ? `Trip cancelled: ${cancellationMessage || 'No reason provided.'}`

                          : notificationType === 'emergency'
                          ? `Emergency Alert: ${emergencyMessage || 'No message entered.'}`

                          : 'Select notification type.'}

                      </p>
                    </div>

                    {/* Error */}
                    {notificationSendError && (
                      <div className="rounded-xl bg-rose-50 border border-rose-100 px-4 py-3 text-sm font-semibold text-rose-600">
                        {notificationSendError}
                      </div>
                    )}

                    {/* Success */}
                    {notificationSendMessage && (
                      <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm font-semibold text-emerald-600">
                        {notificationSendMessage}
                      </div>
                    )}

                    {/* Send Button */}
                    <button
                      type="submit"
                      disabled={isSendingNotification}
                      className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all shadow-lg shadow-blue-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      🔔 {
                        notificationType === 'delay'
                          ? 'Send Delay Notification'
                          : notificationType === 'route_diversion'
                          ? 'Send Route Diversion Notification'
                          : notificationType === 'schedule_change'
                          ? 'Send Schedule Change Notification'
                          : notificationType === 'trip_cancellation'
                          ? 'Send Trip Cancellation Notification'
                          : notificationType === 'emergency'
                          ? 'Send Emergency Alert'
                          : 'Send Notification'
                      }
                    </button>

                  </form>
                </div>



              </div>
            </div>
          )}

          {/* VIEW: DASHBOARD / OTHER */}
          {activeTab === 'Dashboard' && (
            <div className="max-w-7xl mx-auto text-center py-20 bg-white border border-slate-200/80 rounded-2xl p-8 space-y-4 animate-fadeIn">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 114 0v2m-4 0h4m-4 0H5m12 0h2" />
                </svg>
              </div>
              <h2 className="text-2xl font-extrabold text-slate-800">Quick Dashboard Hub</h2>
              <p className="text-slate-500 max-w-md mx-auto text-sm">Welcome to SmartTransit administrative panel. Switch to <button onClick={() => setActiveTab('Requests')} className="text-blue-600 hover:underline font-bold">Requests</button> to manage driver registrations or <button onClick={() => setActiveTab('Fleet Management')} className="text-blue-600 hover:underline font-bold">Fleet Management</button> to adjust routes.</p>
            </div>
          )}

        </div>
      </div>

      {/* MODAL: ADD BUS */}
      {showAddBusModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md p-6 shadow-2xl animate-scaleIn">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900">Add New Transit Bus</h3>
              <button onClick={() => setShowAddBusModal(false)} className="text-slate-400 hover:text-slate-650">
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateBus} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Bus Number / License</label>
                <input
                  type="text"
                  required
                  placeholder="DHAKA-METRO-KA-11-2222"
                  value={busForm.busNumber}
                  onChange={(e) => setBusForm(prev => ({ ...prev, busNumber: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Capacity</label>
                <input
                  type="number"
                  required
                  value={busForm.capacity}
                  onChange={(e) => setBusForm(prev => ({ ...prev, capacity: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Initial Status</label>
                <select
                  value={busForm.status}
                  onChange={(e) => setBusForm(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="active">Active</option>
                  <option value="disabled">Disabled</option>
                </select>
              </div>
              <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-blue-500/10">
                Create Bus File
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE ROUTE */}
      {showAddRouteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md p-6 shadow-2xl animate-scaleIn">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900">Create Transit Route</h3>
              <button onClick={() => setShowAddRouteModal(false)} className="text-slate-400 hover:text-slate-650">
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateRoute} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Route Title / Name</label>
                <input
                  type="text"
                  required
                  placeholder="Route 101: Mirpur to Motijheel"
                  value={routeForm.name}
                  onChange={(e) => setRouteForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Distance (KM)</label>
                  <input
                    type="number"
                    required
                    value={routeForm.distance}
                    onChange={(e) => setRouteForm(prev => ({ ...prev, distance: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Duration (Mins)</label>
                  <input
                    type="number"
                    required
                    value={routeForm.estimatedDuration}
                    onChange={(e) => setRouteForm(prev => ({ ...prev, estimatedDuration: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Include Bus Stops (Check multiple)</label>
                <div className="max-h-32 overflow-y-auto space-y-2 border border-slate-100 p-3 rounded-lg">
                  {stops.map(stop => (
                    <label key={stop._id} className="flex items-center space-x-2 text-xs font-semibold text-slate-650">
                      <input
                        type="checkbox"
                        checked={routeForm.stops.includes(stop._id)}
                        onChange={(e) => {
                          const updatedStops = e.target.checked
                            ? [...routeForm.stops, stop._id]
                            : routeForm.stops.filter(id => id !== stop._id);
                          setRouteForm(prev => ({ ...prev, stops: updatedStops }));
                        }}
                      />
                      <span>{stop.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-blue-500/10">
                Confirm Route Setup
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD BUS STOP */}
      {showAddStopModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md p-6 shadow-2xl animate-scaleIn">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900">Create New Bus Stop</h3>
              <button onClick={() => setShowAddStopModal(false)} className="text-slate-400 hover:text-slate-650">
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateStop} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Stop Name</label>
                <input
                  type="text"
                  required
                  placeholder="Shahbagh Stop"
                  value={stopForm.name}
                  onChange={(e) => setStopForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={stopForm.latitude}
                    onChange={(e) => setStopForm(prev => ({ ...prev, latitude: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={stopForm.longitude}
                    onChange={(e) => setStopForm(prev => ({ ...prev, longitude: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
              <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-blue-500/10">
                Save Checkpoint Stop
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE SCHEDULE */}
      {showAddScheduleModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md p-6 shadow-2xl animate-scaleIn">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900">Create New Schedule</h3>
              <button onClick={() => setShowAddScheduleModal(false)} className="text-slate-400 hover:text-slate-650">
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateSchedule} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Select Route</label>
                <select
                  required
                  value={scheduleForm.routeId}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, routeId: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">Choose route...</option>
                  {routes.map(r => (
                    <option key={r._id} value={r._id}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Select Transit Bus</label>
                <select
                  required
                  value={scheduleForm.busId}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, busId: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">Choose vehicle...</option>
                  {buses.map(b => (
                    <option key={b._id} value={b._id}>{b.busNumber}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Departure Times (Comma-separated)</label>
                <input
                  type="text"
                  required
                  placeholder="08:00, 12:00, 16:00, 20:00"
                  value={scheduleForm.departureTimes}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, departureTimes: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Frequency / Intervals</label>
                <input
                  type="text"
                  placeholder="Every 4 hours"
                  value={scheduleForm.frequency}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, frequency: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-blue-500/10">
                Confirm Schedule timings
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
