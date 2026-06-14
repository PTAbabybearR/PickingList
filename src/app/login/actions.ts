"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { signSession, COOKIE } from "@/lib/auth";

export async function login(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const from = String(formData.get("from") ?? "/admin");

  if (password !== (process.env.ADMIN_PASSWORD ?? "")) {
    redirect(`/login?error=1&from=${encodeURIComponent(from)}`);
  }

  const token = await signSession(process.env.AUTH_SECRET ?? "");
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect(from.startsWith("/admin") ? from : "/admin");
}

export async function logout() {
  (await cookies()).delete(COOKIE);
  redirect("/login");
}
