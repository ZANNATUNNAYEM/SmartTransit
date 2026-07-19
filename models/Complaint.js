import mongoose from 'mongoose';

const ComplaintSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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
    relatedBusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bus',
    },
    relatedRouteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Route',
    },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'resolved'],
      default: 'pending',
    },
    resolutionNote: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
ComplaintSchema.index({ status: 1, createdAt: -1 });
ComplaintSchema.index({ relatedRouteId: 1 });
ComplaintSchema.index({ relatedBusId: 1 });

const Complaint = mongoose.models.Complaint || mongoose.model('Complaint', ComplaintSchema);

export default Complaint;
