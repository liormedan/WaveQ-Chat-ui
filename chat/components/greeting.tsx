import { motion } from 'framer-motion';
import { AudioIcon, CodeIcon, TerminalIcon } from './icons';

export const Greeting = () => {
  return (
    <div
      key="overview"
      className="max-w-3xl mx-auto md:mt-20 px-8 size-full flex flex-col justify-center"
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.5 }}
        className="text-2xl font-semibold"
      >
        שלום! ברוכים הבאים לאפליקציית עיבוד אודיו
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.6 }}
        className="text-lg text-zinc-500 mt-4"
      >
        העלה קובץ אודיו ותן הוראות לעיבוד - אני אייצא קוד לטרמינל נפרד
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.7 }}
        className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
          <AudioIcon size={20} />
          <div>
            <div className="font-medium">העלאת אודיו</div>
            <div className="text-sm text-muted-foreground">תמך בקבצי MP3, WAV, OGG</div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
          <CodeIcon size={20} />
          <div>
            <div className="font-medium">יצירת קוד</div>
            <div className="text-sm text-muted-foreground">קוד אוטומטי לעיבוד</div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
          <TerminalIcon size={20} />
          <div>
            <div className="font-medium">טרמינל נפרד</div>
            <div className="text-sm text-muted-foreground">העתקה והרצה קלה</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
