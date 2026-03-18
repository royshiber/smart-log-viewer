import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export function GraphRequestInput({ onRequest, loading, disabled }) {
  const { t } = useTranslation();
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() || loading || disabled) return;
    onRequest(text.trim());
    setText('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t('graphRequest.placeholder')}
        disabled={disabled || loading}
        className="flex-1 px-4 py-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
      />
      <button
        type="submit"
        disabled={!text.trim() || loading || disabled}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? t('common.loading') : t('graphRequest.apply')}
      </button>
    </form>
  );
}
