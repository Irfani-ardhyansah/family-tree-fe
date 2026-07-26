import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Panel,
  ReactFlowProvider,
  applyNodeChanges,
  useReactFlow,
} from 'reactflow';
import type { Node, NodeChange, NodeMouseHandler } from 'reactflow';
import 'reactflow/dist/style.css';
import {
  Search,
  Users,
  GitBranch,
  X,
  ZoomIn,
  Crosshair,
  Maximize2,
  Minimize2,
  BookOpen,
  User,
  Lock,
  Move,
  ChevronDown,
  ChevronUp,
  Sliders,
} from 'react-feather';
import { Link } from 'react-router-dom';

import PersonNode from './components/PersonNode';
import FamilyBranchEdge from './components/FamilyBranchEdge';
import { PersonDetailModal } from '@/features/family-data/components/PersonDetailModal';
import { useFamilyPerspective } from '@/context/FamilyPerspectiveContext';
import { useFocusPersonId } from '@/hooks/useFocusPersonId';
import { useFamilyTree } from '@/hooks/useFamilyTree';
import type { Person, TreeDisplayFilters, TreeLineage, TreeViewConfig } from '@/types/person';
import {
  DEFAULT_TREE_VIEW,
  TREE_DISPLAY_OPTIONS,
  TREE_LINEAGE_OPTIONS,
  ANCESTOR_GENERATION_NAMES,
  DESCENDANT_GENERATION_NAMES,
} from '@/types/person';
import {
  filterPersons,
  layoutFamilyTree,
  getVisibleStats,
  getMaxGenerationsUp,
  getMaxGenerationsDown,
  resolveFocusPersonId,
  NODE_WIDTH,
  NODE_HEIGHT,
  type PersonNodeData,
} from '@/utils/treeLayout';
import { getMemorialEntryPath } from '@/utils/memoriamAccess';
import { PersonContactInfo } from '@/components/ui/PersonContactInfo';

const nodeTypes = {
  personNode: PersonNode,
};

const edgeTypes = {
  familyBranch: FamilyBranchEdge,
};

function PersonDetailPanel({
  person,
  onClose,
  onViewDetail,
  variant = 'panel',
}: {
  person: Person;
  onClose: () => void;
  onViewDetail: () => void;
  variant?: 'panel' | 'sheet';
}) {
  const age = new Date().getFullYear() - new Date(person.birthDate).getFullYear();
  const isSheet = variant === 'sheet';

  return (
    <div
      className={`bg-white shadow-lg border border-gray-200 overflow-hidden ${
        isSheet
          ? 'rounded-t-2xl w-full max-h-[75dvh] overflow-y-auto'
          : 'rounded-xl w-72 lg:w-80 max-h-[70vh] overflow-y-auto'
      }`}
    >
      {isSheet && (
        <div className="flex justify-center pt-2 pb-1">
          <span className="w-10 h-1 rounded-full bg-gray-300" aria-hidden />
        </div>
      )}
      <div className="bg-primary-500 px-4 py-3 flex justify-between items-center">
        <h3 className="text-white font-semibold text-sm">Profil Anggota</h3>
        <button
          type="button"
          onClick={onClose}
          className="text-white/80 hover:text-white transition p-1.5 -mr-1 rounded-lg"
          aria-label="Tutup"
        >
          <X size={18} />
        </button>
      </div>
      <div className="p-4 space-y-3">
        <div className="min-w-0">
          <p className="text-lg font-bold text-brand-700 break-words">{person.fullName}</p>
          {person.nickname && (
            <p className="text-sm text-primary-600 font-medium">{person.nickname}</p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-gray-50 rounded-lg p-2.5">
            <p className="text-gray-400">Status</p>
            <p className="font-medium text-brand-700">
              {person.status === 'alive' ? 'Hidup' : 'Almarhum(ah)'}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2.5">
            <p className="text-gray-400">Usia</p>
            <p className="font-medium text-brand-700">~{age} tahun</p>
          </div>
        </div>
        {person.generationLabel && (
          <div className="text-xs">
            <p className="text-gray-400">Posisi</p>
            <p className="font-medium text-brand-700">{person.generationLabel}</p>
          </div>
        )}
        <PersonContactInfo person={person} />
        <button
          type="button"
          onClick={onViewDetail}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold transition-colors"
        >
          <User size={16} />
          Lihat Detail
        </button>
        {person.status === 'deceased' && (
          <Link
            to={getMemorialEntryPath(person)}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-slate-700 hover:bg-slate-800 text-white text-sm font-semibold transition-colors"
          >
            <BookOpen size={16} />
            Lihat Kenangan
          </Link>
        )}
      </div>
    </div>
  );
}

function useIsNarrow(breakpoint = 768) {
  const [isNarrow, setIsNarrow] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < breakpoint,
  );

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const update = () => setIsNarrow(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [breakpoint]);

  return isNarrow;
}

function useFullscreen() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () =>
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggle = useCallback(async () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await containerRef.current.requestFullscreen();
    }
  }, []);

  return { containerRef, isFullscreen, toggle };
}

function TreeCanvas() {
  const { fitView, setCenter } = useReactFlow();
  const { containerRef, isFullscreen, toggle: toggleFullscreen } = useFullscreen();
  const focusPersonIdNum = useFocusPersonId();
  const isNarrow = useIsNarrow(768);

  const [viewConfig, setViewConfig] = useState<Omit<TreeViewConfig, 'perspective'>>({
    lineage: DEFAULT_TREE_VIEW.lineage,
    generationsUp: DEFAULT_TREE_VIEW.generationsUp,
    generationsDown: DEFAULT_TREE_VIEW.generationsDown,
    display: DEFAULT_TREE_VIEW.display,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [detailTarget, setDetailTarget] = useState<Person | null>(null);
  const [nodesLocked, setNodesLocked] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [legendOpen, setLegendOpen] = useState(false);
  const [rfNodes, setRfNodes] = useState<Node[]>([]);
  const generationsUpInitialized = useRef(false);

  const {
    source,
    familyData,
    meta,
    graphWarnings,
    useServerFilter,
    serverFilterApplied,
    isLoading,
    error,
  } = useFamilyTree(focusPersonIdNum, viewConfig);
  const { persons } = familyData;
  const {
    perspective,
    focusShortLabel,
    spouse: contextSpouse,
    theme,
    me,
  } = useFamilyPerspective();

  const spouse = useMemo(() => {
    if (contextSpouse) return contextSpouse;
    const me = familyData.persons.find((p) => p.isSelf);
    const spouseId = me?.spouseIds[0];
    return spouseId
      ? familyData.persons.find((p) => p.id === spouseId)
      : undefined;
  }, [contextSpouse, familyData]);

  const totalStats = useMemo(
    () => ({
      totalMembers:
        meta?.totalFamilyCount ?? meta?.personCount ?? persons.length,
    }),
    [meta?.totalFamilyCount, meta?.personCount, persons.length],
  );

  useEffect(() => {
    setSelectedPerson(null);
    generationsUpInitialized.current = false;
  }, [focusPersonIdNum, source]);

  const fullViewConfig = useMemo(
    (): TreeViewConfig => ({ ...viewConfig, perspective }),
    [viewConfig, perspective],
  );

  const focusPersonId = useMemo(
    () => resolveFocusPersonId(familyData, perspective),
    [familyData, perspective],
  );

  const maxGenerationsUp = useMemo(() => {
    if (source === 'api' && useServerFilter) {
      return 12;
    }
    return getMaxGenerationsUp(familyData, fullViewConfig);
  }, [source, useServerFilter, familyData, fullViewConfig]);

  const maxGenerationsDown = useMemo(() => {
    if (source === 'api' && useServerFilter) {
      return 8;
    }
    return getMaxGenerationsDown(familyData, fullViewConfig);
  }, [source, useServerFilter, familyData, fullViewConfig]);

  useEffect(() => {
    // Jangan clamp ke 0 saat data belum siap — itu yang bikin default jadi 0
    if (maxGenerationsUp <= 0) return;

    setViewConfig((prev) => {
      if (!generationsUpInitialized.current) {
        generationsUpInitialized.current = true;
        const next = Math.min(DEFAULT_TREE_VIEW.generationsUp, maxGenerationsUp);
        return prev.generationsUp === next ? prev : { ...prev, generationsUp: next };
      }
      if (prev.generationsUp > maxGenerationsUp) {
        return { ...prev, generationsUp: maxGenerationsUp };
      }
      return prev;
    });
  }, [maxGenerationsUp]);

  useEffect(() => {
    if (maxGenerationsDown <= 0) return;
    if (viewConfig.generationsDown > maxGenerationsDown) {
      setViewConfig((prev) => ({ ...prev, generationsDown: maxGenerationsDown }));
    }
  }, [maxGenerationsDown, viewConfig.generationsDown]);

  const visiblePersons = useMemo(() => {
    if (source === 'api' && serverFilterApplied) {
      return familyData.persons;
    }
    return filterPersons(familyData, fullViewConfig);
  }, [source, serverFilterApplied, familyData, fullViewConfig]);

  const visibleStats = useMemo(
    () => getVisibleStats(visiblePersons, focusPersonId, fullViewConfig.lineage),
    [visiblePersons, focusPersonId, fullViewConfig.lineage],
  );

  const { nodes, edges } = useMemo(
    () =>
      layoutFamilyTree(visiblePersons, {
        perspective: fullViewConfig.perspective,
        lineage: fullViewConfig.lineage,
        rootPersonId: focusPersonId,
        focusPersonId,
        selectedId: selectedPerson?.id,
        searchQuery,
      }),
    [
      visiblePersons,
      fullViewConfig.perspective,
      fullViewConfig.lineage,
      focusPersonId,
      selectedPerson?.id,
      searchQuery,
    ],
  );

  // Signature layout (id + posisi) — abaikan highlight/seleksi supaya klik node tidak reset zoom/drag
  const treeLayoutSignature = useMemo(
    () =>
      nodes
        .map((n) => `${n.id}:${Math.round(n.position.x)}:${Math.round(n.position.y)}`)
        .join('|'),
    [nodes],
  );

  const layoutNodesRef = useRef(nodes);
  layoutNodesRef.current = nodes;

  // Reset ke layout otomatis hanya saat geometri pohon berubah (filter/generasi)
  useEffect(() => {
    setRfNodes(layoutNodesRef.current);
  }, [treeLayoutSignature]);

  // Update data highlight/seleksi tanpa menimpa posisi drag manual
  useEffect(() => {
    setRfNodes((current) => {
      if (current.length === 0) return nodes;
      const byId = new Map(nodes.map((n) => [n.id, n]));
      return current
        .filter((n) => byId.has(n.id))
        .map((n) => {
          const fresh = byId.get(n.id)!;
          return fresh.data === n.data ? n : { ...n, data: fresh.data };
        });
    });
  }, [nodes]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      if (nodesLocked) return;
      setRfNodes((current) => applyNodeChanges(changes, current));
    },
    [nodesLocked],
  );

  useEffect(() => {
    if (nodes.length === 0) return;
    const timer = window.setTimeout(() => {
      fitView({
        padding: 0.14,
        duration: 450,
        minZoom: 0.05,
        maxZoom: 1.35,
      });
    }, 50);
    return () => window.clearTimeout(timer);
  }, [treeLayoutSignature, fitView, nodes.length, isFullscreen]);

  const resetNodePositions = useCallback(() => {
    setRfNodes(layoutNodesRef.current);
    window.setTimeout(() => {
      fitView({ padding: 0.14, duration: 400, minZoom: 0.05, maxZoom: 1.35 });
    }, 40);
  }, [fitView]);

  const activeDisplayCount =
    Object.values(viewConfig.display).filter(Boolean).length +
    (viewConfig.generationsDown > 0 ? 1 : 0);

  const setLineage = (lineage: TreeLineage) => {
    setViewConfig((prev) => ({ ...prev, lineage }));
  };

  const setGenerationsUp = (generationsUp: number) => {
    setViewConfig((prev) => ({ ...prev, generationsUp }));
  };

  const setGenerationsDown = (generationsDown: number) => {
    setViewConfig((prev) => ({ ...prev, generationsDown }));
  };

  const toggleDisplay = (key: keyof TreeDisplayFilters) => {
    setViewConfig((prev) => ({
      ...prev,
      display: { ...prev.display, [key]: !prev.display[key] },
    }));
  };

  const applyPreset = (preset: 'core' | 'full') => {
    setViewConfig((prev) => ({
      ...prev,
      generationsDown: preset === 'full' ? Math.min(2, maxGenerationsDown) : 0,
      display: {
        showSpouses: preset === 'full',
        showSiblings: preset === 'full',
      },
    }));
  };

  const onNodeClick: NodeMouseHandler = useCallback((_event, node: Node) => {
    const data = node.data as PersonNodeData;
    if (!data?.person) return;
    setSelectedPerson(data.person);
  }, []);

  const centerOnFocus = useCallback(() => {
    const focusNode = nodes.find((n) => (n.data as PersonNodeData).isFocus);
    if (focusNode) {
      setCenter(
        focusNode.position.x + NODE_WIDTH / 2,
        focusNode.position.y + NODE_HEIGHT / 2,
        { zoom: 1.1, duration: 600 },
      );
      const data = focusNode.data as PersonNodeData;
      if (data.person) setSelectedPerson(data.person);
    }
  }, [nodes, setCenter]);

  const focusLabel = focusShortLabel;
  const lineageLabel =
    TREE_LINEAGE_OPTIONS.find((o) => o.value === viewConfig.lineage)?.label ??
    'Semua';

  return (
    <>
      <div className="flex flex-col xl:flex-row gap-3 xl:gap-4 mb-4">
        {/* Sidebar kontrol */}
        <div className="xl:w-72 flex-shrink-0 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-brand-700">
                Pohon Keluarga
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {visibleStats.visibleCount} dari {totalStats.totalMembers} anggota
                <span className="mx-1.5">·</span>
                <span
                  className={`font-medium ${
                    source === 'api' ? 'text-emerald-600' : 'text-violet-600'
                  }`}
                >
                  {source === 'api' ? 'API' : 'Mock'}
                </span>
                {source === 'api' && useServerFilter && (
                  <>
                    <span className="mx-1.5">·</span>
                    <span className="font-medium text-sky-600">Filter BE</span>
                  </>
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFiltersOpen((v) => !v)}
              className={`xl:hidden inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-sm font-semibold flex-shrink-0 ${
                filtersOpen
                  ? 'border-primary-400 bg-primary-50 text-primary-700'
                  : 'border-gray-200 bg-white text-brand-700'
              }`}
              aria-expanded={filtersOpen}
            >
              <Sliders size={16} />
              Filter
              {filtersOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>

          {/* Mobile filter summary when collapsed */}
          {!filtersOpen && (
            <div className="xl:hidden flex flex-wrap gap-1.5 text-xs">
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-brand-600 font-medium">
                {lineageLabel}
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-gray-600">
                Atas {viewConfig.generationsUp} · Bawah {viewConfig.generationsDown}
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-gray-600">
                Layer {activeDisplayCount}/3
              </span>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="rounded-xl bg-red-50 border border-red-100 px-3 py-2.5 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {graphWarnings.length > 0 && (
            <div className="rounded-xl bg-amber-50 border border-amber-100 px-3 py-2.5 text-xs text-amber-800">
              <p className="font-semibold mb-1">Peringatan data pohon</p>
              <ul className="list-disc list-inside space-y-0.5">
                {graphWarnings.slice(0, 3).map((warning, index) => (
                  <li key={`${warning.code}-${index}`}>
                    {warning.message ?? warning.code}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {isLoading && (
            <div className="rounded-xl bg-gray-50 border border-gray-100 px-3 py-2.5 text-sm text-gray-500">
              Memuat pohon keluarga…
            </div>
          )}

          <div className={`space-y-3 ${filtersOpen ? 'block' : 'hidden xl:block'}`}>
          {/* Filter 1: Jalur & generasi */}
          <div className={`bg-white rounded-xl border p-3 shadow-sm ${theme.accentBorder}`}>
            <p className="text-xs font-semibold text-brand-700 mb-2 uppercase tracking-wide">
              Filter 1 · Jalur Keturunan
            </p>
            {perspective === 'spouse' && (
              <p className="text-[10px] text-secondary-500 mb-2 leading-relaxed">
                Pusat pohon: {spouse?.nickname ?? spouse?.fullName ?? 'Pasangan'} (atur di navbar)
              </p>
            )}
            <div className="grid grid-cols-3 gap-1.5">
              {TREE_LINEAGE_OPTIONS.map(({ value, label, desc }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setLineage(value)}
                  title={desc}
                  className={`px-2 py-2.5 sm:py-2 rounded-lg text-xs sm:text-[11px] font-medium border transition leading-tight min-h-[44px] sm:min-h-0 ${
                    viewConfig.lineage === value
                      ? value === 'both'
                        ? 'bg-secondary-500 text-white border-secondary-500'
                        : 'bg-primary-500 text-white border-primary-500'
                      : 'bg-white text-brand-600 border-gray-200 hover:border-primary-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {viewConfig.lineage !== 'both' && (
              <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">
                {viewConfig.lineage === 'paternal'
                  ? 'Hanya garis ayah ke atas. Orang tua penghubung tetap tampil.'
                  : 'Hanya garis ibu ke atas. Orang tua penghubung tetap tampil.'}
              </p>
            )}

            <p className="text-xs font-semibold text-brand-700 mt-3 mb-2 uppercase tracking-wide">
              Generasi ke Atas
            </p>
            {maxGenerationsUp > 0 ? (
              <>
                <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
                  <span>
                    {viewConfig.generationsUp === 0
                      ? 'Tidak ditampilkan'
                      : `Sampai ${ANCESTOR_GENERATION_NAMES[viewConfig.generationsUp] ?? `Gen ${viewConfig.generationsUp}`}`}
                  </span>
                  <span>{viewConfig.generationsUp} / {maxGenerationsUp}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={maxGenerationsUp}
                  value={Math.min(viewConfig.generationsUp, maxGenerationsUp)}
                  onChange={(e) => setGenerationsUp(Number(e.target.value))}
                  className="w-full h-2 accent-primary-500 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-gray-400 mt-1">
                  <span>Sembunyikan</span>
                  <span>{ANCESTOR_GENERATION_NAMES[maxGenerationsUp] ?? 'Leluhur'}</span>
                </div>
                <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">
                  Batasi kedalaman ke atas dari fokus. Buyut ke atas: hanya pasangan ayah–ibu per jalur (tanpa saudara).
                </p>
              </>
            ) : (
              <p className="text-[10px] text-gray-500">Data leluhur belum tersedia.</p>
            )}

            <p className="text-xs font-semibold text-brand-700 mt-3 mb-2 uppercase tracking-wide">
              Keturunan
            </p>
            {maxGenerationsDown > 0 ? (
              <>
                <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
                  <span>
                    {viewConfig.generationsDown === 0
                      ? 'Tidak ditampilkan'
                      : `Sampai ${DESCENDANT_GENERATION_NAMES[viewConfig.generationsDown] ?? `Gen ${viewConfig.generationsDown}`}`}
                  </span>
                  <span>{viewConfig.generationsDown} / {maxGenerationsDown}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={maxGenerationsDown}
                  value={Math.min(viewConfig.generationsDown, maxGenerationsDown)}
                  onChange={(e) => setGenerationsDown(Number(e.target.value))}
                  className="w-full h-2 accent-primary-500 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-gray-400 mt-1">
                  <span>Sembunyikan</span>
                  <span>{DESCENDANT_GENERATION_NAMES[maxGenerationsDown] ?? 'Keturunan jauh'}</span>
                </div>
                <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">
                  Batasi kedalaman ke bawah dari fokus (anak, cucu, cicit, …). Sepupu muncul jika Saudara aktif.
                </p>
              </>
            ) : (
              <p className="text-[10px] text-gray-500">Data keturunan belum tersedia.</p>
            )}
          </div>

          {/* Filter 2: Layer tampilan */}
          <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-brand-700 uppercase tracking-wide">
                Filter 2 · Layer
              </p>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => applyPreset('core')}
                  className="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-600 hover:bg-gray-200"
                >
                  Inti
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('full')}
                  className="text-[10px] px-2 py-0.5 rounded bg-primary-100 text-primary-700 hover:bg-primary-200"
                >
                  Lengkap
                </button>
              </div>
            </div>
            <div className="space-y-2">
              {TREE_DISPLAY_OPTIONS.map(({ key, label, desc }) => (
                <label
                  key={key}
                  className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition ${
                    viewConfig.display[key]
                      ? 'border-primary-400 bg-primary-50'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={viewConfig.display[key]}
                    onChange={() => toggleDisplay(key)}
                    className="mt-0.5 rounded border-gray-300 text-primary-500 focus:ring-primary-400"
                  />
                  <span>
                    <span className="block text-xs font-medium text-brand-700">{label}</span>
                    <span className="block text-[10px] text-gray-500 leading-snug">{desc}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Stat ringkas */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white rounded-lg border border-gray-100 px-2.5 py-2 flex items-center gap-2">
              <GitBranch size={13} className="text-secondary-500" />
              <div>
                <p className="text-[9px] text-gray-400">Generasi</p>
                <p className="text-sm font-bold text-brand-700">{visibleStats.generations}</p>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-100 px-2.5 py-2 flex items-center gap-2">
              <Users size={13} className="text-primary-500" />
              <div>
                <p className="text-[9px] text-gray-400">Layer aktif</p>
                <p className="text-sm font-bold text-brand-700">{activeDisplayCount}/3</p>
              </div>
            </div>
          </div>
          </div>
        </div>

        {/* Diagram */}
        <div className="flex-1 min-w-0">
          <div
            ref={containerRef}
            className={`bg-white shadow-md border overflow-hidden relative ${
              isFullscreen ? 'rounded-none h-[100dvh]' : 'rounded-xl'
            } ${theme.accentBorder}`}
            style={{
              height: isFullscreen
                ? undefined
                : isNarrow
                  ? 'min(68dvh, calc(100dvh - 11rem))'
                  : '72vh',
              minHeight: isFullscreen ? undefined : isNarrow ? 320 : 420,
            }}
          >
            {isLoading && persons.length === 0 ? (
              <div className="flex items-center justify-center h-full min-h-[320px] text-gray-400 text-sm">
                Memuat diagram…
              </div>
            ) : persons.length === 0 ? (
              <div className="flex items-center justify-center h-full min-h-[320px] text-gray-400 text-sm">
                {error ?? 'Tidak ada data anggota untuk ditampilkan.'}
              </div>
            ) : (
            <ReactFlow
              nodes={rfNodes}
              edges={edges}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              onNodeClick={onNodeClick}
              onNodesChange={onNodesChange}
              nodesDraggable={!nodesLocked}
              nodesConnectable={false}
              elementsSelectable
              fitView
              fitViewOptions={{ padding: isNarrow ? 0.2 : 0.12 }}
              minZoom={0.05}
              maxZoom={2}
              panOnScroll={!isNarrow}
              zoomOnPinch
              preventScrolling
              proOptions={{ hideAttribution: true }}
              className={isFullscreen ? '' : 'rounded-xl'}
            >
              <Controls
                showInteractive={false}
                position={isNarrow ? 'bottom-right' : 'bottom-left'}
                className="!m-2 sm:!m-3"
              />
              {!isNarrow && (
                <MiniMap
                  nodeColor={(node) => {
                    const data = node.data as PersonNodeData;
                    if (!data?.person) return '#e5e7eb';
                    if (data.isFocus) return '#2563EB';
                    if (data.isSelected) return '#F59E0B';
                    if (data.isAncestorPath) return '#8B5CF6';
                    if (data.isDescendantPath) return '#14B8A6';
                    if (data.person.status === 'deceased') return '#aeb8c2';
                    return data.person.gender === 'male' ? '#93C5FD' : '#F9A8D4';
                  }}
                  nodeStrokeWidth={2}
                  zoomable
                  pannable
                  className="!bg-white/90 !border !border-gray-200 !rounded-lg"
                />
              )}
              <Background color="#e2efe2" variant={BackgroundVariant.Dots} gap={16} size={1} />

              <Panel position="top-left" className="!m-2 sm:!m-3 !max-w-[calc(100%-1rem)]">
                <div className="flex flex-col gap-2 w-[min(100%,18rem)] sm:w-auto">
                  <div className="relative">
                    <Search
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="search"
                      placeholder="Cari anggota..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-3 py-2.5 text-sm rounded-lg border border-gray-200 bg-white/95 shadow-sm w-full sm:w-48 focus:outline-none focus:ring-2 focus:ring-primary-300"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={centerOnFocus}
                      className="flex items-center gap-1 px-2.5 py-2 text-xs font-medium bg-primary-500 text-white rounded-lg hover:bg-primary-600 shadow-sm min-h-[36px]"
                    >
                      <Crosshair size={12} />
                      Ke {focusLabel}
                    </button>
                    <button
                      type="button"
                      onClick={() => fitView({ padding: 0.15, duration: 500 })}
                      className="flex items-center gap-1 px-2.5 py-2 text-xs font-medium bg-white text-brand-600 border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm min-h-[36px]"
                    >
                      <ZoomIn size={12} />
                      Fit
                    </button>
                    <button
                      type="button"
                      onClick={() => setNodesLocked((v) => !v)}
                      className={`flex items-center gap-1 px-2.5 py-2 text-xs font-medium rounded-lg border shadow-sm min-h-[36px] ${
                        nodesLocked
                          ? 'bg-white text-brand-600 border-gray-200 hover:bg-gray-50'
                          : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                      }`}
                      title={
                        nodesLocked
                          ? 'Kartu terkunci — aktifkan untuk menggeser'
                          : 'Mode geser aktif — klik untuk mengunci'
                      }
                    >
                      {nodesLocked ? <Lock size={12} /> : <Move size={12} />}
                      <span className="hidden sm:inline">
                        {nodesLocked ? 'Terkunci' : 'Geser'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={toggleFullscreen}
                      className={`flex items-center gap-1.5 px-2.5 py-2 text-xs font-semibold rounded-lg border shadow-sm min-h-[36px] ${
                        isFullscreen
                          ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                          : 'bg-white text-brand-600 border-gray-200 hover:bg-gray-50'
                      }`}
                      title={isFullscreen ? 'Keluar layar penuh' : 'Layar penuh'}
                      aria-label={isFullscreen ? 'Keluar layar penuh' : 'Layar penuh'}
                    >
                      {isFullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
                      {isFullscreen ? 'Keluar' : 'Fullscreen'}
                    </button>
                    {!nodesLocked && (
                      <button
                        type="button"
                        onClick={resetNodePositions}
                        className="flex items-center gap-1 px-2.5 py-2 text-xs font-medium bg-white text-brand-600 border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm min-h-[36px]"
                        title="Kembalikan posisi kartu ke layout otomatis"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              </Panel>

              {selectedPerson && !isNarrow && (
                <Panel position="top-right" className="!m-3">
                  <PersonDetailPanel
                    person={selectedPerson}
                    onClose={() => setSelectedPerson(null)}
                    onViewDetail={() => setDetailTarget(selectedPerson)}
                  />
                </Panel>
              )}

              <Panel
                position="bottom-left"
                className={`!m-2 sm:!m-3 !ml-14 sm:!ml-[4.5rem] ${isNarrow ? '!mb-14' : ''}`}
              >
                <div className="bg-white/95 rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setLegendOpen((v) => !v)}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2 text-left"
                    aria-expanded={legendOpen}
                  >
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                      Keterangan
                    </p>
                    {legendOpen ? (
                      <ChevronUp size={14} className="text-gray-400" />
                    ) : (
                      <ChevronDown size={14} className="text-gray-400" />
                    )}
                  </button>
                  {legendOpen && (
                  <div className="px-3 pb-2.5 flex flex-col gap-1.5 text-[10px] text-gray-600">
                    <span className="flex items-center gap-2">
                      <span className="w-6 h-0.5 bg-blue-600 inline-block rounded-full flex-shrink-0" />
                      Garis dari Ayah
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="w-6 h-0.5 bg-pink-600 inline-block rounded-full flex-shrink-0" />
                      Garis dari Ibu
                    </span>
                    <span className="flex items-center gap-2">
                      <svg width="24" height="4" className="flex-shrink-0">
                        <line x1="0" y1="2" x2="24" y2="2" stroke="#94A3B8" strokeWidth="2" strokeDasharray="5 3" />
                      </svg>
                      Pasangan
                    </span>
                    <span className="border-t border-gray-100 my-0.5" />
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded-sm bg-violet-500 flex-shrink-0" />
                      Leluhur (saat dipilih)
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded-sm bg-teal-500 flex-shrink-0" />
                      Keturunan (saat dipilih)
                    </span>
                    <span className="border-t border-gray-100 my-0.5" />
                    <span className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="11" height="11">
                          <circle cx="10" cy="14" r="5.5" />
                          <line x1="14.2" y1="9.8" x2="20" y2="4" />
                          <polyline points="15.5 4 20 4 20 8.5" />
                        </svg>
                      </span>
                      Laki-laki
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-pink-100 text-pink-500 flex items-center justify-center flex-shrink-0">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="11" height="11">
                          <circle cx="12" cy="8" r="5.5" />
                          <line x1="12" y1="13.5" x2="12" y2="20" />
                          <line x1="9" y1="17" x2="15" y2="17" />
                        </svg>
                      </span>
                      Perempuan
                    </span>
                  </div>
                  )}
                </div>
              </Panel>
            </ReactFlow>
            )}
          </div>
        </div>
      </div>

      {/* Mobile bottom sheet for person detail */}
      {selectedPerson && isNarrow && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Tutup profil"
            onClick={() => setSelectedPerson(null)}
          />
          <div className="relative z-10 pb-[env(safe-area-inset-bottom)]">
            <PersonDetailPanel
              person={selectedPerson}
              variant="sheet"
              onClose={() => setSelectedPerson(null)}
              onViewDetail={() => {
                setDetailTarget(selectedPerson);
                setSelectedPerson(null);
              }}
            />
          </div>
        </div>
      )}

      <PersonDetailModal
        isOpen={detailTarget !== null}
        onClose={() => setDetailTarget(null)}
        person={detailTarget}
        allPersons={persons}
        currentUserId={me?.id}
      />
    </>
  );
}

export function TreePage() {
  return (
    <ReactFlowProvider>
      <TreeCanvas />
    </ReactFlowProvider>
  );
}
