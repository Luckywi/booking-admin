'use client';

import { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import '@/styles/calendar-custom.css';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import AppointmentModal from '@/components/appointments/AppointmentModal';
import StaffSelector from '@/components/appointments/StaffSelector';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/components/auth/AuthProvider';
import type { Appointment } from '@/types/appointment';
import type { BusinessHours } from '@/types/business';
import type { Staff } from '@/types/staff';
import { collection, query, where, onSnapshot, doc, getDoc, getDocs } from 'firebase/firestore';
import AppointmentDetailsModal from '@/components/appointments/AppointmentDetailsModal';

const localizer = dateFnsLocalizer({
  format: (date: Date, formatStr: string) => format(date, formatStr, { locale: fr }),
  parse,
  startOfWeek,
  getDay,
  locales: {
    'fr': fr
  }
});

export default function AppointmentsPage() {
  const { userData } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<View>('week');
  const [businessHours, setBusinessHours] = useState<BusinessHours['hours'] | null>(null);
  const [staffHours, setStaffHours] = useState<BusinessHours['hours'] | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [staffMembers, setStaffMembers] = useState<Record<string, Staff>>({});
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Composant personnalisé pour l'affichage des événements
  const Event = () => null;

  useEffect(() => {
    if (!userData?.businessId) return;

    const fetchBusinessHours = async () => {
      const docRef = doc(collection(db, 'businessHours'), userData.businessId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setBusinessHours(docSnap.data().hours);
      }
    };

    fetchBusinessHours();
  }, [userData?.businessId]);

  useEffect(() => {
    if (!selectedStaffId) {
      setStaffHours(null);
      return;
    }

    const fetchStaffHours = async () => {
      const docRef = doc(collection(db, 'staffHours'), selectedStaffId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setStaffHours(docSnap.data().hours);
      }
    };

    fetchStaffHours();
  }, [selectedStaffId]);

  useEffect(() => {
    if (!userData?.businessId) return;

    const fetchStaffMembers = async () => {
      try {
        const staffQuery = query(
          collection(db, 'staff'),
          where('businessId', '==', userData.businessId)
        );

        const querySnapshot = await getDocs(staffQuery);
        const staffData: Record<string, Staff> = {};
        querySnapshot.docs.forEach(doc => {
          const data = doc.data();
          staffData[doc.id] = {
            id: doc.id,
            ...data,
            color: data.color || '#3174ad' // Couleur par défaut si non définie
          } as Staff;
        });
        setStaffMembers(staffData);
      } catch (error) {
        console.error('Erreur lors de la récupération des collaborateurs:', error);
      }
    };

    fetchStaffMembers();
  }, [userData?.businessId]);

  useEffect(() => {
    if (!userData?.businessId) return;

    let q = query(
      collection(db, 'appointments'),
      where('businessId', '==', userData.businessId)
    );

    if (selectedStaffId) {
      q = query(
        collection(db, 'appointments'),
        where('businessId', '==', userData.businessId),
        where('staffId', '==', selectedStaffId)
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const appointmentsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          businessId: data.businessId,
          staffId: data.staffId,
          title: `${format(data.start.toDate(), 'HH:mm')} - ${format(data.end.toDate(), 'HH:mm')}`,
          clientName: data.clientName,
          clientEmail: data.clientEmail,
          clientPhone: data.clientPhone,
          start: data.start.toDate(),
          end: data.end.toDate(),
          status: data.status,
          notes: data.notes || '',
          serviceId: data.serviceId || '',
          createdAt: data.createdAt?.toDate() || new Date()
        } as Appointment;
      });

      setAppointments(appointmentsData);
    });

    return () => unsubscribe();
  }, [userData?.businessId, selectedStaffId]);

  const isSlotAvailable = (start: Date): boolean => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = days[start.getDay()];
    const timeString = format(start, 'HH:mm');

    if (businessHours) {
      const businessDay = businessHours[dayName as keyof BusinessHours['hours']];
      if (!businessDay.isOpen) return false;
      const businessOpen = businessDay.openTime || '00:00';
      const businessClose = businessDay.closeTime || '23:59';
      if (timeString < businessOpen || timeString > businessClose) return false;
    }

    if (selectedStaffId && staffHours) {
      const staffDay = staffHours[dayName as keyof BusinessHours['hours']];
      if (!staffDay.isOpen) return false;
      const staffOpen = staffDay.openTime || '00:00';
      const staffClose = staffDay.closeTime || '23:59';
      if (timeString < staffOpen || timeString > staffClose) return false;
    }

    return true;
  };

  const dayPropGetter = (date: Date) => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = days[date.getDay()];

    const businessDay = businessHours?.[dayName as keyof BusinessHours['hours']];
    const staffDay = staffHours?.[dayName as keyof BusinessHours['hours']];

    if (businessHours && !businessDay?.isOpen) {
      return {
        style: {
          backgroundColor: '#f3f4f6',
          cursor: 'not-allowed'
        }
      };
    }

    if (selectedStaffId && staffHours && !staffDay?.isOpen) {
      return {
        style: {
          backgroundColor: '#f3f4f6',
          cursor: 'not-allowed'
        }
      };
    }

    return {};
  };

  const slotPropGetter = (date: Date) => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = days[date.getDay()];
    const timeString = format(date, 'HH:mm');

    if (businessHours) {
      const businessDay = businessHours[dayName as keyof BusinessHours['hours']];
      if (!businessDay.isOpen ||
        timeString < businessDay.openTime! ||
        timeString > businessDay.closeTime!) {
        return {
          style: {
            backgroundColor: '#f3f4f6',
            cursor: 'not-allowed'
          }
        };
      }
    }

    if (selectedStaffId && staffHours) {
      const staffDay = staffHours[dayName as keyof BusinessHours['hours']];
      if (!staffDay.isOpen ||
        timeString < staffDay.openTime! ||
        timeString > staffDay.closeTime!) {
        return {
          style: {
            backgroundColor: '#FEE2E2',
            cursor: 'not-allowed'
          }
        };
      }
    }

    return {};
  };

  const handleNavigate = (newDate: Date) => {
    setCurrentDate(newDate);
  };

  const handleViewChange = (newView: View) => {
    setView(newView);
  };

  const handleSelectSlot = ({ start }: { start: Date }) => {
    if (isSlotAvailable(start)) {
      setIsModalOpen(true);
    } else {
      alert('Ce créneau n\'est pas disponible (en dehors des horaires d\'ouverture)');
    }
  };

  const eventPropGetter = (event: Appointment) => {
    const staff = staffMembers[event.staffId];
    const color = staff?.color || '#3174ad';

    return {
      style: {
        backgroundColor: color,
        borderColor: color
      }
    };
  };

  const handleSelectEvent = (event: Appointment) => {
    setSelectedAppointmentId(event.id);
    setIsDetailsModalOpen(true);
  };

  if (!userData?.businessId) {
    return <div className="p-6">Accès non autorisé</div>;
  }

  return (
    <div className="p-6 h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestion des Rendez-vous</h1>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          onClick={() => setIsModalOpen(true)}
        >
          Nouveau Rendez-vous
        </button>
      </div>

      <StaffSelector
        businessId={userData.businessId}
        selectedStaffId={selectedStaffId}
        onStaffSelect={setSelectedStaffId}
      />

      <AppointmentDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        appointmentId={selectedAppointmentId}
        onDelete={() => {
          setIsDetailsModalOpen(false);
          setSelectedAppointmentId(null);
        }}
      />

      <div className="bg-white rounded-lg shadow p-6" style={{ height: 'calc(100vh - 200px)' }}>
        <Calendar
          localizer={localizer}
          events={appointments}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          date={currentDate}
          onNavigate={handleNavigate}
          view={view}
          onView={handleViewChange}
          onSelectSlot={handleSelectSlot}
          eventPropGetter={eventPropGetter}
          step={30}
          dayLayoutAlgorithm={'no-overlap'}
          onSelectEvent={handleSelectEvent}
          components={{
            event: Event
          }}
          selectable
          popup
          dayPropGetter={dayPropGetter}
          slotPropGetter={slotPropGetter}
          culture='fr'
          views={['week', 'day', 'agenda']}
          defaultView="week"
          min={new Date(0, 0, 0, 8, 0, 0)}
          max={new Date(0, 0, 0, 23, 59, 0)}
          messages={{
            next: "Suivant",
            previous: "Précédent",
            today: "Aujourd'hui",
            week: "Semaine",
            day: "Jour",
            agenda: "Agenda",
            date: "Date",
            time: "Heure",
            event: "Événement",
            noEventsInRange: "Aucun rendez-vous sur cette période",
            showMore: (total) => `+${total} autres`
          }}
        />
      </div>

      <AppointmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
        }}
      />
    </div>
  );
}
