'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, Users, Settings, BookOpen } from 'lucide-react';

export default function Sidebar() {
  const { userData } = useAuth();
  const pathname = usePathname();

  // Fonction pour vérifier si un lien est actif
  const isActiveLink = (path: string) => pathname.startsWith(path);

  // Menu pour les super admins
  const superAdminMenu = [
    {
      label: 'Gestion des Admins',
      href: '/dashboard/admins',
      icon: Users,
    },
    {
      label: 'Paramètres',
      href: '/dashboard/settings',
      icon: Settings,
    },
  ];

  // Menu pour les admins normaux
  const adminMenu = [
    {
      label: 'Rendez-vous',
      href: `/dashboard/business/${userData?.businessId}/appointments`,
      icon: Calendar,
    },
    {
      label: 'Services',
      href: `/dashboard/business/${userData?.businessId}/services`,
      icon: BookOpen,
    },
    {
      label: 'Clients',
      href: `/dashboard/business/${userData?.businessId}/clients`,
      icon: Users,
    },
    {
      label: 'Paramètres',
      href: `/dashboard/business/${userData?.businessId}/settings`,
      icon: Settings,
    },
  ];

  // Sélectionner le menu approprié selon le rôle
  const menuItems = userData?.role === 'super_admin' ? superAdminMenu : adminMenu;

  return (
    <div className="w-64 bg-white h-full border-r">
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-4">
          {userData?.role === 'super_admin' ? 'Administration' : userData?.businessName}
        </h2>
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                isActiveLink(item.href)
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}