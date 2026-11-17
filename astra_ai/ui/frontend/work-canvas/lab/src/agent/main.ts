/**
 * AEGIS Agent Execution Lab — entry. Same seal as the Work Layout Lab (../seal.ts):
 * nothing leaves this machine, and no model or provider is reachable from the page.
 */
import "../lab.css";
import { mount } from "svelte";
import AgentLab from "./AgentLab.svelte";
import { seal } from "../seal";

seal("Agent Execution Lab");
mount(AgentLab, { target: document.getElementById("root")! });
