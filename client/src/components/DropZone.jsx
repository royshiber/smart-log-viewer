import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

const PlaneIcon = () => (
  <svg className="w-20 h-20 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M2 12l10-8 10 8-4 2-6-4-6 4-4-2z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function DropZone({ onFile, disabled, loading, progress }) {
  const { t } = useTranslation();
  const [drag, setDrag] = useState(false);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDrag(false);
    if (disabled || loading) return;
    const file = e.dataTransfer?.files?.[0];
    if (file && (file.name.endsWith('.bin') || file.name.endsWith('.BIN'))) {
      const reader = new FileReader();
      reader.onload = () => onFile(reader.result);
      reader.readAsArrayBuffer(file);
    }
  }, [onFile, disabled, loading]);

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
    input.onchange = () => {
      const file = input.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => onFile(reader.result);
        reader.readAsArrayBuffer(file);
      }
    };
    input.click();
  }, [onFile, disabled, loading]);

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
        border-2 border-dashed rounded-xl p-12 text-center cursor-pointer
        transition-all duration-200 select-none
        bg-surfaceRaised border-border
        ${drag ? 'border-accent bg-accent/10 scale-[1.02]' : 'hover:border-accent/60'}
        ${(disabled || loading) ? 'opacity-70 cursor-not-allowed' : ''}
      `}
    >
      <div className="flex flex-col items-center gap-4">
        <PlaneIcon />
        <div>
          <p className="text-lg text-gray-300">
            {loading ? t('dropZone.parsing') : t('dropZone.prompt')}
          </p>
          <p className="text-sm text-gray-500 mt-1">.bin</p>
        </div>
        {loading && (
          <div className="w-full max-w-xs">
            <div className="h-2 bg-surface rounded-full overflow-hidden">
              <div
                className="h-full bg-accentGreen transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">{Math.round(progress)}%</p>
          </div>
        )}
      </div>
    </div>
  );
}
