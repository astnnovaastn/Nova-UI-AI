import { greet } from "./greet";
import padStart from "leftpad";

export function banner(name: string): string {
  return padStart(greet(name), 20);
}
