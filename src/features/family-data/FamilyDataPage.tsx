import { useState, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, ChevronLeft, ChevronRight, Users, Filter, X } from 'react-feather';
import type { Gender, LifeStatus, Person } from '@/types/person';
import { useFamily } from '@/context/FamilyDataContext';
import { useFamilyPerspective } from '@/context/FamilyPerspectiveContext';
import { PersonFormModal } from './components/PersonFormModal';
import { DeleteConfirmDialog } from './components/DeleteConfirmDialog';

const PAGE_SIZE = 15;

type Filters = {
  status: LifeStatus | 'all';
  gender: Gender | 'all';
  generationLabel: string;
};

const DEFAULT_FILTERS: Filters = {
  status: 'all',
  gender: 'all',
  generationLabel: '',
};

function isDefaultFilters(f: Filters) {
  return f.status === 'all' && f.gender === 'all' && f.generationLabel === '';
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

function PersonAvatar({ person }: { person: Person }) {
  const colorClass =
    person.gender === 'male'
      ? 'bg-blue-100 text-blue-700'
      : 'bg-pink-100 text-pink-700';

  if (person.photoUrl) {
    return (
      <img
        src={person.photoUrl}
        alt={person.fullName}
        className="w-9 h-9 rounded-full object-cover flex-shrink-0"
      />
    );
  }

  return (
    <div
      className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${colorClass}`}
    >
      {getInitials(person.fullName)}
    </div>
  );
}

function StatusBadge({ status }: { status: Person['status'] }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        status === 'alive'
          ? 'bg-green-100 text-green-700'
          : 'bg-gray-100 text-gray-600'
      }`}
    >
      {status === 'alive' ? 'Hidup' : 'Meninggal'}
    </span>
  );
}

export function FamilyDataPage() {
  const { persons: allPersons, addPerson, updatePerson, deletePerson } = useFamily();
  const {
    visiblePersons,
    focusPerson,
    focusShortLabel,
    theme,
  } = useFamilyPerspective();

  const persons = visiblePersons;

  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [personToEdit, setPersonToEdit] = useState<Person | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Person | null>(null);

  const generationOptions = useMemo(() => {
    const labels = persons
      .map((p) => p.generationLabel)
      .filter((l): l is string => !!l);
    return [...new Set(labels)].sort();
  }, [persons]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return persons.filter((p) => {
      if (q && !p.fullName.toLowerCase().includes(q) &&
          !(p.nickname ?? '').toLowerCase().includes(q) &&
          !(p.generationLabel ?? '').toLowerCase().includes(q)) return false;
      if (filters.status !== 'all' && p.status !== filters.status) return false;
      if (filters.gender !== 'all' && p.gender !== filters.gender) return false;
      if (filters.generationLabel && p.generationLabel !== filters.generationLabel) return false;
      return true;
    });
  }, [persons, search, filters]);

  const setFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  };

  const activeFilterCount = [
    filters.status !== 'all',
    filters.gender !== 'all',
    filters.generationLabel !== '',
  ].filter(Boolean).length;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const filtersActive = !isDefaultFilters(filters);

  const openAdd = () => {
    setPersonToEdit(null);
    setIsFormOpen(true);
  };

  const openEdit = (person: Person) => {
    setPersonToEdit(person);
    setIsFormOpen(true);
  };

  const openDelete = (person: Person) => {
    setDeleteTarget(person);
  };

  const handleSave = (data: Omit<Person, 'id'>) => {
    if (personToEdit) {
      updatePerson({ ...data, id: personToEdit.id });
    } else {
      addPerson(data);
    }
  };

  const handleConfirmDelete = () => {
    if (deleteTarget) deletePerson(deleteTarget.id);
  };

  return (
    <>
      {/* ── Page header ──────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-700">
            Data Anggota Keluarga
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {persons.length} anggota · fokus{' '}
            <span className={`font-medium ${theme.accentText}`}>
              {focusShortLabel}
            </span>
          </p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus size={18} />
          Tambah Anggota
        </button>
      </div>

      {/* ── Search + Filter bar ──────────────────────────── */}
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Cari nama anggota keluarga..."
            className="block w-full pl-10 pr-4 py-2.5 rounded-xl border-gray-300 shadow-sm text-sm focus:ring-primary-500 focus:border-primary-500"
          />
          {search && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Hapus pencarian"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
            showFilters || filtersActive
              ? 'border-primary-400 bg-primary-50 text-primary-700'
              : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Filter size={15} />
          <span className="hidden sm:inline">Filter</span>
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-primary-500 text-white text-xs flex items-center justify-center leading-none">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Filter panel ─────────────────────────────────── */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-brand-700">Filter</p>
            {filtersActive && (
              <button
                onClick={resetFilters}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
              >
                <X size={12} /> Reset semua
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Status */}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Status</p>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { value: 'all', label: 'Semua' },
                    { value: 'alive', label: '🟢 Hidup' },
                    { value: 'deceased', label: '⚫ Meninggal' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFilter('status', opt.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      filters.status === opt.value
                        ? 'border-primary-500 bg-primary-500 text-white'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-primary-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Gender */}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Jenis Kelamin</p>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { value: 'all', label: 'Semua' },
                    { value: 'male', label: '♂ Laki-laki' },
                    { value: 'female', label: '♀ Perempuan' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFilter('gender', opt.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      filters.gender === opt.value
                        ? 'border-primary-500 bg-primary-500 text-white'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-primary-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Generasi */}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Hubungan / Generasi</p>
              <select
                value={filters.generationLabel}
                onChange={(e) => setFilter('generationLabel', e.target.value)}
                className="block w-full rounded-lg border-gray-300 text-sm focus:ring-primary-500 focus:border-primary-500 py-1.5"
              >
                <option value="">Semua generasi</option>
                {generationOptions.map((label) => (
                  <option key={label} value={label}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active filter chips summary */}
          {filtersActive && (
            <div className="flex flex-wrap gap-2 pt-1 border-t border-gray-100">
              {filters.status !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-medium">
                  Status: {filters.status === 'alive' ? 'Hidup' : 'Meninggal'}
                  <button onClick={() => setFilter('status', 'all')} className="hover:text-primary-900">
                    <X size={11} />
                  </button>
                </span>
              )}
              {filters.gender !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-medium">
                  {filters.gender === 'male' ? 'Laki-laki' : 'Perempuan'}
                  <button onClick={() => setFilter('gender', 'all')} className="hover:text-primary-900">
                    <X size={11} />
                  </button>
                </span>
              )}
              {filters.generationLabel && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-medium">
                  {filters.generationLabel}
                  <button onClick={() => setFilter('generationLabel', '')} className="hover:text-primary-900">
                    <X size={11} />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Empty state ──────────────────────────────────── */}
      {filtered.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 py-16 flex flex-col items-center text-center">
          <Users className="text-gray-300 mb-3" size={40} />
          <p className="text-gray-500 font-medium">Tidak ada anggota ditemukan</p>
          {(search || filtersActive) && (
            <p className="text-gray-400 text-sm mt-1">
              Coba kata kunci lain atau{' '}
              <button
                onClick={() => { handleSearchChange(''); resetFilters(); }}
                className="text-primary-500 hover:underline"
              >
                hapus semua filter
              </button>
            </p>
          )}
        </div>
      )}

      {/* ── Desktop table ────────────────────────────────── */}
      {filtered.length > 0 && (
        <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Nama
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Tanggal Lahir
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Hubungan
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.map((person) => {
                  const isFocus = person.id === focusPerson?.id;
                  return (
                  <tr
                    key={person.id}
                    className={`transition-colors ${
                      isFocus
                        ? `${theme.accentBg} border-l-4 ${theme.accentBorder}`
                        : 'hover:bg-gray-50/60'
                    }`}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <PersonAvatar person={person} />
                        <div>
                          <p className="text-sm font-semibold text-brand-700 leading-tight">
                            {person.fullName}
                            {isFocus && (
                              <span className={`ml-2 text-xs font-normal px-1.5 py-0.5 rounded ${theme.accentBg} ${theme.accentText}`}>
                                Fokus
                              </span>
                            )}
                            {person.isSelf && !isFocus && (
                              <span className="ml-2 text-xs font-normal text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded">
                                Kamu
                              </span>
                            )}
                          </p>
                          {person.nickname && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              "{person.nickname}"
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">
                      {formatDate(person.birthDate)}
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-gray-600">
                        {person.generationLabel ?? '—'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={person.status} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(person)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-primary-600 hover:bg-primary-50 transition-colors"
                          aria-label={`Edit ${person.fullName}`}
                        >
                          <Edit2 size={13} />
                          Edit
                        </button>
                        <button
                          onClick={() => openDelete(person)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
                          aria-label={`Hapus ${person.fullName}`}
                          disabled={person.isSelf}
                          title={person.isSelf ? 'Tidak bisa menghapus diri sendiri' : undefined}
                        >
                          <Trash2 size={13} />
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-500">
                Menampilkan {(safePage - 1) * PAGE_SIZE + 1}–
                {Math.min(safePage * PAGE_SIZE, filtered.length)} dari{' '}
                {filtered.length} anggota
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={safePage === 1}
                  className="p-1.5 rounded-lg text-gray-500 hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (n) => (
                    <button
                      key={n}
                      onClick={() => setPage(n)}
                      className={`w-7 h-7 rounded-lg text-xs font-medium transition-all ${
                        n === safePage
                          ? 'bg-primary-500 text-white shadow-sm'
                          : 'text-gray-600 hover:bg-white hover:shadow-sm'
                      }`}
                    >
                      {n}
                    </button>
                  ),
                )}
                <button
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={safePage === totalPages}
                  className="p-1.5 rounded-lg text-gray-500 hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Mobile card list ─────────────────────────────── */}
      {filtered.length > 0 && (
        <div className="md:hidden space-y-3">
          {paginated.map((person) => {
            const isFocus = person.id === focusPerson?.id;
            return (
            <div
              key={person.id}
              className={`rounded-2xl shadow-sm border p-4 ${
                isFocus
                  ? `${theme.accentBg} ${theme.accentBorder} border-2`
                  : 'bg-white border-gray-100'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <PersonAvatar person={person} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-brand-700 truncate leading-tight">
                      {person.fullName}
                      {isFocus && (
                        <span className={`ml-2 text-xs font-normal px-1.5 py-0.5 rounded ${theme.accentBg} ${theme.accentText}`}>
                          Fokus
                        </span>
                      )}
                      {person.isSelf && !isFocus && (
                        <span className="ml-2 text-xs font-normal text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded">
                          Kamu
                        </span>
                      )}
                    </p>
                    {person.nickname && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        "{person.nickname}"
                      </p>
                    )}
                  </div>
                </div>
                <StatusBadge status={person.status} />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-1 text-xs text-gray-500">
                <span>
                  📅 {formatDate(person.birthDate)}
                </span>
                {person.generationLabel && (
                  <span>👨‍👩‍👧 {person.generationLabel}</span>
                )}
                {person.occupation && (
                  <span className="col-span-2">💼 {person.occupation}</span>
                )}
              </div>

              <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
                <button
                  onClick={() => openEdit(person)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 transition-colors"
                >
                  <Edit2 size={13} />
                  Edit
                </button>
                <button
                  onClick={() => openDelete(person)}
                  disabled={person.isSelf}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-red-500 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Trash2 size={13} />
                  Hapus
                </button>
              </div>
            </div>
          );
          })}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={safePage === 1}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 disabled:opacity-30"
              >
                ← Sebelumnya
              </button>
              <span className="text-xs text-gray-500">
                {safePage} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={safePage === totalPages}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 disabled:opacity-30"
              >
                Berikutnya →
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Modals ───────────────────────────────────────── */}
      <PersonFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        personToEdit={personToEdit}
        onSave={handleSave}
        persons={allPersons}
      />

      <DeleteConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        personName={deleteTarget?.fullName ?? ''}
      />
    </>
  );
}
