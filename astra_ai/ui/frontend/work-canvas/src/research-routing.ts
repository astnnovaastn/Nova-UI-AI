import { roundedPath, type Point, type Rect } from "./route";
import { getBezierPath, Position } from "@xyflow/svelte";
import { RESEARCH_GRID_STEP } from "./layout-policy";

export type PortSide = "right" | "left" | "top" | "bottom";
const sides: PortSide[] = ["right", "left", "bottom", "top"];
const outward: Record<PortSide, Point> = {
  right: { x: 1, y: 0 }, left: { x: -1, y: 0 },
  top: { x: 0, y: -1 }, bottom: { x: 0, y: 1 },
};
const clearance = 8;
const nearbySpan = 16 * RESEARCH_GRID_STEP;
const edgePosition: Record<PortSide, Position> = {
  right: Position.Right, left: Position.Left, top: Position.Top, bottom: Position.Bottom,
};
const expand = (r: Rect): Rect => ({ x: r.x - clearance, y: r.y - clearance, width: r.width + 2 * clearance, height: r.height + 2 * clearance });
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const same = (a: Point, b: Point) => a.x === b.x && a.y === b.y;
const mix = (a: Point, b: Point, t = .5): Point => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
function touches(points: readonly Point[], r: Rect) {
  return Math.max(...points.map(p => p.x)) > r.x && Math.min(...points.map(p => p.x)) < r.x + r.width &&
    Math.max(...points.map(p => p.y)) > r.y && Math.min(...points.map(p => p.y)) < r.y + r.height;
}

// Subdivide control hulls conservatively; never accept a curve on sampled points alone.
function curveBlocked(points: Point[], boxes: readonly Rect[], depth = 0): boolean {
  const nearby = boxes.filter(r => touches(points, r));
  if (!nearby.length) return false;
  if (depth === 9) return true;
  const left = [points[0]!], right = [points.at(-1)!];
  let row = points;
  while (row.length > 1) {
    row = row.slice(1).map((p, i) => mix(row[i]!, p));
    left.push(row[0]!);
    right.unshift(row.at(-1)!);
  }
  return curveBlocked(left, nearby, depth + 1) || curveBlocked(right, nearby, depth + 1);
}

/** A shallow bow with tangents along the original segment at both ends. */
function curvedSegment(start: Point, end: Point, boxes: readonly Rect[]) {
  const length = distance(start, end);
  const line = ` L ${end.x},${end.y}`;
  if (length < 36) return line;
  const sign = start.x < end.x || (start.x === end.x && start.y < end.y) ? 1 : -1;
  const bend = Math.min(28, length * .1) * sign / length;
  const dx = (start.y - end.y) * bend, dy = (end.x - start.x) * bend;
  const a = mix(start, end, 1/6), b = mix(start, end, 1/3);
  const center = mix(start, end);
  const c = mix(start, end, 2/3), d = mix(start, end, 5/6);
  for (const amount of [1, -1, .5, -.5]) {
    const lift = (point: Point) => ({ x: point.x + dx * amount, y: point.y + dy * amount });
    const entry = lift(b), mid = lift(center), exit = lift(c);
    if (!curveBlocked([start, a, entry, mid], boxes) && !curveBlocked([mid, exit, d, end], boxes))
      return ` C ${a.x},${a.y} ${entry.x},${entry.y} ${mid.x},${mid.y} C ${exit.x},${exit.y} ${d.x},${d.y} ${end.x},${end.y}`;
  }
  return line;
}

function port(r: Rect, side: PortSide, offset: number): Point {
  const axis = outward[side];
  const shifted = (size: number) => size / 2 + Math.max(-size / 4, Math.min(size / 4, offset));
  return {
    x: r.x + (axis.x ? (axis.x > 0 ? r.width : 0) : shifted(r.width)),
    y: r.y + (axis.y ? (axis.y > 0 ? r.height : 0) : shifted(r.height)),
  };
}
const extend = (p: Point, side: PortSide, length: number): Point =>
  ({ x: p.x + outward[side].x * length, y: p.y + outward[side].y * length });

function xyflowCurve(s: Point, t: Point, from: PortSide, to: PortSide) {
  const [d, x, y] = getBezierPath({
    sourceX: s.x, sourceY: s.y, sourcePosition: edgePosition[from],
    targetX: t.x, targetY: t.y, targetPosition: edgePosition[to],
  });
  return { d: d.replace(/^M/, "M ").replace(" C", " C "), mid: { x, y } };
}

function portCurve(s: Point, t: Point, from: PortSide, to: PortSide, boxes: readonly Rect[], startTail = true, endTail = true) {
  const length = distance(s, t);
  const tail = Math.min(14, length * .14);
  for (const lead of [tail, 0]) {
    const start = extend(s, from, startTail ? lead : 0);
    const end = extend(t, to, endTail ? lead : 0);
    const reach = Math.min(130, distance(start, end) * .48);
    const a = extend(start, from, reach), b = extend(end, to, reach);
    if (segmentBlocked(s, start, boxes) || segmentBlocked(end, t, boxes) || curveBlocked([start, a, b, end], boxes)) continue;
    const mid = mix(mix(start, end), mix(a, b), .75);
    const head = `M ${s.x},${s.y}` + (lead && startTail ? ` L ${start.x},${start.y}` : "");
    const axis = outward[from], arrival = outward[to];
    const aligned = axis.x === -arrival.x && axis.y === -arrival.y &&
      (axis.x ? start.y === end.y && (end.x - start.x) * axis.x > 0
              : start.x === end.x && (end.y - start.y) * axis.y > 0);
    const tailPath = lead && endTail ? ` L ${t.x},${t.y}` : "";
    if (aligned) return { d: head + curvedSegment(start, end, boxes) + tailPath, mid };
    const candidate = xyflowCurve(start, end, from, to);
    // xyflow returns one SVG cubic. Check its control points before using it on the canvas.
    const cubic = candidate.d.match(/ C ([^ ]+) ([^ ]+) ([^ ]+)$/);
    if (cubic) {
      const controls = cubic.slice(1, 3).map(pair => {
        const [x, y] = pair.split(",").map(Number);
        return { x: x!, y: y! };
      });
      if (controls.every(p => Number.isFinite(p.x) && Number.isFinite(p.y)) &&
        !curveBlocked([start, ...controls, end], boxes))
        return { d: head + cubic[0] + tailPath, mid: candidate.mid };
    }
    return { d: head + ` C ${a.x},${a.y} ${b.x},${b.y} ${end.x},${end.y}` + tailPath, mid };
  }
  return null;
}

/** Keep the wire attached while a card moves, before routing around obstacles on drop. */
export function dragStrand(source: Rect, target: Rect, from: PortSide, to: PortSide, lane = 0, targetLane = lane) {
  const s = port(source, from, lane), t = port(target, to, targetLane);
  return { s, t, from, to, ...xyflowCurve(s, t, from, to) };
}

// Intersect a segment with the open interior of a card's clearance rectangle.
function segmentBlocked(a: Point, b: Point, boxes: readonly Rect[]) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const left = Math.min(a.x, b.x), right = Math.max(a.x, b.x);
  const top = Math.min(a.y, b.y), bottom = Math.max(a.y, b.y);
  return boxes.some(r => {
    const east = r.x + r.width, south = r.y + r.height;
    if (right <= r.x || left >= east || bottom <= r.y || top >= south) return false;
    const tx = dx ? [(r.x - a.x) / dx, (east - a.x) / dx] : [-Infinity, Infinity];
    const ty = dy ? [(r.y - a.y) / dy, (south - a.y) / dy] : [-Infinity, Infinity];
    return Math.max(0, Math.min(...tx), Math.min(...ty)) < Math.min(1, Math.max(...tx), Math.max(...ty));
  });
}

type Exit = { side: PortSide; port: Point; tip: Point; cost: number };

/** Corners outside card boundaries guide the route. They never become dependency endpoints. */
function cardCorners(box: Rect): Point[] {
  const left = box.x - 4, right = box.x + box.width + 4;
  const top = box.y - 4, bottom = box.y + box.height + 4;
  return [{ x: left, y: top }, { x: right, y: top }, { x: left, y: bottom }, { x: right, y: bottom }];
}

function guidedRoute(starts: Exit[], ends: Exit[], boxes: readonly Rect[], guides: readonly Rect[]) {
  const guideStart = starts.length;
  const waypoints = guides.flatMap(card => {
    const [topLeft, topRight, bottomLeft, bottomRight] = cardCorners(card);
    return [topLeft!, topRight!, bottomLeft!, bottomRight!,
      mix(topLeft!, topRight!), mix(bottomLeft!, bottomRight!),
      mix(topLeft!, bottomLeft!), mix(topRight!, bottomRight!),
    ];
  });
  const targetStart = guideStart + waypoints.length;
  const points = [...starts.map(exit => exit.tip), ...waypoints, ...ends.map(exit => exit.tip)];
  const costs = points.map((_, i) => starts[i]?.cost ?? Infinity);
  const remaining = points.map((point, i) => i >= targetStart ? 0 :
    Math.min(...ends.map(exit => distance(point, exit.tip) + exit.cost)));
  const prior = points.map(() => -1);
  const visited = new Set<number>();
  for (let step = 0; step < points.length; step++) {
    let best = -1;
    for (let i = 0; i < points.length; i++) {
      if (!Number.isFinite(costs[i]) || visited.has(i)) continue;
      if (best < 0 || costs[i]! + remaining[i]! < costs[best]! + remaining[best]!) best = i;
    }
    if (best < 0) return null;
    if (best >= targetStart) {
      const end = ends[best - targetStart]!;
      const route = [end.port];
      let i = best;
      for (; i >= guideStart; i = prior[i]!) route.push(points[i]!);
      const start = starts[i]!;
      route.push(start.tip, start.port);
      return { start, end, path: route.reverse(), cost: costs[best]! };
    }
    visited.add(best);
    const from = points[best]!;
    for (let i = guideStart; i < points.length; i++) {
      if (visited.has(i)) continue;
      const to = points[i]!;
      const length = distance(from, to);
      const cost = costs[best]! + length + (i >= targetStart ? ends[i - targetStart]!.cost : 10);
      if (cost >= costs[i]! || segmentBlocked(from, to, boxes)) continue;
      costs[i] = cost;
      prior[i] = best;
    }
  }
  return null;
}

export function routeResearchStrand(
  source: Rect, target: Rect, obstacles: readonly Rect[], lane = 0, targetLane = lane,
) {
  const boxes = obstacles.map(expand);
  const center = (box: Rect) => ({ x: box.x + box.width / 2, y: box.y + box.height / 2 });
  const origin = center(source), destination = center(target);
  const dx = destination.x - origin.x, dy = destination.y - origin.y;
  const vertical = Math.abs(dx) < Math.min(source.width,target.width) / 2;
  const preferred: [PortSide, PortSide] = vertical ? (dy >= 0 ? ["bottom","top"] : ["top","bottom"]) :
    (dx >= 0 ? ["right","left"] : ["left","right"]);
  const directObstacles = [...boxes, source, target];
  let direct: { s: Point; t: Point; from: PortSide; to: PortSide; d: string; mid: Point; cost: number } | undefined;
  const pairs = [preferred, ...sides.flatMap(from => sides.map(to => [from, to] as const))
    .filter(([from, to]) => from !== preferred[0] || to !== preferred[1])];
  for (const [from, to] of pairs) {
    const s = port(source, from, lane), t = port(target, to, targetLane);
    if (distance(s, t) < 2) continue;
    const sideCost = 8 * (Number(from !== preferred[0]) + Number(to !== preferred[1]));
    if (direct && distance(s, t) + sideCost >= direct.cost) continue;
    const curve = portCurve(s, t, from, to, directObstacles);
    if (!curve) continue;
    const cost = distance(s, curve.mid) + distance(curve.mid, t) + sideCost;
    if (!direct || cost < direct.cost)
      direct = { s, t, from, to, ...curve, cost };
    if (from === preferred[0] && to === preferred[1] && distance(s, t) <= nearbySpan) return direct;
  }
  const sourceBox = expand(source), targetBox = expand(target);
  const stub = clearance + 2;
  const exits = (rect: Rect, other: Rect, preferredSide: PortSide, offset: number) => sides.flatMap(side => {
    const at = port(rect, side, offset);
    const tip = extend(at, side, stub);
    return segmentBlocked(at, tip, [...boxes, other]) ? [] : [{ side, port: at, tip, cost: stub + (side === preferredSide ? 0 : 8) }];
  });
  const starts = exits(source, targetBox, preferred[0], lane), ends = exits(target, sourceBox, preferred[1], targetLane);
  if (!starts.length || !ends.length) return direct ?? null;
  const lowerBound = Math.min(...starts.flatMap(a => ends.map(b => a.cost + distance(a.tip, b.tip) + b.cost)));
  if (direct && direct.cost <= lowerBound + 12) return direct;
  const blocked = [...boxes, sourceBox, targetBox];
  // Rank a card by the trip through its closest corner, covering the whole span.
  const trip = (p: Point) => distance(origin, p) + distance(p, destination);
  const guides = boxes.map(box => ({ box, cost: Math.min(...cardCorners(box).map(trip)) }))
    .sort((a, b) => a.cost - b.cost || a.box.x - b.box.x || a.box.y - b.box.y)
    .map(row => row.box);
  const nearbyGuides = [...guides.slice(0, 24), sourceBox, targetBox];
  const route = guidedRoute(starts, ends, blocked, nearbyGuides) ??
    (guides.length > 24 ? guidedRoute(starts, ends, blocked, [...guides.slice(0, 64), sourceBox, targetBox]) : null);
  if (!route || (direct && direct.cost <= route.cost)) return direct ?? null;
  const path = route.path.filter((p, i, all) => i === 0 || !same(p, all[i - 1]!));
  return {
    s: route.start.port, t: route.end.port, from: route.start.side, to: route.end.side,
    ...roundedPath(path, 22, (a, b, c) => !curveBlocked([a, b, c], blocked), undefined, true),
  };
}

/** One short shared lead, with an independently inspectable curve per destination. */
export function routeResearchFan(
  hub: Rect,
  members: readonly { id: string; rect: Rect }[],
  obstacles: readonly Rect[],
  direction: "in" | "out",
) {
  if (members.length < 2) return null;
  const sign = direction === "out" ? 1 : -1;
  const root = port(hub, sign === 1 ? "right" : "left", 0);
  const leaves = members.map(({id, rect}) => ({ id, rect, point: port(rect, sign === 1 ? "left" : "right", 0) }));
  const gap = Math.min(...leaves.map(({point}) => sign * (point.x - root.x)));
  if (gap < 36) return null;
  for (const lead of [16, 8]) {
    const join = { x: root.x + sign * lead, y: root.y };
    const blocked = [...obstacles,...leaves.map(leaf=>leaf.rect)].map(expand);
    if (segmentBlocked(root, join, blocked)) continue;
    const branches = new Map<string,{d:string;mid:Point;s:Point;t:Point;from:PortSide;to:PortSide}>();
    const joinedRows: number[] = [];
    for (const {id,rect,point} of leaves) {
      if (joinedRows.some(y => Math.abs(y - point.y) < 16)) continue;
      const boxes = [...obstacles,...leaves.filter(leaf=>leaf.id!==id).map(leaf=>leaf.rect)].map(expand);
      const blockers = [...boxes, hub, rect];
      const curve = direction === "out"
        ? portCurve(join, point, "right", "left", blockers, false, true)
        : portCurve(point, join, "right", "left", blockers, true, false);
      if (!curve) continue;
      joinedRows.push(point.y);
      branches.set(id,{
        ...curve,s:direction==="out"?root:point,t:direction==="out"?point:root,
        from:"right",to:"left",
      });
    }
    if (branches.size < 2) continue;
    return { branches, trunk:`M ${root.x},${root.y} H ${join.x}` };
  }
  return null;
}

// Shared by all strands in a canvas. A new geometry map starts a fresh routing pass.
export const researchRoutingScene = Symbol("research-routing-scene");
export type RoutingNode = {id:string;parentId?:string;position:Point;measured?:{width?:number;height?:number};width?:number;height?:number;hidden?:boolean;type?:string;data?:unknown;dragging?:boolean;selected?:boolean};
export function indexRoutingNodes(nodes: readonly RoutingNode[], previous?: RoutingScene): RoutingScene {
  const byId=new Map(nodes.map(node=>[node.id,node]));
  const bounds=new Map<string,Rect>();
  const cards=new Map<string,Rect>();
  const moving=new Set<string>();
  const point=(node:RoutingNode):Point=>{
    const parent=node.parentId ? byId.get(node.parentId) : undefined;
    if(!parent)return node.position;
    const base=point(parent);
    return {x:base.x+node.position.x,y:base.y+node.position.y};
  };
  for(const node of nodes){
    if(node.dragging || (node.parentId && moving.has(node.parentId)))moving.add(node.id);
    const width=node.measured?.width??node.width, height=node.measured?.height??node.height;
    if(!width||!height)continue;
    const rect={...point(node),width,height};
    bounds.set(node.id,rect);
    const kind=(node.data as {type?:string}|undefined)?.type;
    if(!node.hidden&&node.type!=="agent"&&kind!=="agent"&&kind!=="mapgroup"&&node.type!=="area")cards.set(node.id,rect);
  }
  // A child moves with its parent even when the library lists the child first.
  for(const node of nodes)for(let parent=node.parentId;parent;parent=byId.get(parent)?.parentId){
    if(moving.has(parent)){moving.add(node.id);break;}
  }
  const matches = (a:Map<string,Rect>,b:Map<string,Rect>) => a.size===b.size && [...a].every(([id,box])=>{
    const other=b.get(id);
    return other&&box.x===other.x&&box.y===other.y&&box.width===other.width&&box.height===other.height;
  });
  const sameParents=previous && byId.size===previous.byId.size &&
    [...byId].every(([id,node])=>previous.byId.has(id)&&node.parentId===previous.byId.get(id)?.parentId);
  const stable=previous && sameParents && matches(bounds,previous.bounds)&&matches(cards,previous.cards);
  return {byId,bounds:stable?previous.bounds:bounds,cards:stable?previous.cards:cards,moving};
}
export type RoutingScene = {byId:Map<string,RoutingNode>;bounds:Map<string,Rect>;cards:Map<string,Rect>;moving:Set<string>};
type FanRoute = ReturnType<typeof routeResearchFan>;
const fanCache = new WeakMap<Map<string,Rect>,Map<string,FanRoute>>();
export function cachedResearchFan(scene:RoutingScene,key:string,compute:()=>FanRoute):FanRoute {
  const cache=fanCache.get(scene.cards)??new Map<string,FanRoute>();
  if(!fanCache.has(scene.cards))fanCache.set(scene.cards,cache);
  if(!cache.has(key))cache.set(key,compute());
  return cache.get(key)??null;
}

type StrandRoute = ReturnType<typeof routeResearchStrand>;
const strandCache = new WeakMap<Map<string,Rect>,Map<string,StrandRoute>>();
export function cachedResearchStrand(scene:RoutingScene,key:string,compute:()=>StrandRoute):StrandRoute {
  const cache=strandCache.get(scene.bounds)??new Map<string,StrandRoute>();
  if(!strandCache.has(scene.bounds))strandCache.set(scene.bounds,cache);
  if(!cache.has(key))cache.set(key,compute());
  return cache.get(key)??null;
}
