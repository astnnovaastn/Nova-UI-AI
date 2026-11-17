/**
 * AEGIS Work Layout Lab — entry.
 * Local only, and sealed: no API client, no backend, no AI provider. Every request that
 * is not to this page's own origin is refused (seal.ts), and again by the page's CSP.
 */
import "./lab.css";
import { mount } from "svelte";
import Lab from "./Lab.svelte";
import { seal } from "./seal";

seal("Work Layout Lab");
mount(Lab, { target: document.getElementById("root")! });
