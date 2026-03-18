import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export function RequestBar({ onRequest, disabled }) {
  const { t } = useTranslation();
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() || disabled) return;
    onRequest(text.trim());
    setText('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 p-3 bg-surfaceRaised border-t border-border">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t('graphRequest.placeholder')}
        disabled={disabled}
        className="flex-1 px-4 py-2 rounded-lg bg-surface border border-border text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent/50"
      />
      <button
        type="submit"
        disabled={!text.trim() || disabled}
        className="px-4 py-2 bg-accent text-surface font-medium rounded-lg hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {t('graphRequest.apply')}
      </button>
    </form>
  );
}
