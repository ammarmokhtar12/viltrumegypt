/* eslint-disable @typescript-eslint/no-unused-vars, @next/next/no-img-element, react-hooks/exhaustive-deps, @typescript-eslint/no-require-imports */
const { createClient } = require('@supabase/supabase-js');

// Use the ANON key (same as the dashboard uses)
const supabaseUrl = 'https://tvtlblvfzpyqharmoere.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2dGxibHZmenB5cWhhcm1vZXJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3MzMwOTYsImV4cCI6MjA5MTMwOTA5Nn0.BMzWY7y2PSOSHHnYRfXHYWNvTz2bvbenluK1ZrwGyhg';

const supabase = createClient(supabaseUrl, anonKey);

async function testRLS() {
  console.log('Testing expenses INSERT...');
  const { data: expData, error: expError } = await supabase
    .from('expenses')
    .insert({ category: 'other', amount: 1, description: 'RLS Test', date: '2026-01-01' })
    .select()
    .single();

  if (expError) {
    console.error('❌ Expenses INSERT FAILED:', expError.message);
  } else {
    console.log('✅ Expenses INSERT works! ID:', expData.id);
    // Cleanup test row
    await supabase.from('expenses').delete().eq('id', expData.id);
    console.log('✅ Cleanup done.');
  }

  console.log('\nTesting inventory UPDATE...');
  const { data: invData, error: invError } = await supabase
    .from('inventory')
    .select('product_id, size, quantity')
    .limit(1)
    .single();

  if (invError) {
    console.error('❌ Inventory SELECT FAILED:', invError.message);
  } else {
    const { error: updateError } = await supabase
      .from('inventory')
      .update({ quantity: invData.quantity })
      .eq('product_id', invData.product_id)
      .eq('size', invData.size);

    if (updateError) {
      console.error('❌ Inventory UPDATE FAILED:', updateError.message);
    } else {
      console.log('✅ Inventory UPDATE works!');
    }
  }
}

testRLS();
