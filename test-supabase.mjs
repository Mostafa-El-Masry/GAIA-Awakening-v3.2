import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://fldlluibposcnocfyouf.supabase.co";
const serviceRoleKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsZGxsdWlicG9zY25vY2Z5b3VmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDkzMDA1MCwiZXhwIjoyMDc2NTA2MDUwfQ.RjqtDrZnCf7IHvS56ESnbTblsczB0nCbrZ97d1NzRhk";

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

console.log("Testing Supabase connection...");

try {
  // Test 1: Check if tasks table exists
  const { data: tasks, error: tasksError } = await supabase
    .from("tasks")
    .select("*")
    .limit(5);

  if (tasksError) {
    console.error("❌ Error querying tasks table:", tasksError);
  } else {
    console.log("✅ Tasks table accessible. Found", tasks.length, "tasks");
    if (tasks.length > 0) {
      console.log("Sample task:", tasks[0]);
    }
  }

  // Test 2: Check if task_day_status table exists
  const { data: statuses, error: statusError } = await supabase
    .from("task_day_status")
    .select("*")
    .limit(5);

  if (statusError) {
    console.error("❌ Error querying task_day_status table:", statusError);
  } else {
    console.log(
      "✅ task_day_status table accessible. Found",
      statuses.length,
      "statuses"
    );
  }

  // Test 3: List all tables
  const { data: tables, error: tablesError } = await supabase
    .from("information_schema.tables")
    .select("table_name")
    .eq("table_schema", "public");

  if (tablesError) {
    console.error("❌ Error listing tables:", tablesError);
  } else {
    console.log(
      "✅ Available tables:",
      tables.map((t) => t.table_name)
    );
  }
} catch (err) {
  console.error("❌ Connection error:", err.message);
}
