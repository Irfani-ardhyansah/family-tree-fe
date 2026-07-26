import { ComingSoonPage } from '@/shared/components/ComingSoonPage';

export function HouseholdPage() {
  return (
    <ComingSoonPage
      title="Household"
      subtitle="Pasangan"
      accentClassName="bg-violet-600"
      features={['Inventory rumah', 'Resep & meal planner', 'Daftar belanja']}
    />
  );
}
