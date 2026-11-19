import "./index-client-DH73-vTM.js";
import { t as e } from "./notes-x7bostuM.js";
import { r as t } from "./bindings-DgGe59oq.js";
// src/tools/sessions.svelte.ts
var n = e("aegis-owner", "sidebar"), r = /* @__PURE__ */ new Set();
async function i(e) {
	let i = String(e.request_id || e.issuedAt || "") + ":" + e.command;
	if (r.has(i)) return;
	r.add(i);
	let a = (t, r) => window.dispatchEvent(new CustomEvent("aegisWidgetActionResult", { detail: {
		widget: "notes",
		command: e.command,
		request_id: e.request_id,
		status: t,
		detail: r,
		note_id: n.note?.id
	} }));
	try {
		await n.start();
		let r = e.command;
		if ([
			"open",
			"show_view",
			"refresh_state",
			"clear_review"
		].includes(r)) await n.reload(), r === "show_view" && await n.close();
		else if (["show_add", "set_draft"].includes(r)) {
			if (!await n.create(e.prompt || "")) throw Error("Resolve the open note first.");
		} else if ([
			"show_note",
			"open_note",
			"review_note",
			"edit_reviewed_note"
		].includes(r)) {
			let r = e.note_id;
			if (!r && e.query) {
				let n = await t("note_call", {
					expectedProfile: "aegis-owner",
					call: {
						kind: "list",
						query: {
							search: e.query,
							trashed: !1,
							after: null,
							limit: 2
						}
					}
				});
				n.response.items?.length === 1 && (r = n.response.items[0].id);
			}
			if (!r) throw Error("Choose one matching note.");
			if (!await n.requestOpen(r)) throw Error("Note could not be opened.");
		} else if (r === "save_note") {
			if (e.prompt && !await n.create(e.prompt)) throw Error("Could not create the note.");
			if (!await n.flush()) throw Error("The note was not saved.");
		} else if (r === "clear_draft") n.note && n.edit("");
		else if (r === "append_draft") n.note || await n.create(), n.edit(n.markdown + "\n" + (e.prompt || ""));
		else if (r === "delete_note") {
			if (!e.note_id) throw Error("A note identity is required.");
			await n.moveToTrash(e.note_id);
		} else if (["copy_note", "copy_draft"].includes(r)) await navigator.clipboard.writeText(n.markdown);
		else throw Error("This retired Notes command is unavailable. Use the Work composer with an attached note.");
		a("completed", "Notes updated.");
	} catch (e) {
		a("failed", e instanceof Error ? e.message : String(e));
	}
}
export { i as runNoteCommand };
