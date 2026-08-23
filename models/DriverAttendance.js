import mongoose from 'mongoose';


const DriverAttendanceSchema =
  new mongoose.Schema(

    {

      driverId: {

        type: mongoose.Schema.Types.ObjectId,

        ref:'User',

        required:true,

      },


      date: {

        type: Date,

        required:true,

      },


      status: {

        type:String,

        enum:[
          'present',
          'absent',
          'late'
        ],

        default:'present',

      },


      checkInTime: {

        type:String,

        default:null,

      },


      checkOutTime: {

        type:String,

        default:null,

      },


    },

    {

      timestamps:true,

    }

  );



export default mongoose.models.DriverAttendance ||
  mongoose.model(
    'DriverAttendance',
    DriverAttendanceSchema
  );