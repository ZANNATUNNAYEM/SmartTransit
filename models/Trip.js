import mongoose from 'mongoose';

const TripSchema = new mongoose.Schema(
  {
    busId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bus',
      required: true,
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    routeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Route',
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
    },
    distance: {
      type: Number, // distance covered in km or meters
    },
    status: {
      type: String,
      enum: ['scheduled', 'running', 'delayed', 'completed', 'cancelled'],
      default: 'scheduled',
    },
    delayMinutes: {
      type: Number,
      default: 0,
    },
    actualDuration: {
      type: Number, // duration in minutes
    },
  },
  {
    timestamps: true,
  }
);

// Indexes tuned for time-range aggregation queries
TripSchema.index({ busId: 1, startTime: -1 });
TripSchema.index({ driverId: 1, startTime: -1 });
TripSchema.index({ routeId: 1, startTime: -1 });

const Trip = mongoose.models.Trip || mongoose.model('Trip', TripSchema);

export default Trip;
