const DB='kartik-music-v4', TRACKS='tracks', PLAYLISTS='playlists', SETTINGS='settings';
let db, tracks=[], playlists=[], queue=[], index=-1, repeat=false, shuffle=false, currentView='home', objectUrl=null, wallpaperUrl=null, artUrls=new Map();
const audio=document.getElementById('audio');
const content=document.getElementById('content');
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

function reqPromise(req){return new Promise((res,rej)=>{req.onsuccess=()=>res(req.result);req.onerror=()=>rej(req.error)})}
function openDB(){return new Promise((res,rej)=>{const r=indexedDB.open(DB,2);r.onupgradeneeded=e=>{const d=r.result; if(!d.objectStoreNames.contains(TRACKS)) d.createObjectStore(TRACKS,{keyPath:'id',autoIncrement:true}); if(!d.objectStoreNames.contains(PLAYLISTS)) d.createObjectStore(PLAYLISTS,{keyPath:'id',autoIncrement:true}); if(!d.objectStoreNames.contains(SETTINGS)) d.createObjectStore(SETTINGS,{keyPath:'key'});}; r.onsuccess=()=>{db=r.result;res()};r.onerror=()=>rej(r.error)})}
const getAll=store=>reqPromise(db.transaction(store).objectStore(store).getAll());
const put=(store,x)=>reqPromise(db.transaction(store,'readwrite').objectStore(store).put(x));
const remove=(store,id)=>reqPromise(db.transaction(store,'readwrite').objectStore(store).delete(id));
const getSetting=k=>reqPromise(db.transaction(SETTINGS).objectStore(SETTINGS).get(k)).then(x=>x?.value);
let appReady=false;
window.kartikMusicData={getPlaylists:()=>getAll(PLAYLISTS),getTracks:()=>getAll(TRACKS),putPlaylist:(p)=>put(PLAYLISTS,p),refreshPlaylists:async()=>{playlists=await getAll(PLAYLISTS);render(currentView,$('#search').value)}};
async function runCloudSync(){if(!appReady||!window.kartikCloudPlaylistSync)return;try{await window.kartikCloudPlaylistSync()}catch(error){console.error('Cloud playlist sync failed:',error);toast('Cloud sync failed. Check Firestore rules and internet.')}}
window.addEventListener('kartik-auth-changed',()=>{if(appReady)runCloudSync()});
window.addEventListener('kartik-cloud-sync-complete',()=>toast('Cloud playlists synced'));

function fmt(x){if(!isFinite(x)||x<0)return '0:00';x=Math.floor(x);return Math.floor(x/60)+':'+String(x%60).padStart(2,'0')}
function toast(s){const t=$('#toast');t.textContent=s;t.classList.add('show');clearTimeout(t._timer);t._timer=setTimeout(()=>t.classList.remove('show'),1800)}
function makeArt(t,cls='thumb'){if(!t.art)return `<div class="${cls} fallback">♪</div>`;let u=artUrls.get(t.id);if(!u){u=URL.createObjectURL(t.art);artUrls.set(t.id,u)}return `<img class="${cls}" src="${u}" alt="">`}

function render(view=currentView,filter=''){currentView=view;const q=(filter||'').toLowerCase();const ts=tracks.filter(t=>(t.title+' '+t.artist).toLowerCase().includes(q));
 let html='';
 if(view==='home') html=`<div class="content"><div class="hero"><div><span class="eyebrow">YOUR LIBRARY</span><h1>Your music,<br>your way.</h1><p>Local, private and ad-free. Your songs and playlists stay on this device.</p><button class="hero-btn" id="heroImport">Import music</button></div><div class="stat"><strong>${tracks.length}</strong><span>TRACKS</span></div></div><div class="section-head"><h2>Recently added</h2><button class="text-btn" data-viewgo="songs">See all</button></div>${list(ts.slice().sort((a,b)=>(b.added||0)-(a.added||0)).slice(0,8))}</div>`;
 else if(view==='songs') html=`<div class="content"><div class="section-head"><div><span class="eyebrow">LIBRARY</span><h1>All songs</h1></div><button class="hero-btn small" id="songsImport">+ Import</button></div><p class="muted">${tracks.length} tracks stored locally.</p>${list(ts)}</div>`;
 else if(view==='playlists') html=`<div class="content"><div class="section-head"><div><span class="eyebrow">YOUR COLLECTIONS</span><h1>Playlists</h1></div><button class="hero-btn small" id="newPlaylist">+ New playlist</button></div>${playlists.length?`<div class="playlist-grid">${playlists.map(playlistCard).join('')}</div>`:`<div class="empty large"><div class="empty-icon">▤</div><strong>Create your first playlist</strong><span>Group your imported songs however you like.</span><button class="hero-btn small" id="newPlaylist2">Create playlist</button></div>`}</div>`;
 else html=`<div class="content"><span class="eyebrow">PERSONALIZE</span><h1>Appearance</h1><div class="settings-card"><div><b>Custom wallpaper</b><p>Choose an image stored only on this device.</p></div><button class="hero-btn small" id="wallpaperBtn">Choose image</button>${wallpaperUrl?'<button class="ghost" id="clearWallpaper">Remove</button>':''}</div><div class="settings-card"><div><b>Library storage</b><p>${tracks.length} songs · ${playlists.length} playlists</p></div><button class="ghost" id="clearLibrary">Clear library</button></div></div>`;
 content.innerHTML=html;bindContent();
}
function list(ts){if(!ts.length)return `<div class="empty"><strong>No songs found</strong><span>Import MP3s or another supported audio file.</span></div>`;return `<div class="list">${ts.map(t=>`<div class="row" data-play="${t.id}">${makeArt(t)}<div class="meta"><b>${esc(t.title)}</b><span>${esc(t.artist)}</span></div><time>${fmt(t.duration)}</time><button class="more" data-menu="${t.id}" aria-label="Song menu">•••</button></div>`).join('')}</div>`}
function playlistCard(p){const songs=p.songIds.map(id=>tracks.find(t=>t.id===id)).filter(Boolean);const art=songs.find(s=>s.art);return `<button class="playlist-card" data-pl="${p.id}">${art?makeArt(art,'playlist-art'):'<div class="playlist-art mosaic">♪</div>'}<div class="pl-info"><b>${esc(p.name)}</b><span>${songs.length} ${songs.length===1?'song':'songs'}</span></div></button>`}
function bindContent(){const imp=()=>$('#fileInput').click();$('#heroImport')?.addEventListener('click',imp);$('#songsImport')?.addEventListener('click',imp);$('#wallpaperBtn')?.addEventListener('click',()=>$('#wallpaperInput').click());$('#clearWallpaper')?.addEventListener('click',clearWallpaper);$('#newPlaylist')?.addEventListener('click',()=>newPlaylist());$('#newPlaylist2')?.addEventListener('click',()=>newPlaylist());$('#clearLibrary')?.addEventListener('click',clearLibrary);content.querySelectorAll('[data-play]').forEach(e=>e.addEventListener('click',()=>playById(+e.dataset.play)));content.querySelectorAll('[data-menu]').forEach(e=>e.addEventListener('click',ev=>songMenu(ev,+e.dataset.menu)));content.querySelectorAll('[data-viewgo]').forEach(e=>e.addEventListener('click',()=>activate(e.dataset.viewgo)));content.querySelectorAll('[data-pl]').forEach(e=>e.addEventListener('click',()=>openPlaylist(+e.dataset.pl)))}
function activate(v){document.querySelectorAll('.nav').forEach(n=>n.classList.toggle('active',n.dataset.view===v));render(v,$('#search').value)}
async function songMenu(ev,id){ev.stopPropagation();const t=tracks.find(x=>x.id===id);if(!t)return;const action=prompt(`Song: ${t.title}\n\nType: add, delete`);if(action?.toLowerCase()==='delete'){await remove(TRACKS,id);for(const p of playlists){p.songIds=p.songIds.filter(x=>x!==id);await put(PLAYLISTS,p)}if(artUrls.has(id)){URL.revokeObjectURL(artUrls.get(id));artUrls.delete(id)}tracks=await getAll(TRACKS);playlists=await getAll(PLAYLISTS);render();toast('Song removed');runCloudSync()}else if(action?.toLowerCase()==='add'){await addToPlaylist(id)}}
async function newPlaylist(addId=null){const name=prompt('Playlist name');if(!name?.trim())return;const p={name:name.trim(),songIds:addId?[addId]:[],created:Date.now()};await put(PLAYLISTS,p);playlists=await getAll(PLAYLISTS);render('playlists');toast('Playlist created');runCloudSync()}
async function addToPlaylist(id){if(!playlists.length){await newPlaylist(id);return}const names=playlists.map((p,i)=>`${i+1}. ${p.name}`).join('\n');const pick=prompt(`Add to playlist:\n\n${names}\n\nEnter a number:`);const i=Number(pick)-1;if(!Number.isInteger(i)||!playlists[i])return;const p=playlists[i];if(!p.songIds.includes(id))p.songIds.push(id);await put(PLAYLISTS,p);playlists=await getAll(PLAYLISTS);toast(`Added to ${p.name}`);runCloudSync()}
function openPlaylist(id){const p=playlists.find(x=>x.id===id);if(!p)return;const songs=p.songIds.map(x=>tracks.find(t=>t.id===x)).filter(Boolean);content.innerHTML=`<div class="content"><button class="backlink" id="backPl">Back to playlists</button><div class="section-head"><div><span class="eyebrow">PLAYLIST</span><h1>${esc(p.name)}</h1><p class="muted">${songs.length} songs</p></div><button class="hero-btn small" id="playPl">Play all</button></div>${list(songs)}</div>`;$('#backPl').onclick=()=>render('playlists');$('#playPl').onclick=()=>{if(songs.length){queue=songs;index=0;loadCurrent(true)}};content.querySelectorAll('[data-play]').forEach(e=>e.onclick=()=>{queue=songs;index=songs.findIndex(x=>x.id===+e.dataset.play);loadCurrent(true)});content.querySelectorAll('[data-menu]').forEach(e=>e.onclick=ev=>songMenu(ev,+e.dataset.menu))}
function parseFilename(name){const s=name.replace(/\.[^.]+$/,'').trim();const m=s.match(/^(.+?)\s+[-–—]\s+(.+)$/);return m?{artist:m[1].trim(),title:m[2].trim()}:{artist:'Unknown artist',title:s}}
async function importFiles(files){let count=0;for(const f of files){if(!f.type.startsWith('audio/')&&!/\.(mp3|m4a|aac|wav|ogg|flac)$/i.test(f.name))continue;const meta=await readMetadata(f),fallback=parseFilename(f.name);const t={title:meta.title||fallback.title,artist:meta.artist||fallback.artist,file:f,art:meta.art||null,duration:await getDuration(f),added:Date.now()+count};await put(TRACKS,t);count++}tracks=await getAll(TRACKS);render('songs');toast(`Imported ${count} track${count===1?'':'s'}`);runCloudSync()}
function getDuration(f){return new Promise(r=>{const a=new Audio();const u=URL.createObjectURL(f);a.onloadedmetadata=()=>{URL.revokeObjectURL(u);r(a.duration||0)};a.onerror=()=>{URL.revokeObjectURL(u);r(0)};a.src=u})}
function readMetadata(file){return new Promise(resolve=>{if(!/\.mp3$/i.test(file.name)){resolve({});return}const fr=new FileReader();fr.onload=()=>{try{resolve(parseID3(fr.result))}catch{resolve({})}};fr.onerror=()=>resolve({});fr.readAsArrayBuffer(file)})}
function syncsafe(a,b,c,d){return ((a&127)<<21)|((b&127)<<14)|((c&127)<<7)|(d&127)}
function decodeText(bytes,enc){try{if(enc===3)return new TextDecoder('utf-8').decode(bytes).replace(/\0/g,'').trim();if(enc===0)return new TextDecoder('windows-1252').decode(bytes).replace(/\0/g,'').trim();let out='';for(let i=0;i+1<bytes.length;i+=2){let n=enc===1?(bytes[i]|bytes[i+1]<<8):(bytes[i]<<8|bytes[i+1]);if(n)out+=String.fromCharCode(n)}return out.replace(/^\uFEFF/,'').replace(/\0/g,'').trim()}catch{return ''}}
function parseID3(buf){const d=new DataView(buf),u=new Uint8Array(buf);if(u.length<10||String.fromCharCode(...u.slice(0,3))!=='ID3')return{};const ver=u[3],size=syncsafe(u[6],u[7],u[8],u[9]);let pos=10,end=Math.min(u.length,10+size),title='',artist='',art=null;while(pos+10<=end){const id=String.fromCharCode(...u.slice(pos,pos+4));if(!id.trim())break;let len=ver>=4?syncsafe(u[pos+4],u[pos+5],u[pos+6],u[pos+7]):d.getUint32(pos+4);if(len<=0||pos+10+len>end)break;const body=u.slice(pos+10,pos+10+len);if(id==='TIT2'||id==='TT2')title=decodeText(body.slice(1),body[0]);else if(id==='TPE1'||id==='TP1')artist=decodeText(body.slice(1),body[0]);else if(id==='APIC')art=parseAPIC(body);else if(id==='PIC')art=parsePIC(body);pos+=10+len}return{title,artist,art}}
function parseAPIC(b){let i=1;while(i<b.length&&b[i]!==0)i++;const mime=new TextDecoder().decode(b.slice(1,i))||'image/jpeg';i++;i++;if(b[0]===0){while(i<b.length&&b[i]!==0)i++;i++}else{while(i+1<b.length&&!(b[i]===0&&b[i+1]===0))i+=2;i+=2}const bytes=b.slice(i);return bytes.length?new Blob([bytes],{type:mime}):null}
function parsePIC(b){if(b.length<5)return null;const enc=b[0],fmt=String.fromCharCode(b[1],b[2],b[3]);let i=4;i++;while(i<b.length&&b[i]===0)i++;while(i<b.length&&b[i]!==0)i++;i++;if(enc===0){while(i<b.length&&b[i]!==0)i++;i++}else{while(i+1<b.length&&!(b[i]===0&&b[i+1]===0))i+=2;i+=2}return b.slice(i).length?new Blob([b.slice(i)],{type:fmt==='PNG'?'image/png':'image/jpeg'}):null}
async function playById(id){queue=[...tracks];index=queue.findIndex(t=>t.id===id);loadCurrent(true)}
async function loadCurrent(auto=true){const t=queue[index];if(!t)return;if(objectUrl)URL.revokeObjectURL(objectUrl);objectUrl=URL.createObjectURL(t.file);audio.src=objectUrl;audio.dataset.trackId=t.id;$('#nowTitle').textContent=t.title;$('#nowArtist').textContent=t.artist;setCover(t);savePlayback(t.id,0);if(auto){try{await audio.play();$('#play').textContent='Pause'}catch{$('#play').textContent='Play';toast('Browser blocked autoplay. Press Play once.')}}}
function setCover(t){const c=$('#cover');if(!t||!t.art){c.textContent='♪';return}let u=artUrls.get(t.id);if(!u){u=URL.createObjectURL(t.art);artUrls.set(t.id,u)}c.innerHTML=`<img src="${u}" alt="">`}
function next(){if(!queue.length)return;if(shuffle){let n;do n=Math.floor(Math.random()*queue.length);while(queue.length>1&&n===index);index=n}else index=(index+1)%queue.length;loadCurrent(true)}
function prev(){if(audio.currentTime>4){audio.currentTime=0;return}if(!queue.length)return;index=(index-1+queue.length)%queue.length;loadCurrent(true)}
async function savePlayback(id,pos){await put(SETTINGS,{key:'playback',value:{id,position:pos}}).catch(()=>{})}
async function restorePlayback(){const s=await getSetting('playback');if(!s)return;const t=tracks.find(x=>x.id===s.id);if(!t)return;queue=[...tracks];index=queue.findIndex(x=>x.id===t.id);if(objectUrl)URL.revokeObjectURL(objectUrl);objectUrl=URL.createObjectURL(t.file);audio.src=objectUrl;audio.addEventListener('loadedmetadata',async function once(){audio.currentTime=Math.min(Number(s.position)||0,audio.duration||0);audio.removeEventListener('loadedmetadata',once);$('#nowTitle').textContent=t.title;$('#nowArtist').textContent=t.artist;setCover(t);try{await audio.play();$('#play').textContent='Pause'}catch{$('#play').textContent='Play'}});}
async function setWallpaper(file){
 if(!file)return;
 if(!file.type || !file.type.startsWith('image/')){toast('Please choose an image file');return}
 try{
   applyWallpaper(file);
   await put(SETTINGS,{key:'wallpaper',value:file});
   toast('Wallpaper applied and saved');
 }catch(err){
   console.error('Wallpaper save failed:',err);
   toast('Wallpaper applied, but could not be saved');
 }
}
function applyWallpaper(file){
 if(!file)return;
 if(wallpaperUrl)URL.revokeObjectURL(wallpaperUrl);
 wallpaperUrl=URL.createObjectURL(file);
 const layer=$('#wallpaper');
 layer.style.backgroundImage=`url("${wallpaperUrl}")`;
 document.body.classList.add('has-wallpaper');
}
async function clearWallpaper(){await remove(SETTINGS,'wallpaper');if(wallpaperUrl)URL.revokeObjectURL(wallpaperUrl);wallpaperUrl=null;$('#wallpaper').style.backgroundImage='';document.body.classList.remove('has-wallpaper');render('settings');toast('Wallpaper removed')}
async function clearLibrary(){if(!confirm('Delete all imported music and playlists from this browser?'))return;await Promise.all(tracks.map(t=>remove(TRACKS,t.id)));await Promise.all(playlists.map(p=>remove(PLAYLISTS,p.id)));tracks=[];playlists=[];render('home');toast('Library cleared')}

$('#importTop').onclick=$('#importSide').onclick=()=>$('#fileInput').click();
$('#fileInput').onchange=e=>{importFiles([...e.target.files]);e.target.value=''};
$('#wallpaperInput').onchange=e=>{setWallpaper(e.target.files[0]);e.target.value=''};
$('#play').onclick=()=>{if(!audio.src){if(tracks[0])playById(tracks[0].id);return}audio.paused?(audio.play().then(()=>$('#play').textContent='Pause').catch(()=>toast('Press Play to start'))): (audio.pause(),$('#play').textContent='Play')};
$('#next').onclick=next;$('#prev').onclick=prev;$('#back').onclick=()=>audio.currentTime=Math.max(0,audio.currentTime-10);$('#forward').onclick=()=>audio.currentTime=Math.min(audio.duration||0,audio.currentTime+10);
$('#repeat').onclick=()=>{repeat=!repeat;$('#repeat').classList.toggle('active',repeat)};$('#shuffle').onclick=()=>{shuffle=!shuffle;$('#shuffle').classList.toggle('active',shuffle)};
audio.onended=()=>repeat?loadCurrent(true):next();audio.ontimeupdate=()=>{$('#seek').value=audio.duration?audio.currentTime/audio.duration*100:0;$('#cur').textContent=fmt(audio.currentTime);$('#dur').textContent=fmt(audio.duration);if(audio.dataset.trackId)savePlayback(Number(audio.dataset.trackId),audio.currentTime)};$('#seek').oninput=e=>{if(audio.duration)audio.currentTime=audio.duration*e.target.value/100};$('#vol').oninput=e=>audio.volume=e.target.value;audio.volume=.8;
document.querySelectorAll('.nav').forEach(n=>n.onclick=()=>activate(n.dataset.view));$('#search').oninput=e=>render(currentView,e.target.value);
window.addEventListener('beforeunload',()=>{if(audio.dataset.trackId)savePlayback(Number(audio.dataset.trackId),audio.currentTime)});

openDB().then(async()=>{tracks=await getAll(TRACKS);playlists=await getAll(PLAYLISTS);const w=await getSetting('wallpaper');if(w)applyWallpaper(w);render('home');await restorePlayback();appReady=true;window.kartikMusicAppReady=true;if(window.kartikCloudPlaylistSync)runCloudSync()}).catch(e=>{console.error(e);toast('Storage failed. Use the local server included with this project.')});
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
