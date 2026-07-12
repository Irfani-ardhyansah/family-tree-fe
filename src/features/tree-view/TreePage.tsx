import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Panel,
  ReactFlowProvider,
  useReactFlow,
} from 'reactflow';
import type { Node, NodeMouseHandler } from 'reactflow';
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
} from 'react-feather';
import { Link } from 'react-router-dom';

import PersonNode from './components/PersonNode';
import { useFamily } from '@/context/FamilyDataContext';
import { useFamilyPerspective } from '@/context/FamilyPerspectiveContext';
import type { Person, TreeDisplayFilters, TreeLineage, TreeViewConfig } from '@/types/person';
import { DEFAULT_TREE_VIEW, TREE_DISPLAY_OPTIONS, TREE_LINEAGE_OPTIONS, ANCESTOR_GENERATION_NAMES } from '@/types/person';
import {
  filterPersons,
  layoutFamilyTree,
  getVisibleStats,
  getMaxGenerationsUp,
  resolveFocusPersonId,
  NODE_WIDTH,
  NODE_HEIGHT,
  type PersonNodeData,
} from '@/utils/treeLayout';
import { getMemorialEntryPath } from '@/utils/memoriamAccess';

const nodeTypes = { personNode: PersonNode };

function useFullscreen() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFullscreen(document.fullscreenElement === containerRef.current);
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

function PersonDetailPanel({ person, onClose }: { person: Person; onClose: () => void }) {
  const age = new Date().getFullYear() - new Date(person.birthDate).getFullYear();

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 w-72 overflow-hidden">
      <div className="bg-primary-500 px-4 py-3 flex justify-between items-center">
        <h3 className="text-white font-semibold text-sm">Profil Anggota</h3>
        <button type="button" onClick={onClose} className="text-white/80 hover:text-white transition" aria-label="Tutup">
          <X size={16} />
        </button>
      </div>
      <div className="p-4 space-y-3">
        <div>
          <p className="text-lg font-bold text-brand-700">{person.fullName}</p>
          {person.nickname && <p className="text-sm text-primary-600 font-medium">{person.nickname}</p>}
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-gray-50 rounded-lg p-2">
            <p className="text-gray-400">Status</p>
            <p className="font-medium text-brand-700">{person.status === 'alive' ? 'Hidup' : 'Almarhum(ah)'}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2">
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
        {person.status === 'deceased' && (
          <Link
            to={getMemorialEntryPath(person)}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-slate-700 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
          >
            <BookOpen size={14} />
            Lihat Kenangan
          </Link>
        )}
      </div>
    </div>
  );
}

function TreeCanvas() {
  const { fitView, setCenter } = useReactFlow();
  const { containerRef, isFullscreen, toggle: toggleFullscreen } = useFullscreen();
  const { persons, rootPersonId } = useFamily();
  const familyData = useMemo(
    () => ({ persons, rootPersonId }),
    [persons, rootPersonId],
  );
  const {
    perspective,
    focusShortLabel,
    spouse,
    theme,
  } = useFamilyPerspective();

  const totalStats = useMemo(
    () => ({ totalMembers: persons.length }),
    [persons.length],
  );

  const [viewConfig, setViewConfig] = useState<Omit<TreeViewConfig, 'perspective'>>({
    lineage: DEFAULT_TREE_VIEW.lineage,
    generationsUp: DEFAULT_TREE_VIEW.generationsUp,
    display: DEFAULT_TREE_VIEW.display,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  const fullViewConfig = useMemo(
    (): TreeViewConfig => ({ ...viewConfig, perspective }),
    [viewConfig, perspective],
  );

  const focusPersonId = useMemo(
    () => resolveFocusPersonId(familyData, perspective),
    [familyData, perspective],
  );

  const maxGenerationsUp = useMemo(
    () => getMaxGenerationsUp(familyData, fullViewConfig),
    [familyData, fullViewConfig],
  );

  useEffect(() => {
    if (maxGenerationsUp > 0 && viewConfig.generationsUp > maxGenerationsUp) {
      setViewConfig((prev) => ({ ...prev, generationsUp: maxGenerationsUp }));
    }
  }, [maxGenerationsUp, viewConfig.generationsUp]);

  const visiblePersons = useMemo(
    () => filterPersons(familyData, fullViewConfig),
    [familyData, fullViewConfig],
  );

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

  const activeDisplayCount = Object.values(viewConfig.display).filter(Boolean).length;

  const setLineage = (lineage: TreeLineage) => {
    setViewConfig((prev) => ({ ...prev, lineage }));
  };

  const setGenerationsUp = (generationsUp: number) => {
    setViewConfig((prev) => ({ ...prev, generationsUp }));
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
      display: {
        showSpouses: preset === 'full',
        showSiblings: preset === 'full',
        showChildren: preset === 'full',
      },
    }));
  };

  const onNodeClick: NodeMouseHandler = useCallback((_event, node: Node<PersonNodeData>) => {
    setSelectedPerson(node.data.person);
  }, []);

  const centerOnFocus = useCallback(() => {
    const focusNode = nodes.find((n) => n.data.isFocus);
    if (focusNode) {
      setCenter(
        focusNode.position.x + NODE_WIDTH / 2,
        focusNode.position.y + NODE_HEIGHT / 2,
        { zoom: 1.1, duration: 600 },
      );
      setSelectedPerson(focusNode.data.person);
    }
  }, [nodes, setCenter]);

  const focusLabel = focusShortLabel;

  return (
    <>
      <div className="flex flex-col xl:flex-row gap-4 mb-4">
        {/* Sidebar kontrol */}
        <div className="xl:w-72 flex-shrink-0 space-y-3">
          <div>
            <h1 className="text-2xl font-bold text-brand-700">Pohon Keluarga</h1>
            <p className="text-sm text-gray-500 mt-1">
              {visibleStats.visibleCount} dari {totalStats.totalMembers} anggota
            </p>
          </div>

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
                  className={`px-2 py-2 rounded-lg text-[11px] font-medium border transition leading-tight ${
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
                  <span>Sampai {ANCESTOR_GENERATION_NAMES[viewConfig.generationsUp] ?? `Gen ${viewConfig.generationsUp}`}</span>
                  <span>{viewConfig.generationsUp} / {maxGenerationsUp}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={maxGenerationsUp}
                  value={Math.min(viewConfig.generationsUp, maxGenerationsUp)}
                  onChange={(e) => setGenerationsUp(Number(e.target.value))}
                  className="w-full h-1.5 accent-primary-500 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-gray-400 mt-1">
                  <span>Orang tua</span>
                  <span>{ANCESTOR_GENERATION_NAMES[maxGenerationsUp] ?? 'Leluhur'}</span>
                </div>
                <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">
                  Buyut ke atas: hanya pasangan ayah–ibu per jalur (tanpa saudara). Orang tua Kakek/Nenek dan Orang tua Buyut ditampilkan di baris terpisah.
                </p>
              </>
            ) : (
              <p className="text-[10px] text-gray-500">Data leluhur belum tersedia.</p>
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

        {/* Diagram */}
        <div className="flex-1 min-w-0">
          <div
            ref={containerRef}
            className={`bg-white shadow-md border overflow-hidden ${
              isFullscreen ? 'rounded-none h-screen' : 'rounded-xl'
            } ${theme.accentBorder}`}
            style={{ height: isFullscreen ? undefined : '72vh' }}
          >
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodeClick={onNodeClick}
              fitView
              fitViewOptions={{ padding: 0.12 }}
              minZoom={0.05}
              maxZoom={2}
              proOptions={{ hideAttribution: true }}
              className={isFullscreen ? '' : 'rounded-xl'}
            >
              <Controls showInteractive={false} />
              <MiniMap
                nodeColor={(node) => {
                  const data = node.data as PersonNodeData;
                  if (data.isFocus) return '#2563EB';
                  if (data.person.status === 'deceased') return '#aeb8c2';
                  return data.person.gender === 'male' ? '#93C5FD' : '#F9A8D4';
                }}
                nodeStrokeWidth={2}
                zoomable
                pannable
                className="!bg-white/90 !border !border-gray-200 !rounded-lg"
              />
              <Background color="#e2efe2" variant={BackgroundVariant.Dots} gap={16} size={1} />

              <Panel position="top-left" className="!m-3">
                <div className="flex flex-col gap-2">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="search"
                      placeholder="Cari anggota..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 bg-white/95 shadow-sm w-48 focus:outline-none focus:ring-2 focus:ring-primary-300"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={centerOnFocus}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium bg-primary-500 text-white rounded-lg hover:bg-primary-600 shadow-sm"
                    >
                      <Crosshair size={11} />
                      Ke {focusLabel}
                    </button>
                    <button
                      type="button"
                      onClick={() => fitView({ padding: 0.15, duration: 500 })}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium bg-white text-brand-600 border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm"
                    >
                      <ZoomIn size={11} />
                      Fit
                    </button>
                    <button
                      type="button"
                      onClick={toggleFullscreen}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium bg-white text-brand-600 border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm"
                      title={isFullscreen ? 'Keluar fullscreen' : 'Fullscreen'}
                    >
                      {isFullscreen ? <Minimize2 size={11} /> : <Maximize2 size={11} />}
                      {isFullscreen ? 'Keluar' : 'Fullscreen'}
                    </button>
                  </div>
                </div>
              </Panel>

              {selectedPerson && (
                <Panel position="top-right" className="!m-3">
                  <PersonDetailPanel person={selectedPerson} onClose={() => setSelectedPerson(null)} />
                </Panel>
              )}

              <Panel position="bottom-left" className="!m-3">
                <div className="bg-white/95 rounded-lg border border-gray-200 px-3 py-2.5 shadow-sm">
                  <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Keterangan</p>
                  <div className="flex flex-col gap-1.5 text-[10px] text-gray-600">
                    {/* Garis keturunan */}
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
                    {/* Divider */}
                    <span className="border-t border-gray-100 my-0.5" />
                    {/* Gender */}
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
                </div>
              </Panel>
            </ReactFlow>
          </div>
        </div>
      </div>
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
