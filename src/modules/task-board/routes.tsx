import { lazy, Suspense } from 'react';
import type { RouteObject } from 'react-router-dom';
import { taskBoardPaths } from '@/shared/routes';

// Lazy load components
const TaskBoardLayout = lazy(() => import('./layout/TaskBoardLayout').then(m => ({ default: m.TaskBoardLayout })));
const TaskListPage = lazy(() => import('./pages/TaskListPage').then(m => ({ default: m.TaskListPage })));
const TaskFormPage = lazy(() => import('./pages/TaskFormPage').then(m => ({ default: m.TaskFormPage })));
const TaskDetailPage = lazy(() => import('./pages/TaskDetailPage').then(m => ({ default: m.TaskDetailPage })));

// Loading fallback component
function TaskBoardLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-suite-bg">
      <div className="text-suite-muted">Loading Task Board...</div>
    </div>
  );
}

export const taskBoardRoutes: RouteObject[] = [
  {
    path: taskBoardPaths.home,
    element: (
      <Suspense fallback={<TaskBoardLoading />}>
        <TaskBoardLayout />
      </Suspense>
    ),
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<TaskBoardLoading />}>
            <TaskListPage />
          </Suspense>
        ),
      },
      {
        path: 'new',
        element: (
          <Suspense fallback={<TaskBoardLoading />}>
            <TaskFormPage />
          </Suspense>
        ),
      },
      {
        path: ':taskId',
        element: (
          <Suspense fallback={<TaskBoardLoading />}>
            <TaskDetailPage />
          </Suspense>
        ),
      },
      {
        path: ':taskId/edit',
        element: (
          <Suspense fallback={<TaskBoardLoading />}>
            <TaskFormPage />
          </Suspense>
        ),
      },
    ],
  },
];
