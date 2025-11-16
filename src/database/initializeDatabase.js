/**
 * Database Initialization Script
 * Run this to create all necessary tables in your Supabase database
 */

import { supabase } from '../lib/supabase.js';
import fs from 'fs';
import path from 'path';

async function initializeDatabase() {
  try {
    console.log('🚀 Starting database initialization...');
    
    // Read the SQL schema file
    const schemaPath = path.join(process.cwd(), 'src', 'database', 'memberDataSchema.sql');
    const sqlSchema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split the SQL into individual statements (rough split)
    const statements = sqlSchema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    let successCount = 0;
    let errorCount = 0;
    
    for (const [index, statement] of statements.entries()) {
      try {
        console.log(`\n⚙️ Executing statement ${index + 1}/${statements.length}...`);
        
        // Use the rpc function to execute raw SQL
        const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
        
        if (error) {
          console.error(`❌ Error in statement ${index + 1}:`, error.message);
          errorCount++;
        } else {
          console.log(`✅ Statement ${index + 1} executed successfully`);
          successCount++;
        }
      } catch (err) {
        console.error(`❌ Unexpected error in statement ${index + 1}:`, err.message);
        errorCount++;
      }
    }
    
    console.log(`\n🎉 Database initialization completed!`);
    console.log(`✅ Successful statements: ${successCount}`);
    console.log(`❌ Failed statements: ${errorCount}`);
    
    if (errorCount === 0) {
      console.log('🎯 All tables and policies created successfully!');
      
      // Test basic connectivity
      console.log('\n🔍 Testing database connectivity...');
      const { data: members, error: testError } = await supabase
        .from('members')
        .select('*')
        .limit(1);
      
      if (testError) {
        console.error('❌ Database test failed:', testError.message);
      } else {
        console.log('✅ Database connectivity test passed!');
        console.log(`📊 Current members count: ${members?.length || 0}`);
      }
    }
    
  } catch (error) {
    console.error('💥 Fatal error during database initialization:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

export { initializeDatabase };