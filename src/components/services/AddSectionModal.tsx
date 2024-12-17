'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/lib/firebase/config';
import { addDoc, collection } from 'firebase/firestore';
import type { ServiceCategory } from '@/types/service';

interface AddSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddSectionModal({ isOpen, onClose, onSuccess }: AddSectionModalProps) {
  const { userData } = useAuth();
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData?.businessId) return;

    try {
      setIsSubmitting(true);

      // Créer la nouvelle section dans Firestore
      await addDoc(collection(db, 'serviceCategories'), {
        businessId: userData.businessId,
        title: title.trim(),
        order: 0, // Par défaut, on met 0 pour le moment
        createdAt: new Date()
      });

      onSuccess();
      setTitle('');
      onClose();
    } catch (error) {
      console.error('Erreur lors de la création de la section:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Nouvelle section de services</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Titre de la section
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Ex: Coiffure classique"
              required
            />
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
              disabled={isSubmitting}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Création...' : 'Créer la section'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}