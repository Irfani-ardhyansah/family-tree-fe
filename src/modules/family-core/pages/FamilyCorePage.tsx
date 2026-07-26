import { ComingSoonPage } from '@/shared/components/ComingSoonPage';

export function FamilyCorePage() {
  return (
    <ComingSoonPage
      title="Family Core"
      subtitle="Keluarga inti"
      accentClassName="bg-sky-600"
      features={['Dokumen penting', 'Health tracker', 'Family calendar']}
    />
  );
}
