import { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/** Single drone card — square with photo/placeholder + name */
export function VehicleCard({ vehicle, selected, onClick, onRename, onPhotoChange, onDelete, onPrompt, size }) {
  const { t } = useTranslation();
  const [menu, setMenu] = useState(null); // { x, y }
  const menuRef = useRef(null);
  const fileRef = useRef(null);

  // Close menu on outside click
  useEffect(() => {
    if (!menu) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenu(null);
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [menu]);

  const handleContextMenu = (e) => {
    e.preventDefault();
    setMenu({ x: e.clientX, y: e.clientY });
  };

  const handleRename = async () => {
    setMenu(null);
    const name = onPrompt
      ? await onPrompt(t('vehicle.renamePrompt', 'שם חדש:'), vehicle.name)
      : window.prompt(t('vehicle.renamePrompt', 'שם חדש:'), vehicle.name);
    if (name != null && name.trim()) onRename?.(vehicle.id, name.trim());
  };

  const handlePhotoClick = () => {
    setMenu(null);
    fileRef.current?.click();
  };

  const handlePhotoFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onPhotoChange?.(vehicle.id, reader.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleDelete = () => {
    setMenu(null);
    if (window.confirm(t('vehicle.deleteConfirm', `למחוק את "${vehicle.name}"?`))) {
      onDelete?.(vehicle.id);
    }
  };

  return (
    <>
      <div
        onClick={onClick}
        onContextMenu={handleContextMenu}
        title={vehicle.name}
        className={`relative flex flex-col items-center cursor-pointer select-none rounded-lg p-1 transition-all group
          ${selected
            ? 'ring-2 ring-accent bg-accent/10'
            : 'hover:bg-surface/60 hover:ring-1 hover:ring-border'
          }`}
        style={{ width: size || 72 }}
      >
        <div
          className={`rounded-lg overflow-hidden flex items-center justify-center border
            ${selected ? 'border-accent/60' : 'border-border'}`}
          style={{ width: (size || 72) - 16, height: (size || 72) - 16, background: '#0d1117' }}
        >
          {vehicle.photo ? (
            <img src={vehicle.photo} alt={vehicle.name} className="w-full h-full object-cover" />
          ) : (
            <svg viewBox="0 0 48 48" className="opacity-60" style={{ width: Math.max(24, ((size || 72) - 16) * 0.6), height: Math.max(24, ((size || 72) - 16) * 0.6) }} fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Simple drone/plane icon */}
              <ellipse cx="24" cy="24" rx="4" ry="12" fill="#b2dfdb" />
              <path d="M20 22 L4 30 L6 34 L20 27Z" fill="#80cbc4" />
              <path d="M28 22 L44 30 L42 34 L28 27Z" fill="#80cbc4" />
              <path d="M21 32 L14 38 L16 41 L22 36Z" fill="#90a4ae" />
              <path d="M27 32 L34 38 L32 41 L26 36Z" fill="#90a4ae" />
              <circle cx="24" cy="19" r="3" fill="#29b6f6" opacity="0.9" />
            </svg>
          )}
        </div>
        {/* Name */}
        <span className="mt-1 text-xl text-center text-gray-300 truncate w-full px-0.5 leading-tight">
          {vehicle.name}
        </span>
      </div>

      {/* Context menu */}
      {menu && (
        <div
          ref={menuRef}
          className="fixed z-[9999] bg-surfaceRaised border border-border rounded-lg shadow-xl py-1 min-w-[140px]"
          style={{ top: menu.y, left: menu.x }}
        >
          <button
            type="button"
            onClick={handleRename}
            className="w-full text-right px-4 py-2 text-sm text-gray-200 hover:bg-surface/80 flex items-center gap-2"
          >
            ✏️ {t('vehicle.rename', 'שנה שם')}
          </button>
          <button
            type="button"
            onClick={handlePhotoClick}
            className="w-full text-right px-4 py-2 text-sm text-gray-200 hover:bg-surface/80 flex items-center gap-2"
          >
            🖼️ {t('vehicle.setPhoto', 'הוסף תמונה')}
          </button>
          <hr className="border-border my-1" />
          <button
            type="button"
            onClick={handleDelete}
            className="w-full text-right px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"
          >
            🗑️ {t('vehicle.delete', 'מחק כטב"ם')}
          </button>
        </div>
      )}

      {/* Hidden file input for photo */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handlePhotoFile}
      />
    </>
  );
}
