'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/lib/firebase/config';
import { addDoc, collection } from 'firebase/firestore';
import StaffColorPicker from '@/components/staff/StaffColorPicker';


interface AddStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddStaffModal({ isOpen, onClose, onSuccess }: AddStaffModalProps) {
  const { userData } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    color: '#FF5733', // Couleur par défaut
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData?.businessId) return;

    try {
      setIsSubmitting(true);

      await addDoc(collection(db, 'staff'), {
        businessId: userData.businessId,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        color: formData.color, // Ajout de la couleur
        createdAt: new Date(),
      });

      onSuccess();
      setFormData({
        firstName: '',
        lastName: '',
        color: '#FF5733',
      });
      onClose();
    } catch (error) {
      console.error('Erreur lors de l\'ajout du collaborateur:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Ajouter un collaborateur</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prénom
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                className="w-full p-2 border rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                className="w-full p-2 border rounded-md"
                required
              />
            </div>
          </div>

          {/* Ajout du sélecteur de couleur */}
          <div className="mt-4">
            <StaffColorPicker
              color={formData.color}
              onChange={(color) => setFormData({...formData, color})}
            />
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
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Ajout...' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}