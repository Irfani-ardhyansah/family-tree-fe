import { CalendarEventModal } from '@/modules/family-core/components/modals/CalendarEventModal';
import { CalendarEventTypeFormModal } from '@/modules/family-core/components/modals/CalendarEventTypeFormModal';
import { DocumentFormModal } from '@/modules/family-core/components/modals/DocumentFormModal';
import { DocumentTypeFormModal } from '@/modules/family-core/components/modals/DocumentTypeFormModal';
import { HealthFormModal } from '@/modules/family-core/components/modals/HealthFormModal';

export function CoreModalsHost() {
  return (
    <>
      <DocumentFormModal />
      <DocumentTypeFormModal />
      <HealthFormModal />
      <CalendarEventModal />
      <CalendarEventTypeFormModal />
    </>
  );
}
