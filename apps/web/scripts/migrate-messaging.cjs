const fs = require('fs');
const path = require('path');

// 1. Read DATABASE_URL from d:\AxorksOS\.env.local using fs
function getDatabaseUrl() {
  const envPaths = [
    path.resolve(__dirname, '../../../.env.local'),
    'd:\\AxorksOS\\.env.local',
    path.resolve(__dirname, '../.env.local'),
    path.resolve(process.cwd(), '.env.local'),
    path.resolve(process.cwd(), '../../.env.local')
  ];

  for (const envPath of envPaths) {
    try {
      if (fs.existsSync(envPath)) {
        console.log(`Reading env from: ${envPath}`);
        const content = fs.readFileSync(envPath, 'utf8');
        const lines = content.split(/\r?\n/);
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const match = trimmed.match(/^DATABASE_URL\s*=\s*(.*)$/);
          if (match) {
            let val = match[1].trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1);
            }
            if (val) return val;
          }
        }
      }
    } catch (err) {
      console.warn(`Could not read ${envPath}:`, err.message);
    }
  }

  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  throw new Error('DATABASE_URL not found in .env.local or process.env');
}

// 2. Require @neondatabase/serverless
let neon;
try {
  const neonModule = require('@neondatabase/serverless');
  neon = neonModule.neon;
} catch (e1) {
  try {
    const neonModule = require('d:/AxorksOS/node_modules/@neondatabase/serverless');
    neon = neonModule.neon;
  } catch (e2) {
    const neonModule = require(path.resolve(__dirname, '../../../../node_modules/@neondatabase/serverless'));
    neon = neonModule.neon;
  }
}

async function runMigration() {
  try {
    const dbUrl = getDatabaseUrl();
    console.log('Database URL acquired successfully (starts with):', dbUrl.substring(0, 20) + '...');
    const sql = neon(dbUrl);

    console.log('\n--- Step 1: Creating internal_messages table ---');
    await sql`
      CREATE TABLE IF NOT EXISTS internal_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sender_id TEXT NOT NULL,
        sender_name TEXT NOT NULL,
        recipient_id TEXT NOT NULL,
        recipient_name TEXT NOT NULL,
        subject TEXT,
        body TEXT NOT NULL,
        body_html TEXT,
        has_attachments BOOLEAN DEFAULT FALSE,
        attachments JSONB DEFAULT '[]'::jsonb,
        is_read BOOLEAN DEFAULT FALSE,
        requires_approval BOOLEAN DEFAULT FALSE,
        approval_status TEXT DEFAULT 'none' CHECK (approval_status IN ('none','pending','approved','rejected')),
        approved_by TEXT,
        approved_at TIMESTAMPTZ,
        rejection_reason TEXT,
        parent_message_id UUID REFERENCES internal_messages(id),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    console.log('✓ Table internal_messages created or already exists');

    console.log('\n--- Step 2: Creating indexes on internal_messages ---');
    await sql`
      CREATE INDEX IF NOT EXISTS idx_internal_messages_recipient ON internal_messages(recipient_id);
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_internal_messages_sender ON internal_messages(sender_id);
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_internal_messages_approval ON internal_messages(approval_status) WHERE requires_approval = TRUE;
    `;
    console.log('✓ Indexes created or already exist');

    console.log('\n--- Step 3: Altering projects table columns ---');
    await sql`
      ALTER TABLE projects ADD COLUMN IF NOT EXISTS assigned_to TEXT[];
    `;
    await sql`
      ALTER TABLE projects ADD COLUMN IF NOT EXISTS assigned_by TEXT;
    `;
    await sql`
      ALTER TABLE projects ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;
    `;
    console.log('✓ Projects table columns added or already exist');

    console.log('\n--- Step 4: Verifying schema via information_schema ---');
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name IN ('internal_messages', 'projects', 'users');
    `;
    console.log('Tables found in public schema:', tables.map(t => t.table_name));

    const columns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'internal_messages'
      ORDER BY ordinal_position;
    `;
    console.log('internal_messages columns:');
    columns.forEach(c => console.log(`  - ${c.column_name} (${c.data_type})`));

    const projectColumns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'projects' AND column_name IN ('assigned_to', 'assigned_by', 'assigned_at')
      ORDER BY ordinal_position;
    `;
    console.log('projects assigned columns:');
    projectColumns.forEach(c => console.log(`  - ${c.column_name} (${c.data_type})`));

    console.log('\n--- Step 5: Verifying protected user profiles ---');
    const users = await sql`
      SELECT id, email, first_name, last_name, role, status 
      FROM users 
      WHERE deleted_at IS NULL;
    `;
    console.log(`Found ${users.length} active user profiles:`);
    console.table(users);

    console.log('\n========================================');
    console.log('MIGRATION STATUS: SUCCESSFUL');
    console.log('========================================\n');
  } catch (error) {
    console.error('\n========================================');
    console.error('MIGRATION STATUS: FAILED');
    console.error('Error details:', error);
    console.error('========================================\n');
    process.exit(1);
  }
}

runMigration();
