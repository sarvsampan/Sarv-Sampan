import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Database connection test
export const testDatabaseConnection = async () => {
  try {
    console.log(`📍 Supabase URL: ${process.env.SUPABASE_URL}`);

    // Test query to check connection
    const { data, error } = await supabase
      .from('categories')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Database connection failed!');
      console.error('Error:', error.message);
      if (error.message.includes('relation') || error.message.includes('does not exist')) {
        console.error('⚠️  Tables might not exist. Please run the SQL schema first.');
      }
      return false;
    }

    console.log('✅ Database connected successfully!');
    console.log('💚 Supabase is ready to use\n');
    return true;
  } catch (err) {
    console.error('❌ Database connection test failed!');
    console.error('Error:', err.message);
    console.error('⚠️  Make sure your Supabase project is active and credentials are correct\n');
    return false;
  }
};

// Log database queries in development
export const logQuery = (table, operation, details = '') => {
  if (process.env.NODE_ENV === 'development') {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] 🔵 DB Query: ${operation.toUpperCase()} on "${table}" ${details}`);
  }
};
