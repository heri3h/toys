'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link as LinkIcon,
  Image as ImageIcon,
  Minus,
  Eraser,
  Undo,
  Redo,
  Code,
  Eye,
  FileEdit,
  Sparkles,
  Upload,
  Check,
  X,
  ChevronDown,
  Highlighter,
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  onUpdateReadingTime?: (readingTime: string) => void;
}

const QUICK_EMOJIS = ['🏎️', '🚜', '🔋', '💡', '🧠', '🔥', '⭐', '🎯', '🚀', '✅', '🎮', '🏆'];

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  onUpdateReadingTime,
}) => {
  const [mode, setMode] = useState<'visual' | 'html' | 'preview'>('visual');
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);

  // Modals / Popovers
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');

  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');

  const [previewTruncated, setPreviewTruncated] = useState(true);

  // Sync external value into contentEditable when switching articles or switching back to visual mode
  useEffect(() => {
    if (mode === 'visual' && editorRef.current) {
      if (!isInternalChange.current && editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || '<p><br></p>';
      }
      isInternalChange.current = false;
    }
  }, [value, mode]);

  const emitChange = () => {
    if (editorRef.current) {
      isInternalChange.current = true;
      onChange(editorRef.current.innerHTML);
    }
  };

  const exec = (command: string, arg?: string) => {
    if (mode !== 'visual') return;
    editorRef.current?.focus();
    document.execCommand(command, false, arg);
    emitChange();
  };

  const applyHeading = (tag: 'H1' | 'H2' | 'H3' | 'P' | 'BLOCKQUOTE') => {
    if (mode !== 'visual') return;
    editorRef.current?.focus();
    document.execCommand('formatBlock', false, tag);
    emitChange();
  };

  const insertLeadParagraph = () => {
    if (mode !== 'visual') return;
    editorRef.current?.focus();
    const selection = window.getSelection();
    const selectedText = selection?.toString() || 'Tulis paragraf pembuka utama di sini...';
    document.execCommand(
      'insertHTML',
      false,
      `<p class="lead font-medium text-lg text-gray-700 leading-relaxed mb-6">${selectedText}</p><p><br></p>`
    );
    emitChange();
  };

  const insertEmoji = (emoji: string) => {
    if (mode !== 'visual') return;
    editorRef.current?.focus();
    document.execCommand('insertText', false, emoji);
    emitChange();
  };

  const handleInsertImage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl.trim()) return;
    if (mode === 'visual' && editorRef.current) {
      editorRef.current.focus();
      const html = `<img src="${imageUrl.trim()}" alt="${
        imageAlt.trim() || 'Article image'
      }" class="rounded-lg my-4 max-w-full h-auto mx-auto" /><p><br></p>`;
      document.execCommand('insertHTML', false, html);
      emitChange();
    } else {
      onChange(
        `${value}\n<img src="${imageUrl.trim()}" alt="${
          imageAlt.trim() || 'Article image'
        }" class="rounded-lg my-4 max-w-full h-auto mx-auto" />`
      );
    }
    setImageUrl('');
    setImageAlt('');
    setShowImageModal(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const json = await res.json();
      if (json.url) {
        setImageUrl(json.url);
        return;
      }
    } catch (err) {
      console.error('Upload failed, using fallback:', err);
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleInsertLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkUrl.trim()) return;
    if (mode === 'visual' && editorRef.current) {
      editorRef.current.focus();
      const text = linkText.trim() || linkUrl.trim();
      const html = `<a href="${linkUrl.trim()}" target="_blank" rel="noopener noreferrer">${text}</a>`;
      document.execCommand('insertHTML', false, html);
      emitChange();
    } else {
      const text = linkText.trim() || linkUrl.trim();
      onChange(`${value} <a href="${linkUrl.trim()}" target="_blank">${text}</a>`);
    }
    setLinkUrl('');
    setLinkText('');
    setShowLinkModal(false);
  };

  // Word count & reading time calculation
  const plainText = (value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const wordCount = plainText ? plainText.split(' ').length : 0;
  const charCount = plainText.length;
  const estimatedMinutes = Math.max(1, Math.ceil(wordCount / 180));

  return (
    <div className="border border-slate-700 rounded-xl overflow-hidden bg-slate-900 shadow-lg">
      {/* Top Mode Bar */}
      <div className="bg-slate-950 border-b border-slate-800 px-3 py-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setMode('visual')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              mode === 'visual'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <FileEdit className="w-3.5 h-3.5" />
            <span>Visual Blog Editor</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('html')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              mode === 'html'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>HTML Source</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('preview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              mode === 'preview'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview &quot;Read More&quot;</span>
          </button>
        </div>

        {/* Quick Emoji Bar */}
        {mode === 'visual' && (
          <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 mr-1">Emoji:</span>
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => insertEmoji(emoji)}
                className="hover:scale-125 transition-transform text-sm px-0.5"
                title={`Sisipkan ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Formatting Toolbar (Visual Mode Only) */}
      {mode === 'visual' && (
        <div className="bg-slate-900 border-b border-slate-800 p-2 flex flex-wrap items-center gap-1">
          {/* Undo / Redo */}
          <button
            type="button"
            onClick={() => exec('undo')}
            title="Undo (Ctrl+Z)"
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => exec('redo')}
            title="Redo (Ctrl+Y)"
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300"
          >
            <Redo className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-slate-800 mx-1" />

          {/* Paragraph & Headings */}
          <button
            type="button"
            onClick={() => applyHeading('P')}
            title="Normal Paragraph"
            className="px-2 py-1 rounded hover:bg-slate-800 text-xs font-semibold text-slate-300"
          >
            Normal
          </button>
          <button
            type="button"
            onClick={insertLeadParagraph}
            title="Paragraf Pembuka (Lead Paragraph di atas Read More)"
            className="flex items-center gap-1 px-2 py-1 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[11px] font-semibold"
          >
            <Sparkles className="w-3 h-3" />
            <span>Lead Intro</span>
          </button>
          <button
            type="button"
            onClick={() => applyHeading('H1')}
            title="Heading 1"
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300"
          >
            <Heading1 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => applyHeading('H2')}
            title="Heading 2 (Subjudul Bagian)"
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300"
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => applyHeading('H3')}
            title="Heading 3"
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300"
          >
            <Heading3 className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-slate-800 mx-1" />

          {/* Text Formatting */}
          <button
            type="button"
            onClick={() => exec('bold')}
            title="Bold (Ctrl+B)"
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => exec('italic')}
            title="Italic (Ctrl+I)"
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => exec('underline')}
            title="Underline (Ctrl+U)"
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300"
          >
            <Underline className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => exec('strikeThrough')}
            title="Strikethrough"
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300"
          >
            <Strikethrough className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => exec('hiliteColor', '#fef08a')}
            title="Highlight Kuning (Stabilo)"
            className="p-1.5 rounded hover:bg-slate-800 text-yellow-300"
          >
            <Highlighter className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-slate-800 mx-1" />

          {/* Alignment */}
          <button
            type="button"
            onClick={() => exec('justifyLeft')}
            title="Rata Kiri"
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => exec('justifyCenter')}
            title="Rata Tengah"
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300"
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => exec('justifyRight')}
            title="Rata Kanan"
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300"
          >
            <AlignRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => exec('justifyFull')}
            title="Justify (Rata Kiri-Kanan)"
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300"
          >
            <AlignJustify className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-slate-800 mx-1" />

          {/* Lists & Quote */}
          <button
            type="button"
            onClick={() => exec('insertUnorderedList')}
            title="Bullet List"
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => exec('insertOrderedList')}
            title="Numbered List"
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => applyHeading('BLOCKQUOTE')}
            title="Kutipan (Blockquote)"
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300"
          >
            <Quote className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-slate-800 mx-1" />

          {/* Media & Links */}
          <button
            type="button"
            onClick={() => {
              setShowImageModal(!showImageModal);
              setShowLinkModal(false);
            }}
            title="Sisipkan Gambar"
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
              showImageModal
                ? 'bg-blue-600 text-white'
                : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Image</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const sel = window.getSelection()?.toString() || '';
              setLinkText(sel);
              setShowLinkModal(!showLinkModal);
              setShowImageModal(false);
            }}
            title="Sisipkan Link"
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
              showLinkModal
                ? 'bg-blue-600 text-white'
                : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <LinkIcon className="w-4 h-4" />
            <span>Link</span>
          </button>

          <button
            type="button"
            onClick={() => exec('insertHorizontalRule')}
            title="Garis Pemisah (Divider)"
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300"
          >
            <Minus className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => exec('removeFormat')}
            title="Bersihkan Format Teks (Clear Formatting)"
            className="p-1.5 rounded hover:bg-slate-800 text-rose-400"
          >
            <Eraser className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Insert Image Popover Bar */}
      {showImageModal && (
        <form
          onSubmit={handleInsertImage}
          className="bg-slate-950 border-b border-slate-800 p-3 flex flex-wrap items-end gap-3 text-xs"
        >
          <div className="flex-1 min-w-[220px]">
            <label className="block text-slate-400 mb-1">Image URL atau Upload Gambar</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 font-mono"
              />
              <label className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 shrink-0">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="w-48">
            <label className="block text-slate-400 mb-1">Alt Text / Caption</label>
            <input
              type="text"
              value={imageAlt}
              onChange={(e) => setImageAlt(e.target.value)}
              placeholder="Deskripsi gambar"
              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="submit"
              className="flex items-center gap-1 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Sisipkan</span>
            </button>
            <button
              type="button"
              onClick={() => setShowImageModal(false)}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      )}

      {/* Insert Link Popover Bar */}
      {showLinkModal && (
        <form
          onSubmit={handleInsertLink}
          className="bg-slate-950 border-b border-slate-800 p-3 flex flex-wrap items-end gap-3 text-xs"
        >
          <div className="w-56">
            <label className="block text-slate-400 mb-1">Teks Link</label>
            <input
              type="text"
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              placeholder="Klik di sini"
              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100"
            />
          </div>

          <div className="flex-1 min-w-[220px]">
            <label className="block text-slate-400 mb-1">URL Tujuan</label>
            <input
              type="text"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 font-mono"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="submit"
              className="flex items-center gap-1 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Pasang Link</span>
            </button>
            <button
              type="button"
              onClick={() => setShowLinkModal(false)}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      )}

      {/* Editor Body Area */}
      {mode === 'visual' && (
        <div className="bg-white text-gray-900 p-5 sm:p-6 min-h-[380px] max-h-[620px] overflow-y-auto">
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={emitChange}
            onBlur={emitChange}
            className="blog-editor-canvas prose max-w-none outline-none min-h-[340px] text-sm leading-relaxed"
          />
        </div>
      )}

      {mode === 'html' && (
        <div className="bg-slate-950 p-4">
          <textarea
            rows={16}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-slate-950 text-emerald-300 font-mono text-xs leading-relaxed outline-none resize-y"
            placeholder="<p>Tulis atau paste kode HTML di sini...</p>"
          />
        </div>
      )}

      {mode === 'preview' && (
        <div className="bg-[#f0f0f0] p-6">
          <div className="max-w-[640px] mx-auto bg-white rounded-xl shadow-md p-5 text-gray-900">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded">
                Simulasi Tampilan Pengunjung (?gclid=1)
              </span>
              <button
                type="button"
                onClick={() => setPreviewTruncated(!previewTruncated)}
                className="text-xs text-blue-600 hover:underline font-medium"
              >
                {previewTruncated ? 'Buka Penuh' : 'Kembalikan Terpotong'}
              </button>
            </div>

            <div className="relative">
              <div
                className={`prose max-w-none text-sm text-[#4a4a4a] leading-relaxed relative ${
                  previewTruncated ? 'max-h-[110px] overflow-hidden' : ''
                }`}
                dangerouslySetInnerHTML={{ __html: value }}
              />
              {previewTruncated && (
                <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />
              )}
            </div>

            {previewTruncated && (
              <button
                type="button"
                onClick={() => setPreviewTruncated(false)}
                className="w-full mt-2 py-2.5 text-center text-[#3b9cc1] hover:text-[#0096C7] font-semibold text-base transition-colors flex items-center justify-center gap-1.5 border border-dashed border-cyan-200 rounded-md hover:bg-cyan-50/50"
              >
                <span>Read more...</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Bottom Status & Word Count Bar */}
      <div className="bg-slate-950 border-t border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
        <div className="flex items-center gap-4">
          <span>
            Kata: <strong className="text-slate-200">{wordCount}</strong>
          </span>
          <span>
            Karakter: <strong className="text-slate-200">{charCount}</strong>
          </span>
          <span>
            Estimasi Baca: <strong className="text-slate-200">{estimatedMinutes} min read</strong>
          </span>
        </div>

        {onUpdateReadingTime && (
          <button
            type="button"
            onClick={() => onUpdateReadingTime(`${estimatedMinutes} min read`)}
            className="text-blue-400 hover:text-blue-300 font-medium hover:underline"
          >
            Gunakan &quot;{estimatedMinutes} min read&quot; ke Reading Time
          </button>
        )}
      </div>
    </div>
  );
};
