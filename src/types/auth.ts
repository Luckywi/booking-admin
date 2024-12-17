export interface LoginFormData {
    email: string;
    password: string;
  }
  
  export interface AuthError {
    code: string;
    message: string;
  }
  
  export type UserRole = 'super_admin' | 'admin';
  
  export interface UserData {
    uid: string;
    email: string;
    role: UserRole;
    businessId?: string; // Pour les admins normaux
    businessName?: string; // Ajout du nom de l'entreprise
  }