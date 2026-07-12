import type { FamilyData, Person, TreePerspective, TreeViewConfig } from '@/types/person';
import { filterPersons, getMaxGenerationsUp } from '@/utils/treeLayout';

/** Broad view config to include all related members for a perspective. */
export function buildPerspectiveViewConfig(
  perspective: TreePerspective,
  data: FamilyData,
): TreeViewConfig {
  const base: TreeViewConfig = {
    perspective,
    lineage: 'both',
    generationsUp: 4,
    display: {
      showSpouses: true,
      showSiblings: true,
      showChildren: true,
    },
  };
  const maxUp = getMaxGenerationsUp(data, base);
  return { ...base, generationsUp: Math.max(maxUp, 4) };
}

export function getPersonsForPerspective(
  data: FamilyData,
  perspective: TreePerspective,
): Person[] {
  const config = buildPerspectiveViewConfig(perspective, data);
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
