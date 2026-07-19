import mongoose from 'mongoose';

const GeoPointSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Point'],
    required: true,
    default: 'Point'
  },
  coordinates: {
    type: [Number], // [longitude, latitude]
    required: true
  }
}, { _id: false });

const BusSchema = new mongoose.Schema(
  {
    busNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    capacity: {
      type: Number,
      required: true,
    },
    routeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Route',
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
      enum: ['active', 'disabled'],
      default: 'active',
    },
    currentLocation: {
      type: GeoPointSchema,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
BusSchema.index({ currentLocation: '2dsphere' });
BusSchema.index({ routeId: 1, status: 1 });

const Bus = mongoose.models.Bus || mongoose.model('Bus', BusSchema);

export default Bus;
