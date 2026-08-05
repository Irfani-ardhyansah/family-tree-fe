import { useMoneyTrackUi } from '@/modules/money-track/context/MoneyTrackUiContext';
import {
  AccountModal,
  AdjustmentModal,
  DebtModal,
  DebtPaymentModal,
  PocketModal,
  WishlistModal,
} from '@/modules/money-track/components/modals/CrudModals';
import {
  CashWithdrawalModal,
  MovePocketModal,
  TransferModal,
} from '@/modules/money-track/components/modals/MoneyFlowModals';
import { EditActivityModal } from '@/modules/money-track/components/modals/EditActivityModal';
import { EditTransactionModal } from '@/modules/money-track/components/modals/EditTransactionModal';
import { TransactionModal } from '@/modules/money-track/components/modals/TransactionModal';

export function MoneyModalsHost() {
  const { activeModal, closeModal } = useMoneyTrackUi();
  if (!activeModal) return null;

  switch (activeModal.type) {
    case 'transaction':
      return activeModal.payload?.transactionId ? (
        <EditTransactionModal
          onClose={closeModal}
          payload={activeModal.payload}
        />
      ) : (
        <TransactionModal onClose={closeModal} />
      );
    case 'activityEdit':
      return (
        <EditActivityModal onClose={closeModal} payload={activeModal.payload} />
      );
    case 'transfer':
      return <TransferModal onClose={closeModal} />;
    case 'move':
      return <MovePocketModal onClose={closeModal} />;
    case 'cash':
      return <CashWithdrawalModal onClose={closeModal} />;
    case 'account':
      return (
        <AccountModal onClose={closeModal} payload={activeModal.payload} />
      );
    case 'pocket':
      return (
        <PocketModal onClose={closeModal} payload={activeModal.payload} />
      );
    case 'wishlist':
      return <WishlistModal onClose={closeModal} />;
    case 'debt':
      return <DebtModal onClose={closeModal} />;
    case 'debtPayment':
      return (
        <DebtPaymentModal onClose={closeModal} payload={activeModal.payload} />
      );
    case 'adjustment':
      return (
        <AdjustmentModal onClose={closeModal} payload={activeModal.payload} />
      );
    default:
      return null;
  }
}
