import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

const PlaneIcon = () => (
  <svg className="w-20 h-20 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M2 12l10-8 10 8-4 2-6-4-6 4-4-2z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function DropZone({ onFile, onFiles, disabled, loading, progress, className = '', compact = false }) {
  const { t } = useTranslation();
  const [drag, setDrag] = useState(false);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDrag(false);
    if (disabled || loading) return;
    const files = Array.from(e.dataTransfer?.files || []).filter((f) => f.name.endsWith('.bin') || f.name.endsWith('.BIN'));
    if (files.length > 1 && typeof onFiles === 'function') {
      onFiles(files);
      return;
    }
    const file = files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => onFile(reader.result, file.name);
      reader.readAsArrayBuffer(file);
    }
  }, [onFile, onFiles, disabled, loading]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    if (!loading) setDrag(true);
  }, [loading]);

  const handleDragLeave = useCallback(() => setDrag(false), []);

  const handleClick = useCallback(() => {
    if (disabled || loading) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.bin,.BIN';
    input.multiple = true;
    input.onchange = () => {
      const files = Array.from(input.files || []).filter((f) => f.name.endsWith('.bin') || f.name.endsWith('.BIN'));
      if (files.length > 1 && typeof onFiles === 'function') {
        onFiles(files);
        return;
      }
      const file = files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => onFile(reader.result, file.name);
        reader.readAsArrayBuffer(file);
      }
    };
    input.click();
  }, [onFile, onFiles, disabled, loading]);

  const baseClasses = compact
    ? `
        border border-dotted rounded-lg p-5 text-center cursor-pointer
        transition-all duration-200 select-none
        bg-transparent border-white/35
        ${drag ? 'border-figmaAccent bg-white/5' : 'hover:border-white/55'}
      `
    : `
        border-2 border-dashed rounded-xl p-10 text-center cursor-pointer
        transition-all duration-200 select-none
        bg-surfaceRaised border-border
        ${drag ? 'border-accent bg-accent/10 scale-[1.02]' : 'hover:border-accent/60'}
      `;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`
        ${baseClasses}
        ${!compact ? 'w-full' : ''}
        ${(disabled || loading) ? 'opacity-70 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      <div className={`flex flex-col items-center justify-center h-full ${compact ? 'gap-2' : 'gap-6'}`}>
        {!compact && <PlaneIcon />}
        <div>
          <p className={compact ? 'text-sm text-white/90 leading-snug' : 'text-2xl font-semibold text-gray-200'}>
            {loading ? t('dropZone.parsing') : t('dropZone.prompt')}
          </p>
          <p className={compact ? 'text-xs text-white/45 mt-1' : 'text-base text-gray-400 mt-2'}>.bin</p>
        </div>
        {loading && (
          <div className="w-full max-w-xs">
            <div className={`h-2 ${compact ? 'bg-white/10' : 'bg-surface'} rounded-full overflow-hidden`}>
              <div
                className="h-full bg-accentGreen transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className={`${compact ? 'text-xs text-white/50' : 'text-sm text-gray-500'} mt-2`}>{Math.round(progress)}%</p>
          </div>
        )}
      </div>
    </div>
  );
}
