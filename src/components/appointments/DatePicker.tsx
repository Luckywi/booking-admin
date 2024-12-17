'use client';

import { useState, useMemo } from 'react';
import { 
  format, 
  getDaysInMonth,
  startOfMonth,
  getDay,
  isSameDay,
  parseISO
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DatePickerProps {
  selectedDate: string | null;
  onDateSelect: (date: Date) => void;
  isDateAvailable: (date: Date) => boolean;
}

export default function DatePicker({ selectedDate, onDateSelect, isDateAvailable }: DatePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const calendarDays = useMemo(() => {
    // Obtenir le premier jour du mois
    const firstDayOfMonth = startOfMonth(currentMonth);
    // Obtenir le nombre total de jours dans le mois
    const daysInMonth = getDaysInMonth(currentMonth);
    
    // Créer un tableau pour tous les jours du mois
    const days: Date[] = [];
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));
    }

    return days;
  }, [currentMonth]);

  // Organiser les jours en semaines
  const calendar = useMemo(() => {
    const weeks: Date[][] = [];
    let currentWeek: Date[] = [];

    // Ajouter des espaces vides pour les jours avant le premier du mois
    const firstDay = startOfMonth(currentMonth);
    let firstDayOfWeek = getDay(firstDay);
    // Ajuster pour commencer par lundi (0 = lundi, 6 = dimanche)
    firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push(null as unknown as Date);
    }

    // Ajouter tous les jours du mois
    calendarDays.forEach((day) => {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });

    // Compléter la dernière semaine si nécessaire
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null as unknown as Date);
      }
      weeks.push(currentWeek);
    }

    return weeks;
  }, [calendarDays]);

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrevMonth}
          className="p-1 hover:bg-gray-100 rounded-full"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        
        <span className="text-lg font-semibold">
          {format(currentMonth, 'MMMM yyyy', { locale: fr })}
        </span>

        <button
          onClick={handleNextMonth}
          className="p-1 hover:bg-gray-100 rounded-full"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-2">
        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
          <div key={day} className="text-center text-sm font-medium text-gray-700">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {calendar.map((week, weekIndex) =>
          week.map((date, dayIndex) => {
            if (!date) {
              return <div key={`empty-${weekIndex}-${dayIndex}`} className="p-2" />;
            }

            const isToday = isSameDay(date, new Date());
            const isSelected = selectedDate && isSameDay(date, parseISO(selectedDate));
            const isAvailable = isDateAvailable(date);

            return (
              <button
                key={date.toISOString()}
                onClick={() => isAvailable && onDateSelect(date)}
                disabled={!isAvailable}
                className={`
                  p-2 text-center text-sm rounded-full w-8 h-8 mx-auto
                  ${isSelected ? 'bg-blue-500 text-white' : ''}
                  ${isToday && !isSelected ? 'border border-blue-500' : ''}
                  ${!isAvailable ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-gray-100'}
                `}
              >
                {format(date, 'd')}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}