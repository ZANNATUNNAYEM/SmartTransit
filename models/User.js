import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['passenger', 'driver', 'admin'],
      default: 'passenger',
    },
    driverDetails: {
      licenseNo: {
        type: String,
        required: function () {
          return this.role === 'driver';
        },
      },
      orgName: {
        type: String,
        required: function () {
          return this.role === 'driver';
        },
      },
    },
    isApproved: {
      type: Boolean,
      default: function () {
        return this.role !== 'driver';
      },
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'active', 'disabled'],
      default: function () {
        return this.role === 'driver' ? 'pending' : 'active';
      },
    },
    favoriteRoutes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Route',
      },
    ],
    favoriteStops: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BusStop',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes
UserSchema.index({ role: 1, status: 1 });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

export default User;

