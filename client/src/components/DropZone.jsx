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
        border border-dotted p-5 text-center cursor-pointer
        transition-all duration-200 select-none
        bg-transparent border-border
        ${drag ? 'border-accent bg-accent/5' : 'hover:border-accent/60'}
      `
    : `
        border-2 border-dashed p-10 text-center cursor-pointer aero-grid
        transition-all duration-200 select-none
        bg-surfaceContainer border-border
        ${drag ? 'border-accent bg-accent/5 scale-[1.01]' : 'hover:border-accent/70'}
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
          <p className={compact ? 'text-sm text-onSurface leading-snug font-medium' : 'text-xl font-headline font-semibold text-onSurface'}>
            {loading ? t('dropZone.parsing') : t('dropZone.prompt')}
          </p>
          <p className={compact ? 'text-xs text-muted mt-1' : 'text-sm text-muted mt-2'}>.bin</p>
        </div>
        {loading && (
          <div className="w-full max-w-xs">
            <div className={`h-2 ${compact ? 'bg-surfaceRaised' : 'bg-surfaceRaised'} overflow-hidden border border-border`}>
              <div
                className="h-full bg-accent transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className={`${compact ? 'text-xs text-muted' : 'text-sm text-muted'} mt-2`}>{Math.round(progress)}%</p>
          </div>
        )}
      </div>
    </div>
  );
}
