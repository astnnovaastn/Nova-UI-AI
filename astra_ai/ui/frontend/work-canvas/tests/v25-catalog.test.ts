import {describe,it,expect,beforeAll,afterAll,vi} from 'vitest';
import {CATALOG,catalogFixture} from '../src/fixtures/catalog';
import {presentationObjects} from '../src/fixtures/presentations';
import {parseObject} from '../src/objects/registry';
import {zephiumObject} from '../src/objects/zephium-object';
describe('V25 reference presentations',()=>{
 beforeAll(()=>vi.stubGlobal('location',{origin:'http://127.0.0.1:5194'}));afterAll(()=>vi.unstubAllGlobals());
 it('catalog entries are unique and every non-overlay entry produces real cards',()=>{expect(new Set(CATALOG.map(e=>e.id)).size).toBe(CATALOG.length);expect(CATALOG.filter(e=>e.group==='Workspace layouts')).toHaveLength(25);for(const entry of CATALOG.filter(e=>!['source-stack','questions'].includes(e.id))){const f=catalogFixture(entry.id);expect(f.items.length,entry.id).toBeGreaterThan(0);expect(Object.keys(f.plan.geometry.positions)).toHaveLength(f.items.length);}});
 it('market map has five categories and no fabricated relationships',()=>{const map=presentationObjects().market;const view=zephiumObject(map);expect(view?.kind).toBe('diagram');if(view?.kind==='diagram'){expect(view.diagram.edges).toHaveLength(0);expect(view.diagram.nodes).toHaveLength(16);expect(view.diagram.layers).toHaveLength(5);}});
 it('directory keeps all original rows and typed links',()=>{const view=zephiumObject(presentationObjects().table);expect(view?.kind).toBe('sheet');if(view?.kind==='sheet'){expect(view.rows).toHaveLength(16);expect(view.columns.map(c=>c.kind)).toEqual(['entity','tag','link']);}});
 it('campaign carries real dates, distinct step kinds and costs into the original Plan',()=>{const parsed=parseObject(presentationObjects().campaign)!;const view=zephiumObject(parsed);expect(view?.kind).toBe('plan');if(view?.kind==='plan'){expect(view.calendar).toBe(false);expect(view.steps).toHaveLength(11);expect(view.steps[1].kind).toBe('task');expect(view.steps[1].cost).toBe('$2k–$6k');expect(view.steps[0].date).toBe('2025-05-27');expect(view.total?.value).toBe('$2,000–10,000');}});
 it('preserves bounded public request history and valid image regions only',()=>{const all=presentationObjects();expect(parseObject(all.activity)?.requestActivity?.steps).toHaveLength(7);expect(parseObject(all.anchor)?.recommendations?.[0].imageRegion).toBeDefined();all.anchor.recommendations![0].imageRegion={x:0,y:0,width:5,height:1};expect(parseObject(all.anchor)?.recommendations?.[0].imageRegion).toBeUndefined();});
});
