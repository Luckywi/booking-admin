'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, getDoc, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '@/components/auth/AuthProvider';
import StaffColorPicker from '@/components/staff/StaffColorPicker';
import type { Appointment, AppointmentFormData } from '@/types/appointment';
import type { Staff } from '@/types/staff';
import type { Service, ServiceCategory } from '@/types/service';
import type { BusinessHours } from '@/types/business';

interface StaffHoursModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffId: string;
  businessId: string;
}

const orderedDays = [
  { key: 'monday', label: 'Lundi' },
  { key: 'tuesday', label: 'Mardi' },
  { key: 'wednesday', label: 'Mercredi' },
  { key: 'thursday', label: 'Jeudi' },
  { key: 'friday', label: 'Vendredi' },
  { key: 'saturday', label: 'Samedi' },
  { key: 'sunday', label: 'Dimanche' }
] as const;

const defaultHours = {
  monday: { day: 'Lundi', isOpen: true, openTime: '09:00', closeTime: '19:00' },
  tuesday: { day: 'Mardi', isOpen: true, openTime: '09:00', closeTime: '19:00' },
  wednesday: { day: 'Mercredi', isOpen: true, openTime: '09:00', closeTime: '19:00' },
  thursday: { day: 'Jeudi', isOpen: true, openTime: '09:00', closeTime: '19:00' },
  friday: { day: 'Vendredi', isOpen: true, openTime: '09:00', closeTime: '19:00' },
  saturday: { day: 'Samedi', isOpen: false },
  sunday: { day: 'Dimanche', isOpen: false }
};

export default function StaffHoursModal({ isOpen, onClose, staffId, businessId }: StaffHoursModalProps) {
  const [hours, setHours] = useState<BusinessHours['hours']>(defaultHours);
  const [isSaving, setIsSaving] = useState(false);
  const [staffData, setStaffData] = useState({
    firstName: '',
    lastName: '',
    color: '#FF5733'
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Récupérer les horaires
        const hoursDoc = await getDoc(doc(db, 'staffHours', staffId));
        if (hoursDoc.exists()) {
          setHours(hoursDoc.data().hours);
        }

        // Récupérer les informations du staff
        const staffDoc = await getDoc(doc(db, 'staff', staffId));
        if (staffDoc.exists()) {
          const data = staffDoc.data();
          setStaffData({
            firstName: data.firstName,
            lastName: data.lastName,
            color: data.color || '#FF5733'
          });
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
      }
    };

    if (isOpen && staffId) {
      fetchData();
    }
  }, [staffId, isOpen]);

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Sauvegarder les horaires
      await setDoc(doc(db, 'staffHours', staffId), {
        staffId,
        businessId,
        hours,
        updatedAt: new Date()
      });

      // Mettre à jour les informations du staff
      await updateDoc(doc(db, 'staff', staffId), {
        color: staffData.color,
        updatedAt: new Date()
      });

      onClose();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            Paramètres du collaborateur : {staffData.firstName} {staffData.lastName}
          </h2>
        </div>

        {/* Section Couleur */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium mb-4">Couleur des rendez-vous</h3>
          <StaffColorPicker
            color={staffData.color}
            onChange={(color) => setStaffData(prev => ({ ...prev, color }))}
          />
        </div>

        {/* Section Horaires */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Horaires de disponibilité</h3>
          {orderedDays.map(({ key, label }) => {
            const dayHours = hours[key as keyof typeof hours];
            return (
              <div 
                key={key}
                className="flex items-center space-x-4 py-3 border-b last:border-0"
              >
                <div className="w-32">
                  <span className="font-medium">{label}</span>
                </div>
                <div className="flex-1 flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={dayHours.isOpen}
                      onChange={(e) => {
                        setHours((prev: any) => ({
                          ...prev,
                          [key]: {
                            ...prev[key],
                            isOpen: e.target.checked
                          }
                        }));
                      }}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 mr-2"
                    />
                    <span>Disponible</span>
                  </label>

                  {dayHours.isOpen && (
                    <>
                      <input
                        type="time"
                        value={dayHours.openTime}
                        onChange={(e) => {
                          setHours((prev: any) => ({
                            ...prev,
                            [key]: {
                              ...prev[key],
                              openTime: e.target.value
                            }
                          }));
                        }}
                        className="border rounded-md p-1"
                      />
                      <span>-</span>
                      <input
                        type="time"
                        value={dayHours.closeTime}
                        onChange={(e) => {
                          setHours((prev: any) => ({
                            ...prev,
                            [key]: {
                              ...prev[key],
                              closeTime: e.target.value
                            }
                          }));
                        }}
                        className="border rounded-md p-1"
                      />
                    </>
                  )}
                  
                  {!dayHours.isOpen && (
                    <span className="text-gray-500 italic">Non disponible</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md mr-2"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
          >
            {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </div>
    </div>
  );
}