# 🚀 מדריך פריסה ל-Vercel - ייצור

## 📋 דרישות מקדימות

### 1. חשבון Vercel
- היכנס ל: https://vercel.com
- צור חשבון חדש או התחבר לחשבון קיים
- חבר את חשבון GitHub שלך

### 2. מפתחות API נדרשים
- **xAI API Key**: https://console.x.ai/
- **AUTH_SECRET**: צור עם `openssl rand -base64 32`

### 3. בסיס נתונים PostgreSQL (מומלץ לייצור)
- **Vercel Postgres** (מומלץ): https://vercel.com/storage/postgres
- **Neon** (אלטרנטיבה): https://neon.tech
- **Supabase** (אלטרנטיבה): https://supabase.com

## 🔧 שלבי הפריסה

### שלב 1: הכנת הפרויקט

1. **ודא שהקוד מוכן לייצור**:
   ```bash
   # בדוק שהכל עובד מקומית
   pnpm build
   pnpm start
   ```

2. **צור קובץ `vercel.json`** (כבר קיים):
   ```json
   {
     "buildCommand": "pnpm build",
     "devCommand": "pnpm dev",
     "installCommand": "pnpm install",
     "framework": "nextjs",
     "regions": ["iad1"],
     "functions": {
       "app/(chat)/api/chat/[id]/stream/route.ts": {
         "maxDuration": 300
       },
       "app/(chat)/api/audio/generate/route.ts": {
         "maxDuration": 300
       }
     },
     "env": {
       "NODE_ENV": "production"
     }
   }
   ```

### שלב 2: פריסה ל-Vercel

#### אפשרות A: פריסה דרך GitHub (מומלץ)

1. **דחוף את הקוד ל-GitHub**:
   ```bash
   git add .
   git commit -m "Prepare for production deployment"
   git push origin main
   ```

2. **פרוס דרך Vercel Dashboard**:
   - היכנס ל: https://vercel.com/dashboard
   - לחץ על "New Project"
   - בחר את repository שלך
   - הגדר את משתני הסביבה (ראה להלן)
   - לחץ על "Deploy"

#### אפשרות B: פריסה דרך Vercel CLI

1. **התקן Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **התחבר ל-Vercel**:
   ```bash
   vercel login
   ```

3. **פרוס את הפרויקט**:
   ```bash
   vercel --prod
   ```

### שלב 3: הגדרת משתני סביבה

#### משתנים נדרשים ב-Vercel Dashboard:

1. **היכנס ל-Vercel Dashboard** → הפרויקט שלך → Settings → Environment Variables

2. **הוסף את המשתנים הבאים**:

   ```bash
   # AI Provider Configuration
   XAI_API_KEY=your-xai-api-key-here
   
   # Authentication Configuration
   AUTH_SECRET=your-auth-secret-here
   
   # Database Configuration (for production)
   POSTGRES_URL=postgresql://user:password@host:port/database
   
   # Application Configuration
   NODE_ENV=production
   npm_package_version=3.1.0
   ```

#### יצירת AUTH_SECRET:
   ```bash
   openssl rand -base64 32
   ```

### שלב 4: הגדרת בסיס נתונים

#### אפשרות A: Vercel Postgres (מומלץ)

1. **צור Vercel Postgres**:
   - היכנס ל: https://vercel.com/storage/postgres
   - לחץ על "Create Database"
   - בחר את הפרויקט שלך
   - הגדר את הפרטים הנדרשים

2. **קבל את ה-URL**:
   - העתק את ה-POSTGRES_URL מה-Dashboard
   - הוסף אותו למשתני הסביבה

3. **הרץ מיגרציות**:
   ```bash
   # מקומית (לפני הפריסה)
   pnpm db:migrate
   
   # או דרך Vercel Functions
   # הפרויקט יבצע מיגרציות אוטומטית בזמן הבנייה
   ```

#### אפשרות B: Neon Database

1. **צור חשבון ב-Neon**:
   - היכנס ל: https://neon.tech
   - צור פרויקט חדש
   - קבל את ה-connection string

2. **הגדר את המשתנה**:
   ```bash
   POSTGRES_URL=postgresql://user:password@host:port/database
   ```

### שלב 5: בדיקת הפריסה

1. **בדוק שהאפליקציה עובדת**:
   - פתח את ה-URL שניתן לך
   - בדוק שהדף נטען
   - נסה להתחבר או ליצור חשבון

2. **בדוק את הפונקציונליות**:
   - נסה ליצור שיחה חדשה
   - שלח הודעה
   - בדוק שהמודלים עובדים

3. **בדוק את הלוגים**:
   - היכנס ל-Vercel Dashboard → Functions
   - בדוק שאין שגיאות

## 🔒 הגדרות אבטחה

### 1. משתני סביבה
- **אל תעלה** את קובץ `.env.local` ל-Git
- **השתמש במשתני סביבה** של Vercel
- **סובב מפתחות** באופן קבוע

### 2. HTTPS
- Vercel מספק HTTPS אוטומטי
- אין צורך בהגדרות נוספות

### 3. CORS
- Vercel מטפל ב-CORS אוטומטית
- אין צורך בהגדרות נוספות

## 📊 ניטור וביצועים

### 1. Vercel Analytics
- היכנס ל-Vercel Dashboard → Analytics
- בדוק את הביצועים והשימוש

### 2. Function Logs
- היכנס ל-Vercel Dashboard → Functions
- בדוק את הלוגים של הפונקציות

### 3. Database Monitoring
- אם משתמש ב-Vercel Postgres: Dashboard → Storage → Postgres
- אם משתמש ב-Neon: Neon Dashboard

## ⚠️ פתרון בעיות נפוצות

### שגיאה: "Build failed"
```bash
# בדוק את הלוגים ב-Vercel Dashboard
# בדוק שמשתני הסביבה מוגדרים נכון
# בדוק שהתלויות מותקנות נכון
```

### שגיאה: "Database connection failed"
```bash
# בדוק שה-POSTGRES_URL נכון
# בדוק שהמיגרציות רצו
# בדוק שהדאטאבייס נגיש
```

### שגיאה: "API key not found"
```bash
# בדוק שה-XAI_API_KEY מוגדר נכון
# בדוק שהמפתח תקף
# בדוק שהמפתח תומך במודלים הנדרשים
```

### שגיאה: "Function timeout"
```bash
# בדוק את הגדרות ה-maxDuration ב-vercel.json
# בדוק שהפונקציות לא רצות יותר מדי זמן
```

## 🔄 עדכונים עתידיים

### 1. עדכון קוד
```bash
# דחוף שינויים ל-GitHub
git add .
git commit -m "Update application"
git push origin main

# Vercel יבנה ויפרוס אוטומטית
```

### 2. עדכון משתני סביבה
- היכנס ל-Vercel Dashboard → Settings → Environment Variables
- עדכן את המשתנים הנדרשים
- הפרויקט ייבנה מחדש אוטומטית

### 3. Rollback
- היכנס ל-Vercel Dashboard → Deployments
- בחר את הגרסה הקודמת
- לחץ על "Redeploy"

## 📞 תמיכה

- **Vercel Documentation**: https://vercel.com/docs
- **Vercel Support**: https://vercel.com/support
- **GitHub Issues**: פתח issue בפרויקט

## 🎯 צעדים הבאים

1. **פרוס את האפליקציה** לפי המדריך
2. **בדוק שהכל עובד** בייצור
3. **הגדר ניטור** ו-analytics
4. **בדוק ביצועים** וטען בדיקות
5. **הגדר CI/CD** אם נדרש

---

**הערה**: מדריך זה מניח שאתה משתמש ב-pnpm. אם אתה משתמש ב-npm או yarn, החלף את הפקודות בהתאם.
