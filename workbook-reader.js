
async function readWorkbook(file,previous){
const buf=await file.arrayBuffer(),v=new DataView(buf),bytes=new Uint8Array(buf),decoder=new TextDecoder();let end=-1;
for(let i=buf.byteLength-22;i>=Math.max(0,buf.byteLength-65557);i--)if(v.getUint32(i,true)===0x06054b50){end=i;break}
if(end<0)throw Error('This is not a readable XLSX file.');
const count=v.getUint16(end+10,true);let offset=v.getUint32(end+16,true),entries=new Map(),total=0;
for(let n=0;n<count;n++){if(v.getUint32(offset,true)!==0x02014b50)throw Error('Invalid workbook archive.');
const method=v.getUint16(offset+10,true),size=v.getUint32(offset+20,true),unpacked=v.getUint32(offset+24,true),nameLen=v.getUint16(offset+28,true),extra=v.getUint16(offset+30,true),comment=v.getUint16(offset+32,true),local=v.getUint32(offset+42,true),name=decoder.decode(bytes.slice(offset+46,offset+46+nameLen));total+=unpacked;if(total>100*1024*1024)throw Error('Workbook expands beyond the 100 MB limit.');entries.set(name,{method,size,unpacked,local});offset+=46+nameLen+extra+comment;}
async function xml(name){const e=entries.get(name);if(!e)throw Error('Missing workbook component: '+name);const start=e.local+30+v.getUint16(e.local+26,true)+v.getUint16(e.local+28,true);let raw=bytes.slice(start,start+e.size);if(e.method===8)raw=new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());else if(e.method!==0)throw Error('Unsupported workbook compression.');if(raw.length!==e.unpacked)throw Error('Damaged workbook component.');const doc=new DOMParser().parseFromString(decoder.decode(raw),'application/xml');if(doc.querySelector('parsererror'))throw Error('Invalid workbook XML.');return doc;}
const wb=await xml('xl/workbook.xml'),rels=await xml('xl/_rels/workbook.xml.rels');const relmap=new Map([...rels.getElementsByTagName('Relationship')].map(r=>[r.getAttribute('Id'),r.getAttribute('Target')]));let strings=[];
if(entries.has('xl/sharedStrings.xml'))strings=[...(await xml('xl/sharedStrings.xml')).getElementsByTagName('si')].map(si=>[...si.getElementsByTagName('t')].map(t=>t.textContent).join(''));
const tabs=new Map([...wb.getElementsByTagName('sheet')].map(s=>[s.getAttribute('name'),s.getAttribute('r:id')]));
let next=structuredClone(previous);const stamp=new Date().toISOString();
for(const sport of Object.keys(previous.sports)){
const tab=sport+'_Engine';if(!tabs.has(tab))throw Error('Required tab missing: '+tab);
let target=relmap.get(tabs.get(tab));if(!target)throw Error('Missing sheet relationship.');target=target.startsWith('/')?target.slice(1):'xl/'+target;target=target.replace(/\/\.\//g,'/');
const sheet=await xml(target);let rows=[];
for(const row of sheet.getElementsByTagName('row')){let values=[];for(const cell of row.getElementsByTagName('c')){let letters=(cell.getAttribute('r')||'').match(/^[A-Z]+/);if(!letters)continue;let col=0;for(const c of letters[0])col=col*26+c.charCodeAt(0)-64;let t=cell.getAttribute('t'),value=cell.getElementsByTagName('v')[0]?.textContent??'';if(t==='s')value=strings[Number(value)]??'';else if(t==='inlineStr')value=[...cell.getElementsByTagName('t')].map(t=>t.textContent).join('');values[col-1]=value;}rows.push(values);}
const metrics=previous.sports[sport].metrics;const headerIndex=rows.findIndex(r=>metrics.every(m=>r.includes(m)));if(headerIndex<0)throw Error(tab+' is missing the expected metric headers.');
const header=rows[headerIndex],columns=metrics.map(m=>header.indexOf(m));const rosterOnly=['WNBA','Tennis','Soccer'].includes(sport);const nameCol=rosterOnly?0:1,groupCol=rosterOnly?1:2;
const teams=rows.slice(headerIndex+1).filter(r=>r[nameCol]&&(rosterOnly||/^\d+$/.test(r[0]??'')||(sport==='CBB'&&!r[0]))).map(r=>({name:String(r[nameCol]),group:String(r[groupCol]??''),values:columns.map(i=>{let raw=r[i];if(raw===undefined||raw.trim()==='')return null;let n=Number(raw.replace('%',''));return Number.isFinite(n)?n:null})}));
if(teams.length<2||new Set(teams.map(t=>t.name)).size!==teams.length)throw Error(tab+' must have at least two uniquely named entries.');
next.sports[sport]={metrics,teams,source:rosterOnly?String(header[0]):String(rows[headerIndex-1]?.[0]??'Imported workbook; source date not provided.'),importedAt:stamp};
}next.updatedAt=stamp;next.sourceModifiedAt=null;return next;
}

