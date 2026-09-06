import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import MaintenanceReport from '@/models/MaintenanceReport';


export async function GET(request) {

  try {

    await connectDB();


    const reports =
      await MaintenanceReport.find()
        .populate(
          'busId',
          'busNumber'
        )
        .populate(
          'driverId',
          'name email'
        )
        .sort({
          createdAt: -1
        });


    return NextResponse.json({

      success:true,

      reports,

    });


  } catch(error) {

    console.error(
      'Admin maintenance reports error:',
      error
    );


    return NextResponse.json(
      {
        error:error.message
      },
      {
        status:500
      }
    );

  }

}



export async function PATCH(request) {

  try {

    await connectDB();


    const body =
      await request.json();


    const {
      reportId,
      status,
      technicianName,
      note,
    } = body;



    if (!reportId) {

      return NextResponse.json(
        {
          error: 'Report ID required'
        },
        {
          status:400
        }
      );

    }



    const report =
      await MaintenanceReport.findById(
        reportId
      );


    if (!report) {

      return NextResponse.json(
        {
          error:
          'Maintenance report not found'
        },
        {
          status:404
        }
      );

    }



    if (status) {

      report.status = status;


      report.history.push({

        status,

        note:
          note ||
          `Status updated to ${status}`,

      });

    }



    if (technicianName !== undefined) {

    report.technicianName =
        technicianName;


    report.history.push({

        note:
        `Technician assigned: ${technicianName}`,

    });

    }



    await report.save();



    return NextResponse.json({

      success:true,

      report,

    });



  } catch(error) {


    console.error(
      'Update maintenance report error:',
      error
    );


    return NextResponse.json(

      {
        error:error.message
      },

      {
        status:500
      }

    );

  }

}