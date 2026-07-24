import { useMemo, useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Map as MapIcon, List, Search, X, Plus, MapPin } from 'react-feather';
import { useFamilyPerspective } from '@/context/FamilyPerspectiveContext';
import { useFocusPersonId } from '@/hooks/useFocusPersonId';
import { useFamilyMapPage } from '@/hooks/useFamilyMapPage';
import { buildMapMemberEntries } from '@/utils/mapGeocoding';
import type { Person, TreeLineage } from '@/types/person';
import { TREE_LINEAGE_OPTIONS } from '@/types/person';
import { FamilyMapCanvas } from './components/FamilyMapCanvas';
import { MapMemberList } from './components/MapMemberList';
import { PersonDetailModal } from '@/features/family-data/components/PersonDetailModal';
import { PersonFormModal } from '@/features/family-data/components/PersonFormModal';

type MobileTab = 'map' | 'list';

export function FamilyMapPage() {
  const {
    focusShortLabel,
    theme,
    me,
  } = useFamilyPerspective();
  const focusPersonId = useFocusPersonId();

  const [searchParams] = useSearchParams();

  const [search, setSearch] = useState('');
  const [lineageFilter, setLineageFilter] = useState<TreeLineage>('both');
  const [cityFilter, setCityFilter] = useState('');
  const [provinceFilter, setProvinceFilter] = useState('');
  const [aliveOnly, setAliveOnly] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>('map');
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [detailTarget, setDetailTarget] = useState<Person | null>(null);
  const [personToEdit, setPersonToEdit] = useState<Person | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const {
    source,
    persons: mapPersons,
    allPersons,
    meta,
    isLoading,
    error,
    saveAddress,
  } = useFamilyMapPage({
    focusPersonId,
    lineage: lineageFilter,
    status: aliveOnly ? 'alive' : 'all',
    city: cityFilter,
    province: provinceFilter,
    search,
  });

  const allEntries = useMemo(
    () => buildMapMemberEntries(mapPersons),
    [mapPersons],
  );

  const cityOptions = useMemo(() => {
    const cities = allEntries
      .map((e) => e.person.address?.city?.trim())
      .filter((c): c is string => !!c);
    return [...new Set(cities)].sort((a, b) => a.localeCompare(b, 'id'));
  }, [allEntries]);

  const provinceOptions = useMemo(() => {
    const provinces = allEntries
      .map((e) => e.person.address?.province?.trim())
      .filter((p): p is string => !!p);
    return [...new Set(provinces)].sort((a, b) => a.localeCompare(b, 'id'));
  }, [allEntries]);

  const filteredEntries = useMemo(() => allEntries, [allEntries]);

  const pins = useMemo(
    () =>
      filteredEntries
        .map((e) => e.pin)
        .filter((p): p is NonNullable<typeof p> => p !== null),
    [filteredEntries],
  );

  const stats = useMemo(
    () => ({
      total: meta?.totalVisible ?? mapPersons.length,
      withAddress: meta?.withAddress ?? allEntries.length,
      onMap: meta?.withExactCoords ?? pins.length,
    }),
    [meta, mapPersons.length, allEntries.length, pins.length],
  );

  const filtersActive =
    search.trim() !== '' ||
    lineageFilter !== 'both' ||
    cityFilter !== '' ||
    provinceFilter !== '' ||
    aliveOnly;

  useEffect(() => {
    const personParam = searchParams.get('person');
    if (personParam) {
      setSelectedPersonId(personParam);
      setMobileTab('map');
    }
  }, [searchParams]);

  const resetFilters = () => {
    setSearch('');
    setLineageFilter('both');
    setCityFilter('');
    setProvinceFilter('');
    setAliveOnly(false);
  };

  const handleSelectPerson = (personId: string) => {
    setSelectedPersonId(personId);
    const entry = filteredEntries.find((e) => e.person.id === personId);
    if (entry?.pin) setMobileTab('map');
  };

  const handleDetail = (personId: string) => {
    const person = allPersons.find((p) => p.id === personId);
    if (person) setDetailTarget(person);
  };

  const openEdit = (person: Person) => {
    setPersonToEdit(person);
    setIsFormOpen(true);
  };

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-bold text-brand-700">Peta Keluarga</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Sebaran alamat · fokus{' '}
            <span className={`font-medium ${theme.accentText}`}>
              {focusShortLabel}
            </span>
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {stats.withAddress} dengan alamat · {stats.onMap} di peta
            {source === 'api' && (
              <span className="ml-2 text-primary-500">· API</span>
            )}
          </p>
        </div>
        <Link
          to="/family/data"
          className="inline-flex items-center gap-2 bg-white border border-gray-200 hover:border-primary-300 text-brand-700 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors self-start"
        >
          <Plus size={16} />
          Kelola Alamat
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="mb-4 text-sm text-gray-500">Memuat peta keluarga…</div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4 space-y-3">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama atau alamat..."
            className="block w-full pl-10 pr-4 py-2.5 rounded-xl border-gray-300 text-sm focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        {/* Garis keturunan */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
            Garis Keluarga
          </p>
          <div className="flex flex-wrap gap-2">
            {TREE_LINEAGE_OPTIONS.map(({ value, label, desc }) => (
              <button
                key={value}
                type="button"
                onClick={() => setLineageFilter(value)}
                title={desc}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  lineageFilter === value
                    ? 'border-primary-500 bg-primary-500 text-white shadow-sm'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-primary-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {lineageFilter !== 'both' && (
            <p className="text-[10px] text-gray-400 mt-1.5">
              {lineageFilter === 'paternal'
                ? 'Menampilkan garis ayah ke atas beserta keluarga terkait'
                : 'Menampilkan garis ibu ke atas beserta keluarga terkait'}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {cityOptions.length > 0 && (
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="rounded-lg border-gray-300 text-sm py-1.5 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Semua kota</option>
              {cityOptions.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          )}
          {provinceOptions.length > 0 && (
            <select
              value={provinceFilter}
              onChange={(e) => setProvinceFilter(e.target.value)}
              className="rounded-lg border-gray-300 text-sm py-1.5 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Semua provinsi</option>
              {provinceOptions.map((prov) => (
                <option key={prov} value={prov}>
                  {prov}
                </option>
              ))}
            </select>
          )}
          <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={aliveOnly}
              onChange={(e) => setAliveOnly(e.target.checked)}
              className="rounded border-gray-300 text-primary-500 focus:ring-primary-500"
            />
            Hanya yang hidup
          </label>
          {filtersActive && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 font-medium"
            >
              <X size={12} />
              Reset
            </button>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 pt-1 border-t border-gray-50 text-[10px] text-gray-500">
          <span className="inline-flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-blue-500" /> Laki-laki
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-pink-500" /> Perempuan
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-slate-400" /> Meninggal
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-3 h-3 rounded-full border-2 border-amber-400 bg-blue-500" />{' '}
            Perkiraan kota
          </span>
        </div>
      </div>

      {/* Mobile tab toggle */}
      <div className="md:hidden flex gap-1 p-1 rounded-xl bg-gray-100 border border-gray-200 mb-4">
        <button
          type="button"
          onClick={() => setMobileTab('map')}
          className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            mobileTab === 'map'
              ? 'bg-white text-brand-700 shadow-sm'
              : 'text-gray-500'
          }`}
        >
          <MapIcon size={16} />
          Peta
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('list')}
          className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            mobileTab === 'list'
              ? 'bg-white text-brand-700 shadow-sm'
              : 'text-gray-500'
          }`}
        >
          <List size={16} />
          Daftar ({filteredEntries.length})
        </button>
      </div>

      {/* Main layout */}
      {filteredEntries.length === 0 && pins.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-20 text-center">
          <MapPin size={40} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-600 font-medium">
            {filtersActive
              ? 'Tidak ada anggota pada filter ini'
              : 'Belum ada alamat keluarga'}
          </p>
          <p className="text-sm text-gray-400 mt-1 mb-5">
            Tambahkan alamat anggota untuk melihat sebaran di peta
          </p>
          <Link
            to="/family/data"
            className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold"
          >
            <Plus size={16} />
            Tambah Alamat
          </Link>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-4 md:h-[calc(100vh-18rem)] min-h-[480px]">
          {/* Sidebar */}
          <div
            className={`md:w-80 flex-shrink-0 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col ${
              mobileTab === 'list' ? 'block' : 'hidden md:flex'
            }`}
          >
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/80">
              <p className="text-sm font-semibold text-brand-700">
                Daftar Anggota
              </p>
              <p className="text-xs text-gray-400">
                {filteredEntries.length} anggota · klik untuk fokus peta
              </p>
            </div>
            <div className="flex-1 overflow-y-auto">
              <MapMemberList
                entries={filteredEntries}
                selectedPersonId={selectedPersonId}
                onSelect={handleSelectPerson}
              />
            </div>
          </div>

          {/* Map */}
          <div
            className={`flex-1 min-h-[360px] md:min-h-0 rounded-2xl overflow-hidden border border-gray-100 shadow-sm ${
              mobileTab === 'map' ? 'block' : 'hidden md:block'
            }`}
          >
            {pins.length > 0 ? (
              <FamilyMapCanvas
                pins={pins}
                selectedPersonId={selectedPersonId}
                onDetail={handleDetail}
                onSelectPerson={handleSelectPerson}
              />
            ) : (
              <div className="h-full min-h-[360px] flex items-center justify-center bg-gray-50 text-center px-6">
                <div>
                  <MapPin size={36} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-sm text-gray-500 font-medium">
                    Alamat ada tapi belum bisa di-pin
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Isi kota/provinsi yang dikenali atau tambahkan koordinat
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <PersonDetailModal
        isOpen={detailTarget !== null}
        onClose={() => setDetailTarget(null)}
        person={detailTarget}
        allPersons={allPersons}
        currentUserId={me?.id}
        onEdit={openEdit}
      />

      <PersonFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        personToEdit={personToEdit}
        onSave={async (data) => {
          if (personToEdit) {
            await saveAddress(personToEdit, data.address);
          }
        }}
        persons={allPersons}
      />
    </>
  );
}
