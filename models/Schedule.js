import mongoose from 'mongoose';

const ScheduleSchema = new mongoose.Schema(
  {
    routeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Route',
      required: true,
    },
    busId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bus',
      required: true,
    },
    departureTimes: [
      {
        type: String, // format "HH:MM"
        required: true,
      },
    ],
    frequency: {
      type: String, // e.g. "Every 15 mins" or a number representing minutes
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
ScheduleSchema.index({ routeId: 1, busId: 1 });

const Schedule = mongoose.models.Schedule || mongoose.model('Schedule', ScheduleSchema);

export default Schedule;
