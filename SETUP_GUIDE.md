# מדריך התקנה מהיר - הגדרות API

## 🚀 התקנה מהירה (5 דקות)

### שלב 1: קבלת מפתח API
1. **היכנס ל-xAI Console**: https://console.x.ai/
2. **צור חשבון** או התחבר לחשבון קיים
3. **עבור ל-API Keys** בתפריט הצד
4. **לחץ על "Create API Key"**
5. **העתק את המפתח** שנוצר

### שלב 2: הגדרת משתני סביבה
1. **צור קובץ `.env.local`** בתיקיית הפרויקט
2. **העתק את התוכן הבא**:

```bash
# AI Provider Configuration
XAI_API_KEY=your-xai-api-key-here

# Authentication Configuration
AUTH_SECRET=your-auth-secret-here

# Application Configuration
NODE_ENV=development
npm_package_version=3.1.0
```

3. **החלף את `your-xai-api-key-here`** במפתח האמיתי שלך
4. **צור AUTH_SECRET** עם הפקודה:
   ```bash
   openssl rand -base64 32
   ```

### שלב 3: הפעלת האפליקציה
```bash
# התקנת תלויות (אם עוד לא התקנת)
pnpm install

# הפעלת שרת פיתוח
pnpm dev
```

### שלב 4: בדיקת החיבור
1. **פתח את האפליקציה** בדפדפן: http://localhost:3000
2. **לחץ על "Start Chat"**
3. **בדוק שהמודלים מופיעים** בסרגל העליון
4. **נסה לשלוח הודעה** לוודא שהחיבור עובד

## 🔧 הגדרות מתקדמות

### שינוי ספק AI
אם אתה רוצה להשתמש בספק אחר (OpenAI, Anthropic):

1. **התקן את החבילה הנדרשת**:
   ```bash
   # עבור OpenAI
   pnpm add @ai-sdk/openai
   
   # עבור Anthropic
   pnpm add @ai-sdk/anthropic
   ```

2. **עדכן את `lib/ai/providers.ts`**:
   ```typescript
   import { openai } from '@ai-sdk/openai';
   
   export const myProvider = customProvider({
     languageModels: {
       'chat-model': openai('gpt-4'),
       'chat-model-reasoning': openai('gpt-4'),
       'title-model': openai('gpt-3.5-turbo'),
       'artifact-model': openai('gpt-4'),
     },
   });
   ```

3. **הוסף את משתנה הסביבה**:
   ```bash
   OPENAI_API_KEY=your-openai-api-key-here
   ```

### הגדרת בסיס נתונים
**ברירת מחדל**: SQLite (אוטומטי)
**עבור ייצור**: PostgreSQL

```bash
# עבור PostgreSQL
POSTGRES_URL=postgresql://user:password@host:port/database
```

## ⚠️ פתרון בעיות נפוצות

### שגיאה: "API key not found"
```bash
# בדוק שקובץ .env.local קיים
ls -la .env.local

# בדוק שהמפתח נכון
cat .env.local | grep XAI_API_KEY
```

### שגיאה: "Model not available"
- ודא שהמפתח שלך תומך במודל
- בדוק את התוכנית שלך ב-xAI Console

### שגיאה: "Rate limit exceeded"
- המתן מספר דקות
- שקול לשדרג את התוכנית שלך

### האפליקציה לא נפתחת
```bash
# בדוק שהשרת רץ
netstat -ano | findstr :3000

# הפעל מחדש
pnpm dev
```

## 📊 בדיקת ביצועים

### בדיקת מהירות תגובה
1. פתח את Developer Tools (F12)
2. עבור ל-Network tab
3. שלח הודעה
4. בדוק את זמן התגובה

### בדיקת שימוש ב-API
1. היכנס ל-xAI Console
2. עבור ל-Usage
3. בדוק את השימוש שלך

## 🔒 אבטחה

### הגנה על מפתחות API
- **אל תעלה** את קובץ `.env.local` ל-Git
- **השתמש במשתני סביבה** בייצור
- **סובב מפתחות** באופן קבוע

### הגדרות ייצור
```bash
# הגדר משתני סביבה בייצור
NODE_ENV=production
XAI_API_KEY=your-production-key
AUTH_SECRET=your-production-secret
```

## 📞 תמיכה

- **תיעוד xAI**: https://docs.x.ai/
- **תיעוד AI SDK**: https://sdk.vercel.ai/
- **GitHub Issues**: פתח issue בפרויקט

## 🎯 צעדים הבאים

1. **התקן את האפליקציה** לפי המדריך
2. **בדוק שהכל עובד** עם הודעה פשוטה
3. **נסה את המודלים השונים** (Chat vs Reasoning)
4. **התנסה בתכונות מתקדמות** (אודיו, ארטיפקטים)
5. **הגדר ייצור** אם נדרש

