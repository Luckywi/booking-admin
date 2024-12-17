'use client';
import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { createUserData } from '@/lib/firebase/firestore';
import { UserData } from '@/types/auth';

export default function CreateAdminForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Créer l'utilisateur dans Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      console.log('User created in Auth:', user); // Log pour debug

      // Créer le document utilisateur dans Firestore
      const userData: UserData = {
        uid: user.uid,
        email: user.email || '',
        role: 'admin',
        businessId: user.uid,
        businessName: businessName
      };

      console.log('Attempting to create user data:', userData); // Log pour debug

      const created = await createUserData(userData);
      
      if (created) {
        setSuccess(true);
        setEmail('');
        setPassword('');
        setBusinessName('');
      } else {
        setError('Erreur lors de la création du document utilisateur');
      }
    } catch (error: any) {
      console.error('Error in form submission:', error); // Log pour debug
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
      <div>
        <label htmlFor="businessName" className="block text-sm font-bold text-black">
          Nom de l'entreprise
        </label>
        <input
          type="text"
          id="businessName"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          className="mt-1 block w-full rounded-md border-2 border-black shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black"
          required
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-bold text-black">
          Email
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full rounded-md border-2 border-black shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black"
          required
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-bold text-black">
          Mot de passe
        </label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 block w-full rounded-md border-2 border-black shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black"
          required
          minLength={6}
        />
      </div>

      {error && (
        <div className="text-red-600 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="text-green-600 text-sm">
          Compte admin créé avec succès !
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
          loading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {loading ? 'Création...' : 'Créer le compte admin'}
      </button>
    </form>
  );
}