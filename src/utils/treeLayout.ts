import type { Edge, Node } from 'reactflow';
import type {
  FamilyData,
  Person,
  TreeLineage,
  TreePerspective,
  TreeViewConfig,
} from '@/types/person';
import { BUYUT_ANCESTOR_DEPTH } from '@/types/person';

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

const ROOT_VISUAL_TIER = 3;
const CHILD_VISUAL_TIER = 4;

type Tier = number;
type Branch = 'paternal' | 'maternal' | 'core';

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

/** Peta kedalaman leluhur dari fokus (0 = fokus, 1 = orang tua, 2 = kakek/nenek, …). */
export function buildAncestorDepthMap(
  rootId: string,
  map: Map<string, Person>,
  lineage: TreeLineage,
): Map<string, number> {
  const depths = new Map<string, number>();
  depths.set(rootId, 0);

  const walk = (id: string, currentDepth: number) => {
    const person = map.get(id);
    if (!person) return;

    if (lineage !== 'maternal' && person.fatherId && map.has(person.fatherId)) {
      const next = currentDepth + 1;
      if (!depths.has(person.fatherId) || depths.get(person.fatherId)! < next) {
        depths.set(person.fatherId, next);
        walk(person.fatherId, next);
      }
    }
    if (lineage !== 'paternal' && person.motherId && map.has(person.motherId)) {
      const next = currentDepth + 1;
      if (!depths.has(person.motherId) || depths.get(person.motherId)! < next) {
        depths.set(person.motherId, next);
        walk(person.motherId, next);
      }
    }
  };

  walk(rootId, 0);
  return depths;
}

/** Maks generasi ke atas yang tersedia di data untuk konfigurasi aktif. */
export function getMaxGenerationsUp(data: FamilyData, config: TreeViewConfig): number {
  const map = buildPersonMap(data.persons);
  const rootId = resolveFocusPersonId(data, config.perspective);
  const depths = buildAncestorDepthMap(rootId, map, config.lineage);
  const values = [...depths.values()];
  return values.length > 0 ? Math.max(...values) : 0;
}

function getPersonAncestorDepth(
  person: Person,
  ancestorDepths: Map<string, number>,
): number | undefined {
  if (ancestorDepths.has(person.id)) return ancestorDepths.get(person.id);
  for (const spouseId of person.spouseIds) {
    const spouseDepth = ancestorDepths.get(spouseId);
    if (spouseDepth !== undefined) return spouseDepth;
  }
  if (person.generationLabel === 'Anak') return undefined;
  if (person.id.startsWith('sib-') || person.generationLabel === 'Saudara') return 0;
  if (person.isSelf || person.id === 'me' || person.id === 'me-sp') return 0;
  return undefined;
}

function applyGenerationsUpFilter(
  visible: Set<string>,
  config: TreeViewConfig,
  map: Map<string, Person>,
  ancestorDepths: Map<string, number>,
): void {
  const limit = config.generationsUp;

  for (const id of [...visible]) {
    const person = map.get(id);
    if (!person) continue;

    const depth = getPersonAncestorDepth(person, ancestorDepths);
    if (depth === undefined || depth === 0) continue;

    if (depth > limit) visible.delete(id);
  }
}

/** Di buyut ke atas: hanya pasangan ayah/ibu per jalur — bukan saudara. */
function isAboveBuyutRuleDepth(
  personId: string,
  ancestorDepths: Map<string, number>,
  map: Map<string, Person>,
): boolean {
  const person = map.get(personId);
  if (!person) return false;
  const depth = getPersonAncestorDepth(person, ancestorDepths);
  return depth !== undefined && depth >= BUYUT_ANCESTOR_DEPTH;
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
    label.includes('Orang Tua Kakek/Nenek (Ayah)') ||
    label.includes('Orang Tua Buyut (Ayah)') ||
    label.includes('Moyang (Ayah)') ||
    label === 'Paman/Bibi (Ayah)' ||
    label.includes('Saudara Kakek/Nenek (Ayah)') ||
    label.includes('Saudara Orang Tua Buyut (Ayah)') ||
    label.includes('Saudara Buyut (Ayah)')
  ) {
    return 'paternal';
  }

  if (
    id === 'mother' ||
    id.startsWith('mat-') ||
    label.includes('(Ibu)') ||
    label.includes('Orang Tua Kakek/Nenek (Ibu)') ||
    label.includes('Orang Tua Buyut (Ibu)') ||
    label.includes('Moyang (Ibu)') ||
    label === 'Paman/Bibi (Ibu)' ||
    label.includes('Saudara Kakek/Nenek (Ibu)') ||
    label.includes('Saudara Orang Tua Buyut (Ibu)') ||
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

function ensureParentPairsOnBloodLine(
  bloodLine: Set<string>,
  map: Map<string, Person>,
  visible: Set<string>,
) {
  for (const id of bloodLine) {
    const person = map.get(id);
    if (!person) continue;
    if (person.fatherId && map.has(person.fatherId)) visible.add(person.fatherId);
    if (person.motherId && map.has(person.motherId)) visible.add(person.motherId);
    addSpousesOf([person.fatherId, person.motherId].filter(Boolean) as string[], map, visible);
  }
}

/** Tambahkan rantai orang tua untuk semua leluhur yang sudah terlihat (termasuk nenek via pasangan). */
function expandVisibleAncestorParents(
  visible: Set<string>,
  map: Map<string, Person>,
  ancestorDepths: Map<string, number>,
) {
  let changed = true;
  while (changed) {
    changed = false;
    for (const id of [...visible]) {
      const person = map.get(id);
      if (!person) continue;
      const depth = getPersonAncestorDepth(person, ancestorDepths);
      if (depth === undefined || depth === 0) continue;

      for (const parentId of [person.fatherId, person.motherId]) {
        if (parentId && map.has(parentId) && !visible.has(parentId)) {
          visible.add(parentId);
          changed = true;
        }
      }
      addSpousesOf([person.fatherId, person.motherId].filter(Boolean) as string[], map, visible);
    }
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
  if (!me) return data.persons;

  const spouse = me.spouseIds[0] ? map.get(me.spouseIds[0]) : undefined;
  const rootId = config.perspective === 'spouse' && spouse ? spouse.id : me.id;
  const root = map.get(rootId);
  if (!root) return [];

  const visible = new Set<string>();
  const bloodLine = collectBloodLine(rootId, map, config.lineage);
  const ancestorDepths = buildAncestorDepthMap(rootId, map, config.lineage);

  // Garis segaris naik
  for (const id of bloodLine) visible.add(id);

  // Pasangan struktural di garis segaris — selalu pasangan ayah+ibu lengkap per jalur
  addSpousesOf(bloodLine, map, visible);
  ensureParentPairsOnBloodLine(bloodLine, map, visible);
  expandVisibleAncestorParents(visible, map, ancestorDepths);

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
      if (isAboveBuyutRuleDepth(bloodId, ancestorDepths, map)) continue;
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
          if (isAboveBuyutRuleDepth(id, ancestorDepths, map)) continue;
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
  applyGenerationsUpFilter(visible, config, map, ancestorDepths);

  return data.persons.filter((p) => visible.has(p.id));
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

function getVisualTier(
  person: Person,
  map: Map<string, Person>,
  ancestorDepths: Map<string, number>,
  visiting = new Set<string>(),
): Tier {
  if (visiting.has(person.id)) return ROOT_VISUAL_TIER;
  visiting.add(person.id);

  if (person.generationLabel === 'Anak') return CHILD_VISUAL_TIER;

  const depth = getPersonAncestorDepth(person, ancestorDepths);
  if (depth !== undefined) return ROOT_VISUAL_TIER - depth;

  for (const spouseId of person.spouseIds) {
    const spouse = map.get(spouseId);
    if (spouse) {
      const spouseDepth = getPersonAncestorDepth(spouse, ancestorDepths);
      if (spouseDepth !== undefined) return ROOT_VISUAL_TIER - spouseDepth;
    }
  }

  return ROOT_VISUAL_TIER;
}

function unitWidth(unit: CoupleUnit): number {
  return unit.right ? NODE_WIDTH * 2 + COUPLE_GAP : NODE_WIDTH;
}

function buildCoupleUnits(
  persons: Person[],
  map: Map<string, Person>,
  perspective: TreeViewConfig['perspective'],
  ancestorDepths: Map<string, number>,
): CoupleUnit[] {
  const visited = new Set<string>();
  const units: CoupleUnit[] = [];

  const sorted = [...persons].sort((a, b) => {
    const tierDiff =
      getVisualTier(a, map, ancestorDepths) - getVisualTier(b, map, ancestorDepths);
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
      tier: getVisualTier(left, map, ancestorDepths),
      branch: classifyBranch(left, perspective),
      sortKey,
    });
  }

  return units;
}

function layoutRow(
  units: CoupleUnit[],
  rowY: number,
  centerX: number,
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const y = rowY;

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

function nodeCenterX(id: string, positions: Map<string, { x: number; y: number }>): number {
  const pos = positions.get(id);
  return pos ? pos.x + NODE_WIDTH / 2 : 0;
}

function coupleWidth(fatherId?: string, motherId?: string): number {
  return fatherId && motherId ? NODE_WIDTH * 2 + COUPLE_GAP : NODE_WIDTH;
}

function placeParentCoupleAboveChild(
  childId: string,
  map: Map<string, Person>,
  positions: Map<string, { x: number; y: number }>,
  parentDepth: number,
  tierToY: (tier: number) => number,
) {
  const child = map.get(childId);
  if (!child || !positions.has(childId)) return;

  const father = child.fatherId ? map.get(child.fatherId) : undefined;
  const mother = child.motherId ? map.get(child.motherId) : undefined;
  if (!father && !mother) return;

  // Only place parents that exist in the visible set (have positions or are about to get one)
  const hasFather = !!father;
  const hasMother = !!mother;

  const childCenter = nodeCenterX(childId, positions);
  const totalW =
    hasFather && hasMother
      ? NODE_WIDTH * 2 + COUPLE_GAP
      : NODE_WIDTH;
  const startX = childCenter - totalW / 2;
  const y = tierToY(ROOT_VISUAL_TIER - parentDepth);

  if (hasFather) positions.set(father!.id, { x: startX, y });
  if (hasMother) {
    positions.set(mother!.id, {
      x: hasFather ? startX + NODE_WIDTH + COUPLE_GAP : startX,
      y,
    });
  }
}

function resolveCoupleRowOverlaps(
  parentIds: string[],
  map: Map<string, Person>,
  positions: Map<string, { x: number; y: number }>,
) {
  const visited = new Set<string>();
  const units: { ids: string[]; left: number; right: number }[] = [];

  for (const id of parentIds) {
    if (visited.has(id) || !positions.has(id)) continue;
    const person = map.get(id);
    const spouseId = person?.spouseIds.find((sid) => parentIds.includes(sid) && positions.has(sid));
    visited.add(id);
    const ids = spouseId ? [id, spouseId] : [id];
    if (spouseId) visited.add(spouseId);
    const xs = ids.map((pid) => positions.get(pid)!.x);
    const left = Math.min(...xs);
    const right = Math.max(...xs) + NODE_WIDTH;
    units.push({ ids, left, right });
  }

  units.sort((a, b) => a.left - b.left);

  for (let i = 1; i < units.length; i += 1) {
    if (units[i].left < units[i - 1].right + UNIT_GAP) {
      const shift = units[i - 1].right + UNIT_GAP - units[i].left;
      for (const id of units[i].ids) {
        const pos = positions.get(id)!;
        positions.set(id, { x: pos.x + shift, y: pos.y });
      }
      units[i].left += shift;
      units[i].right += shift;
    }
  }
}

function alignParentCouplesAboveChildren(
  persons: Person[],
  map: Map<string, Person>,
  ancestorDepths: Map<string, number>,
  positions: Map<string, { x: number; y: number }>,
  tierToY: (tier: number) => number,
) {
  const allDepths = persons.map((p) => getPersonAncestorDepth(p, ancestorDepths) ?? 0);
  const maxDepth = Math.max(0, ...allDepths);

  // Process from shallowest (orang tua) to deepest (moyang) so child positions
  // are finalized before we use them to position their parents.
  for (let childDepth = 1; childDepth < maxDepth; childDepth += 1) {
    const parentDepth = childDepth + 1;

    // Collect all persons at this depth; use Set to deduplicate spouses.
    const childIds = new Set<string>();
    for (const p of persons) {
      if ((getPersonAncestorDepth(p, ancestorDepths) ?? -1) === childDepth) {
        childIds.add(p.id);
      }
    }

    // Place each person's parents directly above them.
    for (const childId of childIds) {
      placeParentCoupleAboveChild(childId, map, positions, parentDepth, tierToY);
    }

    // Collect all parent IDs placed in this pass, then resolve overlaps.
    const parentIds = new Set<string>();
    for (const childId of childIds) {
      const child = map.get(childId);
      if (!child) continue;
      if (child.fatherId && positions.has(child.fatherId)) parentIds.add(child.fatherId);
      if (child.motherId && positions.has(child.motherId)) parentIds.add(child.motherId);
    }
    resolveCoupleRowOverlaps([...parentIds], map, positions);
  }
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
    lineage?: TreeLineage;
    rootPersonId?: string;
    focusPersonId?: string;
    selectedId?: string;
    searchQuery?: string;
  } = {},
): { nodes: Node<PersonNodeData>[]; edges: Edge[] } {
  const perspective = options.perspective ?? 'self';
  const lineage = options.lineage ?? 'both';
  const rootId = options.rootPersonId ?? options.focusPersonId ?? 'me';
  const focusId = options.focusPersonId ?? rootId;
  const map = buildPersonMap(persons);
  const ancestorDepths = buildAncestorDepthMap(rootId, map, lineage);
  const units = buildCoupleUnits(persons, map, perspective, ancestorDepths);

  const ancestorUnits = units.filter((u) => u.tier < CHILD_VISUAL_TIER);
  const ancestorTiers = [...new Set(ancestorUnits.map((u) => u.tier))].sort((a, b) => a - b);
  const minAncestorTier = ancestorTiers.length > 0 ? ancestorTiers[0] : ROOT_VISUAL_TIER;
  const tierToY = (tier: number) => (tier - minAncestorTier) * ROW_HEIGHT;

  const allPositions = new Map<string, { x: number; y: number }>();
  const centerX = 500;

  for (const tier of ancestorTiers) {
    const rowPositions = layoutRow(
      units.filter((u) => u.tier === tier),
      tierToY(tier),
      centerX,
    );
    for (const [id, pos] of rowPositions) allPositions.set(id, pos);
  }

  alignParentCouplesAboveChildren(persons, map, ancestorDepths, allPositions, tierToY);

  const rootRowY = tierToY(ROOT_VISUAL_TIER);
  const childRowY = rootRowY + ROW_HEIGHT;

  const childrenByParents = new Map<string, Person[]>();
  for (const person of persons) {
    if (person.generationLabel !== 'Anak') continue;
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
        y: childRowY,
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

export function getVisibleStats(
  persons: Person[],
  rootId = 'me',
  lineage: TreeLineage = 'both',
) {
  const map = buildPersonMap(persons);
  const ancestorDepths = buildAncestorDepthMap(rootId, map, lineage);
  const tiers = new Set(persons.map((p) => getVisualTier(p, map, ancestorDepths)));
  return {
    visibleCount: persons.length,
    generations: tiers.size,
    alive: persons.filter((p) => p.status === 'alive').length,
    deceased: persons.filter((p) => p.status === 'deceased').length,
  };
}
