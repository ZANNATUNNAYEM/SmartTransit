'use client';

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from 'react-leaflet';

import {
  useEffect,
  useState,
} from 'react';

import 'leaflet/dist/leaflet.css';

import L from 'leaflet';


delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',

  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',

  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});


function MapUpdater({ position }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.setView(
        position,
        map.getZoom()
      );
    }
  }, [position, map]);

  return null;
}



export default function MapView({
  busLocation,
  stops = [],
  busId,
}) {

  const [liveLocation, setLiveLocation] =
    useState(busLocation);

  const [lastUpdated, setLastUpdated] =
    useState(null);



  useEffect(() => {

    if (!busId) {
      return;
    }


    async function updateLocation() {

      try {

        const response =
          await fetch(
            `/api/passenger/live-location?busId=${busId}`,
            {
              cache: 'no-store',
            }
          );


        const data =
          await response.json();


        if (response.ok) {

          setLiveLocation(
            data.currentLocation
          );


          setLastUpdated(
            new Date()
          );

        }


      } catch (error) {

        console.error(
          'Live tracking failed:',
          error
        );

      }

    }



    updateLocation();


    const interval =
      setInterval(
        updateLocation,
        10000
      );


    return () =>
      clearInterval(interval);


  }, [busId]);



  const defaultPosition = [
    23.8069,
    90.3701,
  ];



  const busPosition =
    liveLocation
      ? [
          liveLocation.coordinates[1],
          liveLocation.coordinates[0],
        ]
      : defaultPosition;



  const routePositions =
    stops.map(
      (stop) => [
        stop.location.coordinates[1],
        stop.location.coordinates[0],
      ]
    );



  const formattedTime =
    lastUpdated
      ? lastUpdated.toLocaleTimeString()
      : 'Waiting...';



  return (

    <div>

      <div className="mb-2 rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">

        🟢 Live Tracking

        <br />

        Last updated:
        {' '}
        {formattedTime}

      </div>



      <MapContainer

        center={busPosition}

        zoom={13}

        style={{
        height:'70vh',
        width:'100%',
        borderRadius:'12px',
        }}

      >

        <MapUpdater
          position={busPosition}
        />



        <TileLayer

          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"

          attribution="&copy; OpenStreetMap contributors"

        />



        {liveLocation && (

          <Marker
            position={busPosition}
          >

            <Popup>
              🚌 Live Bus Location
            </Popup>

          </Marker>

        )}



        {stops.map((stop) => (

          <Marker

            key={stop._id}

            position={[
              stop.location.coordinates[1],
              stop.location.coordinates[0],
            ]}

          >

            <Popup>
              📍 {stop.name}
            </Popup>

          </Marker>

        ))}



        {routePositions.length > 1 && (

          <Polyline
            positions={routePositions}
          />

        )}



      </MapContainer>

    </div>

  );

}