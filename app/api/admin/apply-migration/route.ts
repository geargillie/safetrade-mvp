// app/api/admin/apply-migration/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function POST() {
  try {
    // Read the migration file
    const migrationPath = join(process.cwd(), 'supabase', 'migrations', 'add_enhanced_messaging.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`Applying ${statements.length} migration statements...`);

    const results = [];
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement || statement.length < 5) continue;

      try {
        console.log(`Executing statement ${i + 1}:`, statement.substring(0, 100) + '...');
        
        const { error } = await supabase.rpc('execute_sql', {
          sql_statement: statement + ';'
        });

        if (error) {
          console.error(`Error in statement ${i + 1}:`, error);
          results.push({
            statement: i + 1,
            success: false,
            error: error.message,
            preview: statement.substring(0, 100)
          });
        } else {
          results.push({
            statement: i + 1,
            success: true,
            preview: statement.substring(0, 100)
          });
        }
      } catch (err) {
        console.error(`Exception in statement ${i + 1}:`, err);
        results.push({
          statement: i + 1,
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
          preview: statement.substring(0, 100)
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: failureCount === 0,
      message: `Migration applied: ${successCount} successful, ${failureCount} failed`,
      results
    });

  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}