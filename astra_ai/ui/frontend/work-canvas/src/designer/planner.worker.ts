import { planLayout } from './planner';
self.onmessage = ({ data }) => { try {
    self.postMessage({ id: data.id, plan: planLayout(data.input) });
}
catch (e) {
    self.postMessage({ id: data.id, error: e instanceof Error ? e.message : String(e) });
} };
