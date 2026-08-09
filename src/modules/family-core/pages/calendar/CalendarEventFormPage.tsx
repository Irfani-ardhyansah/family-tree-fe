import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFamilyCoreUi } from '@/modules/family-core/context/FamilyCoreUiContext';
import { corePaths } from '@/shared/routes';

/** Deep-link helper — opens calendar modal then returns to list. */
export function CalendarEventFormPage() {
  const navigate = useNavigate();
  const { openCalendarModal } = useFamilyCoreUi();

  useEffect(() => {
    openCalendarModal();
    navigate(corePaths.calendar, { replace: true });
  }, [navigate, openCalendarModal]);

  return (
    <div className="py-10 text-center text-sm text-brand-400">
      Membuka form…
    </div>
  );
}
