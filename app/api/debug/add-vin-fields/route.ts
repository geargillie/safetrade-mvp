import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const addFieldsSql = `
-- Add theft and total loss fields to listings table
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS theft_record_checked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS theft_record_found BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS theft_record_details JSONB,
ADD COLUMN IF NOT EXISTS total_loss_checked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS total_loss_found BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS total_loss_details JSONB,
ADD COLUMN IF NOT EXISTS vin_verification_date TIMESTAMP WITH TIME ZONE;

-- Update existing listings to have these fields checked as true if VIN is verified
UPDATE listings 
SET 
    theft_record_checked = true,
    theft_record_found = false,
    total_loss_checked = true, 
    total_loss_found = false,
    vin_verification_date = created_at
WHERE vin_verified = true;
  `;

  return NextResponse.json({
    success: true,
    message: "SQL to add VIN verification fields to listings table",
    sql: addFieldsSql,
    instructions: [
      "1. Go to your Supabase Dashboard",
      "2. Navigate to SQL Editor", 
      "3. Copy and paste the SQL above",
      "4. Run the SQL commands",
      "5. This adds theft_record and total_loss fields to listings"
    ]
  });
}