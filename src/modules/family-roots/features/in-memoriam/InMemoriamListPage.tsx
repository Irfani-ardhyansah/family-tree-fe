import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, BookOpen, Heart, ChevronRight, Calendar, X } from 'react-feather';
import { useFocusPersonId } from '@/shared/hooks/useFocusPersonId';
import { useMemoriamList } from '@/shared/hooks/useMemoriamList';
import {
  formatLifeSpan,
  getAlmarhumLabel,
  getMemorialEntryPath,
  getYearsSinceDeath,
} from '@/shared/utils/memoriamAccess';

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

function getDeathYear(deathDate?: string): number | null {
  if (!deathDate) return null;
  const year = new Date(deathDate).getFullYear();
  return Number.isNaN(year) ? null : year;
}

export function InMemoriamListPage() {
  const focusPersonId = useFocusPersonId();
  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState('');

  const {
    source,
    deceased: accessibleDeceased,
    deceasedAll,
    isLoading,
    error,
    getCounts,
  } = useMemoriamList(focusPersonId, search, yearFilter);

  const yearOptions = useMemo(() => {
    const years = deceasedAll
      .map((p) => getDeathYear(p.deathDate))
      .filter((y): y is number => y !== null);
    return [...new Set(years)].sort((a, b) => b - a);
  }, [deceasedAll]);

  const yearCounts = useMemo(() => {
    const counts = new Map<number, number>();
    for (const p of deceasedAll) {
      const y = getDeathYear(p.deathDate);
      if (y !== null) counts.set(y, (counts.get(y) ?? 0) + 1);
    }
    return counts;
  }, [deceasedAll]);

  const hasActiveFilters = yearFilter !== '' || search.trim() !== '';

  return (
    <div className="min-h-[calc(100dvh-4rem)] -mx-3 sm:-mx-6 lg:-mx-8 -my-4 sm:-my-6 lg:-my-8 bg-suite-bg px-3 sm:px-6 lg:px-8 py-5 sm:py-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-200/60 text-slate-600 text-xs font-medium mb-3">
            <BookOpen size={14} />
            Kenangan Keluarga
          </div>
          <h1 className="text-xl sm:text-3xl font-bold text-slate-800">
            In Memoriam
          </h1>
          <p className="text-sm text-slate-500 mt-2 max-w-xl">
            Kenangan dan doa untuk almarhum/almarhumah yang telah meninggalkan kita.
            {accessibleDeceased.length > 0 && (
              <span className="block mt-1 text-slate-400">
                {accessibleDeceased.length} almarhum
                {yearFilter ? ` pada tahun ${yearFilter}` : ''}
              </span>
            )}
            {source === 'api' && (
              <span className="block mt-1 text-primary-500 text-xs">Sumber: API</span>
            )}
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {isLoading && (
          <div className="mb-4 text-sm text-slate-500">Memuat daftar almarhum…</div>
        )}

        {/* Search */}
        <div className="relative mb-4">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama almarhum/almarhumah..."
            className="w-full pl-11 pr-10 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-slate-400 focus:border-slate-400 shadow-sm"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label="Hapus pencarian"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Year filter */}
        {yearOptions.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Calendar size={15} className="text-slate-400" />
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Meninggal pada tahun
              </p>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <button
                type="button"
                onClick={() => setYearFilter('')}
                className={`flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  yearFilter === ''
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                }`}
              >
                Semua tahun
                <span className={yearFilter === '' ? 'text-white/70' : 'text-slate-400'}>
                  {deceasedAll.length}
                </span>
              </button>
              {yearOptions.map((year) => (
                <button
                  key={year}
                  type="button"
                  onClick={() =>
                    setYearFilter(yearFilter === year.toString() ? '' : year.toString())
                  }
                  className={`flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    yearFilter === year.toString()
                      ? 'bg-slate-700 text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {year}
                  <span
                    className={
                      yearFilter === year.toString()
                        ? 'text-white/70'
                        : 'text-slate-400'
                    }
                  >
                    {yearCounts.get(year) ?? 0}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Active filter summary */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 mb-5">
            {yearFilter && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                Tahun {yearFilter}
                <button
                  type="button"
                  onClick={() => setYearFilter('')}
                  className="hover:text-slate-800"
                  aria-label="Hapus filter tahun"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {search.trim() && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                "{search.trim()}"
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="hover:text-slate-800"
                  aria-label="Hapus pencarian"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                setYearFilter('');
                setSearch('');
              }}
              className="text-xs text-slate-500 hover:text-slate-700 font-medium"
            >
              Reset filter
            </button>
          </div>
        )}

        {/* List */}
        {accessibleDeceased.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <Heart size={40} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-600 font-medium">
              {hasActiveFilters
                ? 'Tidak ada almarhum pada filter ini'
                : 'Belum ada kenangan yang dapat diakses'}
            </p>
            <p className="text-sm text-slate-400 mt-1">
              {yearFilter
                ? `Tidak ada yang meninggal pada tahun ${yearFilter}`
                : hasActiveFilters
                  ? 'Coba ubah kata kunci atau tahun'
                  : 'Kenangan akan muncul untuk anggota keluarga yang telah meninggal'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {accessibleDeceased.map((person) => {
              const label = getAlmarhumLabel(person.gender);
              const years = getYearsSinceDeath(person.deathDate);
              const deathYear = getDeathYear(person.deathDate);
              const { tributes: tributeCount, prayers: prayerCount } =
                getCounts(person.id);
              const entryPath = getMemorialEntryPath(person);

              return (
                <Link
                  key={person.id}
                  to={entryPath}
                  className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all overflow-hidden"
                >
                  <div className="p-5 flex gap-4">
                    <div className="flex-shrink-0">
                      {person.photoUrl ? (
                        <img
                          src={person.photoUrl}
                          alt={person.fullName}
                          className="w-16 h-16 rounded-xl object-cover bg-slate-100 grayscale"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-slate-200 flex items-center justify-center text-lg font-bold text-slate-500">
                          {getInitials(person.fullName)}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">
                            {label}
                          </p>
                          <h2 className="text-base font-bold text-slate-800 group-hover:text-slate-900 leading-snug">
                            {person.fullName}
                          </h2>
                          {person.nickname && (
                            <p className="text-xs text-slate-400 mt-0.5">
                              "{person.nickname}"
                            </p>
                          )}
                        </div>
                        <ChevronRight
                          size={18}
                          className="text-slate-300 group-hover:text-slate-500 flex-shrink-0 mt-1 transition-colors"
                        />
                      </div>

                      <p className="text-xs text-slate-500 mt-2">
                        {formatLifeSpan(person.birthDate, person.deathDate)}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        {deathYear !== null && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-700/10 text-slate-700 text-xs font-semibold">
                            <Calendar size={11} />
                            {deathYear}
                          </span>
                        )}
                        {years !== null && years > 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                            {years} tahun telah berlalu
                          </span>
                        )}
                        {tributeCount > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-50 text-slate-500 text-xs">
                            <BookOpen size={11} />
                            {tributeCount} kenangan
                          </span>
                        )}
                        {prayerCount > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-50 text-slate-500 text-xs">
                            <Heart size={11} />
                            {prayerCount} doa
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
