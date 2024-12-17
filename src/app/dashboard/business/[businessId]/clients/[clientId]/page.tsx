'use client';

import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/components/auth/AuthProvider';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Appointment } from '@/types/appointment';
import { useRouter, useParams } from 'next/navigation';

export default function ClientDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { userData } = useAuth();
  const [clientDetails, setClientDetails] = useState<{
    name: string;
    email: string;
    phone: string;
    appointments: Array<Appointment & { serviceName?: string; servicePrice?: number }>;
    totalAppointments: number;
    firstAppointment: Date;
    lastAppointment: Date;
    totalSpent: number;
    averageSpent: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const businessId = params?.businessId as string;
  const clientId = params?.clientId as string;

  useEffect(() => {
    const fetchClientDetails = async () => {
      if (!businessId || !clientId) return;

      try {
        const [email, phone] = decodeURIComponent(clientId).split('-');

        // Récupérer tous les rendez-vous du client
        const appointmentsQuery = query(
          collection(db, 'appointments'),
          where('businessId', '==', businessId),
          where('clientEmail', '==', email),
          where('clientPhone', '==', phone)
        );

        const appointmentsSnapshot = await getDocs(appointmentsQuery);
        if (appointmentsSnapshot.empty) {
          console.error('Client non trouvé');
          return;
        }

        let totalSpent = 0;
        const appointments: Array<Appointment & { serviceName?: string; servicePrice?: number }> = [];

        // Récupérer les détails des services pour chaque rendez-vous
        for (const docRef of appointmentsSnapshot.docs) {
          const appointmentData = docRef.data();
          let serviceName = '';
          let servicePrice = 0;

          if (appointmentData.serviceId) {
            const serviceDoc = await getDoc(doc(db, 'services', appointmentData.serviceId));
            if (serviceDoc.exists()) {
              const serviceData = serviceDoc.data();
              serviceName = serviceData.title;
              servicePrice = serviceData.price || 0;
              totalSpent += servicePrice;
            }
          }

          appointments.push({
            id: docRef.id,
            staffId: appointmentData.staffId,
            businessId: appointmentData.businessId,
            title: appointmentData.title,
            clientName: appointmentData.clientName,
            clientEmail: appointmentData.clientEmail,
            clientPhone: appointmentData.clientPhone,
            start: appointmentData.start.toDate(),
            end: appointmentData.end.toDate(),
            status: appointmentData.status,
            notes: appointmentData.notes,
            serviceId: appointmentData.serviceId,
            createdAt: appointmentData.createdAt?.toDate() || new Date(),
            serviceName,
            servicePrice
          });
        }

        // Trier les rendez-vous par date
        appointments.sort((a, b) => b.start.getTime() - a.start.getTime());

        setClientDetails({
          name: appointments[0].clientName,
          email,
          phone,
          appointments,
          totalAppointments: appointments.length,
          firstAppointment: appointments[appointments.length - 1].start,
          lastAppointment: appointments[0].start,
          totalSpent,
          averageSpent: totalSpent / appointments.length
        });
      } catch (error) {
        console.error('Erreur lors de la récupération des détails:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClientDetails();
  }, [businessId, clientId]);

  // Vérification de sécurité utilisant userData implicitement via businessId
  if (!businessId || businessId !== userData?.businessId) {
    return <div className="p-6">Accès non autorisé</div>;
  }

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!clientDetails) {
    return (
      <div className="p-6">
        <div className="bg-red-50 p-4 rounded-md mb-4">
          <p className="text-red-700">Client non trouvé</p>
        </div>
        <button
          onClick={() => router.push(`/dashboard/business/${businessId}/clients`)}
          className="text-blue-600 hover:text-blue-900"
        >
          Retour à la liste des clients
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <button
          onClick={() => router.push(`/dashboard/business/${businessId}/clients`)}
          className="text-blue-600 hover:text-blue-900 mb-4 flex items-center gap-2"
        >
          ← Retour à la liste des clients
        </button>
        <h1 className="text-2xl font-bold">{clientDetails.name}</h1>
      </div>

      {/* Section Informations Client */}
      <div className="bg-white rounded-lg shadow mb-6 p-6">
        <h2 className="text-lg font-semibold mb-4">Informations client</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="font-medium">{clientDetails.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Téléphone</p>
            <p className="font-medium">{clientDetails.phone}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Premier rendez-vous</p>
            <p className="font-medium">
              {format(clientDetails.firstAppointment, 'EEEE d MMMM yyyy', { locale: fr })}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Dernier rendez-vous</p>
            <p className="font-medium">
              {format(clientDetails.lastAppointment, 'EEEE d MMMM yyyy', { locale: fr })}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total des rendez-vous</p>
            <p className="font-medium">{clientDetails.totalAppointments}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Dépenses</p>
            <p className="font-medium">
              Total: {clientDetails.totalSpent}€
              <br />
              Moyenne: {clientDetails.averageSpent.toFixed(2)}€/visite
            </p>
          </div>
        </div>
      </div>

      {/* Section Historique des Rendez-vous */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Historique des rendez-vous</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Horaire
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prix
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {clientDetails.appointments.map((appointment) => (
                <tr key={appointment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {format(appointment.start, 'EEEE d MMMM yyyy', { locale: fr })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {format(appointment.start, 'HH:mm')} - {format(appointment.end, 'HH:mm')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{appointment.serviceName || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{appointment.servicePrice}€</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' : 
                        appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                        'bg-yellow-100 text-yellow-800'}`}
                    >
                      {appointment.status === 'confirmed' ? 'Confirmé' : 
                       appointment.status === 'cancelled' ? 'Annulé' : 'En attente'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{appointment.notes || '-'}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
