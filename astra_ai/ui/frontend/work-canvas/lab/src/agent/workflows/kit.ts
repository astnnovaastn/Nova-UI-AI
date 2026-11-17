/*
 * Small builders the workflow fixtures share. All data they make is invented sample data.
 */
import type { HelperCall, LeadCall, PartScript } from "../types";

export const say = (text: string, ...calls: LeadCall[]) => ({ say: text, calls });
export const skill = (name: string): LeadCall => ({ tool: "load_skill", name });
export const search = (query: string): LeadCall => ({ tool: "web_search", query });
export const fetch = (url: string): LeadCall => ({ tool: "web_fetch", url });
export const part = (script: PartScript): LeadCall => ({ tool: "start_part", part: script });
export const create = (kind: string, title: string, data: Record<string, unknown>, sources: string[] = [], id?: string): LeadCall => ({
  tool: "create",
  kind,
  title,
  data,
  sources,
  ...(id ? { id } : {}),
});
export const finish = (reply: Record<string, unknown>, says: string, sources: string[] = [], followups: string[] = [], declined?: Record<string, unknown>): LeadCall => ({
  tool: "finish",
  reply,
  sources,
  say: says,
  followups,
  ...(declined ? { declined } : {}),
});

/** The script's branch for an approved step: after a decline the model would not make this object. */
export const ifApproved = (call: LeadCall): LeadCall => ({ ...call, unlessDeclined: true }) as LeadCall;

export const hs =(query: string): HelperCall => ({ tool: "web_search", query });
export const hr = (url: string): HelperCall => ({ tool: "read", url });
export const turn = (text: string, ...calls: HelperCall[]) => ({ say: text, calls });

export const fact = (label: string, value: string, kind: "text" | "yes" | "no" | "partial" | "rating" = "text") => ({ label, value, kind });
