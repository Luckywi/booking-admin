'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config';
import AddSectionModal from '@/components/services/AddSectionModal';
import AddServiceModal from '@/components/services/AddServiceModal';
import EditSectionModal from '@/components/services/EditSectionModal';
import EditServiceModal from '@/components/services/EditServiceModal';
import AddStaffModal from '@/components/services/AddStaffModal';
import type { ServiceCategory, Service } from '@/types/service';
import type { Staff } from '@/types/staff';
import { Pencil, Trash2 } from 'lucide-react';
import BusinessHoursSection from '@/components/services/BusinessHoursSection';
import StaffHoursModal from '@/components/services/StaffHoursModal';
import { collection, query, where, onSnapshot, doc, getDocs } from 'firebase/firestore';
import {writeBatch } from 'firebase/firestore';

export default function ServicesPage() {
  const { userData } = useAuth();
  const [isAddSectionModalOpen, setIsAddSectionModalOpen] = useState(false);
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<{ id: string, title: string } | null>(null);
  const [sections, setSections] = useState<ServiceCategory[]>([]);
  const [services, setServices] = useState<{ [key: string]: Service[] }>({});
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSection, setEditingSection] = useState<ServiceCategory | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [selectedStaffForHours, setSelectedStaffForHours] = useState<Staff | null>(null);


  // Récupérer les collaborateurs
  useEffect(() => {
    if (!userData?.businessId) return;

    const q = query(
      collection(db, 'staff'),
      where('businessId', '==', userData.businessId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const staffData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Staff[];

      setStaff(staffData);
    });

    return () => unsubscribe();
  }, [userData?.businessId]);

  // Récupérer les sections
  useEffect(() => {
    if (!userData?.businessId) return;

    const q = query(
      collection(db, 'serviceCategories'),
      where('businessId', '==', userData.businessId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sectionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ServiceCategory[];

      setSections(sectionsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userData?.businessId]);

  // Récupérer les services
  useEffect(() => {
    if (!userData?.businessId) return;

    const q = query(
      collection(db, 'services'),
      where('businessId', '==', userData.businessId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const servicesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Service[];

      const groupedServices = servicesData.reduce((acc, service) => {
        if (!acc[service.categoryId]) {
          acc[service.categoryId] = [];
        }
        acc[service.categoryId].push(service);
        return acc;
      }, {} as { [key: string]: Service[] });

      setServices(groupedServices);
    });

    return () => unsubscribe();
  }, [userData?.businessId]);

  const handleDeleteStaff = async (staffId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce collaborateur et tous ses rendez-vous ?')) return;
  
    try {
      const batch = writeBatch(db);
  
      // 1. Suppression des rendez-vous
      const appointmentsQuery = query(
        collection(db, 'appointments'),
        where('staffId', '==', staffId)
      );
      const appointmentsSnap = await getDocs(appointmentsQuery);
      appointmentsSnap.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
  
      // 2. Suppression des horaires
      const staffHoursRef = doc(db, 'staffHours', staffId);
      batch.delete(staffHoursRef);
  
      // 3. Suppression du collaborateur
      const staffRef = doc(db, 'staff', staffId);
      batch.delete(staffRef);
  
      // Exécuter toutes les opérations en une seule transaction
      await batch.commit();
      
      console.log('Collaborateur et données associées supprimés avec succès');
  
    } catch (error) {
      console.error('Erreur lors de la suppression du collaborateur:', error);
      throw error; // Propager l'erreur pour la gestion dans le composant
    }
  };

  if (!userData?.businessId) {
    return <div className="p-6">Accès non autorisé</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Gestion des Services</h1>
        <p className="text-gray-600">Gérez vos services et leurs catégories</p>
      </div>

      {/* Section Collaborateurs */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Collaborateurs</h2>
          <button
            onClick={() => setIsAddStaffModalOpen(true)}
            className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            Ajouter
          </button>
        </div>


        <div className="bg-white rounded-lg shadow p-4">
          {staff.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Aucun collaborateur</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {staff.map((member) => (
                <div
                  key={member.id}
                  className="bg-gray-50 rounded-lg p-4 relative group"
                >
                  <button
                    onClick={() => handleDeleteStaff(member.id)}
                    className="absolute right-2 top-2 p-1.5 text-gray-400 hover:text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-2 flex items-center justify-center text-xl font-semibold">
                    {member.firstName[0]}{member.lastName[0]}
                  </div>
                  <p className="text-center font-medium truncate">{member.firstName}</p>
                  <p className="text-center text-sm text-gray-600 truncate">{member.lastName}</p>

                  {/* Bouton de gestion des disponibilités */}
                  <button
                    onClick={() => setSelectedStaffForHours(member)}
                    className="mt-2 w-full text-sm text-blue-600 hover:text-blue-700 py-1 px-2 rounded-md hover:bg-blue-50 transition-colors"
                  >
                    Gérer les disponibilités
                  </button>
                </div>
              ))}




            </div>
          )}
        </div>
      </div>

      {/* Après la section des collaborateurs */}
      <div className="mb-8">
        <BusinessHoursSection businessId={userData.businessId} />
      </div>



      {/* Section Services */}
      <div className="space-y-6">
        {loading ? (
          <div className="text-gray-500">Chargement des sections...</div>
        ) : sections.length === 0 ? (
          <div className="text-gray-500">Aucune section créée</div>
        ) : (
          sections.map((section) => (
            <div
              key={section.id}
              className="bg-white p-6 rounded-lg shadow"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">{section.title}</h2>
                <button
                  onClick={() => setEditingSection(section)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3 mb-4">
                {services[section.id]?.length > 0 ? (
                  services[section.id].map((service) => (
                    <div
                      key={service.id}
                      className="bg-gray-50 p-4 rounded-md relative group"
                    >
                      <button
                        onClick={() => setEditingService(service)}
                        className="absolute right-2 top-2 p-2 text-gray-600 hover:bg-gray-200 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>

                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{service.title}</h3>
                          <p className="text-sm text-gray-600">{service.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{service.price} €</p>
                          <p className="text-sm text-gray-600">
                            {service.duration.hours}h {service.duration.minutes}min
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">Aucun service dans cette section</p>
                )}
              </div>

              <button
                className="text-blue-600 hover:text-blue-700 text-sm flex items-center"
                onClick={() => setSelectedCategory({ id: section.id, title: section.title })}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Ajouter un service
              </button>
            </div>
          ))
        )}
      </div>

      <div className="mt-6">
        <button
          onClick={() => setIsAddSectionModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          Ajouter une section de service
        </button>
      </div>

      {/* Modals */}
      <AddStaffModal
        isOpen={isAddStaffModalOpen}
        onClose={() => setIsAddStaffModalOpen(false)}
        onSuccess={() => setIsAddStaffModalOpen(false)}
      />

      <AddSectionModal
        isOpen={isAddSectionModalOpen}
        onClose={() => setIsAddSectionModalOpen(false)}
        onSuccess={() => setIsAddSectionModalOpen(false)}
      />

      <AddServiceModal
        isOpen={!!selectedCategory}
        onClose={() => setSelectedCategory(null)}
        onSuccess={() => setSelectedCategory(null)}
        categoryId={selectedCategory?.id || ''}
        categoryTitle={selectedCategory?.title || ''}
      />

      <EditSectionModal
        isOpen={!!editingSection}
        onClose={() => setEditingSection(null)}
        onSuccess={() => setEditingSection(null)}
        section={editingSection}
      />

      <EditServiceModal
        isOpen={!!editingService}
        onClose={() => setEditingService(null)}
        onSuccess={() => setEditingService(null)}
        service={editingService}
      />

      <StaffHoursModal
        isOpen={!!selectedStaffForHours}
        onClose={() => setSelectedStaffForHours(null)}
        staffId={selectedStaffForHours?.id || ''}
        businessId={userData.businessId}
      />

    </div>
  );
}