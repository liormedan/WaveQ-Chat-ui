'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  SettingsIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  InfoIcon,
} from '@/components/icons';
import type { Session } from 'next-auth';

interface SettingsPageProps {
  session: Session;
}

export default function SettingsPage({ session }: SettingsPageProps) {
  const router = useRouter();
  const [apiKey, setApiKey] = useState('');
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    'idle' | 'success' | 'error'
  >('idle');
  const [connectionMessage, setConnectionMessage] = useState('');

  const userType = session.user.type;

  const handleReturnToChat = () => {
    router.push('/');
  };

  const testApiConnection = async () => {
    setIsTestingConnection(true);
    setConnectionStatus('idle');

    try {
      const response = await fetch('/api/health');
      if (response.ok) {
        setConnectionStatus('success');
        setConnectionMessage('החיבור ל-API עובד בהצלחה!');
      } else {
        setConnectionStatus('error');
        setConnectionMessage('שגיאה בחיבור ל-API');
      }
    } catch (error) {
      setConnectionStatus('error');
      setConnectionMessage('שגיאה בחיבור ל-API');
    } finally {
      setIsTestingConnection(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <SettingsIcon size={24} />
          <h1 className="text-3xl font-bold">הגדרות</h1>
        </div>
        <Button
          onClick={handleReturnToChat}
          variant="outline"
          className="flex items-center gap-2"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M10.5 3.5L5.5 8L10.5 12.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          חזרה לצ'אט
        </Button>
      </div>

      {/* API Configuration */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon size={20} />
            הגדרות API
          </CardTitle>
          <CardDescription>
            הגדר את מפתח ה-API שלך כדי להתחיל להשתמש באפליקציה
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">מפתח API של xAI</Label>
            <div className="flex gap-2">
              <Input
                id="api-key"
                type="password"
                placeholder="הכנס את מפתח ה-API שלך"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={testApiConnection}
                disabled={!apiKey || isTestingConnection}
                variant="outline"
              >
                {isTestingConnection ? 'בודק...' : 'בדוק חיבור'}
              </Button>
            </div>
          </div>

          {connectionStatus !== 'idle' && (
            <Alert
              className={
                connectionStatus === 'success'
                  ? 'border-green-500'
                  : 'border-red-500'
              }
            >
              {connectionStatus === 'success' ? (
                <CheckCircleIcon size={16} />
              ) : (
                <AlertCircleIcon size={16} />
              )}
              <AlertDescription>{connectionMessage}</AlertDescription>
            </Alert>
          )}

          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-2">איך לקבל מפתח API:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>
                היכנס ל:{' '}
                <a
                  href="https://console.x.ai/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  https://console.x.ai/
                </a>
              </li>
              <li>צור חשבון או התחבר לחשבון קיים</li>
              <li>עבור ל-API Keys בתפריט הצד</li>
              <li>לחץ על "Create API Key"</li>
              <li>העתק את המפתח ושמור אותו</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Available Models */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>מודלים זמינים</CardTitle>
          <CardDescription>
            המודלים שתוכל להשתמש בהם לפי סוג המשתמש שלך
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-semibold">Chat Model</h4>
                <p className="text-sm text-muted-foreground">
                  Primary model for all-purpose chat
                </p>
              </div>
              <Badge variant="secondary">chat-model</Badge>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-semibold">Reasoning Model</h4>
                <p className="text-sm text-muted-foreground">
                  Uses advanced reasoning
                </p>
              </div>
              <Badge variant="secondary">chat-model-reasoning</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Providers Information */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>ספקי AI נתמכים</CardTitle>
          <CardDescription>
            מידע על הספקים והמודלים שנתמכים באפליקציה
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* xAI */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-lg">xAI (Grok)</h4>
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  ספק ראשי
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-medium">מודלים:</span>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Grok-2-Vision-1212 (Chat)</li>
                    <li>Grok-3-Mini-Beta (Reasoning)</li>
                    <li>Grok-2-1212 (Title/Artifact)</li>
                  </ul>
                </div>
                <div>
                  <span className="font-medium">תכונות:</span>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>חשיבה מתקדמת</li>
                    <li>תמיכה בתמונות</li>
                    <li>ביצועים גבוהים</li>
                  </ul>
                </div>
              </div>
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <span className="font-medium text-blue-800">הגדרה:</span>
                <p className="text-sm text-blue-700 mt-1">
                  הוסף{' '}
                  <code className="bg-blue-100 px-1 rounded">
                    XAI_API_KEY=your-key
                  </code>{' '}
                  לקובץ .env.local
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  <a
                    href="https://console.x.ai/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    קבל מפתח API מ-xAI Console →
                  </a>
                </p>
              </div>
            </div>

            {/* OpenAI */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-lg">OpenAI</h4>
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  נתמך
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-medium">מודלים:</span>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>GPT-4 Turbo</li>
                    <li>GPT-4 Vision</li>
                    <li>GPT-3.5 Turbo</li>
                    <li>DALL-E 3</li>
                  </ul>
                </div>
                <div>
                  <span className="font-medium">תכונות:</span>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>יצירת תמונות</li>
                    <li>ניתוח תמונות</li>
                    <li>ביצועים יציבים</li>
                  </ul>
                </div>
              </div>
              <div className="mt-3 p-3 bg-green-50 rounded-lg">
                <span className="font-medium text-green-800">הגדרה:</span>
                <p className="text-sm text-green-700 mt-1">
                  הוסף{' '}
                  <code className="bg-green-100 px-1 rounded">
                    OPENAI_API_KEY=your-key
                  </code>{' '}
                  לקובץ .env.local
                </p>
                <p className="text-sm text-green-700 mt-1">
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    קבל מפתח API מ-OpenAI Platform →
                  </a>
                </p>
              </div>
            </div>

            {/* Anthropic */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-lg">Anthropic (Claude)</h4>
                <Badge
                  variant="outline"
                  className="bg-purple-50 text-purple-700"
                >
                  נתמך
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-medium">מודלים:</span>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Claude-3-Sonnet</li>
                    <li>Claude-3-Haiku</li>
                    <li>Claude-3-Opus</li>
                    <li>Claude-3-Vision</li>
                  </ul>
                </div>
                <div>
                  <span className="font-medium">תכונות:</span>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>בטיחות גבוהה</li>
                    <li>ניתוח תמונות</li>
                    <li>ביצועים מהירים</li>
                  </ul>
                </div>
              </div>
              <div className="mt-3 p-3 bg-purple-50 rounded-lg">
                <span className="font-medium text-purple-800">הגדרה:</span>
                <p className="text-sm text-purple-700 mt-1">
                  הוסף{' '}
                  <code className="bg-purple-100 px-1 rounded">
                    ANTHROPIC_API_KEY=your-key
                  </code>{' '}
                  לקובץ .env.local
                </p>
                <p className="text-sm text-purple-700 mt-1">
                  <a
                    href="https://console.anthropic.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    קבל מפתח API מ-Anthropic Console →
                  </a>
                </p>
              </div>
            </div>

            {/* Google */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-lg">Google (Gemini)</h4>
                <Badge
                  variant="outline"
                  className="bg-orange-50 text-orange-700"
                >
                  נתמך
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-medium">מודלים:</span>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Gemini Pro</li>
                    <li>Gemini Pro Vision</li>
                    <li>Gemini Flash</li>
                    <li>Gemini Ultra</li>
                  </ul>
                </div>
                <div>
                  <span className="font-medium">תכונות:</span>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>מולטימדיה מתקדמת</li>
                    <li>אינטגרציה עם Google</li>
                    <li>ביצועים מהירים</li>
                  </ul>
                </div>
              </div>
              <div className="mt-3 p-3 bg-orange-50 rounded-lg">
                <span className="font-medium text-orange-800">הגדרה:</span>
                <p className="text-sm text-orange-700 mt-1">
                  הוסף{' '}
                  <code className="bg-orange-100 px-1 rounded">
                    GOOGLE_API_KEY=your-key
                  </code>{' '}
                  לקובץ .env.local
                </p>
                <p className="text-sm text-orange-700 mt-1">
                  <a
                    href="https://makersuite.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    קבל מפתח API מ-Google AI Studio →
                  </a>
                </p>
              </div>
            </div>

            {/* Mistral */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-lg">Mistral AI</h4>
                <Badge
                  variant="outline"
                  className="bg-indigo-50 text-indigo-700"
                >
                  נתמך
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-medium">מודלים:</span>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Mistral Large</li>
                    <li>Mistral Medium</li>
                    <li>Mistral Small</li>
                    <li>Mixtral 8x7B</li>
                  </ul>
                </div>
                <div>
                  <span className="font-medium">תכונות:</span>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>קוד פתוח</li>
                    <li>ביצועים טובים</li>
                    <li>יעילות גבוהה</li>
                  </ul>
                </div>
              </div>
              <div className="mt-3 p-3 bg-indigo-50 rounded-lg">
                <span className="font-medium text-indigo-800">הגדרה:</span>
                <p className="text-sm text-indigo-700 mt-1">
                  הוסף{' '}
                  <code className="bg-indigo-100 px-1 rounded">
                    MISTRAL_API_KEY=your-key
                  </code>{' '}
                  לקובץ .env.local
                </p>
                <p className="text-sm text-indigo-700 mt-1">
                  <a
                    href="https://console.mistral.ai/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    קבל מפתח API מ-Mistral Console →
                  </a>
                </p>
              </div>
            </div>

            {/* Meta */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-lg">Meta (Llama)</h4>
                <Badge variant="outline" className="bg-teal-50 text-teal-700">
                  נתמך
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-medium">מודלים:</span>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Llama 3.1 405B</li>
                    <li>Llama 3.1 70B</li>
                    <li>Llama 3.1 8B</li>
                    <li>Code Llama</li>
                  </ul>
                </div>
                <div>
                  <span className="font-medium">תכונות:</span>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>קוד פתוח</li>
                    <li>פיתוח קוד</li>
                    <li>ביצועים טובים</li>
                  </ul>
                </div>
              </div>
              <div className="mt-3 p-3 bg-teal-50 rounded-lg">
                <span className="font-medium text-teal-800">הגדרה:</span>
                <p className="text-sm text-teal-700 mt-1">
                  הוסף{' '}
                  <code className="bg-teal-100 px-1 rounded">
                    META_API_KEY=your-key
                  </code>{' '}
                  לקובץ .env.local
                </p>
                <p className="text-sm text-teal-700 mt-1">
                  <a
                    href="https://ai.meta.com/llama/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    קבל מפתח API מ-Meta AI →
                  </a>
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Limits */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>הגבלות משתמש</CardTitle>
          <CardDescription>המגבלות החלות על החשבון שלך</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>סוג משתמש:</span>
              <Badge variant="outline">{userType}</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span>הודעות מקסימליות ליום:</span>
              <Badge variant="outline">{userType === 'guest' ? 20 : 100}</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span>מודלים זמינים:</span>
              <Badge variant="outline">2</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Environment Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <InfoIcon size={20} />
            מידע על הסביבה
          </CardTitle>
          <CardDescription>פרטי התצורה הנוכחית של האפליקציה</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>סביבה:</span>
              <Badge variant="outline">
                {process.env.NODE_ENV || 'development'}
              </Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span>גרסת אפליקציה:</span>
              <Badge variant="outline">
                {process.env.npm_package_version || '3.1.0'}
              </Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span>בסיס נתונים:</span>
              <Badge variant="outline">
                {process.env.POSTGRES_URL ? 'PostgreSQL' : 'SQLite'}
              </Badge>
            </div>
            <Separator />
            <div className="space-y-3">
              <span className="font-medium">דוגמה לקובץ .env.local:</span>
              <div className="bg-gray-100 p-4 rounded-lg font-mono text-sm">
                <div className="text-gray-600"># AI Provider API Keys</div>
                <div className="text-blue-600">
                  XAI_API_KEY=your-xai-key-here
                </div>
                <div className="text-green-600">
                  OPENAI_API_KEY=your-openai-key-here
                </div>
                <div className="text-purple-600">
                  ANTHROPIC_API_KEY=your-anthropic-key-here
                </div>
                <div className="text-orange-600">
                  GOOGLE_API_KEY=your-google-key-here
                </div>
                <div className="text-indigo-600">
                  MISTRAL_API_KEY=your-mistral-key-here
                </div>
                <div className="text-teal-600">
                  META_API_KEY=your-meta-key-here
                </div>
                <div className="text-gray-600 mt-2"># Authentication</div>
                <div className="text-gray-600">
                  AUTH_SECRET=your-auth-secret-here
                </div>
                <div className="text-gray-600 mt-2"># Database (Optional)</div>
                <div className="text-gray-600">
                  # POSTGRES_URL=postgresql://user:password@host:port/database
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
