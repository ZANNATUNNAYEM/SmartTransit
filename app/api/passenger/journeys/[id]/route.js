import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import PassengerJourney from "@/models/PassengerJourney";

export async function PATCH(request, { params }) {
  try {
    await connectDB();

    const { id } = await params;

    const body = await request.json();

    const { status } = body;

    if (!["active", "completed", "cancelled"].includes(status)) {
      return NextResponse.json(
        {
          error: "Invalid status"
        },
        {
          status: 400
        }
      );
    }

    const journey = await PassengerJourney.findByIdAndUpdate(
      id,
      {
        status
      },
      {
        new: true
      }
    );

    if (!journey) {
      return NextResponse.json(
        {
          error: "Journey not found"
        },
        {
          status: 404
        }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Journey marked as ${status}`,
      journey
    });

  } catch (error) {

    console.error(
      "Update journey error:",
      error
    );

    return NextResponse.json(
      {
        error: error.message
      },
      {
        status: 500
      }
    );
  }
}