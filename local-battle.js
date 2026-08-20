
(()=>{'use strict';
const KEY='relians_generator_v4_4',$=id=>document.getElementById(id);
let data=null,battle=null;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function load(){try{data=JSON.parse(localStorage.getItem(KEY)||'null')}catch{} if(!data)data={storySheets:[],savedRelianSheets:[],relians:[],moves:{},traits:{}}}

function save(){try{localStorage.setItem(KEY,JSON.stringify(data))}catch(err){console.warn('Falha ao salvar resultado da batalha local',err)}}
function charById(id){return chars().find(x=>String(x.id)===String(id))||null}
function ensureCompetitiveStats(c){
  if(!c?.character)return null;
  const s=c.character.battleStats||(c.character.battleStats={});
  for(const k of ['battles','wins','losses','trainerWins','trainerLosses','playerWins','playerLosses'])s[k]=Math.max(0,Number(s[k])||0);
  c.character.battleHistory=Array.isArray(c.character.battleHistory)?c.character.battleHistory:[];
  return s;
}
function recordLocalCompetitiveResult(winner,loser){
  const winChar=charById(winner.characterId),loseChar=charById(loser.characterId);
  if(!winChar||!loseChar)return;

  const ws=ensureCompetitiveStats(winChar),ls=ensureCompetitiveStats(loseChar);
  ws.battles++;ws.wins++;ws.playerWins++;
  ls.battles++;ls.losses++;ls.playerLosses++;

  const id=`local-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
  const at=new Date().toISOString();
  const common={battleId:id,at,mode:'player',rounds:Number(battle?.round)||1,durationSeconds:0,credits:0,xp:0,drops:[]};

  winChar.character.battleHistory.unshift({
    ...common,id:`history-${id}-win`,result:'playerWin',
    opponent:String(loser.trainer||'Jogador'),
    trainerName:String(loser.trainer||'Jogador'),
    usedRelians:[{sheetId:winner.sheetId,speciesId:String(winner.sp?.id||''),name:winner.name,level:winner.level}],
    opponents:[{speciesId:String(loser.sp?.id||''),name:loser.name,level:loser.level}],
    captured:null
  });
  loseChar.character.battleHistory.unshift({
    ...common,id:`history-${id}-loss`,result:'playerLoss',
    opponent:String(winner.trainer||'Jogador'),
    trainerName:String(winner.trainer||'Jogador'),
    usedRelians:[{sheetId:loser.sheetId,speciesId:String(loser.sp?.id||''),name:loser.name,level:loser.level}],
    opponents:[{speciesId:String(winner.sp?.id||''),name:winner.name,level:winner.level}],
    captured:null
  });

  winChar.character.battleHistory=winChar.character.battleHistory.slice(0,120);
  loseChar.character.battleHistory=loseChar.character.battleHistory.slice(0,120);
  winChar.character.lastBattle=winChar.character.battleHistory[0];
  loseChar.character.lastBattle=loseChar.character.battleHistory[0];
  save();
}

function chars(){return (data?.storySheets||[]).filter(x=>x&&(x.type==='character'||x.type==='trainer'))}
function sheet(id){return (data?.savedRelianSheets||[]).find(x=>String(x.id)===String(id))}
function species(id){return (data?.relians||[]).find(x=>String(x.id)===String(id))}
function move(id){return data?.moves?.[id]||null}
function image(sp,color){if(!sp)return'';const c=String(color||'basic').toLowerCase();return c==='shiny'?(sp.imageShiny||sp.shinyImage||sp.image||''):c==='special'?(sp.imageSpecial||sp.specialImage||sp.image||''):(sp.image||sp.imageBasic||'')}
function attrs(s,k){const a=s?.attributes||{};const v=a[k];return Number(v?.total??v?.value??v)||0}
function moveName(m){return String(m?.name||m?.nome||m?.id||'Movimento')}
function moveCost(m){return Math.max(0,Number(m?.energyCost??m?.engCost??m?.cost??m?.custoEnergia??m?.energy??0)||0)}
function moveDamage(m){return Math.max(0,Number(m?.damage??m?.power??m?.dano??m?.baseDamage??0)||0)}
function moveAcc(m){return clamp(Number(m?.accuracy??m?.precisao??m?.hitChance??100)||100,5,100)}
function movesFor(s,sp){const ids=Array.isArray(s?.moves)&&s.moves.length?s.moves:(sp?.moves||sp?.learnableMoves||[]);return ids.map(x=>typeof x==='object'?(move(x.id||x.moveId)||x):move(x)).filter(Boolean).slice(0,8)}
function teamOptions(c){return (c?.character?.team||[]).map(m=>({m,s:sheet(m.savedSheetId)})).filter(x=>x.s)}
function fillChars(){
 const list=chars(),opts='<option value="">Selecione...</option>'+list.map(c=>`<option value="${esc(c.id)}">${esc(c.character?.name||'Personagem')}</option>`).join('');
 $('localChar1').innerHTML=opts;$('localChar2').innerHTML=opts;
 if(list[0])$('localChar1').value=list[0].id;if(list[1])$('localChar2').value=list[1].id;
 refreshTeam(1);refreshTeam(2);
}
function refreshTeam(n){
 const cid=$(`localChar${n}`).value,c=chars().find(x=>String(x.id)===String(cid)),sel=$(`localRelian${n}`);
 const rows=teamOptions(c);sel.innerHTML='<option value="">Selecione...</option>'+rows.map(({m,s})=>`<option value="${esc(s.id)}">${esc(m.nickname||s.nickname||s.speciesName||'Relian')} · Nv.${Number(m.level||s.level)||1}</option>`).join('');
 if(rows[0])sel.value=rows[0].s.id;preview(n);
}
function preview(n){
 const s=sheet($(`localRelian${n}`).value),box=$(`localPreview${n}`);if(!s){box.innerHTML='';return}
 const sp=species(s.speciesId),img=image(sp,s.color);
 box.innerHTML=`<div class="preview-relian">${img?`<img src="${esc(img)}" alt="">`:'<div></div>'}<div><b>${esc(s.nickname||sp?.name||s.speciesName||'Relian')}</b><small>${esc(sp?.name||s.speciesName||'')} · Nv.${Number(s.level)||1}</small><small>HP ${Number(s.hpMax)||100} · ENG ${Number(s.engMax)||65}</small></div></div>`;
}
function fighter(n){
 const cid=$(`localChar${n}`).value,c=chars().find(x=>String(x.id)===String(cid)),s=sheet($(`localRelian${n}`).value);if(!c||!s)return null;
 const sp=species(s.speciesId),maxHp=Math.max(1,Number(s.hpMax)||100),maxEng=Math.max(1,Number(s.engMax)||65);
 return {player:n,characterId:c.id,trainer:c.character?.name||`Jogador ${n}`,sheetId:s.id,name:s.nickname||sp?.name||s.speciesName||'Relian',sp,color:s.color||'basic',level:Number(s.level)||1,hp:maxHp,maxHp,eng:maxEng,maxEng,atk:attrs(s,'ataque'),def:attrs(s,'defesa'),spa:attrs(s,'ataqueEspecial'),spd:attrs(s,'defesaEspecial'),speed:attrs(s,'velocidade'),precision:attrs(s,'precisao'),moves:movesFor(s,sp),guard:0};
}
function start(){
 if($('localChar1').value===$('localChar2').value)return alert('Escolha dois personagens diferentes.');
 const a=fighter(1),b=fighter(2);if(!a||!b)return alert('Escolha um Relian para cada personagem.');
 battle={fighters:[a,b],turn:a.speed>=b.speed?0:1,round:1,finished:false};
 $('localSetup').hidden=true;$('localGame').hidden=false;$('localLog').innerHTML='';log(`${a.trainer} e ${b.trainer} iniciaram a batalha!`);log(`${battle.fighters[battle.turn].name} age primeiro por Velocidade.`);render();
}
function current(){return battle.fighters[battle.turn]} function foe(){return battle.fighters[1-battle.turn]}
function renderFighter(f,i){
 const img=image(f.sp,f.color),hp=Math.round(f.hp/f.maxHp*100),eng=Math.round(f.eng/f.maxEng*100);
 $(`localFighter${i+1}`).className=`local-fighter ${i===1?'right':''}`;
 $(`localFighter${i+1}`).innerHTML=`<div class="fighter-copy"><span class="local-kicker">${esc(f.trainer)}</span><h2>${esc(f.name)}</h2><p>${esc(f.sp?.name||'')} · Nv.${f.level}</p><div class="fighter-bar-label"><span>HP</span><b>${Math.round(f.hp)}/${f.maxHp}</b></div><div class="fighter-bar"><i style="width:${hp}%"></i></div><div class="fighter-bar-label"><span>ENG</span><b>${Math.round(f.eng)}/${f.maxEng}</b></div><div class="fighter-bar eng"><i style="width:${eng}%"></i></div><div class="fighter-stats"><span>ATQ ${f.atk}</span><span>DEF ${f.def}</span><span>VEL ${f.speed}</span><span>PREC ${f.precision}</span></div></div><div class="fighter-sprite">${img?`<img src="${esc(img)}" alt="${esc(f.name)}">`:'◆'}</div>`;
}
function render(){
 if(!battle)return;renderFighter(battle.fighters[0],0);renderFighter(battle.fighters[1],1);
 const c=current();$('localTurnName').textContent=`${c.trainer} · ${c.name}`;$('localRound').textContent=`Rodada ${battle.round}`;$('localActionTitle').textContent=`Movimentos de ${c.name}`;$('localEngHint').textContent=`${Math.round(c.eng)} ENG`;
 $('localMoves').innerHTML=c.moves.length?c.moves.map((m,i)=>{const cost=moveCost(m),d=moveDamage(m);return `<button type="button" class="local-move" data-move="${i}" ${c.eng<cost?'disabled':''}><b>${esc(moveName(m))}</b><strong>${cost} ENG</strong><small>${d?`Dano ${d}`:'Suporte'} · Precisão ${moveAcc(m)}% · ${esc(m.element||m.type||m.tipo||'Neutro')}</small></button>`}).join(''):'<p>Nenhum movimento disponível.</p>';
 $('localMoves').querySelectorAll('[data-move]').forEach(btn=>btn.onclick=()=>act(Number(btn.dataset.move)));
}
function calcDamage(a,d,m){const special=['EFT','HIB'].includes(String(m?.type||m?.tipo||'').toUpperCase());const atk=special?a.spa:a.atk,def=(special?d.spd:d.def)+(d.guard?8:0);return Math.max(1,Math.round((moveDamage(m)+(atk-def)*.35)*(.9+Math.random()*.2)))}
function act(i){
 if(!battle||battle.finished)return;const a=current(),d=foe(),m=a.moves[i],cost=moveCost(m);if(!m||a.eng<cost)return;
 a.eng-=cost;const base=moveDamage(m);
 if(base<=0){a.guard=2;log(`${a.trainer}: ${a.name} usou ${moveName(m)} e reforçou sua defesa.`);return next()}
 if(Math.random()*100>moveAcc(m)+Math.floor(a.precision/10)){log(`${a.name} usou ${moveName(m)}, mas errou.`);return next()}
 const dmg=calcDamage(a,d,m);d.hp=Math.max(0,d.hp-dmg);log(`${a.name} usou ${moveName(m)} e causou ${dmg} de dano em ${d.name}.`);
 render();if(d.hp<=0)return finish(a,d);next();
}
function next(){
 const old=battle.turn;battle.turn=1-old;if(battle.turn===0)battle.round++;
 const c=current();c.eng=Math.min(c.maxEng,c.eng+Math.max(4,Math.round(c.maxEng*.08)));if(c.guard)c.guard--;
 render();
}
function finish(w,l){
 battle.finished=true;
 recordLocalCompetitiveResult(w,l);
 render();
 $('localResult').hidden=false;
 $('localResult').innerHTML=`<div class="local-result-card"><span class="local-kicker">BATALHA COMPETITIVA ENCERRADA</span><h2>${esc(w.trainer)} venceu!</h2><p>${esc(w.name)} derrotou ${esc(l.name)} em ${battle.round} rodada${battle.round===1?'':'s'}.</p><p><b>Resultado contabilizado:</b> +1 vitória para ${esc(w.trainer)} e +1 derrota para ${esc(l.trainer)}.</p><button type="button" id="localRematchBtn">Voltar à seleção</button></div>`;
 $('localRematchBtn').onclick=reset;
}
function reset(){$('localResult').hidden=true;$('localResult').innerHTML='';$('localGame').hidden=true;$('localSetup').hidden=false;battle=null;preview(1);preview(2)}
function log(t){const d=document.createElement('div');d.textContent=t;$('localLog').prepend(d)}
load();fillChars();
$('localChar1').addEventListener('change',()=>refreshTeam(1));$('localChar2').addEventListener('change',()=>refreshTeam(2));$('localRelian1').addEventListener('change',()=>preview(1));$('localRelian2').addEventListener('change',()=>preview(2));$('localStartBtn').addEventListener('click',start);$('localPassBtn').addEventListener('click',()=>{if(battle){log(`${current().trainer} passou o turno.`);next()}});$('localQuitBtn').addEventListener('click',()=>{if(confirm('Encerrar esta batalha local?'))reset()});
})();