'use client';
import { useState } from 'react';
import { signIn } from '@/lib/firebase/auth';
import { useRouter } from 'next/navigation';
import { getUserData } from '@/lib/firebase/firestore';

export default function LoginForm() {
 const router = useRouter();
 const [email, setEmail] = useState('');
 const [password, setPassword] = useState('');
 const [error, setError] = useState('');
 const [loading, setLoading] = useState(false);

 const handleSubmit = async (e: React.FormEvent) => {
   e.preventDefault();
   setLoading(true);
   setError('');

   try {
     const result = await signIn({ email, password });
     if (result.error) {
       setError('Email ou mot de passe incorrect');
     } else if (result.user) {
       // Vérifier le rôle de l'utilisateur
       const userData = await getUserData(result.user.uid);
       
       if (userData?.role === 'super_admin') {
         router.push('/dashboard');
       } else if (userData?.role === 'admin') {
         router.push(`/dashboard/business/${userData.businessId}`);
       } else {
         setError('Accès non autorisé');
       }
     }
   } catch (err) {
     console.error('Error during login:', err);
     setError('Une erreur est survenue');
   } finally {
     setLoading(false);
   }
 };

 return (
   <div className="min-h-screen flex items-center justify-center bg-gray-50">
     <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
       <div>
         <h2 className="text-center text-3xl font-bold text-gray-900">
           Connexion
         </h2>
       </div>
       <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
         {error && (
           <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">
             {error}
           </div>
         )}
         <div className="rounded-md shadow-sm -space-y-px">
           <div>
             <input
               type="email"
               required
               value={email}
               onChange={(e) => setEmail(e.target.value)}
               className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10"
               placeholder="Adresse email"
             />
           </div>
           <div>
             <input
               type="password"
               required
               value={password}
               onChange={(e) => setPassword(e.target.value)}
               className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10"
               placeholder="Mot de passe"
             />
           </div>
         </div>

         <div>
           <button
             type="submit"
             disabled={loading}
             className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
           >
             {loading ? 'Connexion...' : 'Se connecter'}
           </button>
         </div>
       </form>
     </div>
   </div>
 );
}