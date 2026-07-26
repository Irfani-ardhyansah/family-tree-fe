import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import {
  Bold,
  Italic,
  List,
  Link as LinkIcon,
  MessageSquare,
  RotateCcw,
  RotateCw,
  Type,
} from 'react-feather';

type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  hasError?: boolean;
};

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded-lg transition-colors ${
        active
          ? 'bg-slate-700 text-white'
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
      } disabled:opacity-30 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Tulis di sini...',
  hasError = false,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Placeholder.configure({ placeholder }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank',
          class: 'underline text-slate-700',
        },
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class:
          'min-h-[140px] px-4 py-3 text-sm text-slate-700 leading-relaxed focus:outline-none [&_p.is-editor-empty:first-child]:before:content-[attr(data-placeholder)] [&_p.is-editor-empty:first-child]:before:text-slate-400 [&_p.is-editor-empty:first-child]:before:float-left [&_p.is-editor-empty:first-child]:before:pointer-events-none [&_p.is-editor-empty:first-child]:before:h-0',
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value === '' && current !== '<p></p>') {
      editor.commands.clearContent();
    }
  }, [editor, value]);

  const setLink = () => {
    if (!editor) return;
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Masukkan URL tautan:', prev ?? 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  if (!editor) return null;

  return (
    <div
      className={`rounded-xl border bg-white overflow-hidden transition-colors ${
        hasError
          ? 'border-red-400 ring-1 ring-red-200'
          : 'border-gray-300 focus-within:border-slate-500 focus-within:ring-1 focus-within:ring-slate-500'
      }`}
    >
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-2 border-b border-slate-100 bg-slate-50/80">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="Tebal"
        >
          <Bold size={15} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="Miring"
        >
          <Italic size={15} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          title="Judul"
        >
          <Type size={15} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="Daftar"
        >
          <List size={15} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
          title="Kutipan"
        >
          <MessageSquare size={15} />
        </ToolbarButton>
        <ToolbarButton
          onClick={setLink}
          active={editor.isActive('link')}
          title="Tautan"
        >
          <LinkIcon size={15} />
        </ToolbarButton>

        <span className="w-px h-5 bg-slate-200 mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Urungkan"
        >
          <RotateCcw size={15} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Ulangi"
        >
          <RotateCw size={15} />
        </ToolbarButton>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}
