import type { TreeFilterParams } from '@/shared/types/api';
import type { TreeViewConfig } from '@/shared/types/person';

/** Map FE tree view config → BE subgraph query params (perspective via focusPersonId). */
export function viewConfigToTreeFilter(
  config: Omit<TreeViewConfig, 'perspective'>,
): TreeFilterParams {
  const generationsDown = config.generationsDown;
  return {
    lineage: config.lineage,
    generationsUp: config.generationsUp,
    generationsDown,
    showSpouses: config.display.showSpouses,
    showSiblings: config.display.showSiblings,
    showChildren: generationsDown > 0,
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
    filter.generationsDown > 0 ||
    filter.showSpouses ||
    filter.showSiblings ||
    filter.showChildren
  );
}
