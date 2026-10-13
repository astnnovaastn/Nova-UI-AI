import React from 'react';
const label=s=>String(s).replaceAll('_',' ').replace(/([a-z])([A-Z])/g,'$1 $2');
function Value({value,depth=0}){
 if(value===null||value===undefined)return <span className="memory-value-neutral">Not recorded</span>;
 if(typeof value==='boolean')return <span>{value?'Yes':'No'}</span>;
 if(typeof value!=='object'){const text=String(value);if(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(text)&&Number.isFinite(Date.parse(text)))return <time dateTime={text} title={text}>{new Date(text).toLocaleString()}</time>;if(/^https?:\/\//i.test(text)){try{const url=new URL(text);if(!url.username&&!url.password)return <a href={url.href} target="_blank" rel="noopener noreferrer">{text}</a>;}catch{}}return <span className="memory-value-text">{text}</span>;}
 if(depth>=6)return <details><summary>Nested details</summary><pre>{JSON.stringify(value,null,2)}</pre></details>;
 if(Array.isArray(value))return value.length?<ul className="memory-value-list">{value.slice(0,100).map((item,i)=><li key={i}><Value value={item} depth={depth+1}/></li>)}{value.length>100&&<li><details><summary>{value.length-100} more items</summary><pre>{JSON.stringify(value.slice(100),null,2)}</pre></details></li>}</ul>:<span>No items</span>;
 const fields=Object.entries(value);return fields.length?<dl className="memory-value-fields">{fields.map(([key,item])=><React.Fragment key={key}><dt>{label(key)}</dt><dd><Value value={item} depth={depth+1}/></dd></React.Fragment>)}</dl>:<span>No fields recorded</span>;
}
export default function StructuredMemory({value,raw=true}){return <div className="memory-structured"><Value value={value}/>{raw&&typeof value==='object'&&value!==null&&<details className="memory-raw"><summary>Formatted JSON</summary><pre>{JSON.stringify(value,null,2)}</pre></details>}</div>;}
