import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lwjonhfpgitayllsmxef.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3am9uaGZwZ2l0YXlsbHNteGVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NDUyNjUsImV4cCI6MjA3NjAyMTI2NX0.M8-yNfi0pYEIeLhZWqSX3lf9REw_JZIII5AbDeLgmHo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
