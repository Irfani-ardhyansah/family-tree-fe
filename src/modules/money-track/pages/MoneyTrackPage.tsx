import { ComingSoonPage } from '@/shared/components/ComingSoonPage';

export function MoneyTrackPage() {
  return (
    <ComingSoonPage
      title="Money Track"
      subtitle="Pasangan"
      accentClassName="bg-amber-600"
      features={['Budget planner', 'Wishlist & goals', 'Utang / piutang']}
    />
  );
}
