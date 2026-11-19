#!/usr/bin/env node
/**
 * Makes an existing Parcolia account a Parcolia admin (owner console /platform).
 * Run once for yourself, after signing up normally with your email and password:
 *
 *   npm run platform:admin -- you@example.com
 *
 * Uses NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from .env.local
 * (or .env.production.local for the online project). Later admins can be added
 * from /platform/users.
 */
import { existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const envFile = process.argv.includes("--prod") ? ".env.production.local" : ".env.local";
if (existsSync(envFile)) process.loadEnvFile(envFile);
const email = process.argv.slice(2).find((a) => a.includes("@"))?.trim().toLowerCase();
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const stop = (m) => {
  console.error(`\n✖ ${m}\n`);
  process.exit(1);
};
if (!email) stop("Usage: npm run platform:admin -- you@example.com   (add --prod for .env.production.local)");
if (!url || !key) stop(`Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in ${envFile}.`);

const sb = createClient(url, key, { auth: { persistSession: false } });
const { data: profile, error } = await sb.from("profiles").select("id, full_name").ilike("email", email).maybeSingle();
if (error) stop(error.message);
if (!profile) stop(`No account with ${email}. Sign up first on the site (email + password), then run this again.`);
const { error: insertError } = await sb.from("platform_admins").upsert({ user_id: profile.id }, { onConflict: "user_id" });
if (insertError) stop(insertError.message);
console.log(`\n✔ ${email} is now a Parcolia admin (${new URL(url).host}). Log in and open /platform.\n`);
