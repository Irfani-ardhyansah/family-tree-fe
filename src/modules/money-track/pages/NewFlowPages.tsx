import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { MoneyModalType } from '@/modules/money-track/components/modals/modalTypes';
import { useMoneyTrackUi } from '@/modules/money-track/context/MoneyTrackUiContext';
import { moneyPaths } from '@/shared/routes';

function OpenModalRedirect({ type }: { type: MoneyModalType }) {
  const navigate = useNavigate();
  const { openModal } = useMoneyTrackUi();

  useEffect(() => {
    openModal(type);
    navigate(moneyPaths.home, { replace: true });
  }, [navigate, openModal, type]);

  return (
    <div className="py-10 text-center text-sm text-money-faint">
      Membuka form…
    </div>
  );
}

export function NewTransactionPage() {
  return <OpenModalRedirect type="transaction" />;
}

export function NewTransferPage() {
  return <OpenModalRedirect type="transfer" />;
}

export function NewMovePage() {
  return <OpenModalRedirect type="move" />;
}

export function NewCashPage() {
  return <OpenModalRedirect type="cash" />;
}
