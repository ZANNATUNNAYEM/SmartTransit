import mongoose from 'mongoose';

const MaintenanceReportSchema = new mongoose.Schema(
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
    category: {
      type: String,
      required: true,
      trim: true,
    },
    images: [
      {
        type: String, // URLs to images stored in Cloudinary/S3
      },
    ],
    severity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'under-repair', 'resolved'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
MaintenanceReportSchema.index({ busId: 1, status: 1 });

const MaintenanceReport = mongoose.models.MaintenanceReport || mongoose.model('MaintenanceReport', MaintenanceReportSchema);

export default MaintenanceReport;
