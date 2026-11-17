import catalog from '../../../../../core/work/card_catalog.json';
export const CARD_FAMILIES=catalog.families;
export const CARD_PRESETS=new Map(CARD_FAMILIES.flatMap(f=>f.presets.map(p=>[p.id,{...p,family:f.id}] as const)));
export function admittedPreset(family:string,preset:string){const p=CARD_PRESETS.get(preset);return p?.family===family&&p.available?p:undefined;}
export type CardBlock={id:string;kind:'paragraph'|'heading'|'quote'|'bullets'|'figure'|'image';text?:string;label?:string;value?:string;url?:string;items?:string[]};
export type CardMedia={id:string;kind?:'image'|'video'|'source';url:string;thumbnail?:string;title?:string;caption?:string};
export type CardProvenance={path:string;basis:'sourced'|'supplied'|'calculated'|'proposal'|'unknown';source_ids:string[];calculation?:string};
export type AdaptiveFields={contract_version?:number;family?:string;preset?:string;blocks?:CardBlock[];media?:CardMedia[];provenance?:CardProvenance[];row_ids?:string[];series?:{id:string;name:string;unit?:string;points:{id:string;x:string;y:number|null}[]}[]};
