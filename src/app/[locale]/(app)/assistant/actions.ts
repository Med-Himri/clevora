"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fail, ok, zodFieldErrors, type ActionResult } from "@/lib/action-result";
import { chunkText } from "@/lib/ai/prompt";
import { dbErrorKey, requireActionContext } from "@/lib/auth/action";
import { documentSchema } from "./schema";

/** Add a document for the assistant (admins). Stored as searchable chunks. */
export async function addDocumentAction(input: { title: string; content: string }): Promise<ActionResult<{ id: string }>> {
  const parsed = documentSchema.safeParse(input);
  if (!parsed.success) return fail("invalidForm", zodFieldErrors(parsed.error.issues));
  const guard = await requireActionContext({ roles: ["admin"] });
  if (!guard.ok) return guard;
  const { supabase, agency } = guard.ctx;
  const { data: doc, error } = await supabase
    .from("ai_documents")
    .insert({ agency_id: agency.id, title: parsed.data.title, source: "upload" })
    .select("id")
    .single();
  if (error || !doc) return fail(dbErrorKey(error));
  const chunks = chunkText(parsed.data.content).map((content, i) => ({ agency_id: agency.id, document_id: doc.id, content, metadata: { index: i } }));
  const { error: chunkError } = await supabase.from("ai_chunks").insert(chunks);
  if (chunkError) {
    await supabase.from("ai_documents").delete().eq("id", doc.id).eq("agency_id", agency.id);
    return fail(dbErrorKey(chunkError));
  }
  revalidatePath("/[locale]/assistant", "page");
  return ok({ id: doc.id });
}

/** Remove a document and its chunks (admins). */
export async function deleteDocumentAction(id: string): Promise<ActionResult> {
  if (!z.uuid().safeParse(id).success) return fail("forbidden");
  const guard = await requireActionContext({ roles: ["admin"] });
  if (!guard.ok) return guard;
  const { supabase, agency } = guard.ctx;
  const { error, count } = await supabase.from("ai_documents").delete({ count: "exact" }).eq("id", id).eq("agency_id", agency.id);
  if (error) return fail(dbErrorKey(error));
  if (!count) return fail("forbidden");
  revalidatePath("/[locale]/assistant", "page");
  return ok();
}
