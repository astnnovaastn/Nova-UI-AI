/** A backend-created note may arrive before the widget's cached snapshot. */
export async function resolveSavedNote({notes,noteId='',query='',refresh,match,onRefresh}){
 const id=String(noteId).trim();
 if(id){
  const cached=notes.find(note=>String(note?.id||'')===id);
  if(cached)return cached;
  const snapshot=await refresh();onRefresh?.(snapshot);
  return (snapshot?.notes||[]).find(note=>String(note?.id||'')===id)||null;
 }
 const text=String(query).trim();
 return text?(await match(text))?.note||null:null;
}
