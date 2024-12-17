'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config';
import { doc, updateDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import type { Service, Duration } from '@/types/service';
import type { Staff } from '@/types/staff';

interface EditServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  service: Service | null;
}

export default function EditServiceModal({ isOpen, onClose, onSuccess, service }: EditServiceModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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

  // Charger les données du service
  useEffect(() => {
    if (service) {
      setFormData({
        title: service.title,
        description: service.description,
        hours: service.duration.hours,
        minutes: service.duration.minutes,
        price: service.price,
        allowAllStaff: service.allowAllStaff || false,
        selectedStaffIds: service.staffIds || []
      });
    }
  }, [service]);

  // Charger les collaborateurs
  useEffect(() => {
    if (!service?.businessId || !isOpen) return;

    const fetchStaff = async () => {
      const q = query(
        collection(db, 'staff'),
        where('businessId', '==', service.businessId)
      );

      const snapshot = await getDocs(q);
      const staffData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Staff[];

      setStaff(staffData);
    };

    fetchStaff();
  }, [service?.businessId, isOpen]);

  const handleStaffSelection = (staffId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedStaffIds: prev.selectedStaffIds.includes(staffId)
        ? prev.selectedStaffIds.filter(id => id !== staffId)
        : [...prev.selectedStaffIds, staffId]
    }));
  };

  if (!isOpen || !service) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);

      const duration: Duration = {
        hours: Number(formData.hours),
        minutes: Number(formData.minutes)
      };

      await updateDoc(doc(db, 'services', service.id), {
        title: formData.title.trim(),
        description: formData.description.trim(),
        duration,
        price: Number(formData.price),
        staffIds: formData.allowAllStaff ? [] : formData.selectedStaffIds,
        allowAllStaff: formData.allowAllStaff
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erreur lors de la modification du service:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce service ?')) return;

    try {
      setIsDeleting(true);
      await deleteDoc(doc(db, 'services', service.id));
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erreur lors de la suppression du service:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Modifier le service</h2>
          <button
            onClick={handleDelete}
            className="text-red-600 hover:text-red-700 text-sm"
            disabled={isDeleting || isSubmitting}
          >
            {isDeleting ? 'Suppression...' : 'Supprimer'}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom du service
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full p-2 border rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full p-2 border rounded-md"
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Durée
              </label>
              <div className="flex gap-2">
                <div>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={formData.hours}
                    onChange={(e) => setFormData({...formData, hours: parseInt(e.target.value)})}
                    className="w-full p-2 border rounded-md"
                    placeholder="Heures"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={formData.minutes}
                    onChange={(e) => setFormData({...formData, minutes: parseInt(e.target.value)})}
                    className="w-full p-2 border rounded-md"
                    placeholder="Minutes"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prix (€)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
                className="w-full p-2 border rounded-md"
                required
              />
            </div>
          </div>

          {/* Section des collaborateurs */}
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
              disabled={isSubmitting || isDeleting}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
              disabled={isSubmitting || isDeleting || (!formData.allowAllStaff && formData.selectedStaffIds.length === 0)}
            >
              {isSubmitting ? 'Modification...' : 'Modifier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}