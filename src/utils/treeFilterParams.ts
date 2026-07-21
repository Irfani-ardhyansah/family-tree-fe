import type { TreeFilterParams } from '@/types/api';
import type { TreeViewConfig } from '@/types/person';

/** Map FE tree view config → BE subgraph query params (perspective via focusPersonId). */
export function viewConfigToTreeFilter(
  config: Omit<TreeViewConfig, 'perspective'>,
): TreeFilterParams {
  return {
    lineage: config.lineage,
    generationsUp: config.generationsUp,
    showSpouses: config.display.showSpouses,
    showSiblings: config.display.showSiblings,
    showChildren: config.display.showChildren,
  };
}

/** True when any filter differs from BE defaults (triggers subgraph mode). */
export function hasActiveTreeFilter(
  config: Omit<TreeViewConfig, 'perspective'>,
): boolean {
  const filter = viewConfigToTreeFilter(config);
  return (
    filter.lineage !== 'both' ||
    filter.generationsUp !== 4 ||
    filter.showSpouses ||
    filter.showSiblings ||
    filter.showChildren
  );
}
