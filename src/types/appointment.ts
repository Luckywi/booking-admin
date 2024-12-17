export interface Appointment {

    staffId: string; // ID du collaborateur
    id: string;
    businessId: string;
    title: string;
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    start: Date;
    end: Date;
    status: 'pending' | 'confirmed' | 'cancelled';
    notes?: string;
    serviceId?: string;
    createdAt: Date;
  }
  
  export interface AppointmentFormData {
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    date: string;
    time: string;
    serviceId?: string;
    notes?: string;
  }