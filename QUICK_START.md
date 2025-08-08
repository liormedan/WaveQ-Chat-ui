# 🚀 התחלה מהירה - הגדרות API

## 📋 מה שחסר לך

הנה כל מה שצריך להגדיר כדי שהאפליקציה תעבוד:

### 1. **מפתח API של xAI**
- היכנס ל: https://console.x.ai/
- צור חשבון או התחבר
- עבור ל-API Keys
- צור מפתח חדש והעתק אותו

### 2. **קובץ הגדרות סביבה**
צור קובץ `.env.local` בתיקיית הפרויקט:

```bash
# AI Provider Configuration
XAI_API_KEY=your-xai-api-key-here

# Authentication Configuration
AUTH_SECRET=your-auth-secret-here

# Application Configuration
NODE_ENV=development
npm_package_version=3.1.0
```

### 3. **יצירת AUTH_SECRET**
הרץ את הפקודה הבאה:
```bash
openssl rand -base64 32
```
העתק את התוצאה והחלף את `your-auth-secret-here`

## 🔧 צעדים מעשיים

### שלב 1: קבלת מפתח API
1. פתח https://console.x.ai/
2. התחבר או צור חשבון
3. לחץ על "API Keys" בתפריט
4. לחץ על "Create API Key"
5. העתק את המפתח

### שלב 2: יצירת קובץ הגדרות
1. בתיקיית הפרויקט, צור קובץ חדש בשם `.env.local`
2. העתק את התוכן למעלה
3. החלף את `your-xai-api-key-here` במפתח האמיתי
4. החלף את `your-auth-secret-here` בסוד שנוצר

### שלב 3: הפעלת האפליקציה
```bash
pnpm dev
```

### שלב 4: בדיקה
1. פתח http://localhost:3000
2. לחץ על "Start Chat"
3. בדוק שהמודלים מופיעים בסרגל העליון

## 🤖 המודלים הזמינים

| מודל | תיאור | שימוש |
|------|--------|-------|
| **Chat Model** | מודל ראשי לשיחה | שיחות רגילות |
| **Reasoning Model** | מודל מתקדם עם חשיבה | ניתוח מורכב |

## ⚠️ בעיות נפוצות

### "API key not found"
- ודא שקובץ `.env.local` קיים
- ודא שהמפתח נכון
- הפעל מחדש את השרת

### "Model not available"
- בדוק שהמפתח תומך במודל
- בדוק את התוכנית שלך ב-xAI

### האפליקציה לא נפתחת
```bash
# בדוק שהשרת רץ
netstat -ano | findstr :3000

# הפעל מחדש
pnpm dev
```

## 📞 עזרה

- **תיעוד xAI**: https://docs.x.ai/
- **תיעוד AI SDK**: https://sdk.vercel.ai/
- **GitHub Issues**: פתח issue בפרויקט

## 🎯 מה הלאה?

1. ✅ הגדר את המפתחות
2. ✅ הפעל את האפליקציה
3. ✅ בדוק שהכל עובד
4. 🚀 התחל להשתמש!

---

**הערה**: כל המידע המלא נמצא בקובץ `API_SETTINGS.md`

