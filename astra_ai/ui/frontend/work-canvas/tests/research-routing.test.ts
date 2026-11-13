import { describe, expect, it } from "vitest";
import { cachedResearchFan, cachedResearchStrand, dragStrand, indexRoutingNodes, routeResearchFan, routeResearchStrand } from "../src/research-routing";
import { organizeResearchStrands, strandLinks, summaryStrandIds, type Relation } from "../src/relations";

const box = (x: number, y: number, width = 120, height = 80) => ({ x, y, width, height });

describe("research routing", () => {
  it("connects each sequential step at its own border", () => {
    const cards = [box(0,0), box(200,0), box(400,0), box(600,0)];
    for (let i=0;i<3;i++) {
      const a=cards[i]!, b=cards[i+1]!;
      expect(routeResearchStrand(a,b,cards.filter(r=>r!==a&&r!==b))).toMatchObject({
        s:{x:a.x+a.width,y:40}, t:{x:b.x,y:40}, from:"right",to:"left",
      });
    }
  });
  it("fans out from one port and keeps parallel connections distinct", () => {
    const a=box(0,100), b=box(250,0), c=box(250,200);
    const first=routeResearchStrand(a,b,[c])!, second=routeResearchStrand(a,c,[b])!;
    expect(first.s).toEqual(second.s);
    expect(first.d).not.toEqual(second.d);
    expect(routeResearchStrand(a,b,[c],-7)?.d).not.toEqual(routeResearchStrand(a,b,[c],7)?.d);
    expect(routeResearchStrand(c,b,[a])).toMatchObject({from:"top",to:"bottom"});
  });
  it("changes the path when a card moves or blocks the direct corridor", () => {
    const a=box(0,0), b=box(500,0), wall=box(220,-40,100,160);
    const direct=routeResearchStrand(a,b,[])!;
    const detour=routeResearchStrand(a,b,[wall])!;
    expect(detour).not.toBeNull();
    expect(detour.d).not.toBe(direct.d);
    expect(routeResearchStrand(a,box(500,150),[wall])?.t).not.toEqual(detour.t);
  });
  it("returns no unsafe path when every exit is blocked", () => {
    expect(routeResearchStrand(box(0,0),box(500,0),[box(-10,-10,140,100)])).toBeNull();
  });
  it("threads through staggered card gaps in both directions", () => {
    const left = box(0, 0), right = box(900, 0);
    const cards = [box(260, -210, 120, 270), box(550, 10, 120, 270)];
    for (const [start, end] of [[left, right], [right, left]] as const) {
      const route = routeResearchStrand(start, end, cards);
      expect(route?.d).toContain("C");
      const points = [...route!.d.matchAll(/(-?[\d.]+),(-?[\d.]+)/g)].map(match => [Number(match[1]), Number(match[2])] as const);
      expect(points.some(([x, y]) => x > 360 && x < 410 && y >= 68)).toBe(true);
      expect(points.some(([x, y]) => x > 520 && x < 575 && y <= 2)).toBe(true);
      expect(points.every(([, y]) => y > -100 && y < 150)).toBe(true);
    }
  });
  it("keeps a clear long connection direct even when nearby guides move", () => {
    const source = box(0, 0), target = box(1200, 0);
    const guides = [box(380, 90), box(750, 90)];
    const path = routeResearchStrand(source, target, guides)!.d;
    expect(path.match(/ C /g)?.length).toBeGreaterThan(1);
    expect(routeResearchStrand(source, target, guides.map(card => ({ ...card, y: 700 })))!.d).toBe(path);
  });
  it("keeps the wire attached to the latest card position while dragging", () => {
    const route = dragStrand(box(450, 70, 100, 60), box(20, 240, 120, 80), "bottom", "right");
    expect(route).toMatchObject({ s: { x: 500, y: 130 }, t: { x: 140, y: 280 } });
    expect(route.d).toMatch(/^M 500,130 C .* 140,280$/);
  });
  it("keeps a real direct dependency and hides only an explicitly marked summary over a visible chain", () => {
    const relation=(id:string,source:string,target:string,detail:Relation["detail"]={}):Relation=>({
      id,source,target,detail,type:"delivers",status:"complete",label:"",event_seq:0,at:0,evidence_id:"",url:"",note:"",
    });
    const rows=[relation("ab","a","b"),relation("bc","b","c"),relation("cd","c","d"),
      relation("direct","a","d"),relation("summary","a","d",{summary_only:true})];
    const {links}=strandLinks(rows,id=>id);
    expect([...summaryStrandIds(links)]).toEqual(["strand:summary"]);
    expect(summaryStrandIds(links.filter(link=>link.source!=="b")).size).toBe(0);
  });
});

describe("organized workflow", () => {
  it.each([2, 4, 6])("fans out and converges across %i independent connections", count => {
    const leaves = Array.from({ length: count }, (_, i) => ({ id: String(i), rect: box(300, i * 110) }));
    const middle = (count - 1) * 55;
    for (const direction of ["out", "in"] as const) {
      const hub = box(direction === "out" ? 0 : 600, middle);
      const fan = routeResearchFan(hub, leaves, [], direction)!;
      expect([...fan.branches.keys()]).toEqual(leaves.map(leaf => leaf.id));
      const branchPorts = [...fan.branches.values()].map(branch => direction === "out" ? branch.s : branch.t);
      expect(branchPorts.every(port => port.x === (direction === "out" ? 120 : 600) && port.y === middle + 40)).toBe(true);
      expect(new Set([...fan.branches.values()].map(branch => branch.d)).size).toBe(count);
    }
  });
  it("routes an expanded stack around its new bounds on a 52-card canvas", () => {
    const source = box(0, 0), target = box(500, 0);
    const otherCards = Array.from({ length: 49 }, (_, i) => box(i % 7 * 180, 500 + Math.floor(i / 7) * 120));
    const compact = routeResearchStrand(source, target, [...otherCards, box(230, 100)])!;
    const expanded = routeResearchStrand(source, target, [...otherCards, box(230, -30, 120, 210)])!;
    expect(compact.d).not.toBe(expanded.d);
    expect(expanded.d).toContain("C");
    expect(expanded.mid.y).toBeLessThan(100);
  });
  it("shares one spine for a fan and gives each card its own branch", () => {
    const hub = box(0, 100);
    const leaves = [{ id: "upper", rect: box(280, 0) }, { id: "lower", rect: box(300, 230) }];
    const fan = routeResearchFan(hub, leaves, [], "out")!;
    expect(fan.trunk).toBe("M 120,140 H 136");
    expect(fan.branches.get("upper")?.d).toMatch(/^M 136,140 C .* L 280,40$/);
    expect(fan.branches.get("lower")?.d).toMatch(/^M 136,140 C .* L 300,270$/);
    expect(fan.branches.get("upper")?.t).toEqual({ x: 280, y: 40 });
    expect(fan.branches.get("lower")?.t).toEqual({ x: 300, y: 270 });
    expect(routeResearchFan(hub, leaves, [box(155, -30, 90, 380)], "out")).toBeNull();
    expect(routeResearchFan(box(500,100), leaves, [], "in")?.branches.get("lower")?.t).toEqual({x:500,y:140});
  });
  it("shows one strand per card pair, retaining every citation for inspection", () => {
    const make = (id: string, type: Relation["type"], source: string, target: string): Relation => ({
      id,type,source,target,label:"",status:"complete",event_seq:0,at:0,evidence_id:"",url:"",note:"",detail:{},
    });
    const rows = [make("a","evidence","source","analysis"),make("b","evidence","source","analysis"),
      make("c","verifies","analysis","verification"),make("d","delivers","verification","lead"),
      make("shortcut","delivers","analysis","lead"),make("citation","cites","source","report")];
    const overview = organizeResearchStrands(strandLinks(rows, id=>id).links);
    expect(overview.find(link=>link.target==="analysis")?.strand.relations.map(row=>row.id)).toEqual(["a","b"]);
    expect(overview.find(link=>link.id==="strand:shortcut")?.strand.detailOnly).toBe(true);
    expect(overview.find(link=>link.id==="strand:citation")?.strand.detailOnly).toBeUndefined();
  });
});
it("reuses route work for selection changes and invalidates it when card geometry changes",()=>{
  const card={id:"card",position:{x:20,y:40},width:120,height:80};
  const first=indexRoutingNodes([card]);
  const selected=indexRoutingNodes([{...card,selected:true}],first);
  expect(selected.bounds).toBe(first.bounds);
  expect(selected.byId.get("card")?.selected).toBe(true);
  let calls=0;
  const compute=()=>{calls++;return null;};
  for (const scene of [first,selected]) {
    cachedResearchFan(scene,"fan",compute);
    cachedResearchStrand(scene,"wire",compute);
  }
  expect(calls).toBe(2);
  const moved=indexRoutingNodes([{...card,position:{x:40,y:40},dragging:true}],selected);
  expect(moved.moving.has("card")).toBe(true);
  cachedResearchFan(moved,"fan",compute);
  cachedResearchStrand(moved,"wire",compute);
  expect(calls).toBe(4);
});
