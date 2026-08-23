import mongoose from 'mongoose';

const LostItemSchema = new mongoose.Schema(
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

    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PassengerJourney',
    },    
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['reported', 'found', 'claimed'],
      default: 'reported',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
LostItemSchema.index({ passengerId: 1, status: 1 });

const LostItem = mongoose.models.LostItem || mongoose.model('LostItem', LostItemSchema);

export default LostItem;
