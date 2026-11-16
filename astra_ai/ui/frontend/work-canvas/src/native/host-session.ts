/** The React host supplies the live owner session; never persist credentials here. */
let headers:()=>Record<string,string>=()=>({});
export function setWorkspaceHeaders(value:()=>Record<string,string>){headers=value;}
export function workspaceHeaders(){return {'Content-Type':'application/json',...headers()};}
