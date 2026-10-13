import { expect, test } from '@playwright/test';

test.use({ channel: 'msedge' });

const categoryNames = ['user_identity','personal_preferences','task_project_tracking','activity_behavior','user_instructions','current_state','personal_development','communication_boundaries','contextual_rules','multi_identity','knowledge_expertise','tool_integration','response_adaptation','file_media','long_term_goals','collaborator_relationships','data_privacy','multimodal_preferences','system_awareness','session_themes','meta_memory','temporal_patterns','search_external_info','greeting_patterns','conversation_analytics','news_weather_history','timezone_preferences'];

test('Memory categories and controls preserve drafts and recover from backend failures', async ({ page }, testInfo) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  let offline = false, rejectSave = true;
  let records = [{ id:'fixture-a', category:'user_identity', key:'fixture_identity', value:'cobalt lantern', kind:'fact', source:'human', evidence:'User explicitly supplied this fixture', revision:1, history:[], effective_lifecycle:'active' }, { id:'fixture-b', category:'task_project_tracking', key:'fixture_project', value:'related fixture project', kind:'fact', source:'human', revision:1, history:[], effective_lifecycle:'active' }];
  let proposals = [{ id:'pending-a', record:{ category:'personal_preferences', value:'sensitive fixture one' }, reason:'sensitive' }, { id:'pending-b', record:{ category:'personal_preferences', value:'sensitive fixture two' }, reason:'sensitive' }];
  const links = [{ id:'fixture-link', from:'fixture-a', to:'fixture-b', type:'supports', evidence:'User connected these fixtures' }];
  await page.addInitScript(() => { window.WebSocket = class { static OPEN = 1; constructor() { this.readyState = 1; setTimeout(() => this.onopen?.(),0); } send() {} addEventListener() {} removeEventListener() {} close() {} }; });
  await page.route('**/api/notes**', route => route.fulfill({ json:{ notes:[], summaries:[] } }));
  await page.route('**/api/memory/**', async route => {
    const request=route.request(), url=new URL(request.url());
    const json=(data,status=200) => route.fulfill({ status, contentType:'application/json',body:JSON.stringify(data) });
    if (offline) return json({ status:'failed', reason:'memory_storage_unavailable' },503);
    if (url.pathname.endsWith('/categories')) return json({ categories:categoryNames.map(category => ({ category, title:category.replaceAll('_',' '), content:'Evidence-backed memories', usage:'Personalize relevant responses', counts:{ active:records.filter(r => r.category===category && r.effective_lifecycle==='active').length, pending:proposals.filter(p => p.record.category===category).length, forgotten:records.filter(r => r.category===category && r.effective_lifecycle==='forgotten').length } })) });
    if(url.pathname.endsWith('/graph')){const found=records.filter(r=>r.effective_lifecycle==='active');return json({status:'ok',nodes:found,edges:links,revision:String(found.length),total:found.length});}
    if (url.pathname.endsWith('/records')) { const items=records.filter(r => r.category===url.searchParams.get('category') && (url.searchParams.get('lifecycle')==='all' ? r.effective_lifecycle!=='forgotten' : r.effective_lifecycle===url.searchParams.get('lifecycle'))); return json({ matches:items,total:items.length }); }
    const body=request.postDataJSON() || {};
    if (body.action==='list_pending') return json({ proposals:proposals.filter(p => p.record.category===body.category) });
    if (body.action==='list_conflicts') return json({ conflicts:[] });
    if (body.action==='list_links') return json({ links });
    if (body.action==='get') return json({ record:records.find(r => r.id===body.record_id) });
    if (body.action==='update') {
      if (rejectSave) { rejectSave=false; return json({ status:'failed', reason:'simulated_disk_failure' },503); }
      records=records.map(r => r.id===body.record_id ? { ...r, value:body.value, revision:r.revision+1, history:[...r.history,{ value:r.value,revision:r.revision }] } : r); return json({ status:'updated' });
    }
    if (body.action==='forget' || body.action==='restore') { records=records.map(r => r.id===body.record_id ? { ...r, effective_lifecycle:body.action==='forget'?'forgotten':'active' } : r); return json({ status:body.action==='forget'?'forgotten':'restored' }); }
    if (body.action==='approve' || body.action==='reject') { proposals=proposals.filter(p => p.id!==body.approval_id); return json({ status:body.action==='approve'?'saved':'rejected', reason:body.action==='reject'?'user_declined':undefined }); }
    if (body.action==='create_fact') { records.push({ id:'fixture-new', category:body.category,key:body.key,value:body.value,kind:'fact',revision:1,source:'human',history:[],effective_lifecycle:'active' }); return json({ status:'saved' }); }
    return json({ status:'ok' });
  });
  await page.goto('/');
  await page.locator('#btn-menu').click();
  await page.locator('#btn-settings').click();
  await page.locator('#btn-memory-workspace').click();
  await expect(page.locator('.memory-network-canvas')).toBeVisible();
  await page.getByRole('button',{name:'Open memory library'}).click();
  const view=page.getByRole('region',{name:'Memory library'});const panel=page.getByRole('dialog',{name:'Selected memory'});
  await expect(view.getByRole('navigation',{name:'Memory categories'}).getByRole('button')).toHaveCount(27);
  await view.getByRole('button',{name:/user identity/i}).click();
  await view.getByRole('button',{name:/fixture identity/}).click();
  await panel.getByRole('button',{name:'Connections',exact:true}).click();
  await expect(panel).toContainText('User connected these fixtures');
  await panel.getByRole('button',{name:'Overview',exact:true}).click();
  await panel.getByRole('button',{name:'Edit',exact:true}).click();
  await panel.getByRole('textbox',{name:'Edit selected memory value'}).fill('revised cobalt lantern');
  await panel.getByRole('button',{name:'Save changes'}).click();
  await expect(panel.getByRole('alert')).toContainText('simulated_disk_failure');
  await expect(panel.getByRole('textbox',{name:'Edit selected memory value'})).toHaveValue('revised cobalt lantern');
  await page.getByRole('button',{name:'Return to dashboard'}).click();
  await page.locator('#btn-menu').click();
  await page.locator('#btn-settings').click();
  await page.locator('#btn-memory-workspace').click();
  await expect(panel.getByRole('textbox',{name:'Edit selected memory value'})).toHaveValue('revised cobalt lantern');
  await panel.getByRole('button',{name:'Save changes'}).click();
  await expect(panel.getByRole('textbox',{name:'Edit selected memory value'})).toHaveCount(0);
  await expect(panel).toContainText('revised cobalt lantern');
  await panel.getByRole('button',{name:'Forget',exact:true}).click();
  await page.getByRole('button',{name:'Open memory library'}).click();
  await view.getByRole('button',{name:'Memory filters'}).click();
  await view.getByRole('combobox',{name:'Memory lifecycle'}).selectOption('forgotten');
  await view.getByRole('button',{name:/fixture identity/}).click();
  await panel.getByRole('button',{name:'Restore',exact:true}).click({timeout:5000});
  await expect(panel).toContainText('revised cobalt lantern');
  await panel.getByRole('button',{name:'Close selected memory'}).click();
  await page.getByRole('button',{name:'Open memory library'}).click();
  await view.getByRole('combobox',{name:'Memory lifecycle'}).selectOption('all');
  await expect(view.getByRole('button',{name:/fixture identity/})).toBeVisible();
  await view.getByRole('button',{name:'Back to categories'}).click();
  await view.getByRole('button',{name:/personal preferences/i}).click();
  await expect(view.getByRole('button',{name:'Approve',exact:true})).toHaveCount(2);
  await view.getByRole('button',{name:'Approve',exact:true}).first().click();
  await expect(view.getByRole('button',{name:'Reject',exact:true})).toHaveCount(1);
  await view.getByRole('button',{name:'Reject',exact:true}).click();
  await expect(view.getByRole('button',{name:'Reject',exact:true})).toHaveCount(0);
  await view.getByRole('button',{name:'New memory',exact:true}).click();
  await view.getByRole('textbox',{name:'New memory key'}).fill('fixture_style');
  await view.getByRole('textbox',{name:'New memory value'}).fill('concise explanations');
  await view.getByRole('button',{name:'Save memory',exact:true}).click();
  await expect(view.getByRole('button',{name:/fixture style/})).toBeVisible();
  await expect(page.locator('.memory-network-canvas')).toHaveAttribute('data-node-count','1');
  offline=true;await view.getByRole('button',{name:'Refresh',exact:true}).click();
  await expect(view.getByRole('alert')).toContainText('memory_storage_unavailable');
  offline=false;await view.getByRole('button',{name:'Retry',exact:true}).click({timeout:5000});
  await expect(view.getByRole('alert')).toHaveCount(0);
  await view.getByRole('button',{name:'Back to categories'}).click();
  await expect(view.getByRole('navigation',{name:'Memory categories'}).getByRole('button')).toHaveCount(27);
  await page.locator('.memory-workspace').evaluate(el=>el.scrollTop=0);
  await page.screenshot({ path:testInfo.outputPath('memory-controls.png'),fullPage:true });
  expect(errors).toEqual([]);
});
