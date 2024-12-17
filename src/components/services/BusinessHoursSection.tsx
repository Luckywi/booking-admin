'use client';

import { useState, useEffect } from 'react';
import { useBusinessHours } from '@/contexts/BusinessHoursContext';
import type { BusinessHours } from '@/types/business';

const orderedDays = [
  { key: 'monday', label: 'Lundi' },
  { key: 'tuesday', label: 'Mardi' },
  { key: 'wednesday', label: 'Mercredi' },
  { key: 'thursday', label: 'Jeudi' },
  { key: 'friday', label: 'Vendredi' },
  { key: 'saturday', label: 'Samedi' },
  { key: 'sunday', label: 'Dimanche' }
] as const;

const defaultHours: BusinessHours['hours'] = {
  monday: { day: 'Lundi', isOpen: true, openTime: '09:00', closeTime: '19:00' },
  tuesday: { day: 'Mardi', isOpen: true, openTime: '09:00', closeTime: '19:00' },
  wednesday: { day: 'Mercredi', isOpen: true, openTime: '09:00', closeTime: '19:00' },
  thursday: { day: 'Jeudi', isOpen: true, openTime: '09:00', closeTime: '19:00' },
  friday: { day: 'Vendredi', isOpen: true, openTime: '09:00', closeTime: '19:00' },
  saturday: { day: 'Samedi', isOpen: false },
  sunday: { day: 'Dimanche', isOpen: false }
};

export default function BusinessHoursSection() {
  const { businessHours, updateBusinessHours } = useBusinessHours();
  const [hours, setHours] = useState<BusinessHours['hours']>(defaultHours);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (businessHours) {
      setHours(businessHours);
    }
  }, [businessHours]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await updateBusinessHours(hours);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des horaires:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleHourChange = (
    day: keyof BusinessHours['hours'],
    field: 'isOpen' | 'openTime' | 'closeTime',
    value: string | boolean
  ) => {
    setHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Horaires d'ouverture</h2>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300"
        >
          {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        {orderedDays.map(({ key, label }) => (
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
                  checked={hours[key as keyof BusinessHours['hours']].isOpen}
                  onChange={(e) => handleHourChange(key as keyof BusinessHours['hours'], 'isOpen', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 mr-2"
                />
                <span>Ouvert</span>
              </label>

              {hours[key as keyof BusinessHours['hours']].isOpen && (
                <>
                  <input
                    type="time"
                    value={hours[key as keyof BusinessHours['hours']].openTime}
                    onChange={(e) => handleHourChange(key as keyof BusinessHours['hours'], 'openTime', e.target.value)}
                    className="border rounded-md p-1"
                  />
                  <span>-</span>
                  <input
                    type="time"
                    value={hours[key as keyof BusinessHours['hours']].closeTime}
                    onChange={(e) => handleHourChange(key as keyof BusinessHours['hours'], 'closeTime', e.target.value)}
                    className="border rounded-md p-1"
                  />
                </>
              )}
              
              {!hours[key as keyof BusinessHours['hours']].isOpen && (
                <span className="text-gray-500 italic">Fermé</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}