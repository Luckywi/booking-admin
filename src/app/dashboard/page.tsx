export default function DashboardPage() {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Bienvenue sur votre Dashboard</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-700">Rendez-vous du jour</h3>
            <p className="text-3xl font-bold mt-2">0</p>
          </div>
          <div className="bg-green-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-green-700">Clients actifs</h3>
            <p className="text-3xl font-bold mt-2">0</p>
          </div>
          <div className="bg-purple-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-purple-700">Revenus du mois</h3>
            <p className="text-3xl font-bold mt-2">0 €</p>
          </div>
        </div>
      </div>
    );
  }