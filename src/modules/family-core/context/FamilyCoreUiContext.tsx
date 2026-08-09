/* Context + hook are intentionally co-located. */
/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type HealthModalSection =
  | 'basics'
  | 'allergy'
  | 'medication'
  | 'appointment'
  | 'condition'
  | 'surgery'
  | 'vaccine'
  | 'note'
  | 'xray'
  | 'growth';

export type HealthModalState = {
  section: HealthModalSection;
  memberId: string;
  editId?: string;
};

export type CalendarModalState = {
  /** undefined = create new */
  eventId?: string;
  /** Prefill date when adding from day cell */
  defaultDate?: string;
  defaultMemberId?: string;
};

export type DocumentModalState = {
  documentId?: string;
  defaultMemberId?: string;
};

export type DocumentTypeModalState = {
  typeId?: string;
};

export type CalendarEventTypeModalState = {
  typeId?: string;
};

type FamilyCoreUiContextValue = {
  healthModal: HealthModalState | null;
  openHealthModal: (state: HealthModalState) => void;
  closeHealthModal: () => void;
  calendarModal: CalendarModalState | null;
  openCalendarModal: (state?: CalendarModalState) => void;
  closeCalendarModal: () => void;
  documentModal: DocumentModalState | null;
  openDocumentModal: (state?: DocumentModalState) => void;
  closeDocumentModal: () => void;
  documentTypeModal: DocumentTypeModalState | null;
  openDocumentTypeModal: (state?: DocumentTypeModalState) => void;
  closeDocumentTypeModal: () => void;
  calendarEventTypeModal: CalendarEventTypeModalState | null;
  openCalendarEventTypeModal: (state?: CalendarEventTypeModalState) => void;
  closeCalendarEventTypeModal: () => void;
};

const FamilyCoreUiContext = createContext<FamilyCoreUiContextValue | null>(
  null,
);

export function FamilyCoreUiProvider({ children }: { children: ReactNode }) {
  const [healthModal, setHealthModal] = useState<HealthModalState | null>(null);
  const [calendarModal, setCalendarModal] =
    useState<CalendarModalState | null>(null);
  const [documentModal, setDocumentModal] =
    useState<DocumentModalState | null>(null);
  const [documentTypeModal, setDocumentTypeModal] =
    useState<DocumentTypeModalState | null>(null);
  const [calendarEventTypeModal, setCalendarEventTypeModal] =
    useState<CalendarEventTypeModalState | null>(null);

  const openHealthModal = useCallback((state: HealthModalState) => {
    setHealthModal(state);
  }, []);

  const closeHealthModal = useCallback(() => setHealthModal(null), []);

  const openCalendarModal = useCallback((state: CalendarModalState = {}) => {
    setCalendarModal(state);
  }, []);

  const closeCalendarModal = useCallback(() => setCalendarModal(null), []);

  const openDocumentModal = useCallback((state: DocumentModalState = {}) => {
    setDocumentModal(state);
  }, []);

  const closeDocumentModal = useCallback(() => setDocumentModal(null), []);

  const openDocumentTypeModal = useCallback(
    (state: DocumentTypeModalState = {}) => {
      setDocumentTypeModal(state);
    },
    [],
  );

  const closeDocumentTypeModal = useCallback(
    () => setDocumentTypeModal(null),
    [],
  );

  const openCalendarEventTypeModal = useCallback(
    (state: CalendarEventTypeModalState = {}) => {
      setCalendarEventTypeModal(state);
    },
    [],
  );

  const closeCalendarEventTypeModal = useCallback(
    () => setCalendarEventTypeModal(null),
    [],
  );

  const value = useMemo(
    () => ({
      healthModal,
      openHealthModal,
      closeHealthModal,
      calendarModal,
      openCalendarModal,
      closeCalendarModal,
      documentModal,
      openDocumentModal,
      closeDocumentModal,
      documentTypeModal,
      openDocumentTypeModal,
      closeDocumentTypeModal,
      calendarEventTypeModal,
      openCalendarEventTypeModal,
      closeCalendarEventTypeModal,
    }),
    [
      healthModal,
      openHealthModal,
      closeHealthModal,
      calendarModal,
      openCalendarModal,
      closeCalendarModal,
      documentModal,
      openDocumentModal,
      closeDocumentModal,
      documentTypeModal,
      openDocumentTypeModal,
      closeDocumentTypeModal,
      calendarEventTypeModal,
      openCalendarEventTypeModal,
      closeCalendarEventTypeModal,
    ],
  );

  return (
    <FamilyCoreUiContext.Provider value={value}>
      {children}
    </FamilyCoreUiContext.Provider>
  );
}

export function useFamilyCoreUi() {
  const ctx = useContext(FamilyCoreUiContext);
  if (!ctx) {
    throw new Error('useFamilyCoreUi must be used within FamilyCoreUiProvider');
  }
  return ctx;
}
