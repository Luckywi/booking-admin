'use client';

import { useState } from 'react';
import type { AppointmentFormData } from '@/types/appointment';

// Types pour les erreurs de formulaire
interface FormErrors {
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  date?: string;
  time?: string;
}

export const useAppointmentForm = (initialData?: Partial<AppointmentFormData>) => {
  // État du formulaire
  const [formData, setFormData] = useState<AppointmentFormData>({
    clientName: initialData?.clientName || '',
    clientEmail: initialData?.clientEmail || '',
    clientPhone: initialData?.clientPhone || '',
    date: initialData?.date || '',
    time: initialData?.time || '',
    serviceId: initialData?.serviceId || '',
    notes: initialData?.notes || ''
  });

  // État des erreurs et soumission
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fonction de validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validation du nom
    if (!formData.clientName.trim()) {
      newErrors.clientName = 'Le nom est requis';
    } else if (formData.clientName.length < 2) {
      newErrors.clientName = 'Le nom doit contenir au moins 2 caractères';
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.clientEmail.trim()) {
      newErrors.clientEmail = 'L\'email est requis';
    } else if (!emailRegex.test(formData.clientEmail)) {
      newErrors.clientEmail = 'Email invalide';
    }

    // Validation du téléphone
    const phoneRegex = /^(\+33|0)[1-9](\d{2}){4}$/;
    if (!formData.clientPhone.trim()) {
      newErrors.clientPhone = 'Le numéro de téléphone est requis';
    } else if (!phoneRegex.test(formData.clientPhone.replace(/\s/g, ''))) {
      newErrors.clientPhone = 'Numéro de téléphone invalide';
    }

    // Validation de la date
    if (!formData.date) {
      newErrors.date = 'La date est requise';
    }

    // Validation de l'heure
    if (!formData.time) {
      newErrors.time = 'L\'heure est requise';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Fonction de mise à jour du formulaire
  const updateForm = (field: keyof AppointmentFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Effacer l'erreur du champ modifié
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  // Fonction de réinitialisation du formulaire
  const resetForm = () => {
    setFormData({
      clientName: '',
      clientEmail: '',
      clientPhone: '',
      date: '',
      time: '',
      serviceId: '',
      notes: ''
    });
    setErrors({});
    setIsSubmitting(false);
  };

  // Fonction de mise à jour multiple des champs
  const updateMultipleFields = (fields: Partial<AppointmentFormData>) => {
    setFormData(prev => ({
      ...prev,
      ...fields
    }));
  };

  return {
    formData,
    errors,
    isSubmitting,
    setIsSubmitting,
    updateForm,
    updateMultipleFields,
    validateForm,
    setFormData,
    resetForm
  };
};