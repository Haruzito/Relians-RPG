(()=>{
'use strict';
const W=14,H=9,MOVE_ENG=2;
const $=id=>document.getElementById(id);
let battle=null;

const ARENA_SETTINGS_KEY='relians-battle-arena-settings-v1';
const ARENA_DIFFICULTY_PRESETS={
  casual:{id:'casual',label:'Casual',summary:'Combates mais leves, captura facilitada e menor pressão de ENG.',enemyLevel:-2,enemyStats:.85,aiMistake:35,playerMoveCost:.8,trainerExtra:-1,capture:1.2,credits:.9,xp:.95,drops:.9},
  normal:{id:'normal',label:'Normal',summary:'Experiência equilibrada, pensada como padrão do Battle Arena.',enemyLevel:0,enemyStats:1,aiMistake:12,playerMoveCost:1,trainerExtra:0,capture:1,credits:1,xp:1,drops:1},
  hard:{id:'hard',label:'Desafiador',summary:'Inimigos mais fortes e eficientes, com recompensas um pouco maiores.',enemyLevel:2,enemyStats:1.12,aiMistake:4,playerMoveCost:1.15,trainerExtra:1,capture:.9,credits:1.15,xp:1.12,drops:1.15},
  nightmare:{id:'nightmare',label:'Pesadelo',summary:'Adversários muito mais perigosos, captura severa e gerenciamento de ENG exigente.',enemyLevel:4,enemyStats:1.25,aiMistake:0,playerMoveCost:1.3,trainerExtra:2,capture:.78,credits:1.35,xp:1.25,drops:1.35}
};
function defaultArenaSettings(){return {...ARENA_DIFFICULTY_PRESETS.normal}}
function clampArenaSettings(raw={}){
  return {
    id:String(raw.id||'custom'),label:String(raw.label||'Personalizado'),summary:String(raw.summary||'Configuração personalizada.'),
    enemyLevel:clamp(Number(raw.enemyLevel)||0,-5,8),
    enemyStats:clamp(Number(raw.enemyStats)||1,.7,1.5),
    aiMistake:clamp(Number(raw.aiMistake)||0,0,45),
    playerMoveCost:clamp(Number(raw.playerMoveCost)||1,.7,1.6),
    trainerExtra:clamp(Math.round(Number(raw.trainerExtra)||0),-1,3),
    capture:clamp(Number(raw.capture)||1,.6,1.4),
    credits:clamp(Number(raw.credits)||1,.7,1.6),
    xp:clamp(Number(raw.xp)||1,.7,1.6),
    drops:clamp(Number(raw.drops)||1,.6,1.6)
  };
}
function loadArenaSettings(){
  try{
    const raw=JSON.parse(localStorage.getItem(ARENA_SETTINGS_KEY)||'null');
    return raw?clampArenaSettings(raw):defaultArenaSettings();
  }catch{return defaultArenaSettings()}
}
let arenaSettings=loadArenaSettings();
function saveArenaSettings(next){
  arenaSettings=clampArenaSettings(next);
  try{localStorage.setItem(ARENA_SETTINGS_KEY,JSON.stringify(arenaSettings))}catch{}
  renderArenaSettings();
  return arenaSettings;
}
function arenaPlayerMoveCost(){return Math.max(1,Math.round(MOVE_ENG*arenaSettings.playerMoveCost))}
function applyDifficultyToEnemy(enemy){
  if(!enemy)return enemy;
  const mult=arenaSettings.enemyStats;
  for(const key of ['attack','defense','spAttack','spDefense','speed','precision'])enemy[key]=Math.max(1,Math.round((Number(enemy[key])||1)*mult));
  const oldMax=Math.max(1,Number(enemy.maxHp)||1),oldEng=Math.max(1,Number(enemy.maxEng)||1);
  enemy.maxHp=Math.max(1,Math.round(oldMax*mult));
  enemy.hp=enemy.maxHp;
  enemy.maxEng=Math.max(1,Math.round(oldEng*(.92+mult*.08)));
  enemy.eng=enemy.maxEng;
  return enemy;
}
function detectArenaPreset(settings=arenaSettings){
  for(const preset of Object.values(ARENA_DIFFICULTY_PRESETS)){
    if(['enemyLevel','enemyStats','aiMistake','playerMoveCost','trainerExtra','capture','credits','xp','drops'].every(k=>Math.abs(Number(settings[k])-Number(preset[k]))<.0001))return preset;
  }
  return {id:'custom',label:'Personalizado',summary:'Você ajustou manualmente os modificadores do Battle Arena.'};
}
function setArenaDifficultyPreset(id){
  const preset=ARENA_DIFFICULTY_PRESETS[id]||ARENA_DIFFICULTY_PRESETS.normal;
  saveArenaSettings({...preset});
}
function arenaSettingFromInputs(){
  return {
    id:'custom',label:'Personalizado',summary:'Configuração personalizada.',
    enemyLevel:Number($('settingEnemyLevel')?.value)||0,
    enemyStats:(Number($('settingEnemyStats')?.value)||100)/100,
    aiMistake:Number($('settingAiMistake')?.value)||0,
    playerMoveCost:(Number($('settingMoveCost')?.value)||100)/100,
    trainerExtra:Number($('settingTrainerExtra')?.value)||0,
    capture:(Number($('settingCapture')?.value)||100)/100,
    credits:(Number($('settingCredits')?.value)||100)/100,
    xp:(Number($('settingXp')?.value)||100)/100,
    drops:(Number($('settingDrops')?.value)||100)/100
  };
}
function renderArenaSettings(){
  const preset=detectArenaPreset(arenaSettings);
  const set=(id,val)=>{const e=$(id);if(e)e.value=String(val)};
  set('settingEnemyLevel',arenaSettings.enemyLevel);
  set('settingEnemyStats',Math.round(arenaSettings.enemyStats*100));
  set('settingAiMistake',arenaSettings.aiMistake);
  set('settingMoveCost',Math.round(arenaSettings.playerMoveCost*100));
  set('settingTrainerExtra',arenaSettings.trainerExtra);
  set('settingCapture',Math.round(arenaSettings.capture*100));
  set('settingCredits',Math.round(arenaSettings.credits*100));
  set('settingXp',Math.round(arenaSettings.xp*100));
  set('settingDrops',Math.round(arenaSettings.drops*100));
  const outs={
    settingEnemyLevelOut:`${arenaSettings.enemyLevel>=0?'+':''}${arenaSettings.enemyLevel}`,
    settingEnemyStatsOut:`${Math.round(arenaSettings.enemyStats*100)}%`,
    settingAiMistakeOut:`${Math.round(arenaSettings.aiMistake)}%`,
    settingMoveCostOut:`${Math.round(arenaSettings.playerMoveCost*100)}%`,
    settingTrainerExtraOut:`${arenaSettings.trainerExtra>=0?'+':''}${arenaSettings.trainerExtra}`,
    settingCaptureOut:`${Math.round(arenaSettings.capture*100)}%`,
    settingCreditsOut:`${Math.round(arenaSettings.credits*100)}%`,
    settingXpOut:`${Math.round(arenaSettings.xp*100)}%`,
    settingDropsOut:`${Math.round(arenaSettings.drops*100)}%`
  };
  for(const [id,val] of Object.entries(outs)){const e=$(id);if(e)e.textContent=val}
  if($('arenaDifficultyCurrent'))$('arenaDifficultyCurrent').textContent=preset.label;
  if($('arenaDifficultySummary'))$('arenaDifficultySummary').textContent=preset.summary;
  document.querySelectorAll('[data-difficulty-preset]').forEach(b=>b.classList.toggle('active',b.dataset.difficultyPreset===preset.id));
  if($('arenaSettingsState'))$('arenaSettingsState').textContent=preset.id==='custom'?'Configuração personalizada salva automaticamente.':'Perfil salvo automaticamente.';
}
function bindArenaSettings(){
  document.querySelectorAll('[data-difficulty-preset]').forEach(btn=>btn.addEventListener('click',()=>setArenaDifficultyPreset(btn.dataset.difficultyPreset)));
  for(const id of ['settingEnemyLevel','settingEnemyStats','settingAiMistake','settingMoveCost','settingTrainerExtra','settingCapture','settingCredits','settingXp','settingDrops']){
    $(id)?.addEventListener('input',()=>saveArenaSettings(arenaSettingFromInputs()));
  }
  $('resetArenaSettingsBtn')?.addEventListener('click',()=>setArenaDifficultyPreset('normal'));
  renderArenaSettings();
}


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
  if(!charSheet?.character)return {battles:0,wins:0,losses:0,captures:0,escapes:0,trainerWins:0,trainerLosses:0,playerWins:0,playerLosses:0,wildWins:0,creditsEarned:0};
  const c=charSheet.character;
  const s=c.battleStats||(c.battleStats={});
  for(const k of ['battles','wins','losses','captures','escapes','trainerWins','trainerLosses','playerWins','playerLosses','wildWins','creditsEarned','reliansSold','creditsFromRelianSales','resourcesCollected','resourcesSold','creditsFromResources'])s[k]=Math.max(0,Number(s[k])||0);
  c.credits=Math.max(0,Number(c.credits)||0);
  c.battleHistory=Array.isArray(c.battleHistory)?c.battleHistory:[];

  // Migração única: o sistema antigo misturava vitórias selvagens com o placar.
  // O novo placar competitivo considera SOMENTE Treinador + Jogador.
  if(!s.competitiveRecordV2){
    const trainerLossesFromHistory=c.battleHistory.filter(x=>x?.mode==='trainer'&&x?.result==='loss').length;
    const playerWinsFromHistory=c.battleHistory.filter(x=>x?.mode==='player'&&(x?.result==='playerWin'||x?.result==='win')).length;
    const playerLossesFromHistory=c.battleHistory.filter(x=>x?.mode==='player'&&(x?.result==='playerLoss'||x?.result==='loss')).length;

    s.playerWins=Math.max(s.playerWins,playerWinsFromHistory);
    s.playerLosses=Math.max(s.playerLosses,playerLossesFromHistory);
    s.trainerLosses=Math.max(s.trainerLosses,trainerLossesFromHistory);

    s.wins=Math.max(0,s.trainerWins+s.playerWins);
    s.losses=Math.max(0,s.trainerLosses+s.playerLosses);
    s.battles=s.wins+s.losses;
    s.competitiveRecordV2=true;
  }
  return s;
}
function trainerBattleHistory(charSheet){
  if(!charSheet?.character)return [];
  ensureBattleStats(charSheet);
  return charSheet.character.battleHistory;
}
function battleHistoryResultLabel(kind){return ReliansCore.Format.battleHistoryResultLabel(kind)}
function battleHistoryResultClass(kind){return ReliansCore.Format.battleHistoryResultClass(kind)}
function battleHistoryDate(value){return ReliansCore.Format.battleHistoryDate(value)}
function addBattleHistoryEntry(charSheet,kind,extra={}){
  if(!charSheet?.character||!battle)return null;
  const history=trainerBattleHistory(charSheet);
  const used=[...(battle.usedRelians||[])];
  const enemies=[...(battle.opponents||[])];
  const entry={
    id:`history-${battle.battleId||Date.now()}-${kind}`,
    battleId:String(battle.battleId||''),
    at:new Date().toISOString(),
    result:kind,
    mode:battle.modeType==='trainer'?'trainer':'wild',
    trainerName:String(battle.trainerName||''),
    opponent:String(battle.trainerName||battle.enemy?.nickname||'Desconhecido'),
    opponents:enemies,
    usedRelians:used,
    captured:kind==='capture'?{speciesId:String(battle.enemy?.species?.id||''),name:String(battle.enemy?.nickname||battle.enemy?.species?.name||'Relian'),level:Number(battle.enemy?.level)||1}:null,
    rounds:Number(battle.round)||1,
    defeatedEnemies:Number(battle.defeatedEnemies)||0,
    xp:Math.max(0,Number(extra.xp??battle.totalXp)||0),
    credits:Math.max(0,Number(extra.credits)||0),
    durationSeconds:Math.max(1,Math.round((Date.now()-(Number(battle.startedAt)||Date.now()))/1000)),
    regionId:String(battle.arenaRegion||''),
    arenaTheme:String(battle.arenaTheme||''),difficulty:detectArenaPreset(arenaSettings).label,drops:[...(battle.drops||[])].map(d=>({id:d.id,name:d.name,quantity:d.quantity,value:d.value}))
  };
  const idx=history.findIndex(row=>String(row.battleId)===String(entry.battleId));
  if(idx>=0)history[idx]={...history[idx],...entry};
  else history.unshift(entry);
  charSheet.character.battleHistory=history.slice(0,120);
  charSheet.character.lastBattle=entry;
  return entry;
}
const EXPLORER_RANKS=[
  {name:'E',min:0,next:10,tone:'e',label:'Iniciante'},
  {name:'D',min:10,next:25,tone:'d',label:'Aprendiz'},
  {name:'C',min:25,next:40,tone:'c',label:'Competente'},
  {name:'B',min:40,next:55,tone:'b',label:'Experiente'},
  {name:'B+',min:55,next:70,tone:'bp',label:'Veterano'},
  {name:'A',min:70,next:85,tone:'a',label:'Elite'},
  {name:'A+',min:85,next:100,tone:'ap',label:'Elite Superior'},
  {name:'S',min:100,next:120,tone:'s',label:'Excepcional'},
  {name:'S+',min:120,next:null,tone:'sp',label:'Ápice'}
];
function rankProgressInfo(wins){
  wins=Math.max(0,Number(wins)||0);
  const tier=[...EXPLORER_RANKS].reverse().find(t=>wins>=t.min)||EXPLORER_RANKS[0];
  const nextTier=EXPLORER_RANKS[EXPLORER_RANKS.indexOf(tier)+1]||null;
  if(tier.next==null){
    return {name:tier.name,label:tier.label,tone:tier.tone,text:`${wins} vitórias · Rank máximo`,percent:100,nextName:null,nextAt:null,remaining:0,min:tier.min};
  }
  const span=Math.max(1,tier.next-tier.min),done=Math.max(0,wins-tier.min);
  return {
    name:tier.name,label:tier.label,tone:tier.tone,
    text:`${wins} / ${tier.next} vitórias`,
    percent:Math.max(0,Math.min(100,done/span*100)),
    nextName:nextTier?.name||null,nextAt:tier.next,remaining:Math.max(0,tier.next-wins),min:tier.min
  };
}
function playerRank(wins){
  return rankProgressInfo(wins).name;
}

function addPlayerCredits(amount,reason=''){
  const c=battleOwnerCharacter();
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
  return Math.max(1,Math.round((90+lv*18+count*75)*arenaSettings.credits));
}

function battleOwnerCharacter(){
  const ownerId=String(battle?.ownerCharacterId||battle?.player?.characterId||'');
  return characters().find(x=>String(x.id)===ownerId)||fixedPlayer()||null;
}
function recordPlayerResult(kind,extra={}){
  const c=battleOwnerCharacter();if(!c)return null;
  const token=`${kind}:${battle?.battleId||''}`;
  battle.recordedResults=battle.recordedResults||new Set();
  if(battle.recordedResults.has(token))return ensureBattleStats(c);
  battle.recordedResults.add(token);

  const s=ensureBattleStats(c);
  const trainerBattle=battle?.modeType==='trainer';

  if(kind==='trainerWin'){
    s.battles++;s.wins++;s.trainerWins++;
  }else if(kind==='loss'&&trainerBattle){
    s.battles++;s.losses++;s.trainerLosses++;
  }else if(kind==='capture'){
    s.captures++;
  }else if(kind==='escape'){
    s.escapes++;
  }else if(kind==='win'){
    // Vitória contra Relian selvagem não altera o placar competitivo.
    s.wildWins++;
  }

  addBattleHistoryEntry(c,kind,extra);
  try{doSave()}catch(err){console.warn('Falha ao salvar resultado da batalha',err)}
  renderPlayerPage();renderShop();
  return s;
}


const CENTRAL_TEAM_LIMIT=7;
function ensureRelianOwnership(charSheet){
  if(!charSheet?.character)return [];
  const c=charSheet.character;
  c.team=Array.isArray(c.team)?c.team:[];
  c.ownedRelianIds=Array.isArray(c.ownedRelianIds)?c.ownedRelianIds.map(String):[];

  for(const member of c.team){
    const id=String(member?.savedSheetId||'');
    if(id&&!c.ownedRelianIds.includes(id))c.ownedRelianIds.push(id);
  }

  const charId=String(charSheet.id||'');
  const trainerName=normalizedText(c.name||'');
  for(const sheet of data.savedRelianSheets||[]){
    const id=String(sheet?.id||'');if(!id)continue;
    const explicitOwner=String(sheet?.ownerCharacterId||sheet?.trainerCharacterId||'');
    const originalTrainer=normalizedText(sheet?.originalTrainer||sheet?.trainerName||'');
    if((explicitOwner&&explicitOwner===charId)||(trainerName&&originalTrainer&&originalTrainer===trainerName)){
      if(!c.ownedRelianIds.includes(id))c.ownedRelianIds.push(id);
      if(!sheet.ownerCharacterId)sheet.ownerCharacterId=charId;
    }
  }

  c.ownedRelianIds=c.ownedRelianIds.filter((id,i,a)=>id&&a.indexOf(id)===i&&!!savedById(id));
  for(const id of c.ownedRelianIds){
    const sheet=savedById(id);
    if(sheet&&!sheet.ownerCharacterId)sheet.ownerCharacterId=charId;
  }
  return c.ownedRelianIds;
}
function ownedRelians(charSheet){
  return ensureRelianOwnership(charSheet).map(id=>savedById(id)).filter(Boolean);
}
function teamMemberForSheet(charSheet,sheetId){
  return (charSheet?.character?.team||[]).find(m=>String(m.savedSheetId)===String(sheetId))||null;
}
function addRelianToTeam(charSheet,sheetId){
  if(!charSheet?.character)return false;
  ensureRelianOwnership(charSheet);
  const id=String(sheetId),sheet=savedById(id);
  if(!sheet||!charSheet.character.ownedRelianIds.includes(id))return false;
  if(teamMemberForSheet(charSheet,id))return true;
  if(charSheet.character.team.length>=CENTRAL_TEAM_LIMIT)return false;
  charSheet.character.team.push({speciesId:sheet.speciesId,savedSheetId:sheet.id,nickname:sheet.nickname||sheet.speciesName,level:Number(sheet.level)||1,color:sheet.color||'basic',notes:'Adicionado pela Central Relian'});
  charSheet.character.equippedRelianIds=Array.isArray(charSheet.character.equippedRelianIds)?charSheet.character.equippedRelianIds:[];
  if(!charSheet.character.equippedRelianIds.includes(id))charSheet.character.equippedRelianIds.push(id);
  try{doSave()}catch{}
  refreshSetup();renderPlayerPage();renderRecoveryPage();
  return true;
}
function removeRelianFromTeam(charSheet,sheetId){
  if(!charSheet?.character)return false;
  const id=String(sheetId);
  charSheet.character.team=(charSheet.character.team||[]).filter(m=>String(m.savedSheetId)!==id);
  charSheet.character.equippedRelianIds=(charSheet.character.equippedRelianIds||[]).filter(x=>String(x)!==id);
  try{doSave()}catch{}
  refreshSetup();renderPlayerPage();renderRecoveryPage();
  return true;
}
function relianElementNames(sp){
  const ids=[sp?.element,sp?.element2,sp?.primaryElement,sp?.secondaryElement,...(Array.isArray(sp?.elements)?sp.elements:[])].filter(Boolean);
  return [...new Set(ids.map(id=>getData()?.elements?.find?.(e=>String(e.id)===String(id))?.name||String(id)))];
}

const RELIAN_SALE_RARITY={
  comum:{label:'Comum',mult:1},
  incomum:{label:'Incomum',mult:1.35},
  raro:{label:'Raro',mult:1.85},
  epico:{label:'Épico',mult:2.55},
  lendario:{label:'Lendário',mult:3.8},
  unico:{label:'Único',mult:5.2}
};
function saleRarityInfo(value){
  const id=normalizedText(value||'comum').replace(/\s+/g,'');
  if(id.includes('unico'))return RELIAN_SALE_RARITY.unico;
  if(id.includes('lendario'))return RELIAN_SALE_RARITY.lendario;
  if(id.includes('epico'))return RELIAN_SALE_RARITY.epico;
  if(id.includes('incomum'))return RELIAN_SALE_RARITY.incomum;
  if(id.includes('raro'))return RELIAN_SALE_RARITY.raro;
  return RELIAN_SALE_RARITY.comum;
}
function relianSaleValuation(sheet){
  const sp=species(sheet?.speciesId)||{},attrs=sheet?.attributes||{};
  const rarity=saleRarityInfo(sheet?.rarity||sp?.rarity);
  const level=Math.max(1,Number(sheet?.level)||1);
  const statValues=['ataque','defesa','ataqueEspecial','defesaEspecial','velocidade','precisao'].map(k=>Math.max(0,Number(attrs[k])||0));
  const statTotal=statValues.reduce((a,b)=>a+b,0);
  const statAvg=statTotal/Math.max(1,statValues.length);
  const expected=Math.max(8,18+level*1.35);
  const quality=Math.max(.75,Math.min(1.85,statAvg/expected));
  const color=String(sheet?.color||'basic').toLowerCase();
  const colorMult=color==='special'||color==='especial'?2.15:color==='shiny'?1.65:1;
  const stage=Math.max(1,Number(sp?.stage)||1);
  const stageMult=1+(stage-1)*.18;
  const affinity=Math.max(0,Number(sheet?.affinity)||0);
  const affinityMult=1+Math.min(5,affinity)*.035;
  const moveCount=(sheet?.moves||[]).length;
  const moveMult=1+Math.min(6,moveCount)*.018;
  const base=90+level*18+statTotal*2.15;
  const raw=base*rarity.mult*quality*colorMult*stageMult*affinityMult*moveMult;
  const value=Math.max(50,Math.round(raw/5)*5);
  return {
    value,rarity,level,statTotal,statAvg,quality,color,colorMult,stage,stageMult,affinity,moveCount,
    parts:[
      {label:'Base + nível',value:Math.round(90+level*18)},
      {label:'Qualidade dos status',value:`${Math.round(quality*100)}%`},
      {label:`Raridade ${rarity.label}`,value:`×${rarity.mult.toFixed(2)}`},
      {label:'Coloração',value:colorMult>1?`${color==='shiny'?'Shiny':'Especial'} ×${colorMult.toFixed(2)}`:'Básica ×1.00'},
      {label:'Estágio evolutivo',value:`×${stageMult.toFixed(2)}`},
      {label:'Afinidade / movimentos',value:`×${(affinityMult*moveMult).toFixed(2)}`}
    ]
  };
}
function canSellRelian(charSheet,sheet){
  if(!charSheet?.character||!sheet)return {ok:false,reason:'Relian inválido.'};
  ensureRelianOwnership(charSheet);
  if(!charSheet.character.ownedRelianIds.includes(String(sheet.id)))return {ok:false,reason:'Este Relian não pertence ao explorador ativo.'};
  const owned=ownedRelians(charSheet);
  if(owned.length<=1)return {ok:false,reason:'Você não pode vender seu último Relian.'};
  const team=(charSheet.character.team||[]);
  const isTeam=!!teamMemberForSheet(charSheet,sheet.id);
  if(isTeam&&team.length<=1)return {ok:false,reason:'Remova outro Relian da Box para a equipe antes de vender o único membro ativo.'};
  if(battle&&!battle.finished&&String(battle.player?.sheetId||'')===String(sheet.id))return {ok:false,reason:'Este Relian está sendo usado em uma batalha.'};
  return {ok:true,reason:''};
}
function sellOwnedRelian(charSheet,sheet){
  const check=canSellRelian(charSheet,sheet);if(!check.ok)return {ok:false,reason:check.reason};
  const valuation=relianSaleValuation(sheet),id=String(sheet.id);
  charSheet.character.team=(charSheet.character.team||[]).filter(m=>String(m.savedSheetId)!==id);
  charSheet.character.equippedRelianIds=(charSheet.character.equippedRelianIds||[]).filter(x=>String(x)!==id);
  charSheet.character.ownedRelianIds=(charSheet.character.ownedRelianIds||[]).filter(x=>String(x)!==id);
  const idx=(data.savedRelianSheets||[]).findIndex(s=>String(s.id)===id);
  if(idx>=0)data.savedRelianSheets.splice(idx,1);
  const stats=ensureBattleStats(charSheet);
  charSheet.character.credits=Math.max(0,Number(charSheet.character.credits)||0)+valuation.value;
  stats.creditsEarned+=valuation.value;
  stats.reliansSold++;
  stats.creditsFromRelianSales+=valuation.value;
  charSheet.character.saleHistory=Array.isArray(charSheet.character.saleHistory)?charSheet.character.saleHistory:[];
  charSheet.character.saleHistory.unshift({
    id:`sale-${Date.now().toString(36)}`,at:new Date().toISOString(),sheetId:id,
    name:String(sheet.nickname||sheet.speciesName||species(sheet.speciesId)?.name||'Relian'),
    speciesId:String(sheet.speciesId||''),level:Number(sheet.level)||1,rarity:String(sheet.rarity||species(sheet.speciesId)?.rarity||'comum'),
    color:String(sheet.color||'basic'),value:valuation.value
  });
  charSheet.character.saleHistory=charSheet.character.saleHistory.slice(0,100);
  try{doSave()}catch(err){console.warn('Falha ao salvar venda de Relian',err)}
  refreshSetup();renderPlayerPage();renderRecoveryPage();renderShop();
  return {ok:true,value:valuation.value,valuation};
}
function openRelianSaleConfirm(sheetId){
  const c=fixedPlayer(),sheet=savedById(sheetId);if(!c||!sheet)return;
  const check=canSellRelian(c,sheet);
  if(!check.ok){alert(check.reason);return}
  const valuation=relianSaleValuation(sheet),sp=species(sheet.speciesId),img=imageFor(sp,sheet.color);
  document.querySelector('.relian-sale-overlay')?.remove();
  const over=document.createElement('div');over.className='battle-switch-overlay relian-sale-overlay';
  over.innerHTML=`<div class="card relian-sale-card">
    <button type="button" class="central-detail-close" data-cancel-relian-sale="1">×</button>
    <div class="section-kicker">VENDA DE RELIAN</div>
    <div class="relian-sale-hero">${img?`<img src="${escapeHtml(img)}" alt="">`:'◆'}<div><h2>Vender ${escapeHtml(sheet.nickname||sp?.name||'Relian')}?</h2><p>${escapeHtml(sp?.name||sheet.speciesName||'')} · Nv. ${Number(sheet.level)||1} · ${escapeHtml(valuation.rarity.label)}</p><strong>${valuation.value.toLocaleString('pt-BR')} C$</strong></div></div>
    <div class="relian-sale-breakdown">${valuation.parts.map(x=>`<span><small>${escapeHtml(x.label)}</small><b>${escapeHtml(String(x.value))}</b></span>`).join('')}</div>
    <div class="relian-sale-warning"><b>Esta venda é permanente.</b><span>A ficha salva deste Relian será removida do explorador e do Banco de Relians.</span></div>
    <div class="relian-sale-actions"><button type="button" data-cancel-relian-sale="1">Cancelar</button><button type="button" class="danger" data-confirm-relian-sale="${escapeHtml(sheet.id)}">Confirmar venda por ${valuation.value.toLocaleString('pt-BR')} C$</button></div>
  </div>`;
  document.body.appendChild(over);
  over.querySelectorAll('[data-cancel-relian-sale]').forEach(b=>b.onclick=()=>over.remove());
  over.querySelector('[data-confirm-relian-sale]').onclick=()=>{
    const result=sellOwnedRelian(c,sheet);
    if(!result.ok)return alert(result.reason);
    over.remove();closeCentralRelianDetail();
    battleToast(`${sheet.nickname||sp?.name||'Relian'} vendido por ${result.value.toLocaleString('pt-BR')} C$!`,'capture',1800);
  };
}

function centralRelianCard(sheet,charSheet,inTeam){
  const sp=species(sheet.speciesId),img=imageFor(sp,sheet.color);
  const hp=Number(sheet.hpCurrent??sheet.hpMax??0),maxHp=Math.max(1,Number(sheet.hpMax)||1);
  const eng=Number(sheet.engCurrent??sheet.engMax??0),maxEng=Math.max(1,Number(sheet.engMax)||1);
  const els=relianElementNames(sp).join(' · ');
  return `<article class="central-relian-card ${hp<=0?'down':''}" data-central-sheet="${escapeHtml(sheet.id)}">
    <button type="button" class="central-relian-open" data-open-relian-detail="${escapeHtml(sheet.id)}">
      <div class="central-relian-sprite">${img?`<img src="${escapeHtml(img)}" alt="">`:'◆'}</div>
      <div class="central-relian-copy"><b>${escapeHtml(sheet.nickname||sp?.name||sheet.speciesName||'Relian')}</b><small>${escapeHtml(sp?.name||sheet.speciesName||'')} · Nv. ${Number(sheet.level)||1}</small><em>${escapeHtml(els||'Elemento não informado')}</em><strong class="central-relian-value">${relianSaleValuation(sheet).value.toLocaleString('pt-BR')} C$</strong></div>
      <div class="central-mini-bars"><span>HP ${Math.round(hp)}/${Math.round(maxHp)}</span><i><em style="width:${Math.max(0,Math.min(100,hp/maxHp*100))}%"></em></i><span>ENG ${Math.round(eng)}/${Math.round(maxEng)}</span><i class="eng"><em style="width:${Math.max(0,Math.min(100,eng/maxEng*100))}%"></em></i></div>
    </button>
    <div class="central-relian-actions">
      ${inTeam?`<button type="button" data-remove-team="${escapeHtml(sheet.id)}">Enviar à Box</button>`:`<button type="button" class="primary" data-add-team="${escapeHtml(sheet.id)}">Adicionar à equipe</button>`}
      <button type="button" data-recover-owned="${escapeHtml(sheet.id)}" ${hp>=maxHp&&eng>=maxEng?'disabled':''}>Recuperar</button>
      <button type="button" class="central-sell-btn" data-sell-relian="${escapeHtml(sheet.id)}">Vender</button>
    </div>
  </article>`;
}
function openCentralRelianDetail(sheetId){
  const c=fixedPlayer(),sheet=savedById(sheetId),modal=$('centralRelianModal'),body=$('centralRelianDetailBody');
  if(!c||!sheet||!modal||!body)return;
  const sp=species(sheet.speciesId),img=imageFor(sp,sheet.color),member=teamMemberForSheet(c,sheet.id);
  const attrs=sheet.attributes||{};
  const moves=(sheet.moves||[]).map(id=>moveById(id)).filter(Boolean);
  const tr=traitById(sheet.traitId);
  const hp=Number(sheet.hpCurrent??sheet.hpMax??0),eng=Number(sheet.engCurrent??sheet.engMax??0);
  const evo=readyEvolutionOptions(sheet,member||{level:sheet.level},c);
  const moveCards=moves.length?moves.map(m=>{
    const damage=typeof moveDamage==='function'?moveDamage(m):Number(m.damage||m.power||0);
    const cost=typeof moveCost==='function'?moveCost(m):Number(m.energyCost||m.cost||0);
    const range=typeof parseRange==='function'?parseRange(m):Number(m.range||1);
    const accuracy=typeof moveAccuracy==='function'?moveAccuracy(m):Number(m.accuracy||100);
    const description=String(m.description||m.effectText||m.effect||m.notes||'Sem descrição adicional.');
    return `<article class="central-move-detail">
      <div class="central-move-detail-head"><div><b>${escapeHtml(m.name||m.id)}</b><small>${escapeHtml(m.element||m.type||m.tipo||'Neutro')}</small></div><strong>${cost} ENG</strong></div>
      <div class="central-move-metrics"><span>Dano <b>${damage||'—'}</b></span><span>Alcance <b>${range}</b></span><span>Precisão <b>${accuracy}%</b></span><span>Área <b>${typeof shapeLabel==='function'?escapeHtml(shapeLabel(m)):'Alvo'}</b></span></div>
      <p>${escapeHtml(description)}</p>
    </article>`;
  }).join(''):'<div class="central-detail-empty">Nenhum movimento salvo nesta ficha.</div>';
  const evolutionText=(sp?.evolutions||sp?.evolution||sheet.evolutions||[]);
  const evolutionList=Array.isArray(evolutionText)?evolutionText:[evolutionText].filter(Boolean);
  body.innerHTML=`<div class="central-detail-hero central-catalog-hero">
    <div class="central-detail-image central-catalog-art">
      <span class="central-catalog-color">${escapeHtml(String(sheet.color||'basic'))}</span>
      ${img?`<img src="${escapeHtml(img)}" alt="">`:'<span class="central-catalog-placeholder">?</span>'}
    </div>
    <div class="central-catalog-identity">
      <div class="central-catalog-topline"><span>${member?'NA EQUIPE':'BOX RELIAN'}</span><span>NV. ${Number(sheet.level)||1}</span></div>
      <h2 id="centralRelianDetailTitle">${escapeHtml(sheet.nickname||sp?.name||'Relian')}</h2>
      <p class="central-catalog-species">${escapeHtml(sp?.name||sheet.speciesName||'')}</p>
      <div class="central-catalog-rarity">✦ ${escapeHtml(sheet.rarity||sp?.rarity||'Comum')}</div>
      <div class="central-catalog-divider"></div>
      <div class="central-catalog-elements"><small>ELEMENTOS</small><div class="player-profile-tags">${relianElementNames(sp).map(x=>`<span>${escapeHtml(x)}</span>`).join('')||'<span>—</span>'}</div></div>
      <div class="central-catalog-quickfacts">
        <span><small>Coloração</small><b>${escapeHtml(String(sheet.color||'basic'))}</b></span>
        <span><small>Afinidade</small><b>${Number(sheet.affinity)||0}</b></span>
        <span><small>Valor</small><b>${relianSaleValuation(sheet).value.toLocaleString('pt-BR')} C$</b></span>
      </div>
    </div>
  </div>
  <div class="central-detail-tabs" role="tablist" aria-label="Detalhes do Relian">
    <button type="button" class="active" data-relian-detail-tab="status">Status</button>
    <button type="button" data-relian-detail-tab="moves">Movimentos <small>${moves.length}</small></button>
    <button type="button" data-relian-detail-tab="trait">Traço</button>
    <button type="button" data-relian-detail-tab="profile">Ficha</button>
  </div>
  <div class="central-detail-tab-panel active" data-relian-detail-panel="status">
    <section class="central-catalog-section">
      <div class="central-catalog-section-title"><div><small>RECURSOS</small><h3>Condição atual</h3></div><span>${member?'Relian ativo':'Armazenado na Box'}</span></div>
      <div class="central-resource-bars">
        <article class="central-resource-bar hp"><div><b>♥ HP</b><strong>${Math.round(hp)} / ${Math.round(Number(sheet.hpMax)||1)}</strong></div><i><em style="width:${Math.max(0,Math.min(100,(hp/Math.max(1,Number(sheet.hpMax)||1))*100))}%"></em></i></article>
        <article class="central-resource-bar eng"><div><b>⚡ ENG</b><strong>${Math.round(eng)} / ${Math.round(Number(sheet.engMax)||1)}</strong></div><i><em style="width:${Math.max(0,Math.min(100,(eng/Math.max(1,Number(sheet.engMax)||1))*100))}%"></em></i></article>
        <article class="central-resource-bar xp"><div><b>✦ XP</b><strong>${Number(sheet.xp)||0} / ${typeof xpNeeded==='function'?xpNeeded(Number(sheet.level)||1):'—'}</strong></div><i><em style="width:${typeof xpNeeded==='function'?Math.max(0,Math.min(100,((Number(sheet.xp)||0)/Math.max(1,xpNeeded(Number(sheet.level)||1)))*100)):0}%"></em></i></article>
      </div>
    </section>
    <section class="central-catalog-section">
      <div class="central-catalog-section-title"><div><small>ATRIBUTOS</small><h3>Status de combate</h3></div></div>
      <div class="central-detail-stats central-catalog-stats">
        ${[['ATQ','Ataque',attrs.ataque],['DEF','Defesa',attrs.defesa],['ATQ.ESP','Ataque Especial',attrs.ataqueEspecial],['DEF.ESP','Defesa Especial',attrs.defesaEspecial],['VEL','Velocidade',attrs.velocidade],['PREC','Precisão',attrs.precisao]].map(([n,label,v])=>`<span><small>${n}</small><b>${Number(v)||0}</b><em>${label}</em></span>`).join('')}
      </div>
    </section>
    <section class="central-catalog-section compact">
      <div class="central-detail-status-note central-catalog-notes"><span><small>Coloração</small><b>${escapeHtml(String(sheet.color||'basic'))}</b></span><span><small>Raridade</small><b>${escapeHtml(sheet.rarity||sp?.rarity||'—')}</b></span><span><small>Afinidade</small><b>${Number(sheet.affinity)||0}</b></span><span><small>Local</small><b>${member?'Equipe':'Box'}</b></span></div>
    </section>
  </div>
  <div class="central-detail-tab-panel" data-relian-detail-panel="moves">${moveCards}</div>
  <div class="central-detail-tab-panel" data-relian-detail-panel="trait">
    <section class="central-trait-detail"><div class="section-kicker">TRAÇO ATUAL</div><h3>${escapeHtml(tr?.name||'Nenhum')}</h3><p>${escapeHtml(tr?.description||tr?.effect||'Este Relian não possui um traço registrado.')}</p>${tr?.effectText?`<div class="central-trait-effect"><small>EFEITO</small><b>${escapeHtml(tr.effectText)}</b></div>`:''}</section>
  </div>
  <div class="central-detail-tab-panel" data-relian-detail-panel="profile">
    <div class="central-profile-detail-grid">
      <span><small>ID da ficha</small><b>${escapeHtml(sheet.id||'—')}</b></span>
      <span><small>Espécie</small><b>${escapeHtml(sp?.name||sheet.speciesName||'—')}</b></span>
      <span><small>Nível</small><b>${Number(sheet.level)||1}</b></span>
      <span><small>Afinidade</small><b>${Number(sheet.affinity)||0}</b></span>
      <span><small>Elementos</small><b>${escapeHtml(relianElementNames(sp).join(' / ')||'—')}</b></span>
      <span><small>Valor estimado</small><b>${relianSaleValuation(sheet).value.toLocaleString('pt-BR')} C$</b></span>
    </div>
    <section class="central-profile-evolution"><div class="section-kicker">EVOLUÇÃO</div>${evo.length?`<h3>Pronto para evoluir</h3><p>${evo.map(x=>escapeHtml(x.target?.name||'Evolução')).join(', ')}</p>`:`<h3>${evolutionList.length?'Linha evolutiva registrada':'Sem evolução disponível agora'}</h3><p>${evolutionList.length?escapeHtml(evolutionList.map(x=>typeof x==='string'?x:(x?.name||x?.targetName||x?.target||'Evolução')).join(' · ')):'Esta ficha ainda não atende a uma condição de evolução.'}</p>`}</section>
  </div>
  ${evo.length?`<div class="central-evolution-ready"><b>✦ Evolução disponível</b><span>${evo.map(x=>escapeHtml(x.target?.name||'Evolução')).join(', ')}</span><button type="button" data-central-evolve="${escapeHtml(sheet.id)}">Evoluir?</button></div>`:''}
  <section class="central-sale-estimate"><div><div class="section-kicker">VALOR DE MERCADO</div><h3>${relianSaleValuation(sheet).value.toLocaleString('pt-BR')} C$</h3><p>Estimativa baseada em raridade, nível, atributos, coloração, evolução, afinidade e movimentos.</p></div><button type="button" class="danger" data-sell-relian="${escapeHtml(sheet.id)}">Vender Relian</button></section>
  <div class="central-detail-footer">${member?`<button type="button" data-remove-team="${escapeHtml(sheet.id)}">Enviar à Box</button>`:`<button type="button" class="primary" data-add-team="${escapeHtml(sheet.id)}">Adicionar à equipe</button>`}<button type="button" data-recover-owned="${escapeHtml(sheet.id)}">Recuperar HP/ENG</button></div>`;
  body.querySelectorAll('[data-relian-detail-tab]').forEach(btn=>btn.addEventListener('click',()=>{
    const tab=btn.dataset.relianDetailTab;
    body.querySelectorAll('[data-relian-detail-tab]').forEach(x=>x.classList.toggle('active',x===btn));
    body.querySelectorAll('[data-relian-detail-panel]').forEach(x=>x.classList.toggle('active',x.dataset.relianDetailPanel===tab));
  }));
  modal.hidden=false;document.body.classList.add('central-modal-open');
  bindCentralActions(body);
}
function closeCentralRelianDetail(){const m=$('centralRelianModal');if(m)m.hidden=true;document.body.classList.remove('central-modal-open')}
function recoverOwnedRelian(sheetId){
  const c=fixedPlayer();if(!c||!ensureRelianOwnership(c).includes(String(sheetId)))return;
  const sheet=savedById(sheetId);if(!sheet)return;
  recoverSavedRelianSheet(sheet);try{doSave()}catch{}
  renderRecoveryPage();renderPlayerPage();
}
function recoverAllOwned(){
  const c=fixedPlayer();if(!c)return alert('Defina um treinador primeiro.');
  ownedRelians(c).forEach(recoverSavedRelianSheet);try{doSave()}catch{}
  renderRecoveryPage();renderPlayerPage();battleToast('Todos os Relians da Box foram recuperados!','heal',1300);
}
function bindCentralActions(scope=document){
  scope.querySelectorAll?.('[data-open-relian-detail]').forEach(b=>b.onclick=()=>openCentralRelianDetail(b.dataset.openRelianDetail));
  scope.querySelectorAll?.('[data-add-team]').forEach(b=>b.onclick=()=>{
    const c=fixedPlayer();if(!c)return;
    if((c.character.team||[]).length>=CENTRAL_TEAM_LIMIT&&!teamMemberForSheet(c,b.dataset.addTeam))return alert(`A equipe já possui ${CENTRAL_TEAM_LIMIT} Relians.`);
    addRelianToTeam(c,b.dataset.addTeam);closeCentralRelianDetail();
  });
  scope.querySelectorAll?.('[data-remove-team]').forEach(b=>b.onclick=()=>{const c=fixedPlayer();if(c)removeRelianFromTeam(c,b.dataset.removeTeam);closeCentralRelianDetail()});
  scope.querySelectorAll?.('[data-recover-owned]').forEach(b=>b.onclick=()=>recoverOwnedRelian(b.dataset.recoverOwned));
  scope.querySelectorAll?.('[data-sell-relian]').forEach(b=>b.onclick=()=>openRelianSaleConfirm(b.dataset.sellRelian));
  scope.querySelectorAll?.('[data-central-evolve]').forEach(b=>b.onclick=()=>{closeCentralRelianDetail();requestEvolution(b.dataset.centralEvolve)});
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
  const c=recoveryPlayer();if(!c)return alert('Defina um treinador primeiro.');
  const member=(c.character?.team||[]).find(m=>String(m.savedSheetId)===String(sheetId));
  const sheet=member?savedById(member.savedSheetId):null;
  if(!sheet)return;
  const changed=recoverSavedRelianSheet(sheet);
  try{doSave()}catch{}
  refreshSetup();renderPlayerPage();renderRecoveryPage();
  battleToast(changed?`${member.nickname||sheet.nickname||sheet.speciesName} recuperado!`:'Este Relian já está totalmente recuperado.','heal',1100);
}
function recoverAllTeam(){
  const c=recoveryPlayer();if(!c)return alert('Defina um treinador primeiro.');
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
  const c=recoveryPlayer(),teamGrid=$('centralTeamGrid'),boxGrid=$('centralBoxGrid'),name=$('recoveryPlayerName'),summary=$('recoveryTeamStatus'),detail=$('recoveryTeamDetail');
  if(name)name.textContent=c?.character?.name||'Nenhum treinador';
  if(!teamGrid||!boxGrid)return;
  if(!c){
    if(summary)summary.textContent='—';if(detail)detail.textContent='Defina um treinador na Carteira do Explorador.';
    teamGrid.innerHTML=boxGrid.innerHTML='<div class="recovery-empty"><b>Nenhum explorador definido</b><span>Escolha o personagem ativo para acessar a Central Relian.</span></div>';
    if($('centralTeamCount'))$('centralTeamCount').textContent=`0/${CENTRAL_TEAM_LIMIT}`;if($('centralBoxCount'))$('centralBoxCount').textContent='0';
    return;
  }
  ensureRelianOwnership(c);
  const owned=ownedRelians(c),teamIds=new Set((c.character.team||[]).map(m=>String(m.savedSheetId)));
  const team=owned.filter(s=>teamIds.has(String(s.id)));
  const query=String($('centralBoxSearch')?.value||'').trim().toLocaleLowerCase('pt-BR');
  const boxOnly=owned.filter(sheet=>!teamIds.has(String(sheet.id)));
  const filtered=boxOnly.filter(sheet=>{const sp=species(sheet.speciesId);return !query||`${sheet.nickname||''} ${sheet.speciesName||''} ${sp?.name||''} ${relianElementNames(sp).join(' ')}`.toLocaleLowerCase('pt-BR').includes(query)});
  const healthy=owned.filter(s=>Number(s.hpCurrent??s.hpMax)>=Number(s.hpMax)&&Number(s.engCurrent??s.engMax)>=Number(s.engMax)).length;
  if(summary)summary.textContent=`${healthy}/${owned.length} prontos`;
  if(detail)detail.textContent=`${owned.length} Relians pertencem a ${c.character?.name||'este treinador'}.`;
  if($('centralTeamCount'))$('centralTeamCount').textContent=`${team.length}/${CENTRAL_TEAM_LIMIT}`;
  if($('centralBoxCount'))$('centralBoxCount').textContent=String(boxOnly.length);
  teamGrid.innerHTML=team.length?team.map(s=>centralRelianCard(s,c,true)).join(''):'<div class="recovery-empty"><b>Equipe vazia</b><span>Escolha Relians da Box para montar sua equipe.</span></div>';
  boxGrid.innerHTML=filtered.length?filtered.map(s=>centralRelianCard(s,c,false)).join(''):'<div class="recovery-empty"><b>Nenhum Relian encontrado</b><span>Os Relians capturados por este treinador aparecerão aqui.</span></div>';
  bindCentralActions(teamGrid);bindCentralActions(boxGrid);
}

function evolutionRulesForSpecies(sp){
  const targets=Array.isArray(sp?.evolvesToMany)?sp.evolvesToMany.filter(Boolean):(sp?.evolvesTo?[sp.evolvesTo]:[]);
  const rules=Array.isArray(sp?.evolutionRules)?sp.evolutionRules:[];
  if(rules.length)return rules.filter(rule=>targets.includes(rule.targetId));
  const legacy=String(sp?.evolutionMethod||'').trim();if(!legacy)return [];
  return targets.map(targetId=>{const low=legacy.toLocaleLowerCase('pt-BR'),n=(legacy.match(/(\d+)/)||[])[1]||'';
    if(low.includes('nível')||low.includes('nivel'))return{targetId,type:'level',value:n};
    if(low.includes('item')||low.includes('pedra')||low.includes('stone'))return{targetId,type:'item',value:''};
    if(low.includes('evento'))return{targetId,type:'event',value:''};
    return{targetId,type:'custom',value:legacy};
  });
}
function normalizedText(v){return ReliansCore.Format.normalizedText(v)}
function findBackpackItem(charSheet,required){const wanted=normalizedText(required);if(!wanted)return null;return(charSheet?.character?.backpack||[]).find(item=>normalizedText(item.itemId)===wanted||normalizedText(item.name)===wanted)||null}
function completedEvent(charSheet,sheet,eventName){const wanted=normalizedText(eventName);if(!wanted)return false;return[...(charSheet?.character?.completedEvents||[]),...(charSheet?.character?.eventsCompleted||[]),...(sheet?.completedEvents||[])].map(normalizedText).includes(wanted)}
function ruleReadyForEvolution(rule,sp,sheet,member,charSheet){
  const type=String(rule?.type||'custom'),value=rule?.value;if(!rule?.targetId||!species(rule.targetId))return false;
  if(type==='level')return Number(sheet?.level||member?.level||1)>=Number(value||Infinity);
  if(type==='item')return !!findBackpackItem(charSheet,value);
  if(type==='event')return completedEvent(charSheet,sheet,value);
  if(type==='affinity')return Number(sheet?.affinity??sheet?.baseAffinity??0)>=Number(value||Infinity);
  if(type==='wins')return Number(ensureBattleStats(charSheet).wins||0)>=Number(value||Infinity);
  if(type==='region')return normalizedText(charSheet?.character?.regionId||charSheet?.character?.region)===normalizedText(value);
  if(type==='time'){const h=new Date().getHours(),p=h<6?'madrugada':h<12?'manha':h<18?'tarde':'noite';return p===normalizedText(value)}
  if(type==='custom')return[...(sheet?.evolutionFlags||[]),...(charSheet?.character?.evolutionFlags||[])].map(normalizedText).includes(normalizedText(value));
  return false;
}
function readyEvolutionOptions(sheet,member,charSheet){
  const sp=species(sheet?.speciesId||member?.speciesId);if(!sp)return[];
  return evolutionRulesForSpecies(sp).filter(rule=>ruleReadyForEvolution(rule,sp,sheet,member,charSheet)).map(rule=>({rule,target:species(rule.targetId)})).filter(x=>x.target);
}
function evolutionRequirementLabel(rule){return`${({level:'Nível',item:'Item',event:'Evento',affinity:'Afinidade',wins:'Vitórias',region:'Região',time:'Período',custom:'Condição'})[rule?.type]||'Condição'}: ${rule?.value??'—'}`}
function consumeEvolutionRequirement(rule,charSheet){if(rule?.type!=='item')return true;const item=findBackpackItem(charSheet,rule.value);if(!item)return false;item.quantity=Math.max(0,Number(item.quantity)||1)-1;if(item.quantity<=0)charSheet.character.backpack=(charSheet.character.backpack||[]).filter(x=>x!==item);return true}
function showEvolutionAnimation(oldSp,newSp,sheet,onDone){
  document.querySelector('.relian-evolution-overlay')?.remove();
  const oldImg=imageFor(oldSp,sheet.color),newImg=imageFor(newSp,sheet.color),over=document.createElement('div');over.className='relian-evolution-overlay';
  over.innerHTML=`<div class="relian-evolution-stage"><div class="section-kicker">EVOLUÇÃO</div><h2>${escapeHtml(sheet.nickname||oldSp.name)} está evoluindo!</h2><div class="relian-evolution-visual"><div class="relian-evo-glow"></div><div class="relian-evo-sprite old">${oldImg?`<img src="${escapeHtml(oldImg)}" alt="">`:'◆'}</div><div class="relian-evo-sprite new">${newImg?`<img src="${escapeHtml(newImg)}" alt="">`:'◆'}</div></div><p class="relian-evo-message">A energia do Relian está mudando...</p></div>`;
  document.body.appendChild(over);requestAnimationFrame(()=>over.classList.add('show','phase-one'));
  setTimeout(()=>over.classList.add('flash','phase-two'),900);
  setTimeout(()=>{const msg=over.querySelector('.relian-evo-message');if(msg)msg.innerHTML=`<b>${escapeHtml(sheet.nickname||oldSp.name)}</b> evoluiu para <b>${escapeHtml(newSp.name)}</b>!`;over.classList.add('complete')},1750);
  setTimeout(()=>{over.classList.remove('show');setTimeout(()=>{over.remove();onDone?.()},250)},3100);
}
function performEvolution(sheetId,targetId,rule){
  const charSheet=fixedPlayer();if(!charSheet)return;
  const member=(charSheet.character?.team||[]).find(m=>String(m.savedSheetId)===String(sheetId)),sheet=savedById(sheetId);if(!member||!sheet)return;
  const oldSp=species(sheet.speciesId),newSp=species(targetId);if(!oldSp||!newSp)return;
  if(!ruleReadyForEvolution(rule,oldSp,sheet,member,charSheet))return alert('A condição de evolução ainda não está completa.');
  if(!consumeEvolutionRequirement(rule,charSheet))return alert('O item necessário não está mais na mochila.');
  const oldHpMax=Math.max(1,Number(sheet.hpMax)||1),oldEngMax=Math.max(1,Number(sheet.engMax)||1),hpRatio=Math.max(0,Math.min(1,Number(sheet.hpCurrent??oldHpMax)/oldHpMax)),engRatio=Math.max(0,Math.min(1,Number(sheet.engCurrent??oldEngMax)/oldEngMax));
  sheet.speciesId=newSp.id;sheet.speciesName=newSp.name;sheet.rarity=newSp.rarity||sheet.rarity;member.speciesId=newSp.id;member.level=Number(sheet.level||member.level||1);
  try{const tr=traitById(sheet.traitId),res=calculateRelianResources(sheet.level,tr);sheet.hpMax=Math.max(1,Number(res.hp)||oldHpMax);sheet.engMax=Math.max(1,Number(res.energy)||Number(newSp.baseEnergy)||oldEngMax)}catch{sheet.hpMax=oldHpMax;sheet.engMax=Math.max(oldEngMax,Number(newSp.baseEnergy)||oldEngMax)}
  sheet.hpCurrent=Math.max(1,Math.round(sheet.hpMax*hpRatio));sheet.engCurrent=Math.round(sheet.engMax*engRatio);
  const unlocked=(newSp.learnset||[]).filter(x=>Number(x.level)<=Number(sheet.level||1)).sort((a,b)=>Number(b.level)-Number(a.level)).map(x=>x.moveId).filter(Boolean),existing=Array.isArray(sheet.moves)?sheet.moves.filter(Boolean):[];
  sheet.moves=[...new Set([...unlocked,...existing])].slice(0,4);
  try{doSave()}catch{}
  showEvolutionAnimation(oldSp,newSp,sheet,()=>{refreshSetup();renderPlayerPage();renderRecoveryPage()});
}
function requestEvolution(sheetId){
  const charSheet=fixedPlayer();if(!charSheet)return;
  const member=(charSheet.character?.team||[]).find(m=>String(m.savedSheetId)===String(sheetId)),sheet=savedById(sheetId);if(!member||!sheet)return;
  const options=readyEvolutionOptions(sheet,member,charSheet);if(!options.length)return alert('Este Relian ainda não está pronto para evoluir.');
  document.querySelector('.relian-evolution-confirm')?.remove();
  const oldSp=species(sheet.speciesId),over=document.createElement('div');over.className='relian-evolution-confirm battle-switch-overlay';
  over.innerHTML=`<div class="card relian-evolution-confirm-card"><div class="section-kicker">EVOLUÇÃO DISPONÍVEL</div><h2>Quer evoluir ${escapeHtml(member.nickname||sheet.nickname||oldSp?.name||'este Relian')}?</h2><p>Escolha a evolução e confirme.</p><div class="relian-evolution-options">${options.map((opt,i)=>{const img=imageFor(opt.target,sheet.color);return`<button type="button" class="relian-evolution-option" data-evo-index="${i}">${img?`<img src="${escapeHtml(img)}" alt="">`:''}<span><b>${escapeHtml(opt.target.name)}</b><small>${escapeHtml(evolutionRequirementLabel(opt.rule))}</small></span></button>`}).join('')}</div><button type="button" data-evo-cancel="1">Cancelar</button></div>`;
  document.body.appendChild(over);
  over.querySelectorAll('[data-evo-index]').forEach(btn=>btn.onclick=()=>{const opt=options[Number(btn.dataset.evoIndex)];if(!opt)return;if(!confirm(`Confirmar evolução para ${opt.target.name}?`))return;over.remove();performEvolution(sheetId,opt.target.id,opt.rule)});
  over.querySelector('[data-evo-cancel]').onclick=()=>over.remove();
}


function renderTrainerBattleHistory(charSheet){
  const list=$('trainerBattleHistory'),summary=$('trainerHistorySummary'),filter=$('trainerHistoryFilter');
  if(!list)return;
  if(!charSheet){
    if(summary)summary.innerHTML='';
    list.innerHTML='<div class="trainer-history-empty">Defina um explorador para visualizar o histórico.</div>';
    return;
  }
  const history=[...trainerBattleHistory(charSheet)];
  const mode=String(filter?.value||'all');
  const filtered=history.filter(entry=>{
    if(mode==='all')return true;
    if(mode==='win')return entry.result==='win'||entry.result==='trainerWin';
    if(mode==='loss')return entry.result==='loss';
    if(mode==='capture')return entry.result==='capture';
    if(mode==='escape')return entry.result==='escape';
    if(mode==='trainer')return entry.mode==='trainer';
    if(mode==='player')return entry.mode==='player';
    if(mode==='wild')return entry.mode==='wild';
    return true;
  });
  if(summary){
    const trainerCount=history.filter(x=>x.mode==='trainer').length;
    const playerCount=history.filter(x=>x.mode==='player').length;
    const wildCount=history.filter(x=>x.mode==='wild').length;
    const earned=history.reduce((sum,x)=>sum+(Number(x.credits)||0),0);
    const xp=history.reduce((sum,x)=>sum+(Number(x.xp)||0),0);
    summary.innerHTML=`<span><b>${history.length}</b> registros</span><span><b>${trainerCount}</b> treinadores</span><span><b>${playerCount}</b> jogadores</span><span><b>${wildCount}</b> selvagens</span><span><b>${xp}</b> XP registrado</span><span><b>${earned.toLocaleString('pt-BR')} C$</b> em recompensas</span>`;
  }
  if(!filtered.length){
    list.innerHTML='<div class="trainer-history-empty">Nenhuma batalha corresponde a este filtro.</div>';
    return;
  }
  list.innerHTML=filtered.map(entry=>{
    const result=battleHistoryResultLabel(entry.result),cls=battleHistoryResultClass(entry.result);
    const used=(entry.usedRelians||[]).map(r=>`<span>${escapeHtml(r.name||'Relian')} <small>Nv.${Number(r.level)||1}</small></span>`).join('');
    const opponents=(entry.opponents||[]).map(r=>escapeHtml(r.name||'Relian')).join(', ')||escapeHtml(entry.opponent||'Desconhecido');
    const capture=entry.captured?`<div class="history-capture">◈ Capturado: <b>${escapeHtml(entry.captured.name)}</b> · Nv.${Number(entry.captured.level)||1}</div>`:'';
    return `<article class="trainer-history-entry ${cls}">
      <div class="trainer-history-result"><span>${result}</span><small>${entry.mode==='trainer'?'Treinador':entry.mode==='player'?'Jogador':'Selvagem'}</small></div>
      <div class="trainer-history-main">
        <div class="trainer-history-title"><b>${entry.mode==='trainer'?`vs. ${escapeHtml(entry.trainerName||entry.opponent||'Treinador')}`:entry.mode==='player'?`vs. ${escapeHtml(entry.opponent||'Jogador')}`:`vs. ${escapeHtml(entry.opponent||'Relian selvagem')}`}</b><time>${battleHistoryDate(entry.at)}</time></div>
        <p>Oponentes: ${opponents}</p>
        <div class="trainer-history-relians"><small>Relians utilizados</small>${used||'<span>Não registrado</span>'}</div>
        ${capture}
      </div>
      <div class="trainer-history-rewards">
        <span><small>Rodadas</small><b>${Number(entry.rounds)||1}</b></span>
        <span><small>XP</small><b>+${Number(entry.xp)||0}</b></span>
        <span><small>C$</small><b>${Number(entry.credits)||0}</b></span>
        <span><small>Duração</small><b>${Number(entry.durationSeconds)||0}s</b></span>
      </div>
    </article>`;
  }).join('');
}
function clearTrainerHistory(){
  const c=fixedPlayer();if(!c)return;
  if(!confirm(`Limpar todo o histórico de batalhas de ${c.character?.name||'este explorador'}? As estatísticas totais não serão apagadas.`))return;
  c.character.battleHistory=[];
  try{doSave()}catch{}
  renderPlayerPage();
}



const RELIAN_RESOURCE_DEFS={
  agua:{id:'escama-abissal',name:'Escama Abissal',value:32,icon:'≋',description:'Escama úmida e resistente encontrada em Relians ligados à água.'},
  abissal:{id:'escama-abissal',name:'Escama Abissal',value:32,icon:'≋',description:'Escama úmida e resistente encontrada em Relians ligados ao Abissal.'},
  fogo:{id:'cinza-ignea',name:'Cinza Ígnea',value:36,icon:'▲',description:'Cinza quente que conserva traços de energia ígnea.'},
  ignea:{id:'cinza-ignea',name:'Cinza Ígnea',value:36,icon:'▲',description:'Cinza quente que conserva traços de energia ígnea.'},
  vital:{id:'fibra-vital',name:'Fibra Vital',value:28,icon:'♧',description:'Fibra orgânica impregnada de energia vital.'},
  floresta:{id:'fibra-vital',name:'Fibra Vital',value:28,icon:'♧',description:'Fibra orgânica impregnada de energia vital.'},
  terra:{id:'fragmento-terrestre',name:'Fragmento Terrestre',value:30,icon:'◆',description:'Fragmento mineral endurecido pelo corpo de um Relian.'},
  colossal:{id:'fragmento-terrestre',name:'Fragmento Terrestre',value:30,icon:'◆',description:'Fragmento mineral endurecido pelo corpo de um Relian.'},
  gelo:{id:'cristal-de-geada',name:'Cristal de Geada',value:38,icon:'✧',description:'Cristal gelado que demora a perder sua baixa temperatura.'},
  geada:{id:'cristal-de-geada',name:'Cristal de Geada',value:38,icon:'✧',description:'Cristal gelado que demora a perder sua baixa temperatura.'},
  astral:{id:'poeira-astral',name:'Poeira Astral',value:45,icon:'✦',description:'Poeira luminosa com pequenas oscilações de energia astral.'},
  halo:{id:'fragmento-de-halo',name:'Fragmento de Halo',value:42,icon:'☼',description:'Fragmento claro que emite um brilho suave.'},
  umbral:{id:'residuo-umbral',name:'Resíduo Umbral',value:44,icon:'◐',description:'Matéria escura deixada por Relians de energia umbral.'},
  tempestade:{id:'filamento-tempestuoso',name:'Filamento Tempestuoso',value:40,icon:'ϟ',description:'Filamento que acumula pequenas descargas elétricas.'},
  eter:{id:'essencia-de-eter',name:'Essência de Éter',value:48,icon:'◇',description:'Resíduo energético raro e instável.'}
};
const GENERIC_RELIAN_RESOURCE={id:'residuo-relian',name:'Resíduo Relian',value:22,icon:'•',description:'Material biológico ou energético coletado após uma batalha.'};
const RARE_RELIAN_RESOURCE={id:'nucleo-relian',name:'Núcleo Relian',value:125,icon:'◈',description:'Núcleo energético raro preservado após uma batalha difícil.'};

function explorerResourceInventory(charSheet){
  if(!charSheet?.character)return [];
  const c=charSheet.character;
  c.resources=Array.isArray(c.resources)?c.resources:[];
  return c.resources;
}
function resourceDefinition(id){
  if(String(id)===RARE_RELIAN_RESOURCE.id)return RARE_RELIAN_RESOURCE;
  return Object.values(RELIAN_RESOURCE_DEFS).find(x=>x.id===String(id))||GENERIC_RELIAN_RESOURCE;
}
function addExplorerResource(charSheet,def,quantity=1){
  if(!charSheet?.character||!def)return;
  const inv=explorerResourceInventory(charSheet),qty=Math.max(1,Math.round(Number(quantity)||1));
  let row=inv.find(x=>String(x.id||x.resourceId)===String(def.id));
  if(row)row.quantity=Math.max(0,Number(row.quantity)||0)+qty;
  else inv.push({id:def.id,name:def.name,quantity:qty,value:def.value,description:def.description||'',icon:def.icon||'◆'});
  const stats=ensureBattleStats(charSheet);stats.resourcesCollected+=qty;
}
function resourceForSpecies(sp){
  const elements=typeof relianElementNames==='function'?relianElementNames(sp):[];
  for(const raw of elements){
    const key=normalizedText(raw).replace(/\s+/g,'');
    if(RELIAN_RESOURCE_DEFS[key])return RELIAN_RESOURCE_DEFS[key];
  }
  return GENERIC_RELIAN_RESOURCE;
}
function dropRarityBonus(sp){
  const r=normalizedText(sp?.rarity||'comum');
  if(r.includes('unico'))return .24;
  if(r.includes('mitico'))return .20;
  if(r.includes('lendario'))return .16;
  if(r.includes('epico'))return .12;
  if(r.includes('raro'))return .08;
  if(r.includes('incomum'))return .04;
  return 0;
}
function rollRelianDrops(enemy){
  if(!enemy?.species)return [];
  const drops=[],sp=enemy.species,level=Math.max(1,Number(enemy.level)||1);
  const chance=clamp((.58+dropRarityBonus(sp))*Math.max(.6,Number(arenaSettings.drops)||1),.2,.96);
  const main=resourceForSpecies(sp);
  if(Math.random()<chance){
    const qty=1+(level>=25?1:0)+(level>=60&&Math.random()<.5?1:0);
    drops.push({...main,quantity:qty});
  }
  const rareChance=clamp((.025+dropRarityBonus(sp)*.42+level*.0007)*Math.max(.6,Number(arenaSettings.drops)||1),.01,.28);
  if(Math.random()<rareChance)drops.push({...RARE_RELIAN_RESOURCE,quantity:1});
  return drops;
}
function awardBattleDrops(enemy){
  const char=battleOwnerCharacter();if(!char)return [];
  const drops=rollRelianDrops(enemy);
  for(const d of drops)addExplorerResource(char,d,d.quantity);
  if(drops.length){
    battle.drops=Array.isArray(battle.drops)?battle.drops:[];
    for(const d of drops){
      const existing=battle.drops.find(x=>x.id===d.id);
      if(existing)existing.quantity+=d.quantity;else battle.drops.push({...d});
    }
    try{doSave()}catch{}
    log(`Recursos obtidos: ${drops.map(d=>`${d.name} ×${d.quantity}`).join(', ')}.`);
  }
  return drops;
}
function resourceInventoryValue(charSheet){
  return explorerResourceInventory(charSheet).reduce((sum,row)=>sum+Math.max(0,Number(row.quantity)||0)*Math.max(0,Number(row.value??resourceDefinition(row.id).value)||0),0);
}
function sellExplorerResource(resourceId,quantity=null){
  const c=fixedPlayer();if(!c)return;
  const inv=explorerResourceInventory(c),row=inv.find(x=>String(x.id||x.resourceId)===String(resourceId));if(!row)return;
  const have=Math.max(0,Number(row.quantity)||0),qty=quantity==null?have:clamp(Math.round(Number(quantity)||0),1,have);
  if(!qty)return;
  const value=Math.max(0,Number(row.value??resourceDefinition(resourceId).value)||0)*qty;
  row.quantity=have-qty;
  c.character.resources=inv.filter(x=>Math.max(0,Number(x.quantity)||0)>0);
  c.character.credits=Math.max(0,Number(c.character.credits)||0)+value;
  const stats=ensureBattleStats(c);stats.resourcesSold+=qty;stats.creditsFromResources+=value;stats.creditsEarned+=value;
  try{doSave()}catch{}
  battleToast(`${qty}× ${row.name||resourceDefinition(resourceId).name} vendido por ${value.toLocaleString('pt-BR')} C$`,'capture',1600);
  renderResourceMarket();renderPlayerPage();renderShop();
}
function sellAllExplorerResources(){
  const c=fixedPlayer();if(!c)return;
  const inv=explorerResourceInventory(c),qty=inv.reduce((s,x)=>s+Math.max(0,Number(x.quantity)||0),0),value=resourceInventoryValue(c);
  if(!qty)return;
  if(!confirm(`Vender todos os ${qty} recursos por ${value.toLocaleString('pt-BR')} C$?`))return;
  c.character.resources=[];
  c.character.credits=Math.max(0,Number(c.character.credits)||0)+value;
  const stats=ensureBattleStats(c);stats.resourcesSold+=qty;stats.creditsFromResources+=value;stats.creditsEarned+=value;
  try{doSave()}catch{}
  battleToast(`Recursos vendidos por ${value.toLocaleString('pt-BR')} C$!`,'capture',1700);
  renderResourceMarket();renderPlayerPage();renderShop();
}
function renderResourceMarket(){
  const c=fixedPlayer(),grid=$('resourceInventoryGrid'),total=$('resourceInventoryValue'),sellAll=$('sellAllResourcesBtn');
  if(!grid)return;
  if(!c){
    grid.innerHTML='<div class="resource-market-empty"><b>Nenhum explorador definido</b><span>Escolha um explorador para acessar seus recursos.</span></div>';
    if(total)total.textContent='—';if(sellAll)sellAll.disabled=true;return;
  }
  const inv=explorerResourceInventory(c).filter(x=>Math.max(0,Number(x.quantity)||0)>0);
  if(total)total.textContent=`${resourceInventoryValue(c).toLocaleString('pt-BR')} C$`;
  if(sellAll)sellAll.disabled=!inv.length;
  grid.innerHTML=inv.length?inv.map(row=>{
    const def=resourceDefinition(row.id),qty=Math.max(0,Number(row.quantity)||0),unit=Math.max(0,Number(row.value??def.value)||0);
    return `<article class="resource-card">
      <div class="resource-card-icon">${escapeHtml(row.icon||def.icon||'◆')}</div>
      <div class="resource-card-copy"><b>${escapeHtml(row.name||def.name)}</b><small>${escapeHtml(row.description||def.description||'Recurso Relian')}</small><span>${qty} unidade${qty===1?'':'s'} · ${unit.toLocaleString('pt-BR')} C$ cada</span></div>
      <div class="resource-card-sale"><strong>${(qty*unit).toLocaleString('pt-BR')} C$</strong><button type="button" data-sell-resource="${escapeHtml(row.id)}">Vender tudo</button></div>
    </article>`;
  }).join(''):'<div class="resource-market-empty"><b>Nenhum recurso coletado</b><span>Derrote Relians para encontrar materiais que podem ser vendidos.</span></div>';
  grid.querySelectorAll('[data-sell-resource]').forEach(btn=>btn.onclick=()=>sellExplorerResource(btn.dataset.sellResource));
}

function explorerEconomyInfo(charSheet){
  if(!charSheet?.character)return {earned:0,resources:0,owned:0};
  const c=charSheet.character,stats=ensureBattleStats(charSheet);
  const inventories=[
    ...(Array.isArray(c.resources)?c.resources:[]),
    ...(Array.isArray(c.materials)?c.materials:[]),
    ...(Array.isArray(c.inventoryResources)?c.inventoryResources:[])
  ];
  let resources=0;
  for(const item of inventories){
    if(typeof item==='number')resources+=Math.max(0,item);
    else resources+=Math.max(0,Number(item?.quantity??item?.qty??item?.amount)||0);
  }
  const owned=typeof ensureRelianOwnership==='function'?ensureRelianOwnership(charSheet).length:(c.team||[]).length;
  return {
    earned:Math.max(0,Number(stats.creditsEarned)||0),
    resources,
    owned,
    sold:Math.max(0,Number(stats.reliansSold)||0),
    saleCredits:Math.max(0,Number(stats.creditsFromRelianSales)||0),
    resourcesCollected:Math.max(0,Number(stats.resourcesCollected)||0),
    resourceCredits:Math.max(0,Number(stats.creditsFromResources)||0)
  };
}

function renderPlayerPage(){
  const sel=$('fixedPlayerSelect'),chars=characters(),fixed=fixedPlayer();
  if(sel){
    const old=fixed?.id||sel.value||'';
    sel.innerHTML='<option value="">Selecione...</option>'+chars.map(c=>`<option value="${escapeHtml(c.id)}">${escapeHtml(c.character?.name||'Personagem')}</option>`).join('');
    if(chars.some(c=>String(c.id)===String(old)))sel.value=old;
  }

  const pill=$('playerFixedPill');
  if(pill)pill.textContent=fixed?`Ativo: ${fixed.character?.name||'Personagem'}`:'Nenhum explorador definido';
  const notice=$('pendingBattleNotice');if(notice)notice.hidden=!pendingGeneratedBattle;

  const stats=fixed?ensureBattleStats(fixed):{battles:0,wins:0,losses:0,captures:0,escapes:0,trainerWins:0};
  const rank=rankProgressInfo(stats.wins||0);
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
          <div class="section-kicker">EXPLORADOR ATIVO</div>
          <h2>${escapeHtml(c.name||'Personagem')}</h2>
          <p>${escapeHtml(c.player||'Sem jogador informado')} · Nv. ${Number(c.level)||1}</p>
          <div class="player-profile-tags"><span>${escapeHtml(c.region||'Região não definida')}</span><span>${alive}/${members.length} Relians aptos</span><span>${escapeHtml(rank.name)}</span></div>
        </div>
      </div>`;
    }
  }

  if(overview){
    if(!fixed)overview.innerHTML='<div class="player-team-empty">Defina um explorador para visualizar a equipe.</div>';
    else{
      const members=(fixed.character?.team||[]).map(m=>({m,s:savedById(m.savedSheetId)})).filter(x=>x.s);
      overview.innerHTML=members.length?members.map(({m,s})=>{
        const sp=species(s.speciesId),img=imageFor(sp,s.color);
        const hp=Number(s.hpCurrent??s.hpMax??0),maxHp=Math.max(1,Number(s.hpMax)||1);
        const eng=Number(s.engCurrent??s.engMax??0),maxEng=Math.max(1,Number(s.engMax)||1);
        const evolutionReady=readyEvolutionOptions(s,m,fixed);
        return `<article class="player-team-mini ${evolutionReady.length?'can-evolve':''}">
          <div class="player-team-mini-img">${img?`<img src="${escapeHtml(img)}" alt="">`:'◆'}</div>
          <div><b>${escapeHtml(m.nickname||s.nickname||sp?.name||'Relian')}</b><small>Nv. ${Number(m.level||s.level)||1} · HP ${Math.round(hp)}/${Math.round(maxHp)} · ENG ${Math.round(eng)}/${Math.round(maxEng)}</small>${evolutionReady.length?`<button type="button" class="player-evolve-btn" data-evolve-sheet="${escapeHtml(s.id)}">Evoluir?</button>`:''}</div>
          <span class="${hp>0?'ok':'down'}">${hp>0?'Apto':'Desmaiado'}</span>
        </article>`;
      }).join(''):'<div class="player-team-empty">Este personagem ainda não possui Relians.</div>';
      overview.querySelectorAll('[data-evolve-sheet]').forEach(btn=>btn.onclick=()=>requestEvolution(btn.dataset.evolveSheet));
    }
  }

  const teamTotal=fixed?.character?.team?.length||0;
  const teamAlive=fixed?aliveTeam(fixed).length:0;
  const credits=Math.max(0,Number(fixed?.character?.credits)||0);
  const economy=fixed?explorerEconomyInfo(fixed):{earned:0,resources:0,owned:0};
  const map={
    playerStatBattles:stats.battles,playerStatWins:stats.wins,playerStatLosses:stats.losses,
    playerStatCaptures:stats.captures,playerStatEscapes:stats.escapes,playerStatTrainerWins:stats.wins||0,
    playerStatCredits:credits,playerStatRank:rank.name,playerEconomyCredits:`${credits.toLocaleString('pt-BR')} C$`,
    playerEconomyEarned:`${economy.earned.toLocaleString('pt-BR')} C$`,
    playerEconomyResources:economy.resources.toLocaleString('pt-BR'),
    playerEconomyOwned:economy.owned.toLocaleString('pt-BR'),
    playerEconomySold:(economy.sold||0).toLocaleString('pt-BR'),
    playerEconomySaleCredits:`${(economy.saleCredits||0).toLocaleString('pt-BR')} C$`,
    playerEconomyResourcesCollected:(economy.resourcesCollected||0).toLocaleString('pt-BR'),
    playerEconomyResourceCredits:`${(economy.resourceCredits||0).toLocaleString('pt-BR')} C$`,
    playerEconomyRank:rank.name,playerEconomyTeam:`${teamAlive}/${teamTotal}`
  };
  Object.entries(map).forEach(([id,v])=>{const e=$(id);if(e)e.textContent=v});
  const progressText=$('playerRankProgressText');if(progressText)progressText.textContent=rank.text;
  const progressBar=$('playerRankProgressBar');if(progressBar)progressBar.style.width=`${rank.percent}%`;
  const rankCard=$('explorerRankShowcase');
  if(rankCard){
    rankCard.dataset.rank=rank.tone;
    rankCard.classList.toggle('max-rank',rank.name==='S+');
  }
  const emblem=$('explorerRankEmblem');if(emblem)emblem.textContent=rank.name;
  const rankTitle=$('explorerRankName');if(rankTitle)rankTitle.textContent=`Rank ${rank.name}`;
  const rankLabel=$('explorerRankLabel');if(rankLabel)rankLabel.textContent=rank.label;
  const rankWins=$('explorerRankWins');if(rankWins)rankWins.textContent=`${stats.wins||0} vitórias competitivas`;
  const nextName=$('explorerRankNext');if(nextName)nextName.textContent=rank.nextName?`Próximo: Rank ${rank.nextName}`:'RANK MÁXIMO';
  const remaining=$('explorerRankRemaining');if(remaining)remaining.textContent=rank.nextName?`Faltam ${rank.remaining} vitórias`:'Você alcançou o ápice do ranking.';
  const bigBar=$('explorerRankBar');if(bigBar)bigBar.style.width=`${rank.percent}%`;
  renderTrainerBattleHistory(fixed);
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
  const modItems=window.ReliansMods?window.ReliansMods.runtimeItems():[];
  const merged=new Map();
  for(const item of RELIANS_OFFICIAL_ITEMS)merged.set(String(item.id),item);
  for(const item of modItems)merged.set(String(item.id),item);
  for(const item of custom)merged.set(String(item.id),item);
  return [...merged.values()];
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
  return clamp(Math.round((18+hpBonus+statusBonus-levelPenalty+cubeBonus)*arenaSettings.capture),5,98);
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
      const capturedSheet=saveCapturedEnemy(true);
      recordPlayerResult('capture',{xp:Number(battle.totalXp)||0});
      render();
      chooseCapturedRelianDestination(capturedSheet,choice=>{
        showBattleResult('capture',`${battle.enemy.nickname} foi capturado!`,choice==='team'?'O novo Relian foi adicionado à sua equipe.':'O novo Relian está guardado na Central Relian.',0,0,{totalXp:battle.totalXp});
      });
    }else{
      log(`${battle.enemy.nickname} escapou do DataCubo!`);
      battleToast(`${battle.enemy.nickname} escapou!`,'miss',1000);
      render();
      setTimeout(()=>beginEnemyTurn({processStart:true}),420);
    }
  },620);
}

function chooseCapturedRelianDestination(sheet,onDone){
  const char=battleOwnerCharacter()||fixedPlayer();
  if(!char||!sheet){onDone?.('box');return}
  ensureRelianOwnership(char);
  const hasSpace=(char.character.team||[]).length<CENTRAL_TEAM_LIMIT;
  if(!hasSpace){
    battleToast(`${sheet.nickname||sheet.speciesName} foi enviado à Box. A equipe está cheia.`,'capture',1500);
    renderRecoveryPage();onDone?.('box');return;
  }
  document.querySelector('.capture-destination-overlay')?.remove();
  const sp=species(sheet.speciesId),img=imageFor(sp,sheet.color),over=document.createElement('div');
  over.className='battle-switch-overlay capture-destination-overlay';
  over.innerHTML=`<div class="card capture-destination-card">
    <div class="section-kicker">NOVO RELIAN</div>
    <div class="capture-destination-hero">${img?`<img src="${escapeHtml(img)}" alt="">`:'◆'}<div><h2>${escapeHtml(sheet.nickname||sp?.name||'Relian')} foi para sua Box!</h2><p>Há espaço na equipe. Deseja colocá-lo na equipe agora?</p></div></div>
    <div class="capture-destination-actions">
      <button type="button" class="primary" data-capture-destination="team">Adicionar à equipe</button>
      <button type="button" data-capture-destination="box">Manter na Box</button>
    </div>
  </div>`;
  document.body.appendChild(over);
  over.querySelectorAll('[data-capture-destination]').forEach(btn=>btn.onclick=()=>{
    const choice=btn.dataset.captureDestination;
    if(choice==='team')addRelianToTeam(char,sheet.id);
    over.remove();
    renderRecoveryPage();renderPlayerPage();
    onDone?.(choice);
  });
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
  renderResourceMarket();
  const c=shopCharacter(),credits=$('shopCredits'),box=$('shopItemsGrid'),cats=$('shopCategoryList');
  const playerLabel=$('shopPlayerLabel');
  if(credits)credits.textContent=c?`${Math.max(0,Number(c.character?.credits)||0).toLocaleString('pt-BR')} C$`:'—';
  if(playerLabel)playerLabel.textContent=c?c.character?.name||'Personagem ativo':'Nenhum explorador definido';
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
  ensureRelianOwnership(char);
  migrated.ownerCharacterId=String(char.id||'');
  migrated.originalTrainer=String(char.character?.name||migrated.originalTrainer||'');
  if(!char.character.ownedRelianIds.includes(String(migrated.id)))char.character.ownedRelianIds.push(String(migrated.id));
  char.character.equippedRelianIds=Array.isArray(char.character.equippedRelianIds)?char.character.equippedRelianIds:[];
  try{doSave();refreshTeam()}catch{}
  return migrated;
}
function captureEnemy(){
  const captured=saveCapturedEnemy(false);if(!captured)return;
  document.querySelector('.battle-capture-overlay')?.remove();
  showBattleResult('capture',`${captured.nickname} foi capturado!`,'O novo Relian foi enviado à Central Relian do treinador.');
}
function offerCapture(xp,levels){
  const old=document.querySelector('.battle-capture-overlay');if(old)old.remove();
  const overlay=document.createElement('div');overlay.className='battle-switch-overlay battle-capture-overlay';
  const img=imageFor(battle.enemy.species,battle.enemy.color);
  overlay.innerHTML=`<div class="card battle-capture-dialog">
    <div class="battle-capture-portrait">${img?`<img src="${escapeHtml(img)}" alt="">`:''}</div>
    <div><div class="section-kicker">RELIAN ENFRAQUECIDO</div><h2>${escapeHtml(battle.enemy.nickname)} desmaiou</h2>
    <p>Você venceu e recebeu <b>${xp} XP</b>${levels?` · +${levels} nível${levels>1?'s':''}`:''}. Deseja capturar este Relian? Ele será registrado na Box do treinador e entrará na equipe automaticamente se houver espaço.</p></div>
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
function parseRange(move){return ReliansBattle.Tactical.parseRange(move)}
function areaRadius(move){
  const explicit=Number(move?.tacticalArea??move?.areaTatica);
  if(Number.isFinite(explicit)&&explicit>=0)return clamp(Math.round(explicit),0,4);
  const txt=[move?.range,move?.alcance,...(move?.tags||[]),...(move?.effects||[])].join(' ').toLowerCase();
  const m=txt.match(/(?:área|area|raio)\s*(\d+)/);
  if(m)return clamp(Number(m[1]),0,3);
  if(/explos|onda|chuva|diluvio|ciclone/.test(String(move?.name||move?.nome||'').toLowerCase()))return 1;
  return 0;
}

function areaShape(move){return ReliansBattle.Tactical.areaShape(move)}
function shapeLabel(move){return ReliansBattle.Tactical.shapeLabel(move)}
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
  const energyLimit=Math.floor(Math.max(0,battle.player.eng)/arenaPlayerMoveCost());
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

    const cost=path.length*arenaPlayerMoveCost();
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
  level=clamp((Number(level)||1)+arenaSettings.enemyLevel,1,100);
  const d=getData(),pool=(d?.relians||[]).filter(Boolean);if(!pool.length)return null;
  const levelPool=pool.filter(r=>(r.encounters||[]).some(e=>level>=Number(e.minLevel||1)&&level<=Number(e.maxLevel||100)));
  const choices=levelPool.length?levelPool:pool,sp=choices[Math.floor(Math.random()*choices.length)];
  const validEnc=(sp.encounters||[]).filter(e=>level>=Number(e.minLevel||1)&&level<=Number(e.maxLevel||100));
  const enc=validEnc[Math.floor(Math.random()*Math.max(1,validEnc.length))]||sp.encounters?.[0]||{};
  const trIds=Object.keys(d?.traits||{}),tr=trIds.length?d.traits[trIds[Math.floor(Math.random()*trIds.length)]]:null;
  let resources={hp:100,energy:Number(sp.baseEnergy)||65};try{resources=calculateRelianResources(level,tr)}catch{}
  const randAttr=()=>{try{return rollAttribute()}catch{return 20+Math.floor(Math.random()*20)}};
  return applyDifficultyToEnemy({side:'enemy',species:sp,nickname:sp.name,level,color:'basic',hp:resources.hp,maxHp:resources.hp,eng:resources.energy,maxEng:resources.energy,attack:randAttr(),defense:randAttr(),spAttack:randAttr(),spDefense:randAttr(),speed:randAttr(),precision:randAttr(),moves:getMovesFor(sp,level,null),pos:{x:W-2,y:Math.floor(H/2)},moved:false,acted:false,knocked:false,regionId:String(enc.region||''),biomeId:String(enc.biome||'')});
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
 if(fixed){sel.disabled=true;sel.title='Personagem fixo definido na Carteira do Explorador.'}else{sel.disabled=false;sel.title=''}
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
  battle={player,enemy,round:1,turn:null,mode:null,selectedMove:null,label,finished:false,terrain:makeTerrain(arenaTheme),arenaRegion,arenaTheme,animatingMove:false,modeType:options.modeType||'wild',trainerName:options.trainerName||'',trainerQueue:Array.isArray(options.trainerQueue)?options.trainerQueue:[],trainerReward:Number(options.trainerReward)||0,trainerLevel:Number(options.trainerLevel)||enemy.level||1,ownerCharacterId:String(player.characterId||''),battleId:`battle-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,recordedResults:new Set(),startedAt:Date.now(),defeatedEnemies:0,totalXp:0,drops:[],difficultySnapshot:{...arenaSettings},usedRelians:[{sheetId:String(player.sheetId||''),speciesId:String(player.species?.id||''),name:String(player.nickname||player.species?.name||'Relian'),level:Number(player.level)||1}],opponents:[{speciesId:String(enemy.species?.id||''),name:String(enemy.nickname||enemy.species?.name||'Relian'),level:Number(enemy.level)||1}]};

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
  const fixed=fixedPlayer(),stats=fixed?ensureBattleStats(fixed):{wins:0};
  const rank=playerRank(stats.wins);
  const baseTeamSize=['S+','S'].includes(rank)?4:['A+','A','B+'].includes(rank)?3:2;
  const teamSize=clamp(baseTeamSize+arenaSettings.trainerExtra,1,6);
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
  battle.opponents=battle.opponents||[];battle.opponents.push({speciesId:String(next.species?.id||''),name:String(next.nickname||next.species?.name||'Relian'),level:Number(next.level)||1});
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
 const limit=Math.min(maxWalk(battle.player),Math.floor(battle.player.eng/arenaPlayerMoveCost()));
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

  if(usable.length>1&&Math.random()*100<arenaSettings.aiMistake){
    const wrongIndex=1+Math.floor(Math.random()*(usable.length-1));
    const [mistake]=usable.splice(wrongIndex,1);usable.unshift(mistake);
  }
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
 return Math.max(10,Math.round((22+(Number(enemy?.level)||1)*8)*mult*gapMult*arenaSettings.xp));
}
function finishBattleSession(){
  closeBattleBag();
  document.querySelector('.battle-switch-overlay')?.remove();
  const game=$('battleGame'),empty=$('battleEmpty');
  if(game){game.hidden=true;game.style.display='none'}
  if(empty)empty.hidden=false;
  battle=null;battleActionView='none';
  refreshSetup();renderPlayerPage();renderShop();renderRecoveryPage();
}
function showBattleResult(type,title,description,xp=0,levels=0,extra={}){
  document.querySelector('.battle-result-overlay')?.remove();
  const snapshot={
    rounds:Number(battle?.round)||1,defeated:Number(battle?.defeatedEnemies)||0,
    xp:Number(extra.totalXp??battle?.totalXp??xp)||0,credits:Number(extra.credits)||0,
    rank:String(extra.rank||''),trainer:String(extra.trainer||battle?.trainerName||''),
    drops:[...(battle?.drops||[])],
    player:String(battle?.player?.nickname||''),mode:battle?.modeType==='trainer'?'Batalha de Treinador':'Encontro Selvagem',
    duration:Math.max(1,Math.round((Date.now()-(Number(battle?.startedAt)||Date.now()))/1000))
  };
  const overlay=document.createElement('div');overlay.className=`battle-result-overlay battle-summary-screen ${type}`;
  const icon=type==='victory'?'✦':type==='capture'?'◈':type==='defeat'?'×':'↩';
  const label=type==='victory'?'VITÓRIA':type==='capture'?'CAPTURA CONCLUÍDA':type==='defeat'?'DERROTA':'FIM DA BATALHA';
  overlay.innerHTML=`<div class="battle-result-burst"></div><div class="battle-result-card battle-summary-card">
    <div class="battle-result-icon">${icon}</div><div class="section-kicker">${label}</div>
    <h2>${escapeHtml(title)}</h2><p>${escapeHtml(description)}</p>
    <div class="battle-summary-grid">
      <div><span>Modo</span><b>${escapeHtml(snapshot.mode)}</b></div>
      <div><span>Rodadas</span><b>${snapshot.rounds}</b></div>
      <div><span>Oponentes derrotados</span><b>${snapshot.defeated}</b></div>
      <div><span>XP obtido</span><b>+${snapshot.xp}</b></div>
      ${snapshot.credits?`<div><span>Créditos</span><b>+${snapshot.credits} C$</b></div>`:''}
      ${snapshot.rank?`<div><span>Rank atual</span><b>${escapeHtml(snapshot.rank)}</b></div>`:''}
      <div><span>Duração</span><b>${snapshot.duration}s</b></div>
    </div>
    ${snapshot.trainer?`<div class="battle-summary-opponent"><span>Treinador enfrentado</span><b>${escapeHtml(snapshot.trainer)}</b></div>`:''}
    ${snapshot.drops.length?`<div class="battle-result-drops"><div class="section-kicker">RECURSOS OBTIDOS</div><div>${snapshot.drops.map(d=>`<span><b>${escapeHtml(d.icon||'◆')} ${escapeHtml(d.name)}</b><small>×${Number(d.quantity)||1} · ${(Number(d.value)||0).toLocaleString('pt-BR')} C$/un.</small></span>`).join('')}</div></div>`:''}
    ${levels?`<div class="battle-result-rewards"><span>${escapeHtml(snapshot.player||'Seu Relian')} subiu ${levels} nível${levels>1?'s':''}!</span></div>`:''}
    <div class="battle-result-actions">
      <button type="button" class="primary" data-result-go="battleTest">Nova batalha</button>
      <button type="button" data-result-go="playerPage">Carteira do Explorador</button>
      <button type="button" data-result-go="recoveryPage">Central Relian</button>
    </div>
  </div>`;
  document.body.appendChild(overlay);requestAnimationFrame(()=>overlay.classList.add('show'));
  overlay.querySelectorAll('[data-result-go]').forEach(btn=>btn.onclick=()=>{
    const target=btn.dataset.resultGo;
    overlay.classList.remove('show');
    setTimeout(()=>{
      overlay.remove();finishBattleSession();
      const tab=document.querySelector(`[data-tab="${target}"]`);
      if(tab)tab.click();
      if(target==='playerPage')renderPlayerPage();
      if(target==='recoveryPage')renderRecoveryPage();
    },180);
  });
}

function victory(){
  battle.enemy.knocked=true;
  syncPlayerResources();
  const defeatedEnemy=battle.enemy;
  const xp=xpRewardFor(defeatedEnemy,battle.player),levels=awardXp(battle.player,xp);battle.defeatedEnemies=(battle.defeatedEnemies||0)+1;battle.totalXp=(battle.totalXp||0)+xp;
  awardBattleDrops(defeatedEnemy);
  log(`${battle.enemy.nickname} foi derrotado! ${battle.player.nickname} ganhou ${xp} XP.${levels?` Subiu ${levels} nível${levels>1?'s':''}!`:''}`);

  if(battle.modeType==='trainer'&&battle.trainerQueue?.length){
    render();
    setTimeout(nextTrainerRelian,520);
    return;
  }

  battle.finished=true;battleActionView='none';setBattleActionView('none');

  if(battle.modeType==='trainer'){
    const reward=addPlayerCredits(battle.trainerReward,`Vitória contra ${battle.trainerName}`);
    const stats=recordPlayerResult('trainerWin',{xp:Number(battle.totalXp)||0,credits:reward})||ensureBattleStats(battleOwnerCharacter());
    const rank=playerRank(stats?.wins||0);
    $('battleHint').textContent=`Vitória sobre ${battle.trainerName}! +${reward} C$`;
    renderPlayerPage();render();
    setTimeout(()=>showBattleResult('victory',`Você venceu ${battle.trainerName}!`,`Vitória competitiva contabilizada. Total: ${stats?.wins||0}.`,xp,levels,{credits:reward,rank,trainer:battle.trainerName,totalXp:battle.totalXp}),260);
  }else{
    recordPlayerResult('win',{xp:Number(battle.totalXp)||0});
    $('battleHint').textContent=`Vitória! +${xp} XP`;
    render();
    setTimeout(()=>showBattleResult('victory','Vitória!',`${battle.enemy.nickname} foi derrotado.`,xp,levels,{totalXp:battle.totalXp}),260);
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
function showSwitch(){const c=characters().find(x=>String(x.id)===String(battle.player.characterId));const candidates=aliveTeam(c).filter(x=>String(x.sheet.id)!==String(battle.player.sheetId));const over=document.createElement('div');over.className='battle-switch-overlay';over.innerHTML=`<div class="card battle-switch-dialog"><div><div class="section-kicker">RELIAN DERROTADO</div><h2>Escolha outro Relian</h2><p>${candidates.length?'Você pode continuar a batalha com outro membro da equipe.':'Nenhum outro Relian está apto a lutar.'}</p></div><div class="battle-switch-list">${candidates.map(x=>`<button type="button" class="battle-switch-choice" data-switch="${escapeHtml(x.sheet.id)}"><b>${escapeHtml(x.member.nickname||x.sheet.nickname||x.sheet.speciesName)}</b><span>Nv. ${x.member.level||x.sheet.level}</span></button>`).join('')}</div><button type="button" class="danger" data-flee-switch="1">Fugir do combate</button></div>`;document.body.appendChild(over);over.querySelectorAll('[data-switch]').forEach(b=>b.onclick=()=>{const found=candidates.find(x=>String(x.sheet.id)===b.dataset.switch);if(!found)return;const old=battle.player.pos;battle.player=buildFromSaved(found.sheet,found.member,c);battle.usedRelians=battle.usedRelians||[];if(!battle.usedRelians.some(x=>String(x.sheetId)===String(found.sheet.id)))battle.usedRelians.push({sheetId:String(found.sheet.id),speciesId:String(found.sheet.speciesId||''),name:String(found.member.nickname||found.sheet.nickname||found.sheet.speciesName||'Relian'),level:Number(found.member.level||found.sheet.level)||1});ensureCombatState(battle.player);ensureMoves(battle.player);battle.player.pos=old;battle.player.knocked=false;battle.player.moved=false;battle.player.acted=false;battle.mode=null;battle.selectedMove=null;battle.turn='player';battle.finished=false;over.remove();log(`${battle.player.nickname} entrou no campo!`);$('battleHint').textContent=`${battle.player.nickname} entrou no combate. Escolha uma ação.`;render()});over.querySelector('[data-flee-switch]').onclick=()=>{over.remove();if(!candidates.length){if(!battle.finished){battle.finished=true;recordPlayerResult('loss',{xp:Number(battle.totalXp)||0});showBattleResult('defeat','Derrota','Todos os Relians aptos do personagem foram derrotados.')}}else flee()}}
function flee(){if(!battle||battle.finished)return;syncPlayerResources();battle.finished=true;recordPlayerResult('escape',{xp:Number(battle.totalXp)||0});$('battleHint').textContent='Combate encerrado.';log('Você fugiu do combate.');render();showBattleResult('flee','Você fugiu','A batalha terminou sem vencedor.')}
function log(txt){const box=$('battleLog');if(!box)return;const row=document.createElement('div');row.className='battle-log-entry';row.textContent=txt;box.prepend(row)}

function init(){
 bindArenaSettings();
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
 $('recoverAllOwnedBtn')?.addEventListener('click',recoverAllOwned);
 $('centralBoxSearch')?.addEventListener('input',renderRecoveryPage);
 document.querySelectorAll('[data-close-relian-detail]').forEach(b=>b.addEventListener('click',closeCentralRelianDetail));
 $('shopSearchInput')?.addEventListener('input',renderShop);
 $('sellAllResourcesBtn')?.addEventListener('click',sellAllExplorerResources);
 $('trainerHistoryFilter')?.addEventListener('change',()=>renderTrainerBattleHistory(fixedPlayer()));
 $('clearTrainerHistoryBtn')?.addEventListener('click',clearTrainerHistory);
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
   const limit=Math.min(maxWalk(battle.player),Math.floor(battle.player.eng/arenaPlayerMoveCost()));
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
