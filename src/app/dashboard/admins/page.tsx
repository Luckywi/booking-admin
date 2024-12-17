import CreateAdminForm from '@/components/dashboard/admin/CreateAdminForm';

export default function AdminsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-black">Gestion des Administrateurs</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold text-black mb-4">Créer un nouveau compte administrateur</h2>
        <CreateAdminForm />
      </div>
    </div>
  );
}