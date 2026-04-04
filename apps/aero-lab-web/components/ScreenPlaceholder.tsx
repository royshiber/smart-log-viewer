import type { ReactNode } from 'react';

/**
 * Why: Stitch exports exist as full HTML files under docs/stitch-aerolab/; this scaffold links them by route.
 * What: consistent placeholder until each screen is fully ported to JSX.
 */
export function ScreenPlaceholder({
  title,
  sourceFile,
  children,
}: {
  title: string;
  sourceFile: string;
  children?: ReactNode;
}) {
  return (
    <div className="relative z-10 p-8 max-w-7xl mx-auto space-y-6">
      <header className="flex justify-between items-end border-b border-outline-variant/20 pb-4">
        <div>
          <h1 className="font-headline text-3xl font-black tracking-tight text-primary uppercase">{title}</h1>
          <p className="font-label text-[10px] tracking-widest text-slate-400 mt-1 uppercase">
            Source: docs/stitch-aerolab/{sourceFile}
          </p>
        </div>
      </header>
      {children ?? (
        <p className="font-body text-sm text-on-surface-variant max-w-prose">
          מסך זה ממופה למסלול ב-Next; העיצוב המלא מגיע מייצוא ה-HTML של Stitch. להשלמת פיקסל-פרפקט יש להעתיק את ה-markup
          לרכיבי React בקובץ העמוד הזה.
        </p>
      )}
    </div>
  );
}
