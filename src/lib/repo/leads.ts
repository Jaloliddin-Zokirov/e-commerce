import "server-only";
import { getDb } from "../db";
import { leadsChanged } from "../lead-events";
import type { InboxState, Lead, LeadKind, LeadStatus, Locale } from "../types";

type LeadRow = {
  id: number;
  kind: LeadKind;
  name: string;
  phone: string;
  message: string;
  product_id: number | null;
  product_name: string;
  variant: string;
  page_url: string;
  locale: Locale;
  status: LeadStatus;
  created_at: string;
};

function mapLead(row: LeadRow): Lead {
  return {
    id: row.id,
    kind: row.kind === "order" ? "order" : "callback",
    name: row.name,
    phone: row.phone,
    message: row.message,
    productId: row.product_id,
    productName: row.product_name,
    variant: row.variant,
    pageUrl: row.page_url,
    locale: row.locale,
    status: row.status,
    createdAt: row.created_at,
  };
}

export function createLead(input: Omit<Lead, "id" | "status" | "createdAt">): number {
  const res = getDb()
    .prepare(
      `INSERT INTO leads (kind, name, phone, message, product_id, product_name, variant, page_url, locale)
       VALUES (@kind, @name, @phone, @message, @productId, @productName, @variant, @pageUrl, @locale)`,
    )
    .run(input);
  leadsChanged();
  return Number(res.lastInsertRowid);
}

export function listLeads(opts: { status?: LeadStatus; limit?: number; offset?: number } = {}) {
  const db = getDb();
  const where = opts.status ? "WHERE status = @status" : "";
  const params = { status: opts.status };
  const total = (db.prepare(`SELECT COUNT(*) AS n FROM leads ${where}`).get(params) as { n: number }).n;
  const rows = db
    .prepare(`SELECT * FROM leads ${where} ORDER BY created_at DESC, id DESC LIMIT @limit OFFSET @offset`)
    .all({ ...params, limit: opts.limit ?? 50, offset: opts.offset ?? 0 }) as LeadRow[];
  return { items: rows.map(mapLead), total };
}

export function countNewLeads(): number {
  return (getDb().prepare("SELECT COUNT(*) AS n FROM leads WHERE status = 'new'").get() as { n: number }).n;
}

export function setLeadStatus(id: number, status: LeadStatus): void {
  getDb().prepare("UPDATE leads SET status = ? WHERE id = ?").run(status, id);
  leadsChanged();
}

export function deleteLead(id: number): void {
  getDb().prepare("DELETE FROM leads WHERE id = ?").run(id);
  leadsChanged();
}

export function inboxState(): InboxState {
  const db = getDb();
  const counts = db.prepare("SELECT COUNT(*) AS total, COALESCE(SUM(status = 'new'), 0) AS fresh FROM leads").get() as {
    total: number;
    fresh: number;
  };
  const latest = db.prepare("SELECT id, kind, name, phone, product_name FROM leads ORDER BY id DESC LIMIT 1").get() as
    | { id: number; kind: LeadKind; name: string; phone: string; product_name: string }
    | undefined;
  return {
    newCount: counts.fresh,
    total: counts.total,
    lastId: latest?.id ?? 0,
    latest: latest
      ? {
          id: latest.id,
          kind: latest.kind === "order" ? "order" : "callback",
          name: latest.name,
          phone: latest.phone,
          productName: latest.product_name,
        }
      : null,
  };
}

/** True when the very same request (phone, form, product, comment) came in during the last few minutes. */
export function hasRecentDuplicate(lead: { kind: LeadKind; phone: string; productName: string; variant: string; message: string }): boolean {
  return Boolean(
    getDb()
      .prepare(
        `SELECT 1 FROM leads
         WHERE phone = @phone AND kind = @kind AND product_name = @productName AND variant = @variant AND message = @message
           AND created_at > datetime('now', '-3 minutes')
         LIMIT 1`,
      )
      .get(lead),
  );
}

/** Simple flood guard: how many leads this phone sent in the last hour. */
export function recentLeadsFromPhone(phone: string): number {
  return (
    getDb()
      .prepare("SELECT COUNT(*) AS n FROM leads WHERE phone = ? AND created_at > datetime('now', '-1 hour')")
      .get(phone) as { n: number }
  ).n;
}
