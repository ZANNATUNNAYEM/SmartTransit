'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Background decoration elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px]" />
      </div>

      {/* Header / Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🚌</span>
            <span className="text-xl font-black tracking-tight bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              SmartTransit
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              href="/login" 
              className="text-sm font-semibold text-slate-300 hover:text-white transition"
            >
              Sign In
            </Link>
            <Link 
              href="/register" 
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold px-4 py-2 rounded-xl transition shadow-lg shadow-emerald-950/20"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-6xl mx-auto px-6 py-16 md:py-24 z-10 w-full flex flex-col justify-center">
        <div className="text-center max-w-3xl mx-auto">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 uppercase tracking-widest">
            Next-Gen Urban Mobility
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mt-6 leading-tight">
            Predictive, Weather-Aware <br/>
            <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-blue-400 bg-clip-text text-transparent">
              Smart Bus Transit System
            </span>
          </h1>
          <p className="mt-6 text-base md:text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
            Experience intelligent route optimization, dynamic weather-adjusted ETAs, passenger lost & found boards, and real-time live map tracking.
          </p>
        </div>

        {/* Dashboard Portal Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Passenger Portal */}
          <div className="group relative bg-slate-800/40 border border-slate-700/50 rounded-3xl p-8 hover:border-emerald-500/50 transition duration-300 hover:shadow-xl hover:shadow-emerald-950/10 flex flex-col justify-between overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 text-8xl group-hover:scale-110 transition duration-300 pointer-events-none">🚶</div>
            <div>
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xl shadow-inner">
                🚶
              </div>
              <h3 className="text-xl font-bold mt-6 text-white group-hover:text-emerald-400 transition">Passenger Portal</h3>
              <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                Check route coordinates, track active bus markers live on Leaflet maps, request ETAs with live OpenWeather feeds, and report lost luggage.
              </p>
            </div>
            <div className="mt-8">
              <Link 
                href="/passenger/dashboard" 
                className="w-full inline-flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl border border-slate-700 transition"
              >
                Enter Portal &rarr;
              </Link>
            </div>
          </div>

          {/* Driver Portal */}
          <div className="group relative bg-slate-800/40 border border-slate-700/50 rounded-3xl p-8 hover:border-teal-500/50 transition duration-300 hover:shadow-xl hover:shadow-teal-950/10 flex flex-col justify-between overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 text-8xl group-hover:scale-110 transition duration-300 pointer-events-none">👨‍✈️</div>
            <div>
              <div className="h-12 w-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-xl shadow-inner">
                👨‍✈️
              </div>
              <h3 className="text-xl font-bold mt-6 text-white group-hover:text-teal-400 transition">Driver Dashboard</h3>
              <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                Manage assigned fleet shifts, view weather timelines at stop locations, switch operational statuses, and trigger alerts.
              </p>
            </div>
            <div className="mt-8">
              <Link 
                href="/driver/dashboard" 
                className="w-full inline-flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl border border-slate-700 transition"
              >
                Enter Portal &rarr;
              </Link>
            </div>
          </div>

          {/* Admin Command Center */}
          <div className="group relative bg-slate-800/40 border border-slate-700/50 rounded-3xl p-8 hover:border-blue-500/50 transition duration-300 hover:shadow-xl hover:shadow-blue-950/10 flex flex-col justify-between overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 text-8xl group-hover:scale-110 transition duration-300 pointer-events-none">🛡️</div>
            <div>
              <div className="h-12 w-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-xl shadow-inner">
                🛡️
              </div>
              <h3 className="text-xl font-bold mt-6 text-white group-hover:text-blue-400 transition">Admin Console</h3>
              <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                Add routes & buses, resolve traveler complaints, optimize schedules using route popularity metrics, and manage passenger feedback.
              </p>
            </div>
            <div className="mt-8">
              <Link 
                href="/admin/dashboard" 
                className="w-full inline-flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl border border-slate-700 transition"
              >
                Enter Console &rarr;
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-8 bg-slate-950/30 text-center text-xs text-slate-500 z-10">
        <div className="max-w-6xl mx-auto px-6">
          <p>&copy; {new Date().getFullYear()} SmartTransit Inc. Real-time predictive transit platform.</p>
        </div>
      </footer>
    </div>
  );
}
