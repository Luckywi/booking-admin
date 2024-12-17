// src/types/business.ts
export interface OpeningHours {
    day: string;
    isOpen: boolean;
    openTime?: string;
    closeTime?: string;
  }
  
  export interface BusinessHours {
    id: string;
    businessId: string;
    hours: {
      monday: OpeningHours;
      tuesday: OpeningHours;
      wednesday: OpeningHours;
      thursday: OpeningHours;
      friday: OpeningHours;
      saturday: OpeningHours;
      sunday: OpeningHours;
    };
  }

  // Ajouter cette interface pour les horaires des collaborateurs
export interface StaffHours {
  id: string;
  staffId: string;
  businessId: string;
  hours: {
    monday: OpeningHours;
    tuesday: OpeningHours;
    wednesday: OpeningHours;
    thursday: OpeningHours;
    friday: OpeningHours;
    saturday: OpeningHours;
    sunday: OpeningHours;
  };
}