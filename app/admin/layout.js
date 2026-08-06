export const metadata = {
  title: 'SmartTransit Admin Panel',
  description: 'Manage routes, buses, and analytics for SmartTransit.',
};

export default function AdminLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {children}
    </div>
  );
}
