/**
 * Lays a knowledge map out on the canvas: a layered drawing, left to right, with each group's cards
 * kept together in a box. Groups are placed by how they connect, then the cards inside each group
 * are ordered to reduce crossings. It is pure, so a test can check that nothing overlaps, and the
 * same map always lands the same way.
 */
import type { KnowledgeMap, MapNode } from "./work-run";

export const CARD = { width: 250, height: 118 };
const GAP = { card: 22, column: 56, groupX: 110, groupY: 56, pad: 22, head: 40 };
const UNGROUPED = "\0ungrouped";

export type PlacedNode = MapNode & { x: number; y: number };
export type PlacedGroup = { id: string; title: string; x: number; y: number; width: number; height: number };
export type MapLayout = { nodes: PlacedNode[]; groups: PlacedGroup[]; width: number; height: number };

/** Longest-path ranks over an acyclic version of the graph: an edge back to a visited node is ignored. */
function ranks(ids: readonly string[], edges: readonly { from: string; to: string }[]): Map<string, number> {
  const out = new Map<string, string[]>(ids.map((id) => [id, []]));
  const incoming = new Map<string, number>(ids.map((id) => [id, 0]));
  for (const edge of edges) {
    if (!out.has(edge.from) || !out.has(edge.to) || edge.from === edge.to) continue;
    out.get(edge.from)!.push(edge.to);
    incoming.set(edge.to, incoming.get(edge.to)! + 1);
  }
  const rank = new Map<string, number>();
  const visiting = new Set<string>();
  const visit = (id: string, depth: number) => {
    if (visiting.has(id) || (rank.get(id) ?? -1) >= depth) return;
    visiting.add(id);
    rank.set(id, depth);
    for (const next of out.get(id) ?? []) visit(next, depth + 1);
    visiting.delete(id);
  };
  const roots = ids.filter((id) => !incoming.get(id));
  for (const id of roots.length ? roots : ids.slice(0, 1)) visit(id, 0);
  for (const id of ids) if (!rank.has(id)) visit(id, 0);
  return rank;
}

export function layoutMap(map: KnowledgeMap): MapLayout {
  const known = new Set(map.groups.map((group) => group.id));
  const groupOf = (node: MapNode) => (known.has(node.group) ? node.group : UNGROUPED);
  const members = new Map<string, MapNode[]>();
  for (const node of map.nodes) members.set(groupOf(node), [...(members.get(groupOf(node)) ?? []), node]);
  const titles = new Map(map.groups.map((group) => [group.id, group.title]));
  const groupIds = [...members.keys()];

  // Groups by how they connect.
  const nodeGroup = new Map(map.nodes.map((node) => [node.id, groupOf(node)]));
  const groupEdges = map.edges.flatMap((edge) => {
    const from = nodeGroup.get(edge.from);
    const to = nodeGroup.get(edge.to);
    return from && to && from !== to ? [{ from, to }] : [];
  });
  const groupRank = ranks(groupIds, groupEdges);

  // Cards inside a group: by rank within the group, then averaging neighbour positions, a few sweeps.
  const position = new Map<string, number>();
  const inner = new Map<string, MapNode[][]>();
  for (const [id, nodes] of members) {
    const local = map.edges.filter((edge) => nodeGroup.get(edge.from) === id && nodeGroup.get(edge.to) === id);
    const rank = ranks(nodes.map((node) => node.id), local);
    const columns: MapNode[][] = [];
    for (const node of nodes) (columns[rank.get(node.id) ?? 0] ??= []).push(node);
    const filled = columns.filter(Boolean);
    inner.set(id, filled);
    filled.forEach((column) => column.forEach((node, index) => position.set(node.id, index)));
  }
  const neighbours = new Map<string, string[]>(map.nodes.map((node) => [node.id, []]));
  for (const edge of map.edges) {
    neighbours.get(edge.from)?.push(edge.to);
    neighbours.get(edge.to)?.push(edge.from);
  }
  for (let sweep = 0; sweep < 4; sweep++) {
    for (const columns of inner.values()) {
      for (const column of columns) {
        const weight = new Map(column.map((node) => {
          const near = (neighbours.get(node.id) ?? []).map((id) => position.get(id)).filter((value): value is number => value !== undefined);
          return [node.id, near.length ? near.reduce((sum, value) => sum + value, 0) / near.length : (position.get(node.id) ?? 0)];
        }));
        column.sort((a, b) => weight.get(a.id)! - weight.get(b.id)! || a.id.localeCompare(b.id));
        column.forEach((node, index) => position.set(node.id, index));
      }
    }
  }

  // Sizes, then groups in columns by rank, stacked and centred.
  const box = new Map<string, { width: number; height: number }>();
  for (const [id, columns] of inner) {
    const tallest = Math.max(...columns.map((column) => column.length));
    box.set(id, {
      width: GAP.pad * 2 + columns.length * CARD.width + (columns.length - 1) * GAP.column,
      height: GAP.head + GAP.pad + tallest * CARD.height + (tallest - 1) * GAP.card,
    });
  }
  const byRank = new Map<number, string[]>();
  for (const id of groupIds) {
    const rank = groupRank.get(id) ?? 0;
    byRank.set(rank, [...(byRank.get(rank) ?? []), id]);
  }
  const columnsInOrder = [...byRank.keys()].sort((a, b) => a - b);
  const stacks = columnsInOrder.map((rank) => {
    const ids = byRank.get(rank)!;
    return { ids, width: Math.max(...ids.map((id) => box.get(id)!.width)), height: ids.reduce((sum, id) => sum + box.get(id)!.height, 0) + (ids.length - 1) * GAP.groupY };
  });
  const height = Math.max(0, ...stacks.map((stack) => stack.height));
  const nodes: PlacedNode[] = [];
  const groups: PlacedGroup[] = [];
  let x = 0;
  for (const stack of stacks) {
    let y = (height - stack.height) / 2;
    for (const id of stack.ids) {
      const size = box.get(id)!;
      groups.push({ id, title: titles.get(id) ?? "", x, y, width: size.width, height: size.height });
      inner.get(id)!.forEach((column, index) => {
        const columnHeight = column.length * CARD.height + (column.length - 1) * GAP.card;
        const start = y + GAP.head + (size.height - GAP.head - GAP.pad - columnHeight) / 2;
        column.forEach((node, row) => {
          nodes.push({ ...node, x: x + GAP.pad + index * (CARD.width + GAP.column), y: start + row * (CARD.height + GAP.card) });
        });
      });
      y += size.height + GAP.groupY;
    }
    x += stack.width + GAP.groupX;
  }
  return { nodes, groups, width: Math.max(0, x - GAP.groupX), height };
}
