(()=>{
'use strict';
const W=14,H=9,MOVE_ENG=2;
const $=id=>document.getElementById(id);
let battle=null;

function battleToast(text,type='info',duration=1100){
  const box=$('battleToast');
  if(!box)return;
  box.textContent=String(text||'');
  box.className=`battle-toast ${type}`;
  box.hidden=false;
  clearTimeout(battleToast._timer);
  battleToast._timer=setTimeout(()=>{box.hidden=true},Math.max(300,Number(duration)||1100));
}
function flashCombatant(side,type='hit'){
  const card=document.querySelector(`.battle-status-card.${side}`);
  if(!card)return;
  card.classList.remove('battle-flash-hit','battle-flash-heal','battle-flash-buff');
  void card.offsetWidth;
  const cls=type==='heal'?'battle-flash-heal':type==='buff'?'battle-flash-buff':'battle-flash-hit';
  card.classList.add(cls);
  setTimeout(()=>card.classList.remove(cls),480);
}


const FIXED_PLAYER_KEY='relians-fixed-player-id-v1';
let pendingGeneratedBattle=null;

function fixedPlayerId(){return localStorage.getItem(FIXED_PLAYER_KEY)||''}
function fixedPlayer(){
  const id=fixedPlayerId();
  return characters().find(s=>String(s.id)===String(id))||null;
}
function setFixedPlayer(id){
  if(id)localStorage.setItem(FIXED_PLAYER_KEY,String(id));
  else localStorage.removeItem(FIXED_PLAYER_KEY);
  refreshSetup();
  renderPlayerPage();
  renderShop();
  renderRecoveryPage();
}
function ensureBattleStats(charSheet){
  if(!charSheet?.character)return {battles:0,wins:0,losses:0,captures:0,escapes:0};
  const s=charSheet.character.battleStats||(charSheet.character.battleStats={});
  for(const k of ['battles','wins','losses','captures','escapes','trainerWins','wildWins','creditsEarned'])s[k]=Math.max(0,Number(s[k])||0);
  charSheet.character.credits=Math.max(0,Number(charSheet.character.credits)||0);
  return s;
}
function rankProgressInfo(wins){
  wins=Math.max(0,Number(wins)||0);
  const tiers=[
    {name:'Iniciante',min:0,next:3},{name:'Bronze',min:3,next:8},{name:'Prata',min:8,next:20},
    {name:'Ouro',min:20,next:40},{name:'Platina',min:40,next:75},{name:'Mestre',min:75,next:null}
  ];
  const tier=[...tiers].reverse().find(t=>wins>=t.min)||tiers[0];
  if(tier.next==null)return {name:tier.name,text:'Rank máximo alcançado',percent:100};
  const span=tier.next-tier.min,done=wins-tier.min;
  return {name:tier.name,text:`${wins}/${tier.next} vitórias de treinador`,percent:Math.max(0,Math.min(100,done/span*100))};
}
function playerRank(wins){
  wins=Math.max(0,Number(wins)||0);
  if(wins>=75)return 'Mestre';
  if(wins>=40)return 'Platina';
  if(wins>=20)return 'Ouro';
  if(wins>=8)return 'Prata';
  if(wins>=3)return 'Bronze';
  return 'Iniciante';
}

function addPlayerCredits(amount,reason=''){
  const c=characters().find(x=>String(x.id)===String(battle?.player?.characterId))||fixedPlayer();
  if(!c?.character)return 0;
  ensureBattleStats(c);
  const value=Math.max(0,Math.round(Number(amount)||0));
  c.character.credits=Math.max(0,Number(c.character.credits)||0)+value;
  c.character.battleStats.creditsEarned+=value;
  try{doSave()}catch{}
  renderPlayerPage();renderShop();
  if(value)log(`+${value} C$${reason?` · ${reason}`:''}`);
  return value;
}
function trainerRewardFor(team,level){
  const count=Math.max(1,Number(team)||1),lv=Math.max(1,Number(level)||1);
  return Math.round(90+lv*18+count*75);
}

function recordPlayerResult(kind){
  const c=characters().find(x=>String(x.id)===String(battle?.player?.characterId))||fixedPlayer();
  if(!c)return;
  const s=ensureBattleStats(c);
  if(kind==='win'){s.battles++;s.wins++;s.wildWins++}
  else if(kind==='trainerWin'){s.battles++;s.wins++;s.trainerWins++}
  else if(kind==='loss'){s.battles++;s.losses++}
  else if(kind==='capture'){s.battles++;s.wins++;s.wildWins++;s.captures++}
  else if(kind==='escape'){s.escapes++}
  try{doSave()}catch{}
  renderPlayerPage();renderShop();
}

function recoveryPlayer(){return fixedPlayer()}
function recoverSavedRelianSheet(sheet){
  if(!sheet)return false;
  const maxHp=Math.max(1,Number(sheet.hpMax)||1);
  const maxEng=Math.max(1,Number(sheet.engMax)||1);
  const changed=Number(sheet.hpCurrent??maxHp)!==maxHp||Number(sheet.engCurrent??maxEng)!==maxEng;
  sheet.hpCurrent=maxHp;
  sheet.engCurrent=maxEng;
  return changed;
}
function recoverOneRelian(sheetId){
  const c=recoveryPlayer();if(!c)return alert('Defina um jogador primeiro.');
  const member=(c.character?.team||[]).find(m=>String(m.savedSheetId)===String(sheetId));
  const sheet=member?savedById(member.savedSheetId):null;
  if(!sheet)return;
  const changed=recoverSavedRelianSheet(sheet);
  try{doSave()}catch{}
  refreshSetup();renderPlayerPage();renderRecoveryPage();
  battleToast(changed?`${member.nickname||sheet.nickname||sheet.speciesName} recuperado!`:'Este Relian já está totalmente recuperado.','heal',1100);
}
function recoverAllTeam(){
  const c=recoveryPlayer();if(!c)return alert('Defina um jogador primeiro.');
  let count=0;
  for(const member of c.character?.team||[]){
    const sheet=savedById(member.savedSheetId);
    if(sheet&&recoverSavedRelianSheet(sheet))count++;
  }
  try{doSave()}catch{}
  refreshSetup();renderPlayerPage();renderRecoveryPage();
  battleToast(count?`${count} Relian${count>1?'s':''} recuperado${count>1?'s':''}!`:'A equipe já está totalmente recuperada.','heal',1300);
}
function renderRecoveryPage(){
  const c=recoveryPlayer(),grid=$('recoveryTeamGrid'),name=$('recoveryPlayerName'),summary=$('recoveryTeamStatus'),detail=$('recoveryTeamDetail');
  if(name)name.textContent=c?.character?.name||'Nenhum jogador';
  if(!grid)return;
  if(!c){
    if(summary)summary.textContent='—';
    if(detail)detail.textContent='Defina um jogador na Página do Jogador.';
    grid.innerHTML='<div class="recovery-empty"><b>Nenhum jogador definido</b><span>Escolha seu personagem ativo antes de usar o Centro de Recuperação.</span></div>';
    return;
  }
  const members=(c.character?.team||[]).map(member=>({member,sheet:savedById(member.savedSheetId)})).filter(x=>x.sheet);
  const healthy=members.filter(({sheet})=>Number(sheet.hpCurrent??sheet.hpMax)>=Number(sheet.hpMax)&&Number(sheet.engCurrent??sheet.engMax)>=Number(sheet.engMax)).length;
  if(summary)summary.textContent=`${healthy}/${members.length} prontos`;
  if(detail)detail.textContent=members.length?`${members.length-healthy} precisam de recuperação.`:'Este personagem ainda não possui Relians.';
  grid.innerHTML=members.length?members.map(({member,sheet})=>{
    const sp=species(sheet.speciesId),img=imageFor(sp,sheet.color);
    const hp=Number(sheet.hpCurrent??sheet.hpMax??0),maxHp=Math.max(1,Number(sheet.hpMax)||1);
    const eng=Number(sheet.engCurrent??sheet.engMax??0),maxEng=Math.max(1,Number(sheet.engMax)||1);
    const full=hp>=maxHp&&eng>=maxEng;
    return `<article class="card recovery-relian-card ${full?'ready':'needs-care'}">
      <div class="recovery-relian-top">
        <div class="recovery-relian-img">${img?`<img src="${escapeHtml(img)}" alt="">`:'<span>◆</span>'}</div>
        <div><h4>${escapeHtml(member.nickname||sheet.nickname||sp?.name||'Relian')}</h4><small>${escapeHtml(sp?.name||sheet.speciesName||'')} · Nv. ${Number(member.level||sheet.level)||1}</small></div>
        <span class="recovery-state">${full?'Pronto':'Recuperar'}</span>
      </div>
      <div class="recovery-bars">
        <div><span>HP <b>${Math.round(hp)}/${Math.round(maxHp)}</b></span><i><em style="width:${Math.max(0,Math.min(100,hp/maxHp*100))}%"></em></i></div>
        <div><span>ENG <b>${Math.round(eng)}/${Math.round(maxEng)}</b></span><i class="eng"><em style="width:${Math.max(0,Math.min(100,eng/maxEng*100))}%"></em></i></div>
      </div>
      <button type="button" data-recover-relian="${escapeHtml(sheet.id)}" ${full?'disabled':''}>${full?'Totalmente recuperado':'Recuperar gratuitamente'}</button>
    </article>`;
  }).join(''):'<div class="recovery-empty"><b>Equipe vazia</b><span>Adicione Relians ao personagem para vê-los aqui.</span></div>';
  grid.querySelectorAll('[data-recover-relian]').forEach(btn=>btn.onclick=()=>recoverOneRelian(btn.dataset.recoverRelian));
}

function renderPlayerPage(){
  const sel=$('fixedPlayerSelect'),chars=characters(),fixed=fixedPlayer();
  if(sel){
    const old=fixed?.id||sel.value||'';
    sel.innerHTML='<option value="">Selecione...</option>'+chars.map(c=>`<option value="${escapeHtml(c.id)}">${escapeHtml(c.character?.name||'Personagem')}</option>`).join('');
    if(chars.some(c=>String(c.id)===String(old)))sel.value=old;
  }

  const pill=$('playerFixedPill');
  if(pill)pill.textContent=fixed?`Ativo: ${fixed.character?.name||'Personagem'}`:'Nenhum jogador definido';
  const notice=$('pendingBattleNotice');if(notice)notice.hidden=!pendingGeneratedBattle;

  const stats=fixed?ensureBattleStats(fixed):{battles:0,wins:0,losses:0,captures:0,escapes:0,trainerWins:0};
  const rank=rankProgressInfo(stats.trainerWins||0);
  const card=$('playerProfileCard');
  const overview=$('playerTeamOverview');

  if(card){
    if(!fixed){
      card.innerHTML='<div class="player-profile-empty"><b>Nenhum personagem definido</b><span>Escolha uma ficha ao lado para construir seu perfil.</span></div>';
    }else{
      const c=fixed.character||{},img=c.image||'',members=(c.team||[]).map(m=>({m,s:savedById(m.savedSheetId)})).filter(x=>x.s);
      const alive=members.filter(x=>Number(x.s.hpCurrent??x.s.hpMax??1)>0).length;
      card.innerHTML=`<div class="player-profile-main">
        <div class="player-profile-avatar">${img?`<img src="${escapeHtml(img)}" alt="">`:`<span>${escapeHtml((c.name||'?')[0])}</span>`}</div>
        <div class="player-profile-copy">
          <div class="section-kicker">JOGADOR ATIVO</div>
          <h2>${escapeHtml(c.name||'Personagem')}</h2>
          <p>${escapeHtml(c.player||'Sem jogador informado')} · Nv. ${Number(c.level)||1}</p>
          <div class="player-profile-tags"><span>${escapeHtml(c.region||'Região não definida')}</span><span>${alive}/${members.length} Relians aptos</span><span>${escapeHtml(rank.name)}</span></div>
        </div>
      </div>`;
    }
  }

  if(overview){
    if(!fixed)overview.innerHTML='<div class="player-team-empty">Defina um jogador para visualizar a equipe.</div>';
    else{
      const members=(fixed.character?.team||[]).map(m=>({m,s:savedById(m.savedSheetId)})).filter(x=>x.s);
      overview.innerHTML=members.length?members.map(({m,s})=>{
        const sp=species(s.speciesId),img=imageFor(sp,s.color);
        const hp=Number(s.hpCurrent??s.hpMax??0),maxHp=Math.max(1,Number(s.hpMax)||1);
        const eng=Number(s.engCurrent??s.engMax??0),maxEng=Math.max(1,Number(s.engMax)||1);
        return `<article class="player-team-mini">
          <div class="player-team-mini-img">${img?`<img src="${escapeHtml(img)}" alt="">`:'◆'}</div>
          <div><b>${escapeHtml(m.nickname||s.nickname||sp?.name||'Relian')}</b><small>Nv. ${Number(m.level||s.level)||1} · HP ${Math.round(hp)}/${Math.round(maxHp)} · ENG ${Math.round(eng)}/${Math.round(maxEng)}</small></div>
          <span class="${hp>0?'ok':'down'}">${hp>0?'Apto':'Desmaiado'}</span>
        </article>`;
      }).join(''):'<div class="player-team-empty">Este personagem ainda não possui Relians.</div>';
    }
  }

  const teamTotal=fixed?.character?.team?.length||0;
  const teamAlive=fixed?aliveTeam(fixed).length:0;
  const credits=Math.max(0,Number(fixed?.character?.credits)||0);
  const map={
    playerStatBattles:stats.battles,playerStatWins:stats.wins,playerStatLosses:stats.losses,
    playerStatCaptures:stats.captures,playerStatEscapes:stats.escapes,playerStatTrainerWins:stats.trainerWins||0,
    playerStatCredits:credits,playerStatRank:rank.name,playerEconomyCredits:`${credits.toLocaleString('pt-BR')} C$`,
    playerEconomyRank:rank.name,playerEconomyTeam:`${teamAlive}/${teamTotal}`
  };
  Object.entries(map).forEach(([id,v])=>{const e=$(id);if(e)e.textContent=v});
  const progressText=$('playerRankProgressText');if(progressText)progressText.textContent=rank.text;
  const progressBar=$('playerRankProgressBar');if(progressBar)progressBar.style.width=`${rank.percent}%`;
}
function openPlayerPage(){
  const btn=document.querySelector('.tab[data-tab="playerPage"]');if(btn)btn.click();
  setTimeout(renderPlayerPage,0);
}
function chooseTeamForGenerated(g,charSheet){
  const candidates=aliveTeam(charSheet);
  if(!candidates.length){openPlayerPage();alert('O personagem definido não possui nenhum Relian apto para lutar.');return}
  document.querySelector('.battle-start-overlay')?.remove();
  const over=document.createElement('div');over.className='battle-switch-overlay battle-start-overlay';
  over.innerHTML=`<div class="card battle-switch-dialog"><div><div class="section-kicker">INICIAR BATALHA</div><h2>Escolha seu Relian</h2><p>${escapeHtml(charSheet.character?.name||'Seu personagem')} enfrentará ${escapeHtml(g.r?.name||'o Relian gerado')}.</p></div>
  <div class="battle-switch-list">${candidates.map(x=>{const sp=species(x.sheet.speciesId),img=imageFor(sp,x.sheet.color);return `<button type="button" class="battle-switch-choice player-team-choice" data-start-sheet="${escapeHtml(x.sheet.id)}">${img?`<img src="${escapeHtml(img)}" alt="">`:''}<span><b>${escapeHtml(x.member.nickname||x.sheet.nickname||sp?.name||'Relian')}</b><small>Nv. ${x.member.level||x.sheet.level} · HP ${Number(x.sheet.hpCurrent??x.sheet.hpMax??0)}/${Number(x.sheet.hpMax||0)}</small></span></button>`}).join('')}</div>
  <button type="button" data-cancel-start="1">Cancelar</button></div>`;
  document.body.appendChild(over);
  over.querySelectorAll('[data-start-sheet]').forEach(btn=>btn.onclick=()=>{
    const found=candidates.find(x=>String(x.sheet.id)===String(btn.dataset.startSheet));if(!found)return;
    const p=buildFromSaved(found.sheet,found.member,charSheet),e=buildFromGenerated(g);
    if(!p||!e){alert('Não foi possível montar os combatentes. Verifique as fichas e tente novamente.');return}
    over.remove();
    openBattleTab();
    requestAnimationFrame(()=>startBattle(p,e,`Encontro: ${e.nickname}`));
  });
  over.querySelector('[data-cancel-start]').onclick=()=>over.remove();
}


const BATTLE_ITEM_STORAGE='relians-battle-items-v1';
const RELIANS_OFFICIAL_ITEMS=[{"id":"notion-coleira-aromatizante","name":"Coleira Aromatizante","category":"equipamento","useType":"equipavel","effect":"passive_equipment","power":0,"price":150,"description":"Uma coleira leve e perfumada, infundida com extratos de flores relaxantes. Seu aroma constante acalma os Relians mais agitados, criando uma sensação de bem-estar e segurança.","effectText":"Aumenta a felicidade do Relian em 10% e o torna imune ao estado \"Rage\" enquanto estiver equipado.","note":"Ideal para manter o Relian calmo e focado em batalhas longas.","official":true},{"id":"notion-conjunto-de-cowboy","name":"Conjunto de Cowboy","category":"equipamento","useType":"equipavel","effect":"passive_equipment","power":0,"price":320,"description":"Um traje com estilo inspirado nos antigos domadores do oeste selvagem. Este conjunto carrega a coragem e destreza dos cowboys lendários, trazendo uma presença confiante e destemida ao campo de batalha.","effectText":"Aumenta +5 de Speed e +5 de Atk. Enquanto equipado, o Relian fica imune ao estado de cegueira.","note":"Perfeito para combates ofensivos e para manter o Relian resistente à cegueira.","official":true},{"id":"notion-botas-de-trilha","name":"Botas de Trilha","category":"equipamento","useType":"equipavel","effect":"passive_equipment","power":0,"price":380,"description":"Botas reforçadas com sola antiderrapante e tecido resistente ao calor. Feitas para quem percorre terrenos hostis com confiança e agilidade, elas protegem contra perigos e impulsionam o instinto ofensivo.","effectText":"Aumenta +6 de dano de Atq e +5 de Speed. Enquanto equipadas, tornam o Relian imune ao estado de queimadura.","note":"Excelente para melhorar ofensiva e resistência contra queimaduras em batalhas..","official":true},{"id":"notion-garra-de-batalha","name":"Garra de Batalha","category":"equipamento","useType":"equipavel","effect":"passive_equipment","power":0,"price":850,"description":"Uma garra metálica resistente que aumenta a precisão dos golpes físicos.","effectText":"Aumenta a precisão dos golpes físicos em 10%.","note":"Ótima escolha para builds físicas de contato direto.","official":true},{"id":"notion-emblema-espiritual","name":"Emblema Espiritual","category":"equipamento","useType":"equipavel","effect":"passive_equipment","power":0,"price":1100,"description":"Um medalhão antigo que ressoa com forças espirituais ocultas.","effectText":"Aumenta em 10% o dano de golpes Fantasma e Psíquico.","note":"Perfeito para ofensivas espirituais e mentais.","official":true},{"id":"notion-cinturao-titanico","name":"Cinturão Titânico","category":"equipamento","useType":"equipavel","effect":"passive_equipment","power":0,"price":1300,"description":"Um cinturão forjado por grandes guerreiros, imbuído com energia bruta.","effectText":"Aumenta o Ataque em 10%, mas reduz a Velocidade em 5%.","note":"Potencializa dano bruto com leve custo de agilidade.","official":true},{"id":"notion-pena-da-alma-dos-ventos","name":"Pena da Alma dos Ventos","category":"equipamento","useType":"equipavel","effect":"passive_equipment","power":0,"price":1200,"description":"Uma pena brilhante que carrega a essência dos ventos velozes.","effectText":"Aumenta a velocidade do Relian em 15%, mas reduz sua Defesa em 10%.","note":"Ideal para estratégias de esquiva ou ofensiva rápida.","official":true},{"id":"notion-espada-quebrada","name":"Espada Quebrada","category":"equipamento","useType":"equipavel","effect":"passive_equipment","power":0,"price":950,"description":"Uma espada quebrada imbuída com a energia do herói.","effectText":"Aumenta em 10% o dano de golpes do tipo Herói.","note":"Item temático e eficaz para builds heroicas.","official":true},{"id":"notion-dente-de-dragao","name":"Dente de Dragão","category":"equipamento","useType":"equipavel","effect":"passive_equipment","power":0,"price":1400,"description":"O dente de um dragão ancião imbuído com energia ancestral e dracônica.","effectText":"Aumenta em 10% o dano de golpes do tipo Dragão e Ancião.","note":"Poder híbrido para ofensiva mística.","official":true},{"id":"notion-buzina-de-guerra","name":"Buzina de Guerra","category":"equipamento","useType":"equipavel","effect":"passive_equipment","power":0,"price":1100,"description":"Uma pequena buzina que emite um som intenso e motivador.","effectText":"Aumenta 5% o Ataque e a Defesa do Relian que a segura.","note":"Suporte equilibrado, ideal para tanques ofensivos.","official":true},{"id":"notion-orbe-magico","name":"Orbe Mágico","category":"equipamento","useType":"equipavel","effect":"passive_equipment","power":0,"price":1200,"description":"Uma esfera de energia pura, contendo um grande poder mágico.","effectText":"Aumenta em 10% o Sp. Atq do Relian que a segura.","note":"Simples e eficaz para builds especiais.","official":true},{"id":"notion-manopla-titanica","name":"Manopla Titânica","category":"equipamento","useType":"equipavel","effect":"passive_equipment","power":0,"price":1300,"description":"Uma manopla pesada, feita para golpes devastadores.","effectText":"Aumenta o Ataque em 10%, mas reduz a Velocidade em 5%.","note":"Variante da Titan Belt, com estética mais ofensiva.","official":true},{"id":"notion-nucleo-flamejante","name":"Núcleo Flamejante","category":"equipamento","useType":"equipavel","effect":"passive_equipment","power":0,"price":1350,"description":"Um núcleo incandescente que pulsa com calor intenso.","effectText":"Aumenta em 10% o dano de golpes do tipo Fogo.","note":"Essencial para ofensivas ígneas.","official":true},{"id":"notion-manto-aereo","name":"Manto Aéreo","category":"equipamento","useType":"equipavel","effect":"passive_equipment","power":0,"price":1000,"description":"Um tecido encantador que facilita o fluxo do ar ao redor do usuário.","effectText":"Aumenta em 5% a velocidade e reduz em 5% o dano recebido de golpes do tipo Voador.","note":"Leve e defensivo contra alvos voadores.","official":true},{"id":"notion-presa-venenosa","name":"Presa Venenosa","category":"equipamento","useType":"equipavel","effect":"passive_equipment","power":0,"price":1300,"description":"Descrição: Um dente envenenado que carrega um poderoso veneno.","effectText":"Golpes do tipo Venenoso têm 20% de chance extra de envenenar.","note":"Item tático com grande valor para dano residual.","official":true},{"id":"notion-faixa-fantasma","name":"Faixa Fantasma","category":"equipamento","useType":"equipavel","effect":"passive_equipment","power":0,"price":1800,"description":"Faixa leve feita com tecido especial que vibra ao detectar perigo.","effectText":"Aumenta a chance de esquiva em +15%; se o Relian esquivar de todos os ataques em uma batalha, recebe +30 de EXP bônus.","note":"Excelente para jogadores que apostam em evasão.","official":true},{"id":"notion-nucleo-neural","name":"Núcleo Neural","category":"equipamento","useType":"equipavel","effect":"passive_equipment","power":0,"price":1500,"description":"Fragmento sintético conectado ao sistema nervoso do Relian, estimulando capacidades mentais.","effectText":"Aumenta o Ataque Especial em 25% durante as batalhas.","note":"Potente para ofensivas mágicas puras.","official":true},{"id":"notion-nucleo-neural-fogo","name":"Núcleo Neural: Fogo","category":"equipamento","useType":"equipavel","effect":"passive_equipment","power":0,"price":2200,"description":"Versão modificada que canaliza energia térmica, ampliando ataques do tipo Fogo.","effectText":"Aumenta o Ataque Especial em 40%, mas apenas para ataques do tipo Fogo.","note":"Especialização extrema com alto poder elemental.","official":true},{"id":"notion-nucleo-neural-tempestade","name":"Núcleo Neural: Tempestade","category":"equipamento","useType":"equipavel","effect":"passive_equipment","power":0,"price":2200,"description":"Sintonizado com descargas elétricas, amplifica ataques do tipo Elétrico.","effectText":"Aumenta o Ataque Especial em 40% para ataques do tipo Elétrico.","note":"Letal em equipes elétricas focadas em burst.","official":true},{"id":"notion-sobrecarga-neural","name":"Sobrecarga Neural","category":"equipamento","useType":"equipavel","effect":"passive_equipment","power":0,"price":2800,"description":"Implante que força o limite cerebral do Relian, desbloqueando seu poder arcano.","effectText":"Aumenta o Ataque Especial em 50%, mas reduz a Resistência em 10%.","note":"Item de alta raridade. Ideal para estratégias agressivas.","official":true},{"id":"notion-nucleo-neural-adaptativo","name":"Núcleo Neural Adaptativo","category":"equipamento","useType":"equipavel","effect":"passive_equipment","power":0,"price":2600,"description":"Este núcleo se adapta ao elemento dominante do Relian, amplificando ataques especiais com precisão.","effectText":"Aumenta o Ataque Especial em 30%, e o tipo de aumento varia com o elemento do usuário.","note":"Versátil, excelente para times variados.","official":true},{"id":"notion-martelo-justiceiro","name":"Martelo Justiceiro","category":"equipamento","useType":"equipavel","effect":"passive_equipment","power":0,"price":880,"description":"Um pesado martelo cerimonial utilizado por antigos juízes nômades nas terras do norte. Seu cabo é gravado com runas que brilham ao julgar injustiças.","effectText":"Um item antigo usado em antigas guerras, dá ao Relian um potencial de dano de +30% de dano.","note":"Item raro e simbólico, muito valorizado por colecionadores de artefatos históricos.","official":true},{"id":"notion-manto-de-marcacao-sombria","name":"Manto de marcação sombria","category":"equipamento","useType":"equipavel","effect":"passive_equipment","power":0,"price":0,"description":". . .","effectText":"...","note":"...","official":true},{"id":"notion-dispersor-de-nevoa","name":"Dispersor de névoa","category":"equipamento","useType":"equipavel","effect":"passive_equipment","power":0,"price":0,"description":". . .","effectText":"...","note":"...","official":true},{"id":"notion-casca-magica","name":"Casca Mágica","category":"equipamento","useType":"equipavel","effect":"passive_equipment","power":0,"price":1400,"description":"Uma casca encantada imbuída de energia arcana, criada para absorver parte do impacto de ataques baseados em poder especial.","effectText":"Reduz em 20% todo o dano especial recebido pelo Relian enquanto o item estiver equipado.","note":"Especialmente útil contra oponentes focados em ataques elementais ou estratégias mágicas ofensivas.","official":true},{"id":"notion-orvalho-solar","name":"Orvalho Solar","category":"recuperacao","useType":"equipavel","effect":"passive_equipment","power":0,"price":280,"description":"Uma gota de orvalho carregada com a luz do sol nascente.","effectText":"No início de cada turno, restaura 5% do HP se o clima estiver ensolarado.","note":"Útil em equipes que controlam o clima.","official":true},{"id":"notion-nucleo-de-obsidiana","name":"Núcleo de Obsidiana","category":"recuperacao","useType":"equipavel","effect":"passive_equipment","power":0,"price":410,"description":"Um cristal negro denso que fortalece o corpo do portador.","effectText":"Reduz em 15% o dano recebido de golpes Físicos, mas reduz em 10% a Velocidade.","note":"Ótimo para tanques físicos, com custo estratégico em mobilidade.","official":true},{"id":"notion-runa-curativa","name":"Runa Curativa","category":"recuperacao","useType":"equipavel","effect":"passive_equipment","power":0,"price":320,"description":"Uma pequena pedra com inscrições místicas que restauram energia.","effectText":"Cura 25% do HP caso o usuário entre em estado crítico (abaixo de 25% de HP). Só ativa uma vez por batalha.","note":"Ideal para prolongar a vida de Relians frágeis.","official":true},{"id":"notion-coleira-aromatizada","name":"Coleira Aromatizada","category":"recuperacao","useType":"equipavel","effect":"passive_equipment","power":0,"price":230,"description":"Uma coleira perfumada que estimula os sentidos do Relian.","effectText":"Aumenta 5% a Velocidade e 5% a evasão.","note":"Boa escolha para estilos evasivos.","official":true},{"id":"notion-doce-infinito","name":"Doce Infinito","category":"recuperacao","useType":"equipavel","effect":"passive_equipment","power":0,"price":500,"description":"Um doce encantado que regenera a energia vital do Relian que o segura.","effectText":"Recupera 5% da Vida a cada turno.","note":"Item raro e muito cobiçado por sua regeneração constante.","official":true},{"id":"notion-remedio-critico","name":"Remédio Crítico","category":"recuperacao","useType":"equipavel","effect":"passive_equipment","power":0,"price":340,"description":"Um medicamento especial que ativa apenas em momentos críticos.","effectText":"Se o Relian receber um golpe crítico, ele cura todas as condições negativas imediatamente.","note":"Contramedida excelente contra adversários com builds focadas em crítico.","official":true},{"id":"notion-flor-doce","name":"Flor Doce","category":"recuperacao","useType":"equipavel","effect":"passive_equipment","power":0,"price":290,"description":"Uma flor que exala um aroma suave e revitalizante.","effectText":"Recupera 3% da Vida a cada turno.","note":"Regeneração mais modesta que o Infinity Candy, mas ainda útil em combates longos.","official":true},{"id":"notion-flor-da-graca","name":"Flor da Graça","category":"recuperacao","useType":"equipavel","effect":"passive_equipment","power":0,"price":350,"description":"Uma flor rara que floresce apenas sob o brilho do sol puro. Seu aroma suave acalma até os corações mais agitados e revitaliza quem a inala. Dizem que ela só é encontrada onde Relians gentis descansam.","effectText":"Restaura 20 de energia e remove 1 efeito negativo do Relian (como envenenamento, lentidão ou cegueira leve).","note":"Item de suporte eficaz e versátil para curas pontuais.","official":true},{"id":"notion-espelho-da-ilusao","name":"Espelho da Ilusão","category":"especial","useType":"especial","effect":"special","power":0,"price":1800,"description":"Um espelho encantado que distorce a percepção do adversário.","effectText":"Anula os efeitos secundários de golpes Psíquicos (como confusão ou redução de status).","note":"Ideal contra times com forte controle psíquico.","official":true},{"id":"notion-semente-do-tempo","name":"Semente do Tempo","category":"especial","useType":"especial","effect":"special","power":0,"price":2100,"description":"Uma semente rara que acelera o usuário gradualmente.","effectText":"Ganha +5% de Velocidade por turno (até +25%).","note":"Brilha em batalhas longas.","official":true},{"id":"notion-pedra-lunar","name":"Pedra Lunar","category":"especial","useType":"especial","effect":"special","power":0,"price":1900,"description":"Pedra imbuída com energia cósmica, é capaz de evoluir Relians que dependem da energia da lua.","effectText":"Reduz em 10% o dano de golpes Cósmicos e Psíquicos.","note":"Boa escolha para tanques místicos.","official":true},{"id":"notion-balao-gasificado","name":"Balão Gasificado","category":"especial","useType":"especial","effect":"special","power":0,"price":1500,"description":"Balão leve que melhora agilidade.","effectText":"+15% de Velocidade, -5% de Defesa.","note":"Perfeito para iniciadores velozes.","official":true},{"id":"notion-ambar-antigo","name":"Âmbar Antigo","category":"especial","useType":"especial","effect":"special","power":0,"price":2200,"description":"Âmbar ancestral carregado de poder.","effectText":"+10% de dano para ataques do tipo Âmbar e Ancião.","note":"Imprescindível para builds ancestrais.","official":true},{"id":"notion-sorvete-nevado","name":"Sorvete Nevado","category":"especial","useType":"especial","effect":"special","power":0,"price":1600,"description":"Sorvete geladíssimo com energia congelante.","effectText":"+10% de resistência a golpes do tipo Gelo.","note":"Essencial para tanques contra Gelo.","official":true},{"id":"notion-sino-do-eco","name":"Sino do Eco","category":"especial","useType":"especial","effect":"special","power":0,"price":1700,"description":"Sino que vibra com frequência sonora especial.","effectText":"+10% de dano para golpes do tipo Som.","note":"Potencializa builds baseadas em Som.","official":true},{"id":"notion-tecido-espiritual","name":"Tecido Espiritual","category":"especial","useType":"especial","effect":"special","power":0,"price":1600,"description":"Tecido etéreo carregado com energia fantasma.","effectText":"+10% de resistência a ataques Fantasma.","note":"Proteção sutil contra espectros.","official":true},{"id":"notion-semente-de-magma","name":"Semente de Magma","category":"especial","useType":"especial","effect":"special","power":0,"price":1800,"description":"Semente que reage com calor ao contato com Água.","effectText":"Reduz em 10% o dano de golpes do tipo Água.","note":"Boa resposta defensiva para tipos opostos.","official":true},{"id":"notion-pena-corrompida","name":"Pena Corrompida","category":"especial","useType":"especial","effect":"special","power":0,"price":2000,"description":"Pena negra carregada de energia sombria.","effectText":"Golpes do tipo Sombrio têm 20% de chance de reduzir a Defesa inimiga.","note":"Brilhante em ofensivas debilitantes.","official":true},{"id":"notion-cartao-de-evolucao","name":"Cartão de Evolução","category":"evolucao","useType":"especial","effect":"evolution_special","power":0,"price":1800,"description":"Um cartão de memória contendo dados para evoluir um Relian antivírus chamado K4bytric.","effectText":"Necessário para a evolução de K4bytric.","note":"Item exclusivo para evolução específica, uso único.","official":true},{"id":"notion-gema-celestial","name":"Gema Celestial","category":"evolucao","useType":"especial","effect":"evolution_special","power":0,"price":2200,"description":"Um fragmento brilhante de uma estrela cadente.","effectText":"Necessário para evoluir certos Relians do tipo Cósmico.","note":"Raro, essencial para cósmicos de alto nível.","official":true},{"id":"notion-chip-metalico","name":"Chip Metálico","category":"evolucao","useType":"especial","effect":"evolution_special","power":0,"price":2000,"description":"Um pequeno processador reforçado com liga metálica.","effectText":"Necessário para evoluir certos Relians do tipo Aço.","note":"Componente técnico para evolução de tipos metálicos.","official":true},{"id":"notion-amuleto-de-aprendizado","name":"Amuleto de Aprendizado","category":"evolucao","useType":"especial","effect":"evolution_special","power":0,"price":3000,"description":"Um pingente antigo com símbolos de sabedoria gravados em sua superfície.","effectText":"Enquanto equipado, o Relian recebe +30 de XP extra após qualquer vitória ou captura.","note":"Excelente para acelerar treinamento.","official":true},{"id":"notion-headset-de-batalha","name":"Headset de Batalha","category":"evolucao","useType":"especial","effect":"evolution_special","power":0,"price":2700,"description":"Um fone de ouvido de alta tecnologia usado por treinadores experientes.","effectText":"Se o Relian vencer sem sofrer dano, recebe +50 de XP bônus. Caso sofra dano, perde -20 de XP do total obtido na batalha.","note":"Recompensador, porém arriscado.","official":true},{"id":"notion-nucleo-igneo","name":"Núcleo Ígneo","category":"evolucao","useType":"especial","effect":"evolution_special","power":0,"price":2000,"description":"Fragmento concentrado de energia térmica colhida de zonas vulcânicas.","effectText":"Evolui o Slugus para Slugartifes, especializado em ambientes extremos e ataques flamejantes.","note":"Essencial para acessar a forma de fogo do Slugus.","official":true},{"id":"notion-nucleo-hidrodinamico","name":"Núcleo Hidrodinâmico","category":"evolucao","useType":"especial","effect":"evolution_special","power":0,"price":2000,"description":"Núcleo líquido estabilizado com propriedades adaptativas e pressão extrema.","effectText":"Evolui o Slugus para Sluvulet, mestre das profundezas e da furtividade submersa.","note":"Recomendado para treinos aquáticos e defensivos.","official":true},{"id":"notion-nucleo-nutritivo","name":"Núcleo Nutritivo","category":"evolucao","useType":"especial","effect":"evolution_special","power":0,"price":2000,"description":"Essência orgânica extraída de florestas antigas e criaturas regenerativas.","effectText":"Evolui o Slugus para Slugorge, com habilidades de cura e controle territorial.","note":"Preferido por treinadores que priorizam suporte e durabilidade.","official":true},{"id":"notion-nucleo-obscuro","name":"Núcleo Obscuro","category":"evolucao","useType":"especial","effect":"evolution_special","power":0,"price":2000,"description":"Cristal sombrio formado em zonas corrompidas por dados instáveis.","effectText":"Evolui o Slugus para Slugshade, rápido, furtivo e difícil de detectar.","note":"Ideal para estratégias ofensivas e evasivas.","official":true},{"id":"notion-nucleo-sagrado","name":"Núcleo Sagrado","category":"evolucao","useType":"especial","effect":"evolution_special","power":0,"price":2000,"description":"Núcleo luminoso purificado em templos de dados sagrados.","effectText":"Evolui o Slugus para Slugsaint, com habilidades de suporte e buffs brilhantes.","note":"Sua luz purifica aliados e cega oponentes.","official":true},{"id":"notion-nucleo-cibernetico","name":"Núcleo Cibernético","category":"evolucao","useType":"especial","effect":"evolution_special","power":0,"price":2000,"description":"Chip de evolução com fragmentos de códigos de IA avançada.","effectText":"Evolui o Slugus para Sluguinv, com ataques de precisão e análise tática.","note":"Compatível com sistemas digitais e ambientes urbanos.","official":true},{"id":"notion-cerda-brilhante","name":"Cerda Brilhante","category":"evolucao","useType":"especial","effect":"evolution_special","power":0,"price":3000,"description":"Um filamento iridescente encontrado em Slugus especiais que brilha sob a luz da lua digital.","effectText":"Evolui o Slugus para Eclipscug, uma forma rara e misteriosa que caminha entre luz e sombra.","note":"Reage apenas com Slugus de cor especial. Seu brilho oscila como um eclipse.","official":true},{"id":"notion-estilhaco-cosmico","name":"Estilhaço Cósmico","category":"evolucao","useType":"especial","effect":"evolution_special","power":0,"price":950,"description":"Fragmento raro de um meteorito que caiu nas profundezas do pântano congelado. Ele pulsa com uma energia estranha e instável.","effectText":"Usado para evoluir certos Relians do tipo Cósmico ou criar equipamentos de alto nível.","note":"Item extremamente raro, procurado por cientistas e místicos.","official":true},{"id":"notion-vitalix","name":"Vitalix","category":"vitamina","useType":"consumivel","effect":"special","power":0,"price":800,"description":"...","effectText":"Aumenta o HP máximo em 15% por 5 turnos.","note":"...","official":true},{"id":"notion-enerboost-c","name":"Enerboost C","category":"vitamina","useType":"consumivel","effect":"special","power":0,"price":750,"description":"...","effectText":"Aumenta a Energia máxima em 20% por 6 turnos.","note":"...","official":true},{"id":"notion-enerboost-b","name":"Enerboost B","category":"vitamina","useType":"consumivel","effect":"special","power":0,"price":1200,"description":"...","effectText":"Aumenta a Energia máxima em 40% por 4 turnos.","note":"...","official":true},{"id":"notion-enerboost-a","name":"Enerboost A","category":"vitamina","useType":"consumivel","effect":"special","power":0,"price":1500,"description":"...","effectText":"Aumenta a Energia máxima em 60% por 2 turnos.","note":"...","official":true},{"id":"notion-power-punch","name":"Power Punch","category":"vitamina","useType":"consumivel","effect":"special","power":0,"price":950,"description":"...","effectText":"Aumenta o Ataque físico em 10% por 5 turnos.","note":"...","official":true},{"id":"notion-iron-core","name":"Iron Core","category":"vitamina","useType":"consumivel","effect":"defense_up","power":10,"price":950,"description":"...","effectText":"Aumenta a Defesa física em 10% por 5 turnos.","note":"...","official":true},{"id":"notion-guardian-essence","name":"Guardian Essence","category":"vitamina","useType":"consumivel","effect":"special","power":0,"price":1100,"description":"...","effectText":"Aumenta a Passiva em 15% por 5 turnos.","note":"...","official":true},{"id":"notion-arcane-dew","name":"Arcane Dew","category":"vitamina","useType":"consumivel","effect":"special","power":0,"price":950,"description":"...","effectText":"Aumenta o Ataque mágico em 10% por 5 turnos.","note":"...","official":true},{"id":"notion-mystic-shield","name":"Mystic Shield","category":"vitamina","useType":"consumivel","effect":"defense_up","power":10,"price":950,"description":"...","effectText":"Aumenta a Defesa mágica em 10% por 5 turnos.","note":"...","official":true},{"id":"notion-swift-boost","name":"Swift Boost","category":"vitamina","useType":"consumivel","effect":"special","power":0,"price":1000,"description":"...","effectText":"Aumenta a Velocidade em 15% por 5 turnos.","note":"...","official":true},{"id":"notion-revive-elixir","name":"Revive Elixir","category":"medicamento","useType":"consumivel","effect":"revive_percent","power":50,"price":2500,"description":"...","effectText":"Revive um Relian com 50% da vida.","note":"Item raro, muito valioso para batalhas.","official":true},{"id":"notion-healing-salve","name":"Healing Salve","category":"medicamento","useType":"consumivel","effect":"heal_percent_hp","power":30,"price":850,"description":"...","effectText":"Recupera 30% da vida de um Relian.","note":"Item comum e confiável para recuperação.","official":true},{"id":"notion-energy-drink","name":"Energy Drink","category":"medicamento","useType":"consumivel","effect":"special","power":0,"price":1200,"description":"...","effectText":"Aumenta 30% da velocidade por 5 turnos.","note":"Bom para dar impulso temporário na velocidade.","official":true},{"id":"notion-antidote","name":"Antidote","category":"medicamento","useType":"consumivel","effect":"special","power":0,"price":300,"description":"...","effectText":"Remove o status de envenenado.","note":"Item básico essencial para curar veneno.","official":true},{"id":"notion-potion-of-the-ancients","name":"Potion of the Ancients","category":"medicamento","useType":"consumivel","effect":"heal_percent_hp","power":50,"price":3000,"description":"...","effectText":"Recupera 50% da vida e aumenta 15% da defesa por 3 turnos.","note":"Raro, excelente para defesa e cura.","official":true},{"id":"notion-power-elixir","name":"Power Elixir","category":"medicamento","useType":"consumivel","effect":"special","power":0,"price":2200,"description":"...","effectText":"Aumenta o Ataque e Ataque Especial em 15% por 5 turnos.","note":"Ótimo para aumentar o poder ofensivo.","official":true},{"id":"notion-status-balm","name":"Status Balm","category":"medicamento","useType":"consumivel","effect":"full_cure","power":0,"price":1200,"description":"...","effectText":"Remove todos os status negativos, exceto paralisia.","note":"Útil para recuperar rapidamente o Relian.","official":true},{"id":"notion-quick-heal","name":"Quick Heal","category":"medicamento","useType":"consumivel","effect":"heal_percent_hp","power":20,"price":600,"description":"...","effectText":"Recupera 20% da vida imediatamente.","note":"Item barato para curas rápidas.","official":true},{"id":"notion-mystic-tonic","name":"Mystic Tonic","category":"medicamento","useType":"consumivel","effect":"heal_percent_hp","power":10,"price":1400,"description":"...","effectText":"Recupera 10% da vida e aumenta o Ataque Especial em 10% por 3 turnos.","note":"Ideal para magos e ataques especiais.","official":true},{"id":"notion-mana-potion","name":"Mana Potion","category":"medicamento","useType":"consumivel","effect":"heal_percent_eng","power":30,"price":1000,"description":"...","effectText":"Restaura 30% da energia de habilidades especiais.","note":"Essencial para quem usa muitos ataques especiais.","official":true},{"id":"notion-power-drop","name":"Power Drop","category":"medicamento","useType":"consumivel","effect":"heal_eng","power":20,"price":700,"description":"...","effectText":"Recupera 20 pontos de energia.","note":"Recuperação rápida de energia.","official":true},{"id":"notion-mega-power-elixir","name":"Mega Power Elixir","category":"medicamento","useType":"consumivel","effect":"heal_eng","power":100,"price":2500,"description":"...","effectText":"Restaura 100 pontos de energia.","note":"Versão aprimorada para muita energia.","official":true},{"id":"notion-ultimate-power-elixir","name":"Ultimate Power Elixir","category":"medicamento","useType":"consumivel","effect":"special","power":0,"price":3800,"description":"...","effectText":"Restaura toda a energia do Relian, incluindo bônus.","note":"Item raro e valioso, essencial para combates difíceis.","official":true},{"id":"notion-ovo-de-dojor","name":"Ovo de Dojor","category":"item_vivo","useType":"especial","effect":"evolution_special","power":0,"price":2700,"description":"...","effectText":"Aumenta a Defesa Física e Mágica em 10%. Para Relians do tipo Voador ou Ancião, o bônus sobe para 15%. Se o HP ficar abaixo de 30%, reduz o dano recebido em 25% por 1 turno.","note":"Ótimo para defesa prolongada, especialmente para tipos Voador e Ancião.","official":true},{"id":"notion-broto-de-floralis","name":"Broto de Floralis","category":"item_vivo","useType":"especial","effect":"evolution_special","power":0,"price":2400,"description":"...","effectText":"Regenera 5% do HP no final de cada turno. Se o Relian for do tipo Planta ou Fada, a regeneração aumenta para 8%.","note":"Excelente para sustain, especialmente para tipos Planta e Fada.","official":true},{"id":"notion-casulo-de-sedacoon","name":"Casulo de Sedacoon","category":"item_vivo","useType":"especial","effect":"evolution_special","power":0,"price":3000,"description":"...","effectText":"Aumenta Defesa Física e Mágica em 10%. Para tipos Seda ou Pedra, concede 20% de resistência contra ataques superefetivos.","note":"Item defensivo forte, ideal para tipos Seda e Pedra.","official":true},{"id":"notion-fragmento-de-carvao-vivo","name":"Fragmento de Carvão Vivo","category":"item_vivo","useType":"especial","effect":"evolution_special","power":0,"price":2800,"description":"...","effectText":"Aumenta o dano de golpes do tipo Fogo em 15%. Se o HP ficar abaixo de 30%, o dano de Fogo ganha +10% por 2 turnos.","note":"Potencializador poderoso para tipos Fogo.","official":true},{"id":"notion-ovo-de-pyrakeet","name":"Ovo de Pyrakeet","category":"item_vivo","useType":"especial","effect":"evolution_special","power":0,"price":2500,"description":"...","effectText":"Aumenta Velocidade em 10%. Para tipos Voador ou Fogo, ataques de vento ganham +10% de dano.","note":"Acelera e potencializa ataques baseados em vento.","official":true},{"id":"notion-perola-mistica-de-ondry","name":"Pérola Mística de Ondry","category":"item_vivo","useType":"especial","effect":"evolution_special","power":0,"price":2600,"description":"...","effectText":"Aumenta Ataque Mágico em 12%. Para tipos Água ou Psíquico, reduz o custo de Energia dos movimentos em 10%.","note":"Favorece magos e tipos Psíquico/Água com economia de energia.","official":true},{"id":"notion-banaxe","name":"Banaxé","category":"alimento","useType":"consumivel","effect":"heal_percent_hp","power":15,"price":400,"description":"...","effectText":"Recupera 15% do HP e reduz chance de sono por 3 turnos.","note":"Uma fruta de sabor: (Doce)","official":true},{"id":"notion-pitayano","name":"Pitayano","category":"alimento","useType":"consumivel","effect":"special","power":0,"price":450,"description":"...","effectText":"Aumenta o Ataque Mágico por 4 turnos.","note":"Uma fruta de sabor: (Doce)","official":true},{"id":"notion-guaraxi","name":"Guaraxi","category":"alimento","useType":"consumivel","effect":"heal_percent_eng","power":30,"price":550,"description":"...","effectText":"Recupera 30% da Energia e aumentar a Velocidade por 2 turnos.","note":"Uma fruta de sabor: (Doce)","official":true},{"id":"notion-tamaruja","name":"Tamaruja","category":"alimento","useType":"consumivel","effect":"full_cure","power":0,"price":600,"description":"...","effectText":"Remove status negativos e aumenta Passiva em 1 estágio.","note":"Uma fruta de sabor: (Doce) (Relaxante)","official":true},{"id":"notion-sirigoti","name":"Sirigoti","category":"alimento","useType":"consumivel","effect":"special","power":0,"price":580,"description":"...","effectText":"Reduz dano recebido de golpes do tipo Som por 3 turnos.","note":"Uma fruta de sabor: (Doce) (Relaxante)","official":true},{"id":"notion-uvitara","name":"Uvitara","category":"alimento","useType":"consumivel","effect":"special","power":0,"price":470,"description":"...","effectText":"Recupera um pouco de Energia e reduz o efeito de Queimaduras.","note":"Uma fruta de sabor: (Azedo) (Refrescante)","official":true},{"id":"notion-limoquara","name":"Limoquara","category":"alimento","useType":"consumivel","effect":"special","power":0,"price":520,"description":"...","effectText":"Diminui o Ataque Físico do inimigo ao ser consumido.","note":"Uma fruta de sabor: (Ácido) (Relaxante)","official":true},{"id":"notion-camburiti","name":"Camburiti","category":"alimento","useType":"consumivel","effect":"defense_up","power":2,"price":530,"description":"...","effectText":"Aumenta a Defesa Mágica por 3 turnos.","note":"Uma fruta de sabor: (Ácido) (Refrescante)","official":true},{"id":"notion-arajucaba","name":"Arajucaba","category":"alimento","useType":"consumivel","effect":"heal_percent_hp","power":20,"price":600,"description":"...","effectText":"Cura 20% do HP e aumenta resistência contra golpes do tipo Fungo.","note":"Uma fruta de sabor: (Ácido)","official":true},{"id":"notion-pequia","name":"Pequiá","category":"alimento","useType":"consumivel","effect":"special","power":0,"price":480,"description":"...","effectText":"Reduz velocidade do oponente se atingido por golpe direto.","note":"Uma fruta de sabor: (Ácido)","official":true},{"id":"notion-pitainga","name":"Pitainga","category":"alimento","useType":"consumivel","effect":"special","power":0,"price":550,"description":"...","effectText":"Aumenta o Ataque Físico em 1 estágio por 3 turnos.","note":"Uma fruta de sabor: (Picante)","official":true},{"id":"notion-aceranero","name":"Aceranero","category":"alimento","useType":"consumivel","effect":"special","power":0,"price":620,"description":"...","effectText":"Dá resistência a golpes do tipo Ancião e reduz chance de confusão.","note":"Uma fruta de sabor: (Picante) (Ácido)","official":true},{"id":"notion-cupuanha","name":"Cupuanha","category":"alimento","useType":"consumivel","effect":"defense_up","power":2,"price":580,"description":"...","effectText":"Aumenta Ataque e Velocidade por 2 turnos, mas reduz Defesa.","note":"Uma fruta de sabor: (Doce) (Picante)","official":true},{"id":"notion-murupira","name":"Murupira","category":"alimento","useType":"consumivel","effect":"special","power":0,"price":600,"description":"...","effectText":"Dá imunidade contra golpes do tipo Gás por 3 turnos.","note":"Uma fruta de sabor: (Picante)","official":true},{"id":"notion-pimentaja","name":"Pimentajá","category":"alimento","useType":"consumivel","effect":"defense_up","power":2,"price":570,"description":"...","effectText":"Aumenta a passiva em 1 estágio, mas diminui a Defesa Mágica.","note":"Uma fruta de sabor: (Doce) (Picante)","official":true},{"id":"notion-castacu","name":"Castacu","category":"alimento","useType":"consumivel","effect":"special","power":0,"price":500,"description":"...","effectText":"Recupera HP e remove o efeito de Paralisia.","note":"Uma fruta de sabor: (Doce)","official":true},{"id":"notion-bacaja","name":"Bacajá","category":"alimento","useType":"consumivel","effect":"defense_up","power":2,"price":540,"description":"...","effectText":"Recupera energia e aumenta Defesa Física por 3 turnos.","note":"Uma fruta de sabor: (Picante)","official":true},{"id":"notion-jeniplex","name":"Jeniplex","category":"alimento","useType":"consumivel","effect":"heal_percent_hp","power":20,"price":600,"description":"...","effectText":"Cura 20% do HP e reduz dano de golpes do tipo Sombra.","note":"Uma fruta de sabor: (Doce) (Azedo)","official":true},{"id":"notion-mamocana","name":"Mamocana","category":"alimento","useType":"consumivel","effect":"full_cure","power":0,"price":580,"description":"...","effectText":"Recupera HP e reduz status negativos de velocidade.","note":"Uma fruta de sabor: (Doce) (Relaxante)","official":true},{"id":"notion-abacajuba","name":"Abacajuba","category":"alimento","useType":"consumivel","effect":"special","power":0,"price":620,"description":"...","effectText":"Aumenta o Ataque Mágico e recupera um pouco de Energia.","note":"Uma fruta de sabor: (Ácido) (Relaxante)","official":true},{"id":"notion-acerolix","name":"Acerolix","category":"alimento","useType":"consumivel","effect":"special","power":0,"price":530,"description":"...","effectText":"Recupera um pouco de HP e aumenta resistência a golpes do tipo Ancião por 3 turnos.","note":"Uma fruta de sabor: (Azeda)","official":true},{"id":"notion-pimentuva","name":"Pimentuva","category":"alimento","useType":"consumivel","effect":"defense_up","power":20,"price":650,"description":"...","effectText":"Aumenta Ataque Físico em 20% por 4 turnos, mas reduz Defesa.","note":"Uma fruta de sabor: (Picante) (Doce)","official":true},{"id":"notion-gravirola","name":"Gravirola","category":"alimento","useType":"consumivel","effect":"cure_burn","power":0,"price":600,"description":"...","effectText":"Cura 25% da Energia e reduz o efeito de queimaduras.","note":"Uma fruta de sabor: (Doce)","official":true},{"id":"notion-cajumel","name":"Cajumel","category":"alimento","useType":"consumivel","effect":"full_cure","power":0,"price":570,"description":"...","effectText":"Recupera um pouco de HP e remove status negativos.","note":"Uma fruta de sabor: (Doce) (Azedo)","official":true},{"id":"notion-buritano","name":"Buritano","category":"alimento","useType":"consumivel","effect":"defense_up","power":15,"price":540,"description":"...","effectText":"Aumenta Defesa Física em 15% por 3 turnos.","note":"Uma fruta de sabor: (Neutro)","official":true},{"id":"notion-tucanjuba","name":"Tucanjuba","category":"alimento","useType":"consumivel","effect":"special","power":0,"price":500,"description":"...","effectText":"Recupera energia rapidamente, mas reduz a velocidade em 1 estágio.","note":"Uma fruta de sabor: (Amarga)","official":true},{"id":"notion-maracrix","name":"Maracrix","category":"alimento","useType":"consumivel","effect":"full_cure","power":0,"price":620,"description":"...","effectText":"Reduz chance de entrar em estados negativos como Confusão ou Medo.","note":"Uma fruta de sabor: (Azeda) (Relaxante)","official":true},{"id":"notion-cupulex","name":"Cupulex","category":"alimento","useType":"consumivel","effect":"special","power":0,"price":600,"description":"...","effectText":"Aumenta a velocidade em 2 estágios por 3 turnos.","note":"Uma fruta de sabor: (Doce) (Energético)","official":true},{"id":"notion-jabutropic","name":"Jabutropic","category":"alimento","useType":"consumivel","effect":"special","power":0,"price":580,"description":"...","effectText":"Reduz dano recebido de golpes do tipo Fogo e recupera HP levemente.","note":"Uma fruta de sabor: (Doce) (Refrescante)","official":true},{"id":"notion-cocogrande","name":"Cocogrande","category":"alimento","useType":"consumivel","effect":"heal_percent_eng","power":50,"price":700,"description":"...","effectText":"Recupera 50% da Energia e reduz os efeitos de Desidratação.","note":"Uma fruta de sabor: (Neutro)","official":true},{"id":"notion-melanjaca","name":"Melanjaca","category":"alimento","useType":"consumivel","effect":"heal_percent_hp","power":20,"price":620,"description":"...","effectText":"Recupera 20% do HP, mas reduz Precisão em 30% por 3 turnos. Se atingido por ataque de contato, efeito pegajoso pode ser transferido ao oponente.","note":"Uma fruta de sabor: (Doce)","official":true},{"id":"notion-cacaconde","name":"Cacaconde","category":"alimento","useType":"consumivel","effect":"full_cure","power":0,"price":680,"description":"...","effectText":"Remove status negativos e substituí por Fúria, aumentando Ataque em 2 estágios por 3 turnos.","note":"Uma fruta de sabor: (Amarga)","official":true},{"id":"notion-jacabati","name":"Jacabati","category":"alimento","useType":"consumivel","effect":"special","power":0,"price":600,"description":"...","effectText":"Aumenta a velocidade em 1 estágio ao ser consumida. Após, sobra a Caxiroa, que aumenta dano de ataques de contato do tipo Planta em 20%.","note":"Uma fruta de sabor: (Azedo)","official":true},{"id":"notion-tebaranana","name":"Tebaranana","category":"alimento","useType":"consumivel","effect":"heal_percent_eng","power":40,"price":640,"description":"...","effectText":"Recupera 40% da Energia, mas tem 50% de chance de causar Queimando no Usuário.","note":"Uma fruta de sabor: (Picante)","official":true},{"id":"datacubo-basico","name":"DataCubo Básico","category":"captura","useType":"consumivel","effect":"capture","power":0,"price":120,"description":"DataCubo de uso geral para capturar Relians selvagens.","effectText":"Permite tentativa de captura. Bônus de captura: +0%.","note":"Não funciona contra Relians de treinadores.","official":true,"captureBonus":0},{"id":"datacubo-reforcado","name":"DataCubo Reforçado","category":"captura","useType":"consumivel","effect":"capture","power":0,"price":300,"description":"DataCubo com contenção reforçada para alvos mais resistentes.","effectText":"Permite tentativa de captura. Bônus de captura: +12%.","note":"Não funciona contra Relians de treinadores.","official":true,"captureBonus":12},{"id":"datacubo-avancado","name":"DataCubo Avançado","category":"captura","useType":"consumivel","effect":"capture","power":0,"price":650,"description":"Modelo avançado com leitura automática do padrão energético do Relian.","effectText":"Permite tentativa de captura. Bônus de captura: +25%.","note":"Não funciona contra Relians de treinadores.","official":true,"captureBonus":25},{"id":"datacubo-prisma","name":"DataCubo Prisma","category":"captura","useType":"consumivel","effect":"capture","power":0,"price":1400,"description":"DataCubo raro de alta precisão, usado em encontros difíceis.","effectText":"Permite tentativa de captura. Bônus de captura: +40%.","note":"Não funciona contra Relians de treinadores.","official":true,"captureBonus":40}];
let battleActionView='none';

function loadBattleItems(){
  let custom=[];
  try{
    const raw=JSON.parse(localStorage.getItem(BATTLE_ITEM_STORAGE)||'[]');
    custom=Array.isArray(raw)?raw:[];
  }catch{}
  const customIds=new Set(custom.map(x=>String(x.id)));
  return [...RELIANS_OFFICIAL_ITEMS.filter(x=>!customIds.has(String(x.id))),...custom];
}
function saveBattleItems(items){
  const custom=(Array.isArray(items)?items:[]).filter(x=>!x?.official);
  localStorage.setItem(BATTLE_ITEM_STORAGE,JSON.stringify(custom));
}

function isDataCubeItem(item){
  if(item?.effect==='capture'||item?.category==='captura')return true;
  const hay=`${item?.name||''} ${item?.category||''} ${item?.effect||''}`.toLowerCase();
  return /datacubo|data\s*cubo|capture|captura/.test(hay);
}
function captureChance(item=null){
  if(!battle?.enemy||battle.modeType==='trainer')return 0;
  const e=battle.enemy;
  const hpRatio=e.maxHp?e.hp/e.maxHp:1;
  const hpBonus=(1-hpRatio)*62;
  const statusBonus=(e.status?.burn||e.status?.speedDown)?8:0;
  const levelPenalty=Math.max(0,(Number(e.level)||1)-(Number(battle.player?.level)||1))*.8;
  const cubeBonus=Math.max(0,Number(item?.captureBonus)||0);
  return clamp(Math.round(18+hpBonus+statusBonus-levelPenalty+cubeBonus),8,98);
}
function consumeBattleItem(item){
  const char=battleCharacterRecord(),slot=char?.character?.backpack?.[item?._backpackIndex];
  if(!slot)return;
  const next=Math.max(0,(Number(slot.quantity||1)||1)-1);
  if(next<=0)char.character.backpack.splice(item._backpackIndex,1);else slot.quantity=next;
  try{doSave()}catch{}
}
function attemptCapture(item){
  if(!battle||battle.finished||battle.turn!=='player'||battle.player.acted||!battle.enemy||battle.enemy.hp<=0)return;
  if(battle.modeType==='trainer'){battleToast('Não é possível capturar Relians de treinadores.','miss',1200);return;}

  const chance=captureChance(item);
  battle.player.acted=true;
  closeBattleBag();
  consumeBattleItem(item);
  setBattleActionView('none');

  battleToast(`DataCubo lançado · ${chance}%`,'capture',900);
  log(`${battle.player.nickname} lançou ${item.name} em ${battle.enemy.nickname}.`);

  setTimeout(()=>{
    if(!battle||battle.finished)return;
    if(Math.random()*100<chance){
      battle.finished=true;
      battle.enemy.captured=true;
      saveCapturedEnemy(true);
      recordPlayerResult('capture');
      render();
      showBattleResult('capture',`${battle.enemy.nickname} foi capturado!`,'O combate terminou com uma captura bem-sucedida.');
    }else{
      log(`${battle.enemy.nickname} escapou do DataCubo!`);
      battleToast(`${battle.enemy.nickname} escapou!`,'miss',1000);
      render();
      setTimeout(()=>beginEnemyTurn({processStart:true}),420);
    }
  },620);
}
function itemEffectLabel(effect){
  return ({
    heal_hp:'Recuperar HP',
    heal_eng:'Recuperar ENG',
    heal_percent_hp:'Recuperar % de HP',
    heal_percent_eng:'Recuperar % de ENG',
    cure_burn:'Remover Queimadura',
    cure_slow:'Remover Lentidão',
    defense_up:'Aumentar Defesa',
    full_cure:'Remover estados negativos',
    revive_percent:'Reviver Relian',
    passive_equipment:'Efeito passivo enquanto equipado',
    evolution_special:'Item de evolução / transformação',
    special:'Efeito especial'
  })[effect]||effect;
}
function renderBattleItemLibrary(){
  const box=$('battleItemLibrary');if(!box)return;
  const items=loadBattleItems();
  box.innerHTML=items.length?items.map(item=>`<article class="battle-item-library-entry ${item.official?'official':''}">
    <div>
      <div class="battle-item-meta"><span class="battle-item-category">${escapeHtml(item.category||'item')}</span>${item.useType?`<span class="battle-item-use">${escapeHtml(item.useType)}</span>`:''}${item.official?'<span class="battle-item-official">NOTION</span>':''}</div>
      <h3>${escapeHtml(item.name)}</h3>
      <p>${escapeHtml(item.description||'Sem descrição.')}</p>
      <small><b>Efeito:</b> ${escapeHtml(item.effectText||itemEffectLabel(item.effect))}</small>
      <div class="battle-item-foot">${Number(item.price)?`<span>C$ ${Number(item.price).toLocaleString('pt-BR')}</span>`:''}${item.note?`<span>${escapeHtml(item.note)}</span>`:''}</div>
    </div>
    ${item.official?'':`<button type="button" class="danger small" data-delete-battle-item="${escapeHtml(item.id)}">Excluir</button>`}
  </article>`).join(''):'<p class="empty">Nenhum item criado ainda.</p>';
  box.querySelectorAll('[data-delete-battle-item]').forEach(btn=>btn.onclick=()=>{
    const custom=loadBattleItems().filter(x=>!x.official&&String(x.id)!==String(btn.dataset.deleteBattleItem));
    saveBattleItems(custom);renderBattleItemLibrary();
  });
}
function saveBattleItemFromForm(){
  const name=$('battleItemName')?.value.trim();if(!name)return alert('Dê um nome ao item.');
  const items=loadBattleItems();
  items.push({
    id:`item-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,6)}`,
    name,
    category:$('battleItemCategory')?.value||'cura',
    effect:$('battleItemEffect')?.value||'heal_hp',
    power:Math.max(0,Number($('battleItemPower')?.value)||0),
    description:$('battleItemDescription')?.value.trim()||''
  });
  saveBattleItems(items);renderBattleItemLibrary();
  $('battleItemName').value='';$('battleItemDescription').value='';
}

const SHOP_CATEGORY_LABELS={
  all:'Todos',captura:'DataCubos',recuperacao:'Recuperação',medicamento:'Medicamentos',
  vitamina:'Vitaminas',alimento:'Alimentos',equipamento:'Equipamentos',evolucao:'Evolução',
  item_vivo:'Itens Vivos',especial:'Especiais',energia:'Energia',status:'Status',suporte:'Suporte'
};
let shopCategoryFilter='all';
function shopCharacter(){return fixedPlayer()}
function renderShop(){
  const c=shopCharacter(),credits=$('shopCredits'),box=$('shopItemsGrid'),cats=$('shopCategoryList');
  const playerLabel=$('shopPlayerLabel');
  if(credits)credits.textContent=c?`${Math.max(0,Number(c.character?.credits)||0).toLocaleString('pt-BR')} C$`:'—';
  if(playerLabel)playerLabel.textContent=c?c.character?.name||'Personagem ativo':'Nenhum jogador definido';
  if(!box)return;

  const allItems=loadBattleItems().filter(i=>i.official&&Number(i.price)>0);
  const counts={all:allItems.length};
  allItems.forEach(i=>counts[i.category]=(counts[i.category]||0)+1);

  if(cats){
    const order=['all','captura','recuperacao','medicamento','vitamina','alimento','equipamento','evolucao','item_vivo','especial','energia','status','suporte'];
    cats.innerHTML=order.filter(k=>counts[k]).map(k=>`<button type="button" class="${shopCategoryFilter===k?'active':''}" data-shop-category="${k}">
      <span>${escapeHtml(SHOP_CATEGORY_LABELS[k]||k)}</span><b>${counts[k]}</b>
    </button>`).join('');
    cats.querySelectorAll('[data-shop-category]').forEach(btn=>btn.onclick=()=>{shopCategoryFilter=btn.dataset.shopCategory;renderShop()});
  }

  if(!c){
    box.innerHTML='<div class="shop-empty"><b>Defina um jogador primeiro</b><span>A loja usa o saldo e a mochila do personagem ativo.</span></div>';
    return;
  }

  const query=String($('shopSearchInput')?.value||'').trim().toLowerCase();
  let items=allItems.filter(i=>shopCategoryFilter==='all'||i.category===shopCategoryFilter);
  if(query)items=items.filter(i=>`${i.name||''} ${i.description||''} ${i.effectText||''}`.toLowerCase().includes(query));

  const title=$('shopCurrentCategoryTitle');
  if(title)title.textContent=SHOP_CATEGORY_LABELS[shopCategoryFilter]||'Itens';
  const count=$('shopResultCount');if(count)count.textContent=`${items.length} ${items.length===1?'item':'itens'}`;

  box.innerHTML=items.length?items.map((item,i)=>{
    const canBuy=Number(c.character.credits||0)>=Number(item.price);
    const effect=item.effectText||itemEffectLabel(item.effect);
    return `<article class="shop-item-card ${canBuy?'':'too-expensive'}">
      <div class="shop-item-card-top">
        <div class="shop-item-icon">${item.category==='captura'?'◈':item.category==='medicamento'?'✚':item.category==='alimento'?'◆':item.category==='equipamento'?'⚙':'✦'}</div>
        <div><span class="battle-item-category">${escapeHtml(SHOP_CATEGORY_LABELS[item.category]||item.category||'Item')}</span><h3>${escapeHtml(item.name)}</h3></div>
      </div>
      <p>${escapeHtml(item.description||'Sem descrição.')}</p>
      <div class="shop-effect-box"><span>Efeito</span><b>${escapeHtml(effect)}</b></div>
      <div class="shop-item-buy">
        <div><small>Preço</small><b>${Number(item.price).toLocaleString('pt-BR')} C$</b></div>
        <button type="button" data-shop-buy="${i}" ${canBuy?'':'disabled'}>${canBuy?'Comprar':'Saldo insuficiente'}</button>
      </div>
    </article>`;
  }).join(''):'<div class="shop-empty"><b>Nenhum item encontrado</b><span>Tente outra categoria ou termo de pesquisa.</span></div>';

  box.querySelectorAll('[data-shop-buy]').forEach(btn=>btn.onclick=()=>buyShopItem(items[Number(btn.dataset.shopBuy)]));
}
function buyShopItem(item){
  const c=shopCharacter();if(!c?.character)return alert('Defina um jogador.');
  const price=Math.max(0,Number(item.price)||0),credits=Math.max(0,Number(c.character.credits)||0);
  if(credits<price)return alert('Créditos insuficientes.');
  c.character.credits=credits-price;
  c.character.backpack=Array.isArray(c.character.backpack)?c.character.backpack:[];
  const slot=c.character.backpack.find(x=>String(x.itemId)===String(item.id));
  if(slot)slot.quantity=Math.max(1,Number(slot.quantity)||1)+1;
  else c.character.backpack.push({itemId:item.id,name:item.name,description:item.description||item.effectText||'',quantity:1});
  try{doSave()}catch{}
  renderShop();renderPlayerPage();refreshSetup();
  battleToast(`${item.name} comprado!`,'heal',1000);
}

function battleCharacterRecord(){
  return characters().find(x=>String(x.id)===String(battle?.player?.characterId))||null;
}
function ownedBattleItems(){
  const c=battleCharacterRecord()?.character;
  const backpack=Array.isArray(c?.backpack)?c.backpack:[];
  const catalog=loadBattleItems(),result=[];
  backpack.forEach((slot,index)=>{
    const qty=Math.max(0,Number(slot?.quantity||slot?.quantidade||1)||0);
    if(qty<=0)return;
    let def=slot?.itemId?catalog.find(x=>String(x.id)===String(slot.itemId)):null;
    if(!def){
      const name=String(slot?.name||slot?.nome||'').trim().toLowerCase();
      if(name)def=catalog.find(x=>String(x.name).trim().toLowerCase()===name);
    }
    if(def)result.push({...def,_backpackIndex:index,_quantity:qty});
  });
  return result;
}
function battleItemTargets(){
  const char=battleCharacterRecord();
  if(!char?.character)return [];
  return (char.character.team||[]).map(member=>{
    const sheet=savedById(member.savedSheetId);
    if(!sheet)return null;
    return {member,sheet,isActive:String(sheet.id)===String(battle?.player?.sheetId)};
  }).filter(Boolean);
}
function renderBattleItemTargetPicker(item){
  const box=$('battleItemsList');if(!box)return;
  const targets=battleItemTargets();
  box.innerHTML=`<div class="battle-item-target-head"><button type="button" data-back-items="1">← Itens</button><div><b>${escapeHtml(item.name)}</b><small>Escolha o Relian que receberá o item.</small></div></div>`+
    (targets.length?targets.map((t,i)=>{
      const sp=species(t.sheet.speciesId),img=imageFor(sp,t.sheet.color);
      return `<button type="button" class="battle-item-target" data-item-target="${i}">
        <span class="battle-item-target-img">${img?`<img src="${escapeHtml(img)}" alt="">`:''}</span>
        <span><b>${escapeHtml(t.member.nickname||t.sheet.nickname||sp?.name||'Relian')}</b><small>HP ${Number(t.sheet.hpCurrent??t.sheet.hpMax??0)}/${Number(t.sheet.hpMax||0)} · ENG ${Number(t.sheet.engCurrent??t.sheet.engMax??0)}/${Number(t.sheet.engMax||0)}${t.isActive?' · Em campo':''}</small></span>
      </button>`;
    }).join(''):'<div class="battle-no-items">Nenhum Relian disponível.</div>');
  box.querySelector('[data-back-items]')?.addEventListener('click',renderBattleItems);
  box.querySelectorAll('[data-item-target]').forEach(btn=>btn.onclick=()=>applyBattleItem(item,targets[Number(btn.dataset.itemTarget)]));
}
function applyBattleItem(item,targetEntry=null){
  if(!battle||battle.turn!=='player'||battle.finished)return;
  const target=targetEntry||battleItemTargets().find(t=>t.isActive);
  if(!target)return;
  const active=target.isActive,b=target.sheet;
  let hp=active?battle.player.hp:Number(b.hpCurrent??b.hpMax??0);
  let eng=active?battle.player.eng:Number(b.engCurrent??b.engMax??0);
  const maxHp=active?battle.player.maxHp:Math.max(1,Number(b.hpMax)||1);
  const maxEng=active?battle.player.maxEng:Math.max(1,Number(b.engMax)||1);
  if(active)ensureCombatState(battle.player);
  let text='',worked=true;
  const power=Math.max(0,Number(item.power)||0);
  if(item.effect==='heal_hp'){const before=hp;hp=Math.min(maxHp,hp+power);text=`recuperou ${Math.round(hp-before)} HP`;worked=hp>before}
  else if(item.effect==='heal_eng'){const before=eng;eng=Math.min(maxEng,eng+power);text=`recuperou ${Math.round(eng-before)} ENG`;worked=eng>before}
  else if(item.effect==='heal_percent_hp'){const before=hp;hp=Math.min(maxHp,hp+Math.round(maxHp*(power/100)));text=`recuperou ${Math.round(hp-before)} HP`;worked=hp>before}
  else if(item.effect==='heal_percent_eng'){const before=eng;eng=Math.min(maxEng,eng+Math.round(maxEng*(power/100)));text=`recuperou ${Math.round(eng-before)} ENG`;worked=eng>before}
  else if(item.effect==='cure_burn'){if(active&&battle.player.status.burn){battle.player.status.burn=0;text='não está mais queimado'}else worked=false}
  else if(item.effect==='cure_slow'){if(active&&battle.player.status.speedDown){battle.player.status.speedDown=0;text='recuperou a Velocidade'}else worked=false}
  else if(item.effect==='defense_up'){if(active){battle.player.status.defenseUp=Math.max(battle.player.status.defenseUp||0,Math.max(1,power||2));text='aumentou sua Defesa'}else worked=false}
  else if(item.effect==='full_cure'){if(active&&(battle.player.status.burn||battle.player.status.speedDown)){battle.player.status.burn=0;battle.player.status.speedDown=0;text='teve os estados negativos removidos'}else worked=false}
  else if(item.effect==='revive_percent'){if(hp<=0){hp=Math.max(1,Math.round(maxHp*((power||25)/100)));text=`foi reanimado com ${Math.round(hp)} HP`;worked=true}else worked=false}
  else worked=false;
  if(!worked){log(`${item.name} não teria efeito em ${target.member.nickname||target.sheet.nickname||'Relian'}.`);renderBattleItems();return}
  if(active){battle.player.hp=hp;battle.player.eng=eng}else{b.hpCurrent=Math.round(hp);b.engCurrent=Math.round(eng)}
  const char=battleCharacterRecord(),slot=char?.character?.backpack?.[item._backpackIndex];
  if(slot){
    const next=Math.max(0,(Number(slot.quantity||1)||1)-1);
    if(next<=0)char.character.backpack.splice(item._backpackIndex,1);else slot.quantity=next;
    try{doSave()}catch{}
  }
  const targetName=target.member.nickname||target.sheet.nickname||'Relian';
  log(`${targetName} usou ${item.name} e ${text}.`);
  battleToast(`${item.name}: ${text}`,'heal');
  if(active)flashCombatant('player',/Defesa|estado|Velocidade/i.test(text)?'buff':'heal');
  battleActionView='none';render();setTimeout(endPlayerTurn,420);
}

function openBattleBag(){
  if(!battle||battle.finished||battle.turn!=='player'||battle.player.acted)return;
  const modal=$('battleBagModal');
  if(!modal)return;
  renderBattleItems();
  modal.hidden=false;
  document.body.classList.add('battle-bag-open');
}
function closeBattleBag(){
  const modal=$('battleBagModal');
  if(modal)modal.hidden=true;
  document.body.classList.remove('battle-bag-open');
}

function renderBattleItems(){
  const box=$('battleItemsList');if(!box)return;
  const items=ownedBattleItems();
  box.innerHTML=items.length?items.map((item,i)=>{
    const cube=isDataCubeItem(item);
    const usable=cube||item.useType==='consumivel'||['heal_hp','heal_eng','heal_percent_hp','heal_percent_eng','cure_burn','cure_slow','defense_up','full_cure','revive_percent'].includes(item.effect);
    const detail=cube?battle?.modeType==='trainer'?'Indisponível em batalha de treinador':`Captura · chance atual ${captureChance(item)}%`:(item.effectText||itemEffectLabel(item.effect));
    return `<button type="button" class="battle-use-item ${cube?'datacube':''} ${usable?'':'passive'}" data-use-item="${i}" ${usable?'':'disabled'}>
      <span><b>${cube?'◈ ':''}${escapeHtml(item.name)}</b><small>${escapeHtml(detail)}${!usable?' · Não é consumível em batalha':''}</small></span><strong>x${item._quantity}</strong>
    </button>`;
  }).join(''):`<div class="battle-no-items"><b>A mochila está vazia.</b><span>Adicione itens ou DataCubos ao inventário do personagem.</span></div>`;
  box.querySelectorAll('[data-use-item]:not([disabled])').forEach(btn=>btn.onclick=()=>{
    const item=items[Number(btn.dataset.useItem)];
    if(isDataCubeItem(item))attemptCapture(item);else renderBattleItemTargetPicker(item);
  });
}
function setBattleActionView(view){
  battleActionView=view;
  const moves=$('battleMoves');
  const back=$('battleActionBackBtn');
  if(moves)moves.hidden=false;
  if(back)back.hidden=view==='none';
  document.querySelector('.battle-moves-panel')?.classList.toggle('focus',view==='moves');

  if(view==='moves'){
    const hint=$('battleHint');if(hint)hint.textContent='Escolha um movimento na lateral esquerda.';
  }else if(view==='none'&&battle?.turn==='player'&&!battle?.finished){
    const hint=$('battleHint');if(hint&&battle.mode!=='move'&&battle.mode!=='attack')hint.textContent='Escolha uma ação.';
  }
}
function saveCapturedEnemy(alreadyMarked=false){
  if(!battle?.enemy||!battle?.player)return null;
  if(battle.enemy.captureSaved)return null;
  if(!alreadyMarked&&battle.enemy.captured)return null;
  battle.enemy.captured=true;
  battle.enemy.captureSaved=true;
  const enemy=battle.enemy,char=battleCharacterRecord();
  if(!char?.character){battle.enemy.captureSaved=false;return null}
  const now=Date.now(),id=`relian-${now.toString(36)}-${Math.random().toString(36).slice(2,7)}`;
  const sheet={
    id,speciesId:String(enemy.species?.id||''),speciesName:String(enemy.species?.name||enemy.nickname||'Relian'),
    nickname:String(enemy.nickname||enemy.species?.name||'Relian'),level:Math.max(1,Number(enemy.level)||1),
    color:typeof normalizeColorId==='function'?normalizeColorId(enemy.color||'basic'):(enemy.color||'basic'),
    rarity:String(enemy.species?.rarity||'comum'),gender:'',size:'',
    hpCurrent:Math.max(1,Math.round(enemy.hp||1)),hpMax:Math.max(1,Math.round(enemy.maxHp||1)),
    engCurrent:Math.max(0,Math.round(enemy.eng||0)),engMax:Math.max(1,Math.round(enemy.maxEng||1)),
    affinity:1,attributes:{ataque:Number(enemy.attack)||0,defesa:Number(enemy.defense)||0,ataqueEspecial:Number(enemy.spAttack)||0,defesaEspecial:Number(enemy.spDefense)||0,velocidade:Number(enemy.speed)||0,precisao:Number(enemy.precision)||0},
    attributeReducers:{},traitId:'',moves:(enemy.moves||[]).map(m=>m?.id).filter(Boolean),items:[],notes:'Capturado em combate com DataCubo.'
  };
  const migrated=typeof migrateSavedRelianSheet==='function'?migrateSavedRelianSheet(sheet):sheet;
  data.savedRelianSheets=Array.isArray(data.savedRelianSheets)?data.savedRelianSheets:[];
  data.savedRelianSheets.push(migrated);
  char.character.team=Array.isArray(char.character.team)?char.character.team:[];
  char.character.team.push({speciesId:migrated.speciesId,savedSheetId:migrated.id,nickname:migrated.nickname,level:migrated.level,color:migrated.color,notes:'Capturado em combate'});
  char.character.equippedRelianIds=Array.isArray(char.character.equippedRelianIds)?char.character.equippedRelianIds:[];
  if(char.character.equippedRelianIds.length<7)char.character.equippedRelianIds.push(migrated.id);
  try{doSave();refreshTeam()}catch{}
  return migrated;
}
function captureEnemy(){
  const captured=saveCapturedEnemy(false);if(!captured)return;
  document.querySelector('.battle-capture-overlay')?.remove();
  showBattleResult('capture',`${captured.nickname} foi capturado!`,'O novo Relian foi adicionado ao personagem usado na batalha.');
}
function offerCapture(xp,levels){
  const old=document.querySelector('.battle-capture-overlay');if(old)old.remove();
  const overlay=document.createElement('div');overlay.className='battle-switch-overlay battle-capture-overlay';
  const img=imageFor(battle.enemy.species,battle.enemy.color);
  overlay.innerHTML=`<div class="card battle-capture-dialog">
    <div class="battle-capture-portrait">${img?`<img src="${escapeHtml(img)}" alt="">`:''}</div>
    <div><div class="section-kicker">RELIAN ENFRAQUECIDO</div><h2>${escapeHtml(battle.enemy.nickname)} desmaiou</h2>
    <p>Você venceu e recebeu <b>${xp} XP</b>${levels?` · +${levels} nível${levels>1?'s':''}`:''}. Deseja capturar este Relian e adicioná-lo ao personagem usado na batalha?</p></div>
    <div class="battle-capture-actions"><button type="button" class="primary" data-capture-enemy="1">Capturar</button><button type="button" data-skip-capture="1">Deixar ir</button></div>
  </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('[data-capture-enemy]').onclick=captureEnemy;
  overlay.querySelector('[data-skip-capture]').onclick=()=>overlay.remove();
}


const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const dist=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
const pct=(a,b)=>b?clamp(a/b*100,0,100):0;
const getData=()=>window.reliansBattleData?window.reliansBattleData():window.data;
const doSave=()=>window.reliansBattleSave&&window.reliansBattleSave();

function species(id){return (getData()?.relians||[]).find(r=>String(r.id)===String(id));}
function moveById(id){return getData()?.moves?.[id]||null;}
function savedById(id){return (getData()?.savedRelianSheets||[]).find(s=>String(s.id)===String(id));}
function characters(){return (getData()?.storySheets||[]).filter(s=>s.type==='character'||s.type==='trainer');}
function traitById(id){return getData()?.traits?.[id]||null;}
function imageFor(sp,color){
  try{
    const normalized=typeof normalizeColorId==='function'?normalizeColorId(color||'basic'):(color||'basic');
    return resolveRelianImage(sp,normalized);
  }catch{return sp?.image||''}
}
function avatar(img,c){
  const name=escapeHtml(c?.nickname||c?.species?.name||'Relian');
  return `<div class="battle-avatar">${img?`<img src="${escapeHtml(img)}" alt="${name}">`:`<span>${name.slice(0,1)||'?'}</span>`}</div>`;
}
function attrValue(sheet,key){return Number(sheet?.attributes?.[key]??sheet?.attrs?.[key]?.total??sheet?.attrs?.[key]??0)||0;}
function modifierFromAttr(v){try{return calcModifier(v)}catch{return Math.round((Number(v)||0)/10)}}
function getMovesFor(sp,level,sheet){
  const ids=(sheet?.moves||[]).filter(Boolean);
  const fromSheet=ids.map(moveById).filter(Boolean);
  if(fromSheet.length)return fromSheet.slice(0,4);
  return (sp?.learnset||[]).filter(x=>Number(x.level)<=level).sort((a,b)=>Number(b.level)-Number(a.level)).slice(0,4).map(x=>moveById(x.moveId)).filter(Boolean);
}
function parseRange(move){
  const explicit=Number(move?.tacticalRange??move?.alcanceTatico);
  if(Number.isFinite(explicit)&&explicit>0)return clamp(Math.round(explicit),1,12);
  const raw=String(move?.range||move?.alcance||'').toLowerCase();
  const n=raw.match(/\d+/);
  if(n)return clamp(Number(n[0]),1,8);
  if(/corpo|melee|adjacen/.test(raw))return 1;
  if(/longo|longa|dist/.test(raw))return 4;
  return ['EFT','HIB'].includes(String(move?.type||move?.tipo||'').toUpperCase())?3:1;
}
function areaRadius(move){
  const explicit=Number(move?.tacticalArea??move?.areaTatica);
  if(Number.isFinite(explicit)&&explicit>=0)return clamp(Math.round(explicit),0,4);
  const txt=[move?.range,move?.alcance,...(move?.tags||[]),...(move?.effects||[])].join(' ').toLowerCase();
  const m=txt.match(/(?:área|area|raio)\s*(\d+)/);
  if(m)return clamp(Number(m[1]),0,3);
  if(/explos|onda|chuva|diluvio|ciclone/.test(String(move?.name||move?.nome||'').toLowerCase()))return 1;
  return 0;
}

function areaShape(move){return String(move?.tacticalShape||move?.formatoArea||'alvo').toLowerCase()}
function shapeLabel(move){return ({alvo:'Alvo',cruz:'Cruz',quadrado:'Quadrado',linha:'Linha'})[areaShape(move)]||'Alvo'}
function inArea(center,pos,move,origin){
  const r=areaRadius(move),shape=areaShape(move);if(r<=0)return center.x===pos.x&&center.y===pos.y;
  const dx=Math.abs(pos.x-center.x),dy=Math.abs(pos.y-center.y);
  if(shape==='cruz')return dx+dy<=r;
  if(shape==='linha'){
    const horizontal=Math.abs(center.x-origin.x)>=Math.abs(center.y-origin.y);
    return horizontal?(dy===0&&dx<=r):(dx===0&&dy<=r);
  }
  return dx<=r&&dy<=r;
}
function moveName(m){return m?.name||m?.nome||'Movimento';}
function moveCost(m){return Math.max(0,Number(m?.energy??m?.energia??0)||0);}
function moveDamage(m){return Math.max(0,Number(m?.damage??m?.dano??0)||0);}
function moveAccuracy(m){const v=Number(m?.accuracy??m?.precisao??0)||0;return v<=0?100:clamp(v,1,100);}

function fallbackMove(){
  return {
    id:'__basic_attack__',
    name:'Ataque Básico',
    nome:'Ataque Básico',
    damage:8,
    dano:8,
    energy:0,
    energia:0,
    accuracy:95,
    precisao:95,
    tacticalRange:1,
    alcanceTatico:1,
    tacticalArea:0,
    areaTatica:0,
    tacticalShape:'alvo',
    formatoArea:'alvo',
    type:'OFS',
    tipo:'OFS',
    description:'Um ataque simples usado quando o Relian não possui movimentos disponíveis.'
  };
}
function ensureMoves(c){
  if(!Array.isArray(c.moves)||!c.moves.length)c.moves=[fallbackMove()];
  return c;
}


function movementRangeFromSpeed(speed){
  const s=Math.max(0,Number(speed)||0);
  if(s<8)return 2;
  if(s<15)return 3;
  if(s<23)return 4;
  if(s<32)return 5;
  if(s<42)return 6;
  if(s<55)return 7;
  return 8;
}
function maxWalk(c){
  const slow=Number(c?.status?.speedDown||0);
  return clamp(movementRangeFromSpeed(c?.speed)-slow,1,8);
}
function ensureCombatState(c){
  c.status=c.status||{speedDown:0,defenseUp:0,burn:0};
  return c;
}

const ARENA_TILE_ROOT='assets/arena_tiles';
const ARENA_THEMES={
  agua:{label:'Arena Aquática',ground:'agua_chao',decor:['agua_raso','coral'],obstacle:'rocha_molhada',energy:'cristal_azul'},
  fogo:{label:'Arena Vulcânica',ground:'fogo_chao',decor:['lava','cinzas'],obstacle:'rocha_vulcanica',energy:'cristal_igneo'},
  terra:{label:'Arena Terrestre',ground:'terra_chao',decor:['terra_seca','cascalho'],obstacle:'rocha',energy:'cristal_terra'},
  floresta:{label:'Arena Florestal',ground:'floresta_chao',decor:['grama','flores'],obstacle:'tronco',energy:'cristal_vital'},
  gelo:{label:'Arena Glacial',ground:'gelo_chao',decor:['neve','gelo_rachado'],obstacle:'rocha_gelada',energy:'cristal_gelo'},
  deserto:{label:'Arena Desértica',ground:'deserto_chao',decor:['areia','duna'],obstacle:'rocha_deserto',energy:'cristal_solar'},
  astral:{label:'Arena Astral',ground:'astral_chao',decor:['poeira_astral','runa_astral'],obstacle:'cristal_astral',energy:'nucleo_astral'},
  halo:{label:'Arena de Halo',ground:'halo_chao',decor:['luz','runa_halo'],obstacle:'rocha_luminosa',energy:'cristal_halo'},
  umbral:{label:'Arena Umbral',ground:'umbral_chao',decor:['sombra','fenda'],obstacle:'rocha_umbral',energy:'cristal_umbral'},
  tempestade:{label:'Arena Tempestuosa',ground:'tempestade_chao',decor:['vento','faisca'],obstacle:'rocha_tempestade',energy:'cristal_tempestade'},
  eter:{label:'Arena Etérea',ground:'eter_chao',decor:['nevoa_eter','runa_eter'],obstacle:'cristal_eter',energy:'nucleo_eter'},
  pantano:{label:'Arena de Pântano',ground:'pantano_chao',decor:['lama','agua_pantano'],obstacle:'tronco_pantano',energy:'cristal_pantano'},
  celeste:{label:'Arena Celeste',ground:'celeste_chao',decor:['nuvem','vento_celeste'],obstacle:'rocha_celeste',energy:'cristal_celeste'}
};
const REGION_ARENA_THEME={
  'baia-coralina':'agua','costa-de-maris':'agua','lago-espelhado':'agua','mar-de-cristal':'agua',
  'vulcao-ignivar':'fogo','serra-rubra':'fogo',
  'fortaleza-colossal':'terra','montanhas-cinzentas':'terra','ruinas-de-arkhos':'terra',
  'floresta-de-nym':'floresta','bosque-de-elyr':'floresta','jardim-vital':'floresta',
  'pico-boreal':'gelo','campos-da-aurora':'gelo',
  'deserto-de-karesh':'deserto','oasis-lumen':'deserto',
  'observatorio-astral':'astral','vale-de-aster':'astral','campos-nebulosos':'astral',
  'cratera-de-halo':'halo','vale-lumen':'halo','montanhas-de-lumen':'halo','planicies-de-solen':'halo',
  'fenda-de-umbra':'umbral','abismo-de-nox':'umbral',
  'vale-tempestuoso':'tempestade','penhascos-de-zephyr':'tempestade',
  'cavernas-de-eter':'eter','ruinas-azuis':'eter','bosque-luminescente':'eter','torre-dos-ecos':'eter',
  'pantano-de-morgh':'pantano','arquipelago-celeste':'celeste'
};
function arenaThemeForRegion(regionId=''){return REGION_ARENA_THEME[String(regionId||'').toLowerCase()]||'terra'}
function arenaThemeInfo(themeId){return ARENA_THEMES[themeId]||ARENA_THEMES.terra}
function arenaSpriteName(themeId,tileType,variant=1){
  const theme=arenaThemeInfo(themeId);
  let stem=theme.ground;
  if(tileType==='obstacle')stem=theme.obstacle;
  else if(tileType==='energy')stem=theme.energy;
  else if(tileType==='decor'){
    const list=theme.decor||[];
    stem=list[Math.max(0,(variant-1)%Math.max(1,list.length))]||theme.ground;
  }
  const v=(tileType==='ground'||tileType==='decor')?String(((variant-1)%3)+1).padStart(2,'0'):'01';
  return `${ARENA_TILE_ROOT}/arena_${stem}_${v}.png`;
}
function arenaRandomFreeCell(used,margin=1){
  for(let tries=0;tries<80;tries++){
    const x=margin+Math.floor(Math.random()*(W-margin*2)),y=Math.floor(Math.random()*H),key=`${x},${y}`;
    if(!used.has(key)){used.add(key);return{x,y}}
  }
  return null;
}
function terrainDataAt(pos){return battle?.terrain?.tiles?.[`${pos.x},${pos.y}`]||null}
function terrainAt(pos){
  const tile=terrainDataAt(pos);
  if(tile?.type==='obstacle')return'rock';
  if(tile?.type==='energy')return'energy';
  return tile?.type||null;
}
function arenaCellSprite(pos){
  const terrain=battle?.terrain,themeId=terrain?.themeId||'terra',tile=terrainDataAt(pos);
  if(tile)return arenaSpriteName(themeId,tile.type,tile.variant||1);
  const seed=(Number(terrain?.groundVariantSeed)||0)+pos.x*17+pos.y*31;
  return arenaSpriteName(themeId,'ground',(Math.abs(seed)%3)+1);
}

function blocked(pos){
  if(pos.x<0||pos.x>=W||pos.y<0||pos.y>=H)return true;
  return terrainAt(pos)==='rock'||!!at(pos);
}
function neighbors(pos){
  return [{x:pos.x+1,y:pos.y},{x:pos.x-1,y:pos.y},{x:pos.x,y:pos.y+1},{x:pos.x,y:pos.y-1}]
    .filter(p=>p.x>=0&&p.x<W&&p.y>=0&&p.y<H);
}
function pathDistance(start,goal,ignoreGoalOccupant=false){
  const key=p=>`${p.x},${p.y}`,q=[{...start,d:0}],seen=new Set([key(start)]);
  while(q.length){
    const cur=q.shift(); if(cur.x===goal.x&&cur.y===goal.y)return cur.d;
    for(const n of neighbors(cur)){
      const k=key(n); if(seen.has(k))continue;
      const occupied=at(n);
      if(terrainAt(n)==='rock'||(occupied&&!(ignoreGoalOccupant&&n.x===goal.x&&n.y===goal.y)))continue;
      seen.add(k);q.push({...n,d:cur.d+1});
    }
  }
  return Infinity;
}

function findBattlePath(start,goal){
  const key=p=>`${p.x},${p.y}`;
  const q=[{x:Number(start.x),y:Number(start.y)}];
  const startKey=key(q[0]),goalKey=key(goal);
  const prev=new Map([[startKey,null]]);
  while(q.length){
    const cur=q.shift(),curKey=key(cur);
    if(curKey===goalKey)break;
    for(const n of neighbors(cur)){
      const k=key(n);
      if(prev.has(k))continue;
      if(terrainAt(n)==='rock')continue;
      const occupied=at(n);
      if(occupied && k!==goalKey)continue;
      prev.set(k,curKey);
      q.push({x:Number(n.x),y:Number(n.y)});
    }
  }
  if(!prev.has(goalKey))return [];
  const path=[];
  let k=goalKey;
  while(k && k!==startKey){
    const [x,y]=k.split(',').map(Number);
    path.push({x,y});
    k=prev.get(k);
  }
  return path.reverse();
}
const battleWait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function animatePlayerMovement(dest){
  if(!battle||battle.finished||battle.turn!=='player'||battle.animatingMove||battle.player.moved)return false;

  const path=findBattlePath(battle.player.pos,dest);
  const speedLimit=maxWalk(battle.player);
  const energyLimit=Math.floor(Math.max(0,battle.player.eng)/MOVE_ENG);
  const allowed=Math.min(speedLimit,energyLimit);

  if(!path.length){
    if($('battleHint'))$('battleHint').textContent='Não existe um caminho válido até essa casa.';
    return false;
  }
  if(path.length>allowed){
    if($('battleHint'))$('battleHint').textContent=`Você pode percorrer no máximo ${allowed} casa${allowed===1?'':'s'} neste turno.`;
    return false;
  }

  battle.animatingMove=true;
  battle.mode=null;
  battle.selectedMove=null;
  setBattleActionView('none');

  try{
    for(const step of path){
      battle.player.pos={x:Number(step.x),y:Number(step.y)};
      renderGrid();
      document.querySelector(`.battle-cell[data-x="${step.x}"][data-y="${step.y}"]`)?.classList.add('move-step-active');
      await battleWait(100);
    }

    const cost=path.length*MOVE_ENG;
    battle.player.eng=Math.max(0,battle.player.eng-cost);
    battle.player.moved=true;
    log(`${battle.player.nickname} se moveu ${path.length} casa${path.length>1?'s':''} (-${cost} ENG).`);
    battleToast(`-${cost} ENG de movimento`,'move');
    return true;
  } finally {
    battle.animatingMove=false;
    render();
    if(battle&&!battle.finished&&$('battleHint')){
      $('battleHint').textContent=`Movimento concluído. Restam ${Math.round(battle.player.eng)} ENG; você ainda pode atacar ou usar um item.`;
    }
  }
}
function makeTerrain(themeId='terra'){
  const tiles={},used=new Set();
  for(let y=0;y<H;y++){used.add(`1,${y}`);used.add(`${W-2},${y}`)}
  const obstacleCount=4+Math.floor(Math.random()*5),energyCount=2+Math.floor(Math.random()*3),decorCount=8+Math.floor(Math.random()*10);
  for(let i=0;i<obstacleCount;i++){const p=arenaRandomFreeCell(used,2);if(p)tiles[`${p.x},${p.y}`]={type:'obstacle',variant:1}}
  for(let i=0;i<energyCount;i++){const p=arenaRandomFreeCell(used,2);if(p)tiles[`${p.x},${p.y}`]={type:'energy',variant:1}}
  for(let i=0;i<decorCount;i++){const p=arenaRandomFreeCell(used,1);if(p)tiles[`${p.x},${p.y}`]={type:'decor',variant:1+Math.floor(Math.random()*3)}}
  return{themeId,tiles,groundVariantSeed:Math.floor(Math.random()*100000)};
}
function turnStart(c){
  ensureCombatState(c);
  const regen=Math.max(4,Math.round(c.maxEng*.08));
  c.eng=Math.min(c.maxEng,c.eng+regen);
  if(c.status.burn>0){
    const dot=Math.max(1,Math.round(c.maxHp*.04));
    c.hp=Math.max(0,c.hp-dot); c.status.burn--;
    log(`${c.nickname} sofreu ${dot} de dano por queimadura.`);
  }
  if(c.status.speedDown>0)c.status.speedDown=Math.max(0,c.status.speedDown-1);
  if(c.status.defenseUp>0)c.status.defenseUp=Math.max(0,c.status.defenseUp-1);
}
function terrainEnd(c){
  if(terrainAt(c.pos)==='energy'){
    const gain=Math.max(5,Math.round(c.maxEng*.10));
    const before=c.eng;c.eng=Math.min(c.maxEng,c.eng+gain);
    if(c.eng>before)log(`${c.nickname} absorveu ${Math.round(c.eng-before)} ENG da casa energética.`);
  }
}
function moveText(m){return `${m?.descricao||m?.description||''} ${(m?.efeitos||m?.effects||[]).join(' ')}`.toLowerCase()}
function effectChance(m){const mt=moveText(m).match(/(\d+)\s*%\s*(?:de\s*)?chance/);return mt?clamp(Number(mt[1]),0,100):100}
function applyMoveEffects(attacker,defender,m){
  const txt=moveText(m); if(!txt)return;
  if(Math.random()*100>effectChance(m))return;
  ensureCombatState(attacker);ensureCombatState(defender);
  if(/reduz(?:ir| a)? (?:a )?velocidade|diminu(?:ir|i) (?:a )?velocidade|velocidade.*-1/.test(txt)){
    defender.status.speedDown=clamp(defender.status.speedDown+1,0,3);
    log(`${defender.nickname} teve a Velocidade reduzida.`);
  }
  if(/queimad|incendi/.test(txt)){
    defender.status.burn=Math.max(defender.status.burn,3);
    log(`${defender.nickname} ficou queimado.`);
  }
  if(/aumenta.*defesa|defesa.*\+1|eleva.*defesa/.test(txt)){
    attacker.status.defenseUp=clamp(attacker.status.defenseUp+1,0,3);
    log(`${attacker.nickname} fortaleceu a Defesa.`);
  }
  const heal=txt.match(/(?:cura|recupera)\s*(\d+)\s*(?:hp|de hp)?/);
  if(heal){
    const amount=Number(heal[1]);attacker.hp=Math.min(attacker.maxHp,attacker.hp+amount);
    log(`${attacker.nickname} recuperou ${amount} HP.`);
  }
}
function useSupportMove(user,m){
  const cost=moveCost(m); if(user.eng<cost)return false;
  user.eng-=cost;ensureCombatState(user);
  const txt=moveText(m);
  if(/defesa|prote|escudo|manto/.test(txt)||String(m?.tipo||m?.type||'').toUpperCase()==='DEF'){
    user.status.defenseUp=Math.max(user.status.defenseUp,2);
    log(`${user.nickname} usou ${moveName(m)} e assumiu uma postura defensiva.`);
  }else{
    applyMoveEffects(user,user,m);
    log(`${user.nickname} usou ${moveName(m)}.`);
  }
  return true;
}



function resetUnitTurn(c){
  if(!c)return;
  c.moved=false;
  c.acted=false;
}
function beginPlayerTurn({processStart=true}={}){
  if(!battle||battle.finished)return;
  battle.turn='player';
  battle.mode=null;
  battle.selectedMove=null;
  battle.animatingMove=false;
  resetUnitTurn(battle.player);
  if(processStart)turnStart(battle.player);
  closeBattleBag();
  setBattleActionView('none');
  render();
  if(battle.player.hp<=0)return defeatPlayer();
  if($('battleHint'))$('battleHint').textContent='Sua vez: mova-se ou escolha uma ação.';
  battleToast('Sua vez','player',750);
}
function beginEnemyTurn({processStart=true}={}){
  if(!battle||battle.finished)return;
  battle.turn='enemy';
  battle.mode=null;
  battle.selectedMove=null;
  battle.animatingMove=false;
  resetUnitTurn(battle.enemy);
  if(processStart)turnStart(battle.enemy);
  setBattleActionView('none');
  render();
  if(battle.enemy.hp<=0)return victory();
  battleToast('Turno do inimigo','enemy',750);
  setTimeout(enemyTurn,520);
}

function buildFromSaved(sheet,member,charSheet){
  const sp=species(sheet?.speciesId||member?.speciesId);
  if(!sp)return null;
  const level=Math.max(1,Number(member?.level??sheet?.level??1)||1);
  const tr=traitById(sheet?.traitId);
  let resources={hp:100,energy:Number(sp.baseEnergy)||65};
  try{resources=calculateRelianResources(level,tr)}catch{}
  const maxHp=Math.max(1,Number(sheet?.hpMax)||resources.hp||100);
  const maxEng=Math.max(1,Number(sheet?.engMax)||resources.energy||65);
  return {
    side:'player',sheetId:sheet?.id||'',characterId:charSheet?.id||'',species:sp,
    nickname:member?.nickname||sheet?.nickname||sp.name,level,color:member?.color||sheet?.color||'basic',
    hp:Math.min(maxHp,Math.max(0,Number(sheet?.hpCurrent??maxHp))),maxHp,
    eng:Math.min(maxEng,Math.max(0,Number(sheet?.engCurrent??maxEng))),maxEng,
    attack:attrValue(sheet,'ataque'),defense:attrValue(sheet,'defesa'),spAttack:attrValue(sheet,'ataqueEspecial'),spDefense:attrValue(sheet,'defesaEspecial'),speed:attrValue(sheet,'velocidade'),precision:attrValue(sheet,'precisao'),
    moves:getMovesFor(sp,level,sheet),pos:{x:1,y:Math.floor(H/2)},moved:false,acted:false,knocked:false
  };
}
function buildFromGenerated(g){
  const sp=g.r; const attrs=k=>Number(g.attrs?.[k]?.total??0)||0;
  return {side:'enemy',species:sp,nickname:sp.name,level:g.level,color:g.color?.id||'basic',hp:g.currentHp,maxHp:g.hp,eng:g.currentEnergy,maxEng:g.energy,attack:attrs('ataque'),defense:attrs('defesa'),spAttack:attrs('ataqueEspecial'),spDefense:attrs('defesaEspecial'),speed:attrs('velocidade'),precision:attrs('precisao'),moves:(g.moves||[]).map(x=>x.move).filter(Boolean),pos:{x:W-2,y:Math.floor(H/2)},moved:false,acted:false,knocked:false,generatedUid:g.uid,regionId:String(g.regionId||''),biomeId:String(g.biomeId||'')};
}
function buildRandomEnemy(level){
  const d=getData(),pool=(d?.relians||[]).filter(Boolean);if(!pool.length)return null;
  const levelPool=pool.filter(r=>(r.encounters||[]).some(e=>level>=Number(e.minLevel||1)&&level<=Number(e.maxLevel||100)));
  const choices=levelPool.length?levelPool:pool,sp=choices[Math.floor(Math.random()*choices.length)];
  const validEnc=(sp.encounters||[]).filter(e=>level>=Number(e.minLevel||1)&&level<=Number(e.maxLevel||100));
  const enc=validEnc[Math.floor(Math.random()*Math.max(1,validEnc.length))]||sp.encounters?.[0]||{};
  const trIds=Object.keys(d?.traits||{}),tr=trIds.length?d.traits[trIds[Math.floor(Math.random()*trIds.length)]]:null;
  let resources={hp:100,energy:Number(sp.baseEnergy)||65};try{resources=calculateRelianResources(level,tr)}catch{}
  const randAttr=()=>{try{return rollAttribute()}catch{return 20+Math.floor(Math.random()*20)}};
  return{side:'enemy',species:sp,nickname:sp.name,level,color:'basic',hp:resources.hp,maxHp:resources.hp,eng:resources.energy,maxEng:resources.energy,attack:randAttr(),defense:randAttr(),spAttack:randAttr(),spDefense:randAttr(),speed:randAttr(),precision:randAttr(),moves:getMovesFor(sp,level,null),pos:{x:W-2,y:Math.floor(H/2)},moved:false,acted:false,knocked:false,regionId:String(enc.region||''),biomeId:String(enc.biome||'')};
}
function aliveTeam(charSheet){
  return (charSheet?.character?.team||[]).map(m=>({member:m,sheet:savedById(m.savedSheetId)})).filter(x=>x.sheet && Number(x.sheet.hpCurrent??x.sheet.hpMax??1)>0);
}
function selectedCharacter(){return characters().find(s=>String(s.id)===String($('battleCharacterSelect')?.value));}
function selectedTeamEntry(){const c=selectedCharacter(), id=$('battleTeamSelect')?.value; if(!c||!id)return null; const m=(c.character?.team||[]).find(x=>String(x.savedSheetId)===String(id)); return m?{charSheet:c,member:m,sheet:savedById(id)}:null;}

function refreshSetup(){
 const cs=characters(), sel=$('battleCharacterSelect'); if(!sel)return;
 const fixed=fixedPlayer(),old=fixed?.id||sel.value;
 sel.innerHTML='<option value="">Selecione...</option>'+cs.map(s=>`<option value="${escapeHtml(s.id)}">${escapeHtml(s.character?.name||'Personagem')}</option>`).join('');
 if(cs.some(s=>String(s.id)===String(old)))sel.value=old;
 if(fixed){sel.disabled=true;sel.title='Personagem fixo definido na Página do Jogador.'}else{sel.disabled=false;sel.title=''}
 refreshTeam();
}
function refreshTeam(){
 const c=selectedCharacter(), sel=$('battleTeamSelect'); if(!sel)return;
 sel.innerHTML='<option value="">Selecione...</option>';
 if(!c)return;
 for(const m of c.character?.team||[]){const s=savedById(m.savedSheetId);if(!s)continue;const sp=species(s.speciesId);const hp=Number(s.hpCurrent??s.hpMax??1);sel.insertAdjacentHTML('beforeend',`<option value="${escapeHtml(s.id)}" ${hp<=0?'disabled':''}>${escapeHtml(m.nickname||s.nickname||sp?.name||'Relian')} · Nv.${Number(m.level||s.level||1)} · HP ${hp}/${Number(s.hpMax||'?')}</option>`)}
}
const escapeHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

function startBattle(player,enemy,label='Arena de Teste',options={}){
  if(!player||!enemy)return alert('Não foi possível montar os combatentes.');
  const empty=$('battleEmpty'),game=$('battleGame'),grid=$('battleGrid');
  if(!game||!grid)return alert('A Arena Tática não foi carregada corretamente. Recarregue a página.');

  ensureCombatState(player);ensureCombatState(enemy);ensureMoves(player);ensureMoves(enemy);
  resetUnitTurn(player);resetUnitTurn(enemy);

  battleActionView='none';
  const arenaRegion=String(options.regionId||enemy.regionId||'');const arenaTheme=arenaThemeForRegion(arenaRegion);
  battle={player,enemy,round:1,turn:null,mode:null,selectedMove:null,label,finished:false,terrain:makeTerrain(arenaTheme),arenaRegion,arenaTheme,animatingMove:false,modeType:options.modeType||'wild',trainerName:options.trainerName||'',trainerQueue:Array.isArray(options.trainerQueue)?options.trainerQueue:[],trainerReward:Number(options.trainerReward)||0,trainerLevel:Number(options.trainerLevel)||enemy.level||1};

  if(empty)empty.hidden=true;
  game.hidden=false;game.removeAttribute('hidden');game.style.display='grid';
  grid.hidden=false;grid.removeAttribute('hidden');grid.style.display='grid';

  const logBox=$('battleLog');if(logBox)logBox.innerHTML='';
  battle.turn=(Number(player.speed)||0)>=(Number(enemy.speed)||0)?'player':'enemy';

  log(`${player.nickname} enfrenta ${enemy.nickname}!`);
  setBattleActionView('none');
  render();

  if(battle.turn==='player'){
    if($('battleHint'))$('battleHint').textContent='Sua vez. Escolha uma ação.';
    battleToast('Sua vez','player',750);
  }else{
    if($('battleHint'))$('battleHint').textContent=`${enemy.nickname} começa a batalha.`;
    battleToast('Turno do inimigo','enemy',750);
    setTimeout(enemyTurn,520);
  }

  requestAnimationFrame(renderGrid);
}
function startVsGenerated(g){
 pendingGeneratedBattle=g;
 const fixed=fixedPlayer();
 if(!fixed){openPlayerPage();renderPlayerPage();return}
 pendingGeneratedBattle=null;
 chooseTeamForGenerated(g,fixed);
}
function openBattleTab(){
  const btn=document.querySelector('.tab[data-tab="battleTest"]')||document.querySelector('[data-tab="battleTest"]');
  if(btn)btn.click();
  const panel=document.getElementById('battleTest');
  if(panel){panel.hidden=false;panel.classList.add('active');}
}

const TRAINER_NAMES=['Mira','Kael','Toren','Lumi','Ravi','Selene','Dario','Nira','Valen','Aya','Ciro','Mael'];
function buildTrainerEncounter(level){
  const lv=clamp(Number(level)||5,1,100);
  const fixed=fixedPlayer(),stats=fixed?ensureBattleStats(fixed):{trainerWins:0};
  const rank=playerRank(stats.trainerWins);
  const teamSize=rank==='Mestre'?4:['Platina','Ouro'].includes(rank)?3:2;
  const trainer=TRAINER_NAMES[Math.floor(Math.random()*TRAINER_NAMES.length)];
  const team=Array.from({length:teamSize},(_,i)=>buildRandomEnemy(clamp(lv+(i?Math.floor(Math.random()*5)-2:0),1,100))).filter(Boolean);
  team.forEach(e=>{e.trainerOwned=true});
  return {trainer,team,level:lv,reward:trainerRewardFor(team.length,lv)};
}
function trainerBattle(){
  const entry=selectedTeamEntry();
  if(!entry)return alert('Escolha um personagem e um Relian da equipe.');
  const lv=clamp(Number($('battleRandomLevel')?.value)||entry.member.level||1,1,100);
  const encounter=buildTrainerEncounter(lv);
  if(!encounter.team.length)return alert('Não foi possível gerar a equipe do treinador.');
  const first=encounter.team.shift();
  startBattle(buildFromSaved(entry.sheet,entry.member,entry.charSheet),first,`Treinador ${encounter.trainer}`,{
    modeType:'trainer',trainerName:encounter.trainer,trainerQueue:encounter.team,trainerReward:encounter.reward,trainerLevel:lv
  });
}
function nextTrainerRelian(){
  if(!battle||battle.modeType!=='trainer'||!battle.trainerQueue?.length)return false;
  const next=battle.trainerQueue.shift();
  next.pos={x:W-2,y:Math.floor(H/2)};
  ensureCombatState(next);ensureMoves(next);resetUnitTurn(next);
  battle.enemy=next;
  battle.finished=false;
  battle.mode=null;battle.selectedMove=null;
  log(`${battle.trainerName} enviou ${next.nickname}!`);
  battleToast(`${battle.trainerName} enviou ${next.nickname}`,'enemy',1100);
  beginPlayerTurn({processStart:false});
  return true;
}

function randomBattle(){const entry=selectedTeamEntry();if(!entry)return alert('Escolha um personagem e um Relian da equipe.');const lv=clamp(Number($('battleRandomLevel').value)||entry.member.level||1,1,100);startBattle(buildFromSaved(entry.sheet,entry.member,entry.charSheet),buildRandomEnemy(lv),'Batalha aleatória');}

function render(){
  if(!battle)return;

  const game=$('battleGame'),grid=$('battleGrid');
  if(game){game.hidden=false;game.style.display='grid'}
  if(grid){grid.hidden=false;grid.style.display='grid'}

  renderHud();
  renderGrid();
  renderMoves();

  if($('battleArenaTitle')){const theme=arenaThemeInfo(battle.arenaTheme);$('battleArenaTitle').textContent=`${battle.label} · ${theme.label}`;}
  if($('battleTurnLabel'))$('battleTurnLabel').textContent=battle.finished?'Encerrado':battle.turn==='player'?'Seu Relian':'Inimigo';
  if($('battleRoundLabel'))$('battleRoundLabel').textContent=`Rodada ${battle.round}`;

  const playerTurn=battle.turn==='player'&&!battle.finished&&battle.player.hp>0&&!battle.animatingMove;
  if($('battleMoveBtn'))$('battleMoveBtn').disabled=!playerTurn||battle.player.moved;
  if($('battleEndTurnBtn'))$('battleEndTurnBtn').disabled=!playerTurn;
  if($('battleMovesBtn'))$('battleMovesBtn').disabled=!playerTurn||battle.player.acted;
  if($('battleItemsBtn'))$('battleItemsBtn').disabled=!playerTurn||battle.player.acted;

  if(!playerTurn&&battleActionView!=='none')battleActionView='none';
  setBattleActionView(battleActionView);
}
function renderHud(){renderCard($('battlePlayerCard'),battle.player,false);renderCard($('battleEnemyCard'),battle.enemy,true)}
function renderCard(box,c,enemy){
 const img=imageFor(c.species,c.color),mov=maxWalk(c);
 box.innerHTML=`${enemy?'':avatar(img,c)}<div>
   <div class="battle-mon-name">${escapeHtml(c.nickname)}</div>
   <div class="battle-mon-meta">${escapeHtml(c.species?.name||'')} · Nv. ${c.level}${c.side==='player'&&c.sheetId?` · XP ${Number(savedById(c.sheetId)?.xp||0)}/${xpNeeded(c.level)}`:''}</div>
   <div class="battle-tactical-meta"><span>VEL ${Math.round(c.speed||0)}</span><span>MOV ${mov}</span></div>
   <div class="battle-status-tags">${c.status?.burn?'<span>🔥 Queimado</span>':''}${c.status?.speedDown?'<span>🐌 Lento</span>':''}${c.status?.defenseUp?'<span>🛡 Defesa+</span>':''}</div>
   <div class="battle-bars">
     <div class="battle-resource-line"><span>HP</span><b>${Math.max(0,Math.round(c.hp))}/${Math.round(c.maxHp)}</b></div>
     <div class="battle-bar hp"><i style="width:${pct(c.hp,c.maxHp)}%"></i></div>
     <div class="battle-resource-line"><span>ENG</span><b>${Math.max(0,Math.round(c.eng))}/${Math.round(c.maxEng)}</b></div>
     <div class="battle-bar eng"><i style="width:${pct(c.eng,c.maxEng)}%"></i></div>
   </div>
 </div>${enemy?avatar(img,c):''}`;
}
function renderGrid(){
  if(!battle)return;
  const grid=$('battleGrid');
  if(!grid)return;
  grid.hidden=false;
  grid.removeAttribute('hidden');
  grid.style.display='grid';
  grid.innerHTML='';
  for(let y=0;y<H;y++){
    for(let x=0;x<W;x++){
      const pos={x,y};
      const cell=document.createElement('button');
      cell.type='button';
      cell.className='battle-cell';
      cell.dataset.x=String(x);
      cell.dataset.y=String(y);
      const arenaSprite=arenaCellSprite(pos);
      cell.style.setProperty('--arena-tile-image',`url("${arenaSprite}")`);
      cell.dataset.arenaSprite=arenaSprite.split('/').pop()||'';
      cell.classList.add(`arena-theme-${battle.arenaTheme||'terra'}`);

      const terrain=terrainAt(pos);
      if(terrain)cell.classList.add(`terrain-${terrain}`);
      if(terrain==='rock')cell.title='Obstáculo: bloqueia movimento';
      if(terrain==='energy')cell.title='Casa energética: recupera ENG ao fim do turno';

      if(battle.mode==='move'&&canReach(pos))cell.classList.add('move-reachable');
      if(battle.mode==='attack'&&battle.selectedMove&&dist(battle.player.pos,pos)<=parseRange(battle.selectedMove)){
        cell.classList.add('attack-reachable');
      }
      if(
        battle.mode==='attack'&&battle.selectedMove&&
        dist(battle.player.pos,battle.enemy.pos)<=parseRange(battle.selectedMove)&&
        inArea(battle.enemy.pos,pos,battle.selectedMove,battle.player.pos)
      )cell.classList.add('attack-area');

      const occupant=at(pos);
      if(occupant){
        const img=imageFor(occupant.species,occupant.color);
        cell.innerHTML=`<div class="battle-token ${occupant.side}">${
          img?`<img src="${escapeHtml(img)}" alt="${escapeHtml(occupant.nickname)}">`
             :`<span>${escapeHtml((occupant.nickname||'?')[0])}</span>`
        }</div>`;
      }else if(terrain==='rock'){
        cell.innerHTML='<span class="battle-terrain-icon arena-fallback-icon">◆</span>';
      }else if(terrain==='energy'){
        cell.innerHTML='<span class="battle-terrain-icon arena-fallback-icon">✦</span>';
      }else if(terrain==='decor'){
        cell.innerHTML='<span class="battle-terrain-icon arena-fallback-icon decor">·</span>';
      }

      cell.setAttribute('aria-label',`Casa ${x+1}, ${y+1}`);
      cell.onclick=()=>cellClick({x,y});
      grid.appendChild(cell);
    }
  }
}

function at(pos){for(const c of [battle.player,battle.enemy])if(!c.knocked&&c.pos.x===pos.x&&c.pos.y===pos.y)return c;return null}
function canReach(pos){
 if(!battle||at(pos)||terrainAt(pos)==='rock'||battle.player.moved)return false;
 const path=findBattlePath(battle.player.pos,pos);
 const limit=Math.min(maxWalk(battle.player),Math.floor(battle.player.eng/MOVE_ENG));
 return path.length>0&&path.length<=limit;
}
function returnBattleCommandHome(){
  if(!battle)return;
  battle.mode=null;
  battle.selectedMove=null;
  document.querySelectorAll('.battle-move-btn.active').forEach(x=>x.classList.remove('active'));
  setBattleActionView('none');
  closeBattleBag();
  renderGrid();
  const hint=$('battleHint');if(hint)hint.textContent='Escolha uma ação.';
}

function cellClick(pos){
 if(!battle||battle.turn!=='player'||battle.finished||battle.animatingMove)return;

 if(battle.mode==='move'){
   if(canReach(pos)){animatePlayerMovement({x:Number(pos.x),y:Number(pos.y)});return}
   $('battleHint').textContent='Essa casa não pode ser alcançada neste turno.';
   return;
 }

 if(battle.mode==='attack'&&battle.selectedMove){
   const move=battle.selectedMove,range=parseRange(move),target=at(pos);
   const d=dist(battle.player.pos,pos);

   if(!target||target.side!=='enemy'){
     $('battleHint').textContent='Clique no Relian inimigo destacado para usar o golpe.';
     return;
   }
   if(d>range){
     $('battleHint').textContent=`${target.nickname} está fora do alcance. ${moveName(move)} alcança ${range} casa${range===1?'':'s'} e o alvo está a ${d}.`;
     battleToast('Alvo fora de alcance','miss',1100);
     return;
   }
   playerAttack(move,target);
 }
}

function renderMoves(){
 const box=$('battleMoves');if(!box||!battle)return;
 box.innerHTML='';
 const enemyDistance=dist(battle.player.pos,battle.enemy.pos);

 for(const m of battle.player.moves||[]){
  const cost=moveCost(m),range=parseRange(m),area=areaRadius(m),support=moveDamage(m)<=0;
  const enoughEng=battle.player.eng>=cost;
  const b=document.createElement('button');
  b.type='button';b.className='battle-move-btn';
  b.disabled=battle.turn!=='player'||battle.finished||battle.player.acted||!enoughEng;

  const rangeState=support?'Suporte':enemyDistance<=range?'NO ALCANCE':`Alvo a ${enemyDistance}`;
  b.innerHTML=`<b>${escapeHtml(moveName(m))}</b><strong>${cost} ENG</strong><small>${support?'Suporte':`Dano ${moveDamage(m)}`} · Alcance ${range}${area?` · ${shapeLabel(m)} ${area}`:' · Alvo único'} · ${rangeState}</small>`;
  b.title=!enoughEng?`ENG insuficiente: precisa de ${cost}.`:`${moveName(m)} · ${cost} ENG · Alcance ${range}`;

  b.onclick=()=>{
    if(!enoughEng){
      $('battleHint').textContent=`ENG insuficiente para ${moveName(m)}.`;
      return;
    }
    if(support){
      if(useSupportMove(battle.player,m)){
        battle.player.acted=true;
        render();
        setTimeout(()=>beginEnemyTurn({processStart:true}),350);
      }
      return;
    }

    battle.mode='attack';
    battle.selectedMove=m;
    setBattleActionView('moves');
    const distance=dist(battle.player.pos,battle.enemy.pos);
    $('battleHint').textContent=distance<=range
      ?`${moveName(m)} selecionado. Clique em ${battle.enemy.nickname} para atacar.`
      :`${moveName(m)} selecionado, mas o alvo está a ${distance} casas. Alcance: ${range}. Mova-se para mais perto.`;
    renderGrid();
    box.querySelectorAll('.battle-move-btn').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
  };
  box.appendChild(b);
 }
}

function damage(attacker,defender,m){
 const special=['EFT','HIB'].includes(String(m?.type||m?.tipo||'').toUpperCase());
 const atk=special?attacker.spAttack:attacker.attack;
 let def=special?defender.spDefense:defender.defense;
 ensureCombatState(defender);
 if(defender.status.defenseUp)def+=defender.status.defenseUp*8;
 let raw=moveDamage(m)+(modifierFromAttr(atk)*2)-modifierFromAttr(def);
 if(terrainAt(defender.pos)==='rock')raw*=.8;
 const variance=.9+Math.random()*.2;return Math.max(1,Math.round(raw*variance));
}
function hit(attacker,m){const acc=clamp(moveAccuracy(m)+modifierFromAttr(attacker.precision),5,100);return Math.random()*100<acc}
function playerAttack(m,target){
  if(!battle||battle.finished||battle.turn!=='player'||battle.player.acted)return false;
  if(!m||!target||target.side!=='enemy')return false;

  const range=parseRange(m),distance=dist(battle.player.pos,target.pos),cost=moveCost(m);

  if(distance>range){
    if($('battleHint'))$('battleHint').textContent=`Alvo fora do alcance (${distance}/${range}).`;
    battleToast('Alvo fora de alcance','miss',900);
    return false;
  }
  if(battle.player.eng<cost){
    if($('battleHint'))$('battleHint').textContent=`ENG insuficiente: ${moveName(m)} custa ${cost} ENG.`;
    battleToast('ENG insuficiente','miss',900);
    return false;
  }

  battle.player.eng=Math.max(0,battle.player.eng-cost);
  battle.player.acted=true;
  battle.mode=null;
  battle.selectedMove=null;
  setBattleActionView('none');

  if(hit(battle.player,m)){
    const dealt=damage(battle.player,target,m);
    target.hp=Math.max(0,target.hp-dealt);
    log(`${battle.player.nickname} usou ${moveName(m)} e causou ${dealt} de dano!`);
    battleToast(`-${dealt} HP em ${target.nickname}`,'damage');
    flashCombatant('enemy','hit');
    applyMoveEffects(battle.player,target,m);
  }else{
    log(`${battle.player.nickname} usou ${moveName(m)}, mas errou!`);
    battleToast('O golpe errou!','miss');
  }

  render();
  if(target.hp<=0){victory();return true}
  setTimeout(()=>beginEnemyTurn({processStart:true}),420);
  return true;
}
function endPlayerTurn(){
  if(!battle||battle.finished||battle.turn!=='player'||battle.animatingMove)return;
  terrainEnd(battle.player);
  beginEnemyTurn({processStart:true});
}
function aiScoreMove(e,p,m){
 const cost=moveCost(m),d=moveDamage(m),range=parseRange(m),distance=dist(e.pos,p.pos);
 if(cost>e.eng)return -9999;
 if(d<=0)return e.hp<e.maxHp*.45?35:8;
 let score=d*2-cost*.15+range*2;
 if(distance<=range)score+=45;
 if(d>=p.hp)score+=100;
 return score;
}

function findPathForUnit(unit,goal){
  if(!battle||!unit)return [];
  const key=p=>`${p.x},${p.y}`;
  const start={x:Number(unit.pos.x),y:Number(unit.pos.y)};
  const target={x:Number(goal.x),y:Number(goal.y)};
  const q=[start],prev=new Map([[key(start),null]]);
  const targetKey=key(target);

  while(q.length){
    const cur=q.shift();
    if(key(cur)===targetKey)break;
    for(const n of neighbors(cur)){
      const k=key(n);
      if(prev.has(k)||terrainAt(n)==='rock')continue;
      const occupied=at(n);
      if(occupied&&occupied!==unit&&k!==targetKey)continue;
      prev.set(k,key(cur));
      q.push({x:Number(n.x),y:Number(n.y)});
    }
  }

  if(!prev.has(targetKey))return [];
  const path=[];let k=targetKey,startKey=key(start);
  while(k&&k!==startKey){
    const [x,y]=k.split(',').map(Number);
    path.push({x,y});
    k=prev.get(k);
  }
  return path.reverse();
}

function bestStepToward(e,p,range){
  const max=Math.min(maxWalk(e),Math.floor(Math.max(0,e.eng)/MOVE_ENG));
  if(max<=0)return {pos:{...e.pos},steps:0};

  let best={pos:{...e.pos},steps:0,score:Math.max(0,dist(e.pos,p.pos)-range)*10};
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
    const pos={x,y};
    if((x===e.pos.x&&y===e.pos.y)||terrainAt(pos)==='rock'||at(pos))continue;
    const path=findPathForUnit(e,pos);
    if(!path.length||path.length>max)continue;
    const d=dist(pos,p.pos);
    const score=Math.max(0,d-range)*10+path.length+(terrainAt(pos)==='energy'?-0.25:0);
    if(score<best.score)best={pos,steps:path.length,score};
  }
  return {pos:best.pos,steps:best.steps};
}
function enemyUseMove(e,p,m){
  const cost=moveCost(m);
  if(e.eng<cost)return false;

  if(moveDamage(m)<=0){
    const ok=useSupportMove(e,m);
    if(ok)e.acted=true;
    return ok;
  }

  e.eng=Math.max(0,e.eng-cost);
  e.acted=true;

  if(hit(e,m)){
    const dealt=damage(e,p,m);
    p.hp=Math.max(0,p.hp-dealt);
    log(`${e.nickname} usou ${moveName(m)} e causou ${dealt} de dano!`);
    battleToast(`-${dealt} HP em ${p.nickname}`,'damage');
    flashCombatant('player','hit');
    applyMoveEffects(e,p,m);
  }else{
    log(`${e.nickname} usou ${moveName(m)}, mas errou!`);
    battleToast(`${e.nickname} errou!`,'miss');
  }
  return true;
}
function enemyTurn(){
  if(!battle||battle.finished||battle.turn!=='enemy')return;

  const e=battle.enemy,p=battle.player;
  ensureMoves(e);

  const usable=(e.moves||[])
    .filter(m=>e.eng>=moveCost(m))
    .sort((a,b)=>aiScoreMove(e,p,b)-aiScoreMove(e,p,a));

  let chosen=usable[0]||null;
  let range=chosen?parseRange(chosen):1;

  if(chosen&&moveDamage(chosen)<=0&&aiScoreMove(e,p,chosen)>25){
    enemyUseMove(e,p,chosen);
  }else{
    const attacks=usable.filter(m=>moveDamage(m)>0).sort((a,b)=>aiScoreMove(e,p,b)-aiScoreMove(e,p,a));
    if(attacks.length){chosen=attacks[0];range=parseRange(chosen)}

    if(!chosen||dist(e.pos,p.pos)>range){
      const walk=bestStepToward(e,p,range);
      if(walk.steps>0){
        e.pos={...walk.pos};
        const cost=walk.steps*MOVE_ENG;
        e.eng=Math.max(0,e.eng-cost);
        log(`${e.nickname} se moveu ${walk.steps} casa${walk.steps>1?'s':''} (-${cost} ENG).`);
        renderGrid();
      }
    }

    if(chosen&&dist(e.pos,p.pos)<=range&&e.eng>=moveCost(chosen)){
      enemyUseMove(e,p,chosen);
    }else{
      log(`${e.nickname} encerrou o turno sem atacar.`);
    }
  }

  terrainEnd(e);
  render();
  if(p.hp<=0)return defeatPlayer();

  battle.round++;
  setTimeout(()=>beginPlayerTurn({processStart:true}),320);
}
function xpRewardFor(enemy,player){
 const rarity=String(enemy?.species?.rarity||'comum').toLowerCase();
 const mult={comum:1,incomum:1.15,raro:1.35,lendario:1.7,mitico:2,unico:2.2}[rarity]||1;
 const levelGap=(Number(enemy?.level)||1)-(Number(player?.level)||1);
 const gapMult=clamp(1+levelGap*.06,.6,1.6);
 return Math.max(10,Math.round((22+(Number(enemy?.level)||1)*8)*mult*gapMult));
}
function showBattleResult(type,title,description,xp=0,levels=0){
  document.querySelector('.battle-result-overlay')?.remove();
  const overlay=document.createElement('div');
  overlay.className=`battle-result-overlay ${type}`;
  const icon=type==='victory'?'✦':type==='capture'?'◈':'×';
  overlay.innerHTML=`<div class="battle-result-burst"></div><div class="battle-result-card">
    <div class="battle-result-icon">${icon}</div>
    <div class="section-kicker">${type==='victory'?'VITÓRIA':type==='capture'?'CAPTURA CONCLUÍDA':'FIM DA BATALHA'}</div>
    <h2>${escapeHtml(title)}</h2><p>${escapeHtml(description)}</p>
    ${xp?`<div class="battle-result-rewards"><b>+${xp} XP</b>${levels?`<span>+${levels} nível${levels>1?'s':''}</span>`:''}</div>`:''}
    <button type="button" class="primary" data-close-result="1">Continuar</button>
  </div>`;
  document.body.appendChild(overlay);
  requestAnimationFrame(()=>overlay.classList.add('show'));
  overlay.querySelector('[data-close-result]').onclick=()=>{overlay.classList.remove('show');setTimeout(()=>overlay.remove(),180);if(battle&&!battle.finished)returnBattleCommandHome?.();};
}

function victory(){
  battle.enemy.knocked=true;
  syncPlayerResources();
  const xp=xpRewardFor(battle.enemy,battle.player),levels=awardXp(battle.player,xp);
  log(`${battle.enemy.nickname} foi derrotado! ${battle.player.nickname} ganhou ${xp} XP.${levels?` Subiu ${levels} nível${levels>1?'s':''}!`:''}`);

  if(battle.modeType==='trainer'&&battle.trainerQueue?.length){
    render();
    setTimeout(nextTrainerRelian,520);
    return;
  }

  battle.finished=true;battleActionView='none';setBattleActionView('none');

  if(battle.modeType==='trainer'){
    recordPlayerResult('trainerWin');
    const reward=addPlayerCredits(battle.trainerReward,`Vitória contra ${battle.trainerName}`);
    $('battleHint').textContent=`Vitória sobre ${battle.trainerName}! +${reward} C$`;
    render();
    setTimeout(()=>showBattleResult('victory',`Você venceu ${battle.trainerName}!`,`Recompensa: ${reward} C$ · Rank ${playerRank(ensureBattleStats(fixedPlayer()).trainerWins)}`,xp,levels),260);
  }else{
    recordPlayerResult('win');
    $('battleHint').textContent=`Vitória! +${xp} XP`;
    render();
    setTimeout(()=>showBattleResult('victory','Vitória!',`${battle.enemy.nickname} foi derrotado.`,xp,levels),260);
  }
}
function xpNeeded(level){return 70+level*30}
function awardXp(c,amount){
 const s=savedById(c.sheetId);if(!s)return 0;
 s.xp=Math.max(0,Number(s.xp)||0)+amount;let up=0;
 const oldHpMax=Math.max(1,Number(s.hpMax)||c.maxHp||1),oldEngMax=Math.max(1,Number(s.engMax)||c.maxEng||1);
 while(s.xp>=xpNeeded(s.level||c.level)){s.xp-=xpNeeded(s.level||c.level);s.level=Math.min(100,(Number(s.level)||c.level)+1);up++;if(s.level>=100){s.xp=0;break}}
 const char=characters().find(x=>String(x.id)===String(c.characterId));const member=char?.character?.team?.find(m=>String(m.savedSheetId)===String(s.id));if(member)member.level=s.level;c.level=s.level;
 const tr=traitById(s.traitId);try{const r=calculateRelianResources(s.level,tr);s.hpMax=Math.max(oldHpMax,r.hp);s.engMax=Math.max(oldEngMax,r.energy);if(up){s.hpCurrent=Math.min(s.hpMax,Math.max(0,Number(s.hpCurrent)||0)+(s.hpMax-oldHpMax));s.engCurrent=Math.min(s.engMax,Math.max(0,Number(s.engCurrent)||0)+(s.engMax-oldEngMax));c.maxHp=s.hpMax;c.maxEng=s.engMax;c.hp=s.hpCurrent;c.eng=s.engCurrent}}catch{}
 doSave();return up
}
function syncPlayerResources(){const s=savedById(battle.player.sheetId);if(!s)return;const hpMax=Math.max(1,Number(s.hpMax)||Number(battle.player.maxHp)||1),engMax=Math.max(1,Number(s.engMax)||Number(battle.player.maxEng)||1);s.hpMax=hpMax;s.engMax=engMax;s.hpCurrent=clamp(Math.round(battle.player.hp),0,hpMax);s.engCurrent=clamp(Math.round(battle.player.eng),0,engMax);doSave();refreshTeam()}
function defeatPlayer(){battle.player.knocked=true;syncPlayerResources();log(`${battle.player.nickname} não consegue mais lutar.`);render();showSwitch()}
function showSwitch(){const c=characters().find(x=>String(x.id)===String(battle.player.characterId));const candidates=aliveTeam(c).filter(x=>String(x.sheet.id)!==String(battle.player.sheetId));const over=document.createElement('div');over.className='battle-switch-overlay';over.innerHTML=`<div class="card battle-switch-dialog"><div><div class="section-kicker">RELIAN DERROTADO</div><h2>Escolha outro Relian</h2><p>${candidates.length?'Você pode continuar a batalha com outro membro da equipe.':'Nenhum outro Relian está apto a lutar.'}</p></div><div class="battle-switch-list">${candidates.map(x=>`<button type="button" class="battle-switch-choice" data-switch="${escapeHtml(x.sheet.id)}"><b>${escapeHtml(x.member.nickname||x.sheet.nickname||x.sheet.speciesName)}</b><span>Nv. ${x.member.level||x.sheet.level}</span></button>`).join('')}</div><button type="button" class="danger" data-flee-switch="1">Fugir do combate</button></div>`;document.body.appendChild(over);over.querySelectorAll('[data-switch]').forEach(b=>b.onclick=()=>{const found=candidates.find(x=>String(x.sheet.id)===b.dataset.switch);if(!found)return;const old=battle.player.pos;battle.player=buildFromSaved(found.sheet,found.member,c);ensureCombatState(battle.player);ensureMoves(battle.player);battle.player.pos=old;battle.player.knocked=false;battle.player.moved=false;battle.player.acted=false;battle.mode=null;battle.selectedMove=null;battle.turn='player';battle.finished=false;over.remove();log(`${battle.player.nickname} entrou no campo!`);$('battleHint').textContent=`${battle.player.nickname} entrou no combate. Escolha uma ação.`;render()});over.querySelector('[data-flee-switch]').onclick=()=>{over.remove();if(!candidates.length){if(!battle.finished){battle.finished=true;recordPlayerResult('loss');showBattleResult('defeat','Derrota','Todos os Relians aptos do personagem foram derrotados.')}}else flee()}}
function flee(){if(!battle||battle.finished)return;syncPlayerResources();battle.finished=true;recordPlayerResult('escape');$('battleHint').textContent='Combate encerrado.';log('Você fugiu do combate.');render();showBattleResult('flee','Você fugiu','A batalha terminou sem vencedor.')}
function log(txt){const box=$('battleLog');if(!box)return;const row=document.createElement('div');row.className='battle-log-entry';row.textContent=txt;box.prepend(row)}

function init(){
 refreshSetup();
 $('battleCharacterSelect')?.addEventListener('change',()=>{refreshTeam();const lv=$('battleRandomLevel');if(lv)lv.value=5});
 $('setFixedPlayerBtn')?.addEventListener('click',()=>{
   const id=$('fixedPlayerSelect')?.value;
   if(!id)return alert('Escolha um personagem.');
   setFixedPlayer(id);
   const pending=pendingGeneratedBattle;
   if(pending){pendingGeneratedBattle=null;const c=fixedPlayer();if(c)chooseTeamForGenerated(pending,c)}
 });
 $('clearFixedPlayerBtn')?.addEventListener('click',()=>setFixedPlayer(''));
 $('recoverAllTeamBtn')?.addEventListener('click',recoverAllTeam);
 $('shopSearchInput')?.addEventListener('input',renderShop);
 $('fixedPlayerSelect')?.addEventListener('change',()=>{});
 document.addEventListener('click',e=>{
   if(e.target.closest('[data-tab="playerPage"]'))setTimeout(renderPlayerPage,0);
   if(e.target.closest('[data-tab="shopPage"]'))setTimeout(renderShop,0);
   if(e.target.closest('[data-tab="recoveryPage"]'))setTimeout(renderRecoveryPage,0);
   const playerGo=e.target.closest('[data-player-go]');
   const recoveryGo=e.target.closest('[data-recovery-go]');
   const shopGo=e.target.closest('[data-shop-go]');
   const target=playerGo?.dataset.playerGo||recoveryGo?.dataset.recoveryGo||shopGo?.dataset.shopGo;
   if(target)document.querySelector(`.tab[data-tab="${target}"]`)?.click();
 });
 renderPlayerPage();
 renderShop();
 renderRecoveryPage();
 $('battleTeamSelect')?.addEventListener('change',()=>{const entry=selectedTeamEntry(),lv=$('battleRandomLevel');if(entry&&lv)lv.value=clamp(Number(entry.member?.level||entry.sheet?.level||1),1,100)});
 $('battleRandomBtn')?.addEventListener('click',randomBattle);
 $('battleTrainerBtn')?.addEventListener('click',trainerBattle);
 $('battleMoveBtn')?.addEventListener('click',()=>{
   if(!battle||battle.turn!=='player'||battle.finished||battle.animatingMove)return;
   returnBattleCommandHome();
   battle.mode='move';battle.selectedMove=null;
   const limit=Math.min(maxWalk(battle.player),Math.floor(battle.player.eng/MOVE_ENG));
   $('battleHint').textContent=`Escolha uma casa destacada. Velocidade ${Math.round(battle.player.speed||0)} = até ${limit} casa${limit===1?'':'s'} neste turno.`;
   renderGrid();
 });
 $('battleEndTurnBtn')?.addEventListener('click',endPlayerTurn);
 $('battleActionBackBtn')?.addEventListener('click',returnBattleCommandHome);
 $('battleMovesBtn')?.addEventListener('click',()=>{if(!battle||battle.turn!=='player'||battle.finished||battle.player.acted)return;closeBattleBag();setBattleActionView('moves');});
 $('battleItemsBtn')?.addEventListener('click',()=>openBattleBag());
 $('battleBagOpenBtn')?.addEventListener('click',openBattleBag);
 document.addEventListener('click',e=>{if(e.target.closest('[data-close-bag]'))closeBattleBag()});
 $('battleItemSaveBtn')?.addEventListener('click',saveBattleItemFromForm);
 $('battleItemClearBtn')?.addEventListener('click',()=>{if($('battleItemName'))$('battleItemName').value='';if($('battleItemDescription'))$('battleItemDescription').value='';});
 renderBattleItemLibrary();
 $('battleFleeBtn')?.addEventListener('click',()=>{if(confirm('Fugir deste combate?'))flee()});
 document.addEventListener('click',e=>{const b=e.target.closest('[data-battle-generated]');if(!b)return;const g=window.reliansBattleGetGenerated?.(b.dataset.uid);if(g)startVsGenerated(g)});
 document.addEventListener('click',e=>{if(e.target.closest('[data-tab="battleTest"]'))setTimeout(refreshSetup,0)});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
