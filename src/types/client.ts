import type { Appointment } from './appointment';

export interface ClientAppointment extends Appointment {
  serviceName?: string;
  servicePrice?: number;
  totalSpent?: number;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  lastAppointment: Date;
  totalAppointments: number;
  totalSpent: number;
  appointments?: ClientAppointment[];
}

export interface ClientDetails extends Client {
  appointments: ClientAppointment[];
  firstAppointment: Date;
  averageSpent: number; // Moyenne dépensée par rendez-vous
}

export interface ClientListItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  lastAppointment: Date;
  totalAppointments: number;
  totalSpent: number;
  averageSpent: number;
}