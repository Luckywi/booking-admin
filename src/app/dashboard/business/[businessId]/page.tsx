'use client';

import { useAuth } from '@/components/auth/AuthProvider';

export default function BusinessDashboard() {
  const { userData } = useAuth();

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">{userData?.businessName}</h1>
        <p className="text-gray-600">Dashboard Professionnel</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Widget Rendez-vous du jour */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Rendez-vous aujourd'hui</h3>
          <p className="text-3xl font-bold text-blue-600">0</p>
        </div>

        {/* Widget Clients */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Total Clients</h3>
          <p className="text-3xl font-bold text-green-600">0</p>
        </div>

        {/* Widget Revenus */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Revenus du mois</h3>
          <p className="text-3xl font-bold text-purple-600">0 €</p>
        </div>
      </div>
    </div>
  );
}