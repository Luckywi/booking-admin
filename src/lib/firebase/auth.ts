import { 
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    User
  } from 'firebase/auth';
  import { auth } from './config';
  import { LoginFormData, AuthError } from '@/types/auth';
  
  export const signIn = async (data: LoginFormData) => {
    try {
      const { email, password } = data;
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Obtenir le token ID
      const idToken = await userCredential.user.getIdToken();
      
      // Créer le cookie de session
      await fetch('/api/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      });
  
      return { user: userCredential.user, error: null };
    } catch (error) {
      return { user: null, error: error as AuthError };
    }
  };
  
  export const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      // Supprimer le cookie de session
      await fetch('/api/auth/session', {
        method: 'DELETE',
      });
      return { error: null };
    } catch (error) {
      return { error: error as AuthError };
    }
  };