import mongoose from 'mongoose';

const PassengerJourneySchema = new mongoose.Schema(
  {
    passengerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      required: true,
    },

    busId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bus',
      required: true,
    },

    routeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Route',
      required: true,
    },

    fromStopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BusStop',
    },

    toStopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BusStop',
    },

    journeyDate: {
      type: Date,
      default: Date.now,
    },

    status: {
      type: String,
      enum: ['active', 'completed', 'cancelled'],
      default: 'completed',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.PassengerJourney ||
  mongoose.model(
    'PassengerJourney',
    PassengerJourneySchema
  );