// src/types/service.ts

// Type pour la durée
export interface Duration {
    hours: number;
    minutes: number;
  }
  
  // Type pour une catégorie/section de services
  export interface ServiceCategory {
    id: string;
    businessId: string;     // ID du commerce (récupéré depuis l'auth)
    title: string;          // Titre de la section (ex: "Coiffure classique")
    order: number;          // Pour gérer l'ordre d'affichage
    createdAt: Date;        // Date de création
  }
  
  // Type pour un service spécifique
  export interface Service {
    id: string;
    businessId: string;
    categoryId: string;
    title: string;
    description: string;
    duration: Duration;
    price: number;
    order: number;
    createdAt: Date;
    staffIds: string[];  // Ajout des IDs des collaborateurs
    allowAllStaff: boolean;  // Option pour autoriser tous les collaborateurs
  }