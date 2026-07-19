import type { Gender, LifeStatus, Religion } from '@/types/person';

export type PersonImportDraft = {
  fullName: string;
  nickname?: string;
  gender: Gender;
  birthDate: string;
  status: LifeStatus;
  deathDate?: string;
  religion?: Religion;
  occupation?: string;
  phone?: string;
  phoneAlt?: string;
  street?: string;
  district?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  generationLabel?: string;
  fatherName?: string;
  motherName?: string;
  spouseNames?: string;
};

export type PersonImportPreviewRow = {
  rowNumber: number;
  draft?: PersonImportDraft;
  errors: string[];
};

export type PersonImportResult = {
  imported: number;
  skipped: number;
  rows: PersonImportPreviewRow[];
};

const CSV_HEADERS = [
  'fullName',
  'nickname',
  'gender',
  'birthDate',
  'status',
  'deathDate',
  'religion',
  'occupation',
  'phone',
  'phoneAlt',
  'street',
  'district',
  'city',
  'province',
  'postalCode',
  'latitude',
  'longitude',
  'generationLabel',
  'fatherName',
  'motherName',
  'spouseNames',
] as const;

export const PERSON_IMPORT_TEMPLATE_CSV = [
  CSV_HEADERS.join(','),
  'Budi Santoso,Budi,male,1985-06-15,alive,,islam,Guru,081234567890,,Jl. Merdeka No. 1,Klojen,Kota Malang,Jawa Timur,65111,,,Paman,,,',
  'Siti Rahayu,Ibu Siti,female,1988-03-20,alive,,islam,Ibu RT,081298765432,,Jl. Diponegoro No. 5,Lowokwaru,Kota Malang,Jawa Timur,65141,,,Bibi,,,',
].join('\n');

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === ',' && !inQuotes) {
      cells.push(current.trim());
      current = '';
      continue;
    }
    current += ch;
  }

  cells.push(current.trim());
  return cells;
}

function parseCsv(text: string): string[][] {
  return text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map(parseCsvLine);
}

function cell(row: Record<string, string>, key: string): string {
  return (row[key] ?? '').trim();
}

function parseGender(raw: string): Gender | null {
  const value = raw.trim().toLowerCase();
  if (['male', 'm', 'l', 'laki', 'laki-laki', 'pria'].includes(value)) {
    return 'male';
  }
  if (['female', 'f', 'p', 'perempuan', 'wanita'].includes(value)) {
    return 'female';
  }
  return null;
}

function parseStatus(raw: string): LifeStatus | null {
  const value = raw.trim().toLowerCase();
  if (['alive', 'hidup', 'live'].includes(value)) return 'alive';
  if (['deceased', 'meninggal', 'dead'].includes(value)) return 'deceased';
  return null;
}

function parseReligion(raw: string): Religion | undefined {
  const value = raw.trim().toLowerCase();
  if (!value) return undefined;
  if (value === 'islam') return 'islam';
  if (value === 'other' || value === 'lainnya') return 'other';
  return undefined;
}

function parseIsoDate(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return null;
}

function parseOptionalNumber(raw: string): number | undefined {
  const value = raw.trim();
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function rowToRecord(headers: string[], values: string[]): Record<string, string> {
  const record: Record<string, string> = {};
  headers.forEach((header, index) => {
    record[header] = values[index] ?? '';
  });
  return record;
}

function normalizeHeader(header: string): string {
  return header.trim().replace(/\s+/g, '');
}

function validateDraft(record: Record<string, string>): PersonImportPreviewRow {
  const errors: string[] = [];
  const fullName = cell(record, 'fullName');

  if (!fullName) errors.push('Nama lengkap wajib diisi.');

  const gender = parseGender(cell(record, 'gender'));
  if (!gender) errors.push('Jenis kelamin wajib (male/female atau laki-laki/perempuan).');

  const birthDate = parseIsoDate(cell(record, 'birthDate'));
  if (!birthDate) {
    errors.push('Tanggal lahir wajib format YYYY-MM-DD.');
  }

  const statusRaw = cell(record, 'status');
  const status = statusRaw ? parseStatus(statusRaw) : 'alive';
  if (!status) errors.push('Status wajib alive/hidup atau deceased/meninggal.');

  const deathDateRaw = cell(record, 'deathDate');
  const deathDate = deathDateRaw ? parseIsoDate(deathDateRaw) : undefined;
  if (deathDateRaw && !deathDate) {
    errors.push('Tanggal meninggal harus format YYYY-MM-DD.');
  }

  const latitude = parseOptionalNumber(cell(record, 'latitude'));
  const longitude = parseOptionalNumber(cell(record, 'longitude'));
  if (cell(record, 'latitude') && latitude == null) {
    errors.push('Latitude tidak valid.');
  }
  if (cell(record, 'longitude') && longitude == null) {
    errors.push('Longitude tidak valid.');
  }

  if (errors.length > 0) {
    return { rowNumber: 0, errors };
  }

  const draft: PersonImportDraft = {
    fullName,
    nickname: cell(record, 'nickname') || undefined,
    gender: gender!,
    birthDate: birthDate!,
    status: status!,
    deathDate: status === 'deceased' ? deathDate ?? undefined : undefined,
    religion:
      status === 'deceased' ? parseReligion(cell(record, 'religion')) : undefined,
    occupation: cell(record, 'occupation') || undefined,
    phone: cell(record, 'phone') || undefined,
    phoneAlt: cell(record, 'phoneAlt') || undefined,
    street: cell(record, 'street') || undefined,
    district: cell(record, 'district') || undefined,
    city: cell(record, 'city') || undefined,
    province: cell(record, 'province') || undefined,
    postalCode: cell(record, 'postalCode') || undefined,
    latitude,
    longitude,
    generationLabel: cell(record, 'generationLabel') || undefined,
    fatherName: cell(record, 'fatherName') || undefined,
    motherName: cell(record, 'motherName') || undefined,
    spouseNames: cell(record, 'spouseNames') || undefined,
  };

  return { rowNumber: 0, draft, errors: [] };
}

export function parsePersonImportCsv(text: string): PersonImportResult {
  const table = parseCsv(text);
  if (table.length === 0) {
    return {
      imported: 0,
      skipped: 0,
      rows: [{ rowNumber: 1, errors: ['File CSV kosong.'] }],
    };
  }

  const headers = table[0].map(normalizeHeader);
  const missingRequired = ['fullName', 'gender', 'birthDate'].filter(
    (key) => !headers.includes(key),
  );
  if (missingRequired.length > 0) {
    return {
      imported: 0,
      skipped: 0,
      rows: [
        {
          rowNumber: 1,
          errors: [`Kolom wajib tidak ditemukan: ${missingRequired.join(', ')}`],
        },
      ],
    };
  }

  const rows: PersonImportPreviewRow[] = [];
  let validCount = 0;

  for (let i = 1; i < table.length; i += 1) {
    const record = rowToRecord(headers, table[i]);
    const parsed = validateDraft(record);
    parsed.rowNumber = i + 1;
    rows.push(parsed);
    if (parsed.draft && parsed.errors.length === 0) validCount += 1;
  }

  return {
    imported: validCount,
    skipped: rows.length - validCount,
    rows,
  };
}

export function getValidImportDrafts(
  rows: PersonImportPreviewRow[],
): PersonImportDraft[] {
  return rows
    .filter((row) => row.draft && row.errors.length === 0)
    .map((row) => row.draft!);
}

export function downloadPersonImportTemplate() {
  const blob = new Blob([PERSON_IMPORT_TEMPLATE_CSV], {
    type: 'text/csv;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'template-import-anggota.csv';
  anchor.click();
  URL.revokeObjectURL(url);
}
