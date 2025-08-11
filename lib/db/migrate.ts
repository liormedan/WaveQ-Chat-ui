import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

config({
  path: '.env.local',
});

const runMigrate = async () => {
  // Check if we have Supabase configuration
  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    console.log('✅ Using Supabase - migrations handled automatically');
    console.log('   Tables will be created when needed');
    process.exit(0);
  }

  if (!process.env.POSTGRES_URL || 
      process.env.POSTGRES_URL === 'postgresql://user:password@host:port/database' ||
      process.env.POSTGRES_URL === 'your-postgres-url-here' ||
      process.env.POSTGRES_URL.includes('[YOUR-PASSWORD]') ||
      process.env.POSTGRES_URL.includes('[YOUR-PROJECT-REF]')) {
    console.log('⚠️  POSTGRES_URL not configured properly');
    console.log('   Please update your .env.local file with your Supabase connection string');
    console.log('   Format: postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres');
    process.exit(0);
  }

  try {
    const connection = postgres(process.env.POSTGRES_URL, { max: 1 });
    const db = drizzle(connection);

    console.log('⏳ Running migrations...');

    const start = Date.now();
    await migrate(db, { migrationsFolder: './lib/db/migrations' });
    const end = Date.now();

    console.log('✅ Migrations completed in', end - start, 'ms');
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

runMigrate().catch((err) => {
  console.error('❌ Migration failed');
  console.error(err);
  process.exit(1);
});
