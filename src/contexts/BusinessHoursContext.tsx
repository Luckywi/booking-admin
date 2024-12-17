'use client';


import { createContext, useContext, useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import type { BusinessHours } from '@/types/business';

interface BusinessHoursContextType {
  businessHours: BusinessHours['hours'] | null;
  updateBusinessHours: (hours: BusinessHours['hours']) => Promise<void>;
}

const BusinessHoursContext = createContext<BusinessHoursContextType | null>(null);

export function BusinessHoursProvider({ children, businessId }: { children: React.ReactNode; businessId: string }) {
  const [businessHours, setBusinessHours] = useState<BusinessHours['hours'] | null>(null);

  useEffect(() => {
    if (!businessId) return;

    const unsubscribe = onSnapshot(doc(db, 'businessHours', businessId), (doc) => {
      if (doc.exists()) {
        setBusinessHours(doc.data().hours);
      }
    });

    return () => unsubscribe();
  }, [businessId]);

  const updateBusinessHours = async (hours: BusinessHours['hours']) => {
    if (!businessId) return;
    await setDoc(doc(db, 'businessHours', businessId), { hours }, { merge: true });
  };

  return (
    <BusinessHoursContext.Provider value={{ businessHours, updateBusinessHours }}>
      {children}
    </BusinessHoursContext.Provider>
  );
}

export const useBusinessHours = () => {
  const context = useContext(BusinessHoursContext);
  if (!context) {
    throw new Error('useBusinessHours must be used within a BusinessHoursProvider');
  }
  return context;
};