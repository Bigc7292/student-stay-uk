import { createClient } from '@supabase/supabase-js';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '../.env') });

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Required: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  try {
    console.log('🚀 Setting up Supabase database schema...');
    
    // Read the SQL schema file
    const schemaPath = path.join(__dirname, 'setup-supabase-schema.sql');
    const schemaSql = await fs.readFile(schemaPath, 'utf8');
    
    console.log('📝 Executing database schema...');
    
    // Execute the schema SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: schemaSql });
    
    if (error) {
      console.error('❌ Error executing schema:', error);
      
      // Try alternative approach - execute statements one by one
      console.log('🔄 Trying alternative approach...');
      await executeSchemaStatements(schemaSql);
    } else {
      console.log('✅ Database schema created successfully!');
    }
    
    // Test the tables
    await testTables();
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

async function executeSchemaStatements(schemaSql) {
  // Split SQL into individual statements
  const statements = schemaSql
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
  
  console.log(`📊 Executing ${statements.length} SQL statements...`);
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    if (statement.trim()) {
      try {
        console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
        
        // Use the SQL editor approach
        const { data, error } = await supabase
          .from('_sql')
          .select('*')
          .limit(1);
        
        if (error) {
          // If that doesn't work, try direct SQL execution
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'apikey': supabaseServiceKey
            },
            body: JSON.stringify({ sql: statement })
          });
          
          if (!response.ok) {
            console.warn(`⚠️ Statement ${i + 1} failed:`, statement.substring(0, 100) + '...');
          }
        }
      } catch (error) {
        console.warn(`⚠️ Error in statement ${i + 1}:`, error.message);
      }
    }
  }
}

async function testTables() {
  console.log('🧪 Testing database tables...');
  
  const tables = ['properties', 'property_images', 'scraped_data', 'locations', 'universities'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ Table '${table}' not accessible:`, error.message);
      } else {
        console.log(`✅ Table '${table}' is ready`);
      }
    } catch (error) {
      console.log(`❌ Table '${table}' test failed:`, error.message);
    }
  }
}

// Run the setup
setupDatabase();
