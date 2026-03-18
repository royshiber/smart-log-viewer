import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  he: {
    translation: {
      appTitle: 'תוכנת לוגים חכמה',
      dropZone: {
        prompt: 'גרור קובץ BIN לכאן או לחץ לבחירה',
        parsing: 'מפרסר...',
        newFile: 'קובץ חדש'
      },
      chart: {
        time: 'זמן (ms)',
        empty: 'בחר שדות להצגה',
        export: 'ייצוא PNG'
      },
      fields: {
        search: 'חיפוש שדות...',
        select: 'בחר שדות'
      },
      graphRequest: {
        placeholder: 'למשל: הצג Roll ו-Pitch באדום וכחול',
        apply: 'החל'
      },
      chat: {
        title: 'ניתוח עם Gemini',
        empty: 'שאל שאלות על הנתונים...',
        placeholder: 'מה קרה בגובה 50m?',
        send: 'שלח',
        errorEmpty: 'לא התקבלה תשובה'
      },
      fieldNotFound: {
        message: 'הנתון המבוקש לא קיים בלוג.',
        suggest: 'אולי התכוונת ל:'
      },
      common: {
        loading: 'טוען...',
        error: 'שגיאה'
      },
      presets: {
        stability: 'יציבות (Roll, Pitch)',
        altitude: 'גובה',
        gps: 'GPS',
        throttle: 'מנוע'
      }
    }
  },
  en: {
    translation: {
      appTitle: 'Smart Log Viewer',
      dropZone: {
        prompt: 'Drag BIN file here or click to select',
        parsing: 'Parsing...',
        newFile: 'New file'
      },
      chart: {
        time: 'Time (ms)',
        empty: 'Select fields to display',
        export: 'Export PNG'
      },
      fields: {
        search: 'Search fields...',
        select: 'Select fields'
      },
      graphRequest: {
        placeholder: 'e.g. Show Roll and Pitch in red and blue',
        apply: 'Apply'
      },
      chat: {
        title: 'Analysis with Gemini',
        empty: 'Ask questions about the data...',
        placeholder: 'What happened at 50m altitude?',
        send: 'Send',
        errorEmpty: 'No response received'
      },
      fieldNotFound: {
        message: 'The requested field does not exist in this log.',
        suggest: 'Did you mean:'
      },
      common: {
        loading: 'Loading...',
        error: 'Error'
      },
      presets: {
        stability: 'Stability (Roll, Pitch)',
        altitude: 'Altitude',
        gps: 'GPS',
        throttle: 'Throttle'
      }
    }
  }
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'he',
  fallbackLng: 'en',
  interpolation: { escapeValue: false }
});

export default i18n;
