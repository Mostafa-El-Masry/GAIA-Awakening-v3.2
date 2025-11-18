"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AUTH_COOKIE_NAME, buildAuthCookie } from "@/lib/auth";

export async function endSession() {
  const cookieStore = await cookies();
  try {
    cookieStore.delete(AUTH_COOKIE_NAME);
  } catch {
    cookieStore.set({
      ...buildAuthCookie(""),
      value: "",
      maxAge: 0,
    });
  }

  redirect("/auth/login");
}
