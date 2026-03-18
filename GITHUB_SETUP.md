# הגדרת GitHub – Smart Log Viewer

## סטטוס

- Git מותקן
- GitHub CLI (gh) מותקן
- Commit ראשון נוצר

## שלב אחרון: התחברות ו-Push

### אופציה א' – GitHub CLI (מומלץ)

1. פתח טרמינל חדש (כדי ש־PATH יתעדכן)
2. הרץ:
   ```powershell
   cd "c:\Users\shibe\תוכנת לוגים"
   gh auth login
   ```
3. עקוב אחרי ההנחיות (בחר GitHub.com, HTTPS, התחבר בדפדפן)
4. הרץ:
   ```powershell
   .\push-to-github.ps1
   ```

### אופציה ב' – ידנית

1. צור repository ב־https://github.com/new  
   שם: `smart-log-viewer`, Public, בלי README
2. הרץ:
   ```powershell
   cd "c:\Users\shibe\תוכנת לוגים"
   git remote add origin https://github.com/YOUR_USERNAME/smart-log-viewer.git
   git branch -M main
   git push -u origin main
   ```
   החלף `YOUR_USERNAME` בשם המשתמש שלך ב-GitHub.
