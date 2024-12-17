'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/lib/firebase/config';
import { addDoc, collection, query, where, getDocs } from 'firebase/firestore';
import type { Duration, Service } from '@/types/service';
import type { Staff } from '@/types/staff';

interface AddServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categoryId: string;
  categoryTitle: string;
}

export default function AddServiceModal({ isOpen, onClose, onSuccess, categoryId, categoryTitle }: AddServiceModalProps) {
  const { userData } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    hours: 0,
    minutes: 0,
    price: 0,
    allowAllStaff: true,
    selectedStaffIds: [] as string[]
  });

  // Charger les collaborateurs
  useEffect(() => {
    if (!userData?.businessId || !isOpen) return;

    const fetchStaff = async () => {
      const q = query(
        collection(db, 'staff'),
        where('businessId', '==', userData.businessId)
      );

      const snapshot = await getDocs(q);
      const staffData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Staff[];

      setStaff(staffData);
    };

    fetchStaff();
  }, [userData?.businessId, isOpen]);

  const handleStaffSelection = (staffId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedStaffIds: prev.selectedStaffIds.includes(staffId)
        ? prev.selectedStaffIds.filter(id => id !== staffId)
        : [...prev.selectedStaffIds, staffId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData?.businessId) return;

    try {
      setIsSubmitting(true);

      const duration: Duration = {
        hours: Number(formData.hours),
        minutes: Number(formData.minutes)
      };

      await addDoc(collection(db, 'services'), {
        businessId: userData.businessId,
        categoryId,
        title: formData.title.trim(),
        description: formData.description.trim(),
        duration,
        price: Number(formData.price),
        createdAt: new Date(),
        order: 0,
        staffIds: formData.allowAllStaff ? [] : formData.selectedStaffIds,
        allowAllStaff: formData.allowAllStaff
      });

      onSuccess();
      setFormData({
        title: '',
        description: '',
        hours: 0,
        minutes: 0,
        price: 0,
        allowAllStaff: true,
        selectedStaffIds: []
      });
      onClose();
    } catch (error) {
      console.error('Erreur lors de la création du service:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-1">Nouveau service</h2>
        <p className="text-gray-600 text-sm mb-4">Section : {categoryTitle}</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Champs existants... */}
          {/* Ajout de la section des collaborateurs */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Collaborateurs autorisés
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.allowAllStaff}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      allowAllStaff: e.target.checked,
                      selectedStaffIds: []
                    }));
                  }}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 mr-2"
                />
                <span>Tous les collaborateurs</span>
              </label>

              {!formData.allowAllStaff && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {staff.map((member) => (
                    <label 
                      key={member.id}
                      className="flex items-center p-2 bg-gray-50 rounded-md"
                    >
                      <input
                        type="checkbox"
                        checked={formData.selectedStaffIds.includes(member.id)}
                        onChange={() => handleStaffSelection(member.id)}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 mr-2"
                      />
                      <span>{member.firstName} {member.lastName}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
              disabled={isSubmitting}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
              disabled={isSubmitting || (!formData.allowAllStaff && formData.selectedStaffIds.length === 0)}
            >
              {isSubmitting ? 'Création...' : 'Créer le service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}