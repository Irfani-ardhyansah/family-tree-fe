export type PersonImportJobStatus =
  | 'queued'
  | 'validating'
  | 'importing'
  | 'completed'
  | 'failed';

export type PersonImportError = {
  row: number;
  tempId?: string;
  field?: string;
  message: string;
};

export type PersonImportPreviewRow = {
  tempId: string;
  fullName: string;
  gender: 'male' | 'female';
  birthDate: string;
  fatherTempId: string | null;
  motherTempId: string | null;
  spouseTempIds: string[];
  fatherId: number | null;
  motherId: number | null;
  spouseIds: number[];
};

export type PersonImportCreatedPerson = {
  id: number;
  tempId: string;
  fullName: string;
  fatherId: number | null;
  motherId: number | null;
  spouseIds: number[];
};

export type PersonImportResult = {
  dryRun: boolean;
  rowCount: number;
  createdCount: number;
  idByTempId: Record<string, number>;
  preview: PersonImportPreviewRow[];
  persons: PersonImportCreatedPerson[];
};

export type PersonImportJobResponse = {
  jobId: string;
  status: PersonImportJobStatus;
  dryRun: boolean;
  format: 'csv' | 'json';
  progress: { percent: number; processed: number; total: number };
  message: string | null;
  errors: PersonImportError[];
  result: PersonImportResult | null;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
};
