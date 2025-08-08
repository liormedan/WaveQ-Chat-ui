# הגדרות API ומודלים לשיחה

## 🔑 משתני סביבה נדרשים

צור קובץ `.env.local` בתיקיית הפרויקט עם ההגדרות הבאות:

```bash
# AI Provider Configuration
# ========================

# XAI (xAI) API Configuration
# קבל את מפתח ה-API מ: https://console.x.ai/
XAI_API_KEY=your-xai-api-key-here

# Database Configuration
# =====================

# PostgreSQL (for production)
# POSTGRES_URL=postgresql://user:password@host:port/database

# Authentication Configuration
# ==========================

# NextAuth Secret (generate with: openssl rand -base64 32)
AUTH_SECRET=your-auth-secret-here

# Application Configuration
# ========================

# Node Environment
NODE_ENV=development

# Application Version
npm_package_version=3.1.0
```

## 🤖 מודלים זמינים

האפליקציה תומכת במודלים הבאים:

### 1. **Chat Model** (`chat-model`)
- **תיאור**: מודל ראשי לשיחה כללית
- **ספק**: xAI Grok-2-Vision-1212
- **שימוש**: שיחות רגילות, שאלות ותשובות

### 2. **Reasoning Model** (`chat-model-reasoning`)
- **תיאור**: מודל מתקדם עם יכולת חשיבה
- **ספק**: xAI Grok-3-Mini-Beta
- **שימוש**: ניתוח מורכב, פתרון בעיות, חשיבה לוגית

### 3. **Title Model** (`title-model`)
- **תיאור**: מודל ליצירת כותרות
- **ספק**: xAI Grok-2-1212
- **שימוש**: יצירת כותרות לשיחות

### 4. **Artifact Model** (`artifact-model`)
- **תיאור**: מודל ליצירת ארטיפקטים
- **ספק**: xAI Grok-2-1212
- **שימוש**: יצירת קוד, תמונות, מסמכים

## 🔧 הגדרת ספקי AI

### XAI (מומלץ)
```typescript
// lib/ai/providers.ts
export const myProvider = customProvider({
  languageModels: {
    'chat-model': xai('grok-2-vision-1212'),
    'chat-model-reasoning': wrapLanguageModel({
      model: xai('grok-3-mini-beta'),
      middleware: extractReasoningMiddleware({ tagName: 'think' }),
    }),
    'title-model': xai('grok-2-1212'),
    'artifact-model': xai('grok-2-1212'),
  },
  imageModels: {
    'small-model': xai.imageModel('grok-2-image'),
  },
});
```

### OpenAI (אופציונלי)
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

### Anthropic (אופציונלי)
```typescript
import { anthropic } from '@ai-sdk/anthropic';

export const myProvider = customProvider({
  languageModels: {
    'chat-model': anthropic('claude-3-sonnet-20240229'),
    'chat-model-reasoning': anthropic('claude-3-sonnet-20240229'),
    'title-model': anthropic('claude-3-haiku-20240307'),
    'artifact-model': anthropic('claude-3-sonnet-20240229'),
  },
});
```

## 📊 הרשאות משתמשים

### משתמש אורח (Guest)
- **הודעות מקסימליות ליום**: 20
- **מודלים זמינים**: chat-model, chat-model-reasoning

### משתמש רגיל (Regular)
- **הודעות מקסימליות ליום**: 100
- **מודלים זמינים**: chat-model, chat-model-reasoning

## 🚀 הוראות התקנה

### 1. קבלת מפתח API
1. היכנס ל: https://console.x.ai/
2. צור חשבון חדש או התחבר
3. עבור ל-API Keys
4. צור מפתח חדש
5. העתק את המפתח

### 2. הגדרת משתני סביבה
1. צור קובץ `.env.local` בתיקיית הפרויקט
2. העתק את התוכן מ-API_SETTINGS.md
3. החלף את `your-xai-api-key-here` במפתח האמיתי שלך

### 3. הפעלת האפליקציה
```bash
# התקנת תלויות
pnpm install

# הפעלת שרת פיתוח
pnpm dev
```

## 🔍 בדיקת ההגדרות

### בדיקת חיבור API
```bash
# בדיקת חיבור ל-xAI
curl -H "Authorization: Bearer YOUR_XAI_API_KEY" \
     https://api.x.ai/v1/models
```

### בדיקת מודלים זמינים
1. פתח את האפליקציה בדפדפן
2. לחץ על בחירת המודל בסרגל העליון
3. ודא שהמודלים מופיעים ברשימה

## ⚠️ פתרון בעיות

### שגיאת "API key not found"
- ודא שקובץ `.env.local` קיים
- ודא שהמפתח נכון
- הפעל מחדש את השרת

### שגיאת "Model not available"
- בדוק שהמודל זמין ב-xAI
- ודא שהמפתח שלך תומך במודל

### שגיאת "Rate limit exceeded"
- המתן מספר דקות
- שקול לשדרג את התוכנית שלך ב-xAI

## 📞 תמיכה

- **תיעוד xAI**: https://docs.x.ai/
- **תיעוד AI SDK**: https://sdk.vercel.ai/
- **GitHub Issues**: פתח issue בפרויקט

