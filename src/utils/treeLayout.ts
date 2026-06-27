import type { Edge, Node } from 'reactflow';
import type {
  FamilyData,
  Person,
  TreeLineage,
  TreePerspective,
  TreeViewConfig,
} from '@/types/person';

export type PersonNodeData = {
  person: Person;
  isFocus?: boolean;
  isHighlighted?: boolean;
  isSelected?: boolean;
  isDimmed?: boolean;
};

export const NODE_WIDTH = 176;
export const NODE_HEIGHT = 96;
const COUPLE_GAP = 12;
const UNIT_GAP = 36;
const ROW_HEIGHT = 148;
const BRANCH_GAP = 120;

const HIDDEN_IDS = new Set(['pat-ggp-m', 'pat-ggp-f', 'mat-ggp-m', 'mat-ggp-f']);

type Branch = 'paternal' | 'maternal' | 'core';
type Tier = 0 | 1 | 2 | 3 | 4;

type CoupleUnit = {
  id: string;
  left: Person;
  right?: Person;
  tier: Tier;
  branch: Branch;
  sortKey: number;
};

function buildPersonMap(persons: Person[]): Map<string, Person> {
  return new Map(persons.map((person) => [person.id, person]));
}

function getSiblings(
  personId: string,
  all: Person[],
  map: Map<string, Person>,
): Person[] {
  const person = map.get(personId);
  if (!person?.fatherId && !person?.motherId) return [];
  return all.filter(
    (p) =>
      p.id !== personId &&
      p.fatherId === person.fatherId &&
      p.motherId === person.motherId,
  );
}

/** Naik garis darah langsung dari root sesuai jalur keturunan. */
function collectBloodLine(
  rootId: string,
  map: Map<string, Person>,
  lineage: TreeLineage,
): Set<string> {
  const blood = new Set<string>();
  const walk = (id: string) => {
    const person = map.get(id);
    if (!person || blood.has(id)) return;
    blood.add(id);
    if (lineage !== 'maternal' && person.fatherId) walk(person.fatherId);
    if (lineage !== 'paternal' && person.motherId) walk(person.motherId);
  };
  walk(rootId);
  return blood;
}

function getPersonLineageSide(
  person: Person,
  perspective: TreePerspective,
): 'paternal' | 'maternal' | 'core' {
  if (person.id === 'me' || person.id === 'me-sp' || person.isSelf) return 'core';
  if (person.generationLabel === 'Kamu' || person.generationLabel === 'Saudara') return 'core';
  if (person.generationLabel === 'Anak') return 'core';
  if (person.id.startsWith('sib-')) return 'core';

  const label = person.generationLabel ?? '';
  const id = person.id;

  if (perspective === 'spouse') {
    if (id === 'me') return 'core';
    if (
      id === 'sp-father' ||
      id.startsWith('sp-pat-') ||
      label.includes('Pasangan (Ayah)')
    ) {
      return 'paternal';
    }
    if (
      id === 'sp-mother' ||
      id.startsWith('sp-mat-') ||
      label.includes('Pasangan (Ibu)')
    ) {
      return 'maternal';
    }
    return 'core';
  }

  if (
    id === 'father' ||
    id.startsWith('pat-') ||
    label.includes('(Ayah)') ||
    label === 'Paman/Bibi (Ayah)' ||
    label.includes('Saudara Kakek/Nenek (Ayah)') ||
    label.includes('Saudara Buyut (Ayah)')
  ) {
    return 'paternal';
  }

  if (
    id === 'mother' ||
    id.startsWith('mat-') ||
    label.includes('(Ibu)') ||
    label === 'Paman/Bibi (Ibu)' ||
    label.includes('Saudara Kakek/Nenek (Ibu)') ||
    label.includes('Saudara Buyut (Ibu)')
  ) {
    return 'maternal';
  }

  return 'core';
}

/** Orang tua di generasi penghubung — tetap tampil meski filter satu jalur. */
function isParentBridge(id: string, lineage: TreeLineage, perspective: TreePerspective): boolean {
  if (lineage === 'both') return false;
  if (perspective === 'self') {
    if (lineage === 'paternal' && id === 'mother') return true;
    if (lineage === 'maternal' && id === 'father') return true;
  } else {
    if (lineage === 'paternal' && id === 'sp-mother') return true;
    if (lineage === 'maternal' && id === 'sp-father') return true;
  }
  return false;
}

function applyLineageFilter(
  visible: Set<string>,
  config: TreeViewConfig,
  map: Map<string, Person>,
): void {
  if (config.lineage === 'both') return;

  for (const id of [...visible]) {
    if (isParentBridge(id, config.lineage, config.perspective)) continue;

    const person = map.get(id);
    if (!person) continue;

    const side = getPersonLineageSide(person, config.perspective);
    if (side === 'core') continue;

    if (config.lineage === 'paternal' && side === 'maternal') visible.delete(id);
    if (config.lineage === 'maternal' && side === 'paternal') visible.delete(id);
  }
}

function addSpousesOf(ids: Iterable<string>, map: Map<string, Person>, set: Set<string>) {
  for (const id of ids) {
    const person = map.get(id);
    if (!person) continue;
    for (const spouseId of person.spouseIds) {
      if (map.has(spouseId)) set.add(spouseId);
    }
  }
}

function addChildrenOf(parentIds: string[], all: Person[], set: Set<string>) {
  for (const person of all) {
    if (
      (person.fatherId && parentIds.includes(person.fatherId)) ||
      (person.motherId && parentIds.includes(person.motherId))
    ) {
      set.add(person.id);
    }
  }
}

function isSpouseOnlyPerson(id: string, bloodLine: Set<string>, map: Map<string, Person>): boolean {
  if (bloodLine.has(id)) return false;
  const person = map.get(id);
  if (!person) return false;
  return person.spouseIds.some((sid) => bloodLine.has(sid));
}

/** Resolve focus person id from perspective. */
export function resolveFocusPersonId(
  data: FamilyData,
  perspective: TreeViewConfig['perspective'],
): string {
  const me = data.persons.find((p) => p.isSelf) ?? data.persons.find((p) => p.id === data.rootPersonId);
  if (!me) return data.rootPersonId;
  if (perspective === 'spouse' && me.spouseIds[0]) return me.spouseIds[0];
  return me.id;
}

/** Build visible set from perspective + display filters. */
export function filterPersons(data: FamilyData, config: TreeViewConfig): Person[] {
  const map = buildPersonMap(data.persons);
  const me = map.get('me') ?? map.get(data.rootPersonId);
  if (!me) return data.persons.filter((p) => !HIDDEN_IDS.has(p.id));

  const spouse = me.spouseIds[0] ? map.get(me.spouseIds[0]) : undefined;
  const rootId = config.perspective === 'spouse' && spouse ? spouse.id : me.id;
  const root = map.get(rootId);
  if (!root) return [];

  const visible = new Set<string>();
  const bloodLine = collectBloodLine(rootId, map, config.lineage);

  // Garis segaris naik
  for (const id of bloodLine) visible.add(id);

  // Pasangan struktural di garis segaris (buyut, kakek, orang tua)
  addSpousesOf(bloodLine, map, visible);

  // Pasangan di node root (saya ↔ istri/suami)
  addSpousesOf([rootId], map, visible);

  const mySiblings =
    config.perspective === 'self' ? getSiblings(me.id, data.persons, map) : [];

  if (config.display.showSiblings) {
    if (config.perspective === 'self') {
      for (const sib of mySiblings) {
        visible.add(sib.id);
        if (config.display.showSpouses) addSpousesOf([sib.id], map, visible);
      }
    }

    for (const bloodId of bloodLine) {
      if (bloodId === rootId) continue;
      for (const sib of getSiblings(bloodId, data.persons, map)) {
        visible.add(sib.id);
        if (config.display.showSpouses) addSpousesOf([sib.id], map, visible);
      }
    }
  }

  if (config.display.showChildren) {
    if (config.perspective === 'self') {
      const genIds = [me.id, ...mySiblings.map((s) => s.id)];
      for (const id of genIds) {
        const person = map.get(id);
        if (!person) continue;
        const parentIds = [id, ...person.spouseIds.filter((sid) => visible.has(sid))];
        addChildrenOf(parentIds, data.persons, visible);
      }

      if (config.display.showSiblings) {
        for (const id of [...visible]) {
          if (bloodLine.has(id) || id === me.id || mySiblings.some((s) => s.id === id)) {
            continue;
          }
          const person = map.get(id);
          if (!person) continue;
          const parentIds = [id, ...person.spouseIds.filter((sid) => visible.has(sid))];
          addChildrenOf(parentIds, data.persons, visible);
        }
      }
    } else {
      const parentIds = [rootId, me.id];
      addChildrenOf(parentIds, data.persons, visible);
    }
  }

  if (!config.display.showSpouses) {
    const structural = new Set<string>();
    addSpousesOf(bloodLine, map, structural);
    addSpousesOf([rootId], map, structural);
    for (const id of [...visible]) {
      if (isParentBridge(id, config.lineage, config.perspective)) continue;
      if (!structural.has(id) && isSpouseOnlyPerson(id, bloodLine, map)) {
        visible.delete(id);
      }
    }
  }

  applyLineageFilter(visible, config, map);

  return data.persons.filter((p) => visible.has(p.id) && !HIDDEN_IDS.has(p.id));
}

function classifyBranch(person: Person, perspective: TreeViewConfig['perspective']): Branch {
  if (person.id === 'me' || person.id === 'me-sp') return 'core';
  if (person.isSelf) return 'core';
  if (person.generationLabel === 'Kamu' || person.generationLabel === 'Saudara') return 'core';
  if (person.generationLabel === 'Pasangan' && (person.id === 'me-sp' || person.id === 'me')) return 'core';
  if (person.generationLabel === 'Anak') return 'core';
  if (person.id === 'father' || person.id === 'mother') return 'core';
  if (person.id === 'sp-father' || person.id === 'sp-mother') return 'core';
  if (person.id.startsWith('sib-')) return 'core';

  const label = person.generationLabel ?? '';
  const id = person.id;

  if (perspective === 'spouse') {
    if (id.startsWith('sp-pat-') || label.includes('Pasangan (Ayah)')) return 'paternal';
    if (id.startsWith('sp-mat-') || label.includes('Pasangan (Ibu)')) return 'maternal';
    if (id.startsWith('sp-')) return 'core';
  }

  if (id.startsWith('pat-') || label.includes('(Ayah)')) return 'paternal';
  if (id.startsWith('mat-') || label.includes('(Ibu)')) return 'maternal';
  return 'core';
}

function getTierFromLabels(person: Person): Tier | null {
  const label = person.generationLabel ?? '';
  if (label.includes('Buyut')) return 0;
  if (label.includes('Kakek') || label.includes('Nenek')) return 1;
  if (
    label === 'Ayah' ||
    label === 'Ibu' ||
    label.includes('Ayah Pasangan') ||
    label.includes('Ibu Pasangan') ||
    label.startsWith('Paman/Bibi') ||
    label.startsWith('Saudara Kakek/Nenek')
  ) {
    return 2;
  }
  if (label === 'Kamu' || label === 'Saudara' || label === 'Pasangan') return 3;
  if (label === 'Anak') return 4;
  return null;
}

function getTier(
  person: Person,
  map: Map<string, Person>,
  visiting = new Set<string>(),
): Tier {
  if (visiting.has(person.id)) return 3;
  visiting.add(person.id);

  const fromLabel = getTierFromLabels(person);
  if (fromLabel !== null) return fromLabel;

  for (const spouseId of person.spouseIds) {
    const spouse = map.get(spouseId);
    if (spouse) {
      const spouseTier = getTierFromLabels(spouse);
      if (spouseTier !== null) return spouseTier;
    }
  }

  if (!person.fatherId && !person.motherId) return 0;
  const parents = [person.fatherId, person.motherId]
    .map((id) => (id ? map.get(id) : undefined))
    .filter(Boolean) as Person[];
  if (parents.length === 0) return 0;
  return Math.min(4, Math.max(...parents.map((p) => getTier(p, map, visiting))) + 1) as Tier;
}

function unitWidth(unit: CoupleUnit): number {
  return unit.right ? NODE_WIDTH * 2 + COUPLE_GAP : NODE_WIDTH;
}

function buildCoupleUnits(
  persons: Person[],
  map: Map<string, Person>,
  perspective: TreeViewConfig['perspective'],
): CoupleUnit[] {
  const visited = new Set<string>();
  const units: CoupleUnit[] = [];

  const sorted = [...persons].sort((a, b) => {
    const tierDiff = getTier(a, map) - getTier(b, map);
    if (tierDiff !== 0) return tierDiff;
    return a.birthDate.localeCompare(b.birthDate);
  });

  for (const person of sorted) {
    if (visited.has(person.id)) continue;

    const spouseId = person.spouseIds.find(
      (id) => map.has(id) && !visited.has(id) && persons.some((p) => p.id === id),
    );
    const spouse = spouseId ? map.get(spouseId) : undefined;

    visited.add(person.id);
    if (spouse) visited.add(spouse.id);

    const left =
      person.gender === 'male' || (!spouse && person.gender === 'female')
        ? person
        : spouse ?? person;
    const right =
      spouse && left.id !== spouse.id
        ? left.id === person.id
          ? spouse
          : person
        : undefined;

    const sortKey = new Date(left.birthDate).getTime() / 1e10 + (left.isSelf || left.id === 'me-sp' ? 0.5 : 0);

    units.push({
      id: right ? `${left.id}__${right.id}` : left.id,
      left,
      right,
      tier: getTier(left, map),
      branch: classifyBranch(left, perspective),
      sortKey,
    });
  }

  return units;
}

function layoutRow(
  units: CoupleUnit[],
  tier: Tier,
  centerX: number,
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const y = tier * ROW_HEIGHT;

  const patUnits = units.filter((u) => u.branch === 'paternal').sort((a, b) => a.sortKey - b.sortKey);
  const coreUnits = units.filter((u) => u.branch === 'core').sort((a, b) => a.sortKey - b.sortKey);
  const matUnits = units.filter((u) => u.branch === 'maternal').sort((a, b) => a.sortKey - b.sortKey);

  if (coreUnits.length === 0) {
    const leftUnits = patUnits;
    const rightUnits = matUnits;
    const leftW = leftUnits.reduce((sum, u, i) => sum + unitWidth(u) + (i > 0 ? UNIT_GAP : 0), 0);
    const rightW = rightUnits.reduce((sum, u, i) => sum + unitWidth(u) + (i > 0 ? UNIT_GAP : 0), 0);
    const gap = leftUnits.length > 0 && rightUnits.length > 0 ? BRANCH_GAP : UNIT_GAP;
    const totalW = leftW + rightW + (leftUnits.length > 0 && rightUnits.length > 0 ? gap : 0);
    let x = centerX - totalW / 2;

    for (const unit of leftUnits) {
      placeCoupleUnit(unit, x, y, positions);
      x += unitWidth(unit) + UNIT_GAP;
    }
    if (leftUnits.length > 0 && rightUnits.length > 0) x += gap - UNIT_GAP;
    for (const unit of rightUnits) {
      placeCoupleUnit(unit, x, y, positions);
      x += unitWidth(unit) + UNIT_GAP;
    }
    return positions;
  }

  const coreWidth = coreUnits.reduce((sum, u, i) => sum + unitWidth(u) + (i > 0 ? UNIT_GAP : 0), 0);
  let coreStart = centerX - coreWidth / 2;

  for (const unit of coreUnits) {
    placeCoupleUnit(unit, coreStart, y, positions);
    coreStart += unitWidth(unit) + UNIT_GAP;
  }

  if (patUnits.length > 0) {
    const patWidth = patUnits.reduce((sum, u, i) => sum + unitWidth(u) + (i > 0 ? UNIT_GAP : 0), 0);
    const coreLeft = centerX - coreWidth / 2;
    let x = coreLeft - BRANCH_GAP - patWidth;
    for (const unit of patUnits) {
      placeCoupleUnit(unit, x, y, positions);
      x += unitWidth(unit) + UNIT_GAP;
    }
  }

  if (matUnits.length > 0) {
    const coreRight = centerX + coreWidth / 2;
    let x = coreRight + BRANCH_GAP;
    for (const unit of matUnits) {
      placeCoupleUnit(unit, x, y, positions);
      x += unitWidth(unit) + UNIT_GAP;
    }
  }

  return positions;
}

function placeCoupleUnit(
  unit: CoupleUnit,
  startX: number,
  y: number,
  positions: Map<string, { x: number; y: number }>,
) {
  if (unit.right) {
    positions.set(unit.left.id, { x: startX, y });
    positions.set(unit.right.id, { x: startX + NODE_WIDTH + COUPLE_GAP, y });
  } else {
    positions.set(unit.left.id, { x: startX, y });
  }
}

export function layoutFamilyTree(
  persons: Person[],
  options: {
    perspective?: TreeViewConfig['perspective'];
    focusPersonId?: string;
    selectedId?: string;
    searchQuery?: string;
  } = {},
): { nodes: Node<PersonNodeData>[]; edges: Edge[] } {
  const perspective = options.perspective ?? 'self';
  const focusId = options.focusPersonId ?? 'me';
  const map = buildPersonMap(persons);
  const units = buildCoupleUnits(persons, map, perspective);

  const tiers = [...new Set(units.map((u) => u.tier))].sort((a, b) => a - b) as Tier[];
  const allPositions = new Map<string, { x: number; y: number }>();
  const centerX = 500;

  for (const tier of tiers) {
    if (tier === 4) continue;
    const rowPositions = layoutRow(units.filter((u) => u.tier === tier), tier, centerX);
    for (const [id, pos] of rowPositions) allPositions.set(id, pos);
  }

  const childrenByParents = new Map<string, Person[]>();
  for (const person of persons) {
    if (getTier(person, map) !== 4) continue;
    const key = `${person.fatherId ?? ''}|${person.motherId ?? ''}`;
    const group = childrenByParents.get(key) ?? [];
    group.push(person);
    childrenByParents.set(key, group);
  }

  for (const children of childrenByParents.values()) {
    children.sort((a, b) => a.birthDate.localeCompare(b.birthDate));
    const first = children[0];
    const parentCenters = [first.fatherId, first.motherId]
      .filter(Boolean)
      .map((id) => {
        const pos = allPositions.get(id!);
        return pos ? pos.x + NODE_WIDTH / 2 : null;
      })
      .filter((v): v is number => v !== null);

    if (parentCenters.length === 0) continue;

    const parentCenterX = parentCenters.reduce((sum, x) => sum + x, 0) / parentCenters.length;
    const count = children.length;
    const groupWidth = count * NODE_WIDTH + (count - 1) * UNIT_GAP;
    const startX = parentCenterX - groupWidth / 2;

    children.forEach((child, index) => {
      allPositions.set(child.id, {
        x: startX + index * (NODE_WIDTH + UNIT_GAP),
        y: 4 * ROW_HEIGHT,
      });
    });
  }

  const searchLower = options.searchQuery?.trim().toLowerCase() ?? '';
  const matchIds = new Set<string>();
  if (searchLower) {
    for (const person of persons) {
      const haystack = [person.fullName, person.nickname, person.generationLabel]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (haystack.includes(searchLower)) matchIds.add(person.id);
    }
  }
  const hasSearch = searchLower.length > 0;

  const nodes: Node<PersonNodeData>[] = persons
    .filter((p) => allPositions.has(p.id))
    .map((person) => {
      const pos = allPositions.get(person.id)!;
      const isFocus = person.id === focusId;
      const isHighlighted = matchIds.has(person.id);
      const isSelected = options.selectedId === person.id;
      const isDimmed = hasSearch && !isHighlighted && !isFocus;

      return {
        id: person.id,
        type: 'personNode',
        position: pos,
        data: { person, isFocus, isHighlighted, isSelected, isDimmed },
        zIndex: isFocus ? 10 : isSelected ? 9 : 1,
      };
    });

  const edges: Edge[] = [];
  const edgeIds = new Set<string>();

  for (const person of persons) {
    if (!allPositions.has(person.id)) continue;

    if (person.fatherId && allPositions.has(person.fatherId)) {
      const id = `parent-f-${person.fatherId}-${person.id}`;
      if (!edgeIds.has(id)) {
        edgeIds.add(id);
        edges.push({
          id,
          source: person.fatherId,
          target: person.id,
          sourceHandle: 'bottom',
          targetHandle: 'top',
          type: 'smoothstep',
          style: { stroke: '#6AA86A', strokeWidth: 2 },
        });
      }
    }

    if (person.motherId && allPositions.has(person.motherId)) {
      const id = `parent-m-${person.motherId}-${person.id}`;
      if (!edgeIds.has(id)) {
        edgeIds.add(id);
        edges.push({
          id,
          source: person.motherId,
          target: person.id,
          sourceHandle: 'bottom',
          targetHandle: 'top',
          type: 'smoothstep',
          style: { stroke: '#A485D1', strokeWidth: 2 },
        });
      }
    }

    for (const spouseId of person.spouseIds) {
      if (person.id >= spouseId || !allPositions.has(spouseId)) continue;
      edges.push({
        id: `spouse-${person.id}-${spouseId}`,
        source: person.id,
        target: spouseId,
        sourceHandle: 'right',
        targetHandle: 'left',
        type: 'straight',
        style: { stroke: '#8a99a7', strokeWidth: 2 },
      });
    }
  }

  return { nodes, edges };
}

export function getVisibleStats(persons: Person[]) {
  const map = buildPersonMap(persons);
  const tiers = new Set(persons.map((p) => getTier(p, map)));
  return {
    visibleCount: persons.length,
    generations: tiers.size,
    alive: persons.filter((p) => p.status === 'alive').length,
    deceased: persons.filter((p) => p.status === 'deceased').length,
  };
}
