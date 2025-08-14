import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { sql } = await request.json();

    if (!sql || typeof sql !== 'string') {
      return NextResponse.json({ 
        error: 'SQL query is required' 
      }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Execute the SQL directly
    const { data, error } = await supabase.rpc('execute_sql', { sql });

    if (error) {
      console.error('SQL execution error:', error);
      return NextResponse.json({ 
        error: 'Failed to execute SQL', 
        details: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'SQL executed successfully'
    });

  } catch (error) {
    console.error('SQL execution error:', error);
    return NextResponse.json({
      error: 'Failed to execute SQL',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}