import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, List, Code } from 'react-feather';
import { useEffect } from 'react';
import { RICH_TEXT_CLASS } from '../lib/taskMeta';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  onImagePaste?: (file: File) => Promise<string>;
  taskId?: string;
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = 'Tulis sesuatu...',
  onImagePaste,
  taskId,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      // Guard isDestroyed: callback bisa terpanggil saat teardown (StrictMode).
      if (editor.isDestroyed) return;
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: `${RICH_TEXT_CLASS} min-h-[160px] px-4 py-3 focus:outline-none`,
      },
      handlePaste: (view, event) => {
        if (!onImagePaste || !taskId) return false;

        const items = event.clipboardData?.items;
        if (!items) return false;

        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.type.indexOf('image') !== -1) {
            const file = item.getAsFile();
            if (file) {
              event.preventDefault();

              // Insert loading indicator
              const { schema } = view.state;
              const node = schema.nodes.image.create({
                src: '',
                alt: 'Uploading...',
              });
              const transaction = view.state.tr.insert(
                view.state.selection.from,
                node,
              );
              view.dispatch(transaction);

              // Upload image
              onImagePaste(file).then((url) => {
                // Replace with actual URL
                const { from } = view.state.selection;
                const newNode = schema.nodes.image.create({
                  src: url,
                  alt: file.name,
                });
                const newTransaction = view.state.tr.replaceWith(
                  from - 1,
                  from,
                  newNode,
                );
                view.dispatch(newTransaction);
              });

              return true;
            }
          }
        }
        return false;
      },
    },
  });

  // Sinkronkan konten dari prop. Guard isDestroyed: di StrictMode/dev, cleanup
  // unmount bisa melepas editor tepat saat effect ini jalan (schema jadi null
  // dan editor.getHTML()/setContent() melempar "schema.cached" null).
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    if (content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor || editor.isDestroyed) {
    return null;
  }

  const toolbarButtonClass = (active: boolean) =>
    [
      'inline-flex h-8 w-8 items-center justify-center rounded-control transition-colors',
      active
        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300'
        : 'text-suite-muted hover:bg-suite-soft hover:text-suite-ink',
    ].join(' ');

  return (
    <div className="overflow-hidden rounded-card border border-suite-border bg-suite-surface">
      <div className="flex flex-wrap items-center gap-1 border-b border-suite-border bg-suite-soft/50 px-2 py-1.5">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={toolbarButtonClass(editor.isActive('bold'))}
          title="Bold"
        >
          <Bold size={15} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={toolbarButtonClass(editor.isActive('italic'))}
          title="Italic"
        >
          <Italic size={15} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={toolbarButtonClass(editor.isActive('bulletList'))}
          title="Bullet List"
        >
          <List size={15} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={toolbarButtonClass(editor.isActive('codeBlock'))}
          title="Code Block"
        >
          <Code size={15} />
        </button>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}
