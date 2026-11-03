"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { deleteLead, setLeadStatus } from "@/lib/repo/leads";

export async function setLeadStatusAction(id: number, done: boolean): Promise<void> {
  await requireAdmin();
  setLeadStatus(id, done ? "done" : "new");
  revalidatePath("/admin", "layout");
}

export async function deleteLeadAction(id: number): Promise<void> {
  await requireAdmin();
  deleteLead(id);
  revalidatePath("/admin", "layout");
}
