import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
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
      trim: true,
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

    profileImageUrl: {
      type: String,
      default: null,
      trim: true,
    },

    profileImagePublicId: {
      type: String,
      default: null,
      select: false,
    },

    isEmailVerified: {
      type: Boolean,
      default: function () {
        return this.role === 'admin';
      },
    },

    emailVerifiedAt: {
      type: Date,
      default: null,
    },

    emailVerificationTokenHash: {
      type: String,
      default: null,
      select: false,
    },

    emailVerificationExpiresAt: {
      type: Date,
      default: null,
      select: false,
    },

    driverDetails: {
      licenseNo: {
        type: String,
        trim: true,
        required: function () {
          return this.role === 'driver';
        },
      },

      orgName: {
        type: String,
        trim: true,
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
      enum: [
        'pending',
        'approved',
        'rejected',
        'active',
        'disabled',
      ],
      default: function () {
        return this.role === 'driver'
          ? 'pending'
          : 'active';
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
    recentSearches: [
      {
        busId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Bus',
        },
        searchedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    travelHistory: [
      {
        tripId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Trip',
        },
        routeId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Route',
        },
        busId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Bus',
        },
        travelledAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    frequentDestinations: [
      {
        stopId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'BusStop',
        },
        visitCount: {
          type: Number,
          default: 1,
        },
        lastVisitedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

UserSchema.index({ role: 1, status: 1 });

UserSchema.index(
  { emailVerificationTokenHash: 1 },
  { sparse: true }
);

UserSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 10);
});

UserSchema.methods.comparePassword = async function (
  candidatePassword
) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User =
  mongoose.models.User ||
  mongoose.model('User', UserSchema);

export default User;