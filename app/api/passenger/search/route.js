import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Bus from "@/models/Bus";
import Route from "@/models/Route";
import BusStop from "@/models/BusStop";
import User from "@/models/User";
import { verifyAccessToken } from "@/lib/jwt";

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } =
      new URL(request.url);

    const query =
      searchParams.get("query");

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

    const searchRegex =
      new RegExp(query, "i");

    // Find matching routes
    const routes =
      await Route.find({
        name: searchRegex,
      }).populate("stops");

    // Find matching bus stops
    const stops =
      await BusStop.find({
        name: searchRegex,
      });

    // Find active buses
    const buses =
      await Bus.find({
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
    const filteredBuses =
      buses.filter((bus) => {

        const busMatch =
          bus.busNumber &&
          bus.busNumber.match(searchRegex);

        const routeMatch =
          bus.routeId &&
          bus.routeId.name.match(searchRegex);

        return (
          busMatch ||
          routeMatch
        );
      });

    /*
     * Save the first matching bus
     * to the passenger's recent searches.
     */
    try {
      const token =
        request.cookies.get(
          "access_token"
        )?.value;

      if (token && filteredBuses.length > 0) {

        const decoded =
          verifyAccessToken(token);

        if (decoded?.userId) {

          const user =
            await User.findById(
              decoded.userId
            );

          if (
            user &&
            user.role === "passenger"
          ) {

            const busId =
              filteredBuses[0]._id;

            // Remove existing entry
            // for this bus first.
            user.recentSearches =
              user.recentSearches.filter(
                (search) =>
                  search.busId.toString() !==
                  busId.toString()
              );

            // Add newest search
            // at the beginning.
            user.recentSearches.unshift({
              busId,
              searchedAt: new Date(),
            });

            // Keep only the latest 10
            // searches.
            user.recentSearches =
              user.recentSearches.slice(
                0,
                10
              );

            await user.save();
          }
        }
      }

    } catch (historyError) {

      /*
       * Search should still work even
       * if saving history fails.
       */
      console.error(
        "Recent search save error:",
        historyError
      );
    }

    return NextResponse.json(
      {
        success: true,

        buses:
          filteredBuses,

        routes,

        stops,
      },
      {
        status: 200,
      }
    );

  } catch (error) {

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