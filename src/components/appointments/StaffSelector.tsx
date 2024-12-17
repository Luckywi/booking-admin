'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Staff } from '@/types/staff';

interface StaffSelectorProps {
  businessId: string;
  selectedStaffId: string | null;
  onStaffSelect: (staffId: string | null) => void;
}

export default function StaffSelector({ 
  businessId, 
  selectedStaffId, 
  onStaffSelect 
}: StaffSelectorProps) {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!businessId) return;

    const q = query(
      collection(db, 'staff'),
      where('businessId', '==', businessId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const staffData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Staff[];
      
      setStaff(staffData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [businessId]);

  if (loading) {
    return (
      <div className="mb-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Sélectionner un collaborateur
      </label>
      <select
        value={selectedStaffId || ''}
        onChange={(e) => onStaffSelect(e.target.value || null)}
        className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
      >
        <option value="">Tous les collaborateurs</option>
        {staff.map((member) => (
          <option key={member.id} value={member.id}>
            {member.firstName} {member.lastName}
          </option>
        ))}
      </select>
    </div>
  );
}