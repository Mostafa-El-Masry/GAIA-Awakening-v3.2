"use client";

import Active from "./Active";
import Entry from "./Entry";
import TodoDaily from "./TodoDaily";

export default function DashboardClient() {
  return (
    <div className="space-y-8">
      <TodoDaily />
      <Active />
      <Entry />
    </div>
  );
}
