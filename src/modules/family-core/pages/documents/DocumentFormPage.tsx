import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFamilyCoreUi } from '@/modules/family-core/context/FamilyCoreUiContext';
import { corePaths } from '@/shared/routes';

/** Deep-link helper — opens document modal then returns to list (Money Track pattern). */
export function DocumentFormPage() {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const { openDocumentModal } = useFamilyCoreUi();

  useEffect(() => {
    openDocumentModal(
      documentId ? { documentId } : undefined,
    );
    navigate(
      documentId ? corePaths.document(documentId) : corePaths.documents,
      { replace: true },
    );
  }, [documentId, navigate, openDocumentModal]);

  return (
    <div className="py-10 text-center text-sm text-brand-400">
      Membuka form…
    </div>
  );
}
