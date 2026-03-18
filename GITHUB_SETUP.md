# הגדרת GitHub – Smart Log Viewer

## דרישות מוקדמות

- [Git](https://git-scm.com/downloads) מותקן
- חשבון [GitHub](https://github.com)

## שלב 1: התקנת Git (אם עדיין לא מותקן)

הורד והתקן מ־https://git-scm.com/downloads

## שלב 2: אתחול הפרויקט

```bash
cd "c:\Users\shibe\תוכנת לוגים"

# אתחול Git
git init

# הוספת כל הקבצים
git add .

# Commit ראשון
git commit -m "Initial commit: Smart Log Viewer - ArduPilot BIN log analysis"
```

## שלב 3: יצירת Repository ב-GitHub

1. היכנס ל־https://github.com
2. לחץ על **New repository**
3. שם: `smart-log-viewer` (או שם אחר)
4. בחר **Private** או **Public**
5. **אל** תסמן "Add a README" – כבר קיים
6. לחץ **Create repository**

## שלב 4: חיבור ו-Push

```bash
# החלף YOUR_USERNAME ו-YOUR_REPO בשם המשתמש והריפו שלך
git remote add origin https://github.com/YOUR_USERNAME/smart-log-viewer.git

# Push ל-main
git branch -M main
git push -u origin main
```

## שלב 5: אימות (אם נדרש)

אם GitHub דורש אימות:
- **HTTPS:** השתמש ב־Personal Access Token במקום סיסמה
- **SSH:** הגדר מפתח SSH ב־GitHub

## פקודות שימושיות

```bash
git status          # מצב הקבצים
git add .           # הוספת שינויים
git commit -m "..." # שמירת commit
git push            # שליחה ל-GitHub
```
