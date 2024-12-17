'use client';

import { BusinessHoursProvider } from '@/contexts/BusinessHoursContext';
import { useParams } from 'next/navigation';

export default function BusinessLayout({ 
  children 
}: { 
  children: React.ReactNode;
}) {
  const params = useParams();
  const businessId = params?.businessId as string;

  return (
    <BusinessHoursProvider businessId={businessId}>
      {children}
    </BusinessHoursProvider>
  );
}