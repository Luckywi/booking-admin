'use client';

import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, getDocs, addDoc, getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { format, setHours, setMinutes, addDays, startOfDay, endOfDay, eachDayOfInterval } from 'date-fns';
import { useAuth } from '@/components/auth/AuthProvider';
import { useBusinessHours } from '@/contexts/BusinessHoursContext';
import { useAppointmentForm } from '@/hooks/useAppointmentForm';
import type { Staff } from '@/types/staff';
import type { Service, ServiceCategory } from '@/types/service';
import type { BusinessHours } from '@/types/business';
import DatePicker from '@/components/appointments/DatePicker'; // Assurez-vous que le chemin est correct
import { fr } from 'date-fns/locale';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AppointmentModal({ isOpen, onClose, onSuccess }: AppointmentModalProps) {
  const { userData } = useAuth();
  const { businessHours } = useBusinessHours();

  const {
    formData,
    errors,
    isSubmitting,
    setIsSubmitting,
    updateForm,
    validateForm,
    setFormData,
    resetForm
  } = useAppointmentForm();

  const [staff, setStaff] = useState<Staff[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [staffHours, setStaffHours] = useState<BusinessHours['hours'] | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());


  // Générer les dates du mois courant
  const daysInMonth = useMemo(() => {
    const start = startOfDay(currentMonth);
    const end = endOfDay(addDays(start, 30)); // 30 jours à partir de la date actuelle
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  useEffect(() => {
    const fetchStaff = async () => {
      if (!userData?.businessId || !isOpen) return;

      try {
        const staffQuery = query(
          collection(db, 'staff'),
          where('businessId', '==', userData.businessId)
        );

        const querySnapshot = await getDocs(staffQuery);
        const staffData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Staff));

        setStaff(staffData);
      } catch (error) {
        console.error('Erreur lors du chargement des collaborateurs:', error);
      }
    };

    fetchStaff();
  }, [userData?.businessId, isOpen]);

  useEffect(() => {
    const fetchServices = async () => {
      if (!userData?.businessId || !isOpen) return;

      try {
        const categoriesQuery = query(
          collection(db, 'serviceCategories'),
          where('businessId', '==', userData.businessId)
        );

        const categoriesSnapshot = await getDocs(categoriesQuery);
        const categoriesData = categoriesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ServiceCategory[];
        setCategories(categoriesData);

        const servicesQuery = query(
          collection(db, 'services'),
          where('businessId', '==', userData.businessId)
        );

        const servicesSnapshot = await getDocs(servicesQuery);
        const servicesData = servicesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Service[];
        setServices(servicesData);
      } catch (error) {
        console.error('Erreur lors du chargement des services:', error);
      }
    };

    fetchServices();
  }, [userData?.businessId, isOpen]);

  const handleStaffChange = async (staffId: string) => {
    const selected = staff.find(s => s.id === staffId) || null;
    setSelectedStaff(selected);
    setFormData(prev => ({ ...prev, date: '', time: '', serviceId: '' }));
    setAvailableSlots([]);
    setSelectedService(null);

    if (selected) {
      const staffHoursDoc = await getDoc(doc(db, 'staffHours', selected.id));
      if (staffHoursDoc.exists()) {
        setStaffHours(staffHoursDoc.data().hours);
      } else {
        setStaffHours(null);
      }
    }
  };

  const handleServiceChange = (serviceId: string) => {
    const selected = services.find(s => s.id === serviceId) || null;
    setSelectedService(selected);
    updateForm('serviceId', serviceId);
    if (formData.date) {
      generateTimeSlots(formData.date, selected);
    }
  };

  const isDateAvailable = (date: Date): boolean => {
    if (!date || !businessHours || !selectedStaff) return false;

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    // Ajuster l'index pour commencer par lundi (1 = lundi, ..., 0 = dimanche)
    const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1;
    const dayName = days[dayIndex] as keyof BusinessHours['hours'];

    const businessDay = businessHours[dayName];
    if (!businessDay?.isOpen) return false;

    if (staffHours) {
      const staffDay = staffHours[dayName];
      if (!staffDay?.isOpen) return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    if (checkDate < today) return false;

    return true;
  };

  const generateTimeSlots = async (date: string, service: Service | null) => {
    try {
      if (!selectedStaff || !service || !userData?.businessId) {
        console.log('Données manquantes:', { selectedStaff, service, businessId: userData?.businessId });
        setAvailableSlots([]);
        return;
      }

      // 1. Récupérer les horaires du business
      const businessHoursDoc = await getDoc(doc(db, 'businessHours', userData.businessId));
      if (!businessHoursDoc.exists()) {
        console.log('Horaires business non trouvés');
        setAvailableSlots([]);
        return;
      }

      // 2. Récupérer les horaires du collaborateur
      const staffHoursDoc = await getDoc(doc(db, 'staffHours', selectedStaff.id));

      // 3. Déterminer le jour de la semaine
      const selectedDate = new Date(date);
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      const dayIndex = selectedDate.getDay() === 0 ? 6 : selectedDate.getDay() - 1;
      const dayName = days[dayIndex] as keyof BusinessHours['hours'];

      // 4. Vérifier les horaires du business pour ce jour
      const businessHours = businessHoursDoc.data().hours;
      const businessDay = businessHours[dayName];

      if (!businessDay.isOpen) {
        console.log('Business fermé ce jour');
        setAvailableSlots([]);
        return;
      }

      // 5. Vérifier les horaires du collaborateur
      let staffDay;
      if (staffHoursDoc.exists()) {
        const staffHours = staffHoursDoc.data().hours;
        staffDay = staffHours[dayName];
        if (!staffDay.isOpen) {
          console.log('Collaborateur non disponible ce jour');
          setAvailableSlots([]);
          return;
        }
      } else {
        staffDay = businessDay;
      }

      // 6. Déterminer les horaires effectifs
      const openTime = staffDay.openTime > businessDay.openTime ? staffDay.openTime : businessDay.openTime;
      const closeTime = staffDay.closeTime < businessDay.closeTime ? staffDay.closeTime : businessDay.closeTime;

      // 7. Générer les créneaux de 30 minutes
      const slots: string[] = [];
      let currentTime = openTime;
      const serviceDuration = (service.duration.hours * 60) + service.duration.minutes;

      while (currentTime < closeTime) {
        const [hours, minutes] = currentTime.split(':').map(Number);
        const slotStart = new Date(date);
        slotStart.setHours(hours, minutes, 0, 0);

        if (slotStart > new Date()) {
          const slotEnd = new Date(slotStart);
          slotEnd.setMinutes(slotStart.getMinutes() + serviceDuration);

          const endTimeStr = format(slotEnd, 'HH:mm');
          if (endTimeStr <= closeTime) {
            slots.push(currentTime);
          }
        }

        const totalMinutes = (hours * 60 + minutes + 30);
        currentTime = format(
          setHours(setMinutes(new Date(), totalMinutes % 60), Math.floor(totalMinutes / 60)),
          'HH:mm'
        );
      }

      // 8. Récupérer et filtrer les rendez-vous existants
      try {
        const appointmentsQuery = query(
          collection(db, 'appointments'),
          where('staffId', '==', selectedStaff.id)
        );

        const appointmentsSnapshot = await getDocs(appointmentsQuery);
        const existingAppointments = appointmentsSnapshot.docs
          .map(doc => ({
            start: doc.data().start.toDate(),
            end: doc.data().end.toDate()
          }))
          .filter(appointment => {
            const appointmentDate = format(appointment.start, 'yyyy-MM-dd');
            return appointmentDate === date;
          });

        // 9. Filtrer les créneaux disponibles
        const availableSlots = slots.filter(slot => {
          const [slotHours, slotMinutes] = slot.split(':').map(Number);
          const slotStart = new Date(date);
          slotStart.setHours(slotHours, slotMinutes, 0, 0);

          const slotEnd = new Date(slotStart);
          slotEnd.setMinutes(slotStart.getMinutes() + serviceDuration);

          return !existingAppointments.some(appointment => {
            const slotOverlapsAppointment = (slotStart < appointment.end && slotEnd > appointment.start);
            return slotOverlapsAppointment;
          });
        });

        console.log('Créneaux disponibles:', availableSlots);
        setAvailableSlots(availableSlots);

      } catch (error) {
        console.error('Erreur lors de la génération des créneaux:', error);
        setAvailableSlots([]);
      }
    } catch (error) {
      console.error('Erreur lors de la génération des créneaux:', error);
      setAvailableSlots([]);
    }
  };

  const handleDateClick = (date: Date) => {
    if (isDateAvailable(date)) {
      const formattedDate = format(date, 'yyyy-MM-dd');
      updateForm('date', formattedDate);
      if (selectedService) {
        generateTimeSlots(formattedDate, selectedService);
      }
      setShowDatePicker(false);
    }
  };

  const resetModal = () => {
    resetForm();
    setSelectedStaff(null);
    setSelectedService(null);
    setAvailableSlots([]);
    setStaffHours(null);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !userData?.businessId || !selectedStaff || !selectedService) {
      return;
    }

    setIsSubmitting(true);

    try {
      const [hours, minutes] = formData.time.split(':').map(Number);
      const appointmentDate = new Date(formData.date);
      const start = new Date(appointmentDate.setHours(hours, minutes));

      const end = new Date(start);
      end.setMinutes(end.getMinutes() + selectedService.duration.minutes);
      end.setHours(end.getHours() + selectedService.duration.hours);

      const appointmentData = {
        businessId: userData.businessId,
        staffId: selectedStaff.id,
        serviceId: selectedService.id,
        title: formData.clientName,
        clientName: formData.clientName,
        clientEmail: formData.clientEmail,
        clientPhone: formData.clientPhone,
        start,
        end,
        notes: formData.notes || '',
        createdAt: new Date(),
        status: 'confirmed'
      };

      await addDoc(collection(db, 'appointments'), appointmentData);
      onSuccess();
      resetModal();
      onClose();
    } catch (error) {
      console.error('Erreur lors de la création du rendez-vous:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !userData?.businessId) return null;

  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">Nouveau Rendez-vous</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Informations client */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nom du client</label>
              <input
                type="text"
                required
                value={formData.clientName}
                onChange={e => updateForm('clientName', e.target.value)}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${errors.clientName ? 'border-red-500' : ''
                  }`}
              />
              {errors.clientName && (
                <p className="mt-1 text-sm text-red-500">{errors.clientName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                required
                value={formData.clientEmail}
                onChange={e => updateForm('clientEmail', e.target.value)}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${errors.clientEmail ? 'border-red-500' : ''
                  }`}
              />
              {errors.clientEmail && (
                <p className="mt-1 text-sm text-red-500">{errors.clientEmail}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Téléphone</label>
              <input
                type="tel"
                required
                value={formData.clientPhone}
                onChange={e => updateForm('clientPhone', e.target.value)}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${errors.clientPhone ? 'border-red-500' : ''
                  }`}
              />
              {errors.clientPhone && (
                <p className="mt-1 text-sm text-red-500">{errors.clientPhone}</p>
              )}
            </div>
          </div>

          {/* Sélection du collaborateur */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Collaborateur</label>
            <select
              required
              value={selectedStaff?.id || ''}
              onChange={e => handleStaffChange(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Sélectionnez un collaborateur</option>
              {staff.map(s => (
                <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
              ))}
            </select>
          </div>

          {/* Services */}
          {selectedStaff && (
            <div className="space-y-4">
              {categories.map(category => {
                const categoryServices = services.filter(service => {
                  const isInCategory = service.categoryId === category.id;
                  const isStaffAuthorized = service.allowAllStaff || service.staffIds?.includes(selectedStaff.id);
                  return isInCategory && isStaffAuthorized;
                });

                if (categoryServices.length === 0) return null;

                return (
                  <div key={category.id}>
                    <h3 className="font-medium text-lg">{category.title}</h3>
                    <div className="mt-2 grid grid-cols-1 gap-2">
                      {categoryServices.map(service => (
                        <div key={service.id} className="flex items-center">
                          <input
                            type="radio"
                            id={service.id}
                            name="service"
                            value={service.id}
                            checked={formData.serviceId === service.id}
                            onChange={e => handleServiceChange(e.target.value)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <label htmlFor={service.id} className="ml-2 block text-sm text-gray-900">
                            <span className="font-medium">{service.title}</span>
                            <span className="text-sm text-gray-500 ml-2">
                              {service.duration.hours}h{service.duration.minutes}min - {service.price}€
                            </span>
                            {service.description && (
                              <span className="block text-xs text-gray-500">{service.description}</span>
                            )}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Date et heure */}
          {selectedService && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    value={formData.date ? format(new Date(formData.date), 'dd/MM/yyyy', { locale: fr }) : ''}
                    onClick={() => setShowDatePicker(!showDatePicker)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 cursor-pointer"
                    placeholder="Sélectionnez une date"
                  />
                  {showDatePicker && (
                    <div className="absolute z-50 mt-1">
                      <DatePicker
                        selectedDate={formData.date}
                        onDateSelect={(date) => {
                          const formattedDate = format(date, 'yyyy-MM-dd');
                          updateForm('date', formattedDate);
                          if (selectedService) {
                            generateTimeSlots(formattedDate, selectedService);
                          }
                          setShowDatePicker(false);
                        }}
                        isDateAvailable={isDateAvailable}
                      />
                    </div>
                  )}
                </div>
              </div>


              {formData.date && availableSlots.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Heure</label>
                  <select
                    required
                    value={formData.time}
                    onChange={e => updateForm('time', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Sélectionnez une heure</option>
                    {availableSlots.map(slot => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Notes (optionnel)</label>
            <textarea
              value={formData.notes || ''}
              onChange={e => updateForm('notes', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              rows={3}
            />
          </div>

          {/* Boutons */}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.serviceId || !formData.date || !formData.time}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
            >
              {isSubmitting ? 'Création...' : 'Créer le rendez-vous'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
