import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, List, Code } from 'react-feather';
import { useEffect } from 'react';

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
        class:
          'prose prose-sm sm:prose-base dark:prose-invert max-w-none focus:outline-none min-h-[150px] px-3 py-2',
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

  return (
    <div className="rounded-xl border border-suite-border bg-suite-surface">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-suite-border p-2">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`rounded-lg p-1.5 transition-colors ${
            editor.isActive('bold')
              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
              : 'text-suite-muted hover:bg-suite-soft'
          }`}
          title="Bold"
        >
          <Bold size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`rounded-lg p-1.5 transition-colors ${
            editor.isActive('italic')
              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
              : 'text-suite-muted hover:bg-suite-soft'
          }`}
          title="Italic"
        >
          <Italic size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`rounded-lg p-1.5 transition-colors ${
            editor.isActive('bulletList')
              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
              : 'text-suite-muted hover:bg-suite-soft'
          }`}
          title="Bullet List"
        >
          <List size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`rounded-lg p-1.5 transition-colors ${
            editor.isActive('codeBlock')
              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
              : 'text-suite-muted hover:bg-suite-soft'
          }`}
          title="Code Block"
        >
          <Code size={16} />
        </button>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />
    </div>
  );
}
