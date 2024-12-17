import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { deleteDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Appointment } from '@/types/appointment';

interface AppointmentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId: string | null;
  onDelete: () => void;
}

export default function AppointmentDetailsModal({
  isOpen,
  onClose,
  appointmentId,
  onDelete
}: AppointmentDetailsModalProps) {
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [serviceName, setServiceName] = useState<string>("");
  const [staffName, setStaffName] = useState<string>("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const fetchAppointmentDetails = async () => {
      if (!appointmentId) return;

      try {
        // Récupérer les détails du rendez-vous
        const appointmentDoc = await getDoc(doc(db, 'appointments', appointmentId));
        if (!appointmentDoc.exists()) return;
        
        const data = appointmentDoc.data();
        const appointmentData: Appointment = {
          id: appointmentDoc.id,
          businessId: data.businessId,
          staffId: data.staffId,
          title: data.title,
          clientName: data.clientName,
          clientEmail: data.clientEmail,
          clientPhone: data.clientPhone,
          start: data.start.toDate(),
          end: data.end.toDate(),
          status: data.status,
          notes: data.notes || '',
          serviceId: data.serviceId || '',
          createdAt: data.createdAt?.toDate() || new Date()
        };
        
        setAppointment(appointmentData);

        // Récupérer les détails du service
        if (appointmentData.serviceId) {
          const serviceDoc = await getDoc(doc(db, 'services', appointmentData.serviceId));
          if (serviceDoc.exists()) {
            setServiceName(serviceDoc.data().title);
          }
        }

        // Récupérer les détails du collaborateur
        const staffDoc = await getDoc(doc(db, 'staff', appointmentData.staffId));
        if (staffDoc.exists()) {
          const staff = staffDoc.data();
          setStaffName(`${staff.firstName} ${staff.lastName}`);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des détails:', error);
      }
    };

    if (isOpen && appointmentId) {
      fetchAppointmentDetails();
    }
  }, [appointmentId, isOpen]);

  const handleDelete = async () => {
    if (!appointment) return;
    
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'appointments', appointment.id));
      onDelete();
      onClose();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (!appointment || !isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            Détails du rendez-vous
            {appointment.status === 'cancelled' && (
              <span className="ml-2 text-sm text-red-500">Annulé</span>
            )}
          </h2>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Client</p>
              <p className="font-medium">{appointment.clientName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Collaborateur</p>
              <p className="font-medium">{staffName}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Service</p>
              <p className="font-medium">{serviceName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Statut</p>
              <p className="font-medium capitalize">
                {appointment.status === 'confirmed' ? 'Confirmé' : 
                 appointment.status === 'pending' ? 'En attente' : 'Annulé'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Date</p>
              <p className="font-medium">
                {format(appointment.start, 'EEEE d MMMM yyyy', { locale: fr })}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Horaire</p>
              <p className="font-medium">
                {format(appointment.start, 'HH:mm')} - {format(appointment.end, 'HH:mm')}
              </p>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-500">Contact</p>
            <p className="font-medium">{appointment.clientEmail}</p>
            <p className="font-medium">{appointment.clientPhone}</p>
          </div>

          {appointment.notes && (
            <div>
              <p className="text-sm text-gray-500">Notes</p>
              <p className="font-medium whitespace-pre-line">{appointment.notes}</p>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            {!showDeleteConfirm ? (
              <>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Supprimer
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Fermer
                </button>
              </>
            ) : (
              <div className="bg-red-50 p-4 rounded-md">
                <p className="text-sm text-red-800 mb-4">
                  Êtes-vous sûr de vouloir supprimer ce rendez-vous ? Cette action ne peut pas être annulée.
                </p>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    disabled={isDeleting}
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-red-300"
                    disabled={isDeleting}
                  >
                    {isDeleting ? 'Suppression...' : 'Confirmer la suppression'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}