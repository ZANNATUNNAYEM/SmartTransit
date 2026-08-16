import mongoose from 'mongoose';

import {
  User,
  BusStop,
  Route,
  Bus,
  Schedule,
  Trip,
  Complaint,
  EmergencyReport,
  MaintenanceReport,
  Feedback,
  LostItem,
  Notification
} from '../models/index.js';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI is not defined.');
}

const dhakaLocations = [
  [90.3701, 23.8069],
  [90.3901, 23.7561],
  [90.3982, 23.7383],
  [90.4152, 23.7925],
  [90.4196, 23.7330],
  [90.3750, 23.7800],
  [90.4020, 23.7700],
  [90.4280, 23.7500],
  [90.3450, 23.8150],
  [90.3600, 23.7900],
  [90.3850, 23.8250],
  [90.4100, 23.8100],
  [90.4350, 23.7850],
  [90.4450, 23.7600],
  [90.4300, 23.7200],
  [90.4050, 23.7150],
  [90.3750, 23.7350],
  [90.3500, 23.7500],
  [90.3950, 23.7950],
  [90.4200, 23.8050],
  [90.4400, 23.8000],
  [90.4550, 23.7750],
  [90.3650, 23.8250],
  [90.3450, 23.7900]
];

const stopNames = [
  'Dhanmondi 27 Bus Stop',
  'Mohammadpur Bus Stop',
  'Asad Gate Bus Stop',
  'Kallyanpur Bus Stop',
  'Shyamoli Bus Stop',
  'Agargaon Bus Stop',
  'Bijoy Sarani Bus Stop',
  'Karwan Bazar Bus Stop',
  'Bangla Motor Bus Stop',
  'Paltan Bus Stop',
  'Jatrabari Bus Stop',
  'Sayedabad Bus Stop',
  'Rampura Bus Stop',
  'Badda Link Road Stop',
  'Moghbazar Bus Stop',
  'Malibagh Bus Stop',
  'Khilgaon Bus Stop',
  'Uttara House Building Stop',
  'Uttara Azampur Stop',
  'Banani Bus Stop',
  'Mohakhali Bus Stop',
  'Tejgaon Bus Stop',
  'Farmgate South Stop',
  'Gulshan 1 Bus Stop'
];

const routeNames = [
  'Route 301: Uttara to Motijheel',
  'Route 302: Mirpur to Gulshan',
  'Route 303: Mohammadpur to Jatrabari',
  'Route 304: Dhanmondi to Uttara',
  'Route 305: Gulshan to Mohammadpur',
  'Route 306: Banani to Motijheel',
  'Route 307: Mirpur to Farmgate',
  'Route 308: Uttara to Gulshan',
  'Route 309: Mohammadpur to Gulshan',
  'Route 310: Dhanmondi to Motijheel',
  'Route 311: Mirpur to Jatrabari',
  'Route 312: Uttara to Sayedabad',
  'Route 313: Banani to Dhanmondi',
  'Route 314: Gulshan to Jatrabari',
  'Route 315: Mohammadpur to Motijheel',
  'Route 316: Mirpur to Dhanmondi',
  'Route 317: Uttara to Farmgate',
  'Route 318: Badda to Mohammadpur',
  'Route 319: Gulshan to Mirpur'
];

const complaintCategories = [
  'Delay',
  'Overcrowding',
  'AC issue',
  'Unsafe driving',
  'Cleanliness',
  'Staff behaviour',
  'Route issue',
  'Bus condition'
];

const emergencyCategories = [
  'Medical emergency',
  'Accident',
  'Passenger injury',
  'Security issue',
  'Fire emergency',
  'Lost passenger',
  'Sudden illness'
];

const maintenanceCategories = [
  'Engine Overheating',
  'Brake Inspection',
  'AC Repair',
  'Tyre Replacement',
  'Oil Change',
  'Battery Issue',
  'Electrical Problem',
  'Door Repair',
  'Suspension Issue',
  'Headlight Repair'
];

const lostItemDescriptions = [
  'Black backpack',
  'Mobile phone',
  'Blue wallet',
  'Student ID card',
  'Umbrella',
  'Laptop bag',
  'Water bottle',
  'Earphones',
  'Shopping bag',
  'Watch',
  'Notebook',
  'Glasses',
  'House keys',
  'Brown purse',
  'USB drive',
  'Power bank',
  'Jacket',
  'Calculator',
  'Document folder',
  'School bag'
];

const notificationTypes = [
  'Trip Update',
  'Delay Announcement',
  'Route Update',
  'Bus Status',
  'Maintenance Alert',
  'Schedule Update',
  'Safety Notice',
  'Service Announcement'
];

function locationFor(index) {
  const coordinates =
    dhakaLocations[index % dhakaLocations.length];

  return {
    type: 'Point',
    coordinates
  };
}

function randomItem(array, index) {
  return array[index % array.length];
}

async function connectDB() {
  console.log('Connecting to MongoDB Atlas...');

  await mongoose.connect(MONGODB_URI);

  console.log(
    'Connected to MongoDB database:',
    mongoose.connection.name
  );
}

async function ensureBusStops() {
  const count = await BusStop.countDocuments();

  if (count >= 20) {
    console.log(`BusStops already have ${count} records.`);
    return;
  }

  const needed = 20 - count;

  const existingNames = new Set(
    await BusStop.find({}).distinct('name')
  );

  const newStops = [];

  for (let i = 0; i < stopNames.length && newStops.length < needed; i++) {
    const name = stopNames[i];

    if (existingNames.has(name)) {
      continue;
    }

    newStops.push({
      name,
      location: locationFor(i + 5)
    });
  }

  if (newStops.length > 0) {
    await BusStop.insertMany(newStops);
  }

  console.log(
    `BusStops: ${count} → ${await BusStop.countDocuments()}`
  );
}

async function ensureRoutes() {
  const stops = await BusStop.find({});

  if (stops.length < 20) {
    throw new Error(
      'At least 20 bus stops are required before creating routes.'
    );
  }

  const count = await Route.countDocuments();

  if (count >= 20) {
    console.log(`Routes already have ${count} records.`);
    return;
  }

  const needed = 20 - count;

  const existingNames = new Set(
    await Route.find({}).distinct('name')
  );

  const newRoutes = [];

  for (let i = 0; i < routeNames.length && newRoutes.length < needed; i++) {
    const name = routeNames[i];

    if (existingNames.has(name)) {
      continue;
    }

    const start = (i * 2) % stops.length;

    const selectedStops = [
      stops[start],
      stops[(start + 1) % stops.length],
      stops[(start + 2) % stops.length],
      stops[(start + 3) % stops.length]
    ];

    newRoutes.push({
      name,
      stops: selectedStops.map(stop => stop._id),
      distance: Number((5 + (i * 0.7)).toFixed(1)),
      estimatedDuration: 25 + (i * 2)
    });
  }

  if (newRoutes.length > 0) {
    await Route.insertMany(newRoutes);
  }

  console.log(
    `Routes: ${count} → ${await Route.countDocuments()}`
  );
}

async function getDrivers() {
  const drivers = await User.find({
    role: 'driver',
    isApproved: true,
    status: {
      $in: ['active', 'approved']
    }
  });

  if (drivers.length === 0) {
    throw new Error(
      'No approved/active driver found in users collection.'
    );
  }

  return drivers;
}

async function getPassengers() {
  const passengers = await User.find({
    role: 'passenger'
  });

  if (passengers.length === 0) {
    throw new Error(
      'No passenger found in users collection.'
    );
  }

  return passengers;
}

async function ensureBuses() {
  const drivers = await getDrivers();
  const routes = await Route.find({});

  const count = await Bus.countDocuments();

  if (count >= 20) {
    console.log(`Buses already have ${count} records.`);
    return;
  }

  const needed = 20 - count;

  const existingNumbers = new Set(
    await Bus.find({}).distinct('busNumber')
  );

  const newBuses = [];

  for (let i = 0; newBuses.length < needed; i++) {
    const busNumber =
      `DHAKA-METRO-${String.fromCharCode(75 + (i % 5))}-` +
      `${String(5000 + i).padStart(4, '0')}`;

    if (existingNumbers.has(busNumber)) {
      continue;
    }

    const route = routes[i % routes.length];
    const driver = drivers[i % drivers.length];

    const statuses = [
      'active',
      'active',
      'active',
      'delayed',
      'maintenance',
      'breakdown'
    ];

    newBuses.push({
      busNumber,
      capacity: 30 + ((i * 3) % 16),
      routeId: route._id,
      driverId: driver._id,
      status: statuses[i % statuses.length],
      currentLocation: locationFor(i + 8)
    });

    existingNumbers.add(busNumber);
  }

  await Bus.insertMany(newBuses);

  console.log(
    `Buses: ${count} → ${await Bus.countDocuments()}`
  );
}

async function ensureSchedules() {
  const buses = await Bus.find({});
  const routes = await Route.find({});

  const count = await Schedule.countDocuments();

  if (count >= 20) {
    console.log(`Schedules already have ${count} records.`);
    return;
  }

  const needed = 20 - count;

  const newSchedules = [];

  for (let i = 0; i < needed; i++) {
    const bus = buses[i % buses.length];
    const route =
      routes.find(
        r => r._id.toString() === bus.routeId?.toString()
      ) || routes[i % routes.length];

    const hour = 6 + (i % 12);

    newSchedules.push({
      routeId: route._id,
      busId: bus._id,
      departureTimes: [
        `${String(hour).padStart(2, '0')}:00`,
        `${String(hour + 4 > 23 ? hour - 20 : hour + 4).padStart(2, '0')}:00`,
        `${String(hour + 8 > 23 ? hour - 16 : hour + 8).padStart(2, '0')}:00`
      ],
      frequency: i % 2 === 0
        ? 'Every 30 minutes'
        : 'Every 45 minutes',
      isActive: i % 5 !== 0
    });
  }

  await Schedule.insertMany(newSchedules);

  console.log(
    `Schedules: ${count} → ${await Schedule.countDocuments()}`
  );
}

async function ensureTrips() {
  const buses = await Bus.find({});
  const routes = await Route.find({});
  const drivers = await getDrivers();

  const count = await Trip.countDocuments();

  if (count >= 20) {
    console.log(`Trips already have ${count} records.`);
    return;
  }

  const needed = 20 - count;

  const newTrips = [];

  for (let i = 0; i < needed; i++) {
    const bus = buses[i % buses.length];

    const route =
      routes.find(
        r => r._id.toString() === bus.routeId?.toString()
      ) || routes[i % routes.length];

    const driver =
      drivers.find(
        d => d._id.toString() === bus.driverId?.toString()
      ) || drivers[i % drivers.length];

    const status =
      i % 5 === 0
        ? 'running'
        : i % 5 === 1
          ? 'delayed'
          : i % 5 === 2
            ? 'scheduled'
            : i % 5 === 3
              ? 'cancelled'
              : 'completed';

    const startTime = new Date(
      Date.now() -
      ((i + 1) * 60 * 60 * 1000)
    );

    const distance =
      Number(
        (route.distance * (0.85 + ((i % 4) * 0.04))).toFixed(2)
      );

    const actualDuration =
      Math.round(
        route.estimatedDuration *
        (0.9 + ((i % 5) * 0.05))
      );

    const trip = {
      busId: bus._id,
      driverId: driver._id,
      routeId: route._id,
      startTime,
      distance,
      status,
      delayMinutes:
        status === 'delayed'
          ? 5 + (i % 20)
          : 0
    };

    if (status === 'completed') {
      trip.endTime = new Date(
        startTime.getTime() +
        actualDuration * 60 * 1000
      );

      trip.actualDuration = actualDuration;
    }

    if (status === 'scheduled') {
      trip.startTime = new Date(
        Date.now() +
        ((i + 1) * 60 * 60 * 1000)
      );

      trip.distance = undefined;
      trip.delayMinutes = 0;
    }

    newTrips.push(trip);
  }

  await Trip.insertMany(newTrips);

  console.log(
    `Trips: ${count} → ${await Trip.countDocuments()}`
  );
}

async function ensureComplaints() {
  const passengers = await getPassengers();
  const buses = await Bus.find({});
  const routes = await Route.find({});

  const count = await Complaint.countDocuments();

  if (count >= 20) {
    console.log(`Complaints already have ${count} records.`);
    return;
  }

  const needed = 20 - count;

  const statuses = [
    'pending',
    'in-progress',
    'resolved'
  ];

  const newComplaints = [];

  for (let i = 0; i < needed; i++) {
    const status = statuses[i % statuses.length];

    newComplaints.push({
      userId: passengers[i % passengers.length]._id,
      category: complaintCategories[
        i % complaintCategories.length
      ],
      description:
        `Passenger reported a ${complaintCategories[
          i % complaintCategories.length
        ].toLowerCase()} issue during the journey.`,
      relatedBusId: buses[i % buses.length]._id,
      relatedRouteId: routes[i % routes.length]._id,
      status,
      resolutionNote:
        status === 'resolved'
          ? 'Issue reviewed and resolved by the transport operations team.'
          : undefined
    });
  }

  await Complaint.insertMany(newComplaints);

  console.log(
    `Complaints: ${count} → ${await Complaint.countDocuments()}`
  );
}

async function ensureEmergencyReports() {
  const passengers = await getPassengers();
  const buses = await Bus.find({});

  const count = await EmergencyReport.countDocuments();

  if (count >= 20) {
    console.log(
      `Emergency reports already have ${count} records.`
    );
    return;
  }

  const needed = 20 - count;

  const statuses = [
    'pending',
    'active',
    'resolved'
  ];

  const newReports = [];

  for (let i = 0; i < needed; i++) {
    newReports.push({
      passengerId:
        passengers[i % passengers.length]._id,

      busId:
        buses[i % buses.length]._id,

      location:
        locationFor(i + 10),

      category:
        emergencyCategories[
          i % emergencyCategories.length
        ],

      description:
        `Emergency report ${i + 1}: passenger requested assistance during the bus journey.`,

      status:
        statuses[i % statuses.length]
    });
  }

  await EmergencyReport.insertMany(newReports);

  console.log(
    `EmergencyReports: ${count} → ${await EmergencyReport.countDocuments()}`
  );
}

async function ensureMaintenanceReports() {
  const buses = await Bus.find({});
  const drivers = await getDrivers();

  const count = await MaintenanceReport.countDocuments();

  if (count >= 20) {
    console.log(
      `Maintenance reports already have ${count} records.`
    );
    return;
  }

  const needed = 20 - count;

  const severities = [
    'low',
    'medium',
    'high'
  ];

  const statuses = [
    'pending',
    'under-repair',
    'resolved'
  ];

  const newReports = [];

  for (let i = 0; i < needed; i++) {
    const bus = buses[i % buses.length];

    const driver =
      drivers.find(
        d => d._id.toString() === bus.driverId?.toString()
      ) || drivers[i % drivers.length];

    newReports.push({
      busId: bus._id,
      driverId: driver._id,
      category:
        maintenanceCategories[
          i % maintenanceCategories.length
        ],
      images: [],
      severity:
        severities[i % severities.length],
      status:
        statuses[i % statuses.length]
    });
  }

  await MaintenanceReport.insertMany(newReports);

  console.log(
    `MaintenanceReports: ${count} → ${await MaintenanceReport.countDocuments()}`
  );
}

async function ensureFeedbacks() {
  const passengers = await getPassengers();
  const trips = await Trip.find({}).sort({ createdAt: 1 });

  const existingFeedbacks = await Feedback.find({})
    .select('userId tripId');

  const usedPairs = new Set(
    existingFeedbacks.map(
      feedback =>
        `${feedback.userId.toString()}_${feedback.tripId.toString()}`
    )
  );

  const count = await Feedback.countDocuments();

  if (count >= 20) {
    console.log(`Feedbacks already have ${count} records.`);
    return;
  }

  const newFeedbacks = [];

  for (
    let tripIndex = 0;
    tripIndex < trips.length && newFeedbacks.length < 20 - count;
    tripIndex++
  ) {
    for (
      let userIndex = 0;
      userIndex < passengers.length &&
      newFeedbacks.length < 20 - count;
      userIndex++
    ) {
      const trip = trips[tripIndex];
      const passenger = passengers[userIndex];

      const key =
        `${passenger._id.toString()}_${trip._id.toString()}`;

      if (usedPairs.has(key)) {
        continue;
      }

      usedPairs.add(key);

      newFeedbacks.push({
        userId: passenger._id,
        tripId: trip._id,
        rating: 3 + ((newFeedbacks.length + 1) % 3),
        comment:
          [
            'Good journey and helpful service.',
            'The bus was comfortable.',
            'The trip was satisfactory.',
            'Service was good overall.',
            'Journey was slightly delayed but acceptable.'
          ][newFeedbacks.length % 5]
      });
    }
  }

  if (newFeedbacks.length < 20 - count) {
    throw new Error(
      'Not enough unique passenger/trip combinations to create 20 feedbacks.'
    );
  }

  await Feedback.insertMany(newFeedbacks);

  console.log(
    `Feedbacks: ${count} → ${await Feedback.countDocuments()}`
  );
}

async function ensureLostItems() {
  const passengers = await getPassengers();

  const count = await LostItem.countDocuments();

  if (count >= 20) {
    console.log(`LostItems already have ${count} records.`);
    return;
  }

  const needed = 20 - count;

  const statuses = [
    'reported',
    'found',
    'claimed'
  ];

  const newItems = [];

  for (let i = 0; i < needed; i++) {
    newItems.push({
      passengerId:
        passengers[i % passengers.length]._id,

      description:
        lostItemDescriptions[i % lostItemDescriptions.length],

      status:
        statuses[i % statuses.length]
    });
  }

  await LostItem.insertMany(newItems);

  console.log(
    `LostItems: ${count} → ${await LostItem.countDocuments()}`
  );
}

async function ensureNotifications() {
  const users = await User.find({});

  const count = await Notification.countDocuments();

  if (count >= 20) {
    console.log(
      `Notifications already have ${count} records.`
    );
    return;
  }

  const needed = 20 - count;

  const newNotifications = [];

  for (let i = 0; i < needed; i++) {
    newNotifications.push({
      userId:
        users[i % users.length]._id,

      type:
        notificationTypes[
          i % notificationTypes.length
        ],

      message:
        [
          'Your scheduled bus is ready for departure.',
          'A bus on your route is experiencing a short delay.',
          'Your selected route has been updated.',
          'The assigned bus status has changed.',
          'A maintenance update has been recorded.',
          'The latest schedule is now available.',
          'Please follow safety instructions during your journey.',
          'SmartTransit service information has been updated.'
        ][i % 8],

      read:
        i % 3 === 0
    });
  }

  await Notification.insertMany(newNotifications);

  console.log(
    `Notifications: ${count} → ${await Notification.countDocuments()}`
  );
}

async function printFinalCounts() {
  console.log('\n========== FINAL COUNTS ==========');

  const collections = [
    ['BusStops', BusStop],
    ['Routes', Route],
    ['Buses', Bus],
    ['Schedules', Schedule],
    ['Trips', Trip],
    ['Complaints', Complaint],
    ['EmergencyReports', EmergencyReport],
    ['MaintenanceReports', MaintenanceReport],
    ['Feedbacks', Feedback],
    ['LostItems', LostItem],
    ['Notifications', Notification]
  ];

  for (const [name, Model] of collections) {
    console.log(
      `${name}: ${await Model.countDocuments()}`
    );
  }

  console.log('==================================\n');
}

async function main() {
  try {
    await connectDB();

    /*
     * Order is important because collections reference each other.
     */
    await ensureBusStops();
    await ensureRoutes();
    await ensureBuses();
    await ensureSchedules();
    await ensureTrips();
    await ensureComplaints();
    await ensureEmergencyReports();
    await ensureMaintenanceReports();
    await ensureFeedbacks();
    await ensureLostItems();
    await ensureNotifications();

    await printFinalCounts();

    console.log(
      'Additional project data created successfully.'
    );
  } catch (error) {
    console.error(
      'Data creation failed:',
      error
    );

    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

main();