import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  he: {
    translation: {
      appTitle: 'תוכנת לוגים חכמה',
      app: {
        closeHint: 'בדפדפן אין סגירת חלון — השתמש בסגירת הטאב',
        goHome: 'חזרה למסך הבית',
      },
      reports: {
        tab: 'הפק דוחות',
        csvTitle: 'ייצוא נתונים לCSV',
        csvDesc: 'בחר שדות לייצוא',
        exportBtn: 'ייצא CSV',
        pdfTitle: 'דוח טיסה PDF',
        reportNameLabel: 'שם הדוח',
        observationsLabel: 'תיאור הטיסה (בשפה חופשית)',
        observationsPlaceholder: 'למשל: הגיע לגובה 150m, הייתה רעידה חדה בדקה ה-3, נחיתה חלקה...',
        generateBtn: 'הפק דוח PDF',
        generating: 'מפיק דוח...',
        noFields: 'טען לוג ובחר שדות תחילה',
        selectAll: 'בחר הכל',
        clearAll: 'נקה',
        csvChatPlaceholder: 'למשל: גובה, מהירות ומצערת',
        csvApply: 'החל',
        csvChatHint: 'תאר בשפה פשוטה — יסומנו שדות (בספק נוסיף יותר)',
        fieldSearch: 'חיפוש שדות...',
        noGpsTime: 'אין נתוני זמן GPS — עמודות UTC/ישראל ריקות',
      },
      landing: {
        selectExisting: 'בחר כטב״ם קיים',
        addNew: 'הוסף כטב״ם חדש',
        loadBinHint: 'לאחר בחירה — טען לוג',
        pickerTitle: 'בחירת כטב״ם',
        closePicker: 'סגור',
        vehicleLogs: 'לוגים שנשמרו',
        uploadBin: 'העלה קובץ BIN',
      },
      dropZone: {
        prompt: 'גרור קובץ BIN לכאן או לחץ לבחירה',
        parsing: 'מפרסר...',
        newFile: 'העלה LOG חדש'
      },
      chart: {
        tab: 'גרף',
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
        apply: 'החל',
        searching: 'מחפש...'
      },
      chat: {
        title: 'ניתוח עם Gemini',
        empty: 'שאל שאלות על הנתונים...',
        placeholder: 'מה קרה בגובה 50m?',
        send: 'שלח',
        errorEmpty: 'לא התקבלה תשובה'
      },
      apiError: {
        geminiUnavailable: 'לא ניתן להתחבר ל-Gemini. בדוק חיבור אינטרנט ו-API key.',
        clickToDismiss: 'לחץ בכל מקום לסגירה'
      },
      fieldNotFound: {
        message: 'הבקר לא הקליט את הנתון הזה / הנתון לא קיים בלוג.',
        suggest: 'אולי התכוונת ל:',
        noSimilar: 'אין שדה דומה בלוג.'
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
      },
      version: { whatsNew: 'מה חדש' },
      contextMenu: { showOnMap: 'הצג במפה', markOnChart: 'סמן בגרף' },
      map: {
        tab: 'מפה',
        noGps: 'אין נתוני GPS בלוג',
        chatTitle: 'שליטה במפה',
        unifiedChatTitle: 'שיחה עם Gemini',
        chatEmpty: 'שאל על הטיסה או בקש זום, מרכז, סימניות במפה...',
        chatPlaceholder: 'מה היה הגובה המקסימלי? / התמקד בהמראה',
        syncPoint: 'נקודה נבחרת',
        saveCommand: 'שמור פקודה',
        commandSaved: 'נשמר ✓',
        mapMode: 'מצב מפה',
        legendTitle: 'מקרא מסלול',
        legendByField: 'צבע לפי',
        legendDefault: 'צבע ברירת מחדל',
        legendSolid: 'צבע קבוע',
        legendSegments: 'צבעי סגמנטים מותאמים',
        legendSegmentN: 'מקטע',
        legendAbove: 'מעל',
        legendBelowEq: 'מתחת או שווה',
        legendPositive: 'ערך > 0',
        legendZero: 'ערך = 0',
        legendNegative: 'ערך < 0',
        legendReset: 'איפוס צבעים',
        open3DHint: 'ייצוא KML ופתיחה ב-Google Earth Web',
        toggle3DHint: 'מעבר בין מפה דו־ממדית לתצוגת 3D בתוך האפליקציה',
        view3DInApp: 'תלת־ממד באפליקציה',
        view2DInApp: 'חזרה למפה 2D',
        flightPath3d: 'מסלול טיסה',
        timeline: 'ציר זמן',
        aircraftNow: 'מיקום המטוס'
      },
      vehicle: {
        select: 'בחר כטב"ם',
        newVehicle: 'כטב"ם חדש',
        newVehiclePrompt: 'שם הכטב"ם:',
        noVehicles: 'אין כטב"מים. הוסף כטב"ם חדש.',
        rename: 'שנה שם',
        renamePrompt: 'שם חדש:',
        setPhoto: 'הוסף תמונה',
        delete: 'מחק כטב"ם',
        deleteConfirm: 'למחוק כטב"ם זה?'
      },
      logs: {
        title: 'לוגים',
        empty: 'אין לוגים',
        load: 'טען',
        rename: 'שנה שם לוג',
        renamePrompt: 'שם חדש ללוג:',
        delete: 'מחק לוג',
        deleteConfirm: 'למחוק את הלוג מהמכשיר? לא ניתן לבטל.',
        columnWidth: 'רוחב עמודת לוגים',
        showData: 'הצג נתוני לוג',
        hideData: 'הסתר נתוני לוג',
        mainVisible: 'הלוג הראשי מוצג',
      },
      preset: {
        myPresets: 'הפריסטים שלי',
        addPreset: 'הוסף פריסט +',
        save: 'שמור פריסט',
        saveAs: 'שמור פריסט בשם',
        namePrompt: 'שם הפריסט:',
        chart: 'גרף',
        map: 'מפה',
        noFieldsMatch: 'הפריסט לא תואם ללוג הנוכחי — השדות אינם קיימים בקובץ זה'
      },
      comparison: {
        addVehicle: 'השווה לכטב״ם אחר',
        back: 'חזור',
        selectLog: 'בחר לוג להשוואה',
        noLogs: 'אין לוגים לכטב״ם זה',
        remove: 'הסר השוואה',
        addFlightLogs: 'השווה לטיסה אחרת',
        flightLogsHint: 'הוסף לוגים שמורים של אותו כטב״ם כשכבות על אותו גרף',
        flightLogsSubtitle: 'לוגים שמורים של הכטב״ם הנבחר — אותם שדות כמו בגרף הראשי',
        maxComparisons: 'ניתן להוסיף עד {{count}} שכבות השוואה',
        noSavedLogsForVehicle: 'אין לוגים שמורים לכטב״ם זה',
        alreadyOnChart: 'כבר על הגרף',
        isMainChartLog: 'זה הלוג הראשי שנטען כעת',
      }
    }
  },
  en: {
    translation: {
      appTitle: 'Smart Log Viewer',
      app: {
        closeHint: 'Browsers cannot close the window — close the tab instead',
        goHome: 'Back to home',
      },
      reports: {
        tab: 'Reports',
        csvTitle: 'Export data to CSV',
        csvDesc: 'Select fields to export',
        exportBtn: 'Export CSV',
        pdfTitle: 'Flight Report PDF',
        reportNameLabel: 'Report title',
        observationsLabel: 'Flight description (plain language)',
        observationsPlaceholder: 'e.g. Reached 150m altitude, sharp vibration at minute 3, smooth landing...',
        generateBtn: 'Generate PDF report',
        generating: 'Generating report...',
        noFields: 'Load a log and select fields first',
        selectAll: 'Select all',
        clearAll: 'Clear',
        csvChatPlaceholder: 'e.g. altitude, speed, throttle',
        csvApply: 'Apply',
        csvChatHint: 'Describe in plain language — fields will be checked (when unsure we add more)',
        fieldSearch: 'Search fields...',
        noGpsTime: 'No GPS time in log — UTC/Israel columns empty',
      },
      landing: {
        selectExisting: 'Select existing vehicle',
        addNew: 'Add new vehicle',
        loadBinHint: 'Then load a log file',
        pickerTitle: 'Select vehicle',
        closePicker: 'Close',
        vehicleLogs: 'Saved logs',
        uploadBin: 'Upload BIN file',
      },
      dropZone: {
        prompt: 'Drag BIN file here or click to select',
        parsing: 'Parsing...',
        newFile: 'Upload new LOG'
      },
      chart: {
        tab: 'Chart',
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
        apply: 'Apply',
        searching: 'Searching...'
      },
      chat: {
        title: 'Analysis with Gemini',
        empty: 'Ask questions about the data...',
        placeholder: 'What happened at 50m altitude?',
        send: 'Send',
        errorEmpty: 'No response received'
      },
      apiError: {
        geminiUnavailable: 'Could not connect to Gemini. Check internet connection and API key.',
        clickToDismiss: 'Click anywhere to dismiss'
      },
      fieldNotFound: {
        message: 'The controller did not log this field / it does not exist in this log.',
        suggest: 'Did you mean:',
        noSimilar: 'No similar field in this log.'
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
      },
      version: { whatsNew: "What's new" },
      contextMenu: { showOnMap: 'Show on map', markOnChart: 'Mark on chart' },
      map: {
        tab: 'Map',
        noGps: 'No GPS data in log',
        chatTitle: 'Map Control',
        unifiedChatTitle: 'Chat with Gemini',
        chatEmpty: 'Ask about the flight or request zoom, center, markers on the map...',
        chatPlaceholder: 'What was max altitude? / Focus on takeoff',
        syncPoint: 'Selected point',
        saveCommand: 'Save command',
        commandSaved: 'Saved ✓',
        mapMode: 'Map mode',
        legendTitle: 'Path legend',
        legendByField: 'Color by',
        legendDefault: 'Default path',
        legendSolid: 'Fixed color',
        legendSegments: 'Custom segment colors',
        legendSegmentN: 'Segment',
        legendAbove: 'Above',
        legendBelowEq: 'Below or equal',
        legendPositive: 'Value > 0',
        legendZero: 'Value = 0',
        legendNegative: 'Value < 0',
        legendReset: 'Reset colors',
        open3DHint: 'Export KML and open Google Earth Web',
        toggle3DHint: 'Switch between 2D map and in-app 3D view',
        view3DInApp: '3D in app',
        view2DInApp: 'Back to 2D map',
        flightPath3d: 'Flight path',
        timeline: 'Timeline',
        aircraftNow: 'Aircraft position'
      },
      vehicle: {
        select: 'Select vehicle',
        newVehicle: 'New vehicle',
        newVehiclePrompt: 'Vehicle name:',
        noVehicles: 'No vehicles. Add a new vehicle.',
        rename: 'Rename',
        renamePrompt: 'New name:',
        setPhoto: 'Add photo',
        delete: 'Delete vehicle',
        deleteConfirm: 'Delete this vehicle?'
      },
      logs: {
        title: 'Logs',
        empty: 'No logs',
        load: 'Load',
        rename: 'Rename log',
        renamePrompt: 'New log name:',
        delete: 'Delete log',
        deleteConfirm: 'Delete this log from the device? This cannot be undone.',
        columnWidth: 'Log column width',
        showData: 'Show log data',
        hideData: 'Hide log data',
        mainVisible: 'Main log is visible',
      },
      preset: {
        myPresets: 'My presets',
        addPreset: 'Add preset +',
        save: 'Save preset',
        saveAs: 'Save preset as',
        namePrompt: 'Preset name:',
        chart: 'Chart',
        map: 'Map',
        noFieldsMatch: 'Preset does not match the current log — fields not found in this file'
      },
      comparison: {
        addVehicle: 'Compare to another UAV',
        back: 'Back',
        selectLog: 'Select log to compare',
        noLogs: 'No logs for this vehicle',
        remove: 'Remove comparison',
        addFlightLogs: 'Compare to another flight',
        flightLogsHint: 'Overlay more saved logs from this vehicle on the same chart',
        flightLogsSubtitle: 'Saved logs for the selected vehicle — same fields as the main trace',
        maxComparisons: 'Up to {{count}} comparison layers allowed',
        noSavedLogsForVehicle: 'No saved logs for this vehicle',
        alreadyOnChart: 'Already on chart',
        isMainChartLog: 'This is the main log currently loaded',
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
