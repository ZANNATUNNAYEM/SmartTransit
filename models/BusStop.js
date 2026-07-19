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

const BusStopSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: GeoPointSchema,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
BusStopSchema.index({ location: '2dsphere' });

const BusStop = mongoose.models.BusStop || mongoose.model('BusStop', BusStopSchema);

export default BusStop;
