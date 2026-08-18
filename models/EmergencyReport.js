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

const EmergencyReportSchema = new mongoose.Schema(
  {
    passengerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    busId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bus',
    },
    location: {
      type: GeoPointSchema,
      required: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'resolved', 'active'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
EmergencyReportSchema.index({ location: '2dsphere' });
EmergencyReportSchema.index({ status: 1, createdAt: -1 });

const EmergencyReport = mongoose.models.EmergencyReport || mongoose.model('EmergencyReport', EmergencyReportSchema);

export default EmergencyReport;
