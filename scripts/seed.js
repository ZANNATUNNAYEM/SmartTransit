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

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smarttransit';

async function seed() {
  console.log('Connecting to database...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB.');

  // Clear existing collections
  console.log('Clearing existing collections...');
  await Promise.all([
    User.deleteMany({}),
    BusStop.deleteMany({}),
    Route.deleteMany({}),
    Bus.deleteMany({}),
    Schedule.deleteMany({}),
    Trip.deleteMany({}),
    Complaint.deleteMany({}),
    EmergencyReport.deleteMany({}),
    MaintenanceReport.deleteMany({}),
    Feedback.deleteMany({}),
    LostItem.deleteMany({}),
    Notification.deleteMany({})
  ]);
  console.log('Cleared all collections.');

  // 1. Seed Users
  console.log('Seeding Users...');
  const users = await User.insertMany([
    {
      name: 'Super Admin',
      email: 'admin@smarttransit.com',
      phone: '+8801711111111',
      password: 'hashed_password_admin_123',
      role: 'admin',
      isApproved: true,
      status: 'active'
    },
    {
      name: 'Rahim Uddin',
      email: 'rahim@smarttransit.com',
      phone: '+8801722222222',
      password: 'hashed_password_driver_123',
      role: 'driver',
      driverDetails: {
        licenseNo: 'DL-DHAKA-98765',
        orgName: 'Dhaka Chaka Ltd'
      },
      isApproved: true,
      status: 'active'
    },
    {
      name: 'Karim Ali',
      email: 'karim@smarttransit.com',
      phone: '+8801733333333',
      password: 'hashed_password_driver_123',
      role: 'driver',
      driverDetails: {
        licenseNo: 'DL-DHAKA-12345',
        orgName: 'Dhaka Chaka Ltd'
      },
      isApproved: false,
      status: 'pending'
    },
    {
      name: 'Zannat Passenger',
      email: 'zannat@smarttransit.com',
      phone: '+8801744444444',
      password: 'hashed_password_passenger_123',
      role: 'passenger',
      isApproved: true,
      status: 'active'
    },
    {
      name: 'Maimuna Passenger',
      email: 'maimuna@smarttransit.com',
      phone: '+8801755555555',
      password: 'hashed_password_passenger_123',
      role: 'passenger',
      isApproved: true,
      status: 'active'
    }
  ]);
  const admin = users[0];
  const driverRahim = users[1];
  const driverKarim = users[2];
  const passengerZannat = users[3];
  const passengerMaimuna = users[4];
  console.log(`Seeded ${users.length} Users.`);

  // 2. Seed BusStops
  console.log('Seeding BusStops...');
  const stops = await BusStop.insertMany([
    {
      name: 'Mirpur 10 Circle Stop',
      location: { type: 'Point', coordinates: [90.3701, 23.8069] }
    },
    {
      name: 'Farmgate Bus Stop',
      location: { type: 'Point', coordinates: [90.3901, 23.7561] }
    },
    {
      name: 'Shahbagh Stop',
      location: { type: 'Point', coordinates: [90.3982, 23.7383] }
    },
    {
      name: 'Gulshan 2 Circle Stop',
      location: { type: 'Point', coordinates: [90.4152, 23.7925] }
    },
    {
      name: 'Motijheel Bus Terminal',
      location: { type: 'Point', coordinates: [90.4196, 23.7330] }
    }
  ]);
  const stopMirpur = stops[0];
  const stopFarmgate = stops[1];
  const stopShahbagh = stops[2];
  const stopGulshan = stops[3];
  const stopMotijheel = stops[4];
  console.log(`Seeded ${stops.length} BusStops.`);

  // Update user favorites
  passengerZannat.favoriteStops.push(stopMirpur._id, stopFarmgate._id);
  await passengerZannat.save();

  // 3. Seed Routes
  console.log('Seeding Routes...');
  const routes = await Route.insertMany([
    {
      name: 'Route 101: Mirpur to Motijheel',
      stops: [stopMirpur._id, stopFarmgate._id, stopShahbagh._id, stopMotijheel._id],
      distance: 12.5, // in km
      estimatedDuration: 45 // in minutes
    },
    {
      name: 'Route 202: Gulshan to Motijheel',
      stops: [stopGulshan._id, stopShahbagh._id, stopMotijheel._id],
      distance: 8.2, // in km
      estimatedDuration: 30 // in minutes
    }
  ]);
  const route101 = routes[0];
  const route202 = routes[1];
  console.log(`Seeded ${routes.length} Routes.`);

  // Update user favorites
  passengerZannat.favoriteRoutes.push(route101._id);
  await passengerZannat.save();

  // 4. Seed Buses
  console.log('Seeding Buses...');
  const buses = await Bus.insertMany([
    {
      busNumber: 'DHAKA-METRO-KA-11-2222',
      capacity: 40,
      routeId: route101._id,
      driverId: driverRahim._id,
      status: 'active',
      currentLocation: { type: 'Point', coordinates: [90.3705, 23.8065] }
    },
    {
      busNumber: 'DHAKA-METRO-CHA-33-4444',
      capacity: 35,
      routeId: route202._id,
      driverId: driverKarim._id,
      status: 'active',
      currentLocation: { type: 'Point', coordinates: [90.4150, 23.7920] }
    }
  ]);
  const bus1 = buses[0];
  const bus2 = buses[1];
  console.log(`Seeded ${buses.length} Buses.`);

  // 5. Seed Schedules
  console.log('Seeding Schedules...');
  const schedules = await Schedule.insertMany([
    {
      routeId: route101._id,
      busId: bus1._id,
      departureTimes: ['08:00', '12:00', '16:00', '20:00'],
      frequency: 'Every 4 hours'
    },
    {
      routeId: route202._id,
      busId: bus2._id,
      departureTimes: ['09:00', '14:30', '19:00'],
      frequency: 'As scheduled'
    }
  ]);
  console.log(`Seeded ${schedules.length} Schedules.`);

  // 6. Seed Trips
  console.log('Seeding Trips...');
  const now = new Date();
  const trips = await Trip.insertMany([
    {
      busId: bus1._id,
      driverId: driverRahim._id,
      routeId: route101._id,
      startTime: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
      endTime: new Date(now.getTime() - 1 * 60 * 60 * 1000), // 1 hour ago
      distance: 12.5,
      status: 'completed'
    },
    {
      busId: bus1._id,
      driverId: driverRahim._id,
      routeId: route101._id,
      startTime: new Date(now.getTime() - 30 * 60 * 1000), // 30 mins ago
      status: 'running'
    },
    {
      busId: bus2._id,
      driverId: driverKarim._id,
      routeId: route202._id,
      startTime: new Date(now.getTime() + 1 * 60 * 60 * 1000), // in 1 hour
      status: 'scheduled'
    }
  ]);
  const completedTrip = trips[0];
  console.log(`Seeded ${trips.length} Trips.`);

  // 7. Seed Complaints
  console.log('Seeding Complaints...');
  const complaints = await Complaint.insertMany([
    {
      userId: passengerZannat._id,
      category: 'Delay',
      description: 'The bus on Route 101 was delayed by 20 minutes.',
      relatedBusId: bus1._id,
      relatedRouteId: route101._id,
      status: 'pending'
    },
    {
      userId: passengerMaimuna._id,
      category: 'AC issue',
      description: 'AC was not working properly in the bus.',
      relatedBusId: bus2._id,
      relatedRouteId: route202._id,
      status: 'in-progress'
    }
  ]);
  console.log(`Seeded ${complaints.length} Complaints.`);

  // 8. Seed EmergencyReports
  console.log('Seeding EmergencyReports...');
  const emergencies = await EmergencyReport.insertMany([
    {
      passengerId: passengerZannat._id,
      busId: bus1._id,
      location: { type: 'Point', coordinates: [90.3905, 23.7565] },
      category: 'Medical emergency',
      description: 'A passenger fainted inside the bus.',
      status: 'resolved'
    }
  ]);
  console.log(`Seeded ${emergencies.length} EmergencyReports.`);

  // 9. Seed MaintenanceReports
  console.log('Seeding MaintenanceReports...');
  const maintenances = await MaintenanceReport.insertMany([
    {
      busId: bus2._id,
      driverId: driverKarim._id,
      category: 'Engine Overheating',
      images: ['https://example.com/engine_heat.jpg'],
      severity: 'high',
      status: 'pending'
    }
  ]);
  console.log(`Seeded ${maintenances.length} MaintenanceReports.`);

  // 10. Seed Feedbacks
  console.log('Seeding Feedbacks...');
  const feedbacks = await Feedback.insertMany([
    {
      userId: passengerZannat._id,
      tripId: completedTrip._id,
      rating: 4,
      comment: 'Very comfortable journey, prompt departure.'
    }
  ]);
  console.log(`Seeded ${feedbacks.length} Feedbacks.`);

  // 11. Seed LostItems
  console.log('Seeding LostItems...');
  const lostItems = await LostItem.insertMany([
    {
      passengerId: passengerZannat._id,
      description: 'Black leather wallet with credit cards',
      status: 'reported'
    }
  ]);
  console.log(`Seeded ${lostItems.length} LostItems.`);

  // 12. Seed Notifications
  console.log('Seeding Notifications...');
  const notifications = await Notification.insertMany([
    {
      userId: passengerZannat._id,
      type: 'Delay Announcement',
      message: 'Bus KA-11-2222 is running 10 minutes late due to traffic at Farmgate.',
      read: false
    },
    {
      userId: driverRahim._id,
      type: 'Duty Assignment',
      message: 'You have been assigned to trip on Route 101 today.',
      read: true
    }
  ]);
  console.log(`Seeded ${notifications.length} Notifications.`);

  console.log('Database seeding completed successfully!');
  await mongoose.disconnect();
  console.log('Database connection closed.');
}

seed().catch((err) => {
  console.error('Error seeding database:', err);
  process.exit(1);
});
