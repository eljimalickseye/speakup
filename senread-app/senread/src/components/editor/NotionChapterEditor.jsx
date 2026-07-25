import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import {
  PenToolIcon,
  PlusIcon,
  TrashIcon,
  CheckIcon,
  SparklesIcon,
} from '../ui/Icons.jsx';

export default function NotionChapterEditor({
  chapter,
  onUpdateChapter,
}) {
  const { appLanguage } = useApp();
  const isEn = appLanguage === 'en';

  const [activeTab, setActiveTab] = useState('bilingual'); // 'bilingual' | 'wysiwyg'
  const [history, setHistory] = useState([chapter.sentences]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [lastAutosave, setLastAutosave] = useState('');
  const [activeModalBlockIdx, setActiveModalBlockIdx] = useState(null); // Track block target for floating formatting modal
  const [showFloatingPalette, setShowFloatingPalette] = useState(false);
  const [versionHistory, setVersionHistory] = useState([
    { id: 1, time: 'Initial Draft', sentencesCount: chapter.sentences?.length || 0 }
  ]);

  // Formatting Options
  const [selectedFont, setSelectedFont] = useState('font-sans');
  const [selectedFontSize, setSelectedFontSize] = useState('text-[14px]');
  const [selectedAlign, setSelectedAlign] = useState('text-left');
  const [textColor, setTextColor] = useState('#211E19');
  const [bgColor, setBgColor] = useState('transparent');
  const [isDragOver, setIsDragOver] = useState(false);

  // Autosave Engine
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      setLastAutosave(timeStr);
      try {
        localStorage.setItem(`koko_autosave_chap_${chapter.id}`, JSON.stringify(chapter.sentences));
      } catch (e) {
        console.warn('Autosave failed', e);
      }
    }, 8000);
    return () => clearInterval(timer);
  }, [chapter]);

  // Push to Undo/Redo History Stack
  const pushToHistory = (newSentences) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newSentences);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    onUpdateChapter({ ...chapter, sentences: newSentences });

    // Record Version
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    setVersionHistory((prev) => [
      { id: Date.now(), time: timeStr, sentencesCount: newSentences.length },
      ...prev.slice(0, 9),
    ]);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      setHistoryIndex(prevIdx);
      onUpdateChapter({ ...chapter, sentences: history[prevIdx] });
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      onUpdateChapter({ ...chapter, sentences: history[nextIdx] });
    }
  };

  // Sentence Manipulation
  const handleSentenceChange = (index, field, value) => {
    const updated = chapter.sentences.map((s, idx) => {
      if (idx === index) {
        return { ...s, [field]: value };
      }
      return s;
    });
    pushToHistory(updated);
  };

  const handleAddSentencePair = () => {
    const newPair = { en: '', fr: '', vocabWord: '', vocabFr: '' };
    pushToHistory([...chapter.sentences, newPair]);
  };

  const handleRemoveSentencePair = (index) => {
    if (chapter.sentences.length <= 1) return;
    const updated = chapter.sentences.filter((_, idx) => idx !== index);
    pushToHistory(updated);
  };

  const handleMoveSentencePair = (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= chapter.sentences.length) return;
    const updated = [...chapter.sentences];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    pushToHistory(updated);
  };

  // Apply Formatting to Target Block via Floating Modal
  const applyFormatToBlock = (formatType) => {
    const targetIdx = activeModalBlockIdx !== null ? activeModalBlockIdx : 0;
    const s = chapter.sentences[targetIdx];
    if (!s) return;

    let newEn = s.en;
    if (formatType === 'bold') newEn = `**${newEn}**`;
    else if (formatType === 'italic') newEn = `*${newEn}*`;
    else if (formatType === 'underline') newEn = `<u>${newEn}</u>`;
    else if (formatType === 'strikethrough') newEn = `~~${newEn}~~`;
    else if (formatType === 'quote') newEn = `> "${newEn}"`;
    else if (formatType === 'h1') newEn = `# ${newEn}`;
    else if (formatType === 'h2') newEn = `## ${newEn}`;

    handleSentenceChange(targetIdx, 'en', newEn);
  };

  // Open Formatting Palette for Specific Block
  const openBlockPalette = (idx) => {
    setActiveModalBlockIdx(idx);
    setShowFloatingPalette(true);
  };

  // Drag and Drop File Media Upload
  const handleDropMedia = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target.result;
        const newPair = {
          en: `![Image](${imageUrl})`,
          fr: `[Illustration insérée]`,
          vocabWord: 'media',
        };
        pushToHistory([...chapter.sentences, newPair]);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-4 text-left relative">
      {/* TOP HEADER TOOLBAR WITH FLOATING FORMATTING MODAL TRIGGER ICON */}
      <div className="bg-white border border-surface-line rounded-2xl p-3 shadow-md sticky top-2 z-30 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-surface-line/60 pb-2">
          {/* Mode Switcher */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="flex bg-paper p-1 rounded-xl border border-surface-line text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('bilingual')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activeTab === 'bilingual' ? 'bg-gold text-paper shadow-sm' : 'text-taupe hover:text-ink'
                }`}
              >
                {isEn ? 'Bilingual Pairs' : 'Paires Bilingues'}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('wysiwyg')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activeTab === 'wysiwyg' ? 'bg-gold text-paper shadow-sm' : 'text-taupe hover:text-ink'
                }`}
              >
                {isEn ? 'Notion View' : 'Vue Notion'}
              </button>
            </div>

            {/* Undo / Redo */}
            <div className="flex gap-1 border-l border-surface-line pl-2">
              <button
                type="button"
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                title={isEn ? 'Undo (Ctrl+Z)' : 'Annuler (Ctrl+Z)'}
                className="w-7 h-7 rounded-lg bg-paper border border-surface-line text-ink font-bold text-[12px] flex items-center justify-center hover:bg-surface disabled:opacity-30"
              >
                ↩
              </button>
              <button
                type="button"
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                title={isEn ? 'Redo (Ctrl+Y)' : 'Rétablir (Ctrl+Y)'}
                className="w-7 h-7 rounded-lg bg-paper border border-surface-line text-ink font-bold text-[12px] flex items-center justify-center hover:bg-surface disabled:opacity-30"
              >
                ↪
              </button>
            </div>
          </div>

          {/* Floating Formatting Palette Trigger Icon Button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveModalBlockIdx(0);
                setShowFloatingPalette(true);
              }}
              title={isEn ? 'Open Formatting Palette Modal' : 'Ouvrir la Palette de Modification'}
              className="px-3 py-1.5 rounded-xl bg-gold/15 text-gold border border-gold/40 text-[11.5px] font-bold hover:bg-gold/25 transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
            >
              <SparklesIcon className="w-4 h-4 text-gold" />
              <span>{isEn ? 'Formatting Palette' : 'Palette de Modification'}</span>
            </button>

            {/* Autosave Status */}
            <span className="text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 text-[10px] flex items-center gap-1">
              <CheckIcon className="w-3 h-3 text-emerald-600" />
              <span>{lastAutosave ? (isEn ? `Saved ${lastAutosave}` : `Sauvegardé ${lastAutosave}`) : (isEn ? 'Autosave' : 'Sauvegarde Auto')}</span>
            </span>
          </div>
        </div>
      </div>

      {/* DRAG AND DROP MEDIA CONTAINER */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDropMedia}
        className={`transition-all rounded-3xl p-1 ${
          isDragOver ? 'ring-4 ring-gold bg-gold/10' : ''
        }`}
      >
        {activeTab === 'bilingual' ? (
          /* BILINGUAL WRITING SYSTEM WITH ROUND GLASS TRIGGER PINS ON EACH BLOCK */
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-gold/10 p-3 rounded-2xl border border-gold/30">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-gold tracking-wider block">
                  {isEn ? 'Bilingual Writing System' : 'Système d’Écriture Bilingue'}
                </span>
                <p className="text-[12px] font-bold text-ink">
                  {isEn ? 'Alternating EN + FR Paired Sentences' : 'Alternance Paires Anglais + Français'}
                </p>
              </div>
              <span className="text-[11px] font-mono font-bold text-gold bg-white px-2.5 py-1 rounded-full border border-gold/30">
                {chapter.sentences.length} {isEn ? 'Pairs' : 'Paires'}
              </span>
            </div>

            {chapter.sentences.map((s, idx) => (
              <div
                key={idx}
                className="bg-white border border-surface-line rounded-3xl p-4 space-y-3 shadow-sm hover:border-gold/50 transition-all relative group"
              >
                {/* Block Header with ROUND GLASS TRIGGER PIN */}
                <div className="flex justify-between items-center border-b border-surface-line pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-gold/15 text-gold font-bold text-[11px] flex items-center justify-center border border-gold/30">
                      #{idx + 1}
                    </span>
                    <span className="text-[11px] font-extrabold uppercase text-gold">
                      {isEn ? 'Sentence Block' : 'Bloc de Phrase Bilingue'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* CIRCULAR GLASS FORMATTING TRIGGER PIN */}
                    <button
                      type="button"
                      onClick={() => openBlockPalette(idx)}
                      title={isEn ? 'Format this paragraph block' : 'Modifier ce paragraphe'}
                      className="w-7 h-7 rounded-full bg-gold/15 backdrop-blur-md text-gold border border-gold/40 flex items-center justify-center hover:bg-gold/30 hover:scale-110 active:scale-95 transition-all shadow-sm"
                    >
                      <PenToolIcon className="w-3.5 h-3.5 text-gold" />
                    </button>

                    <div className="h-3.5 w-px bg-surface-line mx-0.5" />

                    {/* Reorder & Delete */}
                    <button
                      type="button"
                      onClick={() => handleMoveSentencePair(idx, -1)}
                      disabled={idx === 0}
                      className="px-1.5 py-0.5 text-[10px] bg-paper rounded border border-surface-line disabled:opacity-30"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveSentencePair(idx, 1)}
                      disabled={idx === chapter.sentences.length - 1}
                      className="px-1.5 py-0.5 text-[10px] bg-paper rounded border border-surface-line disabled:opacity-30"
                    >
                      ▼
                    </button>
                    {chapter.sentences.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSentencePair(idx)}
                        className="text-red-500 hover:text-red-700 pl-1"
                        title="Delete Pair"
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Clean English Sentence Input (No inline text format buttons) */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-extrabold uppercase px-2 py-0.5 rounded-full bg-gold/20 text-gold border border-gold/40">
                      EN
                    </span>
                    <span className="text-[10.5px] font-extrabold text-ink">
                      {isEn ? 'English Sentence' : 'Phrase Anglaise'}
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    value={s.en}
                    onChange={(e) => handleSentenceChange(idx, 'en', e.target.value)}
                    placeholder={isEn ? 'Write English sentence...' : 'Rédigez la phrase en anglais...'}
                    style={{ color: textColor, backgroundColor: bgColor !== 'transparent' ? bgColor : undefined }}
                    className={`w-full p-3 rounded-2xl bg-paper/70 border border-surface-line text-[13px] outline-none focus:border-gold ${selectedFont} ${selectedFontSize} ${selectedAlign}`}
                  />
                </div>

                {/* Clean French Translation Input */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-300">
                      FR
                    </span>
                    <span className="text-[10.5px] font-extrabold text-ink">
                      {isEn ? 'French Translation' : 'Traduction Française'}
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    value={s.fr}
                    onChange={(e) => handleSentenceChange(idx, 'fr', e.target.value)}
                    placeholder={isEn ? 'Write French translation...' : 'Rédigez la traduction en français...'}
                    className={`w-full p-3 rounded-2xl bg-paper/70 border border-surface-line text-[13px] outline-none italic focus:border-gold ${selectedFont} ${selectedFontSize} ${selectedAlign}`}
                  />
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddSentencePair}
              className="w-full py-3.5 rounded-2xl border-2 border-dashed border-gold/40 text-gold text-[13px] font-bold hover:bg-gold/10 transition-all flex items-center justify-center gap-2"
            >
              <PlusIcon className="w-4.5 h-4.5" />
              <span>{isEn ? 'Add Sentence Pair (+ EN / FR)' : 'Ajouter une Paire de Phrase (+ EN / FR)'}</span>
            </button>
          </div>
        ) : (
          /* NOTION STYLE FULL PAGE VISUAL PREVIEW */
          <div className="bg-white border border-surface-line rounded-3xl p-6 space-y-4 shadow-sm text-left font-reading">
            <div className="border-b border-surface-line pb-3">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-gold block">
                {isEn ? 'Notion Visual Reader Mode' : 'Mode Rendu Visuel Notion'}
              </span>
              <h2 className="font-display font-bold text-[20px] text-ink">{chapter.title || 'Sans titre'}</h2>
            </div>

            <div className="space-y-4 leading-relaxed">
              {chapter.sentences.map((s, idx) => (
                <div key={idx} className="space-y-1 p-3 rounded-2xl bg-paper/40 border border-surface-line/40">
                  <p className={`font-medium text-ink ${selectedFont} ${selectedFontSize} ${selectedAlign}`}>
                    {s.en}
                  </p>
                  <p className={`text-[13px] text-taupe italic ${selectedFont} ${selectedAlign}`}>
                    {s.fr}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* FLOATING DRAGGABLE / GLASS OVERLAY FORMATTING PALETTE MODAL */}
      {showFloatingPalette && (
        <div
          className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn pointer-events-auto"
          onClick={() => setShowFloatingPalette(false)}
        >
          <div
            className="w-full max-w-sm bg-[#1A1A1A] text-white rounded-3xl p-5 relative shadow-[0_20px_60px_rgba(0,0,0,0.8)] space-y-4 border border-white/20 text-left animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gold/20 text-gold border border-gold/40 flex items-center justify-center">
                  <SparklesIcon className="w-4 h-4 text-gold" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-[15px] text-white">
                    {isEn ? 'Formatting Palette' : 'Palette de Modification'}
                  </h3>
                  <span className="text-[10px] text-gold font-mono block">
                    {isEn ? `Editing Block #${(activeModalBlockIdx || 0) + 1}` : `Modification du Bloc #${(activeModalBlockIdx || 0) + 1}`}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowFloatingPalette(false)}
                className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white font-bold text-[14px]"
              >
                ×
              </button>
            </div>

            {/* Quick Text Formatting Actions */}
            <div className="space-y-2">
              <span className="text-[10px] font-extrabold uppercase text-gold tracking-wider block">Style & Format</span>
              <div className="grid grid-cols-4 gap-2 text-[12px] font-bold">
                <button
                  type="button"
                  onClick={() => applyFormatToBlock('bold')}
                  className="py-2.5 rounded-xl bg-white/10 hover:bg-gold hover:text-paper border border-white/15 transition-all text-center"
                >
                  B (Gras)
                </button>
                <button
                  type="button"
                  onClick={() => applyFormatToBlock('italic')}
                  className="py-2.5 rounded-xl bg-white/10 hover:bg-gold hover:text-paper border border-white/15 transition-all italic text-center"
                >
                  I (Italique)
                </button>
                <button
                  type="button"
                  onClick={() => applyFormatToBlock('underline')}
                  className="py-2.5 rounded-xl bg-white/10 hover:bg-gold hover:text-paper border border-white/15 transition-all underline text-center"
                >
                  U (Souligné)
                </button>
                <button
                  type="button"
                  onClick={() => applyFormatToBlock('strikethrough')}
                  className="py-2.5 rounded-xl bg-white/10 hover:bg-gold hover:text-paper border border-white/15 transition-all line-through text-center"
                >
                  S (Barré)
                </button>
              </div>
            </div>

            {/* Paragraph Styles & Headings */}
            <div className="grid grid-cols-3 gap-2 text-[11.5px] font-bold">
              <button
                type="button"
                onClick={() => applyFormatToBlock('h1')}
                className="py-2 rounded-xl bg-white/10 hover:bg-gold hover:text-paper border border-white/15 transition-all"
              >
                H1 (Titre 1)
              </button>
              <button
                type="button"
                onClick={() => applyFormatToBlock('h2')}
                className="py-2 rounded-xl bg-white/10 hover:bg-gold hover:text-paper border border-white/15 transition-all"
              >
                H2 (Titre 2)
              </button>
              <button
                type="button"
                onClick={() => applyFormatToBlock('quote')}
                className="py-2 rounded-xl bg-white/10 hover:bg-gold hover:text-paper border border-white/15 transition-all"
              >
                " Citation
              </button>
            </div>

            {/* Typography & Alignment Controls */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <label className="block text-[9.5px] font-bold text-white/60 uppercase mb-1">Police de Caractère</label>
                <select
                  value={selectedFont}
                  onChange={(e) => setSelectedFont(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl bg-white/10 border border-white/15 text-white text-[12px] outline-none font-bold"
                >
                  <option value="font-sans" className="bg-[#1F1F1F]">Inter (Sans-Serif)</option>
                  <option value="font-serif" className="bg-[#1F1F1F]">Fraunces (Serif)</option>
                  <option value="font-mono" className="bg-[#1F1F1F]">Newsreader (Livre)</option>
                </select>
              </div>

              <div>
                <label className="block text-[9.5px] font-bold text-white/60 uppercase mb-1">Taille du Texte</label>
                <select
                  value={selectedFontSize}
                  onChange={(e) => setSelectedFontSize(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl bg-white/10 border border-white/15 text-white text-[12px] outline-none font-bold"
                >
                  <option value="text-[12px]" className="bg-[#1F1F1F]">Petit (12px)</option>
                  <option value="text-[14px]" className="bg-[#1F1F1F]">Normal (14px)</option>
                  <option value="text-[16px]" className="bg-[#1F1F1F]">Grand (16px)</option>
                  <option value="text-[20px]" className="bg-[#1F1F1F]">Titre (20px)</option>
                </select>
              </div>
            </div>

            {/* Colors Selectors */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-[11px] font-bold text-white">Couleurs du Bloc</span>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-[11px] text-white/80 cursor-pointer">
                  <span>Texte:</span>
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-6 h-6 rounded-lg cursor-pointer border-none bg-transparent"
                  />
                </label>

                <label className="flex items-center gap-1.5 text-[11px] text-white/80 cursor-pointer">
                  <span>Fond:</span>
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-6 h-6 rounded-lg cursor-pointer border-none bg-transparent"
                  />
                </label>
              </div>
            </div>

            {/* Apply & Close Button */}
            <button
              type="button"
              onClick={() => setShowFloatingPalette(false)}
              className="w-full bg-gold text-paper py-3 rounded-xl font-bold text-[13px] shadow-md hover:opacity-90 active:scale-95 transition-all"
            >
              {isEn ? 'Apply Changes to Block' : 'Appliquer au Paragraphe'}
            </button>
          </div>
        </div>
      )}

      {/* VERSION HISTORY */}
      <div className="bg-white border border-surface-line rounded-2xl p-4 space-y-2 text-left shadow-sm">
        <div className="flex justify-between items-center">
          <span className="text-[11px] font-bold text-taupe uppercase flex items-center gap-1.5">
            <PenToolIcon className="w-4 h-4 text-gold" />
            <span>{isEn ? 'Version History' : 'Historique des Versions'}</span>
          </span>
          <span className="text-[10.5px] font-mono text-gold font-bold">
            {versionHistory.length} {isEn ? 'Snapshots' : 'Sauvegardes'}
          </span>
        </div>

        <div className="space-y-1.5 pt-1 max-h-32 overflow-y-auto">
          {versionHistory.map((ver) => (
            <div key={ver.id} className="text-[11px] bg-paper p-2 rounded-xl border border-surface-line/60 flex justify-between items-center">
              <span className="font-mono text-taupe">{ver.time}</span>
              <span className="font-bold text-ink">{ver.sentencesCount} {isEn ? 'pairs' : 'paires'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
