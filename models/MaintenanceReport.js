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


    location: {

      type: {

        type: String,

        enum: ['Point'],

        default: 'Point',

      },


      coordinates: {

        type: [Number],

        required: true,

      },

    },


    category: {

      type: String,

      required: true,

      trim: true,

    },


    images: [

      {

        type: String,

      },

    ],


    severity: {

      type: String,

      enum: [
        'low',
        'medium',
        'high'
      ],

      required: true,

    },


    status: {

      type: String,

      enum: [
        'pending',
        'under-repair',
        'resolved'
      ],

      default: 'pending',

    },


    // Assigned technician

    technicianName: {

      type: String,

      default: null,

    },


    // Maintenance activity history

    history: [

      {

        status: {

          type: String,

        },


        note: {

          type: String,

          default: '',

        },


        updatedBy: {

          type: mongoose.Schema.Types.ObjectId,

          ref: 'User',

        },


        date: {

          type: Date,

          default: Date.now,

        },


      }

    ],


  },


  {

    timestamps: true,

  }

);



MaintenanceReportSchema.index({
  location: '2dsphere'
});


export default mongoose.models.MaintenanceReport ||
  mongoose.model(
    'MaintenanceReport',
    MaintenanceReportSchema
  );