'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import type { ServiceCategory } from '@/types/service';

interface EditSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  section: ServiceCategory | null;
}

export default function EditSectionModal({ isOpen, onClose, onSuccess, section }: EditSectionModalProps) {
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (section) {
      setTitle(section.title);
    }
  }, [section]);

  if (!isOpen || !section) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await updateDoc(doc(db, 'serviceCategories', section.id), {
        title: title.trim()
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erreur lors de la modification de la section:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette section et tous ses services ?')) return;

    try {
      setIsDeleting(true);
      await deleteDoc(doc(db, 'serviceCategories', section.id));
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erreur lors de la suppression de la section:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Modifier la section</h2>
          <button
            onClick={handleDelete}
            className="text-red-600 hover:text-red-700 text-sm"
            disabled={isDeleting || isSubmitting}
          >
            {isDeleting ? 'Suppression...' : 'Supprimer'}
          </button>
        </div>
        
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
              required
            />
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
              disabled={isSubmitting || isDeleting}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
              disabled={isSubmitting || isDeleting}
            >
              {isSubmitting ? 'Modification...' : 'Modifier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}