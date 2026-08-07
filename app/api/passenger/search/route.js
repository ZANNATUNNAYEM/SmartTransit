import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Bus from "@/models/Bus";
import Route from "@/models/Route";
import BusStop from "@/models/BusStop";
import User from "@/models/User";

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);

    const query = searchParams.get("query");

    if (!query) {
      return NextResponse.json(
        {
          error: "Search query is required",
        },
        {
          status: 400,
        }
      );
    }

    const searchRegex = new RegExp(query, "i");


    // Find matching routes
    const routes = await Route.find({
      name: searchRegex,
    }).populate("stops");


    // Find matching bus stops
    const stops = await BusStop.find({
      name: searchRegex,
    });


    // Find buses
    const buses = await Bus.find({
      status: "active",
    })
      .populate({
        path: "routeId",
        populate: {
          path: "stops",
        },
      })
      .populate("driverId");


    // Filter buses by bus number or route
    const filteredBuses = buses.filter((bus) => {
      const busMatch =
        bus.busNumber &&
        bus.busNumber.match(searchRegex);

      const routeMatch =
        bus.routeId &&
        bus.routeId.name.match(searchRegex);

      return busMatch || routeMatch;
    });


    return NextResponse.json(
      {
        success: true,

        buses: filteredBuses,

        routes,

        stops,
      },
      {
        status: 200,
      }
    );


  } 
catch (error) {

    console.error(
      "Passenger search error:",
      error
    );


    return NextResponse.json(
      {
        error: error.message,
      },
      {
        status: 500,
      }
    );

  }
}