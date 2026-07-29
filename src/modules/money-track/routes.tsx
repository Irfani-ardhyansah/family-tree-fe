import type { RouteObject } from 'react-router-dom';
import { SensitiveModuleRoute } from '@/app/routes/SensitiveModuleRoute';
import { MoneyTrackLayout } from '@/modules/money-track/layout/MoneyTrackLayout';
import { BalancingPage } from '@/modules/money-track/pages/BalancingPage';
import { BudgetsPage } from '@/modules/money-track/pages/BudgetsPage';
import { CategoriesPage } from '@/modules/money-track/pages/CategoriesPage';
import { DashboardPage } from '@/modules/money-track/pages/DashboardPage';
import { DebtDetailPage } from '@/modules/money-track/pages/DebtDetailPage';
import { DebtsPage } from '@/modules/money-track/pages/DebtsPage';
import {
  NewCashPage,
  NewMovePage,
  NewTransactionPage,
  NewTransferPage,
} from '@/modules/money-track/pages/NewFlowPages';
import { PocketsPage } from '@/modules/money-track/pages/PocketsPage';
import { SetupPage } from '@/modules/money-track/pages/SetupPage';
import { TransactionsPage } from '@/modules/money-track/pages/TransactionsPage';
import { WishlistPage } from '@/modules/money-track/pages/WishlistPage';
import { moneyPaths } from '@/shared/routes';

export const moneyTrackRoutes: RouteObject[] = [
  {
    element: <SensitiveModuleRoute />,
    children: [
      {
        path: moneyPaths.home,
        element: <MoneyTrackLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'transactions', element: <TransactionsPage /> },
          { path: 'pockets', element: <PocketsPage /> },
          { path: 'categories', element: <CategoriesPage /> },
          { path: 'wishlist', element: <WishlistPage /> },
          { path: 'debts', element: <DebtsPage /> },
          { path: 'debts/:debtId', element: <DebtDetailPage /> },
          { path: 'balancing', element: <BalancingPage /> },
          { path: 'budgets', element: <BudgetsPage /> },
          { path: 'setup', element: <SetupPage /> },
          { path: 'new/transaction', element: <NewTransactionPage /> },
          { path: 'new/transfer', element: <NewTransferPage /> },
          { path: 'new/move', element: <NewMovePage /> },
          { path: 'new/cash', element: <NewCashPage /> },
        ],
      },
    ],
  },
];
