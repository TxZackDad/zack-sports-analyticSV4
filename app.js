
const workbook="https://docs.google.com/spreadsheets/d/1MtiTIP8-TbCk_PQJ3dw5LFJzVPXaMXD3htUc-lADsik/edit";
const sports=['NBA','NFL','CFB','NHL','CBB','MLB','WNBA','Tennis','Soccer'];
let data, sport='NBA', away='', home='', sort=-1;
const active=document.querySelector('#active'), nav=document.querySelector('.sports');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number=v=>v===null?'Not available':Number(v).toLocaleString('en-US',{maximumFractionDigits:3});
function options(selected,excluded){return data.sports[sport].teams.filter(t=>t.name!==excluded).map(t=>'<option '+(t.name===selected?'selected':'')+'>'+esc(t.name)+'</option>').join('')}
function renderBase(){
const d=data.sports[sport]; if(!d.teams.some(t=>t.name===away))away=d.teams[0]?.name;
if(!d.teams.some(t=>t.name===home)||home===away)home=d.teams.find(t=>t.name!==away)?.name;
nav.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.textContent===sport));
const a=d.teams.find(t=>t.name===away),h=d.teams.find(t=>t.name===home);
const hasStats=d.teams.some(t=>t.values.some(v=>v!==null));
active.innerHTML='<div class="layout"><article class="panel"><div class="panelhead"><h2>Head to head</h2><span class="small">'+sport+' / '+(hasStats?'Workbook statistics':'Roster available · stats pending')+'</span></div><div class="matchup"><div><div class="teammark">'+esc(away.split(' ').map(w=>w[0]).join('').slice(0,3))+'</div><label for="away">'+(sport==='Tennis'?'PLAYER ONE':'AWAY TEAM')+'</label><select id="away">'+options(away,home)+'</select></div><div class="vs">VS</div><div class="home"><div class="teammark">'+esc(home.split(' ').map(w=>w[0]).join('').slice(0,3))+'</div><label for="home">'+(sport==='Tennis'?'PLAYER TWO':'HOME TEAM')+'</label><select id="home">'+options(home,away)+'</select></div></div><div id="stats" aria-live="polite">'+d.metrics.map((m,i)=>{let av=a.values[i],hv=h.values[i];let bars=av!==null&&hv!==null&&av>=0&&hv>=0&&av+hv>0?'<div class="bars"><i style="width:'+100*av/(av+hv)+'%"></i><i style="flex:1"></i></div>':'';return '<div class="stat"><span class="value '+(av===null?'missing':'')+'">'+number(av)+'</span><div class="metric">'+esc(m)+bars+'</div><span class="value '+(hv===null?'missing':'')+'">'+number(hv)+'</span></div>'}).join('')+'</div><div class="foot">Workbook values describe team performance or ratings, not predicted game scores. Blank source cells remain unavailable. NFL success rates are fractions (0.537 = 53.7%).</div></article><aside class="panel aside"><div class="eyebrow">BEHIND THE NUMBERS</div><h3>Know your data.</h3><div class="status"><span class="small">COVERAGE</span><strong><span class="dot"></span>'+d.teams.length+' '+(sport==='Tennis'?'players':'teams')+' imported</strong><p>'+ (hasStats?'Statistics populated; verify the source window below.':'Roster only. Statistics have not been populated in this source.')+'</p></div><div class="status"><span class="small">SOURCE NOTES</span><details><summary>View workbook source details</summary><p>'+esc(d.source)+'</p></details><p>Imported '+new Date(d.importedAt).toLocaleString()+'. Import time is not the statistics date.</p></div><div class="status"><span class="small">MODEL STATUS</span><strong style="color:var(--purple)">Experimental · uncalibrated</strong><p>Predictions and betting recommendations remain disabled.</p></div><a class="button" href="'+workbook+'" target="_blank" rel="noopener">Explore the V4 engine ↗</a></aside></div><section class="panel tablepanel"><div class="panelhead"><h2>'+sport+' at a glance</h2><div><label for="sort">SORT</label><select id="sort"><option value="-1">Name A–Z</option>'+d.metrics.map((m,i)=>'<option value="'+i+'" '+(sort===i?'selected':'')+'>'+esc(m)+' · high to low</option>').join('')+'</select></div></div><div class="tablewrap"><table><thead><tr><th scope="col">Name</th><th scope="col">Group</th>'+d.metrics.map(m=>'<th scope="col">'+esc(m)+'</th>').join('')+'</tr></thead><tbody id="league"></tbody></table></div></section>';
document.querySelector('#away').onchange=e=>{away=e.target.value;render()};document.querySelector('#home').onchange=e=>{home=e.target.value;render()};
document.querySelector('#sort').onchange=e=>{sort=Number(e.target.value);table()};table();
document.querySelector('.badge').textContent='Private preview · '+sports.length+' sports';
}
function table(){const d=data.sports[sport];document.querySelector('#league').innerHTML=[...d.teams].sort((a,b)=>sort<0?a.name.localeCompare(b.name):(b.values[sort]??-Infinity)-(a.values[sort]??-Infinity)||a.name.localeCompare(b.name)).map(t=>'<tr><td>'+esc(t.name)+'</td><td>'+esc(t.group)+'</td>'+t.values.map(v=>'<td>'+number(v)+'</td>').join('')+'</tr>').join('')}
sports.forEach(s=>{const b=document.createElement('button');b.textContent=s;b.onclick=()=>{sport=s;sort=-1;away='';home='';render()};nav.append(b)});
const controls=document.createElement('section');controls.className='panel refresh';controls.innerHTML='<div><div class="eyebrow">PRIVATE WORKBOOK REFRESH</div><h2>Import a private workbook.</h2><p>Download your V4 workbook as Excel (.xlsx), then choose it here. All nine sport tables update together. No file is uploaded. Imported changes last until this page reloads.</p></div><label class="button" for="import">Choose workbook<input id="import" type="file" accept=".xlsx" style="display:block;margin-top:12px;max-width:260px"></label><p id="importStatus" role="status">Optional Excel import · processed in your browser.</p>';
nav.before(controls);
document.querySelector('#import').onchange=async e=>{const f=e.target.files[0],status=document.querySelector('#importStatus');if(!f)return;status.textContent='Reading workbook locally…';try{if(f.size>30*1024*1024)throw Error('Choose a workbook smaller than 30 MB.');const next=await readWorkbook(f,data);data=next;away='';home='';render();status.textContent='Updated all nine sports from '+f.name+' at '+new Date().toLocaleTimeString()+'. No upload. Reloading restores the saved snapshot.';}catch(err){status.textContent='Import failed: '+err.message+' Previous data is unchanged.'}finally{e.target.value=''}};
fetch('data.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Unable to load data');return r.json()}).then(d=>{data=d;away='Oklahoma City Thunder';home='Houston Rockets';render()}).catch(e=>{active.textContent=e.message;document.querySelector('#import').disabled=true});


const liveBox=document.createElement('section');liveBox.className='panel refresh';liveBox.innerHTML='<div><div class="eyebrow">PRIVATE GOOGLE SHEETS CONNECTION</div><h2>Connect your Grok V4 Harness.</h2><p>Google will ask for read-only access to your spreadsheets. ODYSIQ reads only the nine engine tabs in your Harness. Access stays in browser memory. Refreshes every 5 minutes while this page is open and permission is valid.</p></div><button class="button" id="connectGoogle">Connect Google</button><button class="button" id="refreshGoogle" disabled>Refresh now</button><button class="button" id="disconnectGoogle" disabled>Disconnect</button><p id="googleStatus" role="status">Not connected. Showing the saved development snapshot.</p>';
controls.before(liveBox);
let accessToken='',expiresAt=0,liveTimer=null,busy=false,connectionGeneration=0;
const liveStatus=document.querySelector('#googleStatus');
const harnessId='1MtiTIP8-TbCk_PQJ3dw5LFJzVPXaMXD3htUc-lADsik';
const harnessUrl='https://docs.google.com/spreadsheets/d/'+harnessId+'/edit';
const scope='https://www.googleapis.com/auth/spreadsheets.readonly';
async function refreshGoogle(){
if(busy)return;
if(!accessToken||Date.now()>=expiresAt){stopGoogle();liveStatus.textContent='Google connection expired. Click Connect Google to reconnect.';return}
busy=true;const generation=connectionGeneration;liveStatus.textContent='Reading your private Harness…';
try{
const params=new URLSearchParams({valueRenderOption:'UNFORMATTED_VALUE'});sports.forEach(s=>params.append('ranges',"'"+s+"_Engine'!A1:U400"));
const response=await fetch('https://sheets.googleapis.com/v4/spreadsheets/'+harnessId+'/values:batchGet?'+params,{headers:{Authorization:'Bearer '+accessToken},cache:'no-store'});
if(!response.ok){if(response.status===401)stopGoogle();throw Error(response.status===403?'Access denied. Check your test-user account, Sheets API, and workbook permissions.':'Google Sheets returned '+response.status);}
const result=await response.json();const next=structuredClone(data);const stamp=new Date().toISOString();
sports.forEach((s,n)=>{const rows=result.valueRanges[n]?.values??[],metrics=data.sports[s].metrics;let hi=rows.findIndex(r=>metrics.every(m=>r.includes(m)));if(hi<0&&['CBB','MLB'].includes(s))hi=rows.findIndex(r=>r[0]==='Rank'&&r[1]==='Team'&&['Conference','League'].includes(r[2]));if(hi<0&&['WNBA','Tennis','Soccer'].includes(s))hi=rows.findIndex(r=>r[1]===({WNBA:'Conference',Tennis:'Tour',Soccer:'League'})[s]&&r[2]==='Status');if(hi<0)throw Error(s+' headers do not match the dashboard.');const headers=rows[hi],cols=metrics.map(m=>headers.indexOf(m)),special=['WNBA','Tennis','Soccer'].includes(s),nc=special?0:1,gc=special?1:2;
const entries=rows.slice(hi+1).filter(r=>r[nc]&&(special||/^\d+$/.test(String(r[0]??''))||(s==='CBB'&&!r[0]))).map(r=>({name:String(r[nc]),group:String(r[gc]??''),values:cols.map(i=>{const v=r[i];return v===undefined||v===null||String(v).trim()===''?null:Number.isFinite(Number(v))?Number(v):null})}));
if(entries.length<2||new Set(entries.map(t=>t.name)).size!==entries.length)throw Error(s+' roster is incomplete.');
next.sports[s]={metrics,teams:entries,source:special?String(headers[0]):String(rows[hi-1]?.[0]??'Private Harness import'),importedAt:stamp};
});if(generation!==connectionGeneration)return;next.updatedAt=stamp;data=next;render();document.querySelectorAll('a[href="'+workbook+'"]').forEach(a=>a.href=harnessUrl);document.querySelector('.badge').textContent='Private Harness · connected';liveStatus.textContent='Updated from your Grok V4 Harness at '+new Date().toLocaleTimeString()+'. Next refresh in 5 minutes.';
}catch(e){if(generation===connectionGeneration)liveStatus.textContent=e.message+' Displayed data is unchanged.'}finally{busy=false}
}
function stopGoogle(){connectionGeneration++;accessToken='';expiresAt=0;clearInterval(liveTimer);document.querySelector('#refreshGoogle').disabled=true;document.querySelector('#disconnectGoogle').disabled=true;}
document.querySelector('#refreshGoogle').onclick=refreshGoogle;
document.querySelector('#disconnectGoogle').onclick=()=>{stopGoogle();liveStatus.textContent='Disconnected. Previously loaded statistics remain visible until reload.';document.querySelector('.badge').textContent='Private preview · disconnected';};
document.querySelector('#connectGoogle').onclick=()=>{if(!window.google?.accounts?.oauth2){liveStatus.textContent='Google sign-in is still loading or was blocked. Reload and try again.';return}
const client=google.accounts.oauth2.initTokenClient({client_id:'1062012451399-t2a3fpfsbon2hgq2q08pt02edkgifn38.apps.googleusercontent.com',scope,include_granted_scopes:false,callback:async response=>{if(response.error){liveStatus.textContent='Google connection was not approved.';return}if(!google.accounts.oauth2.hasGrantedAllScopes(response,scope)){liveStatus.textContent='Read-only spreadsheet permission is required.';return}stopGoogle();accessToken=response.access_token;expiresAt=Date.now()+Number(response.expires_in)*1000-30000;document.querySelector('#refreshGoogle').disabled=false;document.querySelector('#disconnectGoogle').disabled=false;await refreshGoogle();liveTimer=setInterval(refreshGoogle,300000);},error_callback:()=>{liveStatus.textContent='Sign-in window closed or blocked. Click Connect Google to retry.'}});
client.requestAccessToken({prompt:'consent'});};
const identityScript=document.createElement('script');identityScript.src='https://accounts.google.com/gsi/client';identityScript.async=true;identityScript.onerror=()=>liveStatus.textContent='Google sign-in could not load. Check your connection.';document.head.append(identityScript);

function render(){
 renderBase();
 const d=data.sports[sport], a=d.teams.find(t=>t.name===away), h=d.teams.find(t=>t.name===home);
 const count=[...a.values,...h.values].filter(v=>v!==null&&Number.isFinite(v)).length,total=d.metrics.length*2;
 const summary=d.metrics.map((m,i)=>a.values[i]===null||h.values[i]===null?null:'<li><span>'+esc(m)+'</span><strong>'+number(a.values[i])+' <small> / </small> '+number(h.values[i])+'</strong></li>').filter(Boolean).slice(0,3).join('');
 const block=document.createElement('section');block.className='deep-dive';block.innerHTML=`
 <div class="match-banner"><div><span class="eyebrow">${sport} / MATCHUP DEEP DIVE</span><h2>${esc(away)} <span>vs</span> ${esc(home)}</h2><p>Two sides. One place to explore the numbers.</p></div><span class="badge">Development preview</span></div>
 <div class="insight-grid">
 <article class="panel insight"><div class="eyebrow">MATCHUP DATA</div><h3>Coverage at a glance</h3><div class="coverage"><div class="ring" style="--coverage:${count/total*360}deg"><strong>${Math.round(count/total*100)}<small>%</small></strong></div><div><strong>${count} of ${total}</strong><p>Selected statistics available.<br>Coverage is not confidence.</p></div></div></article>
 <article class="panel insight"><div class="eyebrow">PROJECTED OUTCOME</div><h3>Model validation pending</h3><div class="pending-score">— <span>:</span> —</div><p>Scores and win probabilities will appear after the model passes validation.</p></article>
 <article class="panel insight"><div class="eyebrow">MATCHUP SUMMARY</div><h3>The numbers in context</h3>${summary?'<ul class="summary-list">'+summary+'</ul>':'<p>Statistics are missing for this pairing. Connect the Harness to load available updates.</p>'}<p class="small">Values shown in team order. Historical statistics do not predict the result.</p></article>
 </div>
 <details class="panel lab"><summary>Performance Lab <span> / Testing readiness</span></summary><div class="lab-content"><div><strong>Interface testing</strong><p>Sport selection, comparisons, sorting and imports are ready for checks.</p></div><div><strong>Data review</strong><p>${d.teams.length} roster entries · ${count}/${total} selected values. Source dates and definitions still require review.</p></div><div><strong>Prediction testing</strong><p>Pending traceable game IDs, recorded forecasts and final outcomes.</p></div></div></details>`;
 active.prepend(block);
 if(d.metricUpdatedAt)document.querySelectorAll('#stats .metric').forEach((el,i)=>{const stamp=d.metricUpdatedAt[d.metrics[i]];const hint=document.createElement('div');hint.className='small';hint.textContent=stamp?(stamp===d.fetchedAt?'Free feed':'Saved snapshot')+' · '+new Date(stamp).toLocaleDateString():'No live source';el.append(hint)});
 const swap=document.createElement('button');swap.className='button swap';swap.textContent='Swap sides ⇄';swap.onclick=()=>{[away,home]=[home,away];render()};document.querySelector('.matchup').after(swap);
 document.querySelector('.badge').textContent='Private testing · saved snapshot';
 if(accessToken)document.querySelector('.badge').textContent='Private Harness · loaded data';else if(data.sports[sport].fetchedAt)document.querySelector('.badge').textContent='Free feeds · '+new Date(data.sports[sport].fetchedAt).toLocaleDateString();
}

