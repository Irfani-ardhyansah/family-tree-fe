import type { FamilyData, Person, TreePerspective, TreeLineage, TreeViewConfig } from '@/shared/types/person';
import { filterPersons, getMaxGenerationsDown, getMaxGenerationsUp } from '@/shared/utils/treeLayout';

/** Broad view config to include all related members for a perspective. */
export function buildPerspectiveViewConfig(
  perspective: TreePerspective,
  data: FamilyData,
): TreeViewConfig {
  const base: TreeViewConfig = {
    perspective,
    lineage: 'both',
    generationsUp: 4,
    generationsDown: 2,
    display: {
      showSpouses: true,
      showSiblings: true,
    },
  };
  const maxUp = getMaxGenerationsUp(data, base);
  const maxDown = getMaxGenerationsDown(data, base);
  return {
    ...base,
    generationsUp: Math.max(maxUp, 4),
    generationsDown: Math.max(maxDown, 2),
  };
}

export function getPersonsForPerspective(
  data: FamilyData,
  perspective: TreePerspective,
): Person[] {
  return getPersonsForPerspectiveLineage(data, perspective, 'both');
}

export function getPersonsForPerspectiveLineage(
  data: FamilyData,
  perspective: TreePerspective,
  lineage: TreeLineage,
): Person[] {
  const config: TreeViewConfig = {
    ...buildPerspectiveViewConfig(perspective, data),
    lineage,
  };
  return filterPersons(data, config);
}

export function getVisiblePersonIds(
  data: FamilyData,
  perspective: TreePerspective,
): Set<string> {
  return new Set(
    getPersonsForPerspective(data, perspective).map((p) => p.id),
  );
}

export function eventMatchesPerspective(
  personIds: string[],
  visibleIds: Set<string>,
): boolean {
  if (personIds.length === 0) return true;
  return personIds.some((id) => visibleIds.has(id));
}
