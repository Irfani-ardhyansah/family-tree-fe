import type { RouteObject } from 'react-router-dom';
import { ModuleShellLayout } from '@/app/layouts/ModuleShellLayout';
import { McpTokensPage } from '@/modules/mcp-tokens/pages/McpTokensPage';
import { appPaths } from '@/shared/routes';

export const mcpTokenRoutes: RouteObject[] = [
  {
    path: appPaths.mcpTokens,
    element: (
      <ModuleShellLayout moduleName="Integrasi" dataModule="roots">
        <McpTokensPage />
      </ModuleShellLayout>
    ),
  },
];
