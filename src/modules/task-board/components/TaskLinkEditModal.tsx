import { useEffect, useState } from 'react';
import { Save } from 'react-feather';
import { ModalShell, FieldInput, FieldLabel, FieldSelect, PrimaryButton, SecondaryButton } from '@/shared/ui';
import { LINK_META } from '../lib/taskMeta';
import type { LinkType } from '../types';

const LINK_TYPE_OPTIONS: { value: LinkType; label: string }[] = [
  { value: 'discord', label: LINK_META.discord.label },
  { value: 'notion', label: LINK_META.notion.label },
  { value: 'mr', label: LINK_META.mr.label },
];

interface TaskLinkEditModalProps {
  isOpen: boolean;
  mode?: 'add' | 'edit';
  initialType: LinkType;
  initialUrl: string;
  saving?: boolean;
  onClose: () => void;
  onSave: (type: LinkType, url: string) => void;
}

function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

/** Tambah/edit satu link (Discord / Notion / MR) dari halaman detail. */
export function TaskLinkEditModal({
  isOpen,
  mode = 'add',
  initialType,
  initialUrl,
  saving = false,
  onClose,
  onSave,
}: TaskLinkEditModalProps) {
  const [type, setType] = useState<LinkType>(initialType);
  const [url, setUrl] = useState(initialUrl);

  useEffect(() => {
    if (isOpen) {
      setType(initialType);
      setUrl(initialUrl);
    }
  }, [isOpen, initialType, initialUrl]);

  if (!isOpen) return null;

  const trimmed = url.trim();
  const canSave = trimmed.length > 0 && isValidUrl(trimmed) && !saving;

  return (
    <ModalShell
      accent="task"
      title={mode === 'add' ? 'Tambah Link' : 'Edit Link'}
      subtitle="Discord, Notion, atau Merge Request"
      onClose={onClose}
      titleId="task-link-edit-title"
      footer={
        <div className="flex justify-end gap-2">
          <div className="w-24">
            <SecondaryButton onClick={onClose} disabled={saving}>
              Batal
            </SecondaryButton>
          </div>
          <div className="w-36">
            <PrimaryButton
              accent="task"
              onClick={() => onSave(type, trimmed)}
              disabled={!canSave}
            >
              <span className="inline-flex items-center justify-center gap-1.5">
                <Save size={15} />
                {saving ? 'Menyimpan…' : mode === 'add' ? 'Tambah' : 'Simpan'}
              </span>
            </PrimaryButton>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <FieldLabel>Tipe</FieldLabel>
          <FieldSelect
            accent="task"
            value={type}
            onChange={setType}
            options={LINK_TYPE_OPTIONS}
          />
        </div>
        <div>
          <FieldLabel>URL</FieldLabel>
          <FieldInput
            accent="task"
            type="url"
            value={url}
            onChange={setUrl}
            placeholder="https://…"
          />
          {trimmed.length > 0 && !isValidUrl(trimmed) ? (
            <p className="mt-1 text-[11.5px] font-semibold text-rose-600 dark:text-rose-400">
              URL tidak valid.
            </p>
          ) : null}
        </div>
      </div>
    </ModalShell>
  );
}
