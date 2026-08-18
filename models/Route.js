import mongoose from 'mongoose';

const RouteSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    stops: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BusStop',
        required: true,
      },
    ],
    distance: {
      type: Number, // Distance in meters or kilometers
      required: true,
    },
    estimatedDuration: {
      type: Number, // Duration in minutes
      required: true,
    },
  },
  {
    timestamps: true,
  }
);


const Route = mongoose.models.Route || mongoose.model('Route', RouteSchema);

export default Route;
