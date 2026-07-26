import type { Edge, Node } from 'reactflow';
import type {
  FamilyData,
  Person,
  TreeLineage,
  TreePerspective,
  TreeViewConfig,
} from '@/shared/types/person';
import { BUYUT_ANCESTOR_DEPTH } from '@/shared/types/person';

export type PersonNodeData = {
  person: Person;
  isFocus?: boolean;
  isHighlighted?: boolean;
  isSelected?: boolean;
  isDimmed?: boolean;
  isAncestorPath?: boolean;
  /** Keturunan di bawah node yang dipilih (beda gaya dari leluhur). */
  isDescendantPath?: boolean;
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

/** Naik garis darah langsung dari root, maksimum sampai kedalaman maxDepth generasi. */
function collectBloodLine(
  rootId: string,
  map: Map<string, Person>,
  lineage: TreeLineage,
  maxDepth = Infinity,
): Set<string> {
  const blood = new Set<string>();
  const walk = (id: string, depth: number) => {
    if (depth > maxDepth) return;
    const person = map.get(id);
    if (!person || blood.has(id)) return;
    blood.add(id);
    if (lineage !== 'maternal' && person.fatherId) walk(person.fatherId, depth + 1);
    if (lineage !== 'paternal' && person.motherId) walk(person.motherId, depth + 1);
  };
  walk(rootId, 0);
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

/**
 * Extends ancestorDepths with siblings/spouses, plus descendants di bawah fokus.
 * Depth positif = leluhur; 0 = fokus; negatif = anak (-1), cucu (-2), dst.
 */
export function buildFullDepthMap(
  persons: Person[],
  ancestorDepths: Map<string, number>,
): Map<string, number> {
  const full = new Map(ancestorDepths);
  const byId = new Map(persons.map((p) => [p.id, p]));

  let changed = true;
  while (changed) {
    changed = false;
    for (const person of persons) {
      if (full.has(person.id)) continue;

      // Propagate from spouse that already has a depth
      for (const spouseId of person.spouseIds) {
        if (full.has(spouseId)) {
          full.set(person.id, full.get(spouseId)!);
          changed = true;
          break;
        }
      }
      if (full.has(person.id)) continue;

      // Anak dari parent berkedalaman D → D-1 (berlaku untuk leluhur, fokus, anak, cucu, …)
      for (const parentId of [person.fatherId, person.motherId]) {
        if (!parentId || !full.has(parentId)) continue;
        full.set(person.id, full.get(parentId)! - 1);
        changed = true;
        break;
      }
      if (full.has(person.id)) continue;

      // Orangtua adalah pasangan orang yang sudah punya depth
      for (const parentId of [person.fatherId, person.motherId]) {
        if (!parentId) continue;
        const parent = byId.get(parentId);
        if (!parent) continue;
        for (const sid of parent.spouseIds) {
          if (!full.has(sid)) continue;
          full.set(person.id, full.get(sid)! - 1);
          changed = true;
          break;
        }
        if (full.has(person.id)) break;
      }
    }
  }

  return full;
}

/**
 * Kumpulkan semua ID leluhur (naik ke atas via fatherId/motherId) dari orang yang dipilih,
 * termasuk orang itu sendiri. Hanya yang ada di `visibleSet` yang dimasukkan.
 */
function collectAncestorPath(
  personId: string,
  map: Map<string, Person>,
  visibleSet: Set<string>,
): Set<string> {
  const path = new Set<string>();
  const walk = (id: string) => {
    if (path.has(id) || !visibleSet.has(id)) return;
    path.add(id);
    const person = map.get(id);
    if (!person) return;
    if (person.fatherId) walk(person.fatherId);
    if (person.motherId) walk(person.motherId);
  };
  walk(personId);
  return path;
}

/**
 * Kumpulkan keturunan di bawah orang yang dipilih (anak, cucu, …) yang terlihat.
 * Tidak termasuk orang itu sendiri.
 */
function collectDescendantPath(
  personId: string,
  persons: Person[],
  visibleSet: Set<string>,
): Set<string> {
  const childrenOf = new Map<string, string[]>();
  for (const person of persons) {
    if (!visibleSet.has(person.id)) continue;
    for (const parentId of [person.fatherId, person.motherId]) {
      if (!parentId || !visibleSet.has(parentId)) continue;
      const list = childrenOf.get(parentId) ?? [];
      list.push(person.id);
      childrenOf.set(parentId, list);
    }
  }

  const path = new Set<string>();
  const walk = (id: string) => {
    for (const childId of childrenOf.get(id) ?? []) {
      if (!visibleSet.has(childId) || path.has(childId)) continue;
      path.add(childId);
      walk(childId);
    }
  };
  walk(personId);
  return path;
}

/** Maks generasi ke atas yang tersedia di data untuk konfigurasi aktif. */
export function getMaxGenerationsUp(data: FamilyData, config: TreeViewConfig): number {
  const map = buildPersonMap(data.persons);
  const rootId = resolveFocusPersonId(data, config.perspective);
  const depths = buildAncestorDepthMap(rootId, map, config.lineage);
  const values = [...depths.values()];
  return values.length > 0 ? Math.max(...values) : 0;
}

/** Maks generasi ke bawah (keturunan) yang tersedia dari fokus. */
export function getMaxGenerationsDown(data: FamilyData, config: TreeViewConfig): number {
  const map = buildPersonMap(data.persons);
  const rootId = resolveFocusPersonId(data, config.perspective);
  const ancestorDepths = buildAncestorDepthMap(rootId, map, config.lineage);
  const fullDepths = buildFullDepthMap(data.persons, ancestorDepths);
  let minDepth = 0;
  for (const depth of fullDepths.values()) {
    if (depth < minDepth) minDepth = depth;
  }
  return -minDepth;
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

/** Hapus keturunan lebih dalam dari generationsDown (depth −1 = anak, −2 = cucu, …). */
function applyGenerationsDownFilter(
  visible: Set<string>,
  config: TreeViewConfig,
  fullDepths: Map<string, number>,
): void {
  const limit = config.generationsDown;

  for (const id of [...visible]) {
    const depth = fullDepths.get(id);
    if (depth === undefined || depth >= 0) continue;
    if (-depth > limit) visible.delete(id);
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

function getPersonLineageSideHeuristic(
  person: Person,
  perspective: TreePerspective,
): 'paternal' | 'maternal' | 'core' | null {
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
    return null;
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

  return null;
}

/** Graph-based lineage side — works with API numeric ids. */
function getGraphLineageSide(
  personId: string,
  rootId: string,
  map: Map<string, Person>,
): 'paternal' | 'maternal' | 'core' {
  if (personId === rootId) return 'core';

  const paternalBlood = collectBloodLine(rootId, map, 'paternal', Infinity);
  if (paternalBlood.has(personId)) return 'paternal';

  const maternalBlood = collectBloodLine(rootId, map, 'maternal', Infinity);
  if (maternalBlood.has(personId)) return 'maternal';

  const person = map.get(personId);
  if (person) {
    for (const spouseId of person.spouseIds) {
      if (paternalBlood.has(spouseId)) return 'paternal';
      if (maternalBlood.has(spouseId)) return 'maternal';
    }
    for (const parentId of [person.fatherId, person.motherId]) {
      if (!parentId) continue;
      if (paternalBlood.has(parentId)) return 'paternal';
      if (maternalBlood.has(parentId)) return 'maternal';
    }
  }

  return 'core';
}

function getPersonLineageSide(
  person: Person,
  perspective: TreePerspective,
  rootId: string,
  map: Map<string, Person>,
): 'paternal' | 'maternal' | 'core' {
  const heuristic = getPersonLineageSideHeuristic(person, perspective);
  if (heuristic != null) return heuristic;
  return getGraphLineageSide(person.id, rootId, map);
}

/** Orang tua penghubung di generasi fokus — tetap tampil meski filter satu jalur. */
function isParentBridge(
  id: string,
  lineage: TreeLineage,
  rootId: string,
  map: Map<string, Person>,
): boolean {
  if (lineage === 'both') return false;

  const root = map.get(rootId);
  if (!root) return false;

  if (lineage === 'paternal') return id === root.motherId;
  if (lineage === 'maternal') return id === root.fatherId;
  return false;
}

function applyLineageFilter(
  visible: Set<string>,
  config: TreeViewConfig,
  map: Map<string, Person>,
  rootId: string,
): void {
  if (config.lineage === 'both') return;

  for (const id of [...visible]) {
    if (isParentBridge(id, config.lineage, rootId, map)) continue;

    const person = map.get(id);
    if (!person) continue;

    const side = getPersonLineageSide(person, config.perspective, rootId, map);
    if (side === 'core') continue;

    if (config.lineage === 'paternal' && side === 'maternal') visible.delete(id);
    if (config.lineage === 'maternal' && side === 'paternal') visible.delete(id);
  }
}

function ensureParentPairsOnBloodLine(
  bloodLine: Set<string>,
  map: Map<string, Person>,
  visible: Set<string>,
  ancestorDepths: Map<string, number>,
  maxDepth: number,
) {
  for (const id of bloodLine) {
    const person = map.get(id);
    if (!person) continue;
    const personDepth = ancestorDepths.get(id) ?? 0;
    // Jangan tambahkan orang tua jika person sudah di batas atas generasi
    if (personDepth >= maxDepth) continue;
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
  maxDepth: number,
  lineage: TreeLineage,
  rootId: string,
) {
  let changed = true;
  while (changed) {
    changed = false;
    for (const id of [...visible]) {
      if (isParentBridge(id, lineage, rootId, map)) continue;

      const person = map.get(id);
      if (!person) continue;
      const depth = getPersonAncestorDepth(person, ancestorDepths);
      if (depth === undefined || depth === 0) continue;
      if (depth >= maxDepth) continue;

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

/**
 * Hapus orang yang punya parent di dataset tapi tidak satu pun parent-nya terlihat.
 * Melindungi blood line, pasangan struktural, dan siapa pun yang merupakan pasangan
 * dari orang yang masih terlihat (supaya in-law tanpa leluhur di pohon tidak ikut hilang).
 */
function pruneOrphansWithoutVisibleParents(
  visible: Set<string>,
  map: Map<string, Person>,
  keepIds: Set<string>,
) {
  let changed = true;
  while (changed) {
    changed = false;
    for (const id of [...visible]) {
      if (keepIds.has(id)) continue;
      const person = map.get(id);
      if (!person) continue;

      // Pasangan orang yang terlihat: tetap tampil meski orang tua mereka tidak di pohon
      if (person.spouseIds.some((sid) => visible.has(sid))) continue;

      const knownParents = [person.fatherId, person.motherId].filter(
        (pid): pid is string => !!pid && map.has(pid),
      );
      if (knownParents.length === 0) continue;

      if (!knownParents.some((pid) => visible.has(pid))) {
        visible.delete(id);
        changed = true;
      }
    }
  }
}

/**
 * Hapus node yang tidak terhubung ke root via edge terlihat (ortu/anak/pasangan).
 * Menangkap in-law tanpa parent (fatherId/motherId kosong) yang tersisa setelah
 * saudara leluhurnya di-prune — muncul sebagai pulau tanpa sangkut-paut ke roots.
 */
function pruneDisconnectedFromRoot(
  rootId: string,
  visible: Set<string>,
  map: Map<string, Person>,
) {
  if (!visible.has(rootId)) return;

  const childrenOf = new Map<string, string[]>();
  for (const id of visible) {
    const person = map.get(id);
    if (!person) continue;
    for (const parentId of [person.fatherId, person.motherId]) {
      if (!parentId || !visible.has(parentId)) continue;
      const list = childrenOf.get(parentId) ?? [];
      list.push(id);
      childrenOf.set(parentId, list);
    }
  }

  const reachable = new Set<string>([rootId]);
  const queue = [rootId];
  while (queue.length > 0) {
    const id = queue.shift()!;
    const person = map.get(id);
    if (!person) continue;

    const neighbors: string[] = [];
    if (person.fatherId && visible.has(person.fatherId)) neighbors.push(person.fatherId);
    if (person.motherId && visible.has(person.motherId)) neighbors.push(person.motherId);
    for (const spouseId of person.spouseIds) {
      if (visible.has(spouseId)) neighbors.push(spouseId);
    }
    for (const childId of childrenOf.get(id) ?? []) neighbors.push(childId);

    for (const neighborId of neighbors) {
      if (!reachable.has(neighborId)) {
        reachable.add(neighborId);
        queue.push(neighborId);
      }
    }
  }

  for (const id of [...visible]) {
    if (!reachable.has(id)) visible.delete(id);
  }
}

function isSpouseOnlyPerson(id: string, bloodLine: Set<string>, map: Map<string, Person>): boolean {
  if (bloodLine.has(id)) return false;
  const person = map.get(id);
  if (!person) return false;
  return person.spouseIds.some((sid) => bloodLine.has(sid));
}

/** Resolve logged-in person from family data (works with mock & API ids). */
export function resolveMePerson(data: FamilyData): Person | undefined {
  return (
    data.persons.find((p) => p.isSelf) ??
    data.persons.find((p) => p.id === data.rootPersonId)
  );
}

/** Resolve focus person id from perspective. */
export function resolveFocusPersonId(
  data: FamilyData,
  perspective: TreeViewConfig['perspective'],
): string {
  const me = resolveMePerson(data);
  if (!me) return data.rootPersonId;
  if (perspective === 'spouse' && me.spouseIds[0]) return me.spouseIds[0];
  return me.id;
}

/** Build visible set from perspective + display filters. */
export function filterPersons(data: FamilyData, config: TreeViewConfig): Person[] {
  const map = buildPersonMap(data.persons);
  const me = resolveMePerson(data);
  if (!me) return data.persons;

  const spouse = me.spouseIds[0] ? map.get(me.spouseIds[0]) : undefined;
  const rootId = config.perspective === 'spouse' && spouse ? spouse.id : me.id;
  const root = map.get(rootId);
  if (!root) return [];

  const visible = new Set<string>();
  const generationsUp = config.generationsUp;
  // bloodLine dibatasi sesuai generationsUp agar leluhur di luar batas tidak masuk
  const bloodLine = collectBloodLine(rootId, map, config.lineage, generationsUp);
  const ancestorDepths = buildAncestorDepthMap(rootId, map, config.lineage);

  // Garis segaris naik
  for (const id of bloodLine) visible.add(id);

  // Pasangan struktural di garis segaris — selalu pasangan ayah+ibu lengkap per jalur
  addSpousesOf(bloodLine, map, visible);
  ensureParentPairsOnBloodLine(bloodLine, map, visible, ancestorDepths, generationsUp);
  expandVisibleAncestorParents(
    visible,
    map,
    ancestorDepths,
    generationsUp,
    config.lineage,
    rootId,
  );

  // Pasangan di node root (saya ↔ istri/suami)
  addSpousesOf([rootId], map, visible);

  const mySiblings =
    config.perspective === 'self' ? getSiblings(me.id, data.persons, map) : [];

  if (config.display.showSiblings) {
    // Pasangan saudara fokus (generasi sendiri) — boleh.
    // Pasangan saudara leluhur (mis. suami saudara kakek) tidak ikut:
    // mereka tidak punya jalur darah ke roots dan sering jadi pulau terputus.
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
      }
    }
  }

  if (config.generationsDown > 0) {
    const beforeDescendants = new Set(visible);

    let frontier: string[] =
      config.perspective === 'self'
        ? config.display.showSiblings
          ? [me.id, ...mySiblings.map((s) => s.id)]
          : [me.id]
        : [rootId, me.id];

    for (let gen = 1; gen <= config.generationsDown; gen += 1) {
      const parentIds: string[] = [];
      for (const id of frontier) {
        const person = map.get(id);
        if (!person) continue;
        parentIds.push(id, ...person.spouseIds.filter((sid) => visible.has(sid)));
      }
      const before = new Set(visible);
      addChildrenOf(parentIds, data.persons, visible);
      frontier = [...visible].filter((id) => !before.has(id));
      if (frontier.length === 0) break;
    }

    // Sepupu: anak saudara leluhur (bukan keturunan fokus) — jika saudara aktif
    if (config.display.showSiblings && config.perspective === 'self') {
      const focusGenIds = new Set([me.id, ...mySiblings.map((s) => s.id)]);
      for (const id of [...visible]) {
        if (bloodLine.has(id) || focusGenIds.has(id)) continue;
        if (isAboveBuyutRuleDepth(id, ancestorDepths, map)) continue;
        const person = map.get(id);
        if (!person) continue;
        // Skip orang yang sudah keturunan fokus — anak mereka diatur generationsDown
        const parentIsFocusGen =
          (person.fatherId != null && focusGenIds.has(person.fatherId)) ||
          (person.motherId != null && focusGenIds.has(person.motherId));
        if (parentIsFocusGen) continue;
        const parentIds = [id, ...person.spouseIds.filter((sid) => visible.has(sid))];
        addChildrenOf(parentIds, data.persons, visible);
      }
    }

    if (config.display.showSpouses) {
      for (const id of [...visible]) {
        if (beforeDescendants.has(id)) continue;
        addSpousesOf([id], map, visible);
      }
    }
  }

  if (!config.display.showSpouses) {
    const structural = new Set<string>();
    addSpousesOf(bloodLine, map, structural);
    addSpousesOf([rootId], map, structural);
    for (const id of [...visible]) {
      if (isParentBridge(id, config.lineage, rootId, map)) continue;
      if (!structural.has(id) && isSpouseOnlyPerson(id, bloodLine, map)) {
        visible.delete(id);
      }
    }
  }

  applyLineageFilter(visible, config, map, rootId);
  // Use fullDepths so siblings at ancestor levels are also filtered by generationsUp
  const fullDepths = buildFullDepthMap([...data.persons], ancestorDepths);
  applyGenerationsUpFilter(visible, config, map, fullDepths);
  applyGenerationsDownFilter(visible, config, fullDepths);

  const keepIds = new Set(bloodLine);
  keepIds.add(rootId);
  addSpousesOf(bloodLine, map, keepIds);
  addSpousesOf([rootId], map, keepIds);
  pruneOrphansWithoutVisibleParents(visible, map, keepIds);
  pruneDisconnectedFromRoot(rootId, visible, map);

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

  // Depth aktual (termasuk negatif untuk anak/cucu) menentukan baris
  const depth = getPersonAncestorDepth(person, ancestorDepths);
  if (depth !== undefined) return ROOT_VISUAL_TIER - depth;

  // Fallback struktural bila depth belum terisi
  if (isDescendingFromFocusGeneration(person, map, ancestorDepths)) {
    return CHILD_VISUAL_TIER;
  }
  if (person.generationLabel === 'Anak') return CHILD_VISUAL_TIER;

  for (const spouseId of person.spouseIds) {
    const spouse = map.get(spouseId);
    if (spouse) {
      const spouseDepth = getPersonAncestorDepth(spouse, ancestorDepths);
      if (spouseDepth !== undefined) return ROOT_VISUAL_TIER - spouseDepth;
    }
  }

  return ROOT_VISUAL_TIER;
}

/** True jika orang ini keturunan generasi fokus (anak depth -1, cucu -2, …). */
function isDescendingFromFocusGeneration(
  person: Person,
  map: Map<string, Person>,
  depths: Map<string, number>,
): boolean {
  const own = depths.get(person.id);
  if (own !== undefined && own < 0) return true;

  for (const parentId of [person.fatherId, person.motherId]) {
    if (!parentId || !map.has(parentId)) continue;
    const pd = depths.get(parentId);
    if (pd !== undefined && pd <= 0) return true;
    const parent = map.get(parentId)!;
    if (parent.spouseIds.some((sid) => {
      const sd = depths.get(sid);
      return sd !== undefined && sd <= 0;
    })) {
      return true;
    }
  }
  return false;
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

/** Determine which side siblings should be placed relative to their ancestor (in the couple). */
function siblingSide(
  ancestorId: string,
  positions: Map<string, { x: number; y: number }>,
  person: Person,
): 'left' | 'right' {
  const pos = positions.get(ancestorId);
  if (!pos) return 'left';
  for (const spouseId of person.spouseIds) {
    const spousePos = positions.get(spouseId);
    if (!spousePos) continue;
    return spousePos.x < pos.x ? 'right' : 'left';
  }
  // No visible spouse — use id prefix as fallback
  if (ancestorId.startsWith('mat-') || ancestorId === 'mother' || ancestorId === 'sp-mother') return 'right';
  return 'left';
}

function alignParentCouplesAboveChildren(
  persons: Person[],
  map: Map<string, Person>,
  ancestorDepths: Map<string, number>,
  fullDepths: Map<string, number>,
  positions: Map<string, { x: number; y: number }>,
  tierToY: (tier: number) => number,
) {
  const personSet = new Set(persons.map((p) => p.id));
  const maxDepth = Math.max(0, ...[...fullDepths.values()].filter((v) => isFinite(v)));

  for (let childDepth = 1; childDepth < maxDepth; childDepth += 1) {
    const parentDepth = childDepth + 1;
    const parentY = tierToY(ROOT_VISUAL_TIER - parentDepth);

    // --- Sub-pass A: group depth-childDepth children by parent pair, place parents above center ---
    const groups = new Map<string, string[]>(); // "fatherId_motherId" → childIds

    for (const p of persons) {
      if ((fullDepths.get(p.id) ?? -1) !== childDepth) continue;
      if (!positions.has(p.id)) continue;
      const child = map.get(p.id);
      if (!child) continue;
      const fId = child.fatherId && personSet.has(child.fatherId) ? child.fatherId : '';
      const mId = child.motherId && personSet.has(child.motherId) ? child.motherId : '';
      if (!fId && !mId) continue;
      const key = `${fId}|${mId}`;
      const arr = groups.get(key) ?? [];
      arr.push(p.id);
      groups.set(key, arr);
    }

    const parentIdsPlaced = new Set<string>();

    for (const [key, childIds] of groups) {
      const xs: number[] = [];
      for (const id of childIds) {
        const pos = positions.get(id);
        if (pos) { xs.push(pos.x); xs.push(pos.x + NODE_WIDTH); }
      }
      if (xs.length === 0) continue;

      const groupCenter = (Math.min(...xs) + Math.max(...xs)) / 2;
      const [fId, mId] = key.split('|');
      const hasFather = !!fId && personSet.has(fId);
      const hasMother = !!mId && personSet.has(mId);
      const totalW = hasFather && hasMother ? NODE_WIDTH * 2 + COUPLE_GAP : NODE_WIDTH;
      const startX = groupCenter - totalW / 2;

      if (hasFather) { positions.set(fId, { x: startX, y: parentY }); parentIdsPlaced.add(fId); }
      if (hasMother) {
        positions.set(mId, { x: hasFather ? startX + NODE_WIDTH + COUPLE_GAP : startX, y: parentY });
        parentIdsPlaced.add(mId);
      }
    }

    resolveCoupleRowOverlaps([...parentIdsPlaced], map, positions);

    // --- Sub-pass B: move siblings of newly-placed depth-parentDepth ancestors adjacent to them ---
    // This ensures they're in the right X position before the next depth pass uses their locations.
    const childY = tierToY(ROOT_VISUAL_TIER - parentDepth);
    const processedSiblings = new Set<string>();

    const directAtParentDepth = persons.filter(
      (p) => (ancestorDepths.get(p.id) ?? -1) === parentDepth && positions.has(p.id),
    );

    for (const ancestor of directAtParentDepth) {
      const ancestorPerson = map.get(ancestor.id);
      if (!ancestorPerson) continue;
      const ancPos = positions.get(ancestor.id)!;

      // Couple right edge (ancestor + visible spouse)
      const spouseId = ancestor.spouseIds.find((sid) => personSet.has(sid) && positions.has(sid));
      const coupleLeft = ancPos.x;
      const coupleRight = spouseId
        ? positions.get(spouseId)!.x + NODE_WIDTH
        : ancPos.x + NODE_WIDTH;

      const side = siblingSide(ancestor.id, positions, ancestorPerson);

      // Find siblings: same fatherId+motherId, not a direct ancestor, same depth
      const sibs = persons.filter((p) => {
        if (processedSiblings.has(p.id)) return false;
        if (ancestorDepths.has(p.id)) return false;
        if ((fullDepths.get(p.id) ?? -1) !== parentDepth) return false;
        const pp = map.get(p.id);
        return pp?.fatherId === ancestorPerson.fatherId && pp?.motherId === ancestorPerson.motherId;
      });

      if (side === 'left') {
        // Oldest sibling furthest left, youngest closest to ancestor
        sibs.sort((a, b) => b.birthDate.localeCompare(a.birthDate));
        let curX = coupleLeft;
        for (const sib of sibs) {
          const sp = sib.spouseIds.find((sid) => personSet.has(sid));
          const hasSpouse = !!sp;
          const unitW = hasSpouse ? NODE_WIDTH * 2 + COUPLE_GAP : NODE_WIDTH;
          curX -= UNIT_GAP + unitW;
          positions.set(sib.id, { x: curX, y: childY });
          if (hasSpouse && sp) positions.set(sp, { x: curX + NODE_WIDTH + COUPLE_GAP, y: childY });
          processedSiblings.add(sib.id);
          if (hasSpouse && sp) processedSiblings.add(sp);
        }
      } else {
        // Oldest sibling closest to ancestor, youngest furthest right
        sibs.sort((a, b) => a.birthDate.localeCompare(b.birthDate));
        let curX = coupleRight;
        for (const sib of sibs) {
          const sp = sib.spouseIds.find((sid) => personSet.has(sid));
          const hasSpouse = !!sp;
          curX += UNIT_GAP;
          positions.set(sib.id, { x: curX, y: childY });
          if (hasSpouse && sp) positions.set(sp, { x: curX + NODE_WIDTH + COUPLE_GAP, y: childY });
          processedSiblings.add(sib.id);
          if (hasSpouse && sp) processedSiblings.add(sp);
          curX += hasSpouse ? NODE_WIDTH * 2 + COUPLE_GAP : NODE_WIDTH;
        }
      }
    }
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

/**
 * Tempatkan anak (−1), cucu (−2), dst. di bawah ortunya — dari generasi terdekat ke bawah.
 * Pasangan di depth yang sama ditaruh di samping.
 */
function placeDescendantGenerations(
  persons: Person[],
  map: Map<string, Person>,
  fullDepths: Map<string, number>,
  positions: Map<string, { x: number; y: number }>,
) {
  const personSet = new Set(persons.map((p) => p.id));
  const descendantDepths = [...fullDepths.values()].filter((d) => d < 0);
  if (descendantDepths.length === 0) {
    // Fallback: label Anak tanpa depth terisi
    for (const person of persons) {
      if (person.generationLabel !== 'Anak') continue;
      if (positions.has(person.id)) continue;
      if (person.spouseIds.some((sid) => fullDepths.get(sid) === 0)) continue;
      const parentPositions = [person.fatherId, person.motherId]
        .filter(Boolean)
        .map((id) => positions.get(id!))
        .filter((pos): pos is { x: number; y: number } => !!pos);
      if (parentPositions.length === 0) continue;
      const parentCenterX =
        parentPositions.reduce((sum, pos) => sum + pos.x + NODE_WIDTH / 2, 0) /
        parentPositions.length;
      const parentY = Math.max(...parentPositions.map((pos) => pos.y));
      positions.set(person.id, {
        x: parentCenterX - NODE_WIDTH / 2,
        y: parentY + ROW_HEIGHT,
      });
    }
    return;
  }

  const minDepth = Math.min(...descendantDepths);

  for (let depth = -1; depth >= minDepth; depth -= 1) {
    const atDepth = persons.filter((p) => fullDepths.get(p.id) === depth);
    if (atDepth.length === 0) continue;

    const groups = new Map<string, Person[]>();
    const placed = new Set<string>();

    for (const person of atDepth) {
      if (placed.has(person.id)) continue;
      // Pasangan fokus (depth 0) jangan dipindah ke baris anak
      if (person.spouseIds.some((sid) => fullDepths.get(sid) === 0)) continue;

      const key = `${person.fatherId ?? ''}|${person.motherId ?? ''}`;
      // Orang yang hanya "nempel" sebagai pasangan (tanpa parent di set / parent beda depth)
      // akan ditempatkan di samping spouse setelah group darah dipasang.
      const hasVisibleParent =
        (person.fatherId && personSet.has(person.fatherId) && positions.has(person.fatherId)) ||
        (person.motherId && personSet.has(person.motherId) && positions.has(person.motherId));

      if (!hasVisibleParent) continue;

      const group = groups.get(key) ?? [];
      group.push(person);
      groups.set(key, group);
    }

    for (const children of groups.values()) {
      children.sort((a, b) => a.birthDate.localeCompare(b.birthDate));
      const first = children[0];
      const parentPositions = [first.fatherId, first.motherId]
        .filter(Boolean)
        .map((id) => positions.get(id!))
        .filter((pos): pos is { x: number; y: number } => !!pos);
      if (parentPositions.length === 0) continue;

      const parentCenterX =
        parentPositions.reduce((sum, pos) => sum + pos.x + NODE_WIDTH / 2, 0) /
        parentPositions.length;
      const parentY = Math.max(...parentPositions.map((pos) => pos.y));
      const rowY = parentY + ROW_HEIGHT;

      // Hitung lebar: tiap anak + pasangan di depth yang sama (jika ada)
      const units: { blood: Person; spouse?: Person }[] = children.map((child) => {
        const spouseId = child.spouseIds.find(
          (sid) =>
            personSet.has(sid) &&
            fullDepths.get(sid) === depth &&
            !children.some((c) => c.id === sid),
        );
        return { blood: child, spouse: spouseId ? map.get(spouseId) : undefined };
      });

      const totalWidth = units.reduce((sum, u, i) => {
        const w = u.spouse ? NODE_WIDTH * 2 + COUPLE_GAP : NODE_WIDTH;
        return sum + w + (i > 0 ? UNIT_GAP : 0);
      }, 0);
      let x = parentCenterX - totalWidth / 2;

      for (const unit of units) {
        positions.set(unit.blood.id, { x, y: rowY });
        placed.add(unit.blood.id);
        if (unit.spouse) {
          positions.set(unit.spouse.id, {
            x: x + NODE_WIDTH + COUPLE_GAP,
            y: rowY,
          });
          placed.add(unit.spouse.id);
          x += NODE_WIDTH * 2 + COUPLE_GAP + UNIT_GAP;
        } else {
          x += NODE_WIDTH + UNIT_GAP;
        }
      }
    }

    // Pasangan tersisa di depth ini yang spouse-nya sudah diposisikan
    for (const person of atDepth) {
      if (positions.has(person.id)) continue;
      const spouseId = person.spouseIds.find((sid) => positions.has(sid));
      if (!spouseId) continue;
      const spousePos = positions.get(spouseId)!;
      const spouse = map.get(spouseId);
      const onRight =
        !spouse ||
        spouse.gender === 'male' ||
        (spouse.gender === 'female' && person.gender === 'male');
      positions.set(person.id, {
        x: onRight
          ? spousePos.x + NODE_WIDTH + COUPLE_GAP
          : spousePos.x - NODE_WIDTH - COUPLE_GAP,
        y: spousePos.y,
      });
    }
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
): { nodes: Node[]; edges: Edge[] } {
  const perspective = options.perspective ?? 'self';
  const lineage = options.lineage ?? 'both';
  const rootId = options.rootPersonId ?? options.focusPersonId ?? 'me';
  const focusId = options.focusPersonId ?? rootId;
  const map = buildPersonMap(persons);
  const ancestorDepths = buildAncestorDepthMap(rootId, map, lineage);
  // fullDepths extends ancestorDepths with sibling/spouse depths so tiers are correct
  const fullDepths = buildFullDepthMap(persons, ancestorDepths);
  const units = buildCoupleUnits(persons, map, perspective, fullDepths);

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

  alignParentCouplesAboveChildren(persons, map, ancestorDepths, fullDepths, allPositions, tierToY);

  placeDescendantGenerations(persons, map, fullDepths, allPositions);

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

  // Path seleksi: leluhur (inkl. diri) + keturunan di bawah
  const visibleSet = new Set(persons.map((p) => p.id));
  const ancestorPath = options.selectedId
    ? collectAncestorPath(options.selectedId, map, visibleSet)
    : new Set<string>();
  const descendantPath = options.selectedId
    ? collectDescendantPath(options.selectedId, persons, visibleSet)
    : new Set<string>();
  const hasSelection = ancestorPath.size > 0;
  const selectionGlow = new Set([...ancestorPath, ...descendantPath]);

  const personNodes: Node<PersonNodeData>[] = persons
    .filter((p) => allPositions.has(p.id))
    .map((person) => {
      const pos = allPositions.get(person.id)!;
      const isFocus = person.id === focusId;
      const isHighlighted = matchIds.has(person.id);
      const isSelected = options.selectedId === person.id;
      const isAncestorPath = hasSelection && ancestorPath.has(person.id);
      const isDescendantPath =
        hasSelection && !isSelected && descendantPath.has(person.id);
      const isDimmed =
        (hasSearch && !isHighlighted && !isFocus) ||
        (hasSelection && !selectionGlow.has(person.id));

      return {
        id: person.id,
        type: 'personNode',
        position: pos,
        data: {
          person,
          isFocus,
          isHighlighted,
          isSelected,
          isDimmed,
          isAncestorPath,
          isDescendantPath,
        },
        zIndex: isFocus
          ? 10
          : isSelected
            ? 9
            : isAncestorPath
              ? 8
              : isDescendantPath
                ? 7
                : 1,
      };
    });

  const parentEdges = buildFamilyBranchEdges({
    persons,
    positions: allPositions,
    ancestorPath,
    descendantPath,
    hasSelection,
  });

  const edges: Edge[] = [...parentEdges];
  const edgeIds = new Set(parentEdges.map((e) => e.id));

  for (const person of persons) {
    if (!allPositions.has(person.id)) continue;

    for (const spouseId of person.spouseIds) {
      if (person.id >= spouseId || !allPositions.has(spouseId)) continue;
      const id = `spouse-${person.id}-${spouseId}`;
      if (edgeIds.has(id)) continue;
      edgeIds.add(id);
      const onGlow =
        selectionGlow.has(person.id) && selectionGlow.has(spouseId);
      const dimmed = hasSelection && !onGlow;
      edges.push({
        id,
        source: person.id,
        target: spouseId,
        sourceHandle: 'right',
        targetHandle: 'left',
        type: 'straight',
        style: {
          stroke: '#94A3B8',
          strokeWidth: 2,
          strokeDasharray: '5 3',
          opacity: dimmed ? 0.2 : 1,
        },
      });
    }
  }

  return { nodes: personNodes, edges };
}

/** Satu edge per pasangan orang tua → semua anak (digambar custom pedigree). */
function buildFamilyBranchEdges({
  persons,
  positions,
  ancestorPath,
  descendantPath,
  hasSelection,
}: {
  persons: Person[];
  positions: Map<string, { x: number; y: number }>;
  ancestorPath: Set<string>;
  descendantPath: Set<string>;
  hasSelection: boolean;
}): Edge[] {
  const groups = new Map<string, Person[]>();

  for (const person of persons) {
    if (!positions.has(person.id)) continue;
    const fatherId =
      person.fatherId && positions.has(person.fatherId) ? person.fatherId : '';
    const motherId =
      person.motherId && positions.has(person.motherId) ? person.motherId : '';
    if (!fatherId && !motherId) continue;
    const key = `${fatherId}|${motherId}`;
    const group = groups.get(key) ?? [];
    group.push(person);
    groups.set(key, group);
  }

  const edges: Edge[] = [];
  const glow = new Set([...ancestorPath, ...descendantPath]);

  for (const [key, children] of groups) {
    const [fatherId, motherId] = key.split('|');
    const source = fatherId || motherId;
    const target = children[0]?.id;
    if (!source || !target) continue;

    children.sort((a, b) => a.birthDate.localeCompare(b.birthDate));

    const childOnAncestor = children.some((c) => ancestorPath.has(c.id));
    const fatherOnAncestor = !!(fatherId && ancestorPath.has(fatherId));
    const motherOnAncestor = !!(motherId && ancestorPath.has(motherId));

    // Leluhur: cabang di jalur ke atas (ungu)
    const highlighted =
      hasSelection &&
      childOnAncestor &&
      (fatherOnAncestor || motherOnAncestor || (!fatherId && !motherId));

    // Keturunan: parent di glow (terpilih/leluhur/keturunan) dan anak di jalur turun (teal)
    const descHighlight =
      hasSelection &&
      !highlighted &&
      children.some((c) => descendantPath.has(c.id)) &&
      ((!!fatherId && glow.has(fatherId)) || (!!motherId && glow.has(motherId)));

    const dimmed = hasSelection && !highlighted && !descHighlight;

    edges.push({
      id: `family-${key.replace('|', '_')}`,
      source,
      target,
      sourceHandle: 'bottom',
      targetHandle: 'top',
      type: 'familyBranch',
      data: {
        fatherId: fatherId || undefined,
        motherId: motherId || undefined,
        childIds: children.map((c) => c.id),
        dimmed,
        highlighted,
        descendantHighlighted: descHighlight,
      },
      zIndex: highlighted ? 10 : descHighlight ? 8 : 1,
      focusable: false,
      interactionWidth: 0,
    });
  }

  return edges;
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
