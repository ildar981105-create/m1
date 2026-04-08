// translate-v8.js — 沉浸式影视译制页核心逻辑
(function(){
'use strict';

/* ===== State ===== */
let phase = 'processing';
let playing = false;
let videoTime = 0;
const videoDuration = 90;
let animFrame = null;
let features = { erase:true, subtitle:true, voice:true };
let uploadedFileName = '';

/* ===== URL Params ===== */
const P = new URLSearchParams(location.search);
const autostart = P.get('autostart')==='1';
const promptText = P.get('prompt')||'';
const workflowMode = P.get('mode')||'full';
uploadedFileName = P.get('file')||'产品发布会完整版.mp4';

/* ===== Roles ===== */
const ROLES = {
    director:{ name:'导演', realName:'林雨晨', color:'#e74c3c', avatar:'assets/characters/linyuchen-director.png', cssClass:'role-director',
        greetings:['收到素材了，我快速过了一遍。陈默，画面交给你。明远准备文案，苏雅候着。','这条片子节奏不慢。老规矩——陈默开路，明远跟上，苏雅收尾。','素材到了。分工表拉好了——陈默画面、明远翻译、苏雅配音。']},
    postprod:{ name:'后期', realName:'陈默', color:'#7c3aed', avatar:'assets/characters/chenmo-postprod.png', cssClass:'role-postprod',
        checkIn:['……嗯。工具摆好了，等开工。','在的。准备就绪。','收到。耳机戴了，随时能干。']},
    translator:{ name:'翻译', realName:'李明远', color:'#2563eb', avatar:'assets/characters/limingyuan-translator.png', cssClass:'role-translator',
        checkIn:['材料过了一遍，准备就绪。','术语库加载好了。等安排。','好的，准备好了。']},
    voice:{ name:'配音', realName:'苏雅', color:'#ec4899', avatar:'assets/characters/suya-voice.png', cssClass:'role-voice',
        checkIn:['来啦～ 声卡耳返都OK！🎵','到了到了！热了一下嗓～','准备就绪！等前面搞完就上 🎶']}
};

/* ===== Elements ===== */
const page = document.getElementById('v8Page');
const videoEl = document.getElementById('mainVideo');
const burntSub = document.getElementById('burntSub');
const chatFlow = document.getElementById('chatFlow');
const phaseEl = document.getElementById('phaseEl');
const phaseDot = document.getElementById('phaseDot');
const phaseLabel = document.getElementById('phaseLabel');
const subPreview = document.getElementById('subPreview');
const subOrigEl = subPreview.querySelector('.so');
const subTransEl = subPreview.querySelector('.st');
const voicePreview = document.getElementById('voicePreview');
const eraseOC = document.getElementById('eraseOC');
const tlPlayhead = document.getElementById('tlPlayhead');
const tlTracks = document.getElementById('tlTracks');

/* ===== Data ===== */
const subtitleItems=[
{id:'S1',orig:'大家好 欢迎来到科技前沿',trans:'Hello everyone, welcome to TechFront',startSec:2,endSec:5},
{id:'S2',orig:'今天聊AI视频翻译',trans:"Today let's talk about AI video translation",startSec:8,endSec:14},
{id:'S3',orig:'传统视频本地化非常复杂',trans:'Traditional video localization is very complex',startSec:20,endSec:26},
{id:'S4',orig:'需要人工扒字幕 翻译 配音',trans:'You need manual subtitling, translation, and dubbing',startSec:30,endSec:37},
{id:'S5',orig:'但AI可以一键完成',trans:'But AI can do it in one click',startSec:42,endSec:49},
{id:'S6',orig:'还能保留原始音色',trans:"It preserves the original speaker's voice",startSec:55,endSec:63},
{id:'S7',orig:'今天就到这里 下期再见',trans:"That's all, see you next time",startSec:68,endSec:76}];

const voiceItems=[
{id:'V1',text:'Hello everyone, welcome to TechFront',startSec:2,endSec:5},
{id:'V2',text:"Today let's talk about AI video translation",startSec:8,endSec:14},
{id:'V3',text:'Traditional video localization is very complex',startSec:20,endSec:26},
{id:'V4',text:'You need manual subtitling, translation, and dubbing',startSec:30,endSec:37},
{id:'V5',text:'But AI can do it in one click',startSec:42,endSec:49},
{id:'V6',text:"It preserves the original speaker's voice",startSec:55,endSec:63},
{id:'V7',text:"That's all, see you next time",startSec:68,endSec:76}];

const eraseRegions=[
{id:'E1',title:'底部字幕区域',x:8,y:82,w:84,h:12,startSec:2,endSec:5},
{id:'E2',title:'底部字幕区域',x:8,y:82,w:84,h:12,startSec:8,endSec:14},
{id:'E3',title:'底部字幕区域',x:6,y:82,w:88,h:12,startSec:20,endSec:26},
{id:'E4',title:'底部字幕区域',x:8,y:82,w:84,h:12,startSec:30,endSec:37},
{id:'E5',title:'底部字幕区域',x:8,y:82,w:84,h:12,startSec:42,endSec:49},
{id:'E6',title:'底部字幕区域',x:6,y:82,w:88,h:12,startSec:55,endSec:63},
{id:'E7',title:'底部字幕区域',x:8,y:82,w:84,h:12,startSec:68,endSec:76},
{id:'E8',title:'顶部水印',x:70,y:3,w:28,h:8,startSec:0,endSec:90}];
let eraseRegionCounter=8;

/* ===== Pipeline ===== */
let activeSteps=['erase','subtitle','voice'];
let currentStep=-1;
let scriptReady=false;
const stepRoleMap={erase:'postprod',subtitle:'translator',voice:'voice'};
const progressCards={};
let stepSubTasks={};
let stepsPaused=false; // true when in finetune mid-flow

/* ===== Finetune ===== */
let inFinetune=false, currentFtStep=null, pendingAdvance=null;
let unlockedTabs={erase:false,subtitle:false,voice:false};
let fineTunedSteps={erase:false,subtitle:false,voice:false}; // tracks which steps have been fine-tuned
let editingSub=null, editingVoice=null, activeErase='E1', editingErase=null;
let lastVisErase=null, lastSubId=null, lastVoiceId=null, lastBurntId=null;
let lightsOff=false, compareActive=false;
let needsVideoSync=false;
let ftPauseBubble=null;
let resultBubble=null; // reference to the final result bubble for updating // reference to the "正在精调" bubble

/* ===== Utils ===== */
function fmt(s){const m=Math.floor(s/60),sec=Math.floor(s%60);return String(m).padStart(2,'0')+':'+String(sec).padStart(2,'0')}
function esc(s){const d=document.createElement('div');d.textContent=s;return d.innerHTML}
function escA(s){return s.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;')}
function parseT(v){const p=v.trim().split(':');if(p.length===2){const m=parseInt(p[0]),s=parseInt(p[1]);if(!isNaN(m)&&!isNaN(s))return m*60+s}const n=parseFloat(v);return isNaN(n)?null:n}
function rnd(a){return a[Math.floor(Math.random()*a.length)]}

/* ===== Chat ===== */
function appendBubble(type,html,delay,role){
    const el=document.createElement('div');
    if(type==='ai'&&role&&ROLES[role]){
        const r=ROLES[role];const bh='<span class="rb-name">'+r.realName+'</span><span class="rb-role">'+r.name+'</span>';
        el.className='chat-bubble chat-bubble--ai '+r.cssClass;
        el.style.animationDelay=(delay||0)+'s';
        el.innerHTML='<div class="bubble-avatar"><img class="role-avatar-img" src="'+r.avatar+'" alt="'+r.realName+'"><span class="role-badge">'+bh+'</span></div><div class="bubble-body">'+html+'</div>';
    }else if(type==='user'){
        el.className='chat-bubble chat-bubble--user';el.innerHTML=html;
    }else{
        const r=ROLES.director;const bh='<span class="rb-name">'+r.realName+'</span><span class="rb-role">'+r.name+'</span>';
        el.className='chat-bubble chat-bubble--ai '+r.cssClass;
        el.innerHTML='<div class="bubble-avatar"><img class="role-avatar-img" src="'+r.avatar+'" alt="'+r.realName+'"><span class="role-badge">'+bh+'</span></div><div class="bubble-body">'+html+'</div>';
    }
    chatFlow.appendChild(el);return el;
}
function scrollChat(){chatFlow.scrollTo({top:chatFlow.scrollHeight,behavior:'smooth'})}

/* ===== Progress Card ===== */
function buildPC(step,status,tasks){
    const tMap={erase:'字幕和水印擦除',subtitle:'字幕翻译',voice:'配音'};
    const title=tMap[step]||step;
    const dc=status==='done'?'rpc-done':status==='active'?'rpc-active':'rpc-pending';
    let lb=status==='done'?'<span class="rpc-label rpc-label--done"></span>':status==='active'?'<span class="rpc-label rpc-label--active">处理中<span class="rpc-dots">...</span></span>':'<span class="rpc-label">排队中</span>';
    let th='';
    if(tasks&&tasks.length){th='<div class="rpc-tasks">';tasks.forEach(t=>{const ts=t.status||status;let ic='○',cl='rpc-task--pending';if(ts==='done'){ic='✓';cl='rpc-task--done'}else if(ts==='active'){ic='●';cl='rpc-task--active'}const dl=(ts==='done'&&t.doneLabel)?t.doneLabel:t.label;th+='<div class="rpc-task '+cl+'"><span class="rpc-task-icon">'+ic+'</span>'+dl+'</div>'});th+='</div>'}
    // Dynamic detail link based on finetune state
    let dl='';
    if(status==='done'){
        if(inFinetune&&currentFtStep===step){
            dl='<div class="rpc-detail-link rpc-ft-active"><svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M2 4H14M2 8H10M2 12H7" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg> 精调中...</div>';
        }else if(fineTunedSteps[step]){
            dl='<div class="rpc-detail-link" data-step="'+step+'"><svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M2 4H14M2 8H10M2 12H7" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg> 已精调 · 再次精调 →</div>';
        }else{
            dl='<div class="rpc-detail-link" data-step="'+step+'"><svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M2 4H14M2 8H10M2 12H7" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg> 去精调 →</div>';
        }
    }
    return '<div class="role-progress-card"><div class="rpc-header"><span class="rpc-status-dot '+dc+'"></span><span class="rpc-title"><strong>'+title+'</strong></span>'+lb+'</div>'+th+dl+'</div>';
}
function updatePC(step,status,tasks){
    const cb=progressCards[step];if(!cb)return;
    const body=cb.querySelector('.bubble-body');if(!body)return;
    body.innerHTML=buildPC(step,status,tasks||stepSubTasks[step]||[]);
    scrollChat();
    const dl=body.querySelector('.rpc-detail-link');
    if(dl)dl.addEventListener('click',()=>enterFinetune(step));
}

/* ===== SubTask Engine ===== */
function runSubTasks(step,done){
    const tasks=stepSubTasks[step];if(!tasks||!tasks.length){if(done)done();return}
    let idx=0;
    function handleErase(i,p){
        if(step!=='erase')return;
        if(p==='start'&&i===1){burntSub.classList.remove('erased','erasing');burntSub.innerHTML='<span class="bs-bar"><span class="bs-text">'+subtitleItems[0].orig+'</span></span>';burntSub.classList.add('visible');setTimeout(()=>burntSub.classList.add('erasing'),300)}
        if(p==='done'&&i===1){burntSub.classList.remove('visible','erasing');burntSub.classList.add('erased')}
    }
    function next(){
        if(idx>=tasks.length){updatePC(step,'done',tasks);if(done)done();return}
        const t=tasks[idx];t.status='active';
        updatePC(step,'active',tasks);
        if(t.phase){phaseDot.className='v8-pd proc';phaseLabel.textContent=t.phase;phaseEl.classList.add('vis')}
        handleErase(idx,'start');scrollChat();
        setTimeout(()=>{t.status='done';updatePC(step,'active',tasks);handleErase(idx,'done');scrollChat();idx++;setTimeout(next,800)},t.duration);
    }
    next();
}

/* ===== Build Chat ===== */
function buildConfigChat(){
    chatFlow.innerHTML='';Object.keys(progressCards).forEach(k=>delete progressCards[k]);
    const tgt='英语';const sc=eraseRegions.filter(r=>r.title.includes('字幕')).length;const wc=eraseRegions.filter(r=>r.title.includes('水印')).length;
    stepSubTasks={
        erase:[
            {label:'全帧预扫描…',doneLabel:'扫描完成',phase:'全帧预扫描…',status:'pending',duration:2500},
            {label:'字幕区域检测…',doneLabel:'检测到 '+sc+' 处字幕',phase:'字幕区域检测…',status:'pending',duration:3000},
            {label:'逐帧擦除中…',doneLabel:sc+' 处字幕擦除中…',phase:'逐帧擦除字幕…',status:'pending',duration:3500},
            {label:'字幕擦除收尾…',doneLabel:'已擦除 '+sc+' 处字幕',phase:'字幕擦除收尾…',status:'pending',duration:2500},
            {label:'水印区域检测…',doneLabel:'检测到 '+wc+' 处水印',phase:'水印区域检测…',status:'pending',duration:2000},
            {label:'擦除水印…',doneLabel:'已擦除 '+wc+' 处水印',phase:'擦除水印…',status:'pending',duration:2500}
        ],
        subtitle:[
            {label:'通篇听取原声…',doneLabel:'原声听取完成',phase:'通篇听取原声…',status:'pending',duration:3000},
            {label:'语音片段切分…',doneLabel:'识别 '+subtitleItems.length+' 条语音',phase:'语音片段切分…',status:'pending',duration:3000},
            {label:'逐句翻译 → '+tgt+'…',doneLabel:'翻译中…',phase:'逐句翻译 → '+tgt+'…',status:'pending',duration:3500},
            {label:'术语一致性校验…',doneLabel:'已翻译 '+subtitleItems.length+' 条',phase:'术语一致性校验…',status:'pending',duration:2500},
            {label:'字幕排版对齐…',doneLabel:'生成 '+subtitleItems.length+' 条新字幕',phase:'字幕排版对齐…',status:'pending',duration:2000}
        ],
        voice:[
            {label:'感受情绪基调～',doneLabel:'情绪分析完成',phase:'感受情绪基调～',status:'pending',duration:2500},
            {label:'情绪标记中～',doneLabel:'分析完成 '+voiceItems.length+' 段',phase:'情绪标记中～',status:'pending',duration:2500},
            {label:'音色克隆中～',doneLabel:'音色采样完成',phase:'音色克隆中～',status:'pending',duration:3000},
            {label:tgt+'配音录制中～',doneLabel:'录制中…',phase:tgt+'配音录制中～',status:'pending',duration:3500},
            {label:'最后几句录制中～',doneLabel:'已生成 '+voiceItems.length+' 段配音',phase:tgt+'配音收尾～',status:'pending',duration:2500}
        ]
    };
    if(workflowMode==='full')activeSteps=['erase','subtitle','voice'];
    else activeSteps=[workflowMode];

    const jm=document.createElement('div');jm.className='chat-join-msg';
    jm.innerHTML='<span class="join-avatars"><img src="assets/characters/linyuchen-director.png"><img src="assets/characters/chenmo-postprod.png"><img src="assets/characters/limingyuan-translator.png"><img src="assets/characters/suya-voice.png"></span> 林雨晨、陈默、李明远、苏雅 加入了工作坊';
    chatFlow.appendChild(jm);

    setTimeout(()=>{appendBubble('user',promptText||'帮我擦除字幕水印，翻译成英语，再配音',0);scrollChat()},800);
    setTimeout(()=>{appendBubble('ai',rnd(ROLES.director.greetings),0,'director');scrollChat()},2000);

    let cd=3200;
    activeSteps.forEach(step=>{
        const rk=stepRoleMap[step];
        setTimeout(()=>{const b=appendBubble('ai',rnd(ROLES[rk].checkIn||['']),0,rk);progressCards[step]=b;scrollChat()},cd);
        cd+=1000;
    });
    setTimeout(()=>advanceStep(),cd+600);
}

/* ===== Step Advance ===== */
function advanceStep(){
    if(stepsPaused||inFinetune)return; // don't advance while in finetune
    currentStep++;
    if(currentStep>=activeSteps.length){setTimeout(showStartBtn,800);return}
    const step=activeSteps[currentStep];
    setTimeout(()=>{
        updatePC(step,'active',stepSubTasks[step]);
        setTimeout(()=>{
            runSubTasks(step,()=>{
                if(step==='subtitle')scriptReady=true;
                setTimeout(()=>confirmStep(step),800);
            });
        },1500);
    },currentStep>0?2000:400);
}

function confirmStep(step){
    features[step]=true;if(step==='subtitle')scriptReady=true;
    showFlash(step);unlockTab(step);
    pendingAdvance=step;
    setTimeout(()=>{if(!inFinetune&&!stepsPaused){advanceStep();pendingAdvance=null}},1200);
}

function showFlash(step){
    const fl=document.getElementById('stepFlash'),tx=document.getElementById('flashText'),dt=document.getElementById('flashDot');
    const lm={erase:'画面擦除完成',subtitle:'字幕翻译完成',voice:'配音生成完成'};
    const cm={erase:'#7c3aed',subtitle:'#2563eb',voice:'#ec4899'};
    tx.textContent=lm[step]||'完成';dt.style.background=cm[step]||'#818cf8';
    fl.classList.remove('active');void fl.offsetWidth;fl.classList.add('active');
    setTimeout(()=>fl.classList.remove('active'),1500);
}

function showStartBtn(){
    if(inFinetune){stepsPaused=true;return} // wait until finetune exits
    startProcessing();
}

/* ===== Processing ===== */
function startProcessing(){
    phase='processing';phaseDot.className='v8-pd proc';phaseLabel.textContent='最终渲染中…';phaseEl.classList.add('vis');
    const steps=[];
    const rl={erase:'擦除字幕',subtitle:'翻译字幕',voice:'生成配音',merge:'合成视频'};
    const re={erase:'🧹',subtitle:'🌍',voice:'🎙️',merge:'🎬'};
    if(features.erase)steps.push({key:'erase'});if(features.subtitle)steps.push({key:'subtitle'});if(features.voice)steps.push({key:'voice'});steps.push({key:'merge'});
    let i=0;
    const pb=appendBubble('ai','<div style="display:flex;align-items:center;gap:10px"><div class="inline-progress-bar" style="flex:1"><div class="inline-progress-fill ipf" style="width:0%"></div></div><span class="ipt" style="font-size:.7rem;color:var(--glass-text3);white-space:nowrap">0%</span></div><div class="ips" style="margin-top:6px;font-size:.72rem;color:var(--glass-text2)">🚀 开始最终渲染...</div>',0,'director');
    const fill=pb.querySelector('.ipf'),pt=pb.querySelector('.ipt'),ps=pb.querySelector('.ips');scrollChat();
    function next(){
        if(i>=steps.length){fill.style.width='100%';fill.style.background='linear-gradient(90deg,#475569,#1e293b)';pt.textContent='100%';ps.innerHTML='<span style="color:var(--glass-text)">✅ 渲染完成</span>';setTimeout(showResult,800);return}
        const s=steps[i];const pct=Math.round(((i+1)/steps.length)*100);
        fill.style.width=pct+'%';pt.textContent=pct+'%';ps.textContent=re[s.key]+' 正在'+rl[s.key]+'...';scrollChat();
        i++;setTimeout(next,1200+Math.random()*800);
    }
    next();
}

/* ===== Result ===== */
function showResult(){
    phase='done';phaseDot.className='v8-pd done';phaseLabel.textContent='译制完成 · 可预览或导出';
    playing=true;updatePlayIcons();

    const feats=[];if(features.erase)feats.push('画面擦除');if(features.subtitle)feats.push('字幕翻译');if(features.voice)feats.push('AI 配音');
    const ft=feats.join('、');
    const lines=['各环节都对齐了。'+ft+'全部到位。<br>可以导出了，也可以再精调。','嗯，该做的都做了。'+ft+'到位。<br>导出、保存或再调，你说了算。','不错，'+ft+'都处理完毕。<br>这版我认可。'];
    const rh=rnd(lines)+'<div class="chat-result-actions"><div class="chat-result-actions-row"><button class="ra-btn-export" onclick="alert(\'导出中...\')"><svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 2V9M8 9L11 6M8 9L5 6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 11V13C3 13.55 3.45 14 4 14H12C12.55 14 13 13.55 13 13V11" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>导出视频</button></div><div class="chat-result-actions-row"><button class="ra-btn-re" id="chatRefBtn">去精调</button><a href="result.html" class="ra-btn-ft">任务记录</a></div></div>';
    resultBubble=appendBubble('ai',rh,0,'director');scrollChat();
    setTimeout(()=>{const rb=document.getElementById('chatRefBtn');if(rb){const fs=activeSteps.find(s=>features[s]);if(fs)rb.addEventListener('click',()=>{turnLightsOn();enterFinetune(fs)})}},100);
    // Only turn lights off if NOT in finetune
    if(!inFinetune) scheduleLightsOff(2000);
}

/* ===== Lights ===== */
let _lightsOffTimer=null;
function turnLightsOff(){
    if(lightsOff||inFinetune||chatCollapsed)return;
    lightsOff=true;
    page.classList.add('lights-off');
    document.getElementById('dimmer').classList.add('active');
    const vid=document.getElementById('v8Vid');
    vid.style.zIndex='52';
}
function turnLightsOn(){
    if(!lightsOff)return;lightsOff=false;
    // Cancel any pending lights-off
    if(_lightsOffTimer){clearTimeout(_lightsOffTimer);_lightsOffTimer=null}
    page.classList.remove('lights-off');
    document.getElementById('dimmer').classList.remove('active');
    document.getElementById('v8Vid').style.zIndex='';
    if(compareActive)exitCompare();
}
function scheduleLightsOff(delay){
    if(_lightsOffTimer)clearTimeout(_lightsOffTimer);
    _lightsOffTimer=setTimeout(()=>{_lightsOffTimer=null;turnLightsOff()},delay||1500);
}

document.getElementById('dimBg').addEventListener('click',turnLightsOn);
document.getElementById('dimLightBtn').addEventListener('click',turnLightsOn);
document.getElementById('dimRefBtn').addEventListener('click',()=>{turnLightsOn();const fs=activeSteps.find(s=>features[s]);if(fs)enterFinetune(fs)});

/* ===== Compare ===== */
const cmpEl=document.getElementById('cmpOrig');
const cmpVid=document.getElementById('cmpVideo');
document.getElementById('dimCmpBtn').addEventListener('click',()=>{if(compareActive)exitCompare();else enterCompare()});

function enterCompare(){
    if(compareActive)return;compareActive=true;
    page.classList.add('compare-mode');
    cmpVid.currentTime=videoEl.currentTime;if(playing)cmpVid.play().catch(()=>{});
    cmpEl.classList.add('active');
    document.getElementById('cmpResLabel').style.display='';
}
function exitCompare(){
    if(!compareActive)return;compareActive=false;
    page.classList.remove('compare-mode');
    cmpEl.classList.remove('active');cmpVid.pause();
    document.getElementById('cmpResLabel').style.display='none';
}

/* ===== Finetune ===== */
const titleMap={erase:'擦除精调',subtitle:'字幕精调',voice:'配音精调'};
const descMap={erase:'调整擦除区域和参数',subtitle:'编辑字幕内容和样式',voice:'调整配音音色和语速'};

function enterFinetune(step){
    turnLightsOn();if(_lightsOffTimer){clearTimeout(_lightsOffTimer);_lightsOffTimer=null}
    inFinetune=true;currentFtStep=step;stepsPaused=true;
    page.classList.add('ft-mode');
    // Move video into ft video card
    const ftVC=document.getElementById('ftVideoCard');
    const vid=document.getElementById('v8Vid');
    vid.style.zIndex='';
    ftVC.appendChild(vid);
    // Pause chat — add a "正在精调" message
    ftPauseBubble=appendBubble('ai','🔧 <strong>精调进行中</strong> — 对话已暂停，完成精调后继续',0,'director');
    scrollChat();
    // Tabs
    setActiveTab(step);
    document.getElementById('ftTitle').textContent=titleMap[step]||'精调';
    document.getElementById('ftDesc').textContent=descMap[step]||'';
    // Panels
    document.querySelectorAll('.v8-fp').forEach(p=>p.classList.remove('active'));
    const panel=document.querySelector('.v8-fp[data-fp="'+step+'"]');if(panel)panel.classList.add('active');
    // Render lists
    if(step==='erase'){editingErase=null;renderEraseList()}
    else if(step==='subtitle'){editingSub=null;renderSubList()}
    else if(step==='voice'){editingVoice=null;renderVoiceList()}
    // Timeline: only show current step's track(s) with lane assignment
    rebuildFtTimeline(step);
    // Overlays
    renderEraseOverlays();updateSubPreview();updateVoicePreview();
    // Phase
    phaseDot.className='v8-pd';phaseLabel.textContent='精调模式';phaseEl.classList.add('vis');
    // Scrubber
    document.getElementById('scrub').classList.add('vis');
    // Update progress card to show "精调中..."
    updatePC(step,'done',stepSubTasks[step]);
}

function exitFinetune(){
    const wasStep=currentFtStep;inFinetune=false;currentFtStep=null;
    page.classList.remove('ft-mode');clearActiveTab();
    // Move video back
    const vid=document.getElementById('v8Vid');
    document.getElementById('v8SyncInner').appendChild(vid);
    vid.style.zIndex='';
    // Clear timeline
    clearFtTimeline();
    eraseOC.innerHTML='';eraseOC.classList.remove('int');
    subPreview.classList.remove('visible');voicePreview.classList.remove('visible');
    // Remove pause bubble
    if(ftPauseBubble&&ftPauseBubble.parentNode){ftPauseBubble.parentNode.removeChild(ftPauseBubble);ftPauseBubble=null}
    phaseLabel.textContent='请在对话中继续';
    // Mark step as fine-tuned + update card
    if(wasStep){fineTunedSteps[wasStep]=true;if(progressCards[wasStep])updatePC(wasStep,'done',stepSubTasks[wasStep])}
    // Resume steps if pending
    if(phase==='done'){
        // Update existing result bubble in-place
        if(resultBubble){
            const body=resultBubble.querySelector('.bubble-body');
            if(body){
                const ftLabel=titleMap[wasStep]||'精调';
                const feats=[];if(features.erase)feats.push('画面擦除');if(features.subtitle)feats.push('字幕翻译');if(features.voice)feats.push('AI 配音');
                const ft=feats.join('、');
                body.innerHTML=ftLabel+'已更新。'+ft+'全部到位。<div class="chat-result-actions"><div class="chat-result-actions-row"><button class="ra-btn-export" onclick="alert(\'导出中...\')"><svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 2V9M8 9L11 6M8 9L5 6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 11V13C3 13.55 3.45 14 4 14H12C12.55 14 13 13.55 13 13V11" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>导出视频</button></div><div class="chat-result-actions-row"><button class="ra-btn-re" id="chatRefBtn">再次精调</button><a href="result.html" class="ra-btn-ft">任务记录</a></div></div>';
                scrollChat();
                setTimeout(()=>{const rb=document.getElementById('chatRefBtn');if(rb){const fs=activeSteps.find(s=>features[s]);if(fs)rb.addEventListener('click',()=>{turnLightsOn();enterFinetune(fs)})}},100);
            }
        }
        scheduleLightsOff(1500);
    }else{
        // Mid-flow — resume advancing
        stepsPaused=false;
        if(pendingAdvance===wasStep){pendingAdvance=null;setTimeout(advanceStep,600)}
        else{setTimeout(advanceStep,600)}
    }
}

document.querySelectorAll('.v8-done-fp').forEach(btn=>{btn.addEventListener('click',()=>{if(inFinetune)exitFinetune()})});
document.getElementById('ftCancel').addEventListener('click',()=>{if(inFinetune)exitFinetune()});

/* ===== Tabs ===== */
function unlockTab(step){unlockedTabs[step]=true;const t=document.getElementById('tab'+step.charAt(0).toUpperCase()+step.slice(1));if(t){t.classList.remove('locked');t.classList.add('unlocked')}}
function setActiveTab(step){document.querySelectorAll('.v8-tab').forEach(t=>{t.classList.remove('active');if(unlockedTabs[t.dataset.tab])t.classList.add('unlocked')});const t=document.getElementById('tab'+step.charAt(0).toUpperCase()+step.slice(1));if(t){t.classList.remove('unlocked');t.classList.add('active')}}
function clearActiveTab(){document.querySelectorAll('.v8-tab').forEach(t=>{t.classList.remove('active');if(unlockedTabs[t.dataset.tab])t.classList.add('unlocked')})}

document.querySelectorAll('.v8-tab').forEach(tab=>{
    tab.addEventListener('click',()=>{
        const k=tab.dataset.tab;if(!unlockedTabs[k])return;
        if(inFinetune&&currentFtStep===k)return;
        if(inFinetune){
            currentFtStep=k;
            document.querySelectorAll('.v8-fp').forEach(p=>p.classList.remove('active'));
            const panel=document.querySelector('.v8-fp[data-fp="'+k+'"]');if(panel)panel.classList.add('active');
            setActiveTab(k);
            document.getElementById('ftTitle').textContent=titleMap[k]||'精调';
            document.getElementById('ftDesc').textContent=descMap[k]||'';
            rebuildFtTimeline(k);
            renderEraseOverlays();updateSubPreview();updateVoicePreview();
        }else{enterFinetune(k)}
    });
});

/* ===== Render Lists ===== */
let editSnapshot=null; // snapshot of item before editing for cancel

function renderEraseList(){
    const el=document.getElementById('eList');document.getElementById('eCount').textContent=eraseRegions.length;
    el.innerHTML=eraseRegions.map(r=>{
        const isEd=r.id===editingErase;
        return '<div class="frc'+(r.id===activeErase?' active':'')+'" data-r="'+r.id+'">'+
            '<span class="fri">'+r.id+'</span>'+
            '<div class="frf"><span class="frt">'+esc(r.title)+'</span><span class="frm">'+r.w+'×'+r.h+'% · '+fmt(r.startSec)+'–'+fmt(r.endSec)+'</span></div>'+
            '<button class="fre'+(isEd?' editing':'')+'" data-e="'+r.id+'" title="编辑"><svg width="10" height="10" viewBox="0 0 16 16" fill="none"><path d="M11.5 1.5L14.5 4.5L5 14H2V11L11.5 1.5Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg></button>'+
            '<button class="frd" data-d="'+r.id+'" title="删除"><svg width="10" height="10" viewBox="0 0 14 14" fill="none"><path d="M3 3L11 11M11 3L3 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></button>'+
        '</div>'+
        '<div class="fie'+(isEd?' expanded':'')+'" data-ee="'+r.id+'">'+
            '<div class="fier"><span class="fiel">标题</span><input class="fiei" value="'+escA(r.title)+'" data-f="title" data-id="'+r.id+'"></div>'+
            '<div class="fier"><span class="fiel">时间</span><div class="fie-time"><input class="fie-s" value="'+fmt(r.startSec)+'" data-f="startSec" data-id="'+r.id+'"><span class="fie-sep">—</span><input class="fie-e" value="'+fmt(r.endSec)+'" data-f="endSec" data-id="'+r.id+'"></div></div>'+
            '<div class="fier"><span class="fiel">位置</span><div class="fie-grid">'+
                '<div class="fie-field"><label>X%</label><input value="'+r.x+'" data-f="x" data-id="'+r.id+'"></div>'+
                '<div class="fie-field"><label>Y%</label><input value="'+r.y+'" data-f="y" data-id="'+r.id+'"></div>'+
                '<div class="fie-field"><label>宽%</label><input value="'+r.w+'" data-f="w" data-id="'+r.id+'"></div>'+
                '<div class="fie-field"><label>高%</label><input value="'+r.h+'" data-f="h" data-id="'+r.id+'"></div>'+
            '</div></div>'+
            '<div class="fie-actions"><button class="fie-cancel" data-id="'+r.id+'">取消</button><button class="fie-save" data-id="'+r.id+'">保存</button></div>'+
        '</div>';
    }).join('');
    bindEraseEvents();
    // Scroll to editing item
    if(editingErase){const card=el.querySelector('.frc[data-r="'+editingErase+'"]');if(card)card.scrollIntoView({block:'nearest',behavior:'smooth'})}
}
function bindEraseEvents(){
    const el=document.getElementById('eList');
    el.querySelectorAll('.frc').forEach(card=>{card.addEventListener('click',e=>{
        if(e.target.closest('.frd')||e.target.closest('.fre'))return;
        const id=card.dataset.r;activeErase=id;
        el.querySelectorAll('.frc').forEach(c=>c.classList.remove('active'));card.classList.add('active');
        const r=eraseRegions.find(x=>x.id===id);if(r){videoTime=r.startSec;needsVideoSync=true}
        if(inFinetune)selectSeg(id,currentFtStep);
    })});
    el.querySelectorAll('.fre').forEach(btn=>{btn.addEventListener('click',e=>{
        e.stopPropagation();const id=btn.dataset.e;
        if(editingErase===id){editingErase=null;editSnapshot=null;renderEraseList();return}
        // Snapshot for cancel
        const r=eraseRegions.find(x=>x.id===id);
        if(r)editSnapshot=JSON.parse(JSON.stringify(r));
        editingErase=id;renderEraseList();
    })});
    el.querySelectorAll('.frd').forEach(btn=>{btn.addEventListener('click',e=>{e.stopPropagation();deleteErase(btn.dataset.d)})});
    // Live field updates (not committed until save)
    el.querySelectorAll('.fie input').forEach(inp=>{inp.addEventListener('click',e=>e.stopPropagation())});
    // Save buttons
    el.querySelectorAll('.fie-save').forEach(btn=>{btn.addEventListener('click',e=>{
        e.stopPropagation();const id=btn.dataset.id;
        // Read all inputs and commit
        const panel=el.querySelector('.fie[data-ee="'+id+'"]');if(!panel)return;
        const r=eraseRegions.find(x=>x.id===id);if(!r)return;
        panel.querySelectorAll('input[data-f]').forEach(inp=>{
            const f=inp.dataset.f;
            if(f==='startSec'||f==='endSec'){const v=parseT(inp.value);if(v!==null)r[f]=v}
            else if(['x','y','w','h'].includes(f)){const v=parseFloat(inp.value);if(!isNaN(v))r[f]=v}
            else{r[f]=inp.value}
        });
        editingErase=null;editSnapshot=null;
        renderEraseList();renderEraseOverlays();if(inFinetune)rebuildFtTimeline(currentFtStep);
    })});
    // Cancel buttons
    el.querySelectorAll('.fie-cancel').forEach(btn=>{btn.addEventListener('click',e=>{
        e.stopPropagation();const id=btn.dataset.id;
        // Restore snapshot
        if(editSnapshot&&editSnapshot.id===id){
            const r=eraseRegions.find(x=>x.id===id);
            if(r)Object.assign(r,editSnapshot);
        }
        editingErase=null;editSnapshot=null;
        renderEraseList();renderEraseOverlays();if(inFinetune)rebuildFtTimeline(currentFtStep);
    })});
}
function deleteErase(id){if(eraseRegions.length<=1)return;const i=eraseRegions.findIndex(r=>r.id===id);if(i===-1)return;eraseRegions.splice(i,1);if(activeErase===id)activeErase=eraseRegions[Math.min(i,eraseRegions.length-1)].id;if(editingErase===id){editingErase=null;editSnapshot=null}renderEraseList();renderEraseOverlays();if(inFinetune)rebuildFtTimeline(currentFtStep)}
document.getElementById('eAddBtn').addEventListener('click',()=>{
    eraseRegionCounter++;const nid='E'+eraseRegionCounter;const t=Math.round(videoTime);
    const r={id:nid,title:'新擦除区域',x:20,y:40,w:60,h:15,startSec:t,endSec:Math.min(t+3,videoDuration)};
    eraseRegions.push(r);activeErase=nid;
    editSnapshot=JSON.parse(JSON.stringify(r));editingErase=nid;
    renderEraseList();renderEraseOverlays();if(inFinetune)rebuildFtTimeline(currentFtStep);
    videoTime=t;needsVideoSync=true;
});

let subCounter=7;
function renderSubList(){
    const el=document.getElementById('sList');
    el.innerHTML=subtitleItems.map(s=>{
        const isEd=s.id===editingSub;
        return '<div class="fsi'+(isEd?' active':'')+'" data-s="'+s.id+'">'+
            '<span class="fsi-t">'+fmt(s.startSec)+'</span>'+
            '<div class="fsi-tx"><span class="fsi-o">'+esc(s.orig)+'</span><span class="fsi-tr">'+esc(s.trans)+'</span></div>'+
            '<button class="fsi-eb" data-s="'+s.id+'" title="编辑"><svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M10 2L12 4L5 11H3V9L10 2Z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg></button>'+
            '<button class="fsi-del" data-s="'+s.id+'" title="删除"><svg width="10" height="10" viewBox="0 0 14 14" fill="none"><path d="M3 3L11 11M11 3L3 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></button>'+
        '</div>'+
        '<div class="fie'+(isEd?' expanded':'')+'" data-es="'+s.id+'">'+
            '<div class="fier"><span class="fiel">时间</span><div class="fie-time"><input class="fie-s" value="'+fmt(s.startSec)+'" data-f="startSec" data-id="'+s.id+'"><span class="fie-sep">—</span><input class="fie-e" value="'+fmt(s.endSec)+'" data-f="endSec" data-id="'+s.id+'"></div></div>'+
            '<div class="fier"><span class="fiel">原文</span><input class="fiei" value="'+escA(s.orig)+'" data-f="orig" data-id="'+s.id+'"></div>'+
            '<div class="fier"><span class="fiel">译文</span><input class="fiei" value="'+escA(s.trans)+'" data-f="trans" data-id="'+s.id+'"></div>'+
            '<div class="fie-actions"><button class="fie-cancel" data-id="'+s.id+'" data-type="sub">取消</button><button class="fie-save" data-id="'+s.id+'" data-type="sub">保存</button></div>'+
        '</div>';
    }).join('');
    bindSubEvents();
    if(editingSub){const item=el.querySelector('.fsi[data-s="'+editingSub+'"]');if(item)item.scrollIntoView({block:'nearest',behavior:'smooth'})}
}
function bindSubEvents(){
    const el=document.getElementById('sList');
    el.querySelectorAll('.fsi').forEach(item=>{item.addEventListener('click',e=>{
        if(e.target.closest('.fsi-del')){deleteSub(item.dataset.s);return}
        if(e.target.closest('.fsi-eb')){
            const id=item.dataset.s;
            if(editingSub===id){editingSub=null;editSnapshot=null;renderSubList();return}
            const s=subtitleItems.find(x=>x.id===id);if(s)editSnapshot=JSON.parse(JSON.stringify(s));
            editingSub=id;renderSubList();return;
        }
        const s=subtitleItems.find(x=>x.id===item.dataset.s);
        if(s){videoTime=s.startSec;needsVideoSync=true;el.querySelectorAll('.fsi').forEach(i=>i.classList.remove('active'));item.classList.add('active')}
        if(inFinetune)selectSeg(item.dataset.s,currentFtStep);
    })});
    el.querySelectorAll('.fie input').forEach(inp=>{inp.addEventListener('click',e=>e.stopPropagation())});
    el.querySelectorAll('.fie-save[data-type="sub"]').forEach(btn=>{btn.addEventListener('click',e=>{
        e.stopPropagation();const id=btn.dataset.id;
        const panel=el.querySelector('.fie[data-es="'+id+'"]');if(!panel)return;
        const s=subtitleItems.find(x=>x.id===id);if(!s)return;
        panel.querySelectorAll('input[data-f]').forEach(inp=>{
            const f=inp.dataset.f;
            if(f==='startSec'||f==='endSec'){const v=parseT(inp.value);if(v!==null)s[f]=v}
            else{s[f]=inp.value}
        });
        editingSub=null;editSnapshot=null;renderSubList();if(inFinetune)rebuildFtTimeline(currentFtStep);
    })});
    el.querySelectorAll('.fie-cancel[data-type="sub"]').forEach(btn=>{btn.addEventListener('click',e=>{
        e.stopPropagation();const id=btn.dataset.id;
        if(editSnapshot&&editSnapshot.id===id){const s=subtitleItems.find(x=>x.id===id);if(s)Object.assign(s,editSnapshot)}
        editingSub=null;editSnapshot=null;renderSubList();if(inFinetune)rebuildFtTimeline(currentFtStep);
    })});
}
function deleteSub(id){if(subtitleItems.length<=1)return;const i=subtitleItems.findIndex(s=>s.id===id);if(i===-1)return;subtitleItems.splice(i,1);if(editingSub===id){editingSub=null;editSnapshot=null}renderSubList();if(inFinetune)rebuildFtTimeline(currentFtStep)}
document.getElementById('sAddBtn').addEventListener('click',()=>{
    subCounter++;const nid='S'+subCounter;const t=Math.round(videoTime);
    const s={id:nid,orig:'新原文',trans:'New translation',startSec:t,endSec:Math.min(t+3,videoDuration)};
    subtitleItems.push(s);editSnapshot=JSON.parse(JSON.stringify(s));editingSub=nid;
    renderSubList();if(inFinetune)rebuildFtTimeline(currentFtStep);
    videoTime=t;needsVideoSync=true;
});

let voiceCounter=7;
function renderVoiceList(){
    const el=document.getElementById('vList');
    el.innerHTML=voiceItems.map(v=>{
        const isEd=v.id===editingVoice;
        return '<div class="fvi'+(isEd?' active':'')+'" data-v="'+v.id+'">'+
            '<span class="fvi-t">'+fmt(v.startSec)+'</span>'+
            '<span class="fvi-tx">'+esc(v.text)+'</span>'+
            '<button class="fvi-p"><svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M3 1.5L10 6L3 10.5V1.5Z" fill="currentColor"/></svg></button>'+
            '<button class="fsi-eb" data-v="'+v.id+'" title="编辑"><svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M10 2L12 4L5 11H3V9L10 2Z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg></button>'+
            '<button class="fvi-del" data-v="'+v.id+'" title="删除"><svg width="10" height="10" viewBox="0 0 14 14" fill="none"><path d="M3 3L11 11M11 3L3 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></button>'+
        '</div>'+
        '<div class="fie'+(isEd?' expanded':'')+'" data-ev="'+v.id+'">'+
            '<div class="fier"><span class="fiel">时间</span><div class="fie-time"><input class="fie-s" value="'+fmt(v.startSec)+'" data-f="startSec" data-id="'+v.id+'"><span class="fie-sep">—</span><input class="fie-e" value="'+fmt(v.endSec)+'" data-f="endSec" data-id="'+v.id+'"></div></div>'+
            '<div class="fier"><span class="fiel">文本</span><input class="fiei" value="'+escA(v.text)+'" data-f="text" data-id="'+v.id+'"></div>'+
            '<div class="fie-actions"><button class="fie-cancel" data-id="'+v.id+'" data-type="voice">取消</button><button class="fie-save" data-id="'+v.id+'" data-type="voice">保存</button></div>'+
        '</div>';
    }).join('');
    bindVoiceEvents();
    if(editingVoice){const item=el.querySelector('.fvi[data-v="'+editingVoice+'"]');if(item)item.scrollIntoView({block:'nearest',behavior:'smooth'})}
}
function bindVoiceEvents(){
    const el=document.getElementById('vList');
    el.querySelectorAll('.fvi').forEach(item=>{item.addEventListener('click',e=>{
        if(e.target.closest('.fvi-del')){deleteVoice(item.dataset.v);return}
        if(e.target.closest('.fsi-eb')){
            const id=item.dataset.v;
            if(editingVoice===id){editingVoice=null;editSnapshot=null;renderVoiceList();return}
            const v=voiceItems.find(x=>x.id===id);if(v)editSnapshot=JSON.parse(JSON.stringify(v));
            editingVoice=id;renderVoiceList();return;
        }
        if(e.target.closest('.fvi-p'))return;
        const v=voiceItems.find(x=>x.id===item.dataset.v);
        if(v){videoTime=v.startSec;needsVideoSync=true;el.querySelectorAll('.fvi').forEach(i=>i.classList.remove('active'));item.classList.add('active')}
        if(inFinetune)selectSeg(item.dataset.v,currentFtStep);
    })});
    el.querySelectorAll('.fie input').forEach(inp=>{inp.addEventListener('click',e=>e.stopPropagation())});
    el.querySelectorAll('.fie-save[data-type="voice"]').forEach(btn=>{btn.addEventListener('click',e=>{
        e.stopPropagation();const id=btn.dataset.id;
        const panel=el.querySelector('.fie[data-ev="'+id+'"]');if(!panel)return;
        const v=voiceItems.find(x=>x.id===id);if(!v)return;
        panel.querySelectorAll('input[data-f]').forEach(inp=>{
            const f=inp.dataset.f;
            if(f==='startSec'||f==='endSec'){const val=parseT(inp.value);if(val!==null)v[f]=val}
            else{v[f]=inp.value}
        });
        editingVoice=null;editSnapshot=null;renderVoiceList();if(inFinetune)rebuildFtTimeline(currentFtStep);
    })});
    el.querySelectorAll('.fie-cancel[data-type="voice"]').forEach(btn=>{btn.addEventListener('click',e=>{
        e.stopPropagation();const id=btn.dataset.id;
        if(editSnapshot&&editSnapshot.id===id){const v=voiceItems.find(x=>x.id===id);if(v)Object.assign(v,editSnapshot)}
        editingVoice=null;editSnapshot=null;renderVoiceList();if(inFinetune)rebuildFtTimeline(currentFtStep);
    })});
}
function deleteVoice(id){if(voiceItems.length<=1)return;const i=voiceItems.findIndex(v=>v.id===id);if(i===-1)return;voiceItems.splice(i,1);if(editingVoice===id){editingVoice=null;editSnapshot=null}renderVoiceList();if(inFinetune)rebuildFtTimeline(currentFtStep)}
document.getElementById('vAddBtn').addEventListener('click',()=>{
    voiceCounter++;const nid='V'+voiceCounter;const t=Math.round(videoTime);
    const v={id:nid,text:'New voiceover text',startSec:t,endSec:Math.min(t+3,videoDuration)};
    voiceItems.push(v);editSnapshot=JSON.parse(JSON.stringify(v));editingVoice=nid;
    renderVoiceList();if(inFinetune)rebuildFtTimeline(currentFtStep);
    videoTime=t;needsVideoSync=true;
});

/* ===== Overlays ===== */
function renderEraseOverlays(){
    if(!inFinetune||currentFtStep!=='erase'){eraseOC.innerHTML='';eraseOC.classList.remove('int');return}
    eraseOC.classList.add('int');
    eraseOC.innerHTML=eraseRegions.map(r=>'<div class="erb'+(r.id===activeErase?' active':'')+'" data-rid="'+r.id+'" style="left:'+r.x+'%;top:'+r.y+'%;width:'+r.w+'%;height:'+r.h+'%;display:none"><span class="er-l">'+r.id+'</span><span class="erh erh-nw" data-dir="nw"></span><span class="erh erh-n" data-dir="n"></span><span class="erh erh-ne" data-dir="ne"></span><span class="erh erh-w" data-dir="w"></span><span class="erh erh-e" data-dir="e"></span><span class="erh erh-sw" data-dir="sw"></span><span class="erh erh-s" data-dir="s"></span><span class="erh erh-se" data-dir="se"></span></div>').join('');
    bindOverlayDrag();updateEraseVis();
}
function updateEraseVis(){
    if(!inFinetune||currentFtStep!=='erase')return;
    const t=videoTime;
    eraseRegions.forEach(r=>{const box=eraseOC.querySelector('.erb[data-rid="'+r.id+'"]');if(box)box.style.display=(t>=r.startSec&&t<=r.endSec)?'':'none'});
}
function bindOverlayDrag(){
    eraseOC.querySelectorAll('.erb').forEach(box=>{
        const rid=box.dataset.rid;
        box.addEventListener('mousedown',e=>{
            if(e.target.classList.contains('erh'))return;e.preventDefault();
            activeErase=rid;eraseOC.querySelectorAll('.erb').forEach(b=>b.classList.toggle('active',b.dataset.rid===rid));
            const cr=eraseOC.getBoundingClientRect();const sx=e.clientX,sy=e.clientY;
            const ol=parseFloat(box.style.left),ot=parseFloat(box.style.top);
            const bw=parseFloat(box.style.width),bh=parseFloat(box.style.height);
            function mv(ev){const dx=(ev.clientX-sx)/cr.width*100,dy=(ev.clientY-sy)/cr.height*100;let nx=Math.round(Math.max(0,Math.min(100-bw,ol+dx))),ny=Math.round(Math.max(0,Math.min(100-bh,ot+dy)));box.style.left=nx+'%';box.style.top=ny+'%';const r=eraseRegions.find(x=>x.id===rid);if(r){r.x=nx;r.y=ny}}
            function up(){document.removeEventListener('mousemove',mv);document.removeEventListener('mouseup',up);renderEraseList();rebuildFtTimeline(currentFtStep)}
            document.addEventListener('mousemove',mv);document.addEventListener('mouseup',up);
        });
        box.querySelectorAll('.erh').forEach(h=>{
            h.addEventListener('mousedown',e=>{
                e.stopPropagation();e.preventDefault();
                const dir=h.dataset.dir;const cr=eraseOC.getBoundingClientRect();
                const sx=e.clientX,sy=e.clientY;
                let ol=parseFloat(box.style.left),ot=parseFloat(box.style.top),ow=parseFloat(box.style.width),oh=parseFloat(box.style.height);
                function mv(ev){
                    const dx=(ev.clientX-sx)/cr.width*100,dy=(ev.clientY-sy)/cr.height*100;
                    let nl=ol,nt=ot,nw=ow,nh=oh;
                    if(dir.includes('w')){nl=ol+dx;nw=ow-dx}if(dir.includes('e'))nw=ow+dx;
                    if(dir.includes('n')){nt=ot+dy;nh=oh-dy}if(dir.includes('s'))nh=oh+dy;
                    if(nw<3){nw=3;if(dir.includes('w'))nl=ol+ow-3}if(nh<3){nh=3;if(dir.includes('n'))nt=ot+oh-3}
                    nl=Math.max(0,nl);nt=Math.max(0,nt);if(nl+nw>100)nw=100-nl;if(nt+nh>100)nh=100-nt;
                    nl=Math.round(nl);nt=Math.round(nt);nw=Math.round(nw);nh=Math.round(nh);
                    box.style.left=nl+'%';box.style.top=nt+'%';box.style.width=nw+'%';box.style.height=nh+'%';
                    const r=eraseRegions.find(x=>x.id===rid);if(r){r.x=nl;r.y=nt;r.w=nw;r.h=nh}
                }
                function up(){document.removeEventListener('mousemove',mv);document.removeEventListener('mouseup',up);renderEraseList();rebuildFtTimeline(currentFtStep)}
                document.addEventListener('mousemove',mv);document.addEventListener('mouseup',up);
            });
        });
    });
}

function updateSubPreview(){
    if(!inFinetune||currentFtStep!=='subtitle'){subPreview.classList.remove('visible');lastSubId=null;return}
    const t=videoTime;const cur=subtitleItems.find(s=>t>=s.startSec&&t<=s.endSec);
    if(cur){if(cur.id!==lastSubId){lastSubId=cur.id;subOrigEl.textContent=cur.orig;subTransEl.textContent=cur.trans}subPreview.classList.add('visible')}
    else{subPreview.classList.remove('visible');lastSubId=null}
}
function updateVoicePreview(){
    if(!inFinetune||currentFtStep!=='voice'){voicePreview.classList.remove('visible');lastVoiceId=null;return}
    const t=videoTime;const cur=voiceItems.find(v=>t>=v.startSec&&t<=v.endSec);
    if(cur){voicePreview.classList.add('visible');lastVoiceId=cur.id}
    else{voicePreview.classList.remove('visible');lastVoiceId=null}
}

/* ===== Timeline with Lane Assignment ===== */
function assignLanes(items){
    if(!items.length)return[[]];
    const sorted=[...items].sort((a,b)=>a.s-b.s);
    const lanes=[];
    sorted.forEach(it=>{
        let placed=false;
        for(const lane of lanes){
            const last=lane[lane.length-1];
            if(it.s>=last.e){lane.push(it);placed=true;break}
        }
        if(!placed)lanes.push([it]);
    });
    return lanes.length?lanes:[[]];
}

let selectedSegId=null; // currently selected segment id

function getDataArr(step){
    if(step==='erase')return eraseRegions;
    if(step==='subtitle')return subtitleItems;
    return voiceItems;
}
function getItemTime(step,id){
    const arr=getDataArr(step);const it=arr.find(x=>x.id===id);
    return it?{s:it.startSec,e:it.endSec}:null;
}
function setItemTime(step,id,s,e){
    const arr=getDataArr(step);const it=arr.find(x=>x.id===id);
    if(!it)return;
    it.startSec=Math.max(0,Math.round(s*2)/2);
    it.endSec=Math.min(videoDuration,Math.round(e*2)/2);
    if(it.endSec<=it.startSec)it.endSec=it.startSec+0.5;
}

function rebuildFtTimeline(step){
    document.querySelectorAll('.v8-trk').forEach(t=>{t.classList.add('hidden');const c=t.querySelector('.v8-trk-c');if(c)c.innerHTML=''});
    let items;
    if(step==='erase')items=eraseRegions.map(r=>({id:r.id,s:r.startSec,e:r.endSec}));
    else if(step==='subtitle')items=subtitleItems.map(s=>({id:s.id,s:s.startSec,e:s.endSec}));
    else items=voiceItems.map(v=>({id:v.id,s:v.startSec,e:v.endSec}));
    const lanes=assignLanes(items);
    const trkEls=[
        document.querySelector('.v8-trk[data-track="erase"]'),
        document.querySelector('.v8-trk[data-track="subtitle"]'),
        document.querySelector('.v8-trk[data-track="voice"]')
    ];
    lanes.forEach((lane,li)=>{
        if(li>=trkEls.length)return;
        const trk=trkEls[li];
        trk.classList.remove('hidden');
        const label=trk.querySelector('.v8-trk-l');
        if(li===0){label.textContent={erase:'擦除',subtitle:'字幕',voice:'配音'}[step]||step}
        else{label.textContent=''}
        const c=trk.querySelector('.v8-trk-c');
        c.innerHTML='<div style="position:absolute;inset:0;background:rgba(255,255,255,0.02);border-radius:4px"></div>';
        lane.forEach(it=>{
            const lp=(it.s/videoDuration)*100,wp=((it.e-it.s)/videoDuration)*100;
            const seg=document.createElement('div');
            seg.className='v8-seg v8-seg--'+step+(it.id===selectedSegId?' selected':'');
            seg.style.left=lp+'%';seg.style.width=Math.max(wp,0.5)+'%';
            seg.dataset.id=it.id;seg.dataset.step=step;
            seg.innerHTML='<span class="v8-seg-h v8-seg-h--l" data-handle="left"></span><span style="pointer-events:none;flex:1;text-align:center">'+it.id+'</span><span class="v8-seg-h v8-seg-h--r" data-handle="right"></span>';
            // Click to select + seek
            seg.addEventListener('mousedown',e=>{
                const handle=e.target.closest('.v8-seg-h');
                if(handle){
                    // Start handle drag
                    e.stopPropagation();e.preventDefault();
                    startSegDrag(it.id,step,handle.dataset.handle,e,c);
                    return;
                }
                // Select
                selectSeg(it.id,step);
                videoTime=it.s;needsVideoSync=true;
                // Start move drag
                e.preventDefault();
                startSegDrag(it.id,step,'move',e,c);
            });
            c.appendChild(seg);
        });
    });
}

function selectSeg(id,step){
    selectedSegId=id;
    document.querySelectorAll('.v8-seg').forEach(s=>s.classList.toggle('selected',s.dataset.id===id));
    // Highlight in list
    if(step==='erase'){activeErase=id;document.querySelectorAll('.frc').forEach(c=>c.classList.toggle('active',c.dataset.r===id))}
    if(step==='subtitle'){document.querySelectorAll('.fsi').forEach(c=>c.classList.toggle('active',c.dataset.s===id))}
    if(step==='voice'){document.querySelectorAll('.fvi').forEach(c=>c.classList.toggle('active',c.dataset.v===id))}
}

function startSegDrag(id,step,type,startEvt,container){
    const rect=container.getBoundingClientRect();
    const cw=rect.width;
    const startX=startEvt.clientX;
    const t=getItemTime(step,id);if(!t)return;
    const origS=t.s,origE=t.e;
    document.body.style.cursor=type==='move'?'grabbing':'col-resize';
    function onMove(ev){
        const dx=ev.clientX-startX;
        const dSec=(dx/cw)*videoDuration;
        if(type==='left'){
            setItemTime(step,id,origS+dSec,origE);
        }else if(type==='right'){
            setItemTime(step,id,origS,origE+dSec);
        }else{
            const dur=origE-origS;
            let ns=origS+dSec;
            if(ns<0)ns=0;if(ns+dur>videoDuration)ns=videoDuration-dur;
            setItemTime(step,id,ns,ns+dur);
        }
        // Live update segment position
        const seg=container.querySelector('.v8-seg[data-id="'+id+'"]');
        if(seg){
            const it=getItemTime(step,id);
            seg.style.left=(it.s/videoDuration*100)+'%';
            seg.style.width=((it.e-it.s)/videoDuration*100)+'%';
        }
        videoTime=getItemTime(step,id).s;needsVideoSync=true;
    }
    function onUp(){
        document.removeEventListener('mousemove',onMove);
        document.removeEventListener('mouseup',onUp);
        document.body.style.cursor='';
        // Sync list UI
        if(step==='erase'){renderEraseList();renderEraseOverlays()}
        else if(step==='subtitle')renderSubList();
        else renderVoiceList();
        // Rebuild timeline to fix lane positions
        rebuildFtTimeline(step);
    }
    document.addEventListener('mousemove',onMove);
    document.addEventListener('mouseup',onUp);
}

function clearFtTimeline(){
    document.querySelectorAll('.v8-trk').forEach(t=>{t.classList.add('hidden');const c=t.querySelector('.v8-trk-c');if(c)c.innerHTML=''});
    // Restore labels
    const labels={erase:'擦除',subtitle:'字幕',voice:'配音'};
    Object.keys(labels).forEach(k=>{const trk=document.querySelector('.v8-trk[data-track="'+k+'"]');if(trk){const l=trk.querySelector('.v8-trk-l');if(l)l.textContent=labels[k]}});
}

function buildRuler(){
    const el=document.getElementById('tlRuler');el.innerHTML='';
    for(let s=0;s<=videoDuration;s+=15){
        const pct=(s/videoDuration)*100;const mk=document.createElement('div');mk.className='v8-rm';mk.style.left=pct+'%';
        mk.innerHTML='<span class="tl">'+fmt(s)+'</span><span class="tick"></span>';el.appendChild(mk);
    }
}
buildRuler();

/* ===== Video Loop ===== */
function updateBurntSub(t){
    if(burntSub.classList.contains('erased'))return;
    const cur=subtitleItems.find(s=>t>=s.startSec&&t<=s.endSec);
    if(cur){if(lastBurntId!==cur.id){burntSub.innerHTML='<span class="bs-bar"><span class="bs-text">'+cur.orig+'</span></span>';burntSub.classList.add('visible');lastBurntId=cur.id}}
    else{if(lastBurntId!==null){burntSub.classList.remove('visible');lastBurntId=null}}
}
function syncVideoToTime(){const vd=videoEl.duration||15;const tv=videoTime%vd;if(Math.abs(videoEl.currentTime-tv)>1)videoEl.currentTime=tv}
function updateTimeline(){
    const pct=(videoTime/videoDuration)*100;
    const sf=document.getElementById('scrubFill'),st=document.getElementById('scrubThumb'),stm=document.getElementById('scrubTime');
    if(sf)sf.style.width=pct+'%';if(st)st.style.left=pct+'%';
    if(stm)stm.innerHTML='<span style="color:#fff">'+fmt(videoTime)+'</span> / '+fmt(videoDuration);
    const tlt=document.getElementById('tlTime');if(tlt)tlt.innerHTML='<span class="cur">'+fmt(videoTime)+'</span> / '+fmt(videoDuration);
    const trks=document.getElementById('tlTracks');if(trks){const tw=trks.offsetWidth;const cw=tw-80-20;tlPlayhead.style.left=(80+(pct/100)*cw)+'px'}
}
function tick(){
    if(playing){videoTime+=1/60;if(videoTime>=videoDuration)videoTime=0;if(videoEl.paused)videoEl.play().catch(()=>{})}
    else{if(!videoEl.paused)videoEl.pause()}
    if(needsVideoSync){syncVideoToTime();needsVideoSync=false}
    updateBurntSub(videoTime);updateTimeline();updateEraseVis();updateSubPreview();updateVoicePreview();
    if(compareActive){if(playing&&cmpVid.paused)cmpVid.play().catch(()=>{});if(!playing&&!cmpVid.paused)cmpVid.pause();if(Math.abs(cmpVid.currentTime-videoEl.currentTime)>0.3)cmpVid.currentTime=videoEl.currentTime}
    animFrame=requestAnimationFrame(tick);
}

/* ===== Scrubber ===== */
let scrubDrag=false;
const scrubBar=document.getElementById('scrubBar');
scrubBar.addEventListener('mousedown',e=>{e.preventDefault();scrubDrag=true;seekScrub(e.clientX)});
document.addEventListener('mousemove',e=>{if(scrubDrag)seekScrub(e.clientX)});
document.addEventListener('mouseup',()=>{scrubDrag=false});
function seekScrub(cx){const r=scrubBar.getBoundingClientRect();const p=Math.max(0,Math.min(1,(cx-r.left)/r.width));videoTime=p*videoDuration;needsVideoSync=true}

function updatePlayIcons(){
    document.querySelector('.sp-play').style.display=playing?'none':'';
    document.querySelector('.sp-pause').style.display=playing?'':'none';
    const tp=document.querySelector('.tp-play'),tpp=document.querySelector('.tp-pause');
    if(tp)tp.style.display=playing?'none':'';if(tpp)tpp.style.display=playing?'':'none';
}
document.getElementById('scrubPlay').addEventListener('click',()=>{playing=!playing;updatePlayIcons()});
document.getElementById('tlPlay').addEventListener('click',()=>{playing=!playing;updatePlayIcons()});

tlTracks.addEventListener('mousedown',e=>{
    if(!inFinetune)return;e.preventDefault();
    const r=tlTracks.getBoundingClientRect();const cl=r.left+80;const cw=r.width-80-20;
    const p=Math.max(0,Math.min(1,(e.clientX-cl)/cw));videoTime=p*videoDuration;needsVideoSync=true;
});

/* ===== Chat Collapse/Expand ===== */
let chatCollapsed=false;
let unreadCount=0;
const chatPanel=document.getElementById('chatPanel');
const chatFab=document.getElementById('chatFab');
const fabBadge=document.getElementById('fabBadge');

function collapseChat(){
    chatCollapsed=true;
    chatPanel.classList.add('collapsed');
    chatFab.classList.add('active');
    unreadCount=0;fabBadge.textContent='';fabBadge.style.display='none';
}
function expandChat(){
    chatCollapsed=false;
    chatPanel.classList.remove('collapsed');
    chatFab.classList.remove('active');
    unreadCount=0;fabBadge.textContent='';fabBadge.style.display='none';
    scrollChat();
}
// Increment unread when new bubble added while collapsed
const origAppend=chatFlow.appendChild.bind(chatFlow);
chatFlow.appendChild=function(el){
    origAppend(el);
    if(chatCollapsed&&el.classList&&el.classList.contains('chat-bubble')){
        unreadCount++;fabBadge.textContent=unreadCount;fabBadge.style.display='flex';
    }
};

document.getElementById('chatCollapseBtn').addEventListener('click',collapseChat);
chatFab.addEventListener('click',expandChat);

/* ===== Back Button Logic ===== */
let taskStarted=false; // set to true once buildConfigChat runs
const backModal=document.getElementById('backModal');

document.getElementById('backBtn').addEventListener('click',()=>{
    if(!taskStarted||phase==='done'){
        // No active task or already done — just go back
        location.href='create.html';return;
    }
    // Show confirmation modal
    backModal.classList.add('active');
});

document.getElementById('backCancelBtn').addEventListener('click',()=>{backModal.classList.remove('active')});
backModal.addEventListener('click',e=>{if(e.target===backModal)backModal.classList.remove('active')});

// 后台继续 — 把任务信息存到 sessionStorage（用 tideo_minimized_tasks key 对接 create.html 胶囊）
document.getElementById('backBgBtn').addEventListener('click',()=>{
    backModal.classList.remove('active');
    const taskInfo={
        id:'task_'+Date.now(),
        name:uploadedFileName,
        mode:workflowMode,
        step:currentStep,
        totalSteps:activeSteps.length,
        phase:phase==='done'?'done':'processing',
        progress:phase==='done'?100:Math.round((currentStep/Math.max(activeSteps.length,1))*80),
        progressStep:phase==='done'?'译制完成！':phaseLabel.textContent||'处理中...',
        features:Object.assign({},features),
        time:new Date().toLocaleTimeString()
    };
    let bgTasks=[];
    try{bgTasks=JSON.parse(sessionStorage.getItem('tideo_minimized_tasks')||'[]')}catch(e){}
    bgTasks.push(taskInfo);
    sessionStorage.setItem('tideo_minimized_tasks',JSON.stringify(bgTasks));
    location.href='create.html';
});

// 停止任务 — 直接返回
document.getElementById('backStopBtn').addEventListener('click',()=>{
    backModal.classList.remove('active');
    location.href='create.html';
});

/* ===== Init ===== */
phaseEl.classList.add('vis');
document.getElementById('scrub').classList.add('vis');
animFrame=requestAnimationFrame(tick);
renderSubList();renderVoiceList();

if(autostart||true){
    setTimeout(()=>{playing=false;taskStarted=true;buildConfigChat()},500);
}

})();
