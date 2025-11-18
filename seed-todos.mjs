import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://fldlluibposcnocfyouf.supabase.co";
const serviceRoleKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsZGxsdWlicG9zY25vY2Z5b3VmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDkzMDA1MCwiZXhwIjoyMDc2NTA2MDUwfQ.RjqtDrZnCf7IHvS56ESnbTblsczB0nCbrZ97d1NzRhk";

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

const USER_ID = "00000000-0000-0000-0000-000000000001";
const today = new Date().toISOString().split("T")[0];

const sampleTasks = [
  {
    user_id: USER_ID,
    category: "life",
    title: "Morning meditation",
    note: "20 minutes mindfulness",
    priority: 3,
    pinned: true,
    due_date: today,
    repeat: "daily",
  },
  {
    user_id: USER_ID,
    category: "work",
    title: "Review pull requests",
    note: "Check team submissions",
    priority: 2,
    pinned: false,
    due_date: today,
    repeat: "weekdays",
  },
  {
    user_id: USER_ID,
    category: "distraction",
    title: "Read tech news",
    note: "Hacker News or Dev.to",
    priority: 1,
    pinned: false,
    due_date: null,
    repeat: "none",
  },
];

console.log("Adding sample tasks to Supabase...");

for (const task of sampleTasks) {
  const { data, error } = await supabase
    .from("tasks")
    .insert(task)
    .select()
    .single();

  if (error) {
    console.error("❌ Error inserting task:", error);
  } else {
    console.log("✅ Added task:", data.title);
  }
}

console.log("✅ Sample data loaded successfully!");
