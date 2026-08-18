(() => {
  const CARD_KEY='relians_tcg_cards_v1';
  const DECK_KEY='relians_tcg_decks_v1';
  const COLLECTION_KEY='relians_tcg_collection_v1';
  const ELEMENTS={
    '':{label:'Nenhum',color:'#777777'},
    'Éter':{color:'#d7d4cf'},'Vital':{color:'#6fba45'},'Astral':{color:'#8b5cc7'},'Halo':{color:'#f1c83f'},
    'Umbral':{color:'#57465f'},'Tempestade':{color:'#4d8fd5'},'Ígnea':{color:'#e36a28'},'Abissal':{color:'#3e86c8'},
    'Colossal':{color:'#8c6b43'},'Geada':{color:'#85cde0'}
  };
  const load=key=>{try{return JSON.parse(localStorage.getItem(key)||'[]')}catch{return[]}};
  const save=(key,value)=>localStorage.setItem(key,JSON.stringify(value));
  let cards=load(CARD_KEY),decks=load(DECK_KEY),collection=load(COLLECTION_KEY);
  if(!collection||Array.isArray(collection))collection={};
  decks=decks.map(d=>({...d,cards:d.cards||{}}));
  let relianImageData='',activeDeckId=decks[0]?.id||'',editingCardId='',editingCardType='';
  /* =======================================================
     DECKS OFICIAIS DE TESTE — Plantorco e Torrovino
     São mesclados à biblioteca local sem apagar cartas/decks do jogador.
     ======================================================= */
  const OFFICIAL_TEST_CARDS=[
    // --- Relians compartilhado / Plantorco ---
    {id:'official-bataterra',type:'relian',name:'Bataterra',relianType:'Broto Terrestre',class:'NET',hp:16,ep:{net:1,element:1},elements:['Colossal'],element:'Colossal',stats:{atk:5,spAtk:3,def:7,spDef:6,prec:90,speed:4},evolvesToIds:['official-plantorco','official-torrovino'],markers:{},ability:{name:'Raiz de Pedra',cost:1},description:'Base evolutiva. No Deck do Plantorco evolui para Plantorco; no Deck do Torrovino evolui para Torrovino.'},
    {id:'official-plantorco',type:'relian',name:'Plantorco',relianType:'Guardião Vegetal',class:'DEF',hp:30,ep:{net:2,element:2},elements:['Vital','Colossal'],element:'Vital + Colossal',stats:{atk:6,spAtk:5,def:12,spDef:10,prec:85,speed:3},evolvesFromId:'official-bataterra',markers:{},ability:{name:'Muralha Enraizada',cost:2},description:'Enquanto resiste em campo, transforma força Vital e Colossal em uma defesa difícil de atravessar.'},
    {id:'official-cebogrrim',type:'relian',name:'Cebogrrim',relianType:'Broto Cebola',class:'EFT',hp:14,ep:{net:1,element:1},elements:['Vital'],element:'Vital',stats:{atk:3,spAtk:6,def:5,spDef:7,prec:92,speed:5},evolvesToIds:['official-cebogrouv'],markers:{},ability:{name:'Ardência Verde',cost:1},description:'Evolui para Cebogrouv. Especialista em enfraquecer o ritmo ofensivo adversário.'},
    {id:'official-cebogrouv',type:'relian',name:'Cebogrouv',relianType:'Cebola Anciã',class:'EFT',hp:21,ep:{net:1,element:2},elements:['Vital'],element:'Vital',stats:{atk:4,spAtk:9,def:7,spDef:9,prec:94,speed:5},evolvesFromId:'official-cebogrrim',markers:{},ability:{name:'Lágrimas Irritantes',cost:2},description:'Espalha um aroma ardente que atrapalha o oponente e abre espaço para a defesa do deck.'},
    {id:'official-stenocate',type:'relian',name:'Stenocate',relianType:'Sentinela Natural',class:'NET',hp:18,ep:{net:1,element:1},elements:['Vital'],element:'Vital',stats:{atk:5,spAtk:5,def:7,spDef:7,prec:90,speed:6},markers:{},ability:{name:'Postura Serena',cost:1},description:'Relian estável e barato, usado para sustentar o campo enquanto as peças defensivas são preparadas.'},

    // --- Relians Torrovino ---
    {id:'official-torrovino',type:'relian',name:'Torrovino',relianType:'Investida Vulcânica',class:'OFS',hp:22,ep:{net:2,element:2},elements:['Ígnea','Colossal'],element:'Ígnea + Colossal',stats:{atk:12,spAtk:7,def:7,spDef:5,prec:88,speed:7},evolvesFromId:'official-bataterra',markers:{},ability:{name:'Investida Magmática',cost:2},description:'Evolução ofensiva de Bataterra no Deck do Torrovino. Mistura impacto Colossal com calor Ígneo.'},
    {id:'official-micorogo',type:'relian',name:'Micorogo',relianType:'Fungo de Brasa',class:'OFS',hp:13,ep:{net:1,element:1},elements:['Ígnea'],element:'Ígnea',stats:{atk:7,spAtk:6,def:4,spDef:4,prec:91,speed:7},evolvesToIds:['official-curumita'],markers:{},ability:{name:'Esporo em Brasa',cost:1},description:'Evolui para Curumitá. Pressiona cedo e prepara ataques Ígneos mais fortes.'},
    {id:'official-curumita',type:'relian',name:'Curumitá',relianType:'Fungo Guerreiro',class:'OFS',hp:19,ep:{net:1,element:2},elements:['Ígnea'],element:'Ígnea',stats:{atk:10,spAtk:8,def:5,spDef:5,prec:93,speed:8},evolvesFromId:'official-micorogo',markers:{},ability:{name:'Dança da Brasa',cost:2},description:'Evolução de Micorogo. Mantém pressão constante com golpes rápidos e agressivos.'},
    {id:'official-tatadrag',type:'relian',name:'Tatádrag',relianType:'Dragão de Fagulha',class:'OFS',hp:17,ep:{net:1,element:1},elements:['Ígnea'],element:'Ígnea',stats:{atk:9,spAtk:7,def:5,spDef:4,prec:89,speed:9},markers:{},ability:{name:'Mordida Incandescente',cost:1},description:'Atacante Ígneo veloz que mantém o campo sob pressão.'},

    // --- Suporte Plantorco: movimentos ---
    {id:'plant-mov-raizes',type:'movimento',name:'Raízes de Pedra',element:'Colossal',description:'Fortalece a linha defensiva com raízes endurecidas. Use para sustentar seus Relians.',class:'DEF',cost:{net:0,element:1},precision:100,power:2,torpor:false,linkedRelianIds:['official-bataterra','official-plantorco']},
    {id:'plant-mov-seiva',type:'movimento',name:'Seiva Restauradora',element:'Vital',description:'Canaliza energia Vital para recuperar o fôlego do campo. Aplique o efeito descrito conforme as regras da mesa.',class:'DEF',cost:{net:0,element:1},precision:100,power:0,torpor:false,linkedRelianIds:['official-plantorco','official-cebogrrim','official-cebogrouv','official-stenocate']},
    {id:'plant-mov-muralha',type:'movimento',name:'Muralha de Casca',element:'Vital',description:'Uma camada de casca reduz a pressão sofrida pelo Relian.',class:'DEF',cost:{net:1,element:1},precision:100,power:0,torpor:false,linkedRelianIds:['official-plantorco']},
    {id:'plant-mov-tremor',type:'movimento',name:'Tremor de Raiz',element:'Colossal',description:'Golpe controlado que pune quem tenta atravessar sua defesa.',class:'DEF',cost:{net:1,element:1},precision:90,power:7,torpor:true,linkedRelianIds:['official-bataterra','official-plantorco']},
    {id:'plant-mov-germinacao',type:'movimento',name:'Germinação Persistente',element:'Vital',description:'Mantém recursos vivos por mais tempo e favorece partidas prolongadas.',class:'EFT',cost:{net:1,element:1},precision:100,power:0,torpor:false,linkedRelianIds:['official-cebogrrim','official-cebogrouv','official-stenocate']},
    // itens Plantorco
    {id:'plant-item-semente',type:'item',name:'Semente de Reserva',element:'Vital',description:'Reserva de emergência para recuperar estabilidade quando o campo estiver pressionado.',use:'Uso Único',costEp:1},
    {id:'plant-item-casca',type:'item',name:'Casca Petrificada',element:'Colossal',description:'Proteção feita de matéria vegetal mineralizada. Favorece Relians defensivos.',use:'Equipamento',costEp:1},
    // treinadores Plantorco
    {id:'plant-trainer-jardineiro',type:'treinador',name:'Jardineiro de Pedra',element:'Vital',description:'Especialista em manter Relians resistentes ativos por mais tempo.',duration:'Permanente',costEp:1},
    {id:'plant-trainer-guardiao',type:'treinador',name:'Guardião do Bosque',element:'Colossal',description:'Reforça a estratégia de proteção e controle do campo.',duration:'Uso Único',costEp:1},
    {id:'plant-trainer-paciencia',type:'treinador',name:'Comando: Paciência',element:'Vital',description:'Troca velocidade por segurança. Ideal para preparar Plantorco.',duration:'Uso Único',costEp:0},
    // terrenos Plantorco
    {id:'plant-terrain-bosque',type:'terreno',name:'Bosque de Pedra Viva',element:'Vital',description:'Terreno principal do deck. A vegetação cresce entre rochas antigas.',terrainEffect:{trigger:'turno',type:'cura',value:1},generation:{net:1,element:1},target:'Seus Relians'},
    {id:'plant-terrain-colinas',type:'terreno',name:'Colinas Verdejantes',element:'Colossal',description:'Solo firme para uma formação resistente e estável.',terrainEffect:{trigger:'turno',type:'def',value:1},generation:{net:1,element:1},target:'Campo'} ,

    // --- Suporte Torrovino: movimentos ---
    {id:'torro-mov-investida',type:'movimento',name:'Investida Magmática',element:'Ígnea',description:'Ataque direto de alta pressão, assinatura do estilo de Torrovino.',class:'OFS',cost:{net:0,element:2},precision:90,power:10,torpor:true,linkedRelianIds:['official-torrovino']},
    {id:'torro-mov-punho',type:'movimento',name:'Punho de Escória',element:'Colossal',description:'Um golpe pesado coberto por rocha superaquecida.',class:'OFS',cost:{net:1,element:1},precision:92,power:8,torpor:true,linkedRelianIds:['official-bataterra','official-torrovino']},
    {id:'torro-mov-fagulha',type:'movimento',name:'Fagulha Voraz',element:'Ígnea',description:'Ataque barato para manter a pressão e finalizar alvos enfraquecidos.',class:'OFS',cost:{net:0,element:1},precision:95,power:6,torpor:true,linkedRelianIds:['official-micorogo','official-curumita','official-tatadrag']},
    {id:'torro-mov-erupcao',type:'movimento',name:'Erupção Colossal',element:'Ígnea',description:'Explosão pesada que combina calor e impacto. Alto custo, alto dano.',class:'OFS',cost:{net:2,element:2},precision:82,power:13,torpor:true,linkedRelianIds:['official-torrovino','official-curumita']},
    {id:'torro-mov-corrida',type:'movimento',name:'Corrida Incandescente',element:'Ígnea',description:'Acelera o ritmo ofensivo e força o oponente a responder rapidamente.',class:'OFS',cost:{net:1,element:1},precision:100,power:5,torpor:false,linkedRelianIds:['official-micorogo','official-curumita','official-tatadrag']},
    // itens Torrovino
    {id:'torro-item-carvao',type:'item',name:'Carvão Rubro',element:'Ígnea',description:'Combustível compacto usado para alimentar uma sequência ofensiva.',use:'Uso Único',costEp:1},
    {id:'torro-item-placa',type:'item',name:'Placa de Basalto',element:'Colossal',description:'Peça rochosa que permite atacar sem abandonar completamente a resistência.',use:'Equipamento',costEp:1},
    // treinadores Torrovino
    {id:'torro-trainer-ferreiro',type:'treinador',name:'Ferreiro Vulcânico',element:'Ígnea',description:'Transforma calor acumulado em pressão ofensiva.',duration:'Permanente',costEp:1},
    {id:'torro-trainer-investida',type:'treinador',name:'Comando: Investida',element:'Colossal',description:'Ordena uma ofensiva imediata, favorecendo Relians de alto ATQ.',duration:'Uso Único',costEp:1},
    {id:'torro-trainer-sem-recuo',type:'treinador',name:'Sem Recuo',element:'Ígnea',description:'Aposta tudo no combate e mantém o ritmo agressivo do deck.',duration:'Uso Único',costEp:0},
    // terrenos Torrovino
    {id:'torro-terrain-lava',type:'terreno',name:'Campos de Lava',element:'Ígnea',description:'Terreno principal do deck. O calor constante alimenta ataques Ígneos.',terrainEffect:{trigger:'turno',type:'dano',value:1},generation:{net:1,element:1},target:'Campo'},
    {id:'torro-terrain-desfiladeiro',type:'terreno',name:'Desfiladeiro Vulcânico',element:'Colossal',description:'Rocha quebrada e magma criam o cenário ideal para impactos pesados.',terrainEffect:{trigger:'turno',type:'atk',value:1},generation:{net:1,element:1},target:'Campo'}
  ];

  const OFFICIAL_TEST_DECKS=[
    {id:'official-deck-plantorco',name:'Deck do Plantorco — Vital/Colossal',description:'Deck DEF de resistência. Segura o campo, administra recursos e prepara Plantorco para dominar partidas longas.',cards:{
      'official-bataterra':4,'official-plantorco':2,'official-cebogrrim':4,'official-cebogrouv':3,'official-stenocate':6,
      'plant-mov-raizes':2,'plant-mov-seiva':2,'plant-mov-muralha':2,'plant-mov-tremor':2,'plant-mov-germinacao':2,
      'plant-item-semente':2,'plant-item-casca':2,
      'plant-trainer-jardineiro':1,'plant-trainer-guardiao':1,'plant-trainer-paciencia':1,
      'plant-terrain-bosque':2,'plant-terrain-colinas':2
    }},
    {id:'official-deck-torrovino',name:'Deck do Torrovino — Ígnea/Colossal',description:'Deck OFS de combate. Mantém pressão, causa dano rapidamente e usa Torrovino como finalizador pesado.',cards:{
      'official-bataterra':4,'official-torrovino':2,'official-micorogo':4,'official-curumita':3,'official-tatadrag':6,
      'torro-mov-investida':2,'torro-mov-punho':2,'torro-mov-fagulha':2,'torro-mov-erupcao':2,'torro-mov-corrida':2,
      'torro-item-carvao':2,'torro-item-placa':2,
      'torro-trainer-ferreiro':1,'torro-trainer-investida':1,'torro-trainer-sem-recuo':1,
      'torro-terrain-lava':2,'torro-terrain-desfiladeiro':2
    }}
  ];

  function installOfficialTestDecks(){
    const cardMap=new Map(cards.map(c=>[c.id,c]));
    OFFICIAL_TEST_CARDS.forEach(c=>{
      const existing=cardMap.get(c.id);
      if(existing&&!existing.userModified)Object.assign(existing,{...c,createdAt:existing.createdAt||'2026-08-17T00:00:00.000Z'});
      else{cards.push({...c,createdAt:'2026-08-17T00:00:00.000Z'});cardMap.set(c.id,c)}
    });
    const deckMap=new Map(decks.map(d=>[d.id,d]));
    OFFICIAL_TEST_DECKS.forEach(d=>{
      const existing=deckMap.get(d.id);
      if(existing&&existing.official)Object.assign(existing,{...d,cards:{...d.cards},official:true});
      else if(!existing)decks.push({...d,cards:{...d.cards},official:true});
    });
    const starterOwned={};
    OFFICIAL_TEST_DECKS.forEach(d=>Object.entries(d.cards).forEach(([id,qty])=>starterOwned[id]=Number(starterOwned[id]||0)+Number(qty||0)));
    Object.entries(starterOwned).forEach(([id,qty])=>{if(owned(id)<qty)collection[id]=qty});
    save(CARD_KEY,cards);save(DECK_KEY,decks);save(COLLECTION_KEY,collection);
    if(!activeDeckId)activeDeckId='official-deck-plantorco';
  }
  installOfficialTestDecks();
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const num=id=>Number($(id)?.value||0);
  const value=id=>String($(id)?.value||'').trim();
  const elementColor=name=>ELEMENTS[name]?.color||'#777777';

  function toast(message){const el=$('tcgToast');if(!el)return;el.textContent=message;el.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove('show'),1800)}
  function owned(id){return Math.max(0,Number(collection[id]||0))}
  function setOwned(id,qty){qty=Math.max(0,Math.floor(Number(qty)||0));if(qty)collection[id]=qty;else delete collection[id];save(COLLECTION_KEY,collection);renderCollection();renderDeckBuilder()}
  function downloadJson(name,data){const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},0)}
  function cardById(id){return cards.find(c=>c.id===id)}
  function deckById(id=activeDeckId){return decks.find(d=>d.id===id)}
  function openSection(name){
    document.querySelectorAll('[data-tcg-panel]').forEach(p=>p.classList.toggle('active',p.dataset.tcgPanel===name));
    document.querySelectorAll('[data-tcg-section]').forEach(b=>b.classList.toggle('active',b.dataset.tcgSection===name));
    document.body.classList.toggle('tcg-battle-mode',name==='play');
    window.scrollTo({top:Math.max(0,document.querySelector('.tcg-workspace')?.offsetTop-80||0),behavior:'smooth'});
  }

  function setupElementSelects(){
    const options=Object.entries(ELEMENTS).map(([name,info])=>`<option value="${esc(name)}">${esc(info.label||name||'Nenhum')}</option>`).join('');
    if($('rbcElement1'))$('rbcElement1').innerHTML=options;
    if($('rbcElement2'))$('rbcElement2').innerHTML=options;
    if($('supportElement'))$('supportElement').innerHTML=options;
  }

  function relianCards(){
    return cards.filter(c=>c.type==='relian').sort((a,b)=>String(a.name).localeCompare(String(b.name),'pt-BR'));
  }
  function evolutionFromId(card){
    return String(card?.evolvesFromId||card?.evolution?.from||'');
  }
  function evolutionToIds(card){
    const raw=card?.evolvesToIds||card?.evolution?.to||[];
    return Array.isArray(raw)?raw.map(String).filter(Boolean):[];
  }
  function evolutionName(id){
    return cardById(id)?.name||'';
  }
  function refreshEvolutionOptions(fromId='',toIds=[]){
    const from=$('rbcEvolvesFrom'),to=$('rbcEvolvesTo'),candidate=$('rbcEvolutionCandidate');
    const list=relianCards();
    if(from){
      from.innerHTML='<option value="">Forma base / nenhuma</option>'+list.map(c=>`<option value="${esc(c.id)}"${String(c.id)===String(fromId)?' selected':''}>${esc(c.name)}</option>`).join('');
    }
    const selected=new Set((toIds||[]).map(String));
    if(to){
      to.innerHTML=list.map(c=>`<option value="${esc(c.id)}"${selected.has(String(c.id))?' selected':''}>${esc(c.name)}</option>`).join('');
    }
    if(candidate){
      candidate.innerHTML='<option value="">Escolha uma evolução...</option>'+list.filter(c=>!selected.has(String(c.id))).map(c=>`<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('');
    }
    renderEvolutionChips();
  }
  function renderEvolutionChips(){
    const host=$('rbcEvolutionChips'),select=$('rbcEvolvesTo');
    if(!host||!select)return;
    const ids=[...select.selectedOptions].map(o=>o.value);
    host.innerHTML=ids.length?ids.map(id=>`<span class="evolution-chip"><b>${esc(evolutionName(id)||'Relian')}</b><button type="button" data-remove-evolution="${esc(id)}" aria-label="Remover evolução">×</button></span>`).join(''):'<span class="evolution-empty">Nenhuma evolução adicionada.</span>';
    host.querySelectorAll('[data-remove-evolution]').forEach(btn=>btn.onclick=()=>{
      const opt=[...select.options].find(o=>String(o.value)===String(btn.dataset.removeEvolution));
      if(opt)opt.selected=false;
      refreshEvolutionOptions(value('rbcEvolvesFrom'),selectedEvolutionToIds());
      updateRelianPreview();
    });
  }
  function addEvolutionCandidate(){
    const id=value('rbcEvolutionCandidate');if(!id)return;
    if(editingCardId&&String(id)===String(editingCardId)){toast('Um Relian não pode evoluir para ele mesmo.');return}
    const select=$('rbcEvolvesTo');
    const opt=[...select.options].find(o=>String(o.value)===String(id));
    if(opt)opt.selected=true;
    refreshEvolutionOptions(value('rbcEvolvesFrom'),selectedEvolutionToIds());
    updateRelianPreview();
  }
  function selectedEvolutionToIds(){
    const select=$('rbcEvolvesTo');
    return select?[...select.selectedOptions].map(o=>o.value).filter(Boolean):[];
  }
  function canEvolveCard(baseCard,evolutionCard){
    if(!baseCard||!evolutionCard||baseCard.type!=='relian'||evolutionCard.type!=='relian')return false;
    if(String(baseCard.id)===String(evolutionCard.id))return false;
    const baseTo=evolutionToIds(baseCard);
    const evoFrom=evolutionFromId(evolutionCard);
    return baseTo.includes(String(evolutionCard.id))||evoFrom===String(baseCard.id);
  }

  function refreshMovementRelianLinks(selectedIds=[]){
    const select=$('moveRelianLinks');if(!select)return;
    const selected=new Set((selectedIds||[]).map(String));
    select.innerHTML=relianCards().map(c=>`<option value="${esc(c.id)}"${selected.has(String(c.id))?' selected':''}>${esc(c.name)}${c.element?` — ${esc(c.element)}`:''}</option>`).join('');
  }
  function selectedMovementRelianIds(){
    const select=$('moveRelianLinks');
    return select?[...select.selectedOptions].map(o=>o.value).filter(Boolean):[];
  }
  function linkedRelianNames(card){
    const ids=Array.isArray(card?.linkedRelianIds)?card.linkedRelianIds:[];
    return ids.map(id=>cardById(id)?.name).filter(Boolean);
  }

  function setEditingState(card=null){
    editingCardId=card?.id||'';
    editingCardType=card?.type||'';

    const relianEditing=card?.type==='relian';
    const supportEditing=card&&card.type!=='relian';

    if($('rbcEditNotice'))$('rbcEditNotice').hidden=!relianEditing;
    if($('supportEditNotice'))$('supportEditNotice').hidden=!supportEditing;
    if($('rbcEditNoticeText')&&relianEditing)$('rbcEditNoticeText').textContent=`Editando “${card.name}”. Salvar manterá o mesmo ID da carta.`;
    if($('supportEditNoticeText')&&supportEditing)$('supportEditNoticeText').textContent=`Editando “${card.name}”. Salvar manterá o mesmo ID da carta.`;

    if($('rbcSaveBtn'))$('rbcSaveBtn').textContent=relianEditing?'Salvar alterações':'Salvar carta Relian';
    if($('supportSaveBtn'))$('supportSaveBtn').textContent=supportEditing?'Salvar alterações':'Salvar carta';
    if($('rbcClearBtn'))$('rbcClearBtn').textContent=relianEditing?'Cancelar edição':'Limpar';
    if($('supportClearBtn'))$('supportClearBtn').textContent=supportEditing?'Cancelar edição':'Limpar';
  }

  function fillRelianCreator(card){
    if(!card||card.type!=='relian')return;
    setEditingState(card);
    const elements=cardElements(card);

    if($('rbcName'))$('rbcName').value=card.name||'';
    if($('rbcRelianType'))$('rbcRelianType').value=card.relianType||'';
    if($('rbcClass'))$('rbcClass').value=card.class||'NET';
    if($('rbcHp'))$('rbcHp').value=Number(card.hp||0);
    if($('rbcEpNet'))$('rbcEpNet').value=Number(card.ep?.net||0);
    if($('rbcEpElement'))$('rbcEpElement').value=Number(card.ep?.element||0);
    if($('rbcElement1'))$('rbcElement1').value=elements[0]||'';
    if($('rbcElement2'))$('rbcElement2').value=elements[1]||'';
    if($('rbcAtk'))$('rbcAtk').value=relianAtk(card);
    if($('rbcDef'))$('rbcDef').value=relianDef(card);
    if($('rbcFlying'))$('rbcFlying').checked=!!card.markers?.flying;
    if($('rbcRange'))$('rbcRange').checked=!!card.markers?.range;
    if($('rbcTranslucent'))$('rbcTranslucent').checked=!!card.markers?.translucent;
    if($('rbcAbilityName'))$('rbcAbilityName').value=card.ability?.name||'';
    if($('rbcAbilityCost'))$('rbcAbilityCost').value=Number(card.ability?.cost||0);
    if($('rbcDescription'))$('rbcDescription').value=card.description||'';

    relianImageData=card.imageData||'';
    refreshEvolutionOptions(evolutionFromId(card),evolutionToIds(card));
    if($('rbcEvolvesFrom'))$('rbcEvolvesFrom').value=evolutionFromId(card);
    if($('rbcEvolvesTo')){
      const selected=new Set(evolutionToIds(card));
      [...$('rbcEvolvesTo').options].forEach(o=>o.selected=selected.has(String(o.value)));
    }

    updateRelianPreview();
    openSection('cards');
    document.querySelector('.relian-card-studio')?.scrollIntoView({behavior:'smooth',block:'start'});
  }

  function fillSupportCreator(card){
    if(!card||card.type==='relian')return;
    setEditingState(card);
    setSupportType(card.type);

    if($('supportName'))$('supportName').value=card.name||'';
    if($('supportElement'))$('supportElement').value=card.element||cardElements(card)[0]||'';
    if($('supportDescription'))$('supportDescription').value=card.description||'';

    if(card.type==='movimento'){
      if($('moveClass'))$('moveClass').value=card.class||'OFS';
      if($('moveEpNet'))$('moveEpNet').value=Number(card.cost?.net||0);
      if($('moveEpElement'))$('moveEpElement').value=Number(card.cost?.element||0);
      if($('movePrecision'))$('movePrecision').value=Number(card.precision??100);
      if($('movePower'))$('movePower').value=Number(card.power||0);
      if($('moveTorpor'))$('moveTorpor').checked=!!card.torpor;
      if($('moveTarget'))$('moveTarget').value=card.target||'inimigo';
      if($('moveKind'))$('moveKind').value=card.kind||'ataque';
      refreshMovementRelianLinks(movementLinkedIds(card));
      if($('moveRelianLinks')){
        const selected=new Set(movementLinkedIds(card));
        [...$('moveRelianLinks').options].forEach(o=>o.selected=selected.has(String(o.value)));
      }
    }else if(card.type==='item'){
      if($('itemUse'))$('itemUse').value=card.use||'unico';
      if($('itemEp'))$('itemEp').value=Number(card.costEp||0);
      if($('itemTarget'))$('itemTarget').value=card.target||'relian-aliado';
      if($('itemEffect'))$('itemEffect').value=card.effect?.type||'nenhum';
      if($('itemEffectValue'))$('itemEffectValue').value=Number(card.effect?.value||0);
    }else if(card.type==='treinador'){
      if($('trainerDuration'))$('trainerDuration').value=card.duration||'unico';
      if($('trainerEp'))$('trainerEp').value=Number(card.costEp||0);
      if($('trainerTarget'))$('trainerTarget').value=card.target||'aliados';
      if($('trainerEffect'))$('trainerEffect').value=card.effect?.type||'nenhum';
      if($('trainerEffectValue'))$('trainerEffectValue').value=Number(card.effect?.value||0);
    }else if(card.type==='terreno'){
      if($('terrainTarget'))$('terrainTarget').value=card.target||'aliados';
      if($('terrainTrigger'))$('terrainTrigger').value=card.terrainEffect?.trigger||'nenhum';
      if($('terrainEffect'))$('terrainEffect').value=card.terrainEffect?.type||'nenhum';
      if($('terrainEffectValue'))$('terrainEffectValue').value=Number(card.terrainEffect?.value||0);
    }

    updateSupportPreview();
    openSection('cards');
    $('supportCardStudio')?.scrollIntoView({behavior:'smooth',block:'start'});
  }

  function editCard(cardId){
    const card=cardById(cardId);
    if(!card)return;
    if(card.type==='relian')fillRelianCreator(card);
    else fillSupportCreator(card);
  }

  function updateRelianPreview(){
    const e1=value('rbcElement1'),e2=value('rbcElement2');
    const elements=[e1,e2].filter(Boolean).filter((x,i,a)=>a.indexOf(x)===i);

    const previewCard={
      id:'creator-live-preview',
      type:'relian',
      name:value('rbcName')||'Relian',
      relianType:value('rbcRelianType')||'Tipo de Relian',
      class:value('rbcClass')||'NET',
      hp:num('rbcHp'),
      ep:{net:num('rbcEpNet'),element:num('rbcEpElement')},
      elements,
      element:elements.join(' + '),
      stats:{atk:num('rbcAtk'),def:num('rbcDef')},
      markers:{
        flying:!!$('rbcFlying')?.checked,
        range:!!$('rbcRange')?.checked,
        translucent:!!$('rbcTranslucent')?.checked
      },
      ability:{
        name:value('rbcAbilityName')||'Habilidade',
        cost:num('rbcAbilityCost')
      },
      description:value('rbcDescription')||'Descrição da carta.',
      imageData:relianImageData
    };

    const host=$('rbcCreatorLivePreview');
    if(host)host.innerHTML=richCardVisualMarkup(previewCard);
  }

  function clearRelianCreator(){
    $('relianCardCreatorForm')?.reset();
    if($('rbcHp'))$('rbcHp').value=10;
    ['rbcEpNet','rbcEpElement','rbcAtk','rbcDef','rbcAbilityCost'].forEach(id=>{if($(id))$(id).value=0});
    relianImageData='';
    refreshEvolutionOptions();
    setEditingState(null);
    updateRelianPreview();
  }

  function saveRelianCard(event){
    event.preventDefault();
    const name=value('rbcName');if(!name){$('rbcName')?.focus();return}
    const elements=[value('rbcElement1'),value('rbcElement2')].filter(Boolean);
    if(elements.length===2&&elements[0]===elements[1])elements.splice(1,1);

    const existing=editingCardId?cardById(editingCardId):null;
    const cardData={
      id:existing?.id||(crypto.randomUUID?.()||String(Date.now())),
      type:'relian',
      name,
      relianType:value('rbcRelianType'),
      class:value('rbcClass'),
      hp:num('rbcHp'),
      ep:{net:num('rbcEpNet'),element:num('rbcEpElement')},
      elements,
      element:elements.join(' + '),
      stats:{atk:num('rbcAtk'),def:num('rbcDef')},
      evolvesFromId:value('rbcEvolvesFrom'),
      evolvesToIds:selectedEvolutionToIds(),
      markers:{flying:!!$('rbcFlying')?.checked,range:!!$('rbcRange')?.checked,translucent:!!$('rbcTranslucent')?.checked},
      ability:{name:value('rbcAbilityName'),cost:num('rbcAbilityCost')},
      description:value('rbcDescription'),
      imageData:relianImageData,
      createdAt:existing?.createdAt||new Date().toISOString(),
      updatedAt:new Date().toISOString(),
      userModified:existing?.id?.startsWith('official-')?true:(existing?.userModified||false)
    };

    if(existing){
      const idx=cards.findIndex(c=>c.id===existing.id);
      if(idx>=0)cards[idx]=cardData;
      toast('Carta atualizada');
    }else{
      cards.push(cardData);
      toast('Carta Relian criada');
    }

    save(CARD_KEY,cards);
    setEditingState(null);
    renderCards();renderCollection();renderDeckBuilder();
    clearRelianCreator();
  }

  function renderCards(){
    const q=String($('tcgCardSearch')?.value||'').toLowerCase(),type=$('tcgCardTypeFilter')?.value||'';
    const visible=cards.filter(c=>{if(type&&c.type!==type)return false;const hay=`${c.name} ${c.type} ${c.element||''} ${(c.elements||[]).join(' ')} ${c.description||''}`.toLowerCase();return hay.includes(q)});
    $('tcgCardCount').textContent=cards.length;
    $('tcgCardsGrid').innerHTML=visible.length?visible.map(c=>{
      const rich=c.type==='relian'&&(c.elements||c.stats||c.imageData);
      const e=(c.elements||String(c.element||'').split(/\s*\+\s*/)).filter(Boolean),a=elementColor(e[0]),b=elementColor(e[1]||e[0]);
      const rules=[];
      if(c.type==='relian'){
        const from=evolutionName(evolutionFromId(c));
        const to=evolutionToIds(c).map(evolutionName).filter(Boolean);
        if(from)rules.push(`Evolui de ${from}`);
        if(to.length)rules.push(`Evolui para ${to.join(', ')}`);
      }
      if(c.type==='movimento'){if(c.cost)rules.push(`${c.cost.net||0}/${c.cost.element||0} EP`);if(c.precision!=null)rules.push(`${c.precision}% PREC`);if(c.power!=null)rules.push(`Poder ${c.power}`);if(c.torpor)rules.push('Torpor');const linked=linkedRelianNames(c);rules.push(linked.length?`Relian: ${linked.join(', ')}`:'Movimento genérico')}
      if(c.type==='item'){if(c.use)rules.push(c.use);if(c.costEp!=null)rules.push(`${c.costEp} EP`)}
      if(c.type==='treinador'){if(c.duration)rules.push(c.duration);if(c.costEp!=null)rules.push(`${c.costEp} EP`)}
      if(c.type==='terreno'){rules.push('Gera 1 EP por turno');if(c.target)rules.push(c.target)}
      return `<article class="tcg-card-tile${rich?' relian-rich':''}${selectedLibraryCardId===c.id?' library-selected':''}" data-kind="${esc(c.type)}" data-library-card="${esc(c.id)}" style="--tile-a:${a};--tile-b:${b}">
        <div class="tcg-card-type">${esc(c.type).toUpperCase()}${c.class?` • ${esc(c.class)}`:''}</div>
        <div>${c.imageData?`<div class="tcg-card-thumb"><img src="${c.imageData}" alt=""></div>`:''}<h3>${esc(c.name)}</h3><p>${esc(c.description||'Sem descrição.')}</p>${rules.length?`<div class="tcg-card-ruleline">${rules.map(r=>`<span>${esc(r)}</span>`).join('')}</div>`:''}</div>
        <div class="library-card-actions"><button type="button" data-edit-card="${esc(c.id)}">✎ Editar</button><button type="button" data-collect-card="${esc(c.id)}">+ Coleção</button><button type="button" data-add-deck-card="${esc(c.id)}">+ Deck</button></div><div class="tcg-card-footer"><span class="tcg-card-elements">${e.length?e.map(x=>`<i title="${esc(x)}" style="background:${elementColor(x)}"></i>`).join(''):''}<em>${esc(e.join(' + ')||c.element||'Sem elemento')}</em></span><button type="button" data-delete-card="${esc(c.id)}">Excluir</button></div>
      </article>`}).join(''):`<div class="tcg-empty-card" style="grid-column:1/-1"><span>🃏</span><h3>Nenhuma carta ainda</h3><p>Crie sua primeira carta de Relian usando o editor acima.</p></div>`;
    document.querySelectorAll('[data-delete-card]').forEach(btn=>btn.onclick=()=>{const id=btn.dataset.deleteCard;cards=cards.filter(c=>c.id!==id);delete collection[id];decks.forEach(d=>delete d.cards[id]);save(CARD_KEY,cards);save(COLLECTION_KEY,collection);save(DECK_KEY,decks);renderCards();renderCollection();renderDeckBuilder()});
    document.querySelectorAll('[data-edit-card]').forEach(btn=>btn.onclick=e=>{e.stopPropagation();editCard(btn.dataset.editCard)});
    document.querySelectorAll('[data-collect-card]').forEach(btn=>btn.onclick=()=>{setOwned(btn.dataset.collectCard,owned(btn.dataset.collectCard)+1);toast('Carta adicionada à coleção')});
    document.querySelectorAll('[data-add-deck-card]').forEach(btn=>btn.onclick=e=>{e.stopPropagation();addCardToDeck(btn.dataset.addDeckCard)});
    document.querySelectorAll('[data-delete-card]').forEach(btn=>btn.addEventListener('click',e=>e.stopPropagation()));
    document.querySelectorAll('[data-edit-card]').forEach(btn=>btn.addEventListener('click',e=>e.stopPropagation()));
    document.querySelectorAll('[data-collect-card]').forEach(btn=>btn.addEventListener('click',e=>e.stopPropagation()));
    document.querySelectorAll('[data-library-card]').forEach(tile=>tile.addEventListener('click',()=>{
      selectedLibraryCardId=tile.dataset.libraryCard;
      const card=cardById(selectedLibraryCardId);
      renderCards();
      renderLibraryInspector();
      openFullscreenCard(card);
    }));
    document.querySelectorAll('[data-library-card]').forEach(tile=>tile.addEventListener('keydown',event=>{
      if(event.key==='Enter'||event.key===' '){
        event.preventDefault();
        tile.click();
      }
    }));
    if(selectedLibraryCardId&&!cardById(selectedLibraryCardId))selectedLibraryCardId='';
    renderLibraryInspector();
    refreshMovementRelianLinks(selectedMovementRelianIds());
    refreshEvolutionOptions(value('rbcEvolvesFrom'),selectedEvolutionToIds());
  }

  function renderCollection(){
    const grid=$('tcgCollectionGrid');if(!grid)return;
    const q=String($('tcgCollectionSearch')?.value||'').toLowerCase();
    const list=cards.filter(c=>owned(c.id)>0&&`${c.name} ${c.type} ${c.element||''} ${(c.elements||[]).join(' ')}`.toLowerCase().includes(q));
    const total=Object.values(collection).reduce((a,b)=>a+Number(b||0),0);
    if($('tcgCollectionTotal'))$('tcgCollectionTotal').textContent=`${total} cartas possuídas`;
    grid.innerHTML=list.length?list.map(c=>`
      <article class="collection-card collection-card-visual" data-collection-view="${esc(c.id)}" tabindex="0" role="button" aria-label="Visualizar ${esc(c.name)}">
        <div class="collection-card-preview">${richCardVisualMarkup(c,{compact:true})}</div>
        <div class="collection-card-meta">
          <div><small>${esc(c.type).toUpperCase()}</small><h3>${esc(c.name)}</h3><p>${esc((c.elements||[]).join(' + ')||c.element||'Sem elemento')}</p></div>
          <span class="collection-owned-badge">x${owned(c.id)}</span>
        </div>
        <div class="collection-card-actions">
          <span class="collection-card-main-actions"><button type="button" data-collection-fullscreen="${esc(c.id)}">⛶ Ver carta</button><button type="button" data-collection-edit="${esc(c.id)}">✎ Editar</button></span>
          <div class="collection-qty">
            <button type="button" data-col-minus="${esc(c.id)}" aria-label="Remover uma cópia">−</button>
            <b>${owned(c.id)}</b>
            <button type="button" data-col-plus="${esc(c.id)}" aria-label="Adicionar uma cópia">+</button>
          </div>
        </div>
      </article>`).join(''):`<div class="tcg-empty-card" style="grid-column:1/-1"><span>▦</span><h3>Sua coleção está vazia</h3><p>Na Biblioteca, use “+ Coleção” nas cartas que você possui.</p></div>`;

    document.querySelectorAll('[data-col-minus]').forEach(b=>b.onclick=e=>{e.stopPropagation();setOwned(b.dataset.colMinus,owned(b.dataset.colMinus)-1)});
    document.querySelectorAll('[data-col-plus]').forEach(b=>b.onclick=e=>{e.stopPropagation();setOwned(b.dataset.colPlus,owned(b.dataset.colPlus)+1)});
    document.querySelectorAll('[data-collection-fullscreen]').forEach(b=>b.onclick=e=>{e.stopPropagation();openFullscreenCard(cardById(b.dataset.collectionFullscreen))});
    document.querySelectorAll('[data-collection-edit]').forEach(b=>b.onclick=e=>{e.stopPropagation();editCard(b.dataset.collectionEdit)});
    document.querySelectorAll('[data-collection-view]').forEach(cardEl=>{
      const open=()=>openFullscreenCard(cardById(cardEl.dataset.collectionView));
      cardEl.onclick=open;
      cardEl.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open()}};
    });
  }

  function addCardToDeck(cardId){const d=deckById();if(!d){toast('Crie ou selecione um deck primeiro');openSection('decks');return}d.cards[cardId]=Number(d.cards[cardId]||0)+1;save(DECK_KEY,decks);renderDeckBuilder();toast('Carta adicionada ao deck')}
  function renderDecks(){
    $('tcgDeckCount').textContent=decks.length;
    const sel=$('tcgDeckSelect');if(sel){sel.innerHTML='<option value="">Selecione um deck</option>'+decks.map(d=>`<option value="${esc(d.id)}"${d.id===activeDeckId?' selected':''}>${esc(d.name)}</option>`).join('')}
    $('tcgDeckList').innerHTML=decks.length?decks.map(d=>{const total=Object.values(d.cards||{}).reduce((a,b)=>a+Number(b||0),0);return `<article class="tcg-deck-item"><div><h3>${esc(d.name)}</h3><p>${esc(d.description||'Sem descrição.')} • ${total} cartas</p></div><div><button type="button" data-open-deck="${esc(d.id)}">Editar</button> <button type="button" data-delete-deck="${esc(d.id)}">Excluir</button></div></article>`}).join(''):`<div class="tcg-empty-card"><span>🧩</span><h3>Nenhum deck criado</h3><p>Crie um deck para começar a adicionar cartas.</p></div>`;
    document.querySelectorAll('[data-open-deck]').forEach(b=>b.onclick=()=>{activeDeckId=b.dataset.openDeck;renderDecks();renderDeckBuilder()});
    document.querySelectorAll('[data-delete-deck]').forEach(btn=>btn.onclick=()=>{decks=decks.filter(d=>d.id!==btn.dataset.deleteDeck);if(activeDeckId===btn.dataset.deleteDeck)activeDeckId=decks[0]?.id||'';save(DECK_KEY,decks);renderDecks();renderDeckBuilder()});
  }
  function renderDeckBuilder(){
    const d=deckById(),box=$('tcgDeckCards'),pool=$('tcgDeckPool'),sum=$('tcgDeckSummary');if(!box||!pool||!sum)return;
    if(!d){sum.innerHTML='<span>Nenhum deck selecionado</span>';box.innerHTML='';pool.innerHTML='<p>Crie ou selecione um deck.</p>';return}
    const entries=Object.entries(d.cards||{}).filter(([id,q])=>cardById(id)&&q>0),total=entries.reduce((a,[,q])=>a+Number(q),0);
    sum.innerHTML=`<span>${esc(d.name)}</span><span>${total} cartas</span><span>${entries.length} cartas únicas</span>`;
    box.innerHTML=entries.length?entries.map(([id,q])=>{const c=cardById(id);return `<div class="deck-card-row"><div><b>${esc(c.name)}</b><small>${esc(c.type)} • ${esc(c.element||'Sem elemento')}</small></div><div class="deck-card-actions"><button data-deck-minus="${esc(id)}">−</button><b>${q}</b><button data-deck-plus="${esc(id)}">+</button></div></div>`}).join(''):'<p>Este deck ainda não possui cartas.</p>';
    const q=String($('tcgDeckCardSearch')?.value||'').toLowerCase();const available=cards.filter(c=>`${c.name} ${c.type} ${c.element||''}`.toLowerCase().includes(q));
    pool.innerHTML=available.length?available.map(c=>`<div class="deck-card-row"><div><b>${esc(c.name)}</b><small>${esc(c.type)} • coleção: ${owned(c.id)}</small></div><button data-pool-add="${esc(c.id)}">+</button></div>`).join(''):'<p>Nenhuma carta encontrada.</p>';
    document.querySelectorAll('[data-deck-minus]').forEach(b=>b.onclick=()=>{d.cards[b.dataset.deckMinus]=Math.max(0,Number(d.cards[b.dataset.deckMinus]||0)-1);if(!d.cards[b.dataset.deckMinus])delete d.cards[b.dataset.deckMinus];save(DECK_KEY,decks);renderDeckBuilder();renderDecks()});
    document.querySelectorAll('[data-deck-plus]').forEach(b=>b.onclick=()=>{d.cards[b.dataset.deckPlus]=Number(d.cards[b.dataset.deckPlus]||0)+1;save(DECK_KEY,decks);renderDeckBuilder();renderDecks()});
    document.querySelectorAll('[data-pool-add]').forEach(b=>b.onclick=()=>addCardToDeck(b.dataset.poolAdd));
  }

  function supportPreviewCard(){
    const type=value('supportCardType')||'movimento';
    const base={
      id:'support-live-preview',
      type,
      name:value('supportName')||({movimento:'Novo Movimento',item:'Novo Item',treinador:'Novo Treinador',terreno:'Novo Terreno'}[type]||'Carta'),
      element:value('supportElement'),
      description:value('supportDescription')||'Descreva o efeito desta carta.'
    };
    if(type==='movimento')Object.assign(base,{class:value('moveClass'),cost:{net:num('moveEpNet'),element:num('moveEpElement')},precision:num('movePrecision'),power:num('movePower'),torpor:!!$('moveTorpor')?.checked,target:value('moveTarget'),kind:value('moveKind')});
    if(type==='item')Object.assign(base,{use:value('itemUse'),costEp:num('itemEp'),target:value('itemTarget'),effect:{type:value('itemEffect'),value:num('itemEffectValue')}});
    if(type==='treinador')Object.assign(base,{duration:value('trainerDuration'),costEp:num('trainerEp'),target:value('trainerTarget'),effect:{type:value('trainerEffect'),value:num('trainerEffectValue')}});
    if(type==='terreno')Object.assign(base,{generation:{net:0,element:1},target:value('terrainTarget'),terrainEffect:{trigger:value('terrainTrigger'),type:value('terrainEffect'),value:num('terrainEffectValue')}});
    return base;
  }
  function updateSupportPreview(){
    const host=$('supportCardLivePreview');if(host)host.innerHTML=richCardVisualMarkup(supportPreviewCard(),{compact:true});
  }

  function setSupportType(type){
    if($('supportCardType'))$('supportCardType').value=type;
    document.querySelectorAll('[data-support-type]').forEach(b=>b.classList.toggle('active',b.dataset.supportType===type));
    const map={movimento:'supportMovementFields',item:'supportItemFields',treinador:'supportTrainerFields',terreno:'supportTerrainFields'};
    Object.values(map).forEach(id=>$(id)?.classList.remove('active'));
    $(map[type])?.classList.add('active');

    if(type==='movimento')refreshMovementRelianLinks();
    updateSupportPreview();
  }
  function clearSupportCreator(){
    const previousType=value('supportCardType')||'movimento';
    $('supportCardForm')?.reset();
    ['moveEpNet','moveEpElement','movePower','itemEp','trainerEp','itemEffectValue','trainerEffectValue','terrainEffectValue'].forEach(id=>{if($(id))$(id).value=0});
    if($('movePrecision'))$('movePrecision').value=100;if($('moveTorpor'))$('moveTorpor').checked=true;
    setEditingState(null);
    setSupportType(previousType);
  }
  function saveSupportCard(event){
    event.preventDefault();
    const type=value('supportCardType'),name=value('supportName');if(!name){$('supportName')?.focus();return}
    const existing=editingCardId?cardById(editingCardId):null;
    const base={
      id:existing?.id||(crypto.randomUUID?.()||String(Date.now())),
      type,
      name,
      element:value('supportElement'),
      description:value('supportDescription'),
      createdAt:existing?.createdAt||new Date().toISOString(),
      updatedAt:new Date().toISOString(),
      userModified:existing?.id?.startsWith('official-')?true:(existing?.userModified||false)
    };
    if(type==='movimento')Object.assign(base,{class:value('moveClass'),cost:{net:num('moveEpNet'),element:num('moveEpElement')},precision:num('movePrecision'),power:num('movePower'),torpor:!!$('moveTorpor')?.checked,linkedRelianIds:selectedMovementRelianIds(),target:value('moveTarget'),kind:value('moveKind')});
    if(type==='item')Object.assign(base,{use:value('itemUse'),costEp:num('itemEp'),target:value('itemTarget'),effect:{type:value('itemEffect'),value:num('itemEffectValue')}});
    if(type==='treinador')Object.assign(base,{duration:value('trainerDuration'),costEp:num('trainerEp'),target:value('trainerTarget'),effect:{type:value('trainerEffect'),value:num('trainerEffectValue')}});
    if(type==='terreno')Object.assign(base,{generation:{net:0,element:1},target:value('terrainTarget'),terrainEffect:{trigger:value('terrainTrigger'),type:value('terrainEffect'),value:num('terrainEffectValue')}});

    if(existing){
      const idx=cards.findIndex(c=>c.id===existing.id);
      if(idx>=0)cards[idx]=base;
      toast('Carta atualizada');
    }else{
      cards.push(base);
      toast('Carta criada');
    }

    save(CARD_KEY,cards);
    setEditingState(null);
    renderCards();renderCollection();renderDeckBuilder();
    clearSupportCreator();
  }


  /* =======================================================
     ETAPA 5/5 — Biblioteca detalhada + motor de batalha
     ======================================================= */
  let selectedLibraryCardId='';
  const BATTLE_PLAYER_MAX_HP=30;
  let battle=null;
  let battleSelected=null;
  let battleHandMenuIndex=null;
  let battleAttackSourceUid=null;
  let battlePendingMovement=null;
  let battleActiveView='actions';

  function relianAtk(card){
    const s=card?.stats||{};
    return Number(s.atk ?? Math.max(Number(s.atk||0),Number(s.spAtk||0)) ?? 0);
  }
  function relianDef(card){
    const s=card?.stats||{};
    return Number(s.def ?? Math.max(Number(s.def||0),Number(s.spDef||0)) ?? 0);
  }

  function cardElements(card){
    return (Array.isArray(card?.elements)?card.elements:String(card?.element||'').split(/\s*\+\s*/)).map(x=>String(x).trim()).filter(Boolean);
  }
  function cardCost(card){
    if(card?.type==='relian')return {net:Number(card.ep?.net||0),element:Number(card.ep?.element||0)};
    if(card?.type==='movimento')return {net:Number(card.cost?.net||0),element:Number(card.cost?.element||0)};
    if(card?.type==='item'||card?.type==='treinador')return {net:Number(card.costEp||0),element:0};
    return {net:0,element:0};
  }

  function movementLinkedIds(card){
    return Array.isArray(card?.linkedRelianIds)?card.linkedRelianIds.map(String):[];
  }
  function movementCanBeUsedBy(card,unit){
    if(!card||card.type!=='movimento'||!unit?.card)return false;
    const ids=movementLinkedIds(card);
    return !ids.length||ids.includes(String(unit.card.id));
  }
  function movementCardsForUnit(unit){
    if(!battle||!unit)return [];
    return battle.player.hand.map((card,index)=>({card,index}))
      .filter(x=>x.card.type==='movimento'&&movementCanBeUsedBy(x.card,unit));
  }
  function usableUnitsForMovement(card){
    if(!battle||!card)return [];
    return battle.player.field.filter(u=>u&&!u.torpor&&movementCanBeUsedBy(card,u));
  }
  function cardInspectorMarkup(card,state=null){
    if(!card)return `<div class="library-preview-empty"><span>🃏</span><b>Nenhuma carta selecionada</b><small>Selecione uma carta para visualizar seus dados.</small></div>`;
    const elements=cardElements(card),a=elementColor(elements[0]||''),b=elementColor(elements[1]||elements[0]||'');
    const c=cardCost(card),stats=card.stats||{};
    const info=[];
    info.push(['Tipo',card.type||'—']);
    if(card.class)info.push(['Classe',card.class]);
    if(card.type==='relian')info.push(['HP',state?.currentHp!=null?`${state.currentHp} / ${card.hp||0}`:card.hp||0]);
    if(card.type==='relian'){
      const from=evolutionName(evolutionFromId(card));
      const to=evolutionToIds(card).map(evolutionName).filter(Boolean);
      if(from)info.push(['Evolui de',from]);
      if(to.length)info.push(['Evolui para',to.join(', ')]);
    }
    if(c.net||c.element)info.push(['Custo EP',`${c.net} / ${c.element}`]);
    if(card.type==='movimento'&&card.power!=null)info.push(['Poder',card.power]);
    if(card.type==='movimento'&&card.precision!=null)info.push(['Precisão',`${card.precision}%`]);
    if(card.type==='movimento'){const linked=linkedRelianNames(card);info.push(['Vínculo',linked.length?linked.join(', '):'Genérico — qualquer Relian']);}
    if(card.type==='terreno'){info.push(['Geração','1 EP por turno']);info.push(['Efeito',terrainEffectLabel(card)]);}
    if(card.type==='item'&&card.use)info.push(['Uso',card.use]);
    if(card.type==='treinador'&&card.duration)info.push(['Duração',card.duration]);
    if(state?.torpor)info.push(['Estado','Torpor']);
    const statGrid=card.type==='relian'?`
      <div class="library-inspector-grid combat-pair-grid">
        <div><small>ATK / DEF</small><b>${relianAtk(card)} / ${relianDef(card)}</b></div>
      </div>`:'';
    return `<article class="library-inspector-card" style="--inspect-a:${a};--inspect-b:${b}">
      <div class="library-inspector-art">${card.imageData?`<img src="${card.imageData}" alt="">`:`<span>${card.type==='relian'?'🐾':card.type==='movimento'?'⚔️':card.type==='item'?'🧪':card.type==='treinador'?'✦':'🌳'}</span>`}</div>
      <div class="library-inspector-head"><div><h3>${esc(card.name)}</h3><small>${esc(card.relianType||card.type||'Carta')}</small></div><div class="library-inspector-elements">${elements.map(x=>`<i title="${esc(x)}" style="background:${elementColor(x)}"></i>`).join('')}</div></div>
      <div class="library-inspector-grid">${info.map(([k,v])=>`<div><small>${esc(k)}</small><b>${esc(v)}</b></div>`).join('')}</div>
      ${statGrid}
      ${card.ability?.name?`<div class="library-inspector-description"><b>${esc(card.ability.name)} • ${Number(card.ability.cost||0)} EP</b><br>${esc(card.description||'')}</div>`:`<div class="library-inspector-description">${esc(card.description||'Sem descrição.')}</div>`}
      ${card.markers?`<div class="tcg-card-ruleline">${card.markers.flying?'<span>[Voar]</span>':''}${card.markers.range?'<span>[Alcance]</span>':''}${card.markers.translucent?'<span>[Translúcido]</span>':''}</div>`:''}
    </article>`;
  }

  function richCardVisualMarkup(card,{compact=false}={}){
    if(!card)return '';
    const elements=cardElements(card),a=elementColor(elements[0]||''),b=elementColor(elements[1]||elements[0]||'');
    const cost=cardCost(card),isRelian=card.type==='relian';
    const typeMeta={
      relian:{icon:'🐾',label:card.relianType||'Relian'},
      movimento:{icon:'⚔️',label:card.kind==='controle'?'Movimento de Controle':card.kind==='suporte'?'Movimento de Suporte':'Movimento'},
      item:{icon:'🧪',label:card.use==='equipamento'?'Equipamento':'Item'},
      treinador:{icon:'✦',label:card.duration==='permanente'?'Treinador Permanente':'Treinador'},
      terreno:{icon:'🌳',label:'Terreno'}
    }[card.type]||{icon:'✦',label:'Carta'};

    let special='';
    if(card.type==='movimento')special=`<div class="rbc-special-rule movement-rule"><span>🎯 ${esc(card.target||'inimigo')}</span><b>Poder ${Number(card.power||0)}</b><span>${Number(card.precision??100)}% PREC</span></div>`;
    if(card.type==='item')special=`<div class="rbc-special-rule item-rule"><span>${esc(card.use||'uso')}</span><b>${esc(card.effect?.type&&card.effect.type!=='nenhum'?`${card.effect.type} ${Number(card.effect.value||0)}`:'Efeito descrito')}</b><span>${esc(card.target||'alvo')}</span></div>`;
    if(card.type==='treinador')special=`<div class="rbc-special-rule trainer-rule"><span>${esc(card.duration||'único')}</span><b>${esc(card.effect?.type&&card.effect.type!=='nenhum'?`${card.effect.type} ${Number(card.effect.value||0)}`:'Ordem estratégica')}</b><span>${esc(card.target||'alvo')}</span></div>`;
    if(card.type==='terreno')special=`<div class="rbc-special-rule terrain-rule"><span>+1 EP/turno</span><b>${esc(terrainEffectLabel(card))}</b><span>${esc(card.target||'campo')}</span></div>`;

    const markers=[];
    if(card.markers?.flying)markers.push('[Voar]');
    if(card.markers?.range)markers.push('[Alcance]');
    if(card.markers?.translucent)markers.push('[Translúcido]');

    return `<div class="rbc-visual-card rbc-type-${esc(card.type)}${elements.length>1?' dual':''}" style="--rbc-a:${a};--rbc-b:${b}">
      <div class="rbc-card-top">
        <span class="rbc-card-hp">${isRelian?Number(card.hp||0):typeMeta.icon}</span>
        <span class="rbc-card-name">${esc(card.name)}</span>
        <span class="rbc-card-elements">${elements.slice(0,2).map(x=>`<i title="${esc(x)}" style="background:${elementColor(x)}"></i>`).join('')}</span>
      </div>
      <div class="rbc-card-art">
        ${card.imageData?`<img src="${card.imageData}" alt="${esc(card.name)}">`:`<div class="rbc-card-art-placeholder"><span class="support-art-icon">${typeMeta.icon}</span><b>${esc(card.name)}</b><span>${card.type==='terreno'?'Cenário / ambiente':card.type==='item'?'Objeto / equipamento':card.type==='treinador'?'Treinador / personagem':card.type==='movimento'?'Arte do golpe':'Sem imagem cadastrada'}</span></div>`}
      </div>
      <div class="rbc-card-type-strip"><span>${esc(typeMeta.label)}</span><i class="rbc-card-emblem">${typeMeta.icon}</i></div>
      <div class="rbc-card-body">
        ${isRelian?`<div class="rbc-card-ability"><b>${esc(card.ability?.name||'Habilidade')}</b><span>${Number(card.ability?.cost||0)} EP</span></div>`:''}
        <div class="rbc-card-markers">${markers.map(x=>`<span>${esc(x)}</span>`).join('')}</div>
        ${special}
        <p class="rbc-card-description">${esc(card.description||'Sem descrição.')}</p>
      </div>
      ${isRelian?`<div class="rbc-card-bottom rbc-card-combat-bottom"><span class="rbc-card-stat rbc-card-combat-stat"><small>ATK / DEF</small><b>${relianAtk(card)} / ${relianDef(card)}</b></span></div>`:''}
      <div class="rbc-card-footerline"><span>${esc(card.class||String(card.type||'').toUpperCase())}</span><span>${cost.net} / ${cost.element} EP</span></div>
    </div>`;
  }

  function fullscreenInfoMarkup(card){
    const elements=cardElements(card);
    const stats=card.stats||{};
    const cost=cardCost(card);
    const rows=[
      ['Tipo',card.type||'—'],
      ['Classe',card.class||'—'],
      ['Elementos',elements.join(' + ')||'Nenhum'],
      ['Custo EP',`${cost.net} / ${cost.element}`]
    ];
    if(card.type==='relian'){
      rows.push(['HP',card.hp||0],['ATK / DEF',`${relianAtk(card)} / ${relianDef(card)}`]);
      const from=evolutionName(evolutionFromId(card));
      const to=evolutionToIds(card).map(evolutionName).filter(Boolean);
      if(from)rows.push(['Evolui de',from]);
      if(to.length)rows.push(['Evolui para',to.join(', ')]);
    }
    if(card.type==='movimento'){
      const linked=linkedRelianNames(card);
      rows.push(['Vínculo',linked.length?linked.join(', '):'Genérico']);
    }
    return `<h3>${esc(card.name)}</h3>
      <div class="tcg-fullscreen-info-grid">${rows.map(([k,v])=>`<div><small>${esc(k)}</small><b>${esc(v)}</b></div>`).join('')}</div>
      ${card.ability?.name?`<div><small>HABILIDADE</small><b>${esc(card.ability.name)}${card.ability.cost!=null?` • ${Number(card.ability.cost||0)} EP`:''}</b></div>`:''}
      <p>${esc(card.description||'Sem descrição cadastrada.')}</p>`;
  }

  function openFullscreenCard(card){
    if(!card)return;
    const dialog=$('tcgFullscreenCardDialog');
    $('tcgFullscreenTitle').textContent=card.name||'Carta';
    $('tcgFullscreenCardHost').innerHTML=richCardVisualMarkup(card);
    $('tcgFullscreenInfo').innerHTML=fullscreenInfoMarkup(card);
    if(dialog?.showModal)dialog.showModal();
  }

  function renderLibraryInspector(){
    const host=$('tcgLibraryPreview');if(!host)return;
    const card=cardById(selectedLibraryCardId);
    host.innerHTML=card?`
      <div class="library-card-visual">${richCardVisualMarkup(card,{compact:true})}</div>
      ${cardInspectorMarkup(card)}
      <div class="library-inspector-actions">
        <button data-inspect-edit="${esc(card.id)}">✎ Editar</button>
        <button data-inspect-fullscreen="${esc(card.id)}">⛶ Ver em tela cheia</button>
        <button data-inspect-collect="${esc(card.id)}">+ Coleção</button>
        <button data-inspect-deck="${esc(card.id)}">+ Deck</button>
      </div>`:cardInspectorMarkup(null);
    host.querySelector('[data-inspect-edit]')?.addEventListener('click',()=>editCard(card.id));
    host.querySelector('[data-inspect-fullscreen]')?.addEventListener('click',()=>openFullscreenCard(card));
    host.querySelector('[data-inspect-collect]')?.addEventListener('click',()=>{setOwned(card.id,owned(card.id)+1);toast('Carta adicionada à coleção')});
    host.querySelector('[data-inspect-deck]')?.addEventListener('click',()=>addCardToDeck(card.id));
  }

  function expandedDeck(deck){
    const out=[];
    for(const [id,qty] of Object.entries(deck?.cards||{})){
      const card=cardById(id);if(!card)continue;
      for(let i=0;i<Number(qty||0);i++)out.push(card);
    }
    return out;
  }
  function shuffled(list){
    const out=[...list];
    for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]]}
    return out;
  }
  function battleLog(message){
    if(!battle)return;
    battle.log.unshift(message);
    battle.log=battle.log.slice(0,60);
  }
  function battleDraw(side,count=1){
    for(let i=0;i<count;i++){
      if(!side.deck.length)break;
      side.hand.push(side.deck.shift());
    }
  }
  function battleOpeningHand(side,count=5){
    if(count<=0)return;
    const terrainIndex=side.deck.findIndex(c=>c?.type==='terreno');
    if(terrainIndex>=0){
      side.hand.push(side.deck.splice(terrainIndex,1)[0]);
    }
    battleDraw(side,Math.max(0,count-side.hand.length));
  }
  function makeBattleUnit(card){
    return {uid:crypto.randomUUID?.()||String(Date.now()+Math.random()),card,currentHp:Number(card.hp||10),torpor:false};
  }
  function battleElementPool(side,element){
    return Number(side.ep.elements[element]||0);
  }
  function battleTotalEp(side){
    return Number(side.ep.net||0)+Object.values(side.ep.elements||{}).reduce((sum,value)=>sum+Number(value||0),0);
  }
  function netSpendableEp(side,requiredElement='',requiredElementCost=0){
    // NET não é um elemento. É um custo genérico que aceita EP de QUALQUER cor.
    // Primeiro reservamos o EP elemental obrigatório da carta e então somamos
    // todo o EP restante que pode pagar a parte NET.
    const elementPools=side.ep.elements||{};
    let total=Number(side.ep.net||0);
    Object.entries(elementPools).forEach(([element,value])=>{
      const pool=Number(value||0);
      total+=element===requiredElement?Math.max(0,pool-requiredElementCost):pool;
    });
    return total;
  }
  function canPay(side,card){
    const cost=cardCost(card),element=cardElements(card)[0]||'';
    // A parte elemental exige a cor correta.
    if(cost.element>0&&battleElementPool(side,element)<cost.element)return false;
    // A parte NET pode ser paga com qualquer EP restante, independente da cor.
    return netSpendableEp(side,element,cost.element)>=cost.net;
  }
  function spendNetCost(side,amount,protectedElement=''){
    let remaining=Math.max(0,Number(amount||0));
    if(!remaining)return;

    // EP sem cor legado/universal é gasto primeiro.
    const generic=Math.min(remaining,Number(side.ep.net||0));
    side.ep.net-=generic;
    remaining-=generic;

    // Depois usamos cores diferentes da cor específica da carta,
    // preservando essa cor sempre que possível para custos elementais futuros.
    const keys=Object.keys(side.ep.elements||{});
    const ordered=[...keys.filter(k=>k!==protectedElement),...keys.filter(k=>k===protectedElement)];
    for(const element of ordered){
      if(!remaining)break;
      const pool=battleElementPool(side,element);
      const used=Math.min(remaining,pool);
      side.ep.elements[element]=pool-used;
      remaining-=used;
    }
  }
  function payCard(side,card){
    const cost=cardCost(card),element=cardElements(card)[0]||'';

    // O custo colorido é pago obrigatoriamente com sua própria cor.
    if(cost.element){
      side.ep.elements[element]=battleElementPool(side,element)-cost.element;
    }

    // O custo NET consome qualquer cor de EP disponível.
    if(cost.net)spendNetCost(side,cost.net,element);
  }
  function terrainEffectLabel(card){
    const fx=card?.terrainEffect||{};
    if(!fx.type||fx.type==='nenhum'||!Number(fx.value||0))return 'Sem efeito automático';
    const names={cura:'Cura',dano:'Dano',atk:'+ATK',def:'+DEF'};
    const triggers={ativacao:'ao ativar',turno:'a cada turno',ambos:'ao ativar e a cada turno',nenhum:'manual'};
    return `${names[fx.type]||fx.type} ${Number(fx.value||0)} • ${triggers[fx.trigger]||fx.trigger}`;
  }
  function applyTerrainEffect(ownerSide,opponentSide,card,reason='turno',ownerLabel='Você'){
    const fx=card?.terrainEffect||{};
    const trigger=fx.trigger||'nenhum',type=fx.type||'nenhum',amount=Math.max(0,Number(fx.value||0));
    if(type==='nenhum'||!amount)return;
    if(reason==='ativacao'&&!['ativacao','ambos'].includes(trigger))return;
    if(reason==='turno'&&!['turno','ambos'].includes(trigger))return;

    const target=card.target||'aliados';
    const ownerUnits=ownerSide.field.filter(Boolean),opponentUnits=opponentSide.field.filter(Boolean);
    const units=target==='aliados'?ownerUnits:target==='inimigos'?opponentUnits:target==='todos'?[...ownerUnits,...opponentUnits]:[];

    if(type==='cura'){
      if(target==='jogador')ownerSide.hp=Math.min(BATTLE_PLAYER_MAX_HP,ownerSide.hp+amount);
      else if(target==='oponente')opponentSide.hp=Math.min(BATTLE_PLAYER_MAX_HP,opponentSide.hp+amount);
      else units.forEach(u=>u.currentHp=Math.min(Number(u.card.hp||u.currentHp),u.currentHp+amount));
    }else if(type==='dano'){
      if(target==='jogador')ownerSide.hp-=amount;
      else if(target==='oponente')opponentSide.hp-=amount;
      else {
        units.forEach(u=>u.currentHp-=amount);
        removeDefeated(ownerSide);removeDefeated(opponentSide);
      }
    }else if(type==='atk'||type==='def'){
      units.forEach(u=>{
        u.terrainBuffs=u.terrainBuffs||{atk:0,def:0};
        u.terrainBuffs[type]+=amount;
      });
    }
    battleLog(`${card.name} ativou ${terrainEffectLabel(card)}.`);
    checkBattleEnd();
  }
  function clearTerrainBuffs(side){
    side.field.filter(Boolean).forEach(u=>{if(u.terrainBuffs)u.terrainBuffs={atk:0,def:0}});
  }

  function addTerrainEp(side){
    const t=side.terrain;
    if(!t)return;
    const element=cardElements(t)[0]||'';
    if(element&&element!=='NET'){
      side.ep.elements[element]=battleElementPool(side,element)+1;
      battleLog(`${t.name} gerou +1 EP ${element}.`);
    }else{
      side.ep.net+=1;
      battleLog(`${t.name} gerou +1 EP NET.`);
    }
  }
  function startSideTurn(side){
    side.field.filter(Boolean).forEach(u=>u.torpor=false);
    clearTerrainBuffs(side);
    battleDraw(side,1);
    addTerrainEp(side);
    const opponent=side===battle.player?battle.enemy:battle.player;
    const label=side===battle.player?'Você':'Oponente';
    if(side.terrain)applyTerrainEffect(side,opponent,side.terrain,'turno',label);
  }
  function firstUnit(side){return side.field.find(Boolean)||null}
  function removeDefeated(side){
    side.field=side.field.map(u=>{
      if(u&&u.currentHp<=0){battleLog(`${u.card.name} foi derrotado.`);return null}
      return u;
    });
  }
  function unitDamage(attacker,target){
    const atk=Math.max(relianAtk(attacker.card)+Number(attacker.terrainBuffs?.atk||0),1);
    const def=Math.max(relianDef(target.card)+Number(target.terrainBuffs?.def||0),0);
    return Math.max(1,Math.round(atk-Math.floor(def/2)));
  }
  function directDamage(attacker){
    return Math.max(1,relianAtk(attacker.card));
  }
  function checkBattleEnd(){
    if(!battle)return false;
    if(battle.player.hp<=0){
      battle.player.hp=0;battle.phase='finished';battle.winner='enemy';battleLog('Você foi derrotado. O oponente venceu a batalha.');return true;
    }
    if(battle.enemy.hp<=0){
      battle.enemy.hp=0;battle.phase='finished';battle.winner='player';battleLog('O HP do oponente chegou a 0. Você venceu a batalha!');return true;
    }
    return false;
  }
  function evolutionOptionsForUnit(side,unit){
    if(!battle||!side||!unit)return [];
    return side.hand.map((card,index)=>({card,index}))
      .filter(x=>x.card.type==='relian'&&canEvolveCard(unit.card,x.card)&&canPay(side,x.card));
  }

  function validEvolutionBasesForCard(side,evolutionCard){
    if(!battle||!side||!evolutionCard||evolutionCard.type!=='relian')return [];
    return side.field.filter(Boolean).filter(unit=>canEvolveCard(unit.card,evolutionCard));
  }

  function isEvolutionCard(card){
    return card?.type==='relian'&&!!evolutionFromId(card);
  }

  function playEvolutionFromHand(handIndex){
    if(!battle||battle.phase!=='player')return false;
    const evo=battle.player.hand[handIndex];
    if(!isEvolutionCard(evo))return false;

    const bases=validEvolutionBasesForCard(battle.player,evo);
    if(!bases.length){
      toast(`${evo.name} precisa substituir sua forma anterior em campo.`);
      battleActiveView='relians';
      renderBattle();
      return true;
    }

    // Se o usuário selecionou uma forma-base compatível, ESSA cópia é substituída.
    const selectedUid=battleSelected?.state?.uid;
    const selectedBase=selectedUid?bases.find(u=>u.uid===selectedUid):null;
    if(selectedBase){
      playerEvolve(selectedBase.uid,handIndex);
      return true;
    }

    // Com apenas uma base compatível, não há ambiguidade.
    if(bases.length===1){
      playerEvolve(bases[0].uid,handIndex);
      return true;
    }

    // Com duas ou mais cópias da forma-base, exige seleção explícita.
    toast(`Selecione qual ${evolutionName(evolutionFromId(evo))||'Relian'} em campo será substituído por ${evo.name}.`);
    battleSelected={card:evo,state:null};
    battleActiveView='relians';
    renderBattle();
    return true;
  }

  function evolveBattleUnit(side,unitUid,handIndex,label='Você'){
    if(!battle)return false;

    // UID identifica exatamente a cópia selecionada no campo.
    const slot=side.field.findIndex(unit=>unit?.uid===unitUid);
    if(slot<0)return false;

    const base=side.field[slot];
    const evo=side.hand[handIndex];
    if(!base||!evo||evo.type!=='relian'||!canEvolveCard(base.card,evo))return false;
    if(!canPay(side,evo))return false;

    const baseName=base.card.name;
    const oldUid=base.uid;

    payCard(side,evo);
    side.hand.splice(handIndex,1);

    // A evolução ocupa EXATAMENTE o mesmo slot da forma anterior.
    // Não procura slot vazio e não adiciona uma quarta unidade ao campo.
    const evolved=makeBattleUnit(evo);
    evolved.torpor=true;
    evolved.evolvedFrom={cardId:base.card.id,name:baseName,uid:oldUid};
    side.field[slot]=evolved;

    battleLog(`${label==='Oponente'?'Oponente: ':''}${baseName} do espaço ${slot+1} foi substituído por ${evo.name}. ${evo.name} entrou com HP máximo e Torpor.`);

    if(side===battle.player){
      battleSelected={card:evo,state:evolved};
      battleAttackSourceUid=null;
      battlePendingMovement=null;
    }
    return true;
  }

  function playerEvolve(unitUid,handIndex){
    if(!battle||battle.phase!=='player')return;
    if(!evolveBattleUnit(battle.player,unitUid,handIndex,'Você')){
      toast('Esta evolução não pode ser realizada agora.');
      return;
    }
    renderBattle();
  }

  function playerAttack(uid){
    if(!battle||battle.phase!=='player')return;
    const unit=battle.player.field.find(u=>u?.uid===uid);
    if(!unit||unit.torpor)return;

    const enemies=battle.enemy.field.filter(Boolean);
    if(!enemies.length){
      const dmg=directDamage(unit);
      battle.enemy.hp-=dmg;
      unit.torpor=true;
      battleAttackSourceUid=null;
      battleLog(`${unit.card.name} atacou diretamente o oponente e causou ${dmg} de dano.`);
      checkBattleEnd();
      battleSelected={card:unit.card,state:unit};
      renderBattle();
      return;
    }

    battlePendingMovement=null;
    battleAttackSourceUid=battleAttackSourceUid===uid?null:uid;
    battleSelected={card:unit.card,state:unit};
    battleActiveView='actions';
    battleLog(battleAttackSourceUid?`${unit.card.name} está pronto para atacar. Escolha qual Relian adversário será o alvo.`:'Seleção de ataque cancelada.');
    renderBattle();
  }
  function resolvePlayerAttack(targetUid){
    if(!battle||battle.phase!=='player'||!battleAttackSourceUid)return;
    const attacker=battle.player.field.find(u=>u?.uid===battleAttackSourceUid);
    const target=battle.enemy.field.find(u=>u?.uid===targetUid);
    if(!attacker||!target||attacker.torpor){battleAttackSourceUid=null;renderBattle();return}
    const dmg=unitDamage(attacker,target);
    target.currentHp-=dmg;
    attacker.torpor=true;
    battleLog(`${attacker.card.name} atacou ${target.card.name} e causou ${dmg} de dano. ${attacker.card.name} recebeu Torpor.`);
    battleAttackSourceUid=null;
    removeDefeated(battle.enemy);
    battleSelected={card:attacker.card,state:attacker};
    renderBattle();
  }
  function beginMovementFromHand(index,sourceUid=null){
    if(!battle||battle.phase!=='player')return;
    const card=battle.player.hand[index];
    if(!card||card.type!=='movimento')return;

    const eligible=usableUnitsForMovement(card);
    if(!eligible.length){
      const linked=linkedRelianNames(card);
      toast(linked.length?`Você precisa de ${linked.join(' ou ')} em campo e sem Torpor.`:'Você precisa de um Relian em campo e sem Torpor.');
      battleActiveView='actions';
      renderBattle();
      return;
    }

    let source=sourceUid?eligible.find(u=>u.uid===sourceUid):null;
    if(!source&&battleSelected?.state?.uid)source=eligible.find(u=>u.uid===battleSelected.state.uid);
    if(!source&&eligible.length===1)source=eligible[0];

    if(!source){
      battleActiveView='actions';
      battlePendingMovement={handIndex:index,sourceUid:null,choosingSource:true};
      battleAttackSourceUid=null;
      battleLog(`${card.name}: escolha qual Relian compatível irá usar este Movimento.`);
      renderBattle();
      return;
    }

    if(!canPay(battle.player,card)){
      toast('EP insuficiente para este Movimento.');
      return;
    }

    const enemies=battle.enemy.field.filter(Boolean);
    battlePendingMovement={handIndex:index,sourceUid:source.uid,choosingSource:false};
    battleAttackSourceUid=null;
    battleSelected={card:source.card,state:source};
    battleActiveView='actions';

    if(!enemies.length){
      resolveMovementDirect();
      return;
    }

    battleLog(`${source.card.name} vai usar ${card.name}. Escolha qual Relian rival será o alvo.`);
    renderBattle();
  }

  function chooseMovementSource(uid){
    if(!battlePendingMovement?.choosingSource)return;
    const index=battlePendingMovement.handIndex;
    const card=battle.player.hand[index];
    const unit=battle.player.field.find(u=>u?.uid===uid);
    if(!card||!unit||unit.torpor||!movementCanBeUsedBy(card,unit))return;
    battlePendingMovement=null;
    beginMovementFromHand(index,uid);
  }

  function resolveMovementDirect(){
    if(!battle||!battlePendingMovement)return;
    const {handIndex,sourceUid}=battlePendingMovement;
    const card=battle.player.hand[handIndex];
    const source=battle.player.field.find(u=>u?.uid===sourceUid);
    if(!card||!source||source.torpor||!movementCanBeUsedBy(card,source)){
      battlePendingMovement=null;renderBattle();return;
    }
    if(!canPay(battle.player,card)){toast('EP insuficiente.');battlePendingMovement=null;renderBattle();return}
    payCard(battle.player,card);
    const dmg=Math.max(0,Number(card.power||0));
    battle.enemy.hp-=dmg;
    if(card.torpor)source.torpor=true;
    battle.player.hand.splice(handIndex,1);
    battleLog(`${source.card.name} usou ${card.name} diretamente e causou ${dmg} de dano ao oponente${card.torpor?' recebendo Torpor':''}.`);
    battlePendingMovement=null;
    battleSelected={card:source.card,state:source};
    checkBattleEnd();
    renderBattle();
  }

  function resolveMovementTarget(targetUid){
    if(!battle||!battlePendingMovement||battlePendingMovement.choosingSource)return;
    const {handIndex,sourceUid}=battlePendingMovement;
    const card=battle.player.hand[handIndex];
    const source=battle.player.field.find(u=>u?.uid===sourceUid);
    const target=battle.enemy.field.find(u=>u?.uid===targetUid);
    if(!card||!source||!target||source.torpor||!movementCanBeUsedBy(card,source)){
      battlePendingMovement=null;renderBattle();return;
    }
    if(!canPay(battle.player,card)){toast('EP insuficiente.');battlePendingMovement=null;renderBattle();return}

    payCard(battle.player,card);
    const dmg=Math.max(0,Number(card.power||0));
    target.currentHp-=dmg;
    if(card.torpor)source.torpor=true;
    battle.player.hand.splice(handIndex,1);
    battleLog(`${source.card.name} usou ${card.name} em ${target.card.name} e causou ${dmg} de dano${card.torpor?' recebendo Torpor':''}.`);
    battlePendingMovement=null;
    removeDefeated(battle.enemy);
    battleSelected={card:source.card,state:source};
    renderBattle();
  }

  function playFromHand(index){
    if(!battle||battle.phase!=='player')return;
    const card=battle.player.hand[index];if(!card)return;
    if(!canPay(battle.player,card)){toast('EP insuficiente');return}
    if(card.type==='relian'){
      if(isEvolutionCard(card)){
        playEvolutionFromHand(index);
        return;
      }
      const slot=battle.player.field.findIndex(x=>!x);
      if(slot<0){toast('Campo de Relians cheio');return}
      payCard(battle.player,card);battle.player.field[slot]=makeBattleUnit(card);
      battle.player.hand.splice(index,1);battleLog(`${card.name} entrou em campo.`);
    }else if(card.type==='terreno'){
      payCard(battle.player,card);
      const oldTerrain=battle.player.terrain;
      battle.player.terrain=card;
      battle.player.hand.splice(index,1);
      clearTerrainBuffs(battle.player);
      battleLog(`${oldTerrain?`Terreno ${oldTerrain.name} foi substituído por`:'Terreno'} ${card.name}.`);
      applyTerrainEffect(battle.player,battle.enemy,card,'ativacao','Você');
    }else if(card.type==='movimento'){
      beginMovementFromHand(index);
      return;
    }else{
      payCard(battle.player,card);battle.player.hand.splice(index,1);
      battleLog(`${card.name} foi usado. Aplique o efeito descrito na carta: ${card.description||'sem texto adicional.'}`);
    }
    battleSelected={card,state:null};renderBattle();
  }
  function enemyMovementCandidates(){
    const out=[];
    if(!battle)return out;
    battle.enemy.hand.forEach((card,index)=>{
      if(card.type!=='movimento'||!canPay(battle.enemy,card))return;
      const ids=movementLinkedIds(card);
      battle.enemy.field.filter(Boolean).forEach(unit=>{
        if(!unit.torpor&&(!ids.length||ids.includes(String(unit.card.id))))out.push({card,index,unit});
      });
    });
    return out;
  }
  function enemyUseMovement(){
    const options=enemyMovementCandidates().sort((a,b)=>Number(b.card.power||0)-Number(a.card.power||0));
    if(!options.length)return false;
    const pick=options[0],targets=battle.player.field.filter(Boolean),power=Math.max(0,Number(pick.card.power||0));
    payCard(battle.enemy,pick.card);
    if(targets.length){
      const sorted=[...targets].sort((a,b)=>a.currentHp-b.currentHp);
      const target=sorted.find(u=>u.currentHp<=power)||sorted[0];
      target.currentHp-=power;
      battleLog(`${pick.unit.card.name} do oponente usou ${pick.card.name} em ${target.card.name} e causou ${power} de dano.`);
      removeDefeated(battle.player);
    }else{
      battle.player.hp-=power;
      battleLog(`${pick.unit.card.name} do oponente usou ${pick.card.name} diretamente e causou ${power} de dano.`);
      checkBattleEnd();
    }
    if(pick.card.torpor)pick.unit.torpor=true;
    battle.enemy.hand.splice(pick.index,1);
    return true;
  }
  function enemyTurn(){
    if(!battle||battle.phase==='finished')return;
    battle.phase='enemy';battle.turn++;battleAttackSourceUid=null;battlePendingMovement=null;
    startSideTurn(battle.enemy);
    const terrainIndex=battle.enemy.hand.findIndex(c=>c.type==='terreno'&&canPay(battle.enemy,c));
    if(terrainIndex>=0&&!battle.enemy.terrain){
      const terrain=battle.enemy.hand[terrainIndex];payCard(battle.enemy,terrain);
      battle.enemy.terrain=terrain;battle.enemy.hand.splice(terrainIndex,1);
      clearTerrainBuffs(battle.enemy);
      battleLog(`Oponente ativou o Terreno ${terrain.name}.`);
      applyTerrainEffect(battle.enemy,battle.player,terrain,'ativacao','Oponente');
    }
    let guard=3;
    while(guard-->0){
      const slot=battle.enemy.field.findIndex(x=>!x);
      const idx=battle.enemy.hand.findIndex(c=>c.type==='relian'&&!isEvolutionCard(c)&&canPay(battle.enemy,c));
      if(slot<0||idx<0)break;
      const c=battle.enemy.hand[idx];payCard(battle.enemy,c);
      battle.enemy.field[slot]=makeBattleUnit(c);battle.enemy.hand.splice(idx,1);
      battleLog(`Oponente colocou ${c.name} em campo.`);
    }
    // Evolução: tenta evoluir a primeira linha válida antes de usar Movimentos.
    if(battle.phase!=='finished'){
      let evolved=false;
      for(const unit of battle.enemy.field.filter(Boolean)){
        const options=evolutionOptionsForUnit(battle.enemy,unit)
          .sort((a,b)=>(Number(b.card.hp||0)+relianAtk(b.card)+relianDef(b.card))-(Number(a.card.hp||0)+relianAtk(a.card)+relianDef(a.card)));
        if(options.length){
          evolved=evolveBattleUnit(battle.enemy,unit.uid,options[0].index,'Oponente');
          if(evolved)break;
        }
      }
    }
    if(battle.phase!=='finished')enemyUseMovement();
    for(const unit of battle.enemy.field){
      if(!unit||unit.torpor||battle.phase==='finished')continue;
      const targets=battle.player.field.filter(Boolean);
      if(targets.length){
        const target=[...targets].sort((a,b)=>a.currentHp-b.currentHp)[0];
        const dmg=unitDamage(unit,target);target.currentHp-=dmg;unit.torpor=true;
        battleLog(`${unit.card.name} do oponente atacou ${target.card.name} e causou ${dmg} de dano.`);
        removeDefeated(battle.player);
      }else{
        const dmg=directDamage(unit);battle.player.hp-=dmg;unit.torpor=true;
        battleLog(`${unit.card.name} atacou você diretamente e causou ${dmg} de dano.`);
        if(checkBattleEnd())break;
      }
    }
    if(battle.phase!=='finished'){battle.phase='player';startSideTurn(battle.player);battleLog(`Seu turno ${battle.turn}.`);}
    renderBattle();
  }
  function startBattle(){
    const deckId=$('battleDeckSelect')?.value||activeDeckId;
    const opponentDeckId=$('battleOpponentDeckSelect')?.value||deckId;
    const deck=decks.find(d=>d.id===deckId);
    const opponentDeck=decks.find(d=>d.id===opponentDeckId);

    let playerCards=expandedDeck(deck);
    let opponentCards=expandedDeck(opponentDeck);

    if(!playerCards.length)playerCards=[...cards];
    if(!opponentCards.length)opponentCards=[...playerCards];
    if(!playerCards.length){toast('Crie cartas antes de iniciar');return}
    if(!playerCards.some(c=>c.type==='relian')){toast('Seu deck precisa de pelo menos 1 Relian.');return}
    if(!playerCards.some(c=>c.type==='terreno')){toast('Seu deck precisa de pelo menos 1 Terreno para gerar EP.');return}
    if(!opponentCards.some(c=>c.type==='relian')||!opponentCards.some(c=>c.type==='terreno')){
      toast('O deck do oponente precisa possuir Relian e Terreno.');return
    }

    const makeSide=(list)=>({hp:BATTLE_PLAYER_MAX_HP,deck:shuffled(list),hand:[],field:[null,null,null],terrain:null,ep:{net:4,elements:Object.fromEntries(Object.keys(ELEMENTS).filter(Boolean).map(e=>[e,2]))}});
    battle={
      turn:1,
      phase:'player',
      playerDeckId:deckId,
      enemyDeckId:opponentDeckId,
      player:makeSide(playerCards),
      enemy:makeSide(opponentCards),
      log:[]
    };
    battleOpeningHand(battle.player,5);battleOpeningHand(battle.enemy,5);
    battleLog(`Batalha iniciada: ${deck?.name||'Seu deck'} vs ${opponentDeck?.name||deck?.name||'Deck do oponente'}.`);
    if(battle.player.hand.some(c=>c.type==='terreno'))battleLog('Sua mão inicial recebeu 1 Terreno garantido.');
    if(battle.enemy.hand.some(c=>c.type==='terreno'))battleLog('A mão inicial do oponente recebeu 1 Terreno garantido.');
    battleLog('Seu turno 1.');
    battleSelected=null;battleHandMenuIndex=null;battlePendingMovement=null;battleAttackSourceUid=null;renderBattle();
  }
  function battleFieldMarkup(side,isPlayer){
    return side.field.map((u,i)=>{
      if(!u)return `<div class="battle-slot empty"><span class="battle-slot-mark">♢</span></div>`;
      const es=cardElements(u.card),a=elementColor(es[0]||''),b=elementColor(es[1]||es[0]||'');
      const hpMax=Number(u.card.hp||1),hpNow=Math.max(0,Number(u.currentHp||0));
      const hpPct=Math.max(0,Math.min(100,(hpNow/hpMax)*100));
      return `<div class="battle-slot">
        <article class="battle-unit${u.torpor?' torpor':''}${battleSelected?.state?.uid===u.uid?' selected':''}${!isPlayer&&(battleAttackSourceUid||(battlePendingMovement&&!battlePendingMovement.choosingSource))?' targetable':''}" data-battle-unit="${esc(u.uid)}"${!isPlayer&&(battleAttackSourceUid||(battlePendingMovement&&!battlePendingMovement.choosingSource))?` data-battle-target="${esc(u.uid)}"`:''} style="--unit-a:${a};--unit-b:${b}">
          <header class="battle-unit-top"><b>${esc(u.card.name)}</b><span>${hpNow}</span></header>
          <div class="battle-unit-art">${u.card.imageData?`<img src="${u.card.imageData}" alt="${esc(u.card.name)}">`:'<span>🐾</span>'}</div>
          <div class="battle-unit-hpbar"><i style="width:${hpPct}%"></i></div>
          <footer class="battle-unit-bottom">
            <span class="battle-unit-elements">${es.slice(0,2).map(x=>`<i title="${esc(x)}" style="background:${elementColor(x)}"></i>`).join('')}</span>
            <span class="battle-unit-controls">
              <button type="button" class="battle-zoom-btn" data-battle-zoom-unit="${esc(u.uid)}" title="Ver carta de perto" aria-label="Ver ${esc(u.card.name)} de perto">⛶</button>
              ${isPlayer?`<button type="button" data-battle-attack="${esc(u.uid)}"${u.torpor?' disabled':''} title="Atacar">⚔</button>`:''}
            </span>
          </footer>
        </article>
      </div>`;
    }).join('');
  }
  function battleTerrainCardMarkup(card,index){
    const es=cardElements(card);
    return `<article class="battle-utility-card terrain">
      <div class="terrain-mini-icon">🌳</div>
      <div><b>${esc(card.name)}</b><small>${esc(es.join(' + ')||'NET')} • +1 EP/turno</small><em>${esc(terrainEffectLabel(card))}</em></div>
      <button type="button" data-battle-terrain-play="${index}">${battle.player.terrain?'Substituir':'Ativar'}</button>
    </article>`;
  }

  function battleRelianRow(unit,sideLabel,isPlayerSide=false){
    if(!unit)return '';
    const atk=relianAtk(unit.card),def=relianDef(unit.card);
    const evoCount=isPlayerSide&&battle?evolutionOptionsForUnit(battle.player,unit).length:0;
    return `<button type="button" class="battle-relian-row" data-battle-select-unit="${esc(unit.uid)}">
      <span><b>${esc(unit.card.name)}</b><small>${sideLabel}${unit.torpor?' • Torpor':''}${evoCount?` • ${evoCount} evolução disponível`:''}</small></span>
      <span>${unit.currentHp} HP</span><span>${atk} / ${def}</span>
    </button>`;
  }

  function renderBattleUtilityPanel(){
    const host=$('battleUtilityPanel');
    if(!host)return;
    document.querySelectorAll('[data-battle-view]').forEach(b=>b.classList.toggle('active',b.dataset.battleView===battleActiveView));
    if(!battle){
      host.innerHTML='<div class="battle-utility-empty">Inicie uma batalha para usar estas funções.</div>';
      return;
    }
    if(battleActiveView==='terrains'){
      const terrains=battle.player.hand.map((c,i)=>({c,i})).filter(x=>x.c.type==='terreno');
      const playerTerrain=battle.player.terrain;
      const enemyTerrain=battle.enemy.terrain;
      host.innerHTML=`<div class="battle-terrain-dashboard">
        <div class="battle-active-terrain"><small>SEU TERRENO ATIVO</small>${playerTerrain?`<b>${esc(playerTerrain.name)}</b><span>+1 EP ${esc(cardElements(playerTerrain)[0]||'NET')} por turno</span><em>${esc(terrainEffectLabel(playerTerrain))}</em>`:'<b>Nenhum</b><span>Ative um Terreno da sua mão.</span>'}</div>
        <div class="battle-active-terrain enemy"><small>TERRENO RIVAL</small>${enemyTerrain?`<b>${esc(enemyTerrain.name)}</b><span>+1 EP ${esc(cardElements(enemyTerrain)[0]||'NET')} por turno</span><em>${esc(terrainEffectLabel(enemyTerrain))}</em>`:'<b>Nenhum</b><span>Sem Terreno ativo.</span>'}</div>
        <div class="battle-terrain-hand"><small>TERRENOS NA SUA MÃO</small><div>${terrains.length?terrains.map(x=>battleTerrainCardMarkup(x.c,x.i)).join(''):'<span class="muted">Nenhuma carta de Terreno na mão.</span>'}</div></div>
      </div>`;
    }else if(battleActiveView==='relians'){
      const pendingEvolution=battleSelected?.card&&isEvolutionCard(battleSelected.card)&&!battleSelected.state?battleSelected.card:null;
      const pendingIndex=pendingEvolution?battle.player.hand.findIndex(c=>c===pendingEvolution||c.id===pendingEvolution.id):-1;
      host.innerHTML=`${pendingEvolution?`<div class="battle-evolution-prompt"><b>↗ ${esc(pendingEvolution.name)}</b><span>Escolha abaixo exatamente qual forma anterior será substituída.</span></div>`:''}<div class="battle-relians-dashboard">
        <div><small>SEUS RELIANS</small>${battle.player.field.filter(Boolean).map(u=>{
          const canUse=pendingEvolution&&canEvolveCard(u.card,pendingEvolution)&&pendingIndex>=0;
          return canUse?`<button type="button" class="battle-relian-row evolution-target" data-evolve-selected-unit="${esc(u.uid)}" data-evolve-hand-index="${pendingIndex}">
            <span><b>${esc(u.card.name)}</b><small>SUBSTITUIR por ${esc(pendingEvolution.name)}</small></span>
            <span>${u.currentHp} HP</span><span>↗ Evoluir</span>
          </button>`:battleRelianRow(u,'Aliado',true);
        }).join('')||'<span class="muted">Nenhum Relian em campo.</span>'}</div>
        <div><small>RELIANS RIVAIS</small>${battle.enemy.field.filter(Boolean).map(u=>battleRelianRow(u,'Rival')).join('')||'<span class="muted">Nenhum Relian rival em campo.</span>'}</div>
      </div>`;
    }else if(battleActiveView==='info'){
      const playerDeck=decks.find(d=>d.id===battle.playerDeckId);
      const enemyDeck=decks.find(d=>d.id===battle.enemyDeckId);
      host.innerHTML=`<div class="battle-info-dashboard">
        <div><small>SEU HP</small><b>${battle.player.hp}/${BATTLE_PLAYER_MAX_HP}</b></div>
        <div><small>HP RIVAL</small><b>${battle.enemy.hp}/${BATTLE_PLAYER_MAX_HP}</b></div>
        <div><small>SEU DECK</small><b>${esc(playerDeck?.name||'—')}</b><span>${battle.player.deck.length} restantes</span></div>
        <div><small>DECK RIVAL</small><b>${esc(enemyDeck?.name||playerDeck?.name||'—')}</b><span>${battle.enemy.deck.length} restantes</span></div>
        <div><small>MÃO</small><b>${battle.player.hand.length}</b></div>
        <div><small>EP P/ NET</small><b>${battleTotalEp(battle.player)}</b><span>qualquer cor</span></div>
        <div><small>MOV. USÁVEIS</small><b>${battle.player.hand.filter(c=>c.type==='movimento'&&usableUnitsForMovement(c).length).length}</b></div>
        <div><small>TURNO</small><b>${battle.turn}</b></div>
      </div>`;
    }else{
      const fieldUnits=battle.player.field.filter(Boolean);
      const ready=fieldUnits.filter(u=>!u.torpor);
      const attackSource=battle.player.field.find(u=>u?.uid===battleAttackSourceUid);
      const pendingCard=battlePendingMovement?battle.player.hand[battlePendingMovement.handIndex]:null;
      const pendingSource=battlePendingMovement?.sourceUid?battle.player.field.find(u=>u?.uid===battlePendingMovement.sourceUid):null;

      let status=`<b>Ações</b><span>Escolha um Relian. Você pode fazer um ataque básico ou usar um Movimento compatível que esteja na sua mão.</span>`;
      if(attackSource)status=`<b>${esc(attackSource.card.name)} — Ataque</b><span>Escolha um Relian rival destacado para receber o ataque.</span><button type="button" data-cancel-target>Cancelar</button>`;
      else if(battlePendingMovement?.choosingSource&&pendingCard)status=`<b>${esc(pendingCard.name)}</b><span>Escolha abaixo qual Relian compatível irá usar este Movimento.</span><button type="button" data-cancel-target>Cancelar</button>`;
      else if(pendingCard&&pendingSource)status=`<b>${esc(pendingSource.card.name)} — ${esc(pendingCard.name)}</b><span>Escolha um Relian rival destacado como alvo do Movimento.</span><button type="button" data-cancel-target>Cancelar</button>`;

      host.innerHTML=`<div class="battle-actions-dashboard battle-actions-v2">
        <div class="battle-action-status">${status}</div>
        <div class="battle-relian-action-list">${fieldUnits.length?fieldUnits.map(u=>{
          const moves=u.torpor?[]:movementCardsForUnit(u);
          const evolutions=evolutionOptionsForUnit(battle.player,u);
          const sourceChoice=!u.torpor&&battlePendingMovement?.choosingSource&&pendingCard&&movementCanBeUsedBy(pendingCard,u);
          return `<article class="battle-relian-action-card${sourceChoice?' source-choice':''}${u.torpor?' action-torpor':''}">
            <div class="battle-relian-action-head">
              <span><b>${esc(u.card.name)}</b><small>${u.currentHp} HP • ${relianAtk(u.card)} / ${relianDef(u.card)}${u.torpor?' • Torpor':''}</small></span>
              ${sourceChoice?`<button type="button" data-movement-source="${esc(u.uid)}">Usar este Relian</button>`:`<button type="button" data-action-attack="${esc(u.uid)}"${u.torpor?' disabled':''}>⚔ Ataque</button>`}
            </div>
            <div class="battle-linked-moves">
              ${moves.length?moves.map(({card,index})=>`<button type="button" data-action-movement="${index}" data-action-movement-source="${esc(u.uid)}"${!canPay(battle.player,card)?' disabled':''}>
                <b>${esc(card.name)}</b><small>${cardCost(card).net}/${cardCost(card).element} EP • Poder ${Number(card.power||0)}${movementLinkedIds(card).length?' • Vinculado':' • Genérico'}</small>
              </button>`).join(''):!u.torpor?'<span class="muted">Nenhum Movimento compatível na mão.</span>':'<span class="muted">Com Torpor: não pode atacar ou usar Movimento.</span>'}
            </div>
            ${evolutions.length?`<div class="battle-evolution-actions"><small>EVOLUIR</small>${evolutions.map(({card,index})=>`<button type="button" data-action-evolve="${index}" data-action-evolve-source="${esc(u.uid)}"><b>↗ ${esc(card.name)}</b><span>${cardCost(card).net}/${cardCost(card).element} EP</span></button>`).join('')}</div>`:''}
          </article>`;
        }).join(''):'<span class="muted">Nenhum Relian em campo.</span>'}</div>
      </div>`;
    }

    host.querySelectorAll('[data-battle-terrain-play]').forEach(b=>b.onclick=()=>playFromHand(Number(b.dataset.battleTerrainPlay)));
    host.querySelectorAll('[data-action-attack]').forEach(b=>b.onclick=()=>playerAttack(b.dataset.actionAttack));
    host.querySelectorAll('[data-action-movement]').forEach(b=>b.onclick=()=>beginMovementFromHand(Number(b.dataset.actionMovement),b.dataset.actionMovementSource));
    host.querySelectorAll('[data-movement-source]').forEach(b=>b.onclick=()=>chooseMovementSource(b.dataset.movementSource));
    host.querySelectorAll('[data-action-evolve]').forEach(b=>b.onclick=()=>playerEvolve(b.dataset.actionEvolveSource,Number(b.dataset.actionEvolve)));
    host.querySelector('[data-cancel-target]')?.addEventListener('click',()=>{battleAttackSourceUid=null;battlePendingMovement=null;renderBattle()});
    host.querySelectorAll('[data-evolve-selected-unit]').forEach(b=>b.onclick=()=>{
      const uid=b.dataset.evolveSelectedUnit;
      const handIndex=Number(b.dataset.evolveHandIndex);
      playerEvolve(uid,handIndex);
    });
    host.querySelectorAll('[data-battle-select-unit]').forEach(b=>b.onclick=()=>{
      const uid=b.dataset.battleSelectUnit;
      const unit=[...battle.player.field,...battle.enemy.field].find(u=>u?.uid===uid);
      if(unit){battleSelected={card:unit.card,state:unit};renderBattle()}
    });
  }

  function renderBattle(){
    const deckSel=$('battleDeckSelect');
    const opponentDeckSel=$('battleOpponentDeckSelect');
    const selectedPlayerDeck=battle?.playerDeckId||deckSel?.value||activeDeckId;
    const selectedEnemyDeck=battle?.enemyDeckId||opponentDeckSel?.value||'';
    if(deckSel)deckSel.innerHTML='<option value="">Escolha seu deck</option>'+decks.map(d=>`<option value="${esc(d.id)}"${d.id===selectedPlayerDeck?' selected':''}>${esc(d.name)}</option>`).join('');
    if(opponentDeckSel)opponentDeckSel.innerHTML='<option value="">Mesmo deck do jogador</option>'+decks.map(d=>`<option value="${esc(d.id)}"${d.id===selectedEnemyDeck?' selected':''}>${esc(d.name)}</option>`).join('');
    if(!battle){
      if($('battleEnemyField'))$('battleEnemyField').innerHTML='<div class="battle-slot empty">✦</div>'.repeat(3);
      if($('battlePlayerField'))$('battlePlayerField').innerHTML='<div class="battle-slot empty">✦</div>'.repeat(3);
      if($('battleHand'))$('battleHand').innerHTML='<div class="tcg-empty-card" style="min-width:100%"><span>⚔️</span><h3>Nenhuma batalha ativa</h3><p>Escolha um deck e clique em Iniciar batalha.</p></div>';
      if($('battlePlayerHp'))$('battlePlayerHp').textContent=BATTLE_PLAYER_MAX_HP;
      if($('battleEnemyHp'))$('battleEnemyHp').textContent=BATTLE_PLAYER_MAX_HP;
      $('battleEndTurnBtn')&&( $('battleEndTurnBtn').disabled=true );
      renderBattleUtilityPanel();
      return;
    }
    const elementTotal=Object.values(battle.player.ep.elements).reduce((a,b)=>a+Number(b||0),0);
    $('battleTurnLabel').textContent=battle.phase==='finished'?`Fim • ${battle.winner==='player'?'Vitória':'Derrota'}`:`${battle.turn} • ${battle.phase==='player'?'Sua vez':'Oponente'}`;
    if($('battlePlayerHp'))$('battlePlayerHp').textContent=`${battle.player.hp} / ${BATTLE_PLAYER_MAX_HP}`;
    if($('battleEnemyHp'))$('battleEnemyHp').textContent=`${battle.enemy.hp} / ${BATTLE_PLAYER_MAX_HP}`;
    $('battleEpNet').textContent=battleTotalEp(battle.player);
    $('battleEpElement').textContent=elementTotal;
    $('battleTerrainLabel').textContent=battle.player.terrain?.name||'Nenhum';
    $('battleEndTurnBtn').disabled=battle.phase!=='player'||battle.phase==='finished';
    $('battleEnemyField').innerHTML=battleFieldMarkup(battle.enemy,false);
    $('battlePlayerField').innerHTML=battleFieldMarkup(battle.player,true);
    $('battleHandLabel').textContent=`${battle.player.hand.length} cartas`;
    $('battleDeckRemaining').textContent=`Deck: ${battle.player.deck.length}`;
    $('battleHand').innerHTML=battle.player.hand.length?battle.player.hand.map((c,i)=>{
      const es=cardElements(c),a=elementColor(es[0]||''),b=elementColor(es[1]||es[0]||'');
      const cost=cardCost(c),isRelian=c.type==='relian';
      const icon=c.type==='relian'?'🐾':c.type==='movimento'?'⚔️':c.type==='item'?'🧪':c.type==='treinador'?'✦':'🌳';
      const menuOpen=battleHandMenuIndex===i;
      return `<article class="battle-hand-card${battleSelected?.card?.id===c.id&&!battleSelected?.state?' selected':''}${menuOpen?' menu-open':''}" data-battle-hand="${i}" style="--hand-a:${a};--hand-b:${b}">
        <header class="battle-hand-top"><b>${esc(c.name)}</b><span>${cost.net}/${cost.element}</span></header>
        <div class="battle-hand-art">${c.imageData?`<img src="${c.imageData}" alt="${esc(c.name)}">`:`<span>${icon}</span>`}</div>
        <div class="battle-hand-copy"><strong>${esc(c.relianType||c.type)}${c.type==='movimento'?(movementLinkedIds(c).length?' • Vinculado':' • Genérico'):''}</strong><p>${esc(c.description||'Sem descrição.')}</p></div>
        <footer>
          <span>${es.slice(0,2).map(x=>`<i title="${esc(x)}" style="background:${elementColor(x)}"></i>`).join('')}</span>
          <b>${isRelian?`${Number(c.hp||0)} HP`:esc(c.type)}</b>
        </footer>
        ${menuOpen?`<div class="battle-card-choice-menu" data-card-choice-menu>
          <button type="button" data-battle-read-more="${i}">🔍 Ler mais</button>
          <button type="button" class="primary" data-battle-play="${i}">▶ Jogar</button>
        </div>`:''}
      </article>`;
    }).join(''):'<p class="battle-hand-empty">Sua mão está vazia.</p>';
    $('battleLog').innerHTML=battle.log.map(x=>`<p>${esc(x)}</p>`).join('');
    $('battleSelectedCard').innerHTML=battleSelected
      ? `<div class="battle-selected-shell">
          <div class="battle-selected-visual">${richCardVisualMarkup(battleSelected.card,{compact:true})}</div>
          <div class="battle-selected-summary">
            <div class="battle-selected-title"><b>${esc(battleSelected.card.name)}</b><small>${esc(battleSelected.card.relianType||battleSelected.card.type||'Carta')}</small></div>
            ${cardInspectorMarkup(battleSelected.card,battleSelected.state)}
            <button type="button" class="battle-selected-readmore" data-selected-readmore>⛶ Ver carta em tela cheia</button>
          </div>
        </div>`
      : cardInspectorMarkup(null);
    renderBattleUtilityPanel();
    document.querySelectorAll('[data-battle-attack]').forEach(b=>b.onclick=e=>{e.stopPropagation();playerAttack(b.dataset.battleAttack)});
    document.querySelectorAll('[data-battle-target]').forEach(elm=>elm.onclick=e=>{
      e.stopPropagation();
      if(battlePendingMovement&&!battlePendingMovement.choosingSource)resolveMovementTarget(elm.dataset.battleTarget);
      else resolvePlayerAttack(elm.dataset.battleTarget);
    });
    document.querySelectorAll('[data-battle-zoom-unit]').forEach(b=>b.onclick=e=>{
      e.stopPropagation();
      const uid=b.dataset.battleZoomUnit;
      const unit=[...battle.player.field,...battle.enemy.field].find(u=>u?.uid===uid);
      if(unit)openFullscreenCard(unit.card);
    });
    document.querySelectorAll('[data-battle-zoom-hand]').forEach(b=>b.onclick=e=>{
      e.stopPropagation();
      const card=battle.player.hand[Number(b.dataset.battleZoomHand)];
      if(card)openFullscreenCard(card);
    });
    document.querySelectorAll('[data-battle-unit]').forEach(elm=>{
      if(elm.dataset.battleTarget)return;
      elm.onclick=()=>{
        const uid=elm.dataset.battleUnit;const unit=[...battle.player.field,...battle.enemy.field].find(u=>u?.uid===uid);
        if(unit){battleSelected={card:unit.card,state:unit};renderBattle()}
      };
    });
    document.querySelectorAll('[data-battle-hand]').forEach(elm=>{
      elm.onclick=e=>{
        if(e.target.closest('button'))return;
        const i=Number(elm.dataset.battleHand);
        const c=battle.player.hand[i];
        if(!c)return;
        battleSelected={card:c,state:null};
        battleHandMenuIndex=battleHandMenuIndex===i?null:i;
        renderBattle();
      };
      elm.ondblclick=e=>{e.preventDefault();const c=battle.player.hand[Number(elm.dataset.battleHand)];if(c)openFullscreenCard(c)};
    });
    document.querySelectorAll('[data-battle-unit]').forEach(elm=>{
      elm.ondblclick=e=>{
        e.preventDefault();
        const uid=elm.dataset.battleUnit;
        const unit=[...battle.player.field,...battle.enemy.field].find(u=>u?.uid===uid);
        if(unit)openFullscreenCard(unit.card);
      };
    });
    document.querySelectorAll('[data-battle-read-more]').forEach(b=>b.onclick=e=>{
      e.stopPropagation();
      const c=battle.player.hand[Number(b.dataset.battleReadMore)];
      if(c)openFullscreenCard(c);
    });
    document.querySelector('[data-selected-readmore]')?.addEventListener('click',()=>{
      if(battleSelected?.card)openFullscreenCard(battleSelected.card);
    });
    document.querySelectorAll('[data-battle-play]').forEach(b=>b.onclick=e=>{
      e.stopPropagation();
      battleHandMenuIndex=null;
      playFromHand(Number(b.dataset.battlePlay));
    });
  }

  setupElementSelects();
  document.querySelectorAll('[data-tcg-section]').forEach(btn=>btn.addEventListener('click',()=>openSection(btn.dataset.tcgSection)));
  $('tcgAddCardBtn')?.addEventListener('click',()=>$('tcgCardDialog').showModal());
  $('tcgCreateDeckBtn')?.addEventListener('click',()=>$('tcgDeckDialog').showModal());
  document.querySelectorAll('[data-close-tcg-dialog]').forEach(btn=>btn.addEventListener('click',()=>btn.closest('dialog')?.close()));

  $('relianCardCreatorForm')?.addEventListener('input',updateRelianPreview);
  $('relianCardCreatorForm')?.addEventListener('change',updateRelianPreview);
  $('relianCardCreatorForm')?.addEventListener('submit',saveRelianCard);
  $('rbcClearBtn')?.addEventListener('click',clearRelianCreator);
  $('rbcAddEvolutionBtn')?.addEventListener('click',addEvolutionCandidate);
  $('rbcImageInput')?.addEventListener('change',event=>{
    const file=event.target.files?.[0];if(!file)return;
    if(file.size>3_000_000){alert('A imagem é muito grande. Use uma imagem de até 3 MB.');event.target.value='';return}
    const reader=new FileReader();reader.onload=()=>{relianImageData=String(reader.result||'');updateRelianPreview()};reader.readAsDataURL(file);
  });

  document.querySelectorAll('[data-support-type]').forEach(btn=>btn.addEventListener('click',()=>setSupportType(btn.dataset.supportType)));
  $('supportCardForm')?.addEventListener('input',updateSupportPreview);
  $('supportCardForm')?.addEventListener('change',updateSupportPreview);
  $('supportCardForm')?.addEventListener('submit',saveSupportCard);
  $('supportClearBtn')?.addEventListener('click',clearSupportCreator);
  setSupportType('movimento');
  updateSupportPreview();

  $('tcgCardSearch')?.addEventListener('input',renderCards);
  $('tcgCardTypeFilter')?.addEventListener('change',()=>{document.querySelectorAll('[data-card-category]').forEach(btn=>btn.classList.toggle('active',btn.dataset.cardCategory===$('tcgCardTypeFilter').value));renderCards()});
  document.querySelectorAll('[data-card-category]').forEach(btn=>btn.addEventListener('click',()=>{if($('tcgCardTypeFilter'))$('tcgCardTypeFilter').value=btn.dataset.cardCategory;document.querySelectorAll('[data-card-category]').forEach(other=>other.classList.toggle('active',other===btn));renderCards()}));

  $('tcgCardForm')?.addEventListener('submit',event=>{
    const submitter=event.submitter;if(submitter?.value!=='save')return;const name=$('tcgCardName').value.trim();if(!name)return;
    cards.push({id:crypto.randomUUID?.()||String(Date.now()),name,type:$('tcgCardType').value,element:$('tcgCardElement').value.trim(),description:$('tcgCardDescription').value.trim()});
    save(CARD_KEY,cards);event.currentTarget.reset();renderCards();
  });
  $('tcgDeckForm')?.addEventListener('submit',event=>{
    const submitter=event.submitter;if(submitter?.value!=='save')return;const name=$('tcgDeckName').value.trim();if(!name)return;
    const deck={id:crypto.randomUUID?.()||String(Date.now()),name,description:$('tcgDeckDescription').value.trim(),cards:{}};decks.push(deck);activeDeckId=deck.id;save(DECK_KEY,decks);event.currentTarget.reset();renderDecks();renderDeckBuilder();
  });

  $('tcgCollectionSearch')?.addEventListener('input',renderCollection);
  $('tcgDeckCardSearch')?.addEventListener('input',renderDeckBuilder);
  $('tcgDeckSelect')?.addEventListener('change',e=>{activeDeckId=e.target.value;renderDeckBuilder();renderDecks()});
  $('tcgExportCardsBtn')?.addEventListener('click',()=>downloadJson('relians-battle-card-biblioteca.json',{format:'relians-battle-card-library',version:1,cards}));
  $('tcgImportCardsInput')?.addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;try{const data=JSON.parse(await file.text());const incoming=Array.isArray(data)?data:data.cards;if(!Array.isArray(incoming))throw 0;const byId=new Map(cards.map(c=>[c.id,c]));incoming.forEach(c=>{if(c&&c.name&&c.type)byId.set(c.id||crypto.randomUUID?.()||String(Date.now()+Math.random()),c)});cards=[...byId.values()];save(CARD_KEY,cards);renderCards();renderCollection();renderDeckBuilder();toast('Biblioteca importada')}catch{alert('Arquivo de biblioteca inválido.')}e.target.value=''});
  $('tcgExportDeckBtn')?.addEventListener('click',()=>{const d=deckById();if(!d){toast('Selecione um deck');return}downloadJson(`${d.name.replace(/[^a-z0-9_-]+/gi,'_')}.relians-deck.json`,{format:'relians-battle-card-deck',version:1,deck:d,cards:Object.keys(d.cards||{}).map(cardById).filter(Boolean)})});

  $('tcgFullscreenCloseBtn')?.addEventListener('click',()=>$('tcgFullscreenCardDialog')?.close());
  $('tcgFullscreenCardDialog')?.addEventListener('click',event=>{
    const dialog=event.currentTarget;
    if(event.target===dialog)dialog.close();
  });

  document.querySelectorAll('[data-battle-view]').forEach(btn=>btn.addEventListener('click',()=>{
    battleActiveView=btn.dataset.battleView||'actions';
    renderBattleUtilityPanel();
  }));
  $('battleStartBtn')?.addEventListener('click',startBattle);
  $('battleResetBtn')?.addEventListener('click',()=>{battle=null;battleSelected=null;battleHandMenuIndex=null;renderBattle();toast('Batalha reiniciada')});
  $('battleEndTurnBtn')?.addEventListener('click',()=>{if(battle?.phase==='player'){battleAttackSourceUid=null;battlePendingMovement=null;battleLog('Você finalizou o turno.');enemyTurn()}});
  $('battleClearLogBtn')?.addEventListener('click',()=>{if(battle){battle.log=[];renderBattle()}});
  $('battleDeckSelect')?.addEventListener('change',e=>{activeDeckId=e.target.value||activeDeckId});

  updateRelianPreview();renderCards();refreshMovementRelianLinks();refreshEvolutionOptions();renderCollection();renderDecks();renderDeckBuilder();renderBattle();
})();
