const STORAGE_KEY='relians_generator_v4_4';
const SAVE_SCHEMA_VERSION=2; // Versão da estrutura dos dados salvos. Aumente ao mudar o formato das fichas.
const HANDLE_DB='relians_folder_db';
const ATTR_KEYS=['ataque','defesa','velocidade','ataqueEspecial','defesaEspecial','precisao'];
const ATTR_LABELS={ataque:'Ataque',defesa:'Defesa',velocidade:'Velocidade',ataqueEspecial:'Atq. Especial',defesaEspecial:'Def. Especial',precisao:'Precisão'};
const ELEMENT_OPTIONS=[
  {value:'',label:'NENHUM',key:'nenhum'},
  {value:'Éter',label:'Éter',key:'eter'},
  {value:'Vital',label:'Vital',key:'vital'},
  {value:'Astral',label:'Astral',key:'astral'},
  {value:'Halo',label:'Halo',key:'halo'},
  {value:'Umbral',label:'Umbral',key:'umbral'},
  {value:'Tempestade',label:'Tempestade',key:'tempestade'},
  {value:'Ígnea',label:'Ígnea',key:'ignea'},
  {value:'Abissal',label:'Abissal',key:'abissal'},
  {value:'Colossal',label:'Colossal',key:'colossal'},
  {value:'Geada',label:'Geada',key:'geada'}
];
const elementInfo=value=>ELEMENT_OPTIONS.find(x=>x.value===value)||ELEMENT_OPTIONS[0];
const CLASS_INFO={
  OFS:{label:'OFS',name:'Ofensivo',key:'ofs'},
  DEF:{label:'DEF',name:'Defensivo',key:'def'},
  EFT:{label:'EFT',name:'Efeito',key:'eft'},
  NET:{label:'NET',name:'Neutro',key:'net'},
  HIB:{label:'HIB',name:'Híbrido',key:'hib'}
};
const normalizeRelianClass=value=>{const v=String(value||'').trim().toUpperCase();return v==='NEH'||v==='NENHUMA'||v==='NENHUM'?'':v};
const classInfo=value=>CLASS_INFO[normalizeRelianClass(value)]||null;
function identityBadges(relianClass,elements){
  const cls=classInfo(relianClass);
  const classBadge=cls?`<span class="identity-badge class-badge class-${esc(cls.key)}"><span class="identity-badge-mark"></span><strong>${esc(cls.label)}</strong><small>${esc(cls.name)}</small></span>`:'';
  const elementBadges=(elements||[]).filter(Boolean).map(value=>{const info=elementInfo(value);return `<span class="identity-badge element-identity-badge element-${esc(info.key)}"><span class="element-popup-dot"></span><strong>${esc(info.label)}</strong></span>`}).join('');
  return classBadge||elementBadges?`<div class="identity-badges">${classBadge}${elementBadges}</div>`:'';
}
function setupElementSelectors(){
  [1,2,3].forEach(n=>{
    for(const prefix of ['element','specialElement']){
      const select=el(prefix+n);if(!select)continue;
      select.innerHTML=ELEMENT_OPTIONS.map(x=>`<option value="${esc(x.value)}">${esc(x.label)}</option>`).join('');
      select.addEventListener('change',()=>{updateElementSelectStyle(select);renderElementPreview()});
      updateElementSelectStyle(select);
    }
  });
  renderElementPreview();
}
function updateElementSelectStyle(select){
  const info=elementInfo(select.value);
  select.dataset.element=info.key;
  select.className='element-select element-'+info.key;
}
function renderElementSetPreview(previewId,prefix,emptyText){
  const preview=el(previewId);if(!preview)return;
  const selected=[1,2,3].map(n=>el(prefix+n)?.value||'').filter(Boolean);
  const unique=[...new Set(selected)];
  preview.innerHTML=unique.length?unique.map(value=>{const info=elementInfo(value);return `<span class="element-popup element-${info.key}"><span class="element-popup-dot"></span><b>${esc(info.label)}</b></span>`}).join(''):`<span class="element-empty">${esc(emptyText)}</span>`;
}
function renderElementPreview(){
  renderElementSetPreview('elementPreview','element','Sem elemento selecionado');
  renderElementSetPreview('specialElementPreview','specialElement','Usará os mesmos elementos da Basic Color');
}
function normalizeColorId(value='basic'){
  const raw=String(value||'basic').trim().toLowerCase();
  if(raw==='special'||raw==='especial'||raw.includes('especial')||raw.includes('special'))return 'special';
  if(raw==='shiny'||raw.includes('shiny'))return 'shiny';
  return 'basic';
}
function colorName(value='basic'){
  const color=normalizeColorId(value);
  if(color==='shiny')return 'Shiny Color';
  if(color==='special')return 'Especial Color';
  return 'Basic Color';
}
function getRelianElements(r,colorId='basic'){
  const color=normalizeColorId(colorId);
  const base=Array.isArray(r?.elements)?r.elements.filter(Boolean):[];
  const special=Array.isArray(r?.specialElements)?r.specialElements.filter(Boolean):[];
  return color==='special'&&special.length?special:base;
}
function relianElementText(r,colorId='basic'){
  return getRelianElements(r,colorId).join(', ')||'Nenhum';
}
const MOVE_ELEMENT_COLORS={
  'Éter':'#7f79ad','Vital':'#158f24','Astral':'#12afb5','Halo':'#0878df','Umbral':'#526b76',
  'Tempestade':'#e88900','Ígnea':'#df1018','Abissal':'#315bd1','Colossal':'#9a7e77','Geada':'#4a9ccc'
};
function getMoveElements(move){
  const direct=Array.isArray(move?.elements)?move.elements:[];
  const raw=direct.length?direct:String(move?.element||'').split(/[\/,+]/);
  const valid=raw.map(x=>String(x||'').trim()).filter(Boolean).filter(x=>MOVE_ELEMENT_COLORS[x]);
  return [...new Set(valid)].slice(0,2);
}
function hexToRgb(hex){
  const clean=String(hex||'').replace('#','');
  const value=clean.length===3?clean.split('').map(x=>x+x).join(''):clean.padEnd(6,'0').slice(0,6);
  return [parseInt(value.slice(0,2),16)||0,parseInt(value.slice(2,4),16)||0,parseInt(value.slice(4,6),16)||0];
}
function mixHex(a,b,weight=.55){
  const x=hexToRgb(a),y=hexToRgb(b),w=Math.max(0,Math.min(1,weight));
  return '#'+x.map((v,i)=>Math.round(v*w+y[i]*(1-w)).toString(16).padStart(2,'0')).join('');
}
function rgbaHex(hex,alpha){const [r,g,b]=hexToRgb(hex);return `rgba(${r},${g},${b},${alpha})`;}
function moveCardVisual(move){
  const elements=getMoveElements(move);
  const neutral=elements.length===0;
  const first=elements[0]||'Neutro',second=elements[1]||first;
  const c1=neutral?'#f4f7f7':(MOVE_ELEMENT_COLORS[first]||'#326d79');
  const c2=neutral?'#d8e1e3':(MOVE_ELEMENT_COLORS[second]||c1);
  const soft1=neutral?'rgba(244,247,247,.96)':rgbaHex(c1,.38);
  const soft2=neutral?'rgba(216,225,227,.96)':rgbaHex(c2,.38);
  const border=neutral?'#d8e1e3':mixHex(c1,c2,.55);
  return {
    elements,
    neutral,
    style:`--move-color-1:${c1};--move-color-2:${c2};--move-soft-1:${soft1};--move-soft-2:${soft2};--move-border:${border};--move-bg:${neutral?'#edf2f3':'#061f28'};--move-text:${neutral?'#15323a':'#f4ffff'};--move-muted:${neutral?'#48646b':'#c5e0e4'};`,
    label:elements.join(' / ')||'Neutro'
  };
}
const clone=x=>JSON.parse(JSON.stringify(x));
const slug=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
const el=id=>document.getElementById(id);
const rand=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const pick=a=>a?.length?a[rand(0,a.length-1)]:null;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function moveInfoButton(description){const text=String(description||'Sem descrição cadastrada.');return `<button type="button" class="move-info-button" aria-label="Ver descrição do movimento" data-description="${esc(text)}">i</button>`;}

const defaultData={
  rules:{baseHp:100,baseEnergy:65,hpPerEvolution:20,attrMin:1,attrMax:35,modMin:-7,modMax:7,moveLimit:6,shinyChance:3,specialChance:0.5},
  regions:[{"id":"vale-de-aster","name":"Vale de Aster","elements":["Éter","Vital"]},{"id":"bosque-de-elyr","name":"Bosque de Elyr","elements":["Vital","Éter"]},{"id":"planicies-de-solen","name":"Planícies de Solen","elements":["Vital","Tempestade"]},{"id":"costa-de-maris","name":"Costa de Maris","elements":["Abissal","Tempestade"]},{"id":"pantano-de-morgh","name":"Pântano de Morgh","elements":["Umbral","Abissal"]},{"id":"floresta-de-nym","name":"Floresta de Nym","elements":["Vital","Astral"]},{"id":"serra-rubra","name":"Serra Rubra","elements":["Ígnea","Colossal"]},{"id":"pico-boreal","name":"Pico Boreal","elements":["Geada","Colossal"]},{"id":"deserto-de-karesh","name":"Deserto de Karesh","elements":["Colossal","Ígnea"]},{"id":"oasis-lumen","name":"Oásis Lumen","elements":["Vital","Abissal","Halo"]},{"id":"lago-espelhado","name":"Lago Espelhado","elements":["Abissal","Astral"]},{"id":"baia-coralina","name":"Baía Coralina","elements":["Abissal","Vital","Halo"]},{"id":"abismo-de-nox","name":"Abismo de Nox","elements":["Umbral","Abissal"]},{"id":"arquipelago-celeste","name":"Arquipélago Celeste","elements":["Tempestade","Halo"]},{"id":"ruinas-de-arkhos","name":"Ruínas de Arkhos","elements":["Éter","Colossal","Umbral"]},{"id":"observatorio-astral","name":"Observatório Astral","elements":["Astral","Éter"]},{"id":"cavernas-de-eter","name":"Cavernas de Éter","elements":["Éter","Astral"]},{"id":"fenda-de-umbra","name":"Fenda de Umbra","elements":["Umbral","Astral"]},{"id":"vulcao-ignivar","name":"Vulcão Ignivar","elements":["Ígnea","Colossal"]},{"id":"campos-da-aurora","name":"Campos da Aurora","elements":["Halo","Astral","Geada"]},{"id":"penhascos-de-zephyr","name":"Penhascos de Zephyr","elements":["Tempestade","Colossal"]},{"id":"bosque-luminescente","name":"Bosque Luminescente","elements":["Vital","Halo"]},{"id":"cratera-de-halo","name":"Cratera de Halo","elements":["Halo","Colossal"]},{"id":"fortaleza-colossal","name":"Fortaleza Colossal","elements":["Colossal","Éter"]},{"id":"jardim-vital","name":"Jardim Vital","elements":["Vital","Halo"]},{"id":"vale-tempestuoso","name":"Vale Tempestuoso","elements":["Tempestade","Abissal"]},{"id":"mar-de-cristal","name":"Mar de Cristal","elements":["Abissal","Geada","Astral"]},{"id":"montanhas-cinzentas","name":"Montanhas Cinzentas","elements":["Colossal","Umbral"]},{"id":"campos-nebulosos","name":"Campos Nebulosos","elements":["Astral","Umbral"]},{"id":"torre-dos-ecos","name":"Torre dos Ecos","elements":["Éter","Astral"]}],
  biomes:[{"id":"floresta-temperada","name":"Floresta Temperada","elements":["Vital","Éter"]},{"id":"floresta-tropical","name":"Floresta Tropical","elements":["Vital","Abissal"]},{"id":"floresta-nebulosa","name":"Floresta Nebulosa","elements":["Vital","Astral","Umbral"]},{"id":"floresta-cristalina","name":"Floresta Cristalina","elements":["Vital","Astral","Geada"]},{"id":"floresta-ancestral","name":"Floresta Ancestral","elements":["Vital","Éter"]},{"id":"selva-densa","name":"Selva Densa","elements":["Vital","Abissal"]},{"id":"campos-abertos","name":"Campos Abertos","elements":["Éter","Vital"]},{"id":"savana","name":"Savana","elements":["Vital","Ígnea","Colossal"]},{"id":"pradarias","name":"Pradarias","elements":["Vital","Tempestade"]},{"id":"colinas-verdejantes","name":"Colinas Verdejantes","elements":["Vital","Éter"]},{"id":"cordilheira","name":"Cordilheira","elements":["Colossal","Tempestade"]},{"id":"penhascos","name":"Penhascos","elements":["Colossal","Tempestade"]},{"id":"montanhas-nevadas","name":"Montanhas Nevadas","elements":["Geada","Colossal"]},{"id":"picos-cristalinos","name":"Picos Cristalinos","elements":["Geada","Astral","Colossal"]},{"id":"tundra","name":"Tundra","elements":["Geada","Colossal"]},{"id":"geleiras","name":"Geleiras","elements":["Geada","Abissal"]},{"id":"campos-congelados","name":"Campos Congelados","elements":["Geada","Tempestade"]},{"id":"floresta-boreal","name":"Floresta Boreal","elements":["Geada","Vital"]},{"id":"vulcoes","name":"Vulcões","elements":["Ígnea","Colossal"]},{"id":"campos-de-lava","name":"Campos de Lava","elements":["Ígnea","Colossal"]},{"id":"rochas-igneas","name":"Rochas Ígneas","elements":["Ígnea","Colossal"]},{"id":"desfiladeiros-vulcanicos","name":"Desfiladeiros Vulcânicos","elements":["Ígnea","Colossal","Tempestade"]},{"id":"deserto-arenoso","name":"Deserto Arenoso","elements":["Colossal","Ígnea","Tempestade"]},{"id":"deserto-rochoso","name":"Deserto Rochoso","elements":["Colossal","Ígnea"]},{"id":"dunas","name":"Dunas","elements":["Colossal","Tempestade"]},{"id":"oasis","name":"Oásis","elements":["Abissal","Vital"]},{"id":"brejo","name":"Brejo","elements":["Abissal","Umbral","Vital"]},{"id":"manguezal","name":"Manguezal","elements":["Abissal","Vital"]},{"id":"charco","name":"Charco","elements":["Abissal","Umbral"]},{"id":"pantano-sombrio","name":"Pântano Sombrio","elements":["Umbral","Abissal"]},{"id":"rios","name":"Rios","elements":["Abissal","Vital"]},{"id":"lagos","name":"Lagos","elements":["Abissal","Vital"]},{"id":"cachoeiras","name":"Cachoeiras","elements":["Abissal","Tempestade"]},{"id":"mar-aberto","name":"Mar Aberto","elements":["Abissal","Tempestade"]},{"id":"recife","name":"Recife","elements":["Abissal","Vital","Halo"]},{"id":"abismo-oceanico","name":"Abismo Oceânico","elements":["Abissal","Umbral"]},{"id":"cavernas","name":"Cavernas","elements":["Colossal","Umbral"]},{"id":"mina-abandonada","name":"Mina Abandonada","elements":["Colossal","Umbral"]},{"id":"caverna-cristalina","name":"Caverna Cristalina","elements":["Astral","Colossal","Geada"]},{"id":"caverna-de-eter","name":"Caverna de Éter","elements":["Éter","Astral"]},{"id":"ilhas-flutuantes","name":"Ilhas Flutuantes","elements":["Tempestade","Halo","Astral"]},{"id":"penhascos-aereos","name":"Penhascos Aéreos","elements":["Tempestade","Colossal"]},{"id":"nuvens-densas","name":"Nuvens Densas","elements":["Tempestade","Halo"]},{"id":"ruinas-astrais","name":"Ruínas Astrais","elements":["Astral","Éter"]},{"id":"campos-estelares","name":"Campos Estelares","elements":["Astral","Halo"]},{"id":"fenda-astral","name":"Fenda Astral","elements":["Astral","Umbral"]},{"id":"cidade","name":"Cidade","elements":["Éter","Colossal"]},{"id":"vilarejo","name":"Vilarejo","elements":["Éter","Vital"]},{"id":"ruinas-antigas","name":"Ruínas Antigas","elements":["Éter","Umbral","Colossal"]},{"id":"laboratorio","name":"Laboratório","elements":["Éter","Astral"]},{"id":"zona-industrial","name":"Zona Industrial","elements":["Colossal","Tempestade","Umbral"]}],
  traits:{
    "feroz":{"id":"feroz","name":"Feroz","description":"Relians ferozes possuem um instinto agressivo e enfrentam desafios sem hesitação, preferindo resolver conflitos pela força.","behavior":"Tendem a intimidar outros DataMons, são impulsivos em combate e dificilmente recuam diante de um adversário.","palate":"Ardente","mods":{"ataque":5,"defesa":-5,"velocidade":5,"ataqueEspecial":0,"defesaEspecial":-5,"precisao":0,"hp":5,"energia":-5}},
    "guardiao":{"id":"guardiao","name":"Guardião","description":"Nascem com um forte instinto protetor, colocando aliados e território acima de si mesmos.","behavior":"Costumam permanecer próximos do grupo, reagindo rapidamente quando alguém precisa de ajuda.","palate":"Salgado","mods":{"ataque":-5,"defesa":5,"velocidade":-5,"ataqueEspecial":0,"defesaEspecial":5,"precisao":0,"hp":5,"energia":-5}},
    "cacador":{"id":"cacador","name":"Caçador","description":"Possuem sentidos apurados para perseguir presas e encontrar oportunidades antes dos demais.","behavior":"São pacientes durante a perseguição, mas extremamente rápidos ao atacar.","palate":"Umami","mods":{"ataque":0,"defesa":0,"velocidade":5,"ataqueEspecial":-5,"defesaEspecial":-5,"precisao":5,"hp":-5,"energia":5}},
    "mistico":{"id":"mistico","name":"Místico","description":"Demonstram grande afinidade com energias naturais, manipulando-as com mais facilidade desde o nascimento.","behavior":"São calmos, observadores e costumam analisar a situação antes de agir.","palate":"Doce","mods":{"ataque":-5,"defesa":0,"velocidade":-5,"ataqueEspecial":5,"defesaEspecial":5,"precisao":0,"hp":-5,"energia":5}},
    "impulsivo":{"id":"impulsivo","name":"Impulsivo","description":"Agem antes de pensar, confiando nos próprios reflexos e instintos para superar qualquer situação.","behavior":"Entram facilmente em conflitos, exploram locais desconhecidos sem receio e raramente planejam suas ações.","palate":"Azedo","mods":{"ataque":5,"defesa":-5,"velocidade":0,"ataqueEspecial":0,"defesaEspecial":-5,"precisao":5,"hp":-5,"energia":5}},
    "curioso":{"id":"curioso","name":"Curioso","description":"Relians curiosos possuem um desejo incessante de explorar e compreender tudo ao seu redor, raramente ignorando algo desconhecido.","behavior":"Investigam objetos, seguem rastros incomuns e frequentemente acabam descobrindo recursos escondidos.","palate":"Agridoce","mods":{"ataque":-5,"defesa":-5,"velocidade":0,"ataqueEspecial":5,"defesaEspecial":0,"precisao":5,"hp":-5,"energia":10}},
    "resiliente":{"id":"resiliente","name":"Resiliente","description":"Desde o nascimento demonstram uma capacidade extraordinária de suportar dor, fadiga e condições adversas.","behavior":"Continuam lutando mesmo após sofrer grandes ferimentos e raramente entram em pânico.","palate":"Terroso","mods":{"ataque":0,"defesa":5,"velocidade":-5,"ataqueEspecial":0,"defesaEspecial":5,"precisao":-5,"hp":10,"energia":-5}},
    "astuto":{"id":"astuto","name":"Astuto","description":"Possuem inteligência prática e sempre procuram a maneira mais eficiente de alcançar seus objetivos.","behavior":"Preferem criar estratégias, utilizar armadilhas ou explorar as fraquezas do inimigo antes de agir.","palate":"Amargo","mods":{"ataque":-5,"defesa":0,"velocidade":5,"ataqueEspecial":5,"defesaEspecial":0,"precisao":0,"hp":-5,"energia":5}},
    "territorial":{"id":"territorial","name":"Territorial","description":"Sentem um forte apego ao espaço que consideram seu, tornando-se extremamente determinados ao defendê-lo.","behavior":"Marcam território, patrulham constantemente e reagem de forma hostil contra invasores.","palate":"Defumado","mods":{"ataque":5,"defesa":5,"velocidade":-5,"ataqueEspecial":-5,"defesaEspecial":0,"precisao":0,"hp":5,"energia":-5}},
    "sereno":{"id":"sereno","name":"Sereno","description":"Relians serenos mantêm a calma mesmo nas situações mais perigosas, tomando decisões com clareza.","behavior":"Raramente agem por impulso e costumam transmitir tranquilidade aos companheiros.","palate":"Herbal","mods":{"ataque":-5,"defesa":0,"velocidade":-5,"ataqueEspecial":0,"defesaEspecial":5,"precisao":5,"hp":5,"energia":5}},
    "destemido":{"id":"destemido","name":"Destemido","description":"Relians destemidos raramente sentem medo. Encaram criaturas maiores e desafios perigosos com uma coragem quase irracional.","behavior":"São os primeiros a avançar em situações de risco e dificilmente fogem de uma batalha.","palate":"Picante","mods":{"ataque":5,"defesa":5,"velocidade":0,"ataqueEspecial":-5,"defesaEspecial":0,"precisao":-5,"hp":5,"energia":5}},
    "agil":{"id":"agil","name":"Ágil","description":"Nascem com reflexos extremamente rápidos e um corpo naturalmente leve, tornando seus movimentos difíceis de acompanhar.","behavior":"Movem-se constantemente, evitam permanecer parados e adoram correr ou escalar.","palate":"Cítrico","mods":{"ataque":0,"defesa":-5,"velocidade":10,"ataqueEspecial":0,"defesaEspecial":-5,"precisao":0,"hp":-5,"energia":5}},
    "voraz":{"id":"voraz","name":"Voraz","description":"Possuem um metabolismo acelerado que os obriga a consumir alimento com frequência para manter suas energias.","behavior":"Estão sempre procurando algo para comer e dificilmente recusam uma refeição.","palate":"Carnudo","mods":{"ataque":5,"defesa":0,"velocidade":-5,"ataqueEspecial":0,"defesaEspecial":0,"precisao":-5,"hp":10,"energia":-10}},
    "empatico":{"id":"empatico","name":"Empático","description":"Demonstram uma forte conexão emocional com outros DataMons, compreendendo facilmente seus sentimentos.","behavior":"Evitam conflitos desnecessários e costumam auxiliar aliados espontaneamente.","palate":"Floral","mods":{"ataque":-5,"defesa":-5,"velocidade":0,"ataqueEspecial":5,"defesaEspecial":5,"precisao":0,"hp":5,"energia":5}},
    "persistente":{"id":"persistente","name":"Persistente","description":"Relians persistentes não desistem facilmente. Mesmo diante de repetidos fracassos, continuam tentando até alcançar seu objetivo.","behavior":"São determinados, pacientes e costumam terminar aquilo que começam.","palate":"Oleaginoso","mods":{"ataque":0,"defesa":5,"velocidade":-5,"ataqueEspecial":-5,"defesaEspecial":0,"precisao":5,"hp":10,"energia":5}},
    "adaptavel":{"id":"adaptavel","name":"Adaptável","description":"Relians adaptáveis conseguem se acostumar rapidamente a novos ambientes, alimentos e situações, demonstrando grande flexibilidade.","behavior":"Exploram qualquer habitat sem hesitar e raramente demonstram desconforto diante de mudanças.","palate":"Equilibrado","mods":{"ataque":-5,"defesa":0,"velocidade":5,"ataqueEspecial":0,"defesaEspecial":5,"precisao":-5,"hp":5,"energia":10}},
    "orgulhoso":{"id":"orgulhoso","name":"Orgulhoso","description":"Carregam uma enorme confiança em suas próprias capacidades, recusando-se a demonstrar fraqueza diante dos outros.","behavior":"Gostam de liderar, aceitam desafios com facilidade e evitam recuar, mesmo quando seria mais prudente.","palate":"Encorpado","mods":{"ataque":5,"defesa":-5,"velocidade":0,"ataqueEspecial":5,"defesaEspecial":-5,"precisao":0,"hp":5,"energia":5}},
    "brincalhao":{"id":"brincalhao","name":"Brincalhão","description":"Possuem uma personalidade alegre e curiosa, transformando quase qualquer situação em uma oportunidade para brincar.","behavior":"Interagem facilmente com outros DataMons, gostam de explorar e frequentemente pregam pequenas peças.","palate":"Frutado","mods":{"ataque":0,"defesa":-5,"velocidade":5,"ataqueEspecial":-5,"defesaEspecial":0,"precisao":5,"hp":-5,"energia":10}},
    "solitario":{"id":"solitario","name":"Solitário","description":"Preferem viver longe de grandes grupos, confiando principalmente em suas próprias habilidades.","behavior":"Evitam multidões, patrulham seu território sozinhos e demonstram pouca necessidade de companhia.","palate":"Amadeirado","mods":{"ataque":5,"defesa":0,"velocidade":0,"ataqueEspecial":0,"defesaEspecial":5,"precisao":-5,"hp":5,"energia":-5}},
    "intuitivo":{"id":"intuitivo","name":"Intuitivo","description":"Relians intuitivos parecem prever perigos e oportunidades antes que eles aconteçam, guiando-se mais pelo instinto do que pela lógica.","behavior":"Costumam tomar decisões rápidas, confiar em seus pressentimentos e raramente ignoram uma sensação estranha.","palate":"Refrescante","mods":{"ataque":-5,"defesa":0,"velocidade":-5,"ataqueEspecial":0,"defesaEspecial":5,"precisao":5,"hp":5,"energia":5}}
  },
  moves:{
    "achar-tesouro":{"id":"achar-tesouro","name":"Achar tesouro","type":"NET","damage":0,"energy":30,"element":"Éter","description":"O DataMon cava o chão gastando seu turno para achar um item no chão, podendo usar o item para atirar em seu inimigo.\n\nEfeito: Ao cavar o chão, obtém um item aleatório.\nRole D100:\n\n1-70= Nada | 71-90= Berry | 91 - 100 = Pedra.\nBerry = Efeito da fruta encontrada.\n\nPedra = Causa 30 de dano.\nSe o DataMon estiver com um item em mãos e tentar usar o movimento novamente, ele automaticamente arremessará o item atual no adversário."},
    "amarracao":{"id":"amarracao","name":"Amarração","type":"EFT","damage":0,"energy":30,"element":"Vital","description":""},
    "aroma-doce":{"id":"aroma-doce","name":"Aroma doce","type":"NEH","damage":0,"energy":50,"element":"Halo / Umbral","description":"Um aroma adocicado que faz o datamon ficar perdido.\nEfeito: O oponente rola 1d2, se cair 1, perderá o turno, se cair 2, não perderá."},
    "ataque-meteorico":{"id":"ataque-meteorico","name":"Ataque Meteórico","type":"EFT","damage":90,"energy":70,"element":"Astral / Colossal","description":"Dispara uma chuva de meteoritos metálicos que pode aumentar a própria velocidade.\nEfeito: 20% de chance de aumentar a velocidade (+20% de velocidade).\n\n(Efeito de campo)"},
    "barao-do-pedal":{"id":"barao-do-pedal","name":"Barão do pedal","type":"NEH","damage":20,"energy":25,"element":"Éter","description":"Dá uma pisada pesada com botas pesadas."},
    "batido-de-abacate":{"id":"batido-de-abacate","name":"Batido de abacate","type":"NEH","damage":0,"energy":40,"element":"Vital / Éter","description":"Rouba a energia do datamon oponente, preenchendo sua própria energia.\nEfeito: Rouba 40% da energia do oponente, revitalizando sua energia própria."},
    "bicada-triunfante":{"id":"bicada-triunfante","name":"Bicada Triunfante","type":"NET","damage":30,"energy":35,"element":"Éter","description":""},
    "bicada-voraz":{"id":"bicada-voraz","name":"Bicada Voraz","type":"NET","damage":15,"energy":20,"element":"Éter","description":""},
    "bofetada-aquatica":{"id":"bofetada-aquatica","name":"Bofetada Aquática","type":"NET","damage":40,"energy":20,"element":"Abissal / Éter","description":"Um golpe ágil com um jato de água."},
    "bola-de-nectar":{"id":"bola-de-nectar","name":"Bola de Néctar","type":"EFT","damage":25,"energy":30,"element":"Vital","description":""},
    "cantico-lunar":{"id":"cantico-lunar","name":"Cântico Lunar","type":"EFT","damage":0,"energy":30,"element":"Halo","description":""},
    "casulo-de-seda":{"id":"casulo-de-seda","name":"Casulo de Seda","type":"DEF","damage":0,"energy":50,"element":"Vital","description":""},
    "casulo-do-vento":{"id":"casulo-do-vento","name":"Casulo do Vento","type":"EFT","damage":0,"energy":0,"element":"Halo","description":""},
    "chamas-etereas":{"id":"chamas-etereas","name":"Chamas Etéreas","type":"NEH","damage":75,"energy":55,"element":"Ígnea / Astral","description":"Lança uma labareda ancestral que pode queimar e reduzir a resistência especial do inimigo.\nEfeito: 20% de chance de queimar o alvo e reduzir Sp. Def (-1 estágio)."},
    "chamas-guerreiras":{"id":"chamas-guerreiras","name":"Chamas Guerreiras","type":"NEH","damage":75,"energy":50,"element":"Ígnea / Halo","description":"Taturá envolve seus punhos em chamas intensas e desfere um golpe poderoso.\nEfeito: Aumenta o Ataque em 1 estágio ao acertar o golpe."},
    "chicote-de-laminas":{"id":"chicote-de-laminas","name":"Chicote de Lâminas","type":"NEH","damage":45,"energy":25,"element":"Vital / Éter","description":"Cipós afiados atingem o adversário rapidamente."},
    "chicote-de-seda":{"id":"chicote-de-seda","name":"Chicote de Seda","type":"NET","damage":20,"energy":15,"element":"Vital","description":""},
    "chicoteada":{"id":"chicoteada","name":"Chicoteada","type":"NEH","damage":10,"energy":20,"element":"Éter","description":"Utilizando de algo longo para dar golpes precisos."},
    "chute-lunar":{"id":"chute-lunar","name":"Chute Lunar","type":"NEH","damage":40,"energy":20,"element":"Halo / Éter","description":"Um chute ágil imbuído de energia mágica."},
    "chute-triunfal":{"id":"chute-triunfal","name":"Chute triunfal","type":"OFS","damage":35,"energy":50,"element":"Éter","description":""},
    "chuva-de-pedras":{"id":"chuva-de-pedras","name":"Chuva de pedras","type":"OFS","damage":50,"energy":45,"element":"Colossal","description":""},
    "ciclone-cortante":{"id":"ciclone-cortante","name":"Ciclone Cortante","type":"NEH","damage":35,"energy":50,"element":"Tempestade / Vital","description":"Rajadas de vento velozes e afiadas atingem o inimigo, reduzindo sua precisão.\nEfeito: Tem 30% de chance de reduzir a Precisão do alvo em 1 estágio."},
    "corrente-dragonica":{"id":"corrente-dragonica","name":"Corrente dragônica","type":"OFS","damage":45,"energy":50,"element":"Abissal / Tempestade","description":""},
    "corte-de-arvore":{"id":"corte-de-arvore","name":"Corte de Árvore","type":"HIB","damage":50,"energy":40,"element":"Vital / Éter","description":""},
    "corte-de-plasma":{"id":"corte-de-plasma","name":"Corte de Plasma","type":"HIB","damage":40,"energy":40,"element":"Ígnea","description":""},
    "cristalizacao-ambar":{"id":"cristalizacao-ambar","name":"Cristalização Âmbar","type":"DEF","damage":0,"energy":40,"element":"Vital","description":""},
    "cruz-do-guerreiro":{"id":"cruz-do-guerreiro","name":"Cruz do Guerreiro","type":"HIB","damage":25,"energy":50,"element":"Éter / Ígnea","description":""},
    "cuspe-de-nectar":{"id":"cuspe-de-nectar","name":"Cuspe de Néctar","type":"EFT","damage":10,"energy":15,"element":"Vital","description":""},
    "deslizamento-terrestre":{"id":"deslizamento-terrestre","name":"Deslizamento Terrestre","type":"OFS","damage":40,"energy":30,"element":"Colossal","description":""},
    "diluvio-celeste":{"id":"diluvio-celeste","name":"Dilúvio Celeste","type":"DEF","damage":0,"energy":50,"element":"Halo / Abissal","description":""},
    "diluvio-lunar":{"id":"diluvio-lunar","name":"Dilúvio Lunar","type":"HIB","damage":65,"energy":50,"element":"Abissal / Astral","description":""},
    "distorcao-temporal":{"id":"distorcao-temporal","name":"Distorção Temporal","type":"DEF","damage":0,"energy":70,"element":"Astral","description":""},
    "dois-caras-de-bicicleta":{"id":"dois-caras-de-bicicleta","name":"Dois Caras de Bicicleta","type":"NET","damage":0,"energy":60,"element":"Umbral / Éter","description":"Uma abordagem inesperada e sorrateira, inspirada em histórias urbanas de roubo misterioso. O DataMon surpreende o alvo com uma ação rápida e oportunista.\nEfeito: Rouba um item pertencente ao adversário ou ao DataMon inimigo.\n\nRole D100:\n\n1-80 = Nada acontece.\n\n81-100 = Rouba o item. 1D2 para item."},
    "escudo-brilhante":{"id":"escudo-brilhante","name":"Escudo Brilhante","type":"DEF","damage":0,"energy":40,"element":"Astral","description":""},
    "escudo-celestial":{"id":"escudo-celestial","name":"Escudo Celestial","type":"DEF","damage":0,"energy":70,"element":"Halo / Astral","description":""},
    "escudo-do-caos":{"id":"escudo-do-caos","name":"Escudo do Caos","type":"EFT","damage":0,"energy":55,"element":"Umbral / Tempestade","description":""},
    "estapear":{"id":"estapear","name":"Estapear","type":"NEH","damage":10,"energy":5,"element":"Éter","description":"O DataMon acerta um tapa no inimigo, causando dano."},
    "explosao-espacial":{"id":"explosao-espacial","name":"Explosão espacial","type":"HIB","damage":85,"energy":55,"element":"Astral","description":""},
    "explosao-estelar":{"id":"explosao-estelar","name":"Explosão Estelar","type":"EFT","damage":25,"energy":60,"element":"Astral / Ígnea","description":""},
    "explosao-raivosa":{"id":"explosao-raivosa","name":"Explosão Raivosa","type":"NEH","damage":80,"energy":60,"element":"Colossal / Ígnea","description":"Um golpe explosivo carregado de fúria que pode aumentar o ataque do usuário.\nEfeito: 30% de chance de aumentar o Ataque (+1 estágio)."},
    "explosao-venenosa":{"id":"explosao-venenosa","name":"Explosão Venenosa","type":"EFT","damage":30,"energy":40,"element":"Umbral","description":""},
    "fagulha-selvagem":{"id":"fagulha-selvagem","name":"Fagulha Selvagem","type":"NET","damage":20,"energy":35,"element":"Ígnea","description":""},
    "fitas-flamejantes":{"id":"fitas-flamejantes","name":"Fitas flamejantes","type":"EFT","damage":20,"energy":28,"element":"Ígnea","description":"Um golpe de cabeçada com suas fitas que causa uma queimadura de 3° grau ao encostar no alvo acertado, tendo a possibilidade de causar um efeito de status de (QUEIMANDO) por 3 turnos."},
    "fogo-estelar":{"id":"fogo-estelar","name":"Fogo estelar","type":"HIB","damage":55,"energy":65,"element":"Ígnea / Astral","description":""},
    "furia-berseker":{"id":"furia-berseker","name":"Fúria berseker","type":"OFS","damage":50,"energy":40,"element":"Ígnea","description":""},
    "furia-cosmica":{"id":"furia-cosmica","name":"Fúria Cósmica","type":"HIB","damage":40,"energy":35,"element":"Ígnea / Astral","description":""},
    "garra-de-eclipse":{"id":"garra-de-eclipse","name":"Garra de Eclipse","type":"NEH","damage":70,"energy":50,"element":"Umbral","description":"Garras etéreas atacam o inimigo, drenando um pouco do seu HP.\nEfeito: Recupera 30% do dano causado como HP."},
    "garras-de-aco":{"id":"garras-de-aco","name":"Garras de Aço","type":"NET","damage":20,"energy":30,"element":"Colossal","description":""},
    "golpe-de-gelo":{"id":"golpe-de-gelo","name":"Golpe de Gelo","type":"OFS","damage":30,"energy":40,"element":"Abissal","description":""},
    "golpe-do-demonio":{"id":"golpe-do-demonio","name":"Golpe do Demônio","type":"EFT","damage":16,"energy":23,"element":"Umbral / Ígnea","description":""},
    "golpe-metalico":{"id":"golpe-metalico","name":"Golpe Metálico","type":"OFS","damage":35,"energy":25,"element":"Éter / Colossal","description":""},
    "golpear":{"id":"golpear","name":"Golpear","type":"NET","damage":10,"energy":20,"element":"Éter","description":""},
    "grande-semente":{"id":"grande-semente","name":"Grande semente","type":"NET","damage":10,"energy":30,"element":"Vital","description":""},
    "grito-da-vitoria":{"id":"grito-da-vitoria","name":"Grito da Vitória","type":"NEH","damage":60,"energy":40,"element":"Halo / Tempestade","description":"Um grito poderoso que inspira aliados e intimida o inimigo.\nEfeito: Reduz o ataque do inimigo em 1 nível e aumenta o ataque do usuário em 1 nível."},
    "ilusao-cosmica":{"id":"ilusao-cosmica","name":"Ilusão Cósmica","type":"DEF","damage":0,"energy":40,"element":"Astral","description":""},
    "impacto-fantasmagorico":{"id":"impacto-fantasmagorico","name":"Impacto Fantasmagórico","type":"NEH","damage":40,"energy":50,"element":"Umbral / Astral","description":"O inimigo sente uma pressão mental, ficando confuso e enfraquecido.\nEfeito: Causa confusão e reduz o ataque do inimigo em 20% por 3 turnos."},
    "impacto-martelante":{"id":"impacto-martelante","name":"Impacto Martelante","type":"OFS","damage":65,"energy":50,"element":"Éter / Colossal","description":""},
    "impacto-relampago":{"id":"impacto-relampago","name":"Impacto Relâmpago","type":"NEH","damage":50,"energy":30,"element":"Tempestade / Éter","description":"Um golpe físico carregado com eletricidade."},
    "impacto-solido":{"id":"impacto-solido","name":"Impacto Sólido","type":"OFS","damage":40,"energy":30,"element":"Éter","description":""},
    "investida-aerea":{"id":"investida-aerea","name":"Investida Aérea","type":"OFS","damage":20,"energy":45,"element":"Éter / Halo","description":""},
    "investida-do-guardiao":{"id":"investida-do-guardiao","name":"Investida do Guardião","type":"DEF","damage":25,"energy":55,"element":"Éter","description":""},
    "investida-selvagem":{"id":"investida-selvagem","name":"Investida Selvagem","type":"NET","damage":40,"energy":20,"element":"Colossal / Éter","description":"O usuário avança contra o inimigo com força bruta."},
    "jato-gasoso":{"id":"jato-gasoso","name":"Jato Gasoso","type":"OFS","damage":20,"energy":25,"element":"Abissal","description":""},
    "lanca-de-chamas":{"id":"lanca-de-chamas","name":"Lança de Chamas","type":"NET","damage":20,"energy":25,"element":"Ígnea","description":""},
    "lustro-de-folhas":{"id":"lustro-de-folhas","name":"Lustro de Folhas","type":"DEF","damage":0,"energy":40,"element":"Vital / Éter","description":"O Datamon convoca folhas próximas e as entrelaça ao redor do próprio corpo, formando um manto natural que reflete energia elemental e amortece impactos mágicos.\nEfeito: Aumenta a Defesa Especial do Usuário por 3 turnos. Enquanto o efeito estiver ativo, qualquer ataque físico bem-sucedido destrói o manto, encerrando o efeito imediatamente."},
    "maldade-lunar":{"id":"maldade-lunar","name":"Maldade Lunar","type":"OFS","damage":30,"energy":50,"element":"Umbral","description":""},
    "manto-espectral":{"id":"manto-espectral","name":"Manto Espectral","type":"DEF","damage":0,"energy":50,"element":"Umbral","description":""},
    "manto-metalico":{"id":"manto-metalico","name":"Manto Metálico","type":"DEF","damage":0,"energy":40,"element":"Éter / Colossal","description":""},
    "mare-de-lama":{"id":"mare-de-lama","name":"Maré de Lama","type":"EFT","damage":20,"energy":40,"element":"Vital / Abissal","description":""},
    "martelo-geologico":{"id":"martelo-geologico","name":"Martelo Geológico","type":"NEH","damage":85,"energy":65,"element":"Colossal","description":"Um soco brutal carregado de força tectônica que pode diminuir a velocidade do oponente.\nEfeito: 30% de chance de reduzir a Velocidade (-1 estágio)."},
    "martelo-terrestre":{"id":"martelo-terrestre","name":"Martelo terrestre","type":"OFS","damage":95,"energy":80,"element":"Colossal","description":""},
    "menemenema":{"id":"menemenema","name":"Menemenema","type":"EFT","damage":0,"energy":40,"element":"Umbral","description":"O Datamon libera uma energia venenosa distorcida que contamina o fluxo vital do alvo, corrompendo efeitos restaurativos e transformando cura em sofrimento.\nEfeito: Causa dano especial do tipo Veneno e aplica Inversão Vital por 3 turnos. Enquanto o efeito estiver ativo, qualquer efeito de cura ou item restaurativo usado pelo alvo passa a causar dano equivalente ao valor que seria curado. (Item de remoção de envenenamento cura este Efeito)"},
    "mordida-de-feras":{"id":"mordida-de-feras","name":"Mordida de Feras","type":"NEH","damage":50,"energy":30,"element":"Umbral / Colossal","description":"Uma mordida feroz para ferir e intimidar."},
    "natureza-miseravel":{"id":"natureza-miseravel","name":"Natureza miserável","type":"HIB","damage":35,"energy":60,"element":"Umbral / Vital","description":""},
    "nebulosa-envenenada":{"id":"nebulosa-envenenada","name":"Nebulosa Envenenada","type":"EFT","damage":10,"energy":45,"element":"Umbral","description":""},
    "nocturnal-migue":{"id":"nocturnal-migue","name":"Nocturnal Migue","type":"NEH","damage":24,"energy":20,"element":"Tempestade / Éter","description":"Um truque sorrateiro realizado à noite, onde o DataMon libera uma descarga elétrica súbita enquanto se esconde nas sombras, pegando o oponente desprevenido.\nEfeito: O adversário fica temporariamente paralisado por 1d10 turnos."},
    "onda-sonora":{"id":"onda-sonora","name":"Onda Sonora","type":"NET","damage":20,"energy":45,"element":"Éter","description":""},
    "pancada-sombria":{"id":"pancada-sombria","name":"Pancada Sombria","type":"NEH","damage":45,"energy":25,"element":"Umbral / Éter","description":"Um ataque rápido que deixa um rastro de sombras."},
    "pele-rochosa":{"id":"pele-rochosa","name":"Pele Rochosa","type":"DEF","damage":0,"energy":40,"element":"Colossal","description":""},
    "pesadelo-profundo":{"id":"pesadelo-profundo","name":"Pesadelo Profundo","type":"HIB","damage":20,"energy":40,"element":"Umbral","description":""},
    "pisoteio-bravador":{"id":"pisoteio-bravador","name":"Pisoteio Bravador","type":"OFS","damage":40,"energy":60,"element":"Éter / Ígnea","description":""},
    "po-lunar":{"id":"po-lunar","name":"Pó lunar","type":"NEH","damage":0,"energy":60,"element":"Astral / Umbral","description":"Uma leve brisa cheia do pó da lua.\nEfeito: Transforma o peso do adversário em dano, sendo PP 1d5, P 1d10, M 1d20, G 1d40, GG 1d80, XGG 1d180."},
    "poco-de-nectar":{"id":"poco-de-nectar","name":"Poço de Néctar","type":"OFS","damage":50,"energy":45,"element":"Vital","description":""},
    "polen-ilusorio":{"id":"polen-ilusorio","name":"Pólen Ilusório","type":"NEH","damage":55,"energy":40,"element":"Vital / Umbral","description":"Lança um pólen psíquico no inimigo, podendo deixá-lo confuso.\nEfeito: 40% de chance de causar Confusão."},
    "presa-corrosiva":{"id":"presa-corrosiva","name":"Presa Corrosiva","type":"NEH","damage":60,"energy":45,"element":"Umbral","description":"Mordida tóxica que pode reduzir a Defesa e causar envenenamento.\nEfeito: 30% de chance de reduzir a Defesa (-1 estágio) e 20% de chance de envenenar."},
    "presa-gelida":{"id":"presa-gelida","name":"Presa Gélida","type":"NEH","damage":45,"energy":25,"element":"Geada / Éter","description":"O usuário morde o inimigo com presas congelantes."},
    "punho-da-gloria":{"id":"punho-da-gloria","name":"Punho da Glória","type":"OFS","damage":50,"energy":60,"element":"Colossal","description":""},
    "punho-venenoso":{"id":"punho-venenoso","name":"Punho Venenoso","type":"EFT","damage":20,"energy":25,"element":"Éter / Umbral","description":""},
    "queimadura-celeste":{"id":"queimadura-celeste","name":"Queimadura Celeste","type":"HIB","damage":75,"energy":65,"element":"Ígnea / Astral","description":""},
    "raio-da-desolacao":{"id":"raio-da-desolacao","name":"Raio da Desolação","type":"EFT","damage":25,"energy":65,"element":"Tempestade","description":""},
    "raiz-protetora":{"id":"raiz-protetora","name":"Raiz Protetora","type":"DEF","damage":0,"energy":90,"element":"Vital","description":""},
    "raizes-da-decadencia":{"id":"raizes-da-decadencia","name":"Raízes da Decadência","type":"EFT","damage":0,"energy":50,"element":"Vital","description":""},
    "rajada-aerea":{"id":"rajada-aerea","name":"Rajada Aérea","type":"NET","damage":20,"energy":25,"element":"Halo","description":""},
    "rajada-de-poeira":{"id":"rajada-de-poeira","name":"Rajada de Poeira","type":"NET","damage":36,"energy":15,"element":"Éter","description":""},
    "rastro-de-fumaca":{"id":"rastro-de-fumaca","name":"Rastro de Fumaça","type":"EFT","damage":0,"energy":25,"element":"Abissal","description":""},
    "ressonancia-ancia":{"id":"ressonancia-ancia","name":"Ressonância Anciã","type":"EFT","damage":15,"energy":30,"element":"Éter","description":""},
    "roubar-habilidade":{"id":"roubar-habilidade","name":"Roubar Habilidade","type":"EFT","damage":0,"energy":40,"element":"Umbral / Éter","description":"Com astúcia e sombras, o DataMon imita os movimentos do inimigo e assume temporariamente uma de suas técnicas.\nEfeito: Você rouba uma habilidade do DataMon adversário e pode usá-la por 1 turno."},
    "rugido-celestial":{"id":"rugido-celestial","name":"Rugido Celestial","type":"NEH","damage":65,"energy":40,"element":"Tempestade / Halo","description":"Emite um rugido ensurdecedor que causa dano e reduz o Ataque Especial do oponente.\nEfeito: Reduz o Sp. Atk do alvo (-1 estágio)."},
    "rugido-de-vitoria":{"id":"rugido-de-vitoria","name":"Rugido de Vitória","type":"NEH","damage":0,"energy":40,"element":"Halo / Éter","description":"O datamon solta um uivo poderoso que inspira aliados e intimida inimigos.\nEfeito: Aumenta o Ataque e a Defesa de aliados em 1 estágio e reduz o Ataque dos inimigos próximos."},
    "rugido-elemental":{"id":"rugido-elemental","name":"Rugido Elemental","type":"OFS","damage":40,"energy":50,"element":"Éter / Ígnea","description":""},
    "rugido-primordial":{"id":"rugido-primordial","name":"Rugido primordial","type":"DEF","damage":10,"energy":40,"element":"Colossal / Astral","description":""},
    "salto-ardente":{"id":"salto-ardente","name":"Salto Ardente","type":"HIB","damage":80,"energy":45,"element":"Ígnea / Tempestade","description":"Ele pula com agilidade, girando no ar e liberando chamas em volta antes de aterrissar com um chute poderoso.\nEfeito: Aumenta a Velocidade em 1 estágio após o ataque."},
    "soco-rochoso":{"id":"soco-rochoso","name":"Soco Rochoso","type":"OFS","damage":50,"energy":30,"element":"Éter / Colossal","description":""},
    "static-breakdance":{"id":"static-breakdance","name":"Static Breakdance","type":"NEH","damage":0,"energy":35,"element":"Tempestade / Colossal","description":"O usuário realiza uma dança acelerada com descargas elétricas, aumentando sua velocidade momentaneamente e carregando energia para um golpe mais forte.\nEfeito: Aumenta a Velocidade do usuário em +1 e carrega eletricidade, não acumulativo. O próximo ataque do usuário do tipo Elétrico causará 50% mais dano, mas, após o ataque, sua velocidade será reduzida em -2."},
    "sugar-nectar":{"id":"sugar-nectar","name":"Sugar néctar","type":"NEH","damage":0,"energy":50,"element":"Vital / Umbral","description":"O amor pelo néctar das plantas, bebendo o doce suco da vida.\nEfeito: O datamon drena 20% da força vital do oponente."},
    "tapa-molhado":{"id":"tapa-molhado","name":"Tapa molhado","type":"NET","damage":10,"energy":5,"element":"Abissal / Éter","description":"Desfere um golpe úmido contra o alvo.\nEfeito: O oponente fica com status de MOLHADO por 4 turnos."},
    "tempestade-psiquica":{"id":"tempestade-psiquica","name":"Tempestade Psíquica","type":"EFT","damage":40,"energy":45,"element":"Tempestade / Astral","description":""},
    "tempo-quente":{"id":"tempo-quente","name":"Tempo Quente","type":"NEH","damage":50,"energy":60,"element":"Ígnea / Éter","description":"Um golpe que aquece o ambiente ao redor, deixando o oponente exposto ao calor extremo.\nEfeito: O alvo entra no estado \"Queimando\", sofrendo dano contínuo por 3 turnos."},
    "tiros-disparados":{"id":"tiros-disparados","name":"Tiros disparados","type":"NET","damage":15,"energy":40,"element":"Éter","description":""},
    "toque-de-ferrugem":{"id":"toque-de-ferrugem","name":"Toque de Ferrugem","type":"EFT","damage":0,"energy":45,"element":"Umbral","description":""},
    "tornado-de-nectar":{"id":"tornado-de-nectar","name":"Tornado de Néctar","type":"NEH","damage":35,"energy":50,"element":"Vital / Tempestade","description":"Um tornado de néctar que afeta todos os inimigos no campo.\nEfeito: Causa dano a todos os inimigos e reduz a precisão deles."},
    "tornado-estatico":{"id":"tornado-estatico","name":"Tornado Estático","type":"NEH","damage":75,"energy":55,"element":"Tempestade","description":"Uma rajada de vento eletrificado envolve o oponente e pode paralisá-lo.\nEfeito: 20% de chance de paralisar o alvo."},
    "tornado-venenoso":{"id":"tornado-venenoso","name":"Tornado venenoso","type":"EFT","damage":15,"energy":50,"element":"Umbral","description":""},
    "torrente-de-ambar":{"id":"torrente-de-ambar","name":"Torrente de âmbar","type":"NET","damage":10,"energy":10,"element":"Vital","description":""},
    "veneno-asfixiante":{"id":"veneno-asfixiante","name":"Veneno Asfixiante","type":"HIB","damage":40,"energy":35,"element":"Ígnea / Vital","description":""},
    "vento-cortante":{"id":"vento-cortante","name":"Vento Cortante","type":"OFS","damage":25,"energy":20,"element":"Halo / Éter","description":""},
    "veu-do-pantano":{"id":"veu-do-pantano","name":"Véu do Pântano","type":"DEF","damage":0,"energy":30,"element":"Abissal","description":""},
    "veu-sonoro":{"id":"veu-sonoro","name":"Véu Sonoro","type":"EFT","damage":0,"energy":40,"element":"Astral","description":""},
    "vibracao-harmonica":{"id":"vibracao-harmonica","name":"Vibração Harmônica","type":"EFT","damage":0,"energy":55,"element":"Astral","description":""},
    "visao-infernal":{"id":"visao-infernal","name":"Visão Infernal","type":"NEH","damage":20,"energy":60,"element":"Umbral / Vital","description":"Um olhar aterrorizante que paralisa e drena energia.\nEfeito: Causa paralisia e drena 10 de energia do inimigo por 3 turnos."},
    "voo-determinado":{"id":"voo-determinado","name":"Voo determinado","type":"OFS","damage":30,"energy":45,"element":"Halo","description":""},
    "vortice-espiritual":{"id":"vortice-espiritual","name":"Vórtice Espiritual","type":"HIB","damage":60,"energy":40,"element":"Tempestade / Umbral","description":""}
  },
  storySheets:[],
  savedRelianSheets:[],
  relians:[
    {id:'porppge',catalogNumber:1,name:'Porppge',class:'NET',rarity:'comum',captureRate:40,baseAffinity:2,elements:['Éter'],stage:1,baseEnergy:85,images:{basic:'basic.png',shiny:'shiny.png',special:'especial.png'},genders:['Macho','Fêmea'],sizes:['P'],traitIds:['pes-ligeiros','corpo-vigoroso'],learnset:[{level:1,moveId:'golpear'},{level:8,moveId:'passo-etereo'},{level:15,moveId:'choque-etereo'}],encounters:[{region:'ruinas-azuis',biome:'campo',periods:['manha','tarde'],minLevel:10,maxLevel:18,weight:50},{region:'vale-lumen',biome:'floresta',periods:['manha','tarde'],minLevel:1,maxLevel:20,weight:60}]},
    {id:'lumifera',catalogNumber:2,name:'Lumifera',class:'EFT',rarity:'incomum',captureRate:30,baseAffinity:2,elements:['Vital'],stage:1,baseEnergy:92,images:{basic:'basic.png',shiny:'shiny.png',special:'especial.png'},genders:['Fêmea','Macho'],sizes:['P','M'],traitIds:['corpo-vigoroso'],learnset:[{level:1,moveId:'golpear'}],encounters:[{region:'vale-lumen',biome:'floresta',periods:['noite'],minLevel:8,maxLevel:22,weight:35}]}
  ]
};
let data=loadData();
let selectedSavedSheetId=''; // ficha selecionada no Banco de Fichas; precisa existir antes de qualquer render/sincronização
let linkedDirectory=null,folderSignature='',syncTimer=null;
let folderWriteQueue=Promise.resolve(),folderWriteInProgress=false,lastFolderWriteAt=0,folderSyncDebounceTimer=null;

function normalizeRarityId(value){
  const raw=String(value||'comum').trim().toLowerCase();
  const clean=raw.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[_-]+/g,' ').replace(/\s+/g,' ').trim();
  if(clean==='lendario especial')return 'unico';
  if(clean==='unico')return 'unico';
  return raw;
}

function migrateRelianRecord(raw={}){
  const normalized=normalizeRelian(raw);
  return {
    ...raw,
    ...normalized,
    saveVersion:SAVE_SCHEMA_VERSION,
    description:String(raw.description||raw.descricao||normalized.description||''),
    elements:Array.isArray(normalized.elements)?normalized.elements.filter(Boolean):[],
    specialElements:Array.isArray(normalized.specialElements)?normalized.specialElements.filter(Boolean):[],
    traitIds:Array.isArray(normalized.traitIds)?normalized.traitIds:[],
    learnset:Array.isArray(normalized.learnset)?normalized.learnset:[],
    encounters:Array.isArray(normalized.encounters)?normalized.encounters:[],
    images:{basic:'',shiny:'',special:'',...(normalized.images||{}),...(raw.images||{})},
    imageDataByColor:{...(raw.imageDataByColor||{})}
  };
}
function migrateMoveRecord(raw={}){
  const normalized=normalizeMove(raw);
  return {...raw,...normalized,saveVersion:SAVE_SCHEMA_VERSION,effects:Array.isArray(normalized.effects)?normalized.effects:[],tags:Array.isArray(normalized.tags)?normalized.tags:[]};
}
function migrateSavedRelianSheet(raw={}){
  return {
    ...raw,
    saveVersion:SAVE_SCHEMA_VERSION,
    id:String(raw.id||raw.uid||`relian-${Date.now().toString(36)}`),
    speciesId:String(raw.speciesId||raw.relianId||''),
    speciesName:String(raw.speciesName||raw.name||raw.nome||''),
    nickname:String(raw.nickname||raw.apelido||''),
    level:Math.max(1,Number(raw.level??raw.nivel??1)||1),
    color:normalizeColorId(raw.color||raw.coloracao||'basic'),
    rarity:normalizeRarityId(raw.rarity||raw.raridade||'comum'),
    originalTrainer:String(raw.originalTrainer||raw.treinadorOriginal||''),
    items:Array.isArray(raw.items)?raw.items:[],
    moves:Array.isArray(raw.moves)?raw.moves:[],
    attrs:raw.attrs&&typeof raw.attrs==='object'?raw.attrs:{},
    notes:String(raw.notes||raw.anotacoes||'')
  };
}
function migrateStorySheetRecord(raw={}){
  const type=raw.type==='relian'?'relian':'character';
  const migrated={...raw,saveVersion:SAVE_SCHEMA_VERSION,type,id:String(raw.id||`${type}-${Date.now().toString(36)}`)};
  if(type==='character'){
    const character={...(raw.character||raw.trainer||{})};
    character.name=String(character.name||character.nome||'');
    character.team=Array.isArray(character.team)?character.team:[];
    const validTeamIds=new Set(character.team.map(member=>String(member?.savedSheetId||'')).filter(Boolean));
    character.equippedRelianIds=(Array.isArray(character.equippedRelianIds)?character.equippedRelianIds:Array.isArray(character.equippedTeam)?character.equippedTeam:character.team.map(member=>member?.savedSheetId).filter(Boolean).slice(0,7)).map(String).filter((id,index,list)=>id&&validTeamIds.has(id)&&list.indexOf(id)===index).slice(0,7);
    character.items=Array.isArray(character.items)?character.items:[];
    character.backpack=(Array.isArray(character.backpack)?character.backpack:Array.isArray(character.mochila)?character.mochila:[]).map(item=>({name:String(item?.name||item?.nome||''),description:String(item?.description||item?.descricao||'')}));
    character.notes=String(character.notes||character.anotacoes||'');
    migrated.character=character;
    delete migrated.trainer;
  }else{
    migrated.relian={...(raw.relian||{}),items:Array.isArray(raw.relian?.items)?raw.relian.items:[],moves:Array.isArray(raw.relian?.moves)?raw.relian.moves:[]};
  }
  return migrated;
}
function runSaveMigrations(raw){
  const working=raw&&typeof raw==='object'?clone(raw):{};
  let version=Number(working.saveVersion||0);
  // Migração 0 -> 1: padroniza coleções e adiciona campos que versões antigas podem não possuir.
  if(version<1){
    working.relians=Array.isArray(working.relians)?working.relians.map(migrateRelianRecord):[];
    working.savedRelianSheets=Array.isArray(working.savedRelianSheets)?working.savedRelianSheets.map(migrateSavedRelianSheet):[];
    working.storySheets=Array.isArray(working.storySheets)?working.storySheets.map(migrateStorySheetRecord):[];
    if(working.moves&&typeof working.moves==='object')working.moves=Object.fromEntries(Object.entries(working.moves).map(([id,m])=>[id,migrateMoveRecord(m)]));
    version=1;
  }
  working.saveVersion=SAVE_SCHEMA_VERSION;
  return working;
}
function migrateData(raw){
  const migrated=runSaveMigrations(raw);
  const out={...clone(defaultData),...migrated,saveVersion:SAVE_SCHEMA_VERSION};
  out.rules={...clone(defaultData.rules),...(migrated?.rules||{})};
  out.traits={...clone(defaultData.traits),...(migrated?.traits||{})};
  const mergeOfficialEntities=(saved,official)=>{const result=Array.isArray(saved)?saved.map(x=>({...x})):[];for(const base of official){const idx=result.findIndex(x=>x.id===base.id);if(idx>=0)result[idx]={...base,...result[idx],elements:Array.isArray(result[idx].elements)&&result[idx].elements.length?result[idx].elements:base.elements};else result.push(clone(base))}return result};
  out.regions=mergeOfficialEntities(migrated?.regions,defaultData.regions);out.biomes=mergeOfficialEntities(migrated?.biomes,defaultData.biomes);
  if(migrated?.rules?.rareChance!=null&&migrated?.rules?.shinyChance==null)out.rules.shinyChance=Number(migrated.rules.rareChance)||0;
  out.rules.specialChance=Number(out.rules.specialChance||0);
  out.storySheets=Array.isArray(migrated?.storySheets)?migrated.storySheets.map(migrateStorySheetRecord):[];
  out.savedRelianSheets=Array.isArray(migrated?.savedRelianSheets)?migrated.savedRelianSheets.map(migrateSavedRelianSheet):[];
  out.relians=(Array.isArray(migrated?.relians)?migrated.relians:[]).map(migrateRelianRecord);
  if(migrated?.moves&&typeof migrated.moves==='object')out.moves=Object.fromEntries(Object.entries(migrated.moves).map(([id,m])=>[id,migrateMoveRecord(m)]));
  return out;
}
function loadData(){
  try{
    const stored=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');
    const migrated=migrateData(stored);
    // Grava imediatamente o formato novo para que a migração só seja necessária uma vez.
    localStorage.setItem(STORAGE_KEY,JSON.stringify(migrated));
    return migrated;
  }catch{
    return migrateData(clone(defaultData));
  }
}
function saveData({sync=true}={}){data=migrateData(data);localStorage.setItem(STORAGE_KEY,JSON.stringify(data));renderAll();if(sync)queueFullFolderSync('saveData')}
function nameOf(list,id){return list.find(x=>x.id===id)?.name||id}
function fillSelect(select,items){const old=select.value;select.innerHTML=items.map(x=>`<option value="${esc(x.id)}">${esc(x.name)}</option>`).join('');if(items.some(x=>x.id===old))select.value=old}
const RELIANS_PAGE_CONTEXT={
  generator:{category:'Fichas',title:'Gerar Relian'},story:{category:'Fichas',title:'Criar Ficha'},sheetbank:{category:'Fichas',title:'Banco de Fichas'},
  catalog:{category:'Catálogo',title:'Catálogo de Relians'},relians:{category:'Criação',title:'Criar Relian'},moves:{category:'Criação',title:'Criar Movimento'},
  biomes:{category:'Criação',title:'Mundo'},creators:{category:'Comunidade',title:'Criadores'},rules:{category:'Config',title:'Regras e Modificadores'}
};
function updatePageContext(tabId){const info=RELIANS_PAGE_CONTEXT[String(tabId)]||{category:'Relians',title:String(tabId||'')};const c=el('pageContextCategory'),t=el('pageContextTitle');if(c)c.textContent=info.category;if(t)t.textContent=info.title}
function setupTabs(){
  const nav=document.querySelector('.relians-main-nav');
  const menus=[...document.querySelectorAll('.nav-menu')];
  const groupTabs={
    creation:['relians','moves','biomes'],
    sheets:['generator','story','sheetbank'],
    community:['creators'],
    config:['rules']
  };

  const closeMenus=(except=null)=>{
    menus.forEach(menu=>{
      if(menu===except)return;
      menu.classList.remove('open');
      menu.querySelector('.nav-menu-trigger')?.setAttribute('aria-expanded','false');
    });
  };

  const syncNavState=(tabId,clickedButton=null)=>{
    updatePageContext(tabId);
    document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
    document.querySelectorAll('.nav-menu').forEach(x=>x.classList.remove('active-group'));

    if(clickedButton)clickedButton.classList.add('active');
    else document.querySelector(`.tab[data-tab="${CSS.escape(String(tabId))}"]`)?.classList.add('active');

    const clickedMenu=clickedButton?.closest?.('.nav-menu');
    if(clickedMenu){
      clickedMenu.classList.add('active-group');
    }else{
      Object.entries(groupTabs).forEach(([group,tabs])=>{
        if(tabs.includes(String(tabId))){
          document.querySelector(`.nav-menu[data-nav-group="${group}"]`)?.classList.add('active-group');
        }
      });
    }
  };

  const openTab=(button)=>{
    const tabId=button?.dataset?.tab;
    if(!tabId||!el(tabId))return;
    document.querySelectorAll('.tab-panel').forEach(x=>x.classList.remove('active'));
    el(tabId).classList.add('active');
    syncNavState(tabId,button);
    closeMenus();
    if(window.innerWidth<760)window.scrollTo({top:0,behavior:'smooth'});
  };

  document.querySelectorAll('.tab[data-tab]').forEach(button=>{
    button.addEventListener('click',()=>openTab(button));
  });

  menus.forEach(menu=>{
    const trigger=menu.querySelector('.nav-menu-trigger');
    if(!trigger)return;
    trigger.addEventListener('click',(event)=>{
      event.stopPropagation();
      const willOpen=!menu.classList.contains('open');
      closeMenus(menu);
      menu.classList.toggle('open',willOpen);
      trigger.setAttribute('aria-expanded',willOpen?'true':'false');
    });
  });

  document.addEventListener('click',event=>{
    if(!event.target.closest('.nav-menu'))closeMenus();
  });
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape')closeMenus();
  });

  // Mantém o grupo correto destacado quando a página inicia.
  const current=document.querySelector('.tab-panel.active')?.id||'generator';
  syncNavState(current,document.querySelector(`.nav-main-link[data-tab="${CSS.escape(current)}"]`));
}
function renderAll(){fillSelect(el('genRegion'),data.regions);fillSelect(el('genBiome'),data.biomes);fillSelect(el('biomeOverviewSelect'),data.biomes);renderEligible();renderRelians();renderCatalog();renderRegionBiomeLists();renderBiomeOverview();renderRules();renderMoves();refreshEncounterSelects();refreshLearnsetMoveOptions();renderStorySheets();renderSavedRelianSheets();renderSavedSheetDetail();refreshStoryOptions();refreshEvolutionOptions()}

function eligibleEntries(){
  const region=el('genRegion').value,biome=el('genBiome').value,period=el('genPeriod').value,min=+el('genMinLevel').value,max=+el('genMaxLevel').value;
  const out=[];for(const r of data.relians)for(const e of r.encounters||[]){const lo=Math.max(min,e.minLevel),hi=Math.min(max,e.maxLevel);if(e.region===region&&e.biome===biome&&e.periods.includes(period)&&lo<=hi)out.push({r,e,lo,hi})}return out;
}
function renderEligible(){const list=eligibleEntries();el('eligibleList').innerHTML=list.length?list.map(x=>`<div><span><b>#${catalogCode(x.r)||'—'} ${esc(x.r.name)}</b><small>${esc(x.r.class)} · ${esc(x.r.elements.join(', '))} · ${RARITY_NAMES[x.r.rarity]||'Comum'}</small></span><small>Nv. ${x.lo}–${x.hi}<br>Peso ${x.e.weight}</small></div>`).join(''):'<p class="empty">Nenhum Relian corresponde aos filtros.</p>'}
['genRegion','genBiome','genPeriod','genMinLevel','genMaxLevel'].forEach(id=>el(id).addEventListener('input',renderEligible));
function weightedPick(entries){const total=entries.reduce((s,x)=>s+(+x.e.weight||1),0);let n=Math.random()*total;for(const x of entries){n-=+x.e.weight||1;if(n<=0)return x}return entries.at(-1)}
function rollAttribute(){return rand(data.rules.attrMin,data.rules.attrMax)}
function calcModifier(v){const {attrMin,attrMax,modMin,modMax}=data.rules;if(attrMax===attrMin)return 0;return Math.round(modMin+((v-attrMin)/(attrMax-attrMin))*(modMax-modMin))}
function domainFor(level,unlock){const max=Math.min(20,Math.max(1,1+Math.floor((level-unlock)*0.8)));return rand(1,max)}
function domainDisplay(value){if(value<=5)return{stage:'Conhecimento',symbols:'○○○○○',progress:`${value}/5`};if(value<=10){const n=value-5;return{stage:'Aprendizado',symbols:'●'.repeat(n)+'○'.repeat(5-n),progress:`${n}/5`}}if(value<=15){const n=value-10;return{stage:'Perícia',symbols:'★'.repeat(n)+'☆'.repeat(5-n),progress:`${n}/5`}}const n=Math.min(5,value-15);return{stage:'Mestria',symbols:'★'.repeat(n)+'☆'.repeat(5-n),progress:`${n}/5`}}
function rollColor(){const roll=Math.random()*100,special=Math.max(0,+data.rules.specialChance||0),shiny=Math.max(0,+data.rules.shinyChance||0);if(roll<special)return{id:'special',name:'Especial Color'};if(roll<special+shiny)return{id:'shiny',name:'Shiny Color'};return{id:'basic',name:'Basic Color'}}
function calculateRelianResources(level,trait=null){
  const safeLevel=Math.max(1,Math.floor(Number(level)||1));
  const hpBonus=Number(trait?.mods?.hp||0);
  const engBonus=Number(trait?.mods?.energia||0);
  const hpBase=Number(data.rules?.baseHp??100);
  const engBase=Number(data.rules?.baseEnergy??65);
  const hpGrowth=safeLevel>=5?(safeLevel-4)*5:0;
  const engGrowth=safeLevel>=10?Math.floor(safeLevel/5-1)*5:0;
  return{hp:hpBase+hpBonus+hpGrowth,energy:engBase+engBonus+engGrowth};
}
function makeGenerated(entry){
  const r=entry.r,level=rand(entry.lo,entry.hi),trait=data.traits[pick(Object.keys(data.traits))]||null,attrs={};
  for(const k of ATTR_KEYS){const rolled=rollAttribute();attrs[k]={rolled,trait:+(trait?.mods?.[k]||0)};attrs[k].total=rolled+attrs[k].trait;attrs[k].modifier=calcModifier(attrs[k].total)}
  const calculatedResources=calculateRelianResources(level,trait);
  const hp=calculatedResources.hp;
  const energy=calculatedResources.energy;
  const moves=(r.learnset||[]).filter(x=>x.level<=level).sort((a,b)=>b.level-a.level).slice(0,data.rules.moveLimit).map(x=>({unlock:x.level,move:data.moves[x.moveId],domain:domainFor(level,x.level)})).filter(x=>x.move);
  return{uid:crypto.randomUUID?.()||String(Date.now()+Math.random()),r,level,trait,attrs,hp,energy,currentHp:hp,currentEnergy:energy,moves,gender:pick(r.genders),size:pick(r.sizes),color:rollColor(),affinity:Math.max(0,Math.min(5,Number(r.baseAffinity??2))),captureCube:'padrao',negativeStatus:false,captureRoll:null,captureResult:''};
}
function isUsableDirectImageSource(value){return /^(?:data:|blob:|https?:|file:|\/)/i.test(String(value||'').trim())}
function relianImageFolderPath(r){
  const explicit=String(r?._sourceFolder||r?.sourceFolder||'').replace(/\\/g,'/').replace(/^\/+|\/+$/g,'');
  if(explicit){
    if(/^Pasta_Relians\//i.test(explicit))return explicit;
    return `Pasta_Relians/${explicit}`;
  }
  return `Pasta_Relians/${relianFolderName(r)}`;
}
function relianRelativeImagePath(r,fileName){
  const raw=String(fileName||'').trim().replace(/\\/g,'/');
  if(!raw)return'';
  if(isUsableDirectImageSource(raw))return raw;
  // Se o JSON já trouxer um caminho relativo completo, respeita esse caminho.
  if(raw.includes('/'))return raw.replace(/^\.\//,'');
  // O formato oficial guarda apenas o nome do arquivo no relian.json.
  // Portanto a arte deve ser procurada dentro da própria pasta catalogada do Relian.
  return `${relianImageFolderPath(r)}/${raw}`;
}
function resolveRelianImage(r,colorId='basic'){
  const color=normalizeColorId(colorId);
  const loaded=r?.imageDataByColor||{};
  // Imagens carregadas durante a sincronização da pasta têm prioridade.
  const synced=loaded[color]||loaded.basic||r?.imageData||'';
  if(synced)return synced;

  // Para a versão GitHub/HTML, nomes como "skellywag-b.png" precisam ser
  // transformados em "Pasta_Relians/028_Skellywag/skellywag-b.png".
  const raw=r?.images?.[color]||r?.images?.basic||r?.image||'';
  return relianRelativeImagePath(r,raw);
}
function resolveImage(g){return resolveRelianImage(g.r,g.color.id)}
function resourceBox(uid,type,label,current,max){const pct=max>0?Math.max(0,Math.min(100,current/max*100)):0,icon=type==='energy'?'⚡':'♥';return `<div class="resource-box ${type==='energy'?'eng':''}" data-resource="${type}"><div class="resource-title"><span class="resource-label"><span class="resource-icon">${icon}</span>${label}</span></div><div class="resource-value"><span class="resource-current">${current}</span><span class="resource-divider">/</span><span class="resource-max">${max}</span></div><div class="resource-track"><div class="resource-fill" style="width:${pct}%"></div></div><div class="resource-controls"><button type="button" data-uid="${uid}" data-resource-action="current" data-resource="${type}" data-delta="-5">−5</button><button type="button" data-uid="${uid}" data-resource-action="current" data-resource="${type}" data-delta="-1">−1</button><button type="button" data-uid="${uid}" data-resource-action="current" data-resource="${type}" data-delta="1">+1</button><button type="button" data-uid="${uid}" data-resource-action="current" data-resource="${type}" data-delta="5">+5</button><button type="button" title="Diminuir máximo" data-uid="${uid}" data-resource-action="max" data-resource="${type}" data-delta="-1">Máx −</button><button type="button" title="Aumentar máximo" data-uid="${uid}" data-resource-action="max" data-resource="${type}" data-delta="1">Máx +</button></div></div>`}
const RARITY_NAMES={comum:'Comum',incomum:'Incomum',raro:'Raro',lendario:'Lendário',mitico:'Mítico',unico:'Único'};
const RARITY_BASE={comum:40,incomum:30,raro:20,lendario:5,mitico:2,unico:1};
function rarityEffectHtml(rarity,scope='sheet'){
  const configs={
    raro:{symbols:['✦','•','✧'],count:14},
    lendario:{symbols:['✦','◆','✧'],count:18},
    mitico:{symbols:['✧','✦','◈'],count:20},
    unico:{symbols:['✦','◆','✧','◈'],count:22}
  };
  const cfg=configs[rarity];
  if(!cfg)return'';
  const xs=[7,82,24,61,44,93,15,72,35,54,88,29,66,11,77,49,96,20,58,39,70,4];
  const sizes=[7,11,6,9,8,6,12,7,10,6,8,11,6,9,7,12,8,6,10,7,11,5];
  const durations=[5.6,7.2,6.4,5.9,7.7,6.8,5.3,7.5,6.1,5.7,7.1,6.5,6.0,7.9,6.2,5.4,7.4,6.7,5.8,7.0,6.3,5.5];
  const delays=[-1.2,-5.9,-3.3,-6.7,-2.5,-4.8,-.6,-7.2,-4.0,-1.9,-5.2,-6.1,-3.0,-7.6,-4.4,-1.0,-6.5,-2.2,-5.6,-3.7,-7.0,-.3];
  const drifts=[-10,12,6,-7,14,-5,9,-12,5,11,-8,7,-14,10,-6,13,-9,4,12,-11,8,-4];
  const particles=Array.from({length:cfg.count},(_,i)=>`<span style="--x:${xs[i]}%;--size:${sizes[i]}px;--duration:${durations[i]}s;--delay:${delays[i]}s;--drift:${drifts[i]}px">${cfg.symbols[i%cfg.symbols.length]}</span>`).join('');
  return `<div class="rarity-visual-effects rarity-fx-${rarity} rarity-fx-${scope}" aria-hidden="true">${particles}</div>`;
}
const CUBES={padrao:{name:'Datacubo Padrão',bonus:0},avancado:{name:'Datacubo Avançado',bonus:10},superior:{name:'Datacubo Superior',bonus:20},experimental:{name:'Datacubo Experimental',bonus:40},especializado:{name:'Datacubo Especializado',bonus:30},datacorrect:{name:'DataCorrect',bonus:25},content:{name:'Content',bonus:30},ambar:{name:'Datacubo Âmbar',bonus:25},dataprisma:{name:'DataPrisma',bonus:100}};
function affinityMood(v){if(v<=1)return{emoji:'😠',label:'Muito irritado'};if(v<=2)return{emoji:'😐',label:'Neutro'};if(v<=3)return{emoji:'🙂',label:'Levemente feliz'};if(v<=4)return{emoji:'😄',label:'Feliz'};return{emoji:'🤩',label:'Muito feliz'}}
function captureBreakdown(g){const hpPct=g.hp?g.currentHp/g.hp*100:100;let hpBonus=hpPct<=10?20:hpPct<=30?10:0;let cube=CUBES[g.captureCube]||CUBES.padrao;let cubeBonus=cube.bonus;if(g.captureCube==='dataprisma'&&(['lendario','mitico','unico'].includes(g.r.rarity)))cubeBonus=0;const statusBonus=g.negativeStatus?15:0,affinityBonus=g.affinity>=4.1?10:0,base=Number(g.r.captureRate??RARITY_BASE[g.r.rarity]??40);const automatic=g.captureCube==='dataprisma'&&!['lendario','mitico','unico'].includes(g.r.rarity);const total=automatic?100:Math.max(0,Math.min(100,base+cubeBonus+hpBonus+statusBonus+affinityBonus));return{base,cube,cubeBonus,hpBonus,statusBonus,affinityBonus,total,automatic,hpPct}}
function capturePanel(g){const c=captureBreakdown(g),m=affinityMood(g.affinity);return `<section class="sheet-section"><div class="sheet-section-title">CAPTURA E AFINIDADE</div><div class="sheet-section-content capture-panel"><div class="capture-summary"><div class="capture-chance-card"><span class="capture-card-label">CHANCE FINAL</span><b class="capture-rate">${c.total.toFixed(1)}%</b><small>Resultado necessário no 1d100</small></div><div class="affinity-display"><div class="affinity-main"><span class="affinity-emoji">${m.emoji}</span><div><b>${g.affinity.toFixed(1)} / 5,0</b><small>${m.label}</small></div></div><div class="affinity-adjustments"><span>Ajustar afinidade</span><div><button type="button" data-affinity-delta="-0.5" data-uid="${g.uid}">−0,5</button><button type="button" data-affinity-delta="-0.1" data-uid="${g.uid}">−0,1</button><button type="button" data-affinity-delta="0.1" data-uid="${g.uid}">+0,1</button><button type="button" data-affinity-delta="0.5" data-uid="${g.uid}">+0,5</button></div></div></div></div><div class="capture-controls"><label>Datacubo<select data-capture-control="cube" data-uid="${g.uid}">${Object.entries(CUBES).map(([id,x])=>`<option value="${id}" ${g.captureCube===id?'selected':''}>${x.name}</option>`).join('')}</select></label><label class="check-control"><input type="checkbox" data-capture-control="status" data-uid="${g.uid}" ${g.negativeStatus?'checked':''}> Status negativo (+15%)</label></div><div class="capture-formula"><span>Base ${c.base}%</span><span>Cubo +${c.cubeBonus}%</span><span>Vida +${c.hpBonus}%</span><span>Status +${c.statusBonus}%</span><span>Afinidade +${c.affinityBonus}%</span></div><button type="button" class="primary capture-roll-btn" data-capture-roll="1" data-uid="${g.uid}">Rolar captura (1d100)</button>${g.captureRoll!=null?`<div class="capture-result ${g.captureResult==='Capturado!'?'success':'failure'}"><b>Resultado: ${g.captureRoll}</b><span>${g.captureResult}</span></div>`:''}</div></section>`}
const generatedState=new Map();

/* Banco de fichas — utilitários que haviam ficado ausentes após a reorganização
   das versões mobile/banco. Sem estas funções, clicar numa ficha de Relian
   interrompia renderSavedSheetDetail() com ReferenceError e o botão
   "Salvar ficha" do Gerador também não executava. */
function savedSheetParticles(colorId='basic'){
  const color=normalizeColorId(colorId);
  if(color!=='shiny'&&color!=='special')return '';
  const xs=[8,74,31,56,17,88,43,65,24,79,51,12,93,37,69,21,60,84];
  const sizes=[8,12,7,10,9,6,13,8,11,7,9,12,6,10,8,13,7,11];
  const durations=[5.4,7.1,6.2,5.8,7.6,6.7,5.2,7.4,6.0,5.6,7.0,6.4,5.9,7.8,6.1,5.3,7.2,6.6];
  const delays=[-1.1,-5.8,-3.2,-6.6,-2.4,-4.7,-0.5,-7.1,-3.9,-1.8,-5.1,-6.0,-2.9,-7.5,-4.3,-0.9,-5.5,-3.5];
  const drifts=[-10,12,6,-7,14,-5,9,-12,5,11,-8,7,-14,10,-6,13,-9,4];
  const particles=xs.map((x,i)=>`<span style="--x:${x}%;--size:${sizes[i]}px;--duration:${durations[i]}s;--delay:${delays[i]}s;--drift:${drifts[i]}px">${color==='shiny'?(i%3===0?'✦':'◆'):'✦'}</span>`).join('');
  return `<div class="portrait-particles ${color}" aria-hidden="true">${particles}</div>`;
}

function saveGeneratedRelianSheet(g){
  if(!g||!g.r)return;
  const moveIds=(g.moves||[]).map(entry=>entry?.move?.id).filter(Boolean);
  const attributes={};
  for(const key of ATTR_KEYS)attributes[key]=Number(g.attrs?.[key]?.total??g.attrs?.[key]?.rolled??0)||0;
  const now=Date.now();
  const id=`relian-${now.toString(36)}-${Math.random().toString(36).slice(2,7)}`;
  const sheet=migrateSavedRelianSheet({
    id,
    speciesId:String(g.r.id||''),
    speciesName:String(g.r.name||''),
    nickname:String(g.r.name||''),
    level:Math.max(1,Number(g.level)||1),
    color:normalizeColorId(g.color?.id||'basic'),
    rarity:normalizeRarityId(g.r.rarity||'comum'),
    gender:String(g.gender||''),
    size:String(g.size||''),
    hpCurrent:Math.max(0,Number(g.currentHp)||0),
    hpMax:Math.max(1,Number(g.hp)||1),
    engCurrent:Math.max(0,Number(g.currentEnergy)||0),
    engMax:Math.max(1,Number(g.energy)||1),
    affinity:Math.max(0,Math.min(5,Number(g.affinity??2)||0)),
    attributes,
    attributeReducers:{},
    traitId:String(g.trait?.id||''),
    moves:moveIds,
    items:[],
    notes:''
  });
  data.savedRelianSheets=Array.isArray(data.savedRelianSheets)?data.savedRelianSheets:[];
  data.savedRelianSheets.push(sheet);
  selectedSavedSheetId='relian:'+String(sheet.id);
  saveData();
  alert(`${sheet.nickname||sheet.speciesName||'Relian'} foi salvo no Banco de fichas.`);
}
function renderGenerated(g){
  generatedState.set(g.uid,g);
  const attrRows=ATTR_KEYS.map(k=>{const m=g.attrs[k].modifier;return `<tr><td><b>${ATTR_LABELS[k]}</b></td><td>${g.attrs[k].rolled}</td><td>${g.attrs[k].trait>=0?'+':''}${g.attrs[k].trait}</td><td>${g.attrs[k].total}</td><td class="${m>=0?'modifier-positive':'modifier-negative'}">${m>=0?'+':''}${m}</td></tr>`}).join('');
  const moves=g.moves.map(x=>{const d=domainDisplay(x.domain),visual=moveCardVisual(x.move);return `<div class="move-card move-card-elemental" style="${visual.style}"><div class="move-head"><b>${esc(x.move.name)}</b><span class="move-type">${esc(x.move.type)}</span></div><div class="move-elements-label">${esc(visual.label)}</div><small>Dano ${x.move.damage??0} · ENG ${x.move.energy??0} · Nv. ${x.unlock}</small><div class="domain-line">${d.stage}: ${d.symbols} (${d.progress})</div>${moveInfoButton(x.move.description)}</div>`}).join('')||'<p class="empty">Nenhum movimento disponível neste nível.</p>';
  const img=resolveImage(g);
  const rarityName=RARITY_NAMES[g.r.rarity]||esc(g.r.rarity||'Comum');
  const traitMods=Object.entries(g.trait?.mods||{}).filter(([,v])=>Number(v)!==0).map(([k,v])=>`<span class="trait-mod ${Number(v)>0?'positive':'negative'}">${Number(v)>0?'+':''}${Number(v)} ${esc(ATTR_LABELS[k]||({hp:'HP',energia:'ENG'}[k]||k))}</span>`).join('');
  return `<article class="card relian-sheet rarity-theme-${g.r.rarity||'comum'} color-theme-${g.color.id}" id="sheet-${g.uid}"><div class="coloration-effects" aria-hidden="true"></div>${rarityEffectHtml(g.r.rarity||'comum','sheet')}<div class="sheet-banner"><div class="portrait-panel"><span class="color-ribbon ${g.color.id}">${g.color.id==='shiny'?'◆ ':g.color.id==='special'?'✦ ':''}${g.color.name}</span>${img?`<img class="relian-portrait" src="${esc(img)}" alt="${esc(g.r.name)}">`:`<div class="portrait-placeholder">?</div>`}${g.color.id==='shiny'||g.color.id==='special'?`<div class="portrait-particles ${g.color.id}" aria-hidden="true">${Array.from({length:18},(_,i)=>{const x=[8,74,31,56,17,88,43,65,24,79,51,12,93,37,69,21,60,84][i];const size=[8,12,7,10,9,6,13,8,11,7,9,12,6,10,8,13,7,11][i];const duration=[5.4,7.1,6.2,5.8,7.6,6.7,5.2,7.4,6.0,5.6,7.0,6.4,5.9,7.8,6.1,5.3,7.2,6.6][i];const delay=[-1.1,-5.8,-3.2,-6.6,-2.4,-4.7,-0.5,-7.1,-3.9,-1.8,-5.1,-6.0,-2.9,-7.5,-4.3,-0.9,-5.5,-3.5][i];const drift=[-10,12,6,-7,14,-5,9,-12,5,11,-8,7,-14,10,-6,13,-9,4][i];return `<span style="--x:${x}%;--size:${size}px;--duration:${duration}s;--delay:${delay}s;--drift:${drift}px">${g.color.id==='shiny'?(i%3===0?'✦':'◆'):'✦'}</span>`}).join('')}</div>`:''}</div><div class="sheet-header-info"><div class="generated-sheet-actions"><button type="button" class="capture-sheet-btn" data-capture-sheet="1" data-uid="${g.uid}">Capturar ficha</button><button type="button" class="save-generated-btn" data-save-generated="1" data-uid="${g.uid}">＋ Salvar ficha</button></div><div class="catalog-line"><span class="catalog-badge">Reli-Info #${catalogCode(g.r)||'—'}</span><span class="mini-badge">Nível ${g.level}</span><span class="mini-badge">Estágio ${g.r.stage||1}</span></div><h2 class="sheet-name">${esc(g.r.name)}</h2>${identityBadges(g.r.class,getRelianElements(g.r,g.color.id))}<p class="identity-line identity-secondary">${esc(g.gender||'Indefinido')} · Tamanho ${esc(g.size||'—')}</p><div class="resource-panel">${resourceBox(g.uid,'hp','HP',g.currentHp,g.hp)}${resourceBox(g.uid,'energy','ENG',g.currentEnergy,g.energy)}</div></div></div><div class="sheet-body"><div><section class="sheet-section"><div class="sheet-section-title">STATUS</div><div class="sheet-section-content"><table class="stat-table"><tr><th>Atributo</th><th>Base</th><th>Traço</th><th>Total</th><th>Mod.</th></tr>${attrRows}</table></div></section><section class="sheet-section"><div class="sheet-section-title">MOVIMENTOS</div><div class="sheet-section-content moves-grid">${moves}</div></section>${g.r.description?`<section class="sheet-section catalog-description-section"><div class="sheet-section-title">DESCRIÇÃO DA ESPÉCIE</div><div class="sheet-section-content catalog-description"><p>${esc(g.r.description)}</p></div></section>`:''}</div><aside><section class="sheet-section"><div class="sheet-section-title">TRAÇO</div><div class="sheet-section-content trait-box"><div class="trait-title-row"><span class="trait-orb">◉</span><b>${esc(g.trait?.name||'Nenhum')}</b></div><p>${esc(g.trait?.description||'Sem descrição.')}</p>${g.trait?.palate?`<div class="trait-palate"><span>🍓 Paladar preferido</span><strong>${esc(g.trait.palate)}</strong></div>`:''}${traitMods?`<div class="trait-mods">${traitMods}</div>`:''}</div></section><section class="sheet-section"><div class="sheet-section-title">RESUMO DO ENCONTRO</div><div class="sheet-section-content encounter-summary"><p><b>Coloração:</b> ${g.color.name}</p><p class="rarity-summary-row"><b>Raridade:</b> <span class="rarity-summary-badge"><span class="rarity-star">✦</span>${rarityName}</span></p>${classInfo(g.r.class)?`<p><b>Classe:</b> ${esc(classInfo(g.r.class).name)}</p>`:''}<p><b>Elementos:</b> ${esc(getRelianElements(g.r,g.color.id).join(', ')||'Nenhum')}</p></div></section>${capturePanel(g)}</aside></div></article>`;
}
el('generatorForm').onsubmit=e=>{e.preventDefault();const entries=eligibleEntries();if(!entries.length)return alert('Nenhum Relian disponível para estes filtros.');generatedState.clear();const amount=Math.max(1,+el('genAmount').value||1);el('generatedArea').innerHTML=Array.from({length:amount},()=>renderGenerated(makeGenerated(weightedPick(entries)))).join('')}
el('generatedArea').addEventListener('click',e=>{const target=e.target.closest('[data-resource-action],[data-affinity-delta],[data-capture-roll],[data-save-generated],[data-capture-sheet]');if(!target)return;const g=generatedState.get(target.dataset.uid);if(!g)return;if(target.dataset.captureSheet){openSheetCapture(g.uid);return}if(target.dataset.saveGenerated){saveGeneratedRelianSheet(g);return}if(target.dataset.resourceAction){const type=target.dataset.resource,delta=Number(target.dataset.delta),maxKey=type==='hp'?'hp':'energy',currentKey=type==='hp'?'currentHp':'currentEnergy';if(target.dataset.resourceAction==='max'){g[maxKey]=Math.max(1,g[maxKey]+delta);g[currentKey]=Math.min(g[currentKey],g[maxKey])}else g[currentKey]=Math.max(0,Math.min(g[maxKey],g[currentKey]+delta))}else if(target.dataset.affinityDelta){g.affinity=Math.round(Math.max(0,Math.min(5,g.affinity+Number(target.dataset.affinityDelta)))*10)/10}else if(target.dataset.captureRoll){const c=captureBreakdown(g),roll=rand(1,100);g.captureRoll=roll;if(c.automatic)g.captureResult='Capturado!';else if(roll===100&&c.total<100)g.captureResult='Falha crítica!';else if(roll===1)g.captureResult='Capturado!';else g.captureResult=roll<=c.total?'Capturado!':'Falhou na captura.'}const old=el(`sheet-${g.uid}`);if(old)old.outerHTML=renderGenerated(g)});
el('generatedArea').addEventListener('change',e=>{const target=e.target.closest('[data-capture-control]');if(!target)return;const g=generatedState.get(target.dataset.uid);if(!g)return;if(target.dataset.captureControl==='cube')g.captureCube=target.value;if(target.dataset.captureControl==='status')g.negativeStatus=target.checked;g.captureRoll=null;g.captureResult='';const old=el(`sheet-${g.uid}`);if(old)old.outerHTML=renderGenerated(g)});

function renderRelians(){el('reliansList').innerHTML=data.relians.length?[...data.relians].sort(sortReliansByCatalog).map(r=>`<button type="button" class="relian-editor-row" onclick="editRelian('${r.id}')"><span class="relian-editor-number">#${catalogCode(r)||'—'}</span><b>${esc(r.name)}</b><span aria-hidden="true">›</span></button>`).join(''):'<p class="empty">Nenhum Relian cadastrado.</p>'}

let selectedCatalogRelianId='';
function sortReliansByCatalog(a,b){
  const an=Number(a.catalogNumber),bn=Number(b.catalogNumber);
  const aValid=Number.isFinite(an),bValid=Number.isFinite(bn);
  if(aValid&&bValid&&an!==bn)return an-bn;
  if(aValid!==bValid)return aValid?-1:1;
  const av=normalizeCatalogVariant(a.catalogVariant),bv=normalizeCatalogVariant(b.catalogVariant);
  if(av!==bv)return av.localeCompare(bv,'pt-BR',{numeric:true});
  return String(a.name||'').localeCompare(String(b.name||''),'pt-BR');
}
function relianEvolutionName(id){return data.relians.find(r=>String(r.id)===String(id??''))?.name||''}
function relianEvolutionTargets(r){
  const list=Array.isArray(r?.evolvesToMany)?r.evolvesToMany:(Array.isArray(r?.evolvesTo)?r.evolvesTo:[r?.evolvesTo]);
  return [...new Set(list.map(x=>String(x||'').trim()).filter(Boolean))];
}
function evolutionCatalogButton(id,label='Evolução'){
  const target=data.relians.find(r=>String(r.id)===String(id||''));
  if(!target)return '';
  return `<button type="button" class="catalog-evolution-link" data-evolution-catalog-id="${esc(String(target.id))}"><small>${esc(label)}</small><b>#${catalogCode(target)||'—'} ${esc(target.name)}</b></button>`;
}
function catalogMoveRows(r){
  const rows=[...(r.learnset||[])].sort((a,b)=>Number(a.level)-Number(b.level));
  if(!rows.length)return '<p class="empty">Nenhum movimento cadastrado para esta espécie.</p>';
  return `<div class="catalog-move-table"><div class="catalog-move-head"><span>Nível</span><span>Movimento</span><span>Tipo</span><span>Dano</span><span>ENG</span></div>${rows.map(x=>{const m=data.moves?.[x.moveId]||{};return `<div class="catalog-move-row"><b>${Number(x.level)||1}</b><span><strong>${esc(m.name||x.moveId)}</strong><small>${esc(m.description||'Sem descrição.')}</small></span><i>${esc(m.type||'—')}</i><em>${Number(m.damage)||0}</em><em>${Number(m.energy)||0}</em></div>`}).join('')}</div>`;
}
function fillCatalogFilters(){
  const element=el('catalogElementFilter'),rarity=el('catalogRarityFilter'),classFilter=el('catalogClassFilter');
  if(element){
    const current=element.value;
    const values=[...new Set(data.relians.flatMap(r=>Array.isArray(r.elements)?r.elements:[]).filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b),'pt-BR'));
    element.innerHTML='<option value="">Todos</option>'+values.map(value=>`<option value="${esc(value)}">${esc(value)}</option>`).join('');
    if(values.includes(current))element.value=current;
  }
  if(rarity){
    const current=rarity.value;
    const values=[...new Set(data.relians.map(r=>String(r.rarity||'comum')).filter(Boolean))];
    rarity.innerHTML='<option value="">Todas</option>'+values.sort((a,b)=>String(RARITY_NAMES[a]||a).localeCompare(String(RARITY_NAMES[b]||b),'pt-BR')).map(value=>`<option value="${esc(value)}">${esc(RARITY_NAMES[value]||value)}</option>`).join('');
    if(values.includes(current))rarity.value=current;
  }
  if(classFilter){
    const current=classFilter.value;
    const values=[...new Set(data.relians.map(r=>String(r.class||'')).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
    classFilter.innerHTML='<option value="">Todas</option>'+values.map(value=>`<option value="${esc(value)}">${esc(classInfo(value)?.name||value)}</option>`).join('');
    if(values.includes(current))classFilter.value=current;
  }
}
function catalogFilteredItems(){
  const q=String(el('catalogSearch')?.value||'').trim().toLocaleLowerCase('pt-BR');
  const element=String(el('catalogElementFilter')?.value||'');
  const rarity=String(el('catalogRarityFilter')?.value||'');
  const classFilter=String(el('catalogClassFilter')?.value||'');
  const sort=String(el('catalogSort')?.value||'number');
  const rarityOrder={comum:1,incomum:2,raro:3,lendario:4,'unico':5,mitico:6};
  const items=data.relians.filter(r=>{
    const hay=[r.name,r.id,catalogCode(r),r.catalogNumber,r.catalogVariant,...(r.elements||[]),r.class,classInfo(r.class)?.name,RARITY_NAMES[r.rarity]||r.rarity].join(' ').toLocaleLowerCase('pt-BR');
    if(q&&!hay.includes(q))return false;
    if(element&&!(r.elements||[]).includes(element))return false;
    if(rarity&&String(r.rarity||'comum')!==rarity)return false;
    if(classFilter&&String(r.class||'')!==classFilter)return false;
    return true;
  });
  if(sort==='name')items.sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'pt-BR'));
  else if(sort==='rarity')items.sort((a,b)=>(rarityOrder[a.rarity]||99)-(rarityOrder[b.rarity]||99)||sortReliansByCatalog(a,b));
  else items.sort(sortReliansByCatalog);
  return items;
}
function catalogElementPills(elements,extraClass=''){
  const values=[...new Set((elements||[]).filter(Boolean))];
  return values.length?`<div class="catalog-element-pills ${esc(extraClass)}">${values.map(value=>{const info=elementInfo(value);return `<span class="catalog-element-pill element-${esc(info.key)}"><span class="catalog-element-symbol">◆</span>${esc(info.label)}</span>`}).join('')}</div>`:'<span class="catalog-none">Nenhum</span>';
}
function catalogRarityLabel(r){return RARITY_NAMES[r?.rarity]||'Comum'}
function catalogOrderedAll(){return [...data.relians].sort(sortReliansByCatalog)}
function catalogNeighborId(r,delta){const all=catalogOrderedAll();const index=all.findIndex(x=>String(x.id)===String(r?.id));if(index<0||!all.length)return'';const next=(index+delta+all.length)%all.length;return String(all[next]?.id||'')}
function catalogTabButton(id,label,active=false){return `<button type="button" class="catalog-book-tab ${active?'active':''}" data-catalog-tab="${esc(id)}">${esc(label)}</button>`}
function renderCatalog(){
  const list=el('catalogResults'),detail=el('catalogDetail');if(!list||!detail)return;
  fillCatalogFilters();
  const items=catalogFilteredItems();
  const count=el('catalogResultCount');if(count)count.textContent=`${items.length} ${items.length===1?'Relian catalogado':'Relians catalogados'}`;
  list.innerHTML=items.length?items.map(r=>{
    const thumb=resolveRelianImage(r,'basic');
    const elements=Array.isArray(r.elements)?r.elements.filter(Boolean):[];
    return `<button type="button" class="catalog-result catalog-index-card rarity-card-${esc(r.rarity||'comum')} ${selectedCatalogRelianId===String(r.id)?'selected':''}" data-catalog-id="${esc(String(r.id))}">
      <span class="catalog-index-thumb">${thumb?`<img src="${esc(thumb)}" alt="">`:'<b>?</b>'}</span>
      <span class="catalog-index-main"><strong>${esc(r.name)}</strong><small>${catalogElementPills(elements,'compact')}</small></span>
      <span class="catalog-index-meta"><b>#${catalogCode(r)||'—'}</b><em>${esc(catalogRarityLabel(r))}</em></span>
      <i aria-hidden="true">›</i>
    </button>`
  }).join(''):'<div class="catalog-no-results"><b>Nenhum Relian encontrado</b><span>Tente remover algum filtro ou pesquisar por outro termo.</span></div>';
  list.querySelectorAll('[data-catalog-id]').forEach(button=>{
    button.onclick=()=>{
      const id=String(button.dataset.catalogId||'');
      const relian=data.relians.find(item=>String(item.id)===id);
      if(!relian){detail.innerHTML='<div class="catalog-empty"><b>Relian não encontrado</b><span>Sincronize o projeto e tente novamente.</span></div>';return}
      selectedCatalogRelianId=id;
      list.querySelectorAll('[data-catalog-id]').forEach(item=>item.classList.toggle('selected',item===button));
      renderCatalogDetail(relian);
    };
  });
  if(selectedCatalogRelianId&&!data.relians.some(r=>String(r.id)===String(selectedCatalogRelianId)))selectedCatalogRelianId='';
  if(!selectedCatalogRelianId&&items.length){selectedCatalogRelianId=String(items[0].id)}
  if(!selectedCatalogRelianId){detail.innerHTML='<div class="catalog-empty"><b>Nenhum Relian selecionado</b><span>Pesquise e selecione uma espécie para consultar seus dados.</span></div>';return}
  renderCatalogDetail(selectedCatalogRelianId);
}
window.openCatalogRelian=function(id){
  const normalizedId=String(id??'');
  const relian=data.relians.find(item=>String(item.id)===normalizedId);
  if(!relian){
    const box=el('catalogDetail');
    if(box)box.innerHTML='<div class="catalog-empty"><b>Relian não encontrado</b><span>Sincronize o projeto e tente novamente.</span></div>';
    return;
  }
  selectedCatalogRelianId=normalizedId;
  document.querySelectorAll('#catalogResults [data-catalog-id]').forEach(button=>button.classList.toggle('selected',String(button.dataset.catalogId)===normalizedId));
  renderCatalogDetail(relian);
};
function renderCatalogDetail(relianOrId){
  const r=typeof relianOrId==='object'&&relianOrId?relianOrId:data.relians.find(x=>String(x.id)===String(relianOrId??''));
  const box=el('catalogDetail');
  if(!box)return;
  if(!r){box.innerHTML='<div class="catalog-empty"><b>Relian não encontrado</b><span>Sincronize a pasta e tente novamente.</span></div>';return}
  try{
    const stage=Math.max(1,Number(r.stage)||1);
    const basicImg=resolveRelianImage(r,'basic');
    const shinyImg=resolveRelianImage(r,'shiny')||basicImg;
    const specialImg=resolveRelianImage(r,'special')||basicImg;
    const baseElements=getRelianElements(r,'basic');
    const specialElements=getRelianElements(r,'special');
    const prevId=String(r.evolvesFrom||'');
    const nextIds=relianEvolutionTargets(r);
    const encounters=(r.encounters||[]).map(e=>{const region=data.regions.find(x=>x.id===e.region)?.name||e.region||'Região não definida';const biome=data.biomes.find(x=>x.id===e.biome)?.name||e.biome||'Bioma não definido';const periods=(e.periods||[]).map(p=>String(p).charAt(0).toUpperCase()+String(p).slice(1)).join(', ')||'Qualquer período';return `<article class="catalog-habitat-card"><div><b>${esc(region)}</b><strong>${esc(biome)}</strong></div><span>Níveis ${Number(e.minLevel)||1}–${Number(e.maxLevel)||1}</span><small>${esc(periods)}${Number(e.weight)>0?` · Peso ${Number(e.weight)}`:''}</small></article>`}).join('');
    const currentCard=`<span class="catalog-evolution-current"><small>Forma atual</small><b>#${catalogCode(r)||'—'} ${esc(r.name)}</b></span>`;
    const previousCard=prevId?evolutionCatalogButton(prevId,'Evolui de'):`<span><small>Evolui de</small><b>Não definido</b></span>`;
    const nextCards=nextIds.map(id=>evolutionCatalogButton(id,'Evolui para')).filter(Boolean).join('');
    const nextBlock=nextCards?`<span class="catalog-evo-arrow">→</span><div class="catalog-evolution-branches">${nextCards}</div>`:'';
    const evolutionHtml=stage<=1?`<div class="catalog-evolution catalog-evolution-stage1">${currentCard}${nextBlock}</div>`:`<div class="catalog-evolution">${previousCard}<span class="catalog-evo-arrow">→</span>${currentCard}${nextBlock}</div>`;
    const prevCatalog=catalogNeighborId(r,-1),nextCatalog=catalogNeighborId(r,1);
    const total=data.relians.length;
    const ordered=catalogOrderedAll();
    const currentIndex=Math.max(0,ordered.findIndex(x=>String(x.id)===String(r.id)))+1;
    const specialDifferent=JSON.stringify(baseElements)!==JSON.stringify(specialElements);
    const catalogHpBase=Number(data.rules?.baseHp??100)+(Math.max(1,stage)-1)*Number(data.rules?.hpPerEvolution??20);
    const catalogEngBase=Number(r.baseEnergy??data.rules?.baseEnergy??65);
    const catalogGenders=(r.genders||[]).map(String).filter(Boolean);
    const catalogSizes=(r.sizes||[]).map(String).filter(Boolean);

    box.innerHTML=`<article class="catalog-profile catalog-book rarity-theme-${esc(r.rarity||'comum')}">
      ${rarityEffectHtml(r.rarity||'comum','catalog')}
      <div class="catalog-book-page">
        <section class="catalog-book-hero">
          <div class="catalog-book-art">
            <div class="catalog-image-stage catalog-color-basic" data-color="basic">${basicImg?`<img id="catalogRelianImage" src="${esc(basicImg)}" alt="${esc(r.name)}">`:'<span id="catalogRelianImagePlaceholder">?</span>'}</div>
            <div class="catalog-color-switch" role="group" aria-label="Coloração do Relian">
              <button type="button" class="active" data-catalog-color="basic">Basic</button>
              <button type="button" data-catalog-color="shiny">Shiny</button>
              <button type="button" data-catalog-color="special">Special</button>
            </div>
          </div>
          <div class="catalog-book-identity">
            <div class="catalog-book-number">#${catalogCode(r)||'—'}</div>
            <h2>${esc(r.name)}</h2>
            <span class="catalog-book-rarity">✦ ${esc(catalogRarityLabel(r))}</span>
            <div class="catalog-book-divider"></div>
            <section class="catalog-book-elements"><h3>Elementos</h3><div id="catalogBaseElements">${catalogElementPills(baseElements)}</div></section>
            <section class="catalog-book-elements special"><h3>Special Color</h3><div id="catalogSpecialElements">${catalogElementPills(specialElements)}</div>${specialDifferent?'':'<small>Usa os mesmos elementos da Basic Color.</small>'}</section>
            <section class="catalog-book-facts catalog-book-facts-compact">
              <span><b>Classe</b>${esc(CLASS_INFO[normalizeRelianClass(r.class)]?.name||'Nenhuma')}</span>
              <span><b>Estágio</b>${stage}</span>
            </section>
          </div>
        </section>

        <nav class="catalog-book-tabs" aria-label="Seções do catálogo">
          ${catalogTabButton('sobre','Sobre',true)}${catalogTabButton('habitat','Habitat')}${catalogTabButton('evolucao','Evolução')}${catalogTabButton('movimentos','Movimentos')}${catalogTabButton('dados','Dados')}
        </nav>

        <div class="catalog-book-content">
          <section class="catalog-book-panel active" data-catalog-panel="sobre">
            <div class="catalog-lore catalog-lore-wide"><h3>Descrição da espécie</h3><p>${esc(r.description||'Nenhuma descrição cadastrada.')}</p></div>
          </section>
          <section class="catalog-book-panel" data-catalog-panel="habitat"><h3>Habitat e níveis de aparição</h3>${r.habitatNotes?`<p class="catalog-section-notes">${esc(r.habitatNotes)}</p>`:''}<div class="catalog-encounters">${encounters||'<p class="empty">Nenhuma aparição cadastrada para esta espécie.</p>'}</div></section>
          <section class="catalog-book-panel" data-catalog-panel="evolucao"><h3>Linha evolutiva</h3>${evolutionHtml}<div class="catalog-evolution-info"><p class="catalog-method"><b>Método:</b> ${esc(r.evolutionMethod||'Não definido')}</p>${r.evolutionNotes?`<p>${esc(r.evolutionNotes)}</p>`:''}</div></section>
          <section class="catalog-book-panel" data-catalog-panel="movimentos"><h3>Movimentos aprendidos</h3><p class="catalog-section-notes">Movimentos cadastrados para esta espécie e o nível em que ficam disponíveis.</p>${catalogMoveRows(r)}</section>
          <section class="catalog-book-panel" data-catalog-panel="dados">
            <h3>Dados da espécie</h3>
            <div class="catalog-data-layout">
              <section class="catalog-data-group catalog-data-resources">
                <h4>Recursos base</h4>
                <div class="catalog-resource-cards">
                  <article class="catalog-resource-card hp"><span>HP</span><b>${catalogHpBase}</b><small>Vida base no estágio ${stage}</small></article>
                  <article class="catalog-resource-card eng"><span>ENG</span><b>${catalogEngBase}</b><small>Energia base da espécie</small></article>
                </div>
              </section>

              <section class="catalog-data-group">
                <h4>Biologia</h4>
                <div class="catalog-data-grid catalog-data-grid-compact">
                  <div><span>Gênero(s)</span><b>${catalogGenders.map(esc).join(', ')||'Não definido'}</b></div>
                  <div><span>Tamanho(s)</span><b>${catalogSizes.map(esc).join(', ')||'Não definido'}</b></div>
                </div>
              </section>

              <section class="catalog-data-group">
                <h4>Classificação</h4>
                <div class="catalog-data-grid">
                  <div><span>Classe</span><b>${esc(CLASS_INFO[normalizeRelianClass(r.class)]?.name||'Nenhuma')}</b></div>
                  <div><span>Estágio</span><b>${stage}</b></div>
                  <div><span>Elementos</span><b>${baseElements.map(esc).join(', ')||'Nenhum'}</b></div>
                  <div><span>Special Color</span><b>${specialElements.map(esc).join(', ')||'Nenhum'}</b></div>
                </div>
              </section>

              <section class="catalog-data-group">
                <h4>Captura e vínculo</h4>
                <div class="catalog-data-grid catalog-data-grid-compact">
                  <div><span>Captura base</span><b>${Number(r.captureRate??RARITY_BASE[r.rarity]??40)}%</b></div>
                  <div><span>Afinidade inicial</span><b>${Number(r.baseAffinity??2).toFixed(1)}</b></div>
                </div>
              </section>
            </div>
          </section>
        </div>
      </div>
      <footer class="catalog-book-footer"><span><b>${currentIndex}</b> / ${total} no catálogo</span><div><button type="button" data-catalog-nav="${esc(prevCatalog)}">← Anterior</button><button type="button" data-catalog-nav="${esc(nextCatalog)}">Próximo →</button></div></footer>
    </article>`;

    const colorImages={basic:basicImg,shiny:shinyImg,special:specialImg};
    const imageStage=box.querySelector('.catalog-image-stage');
    box.querySelectorAll('[data-catalog-color]').forEach(button=>button.addEventListener('click',()=>{
      const color=normalizeColorId(button.dataset.catalogColor);
      box.querySelectorAll('[data-catalog-color]').forEach(b=>b.classList.toggle('active',b===button));
      if(imageStage){
        imageStage.dataset.color=color;imageStage.className=`catalog-image-stage catalog-color-${color}`;
        const source=colorImages[color]||basicImg;
        // Reutiliza exatamente o sistema antigo de partículas das fichas.
        // Ele já possui posições, velocidades, atrasos, deriva e símbolos
        // próprios para Shiny e Especial, evitando o efeito simplificado
        // que foi introduzido no novo Catálogo.
        const particles=savedSheetParticles(color);
        imageStage.innerHTML=(source?`<img id="catalogRelianImage" src="${esc(source)}" alt="${esc(r.name)} — ${esc(colorName(color))}">`:'<span id="catalogRelianImagePlaceholder">?</span>')+particles;
      }
    }));
    box.querySelectorAll('[data-catalog-tab]').forEach(button=>button.addEventListener('click',()=>{
      const tab=String(button.dataset.catalogTab||'sobre');
      box.querySelectorAll('[data-catalog-tab]').forEach(b=>{const active=b===button;b.classList.toggle('active',active);b.setAttribute('aria-selected',active?'true':'false')});
      box.querySelectorAll('[data-catalog-panel]').forEach(panel=>{const active=String(panel.dataset.catalogPanel)===tab;panel.classList.toggle('active',active);panel.hidden=!active});
    }));
    box.querySelectorAll('[data-catalog-panel]').forEach(panel=>panel.hidden=!panel.classList.contains('active'));
    box.querySelectorAll('[data-evolution-catalog-id]').forEach(button=>button.addEventListener('click',()=>{
      const id=String(button.dataset.evolutionCatalogId||'');
      if(id)window.openCatalogRelian(id);
    }));
    box.querySelectorAll('[data-catalog-nav]').forEach(button=>button.addEventListener('click',()=>{const id=button.dataset.catalogNav;if(id)window.openCatalogRelian(id)}));
  }catch(error){
    console.error('Erro ao abrir Relian no Catálogo:',error);
    box.innerHTML=`<div class="catalog-empty"><b>Não foi possível abrir esta entrada</b><span>${esc(error?.message||'Erro desconhecido no Catálogo.')}</span></div>`;
  }
}
window.editRelian=id=>{const r=data.relians.find(x=>x.id===id);if(!r)return;el('relianFormTitle').textContent='Editar Relian';el('relianId').value=r.id;el('relianCatalog').value=r.catalogNumber||'';el('relianCatalogVariant').value=normalizeCatalogVariant(r.catalogVariant);el('relianName').value=r.name;el('relianDescription').value=r.description||'';if(el('relianHabitatNotes'))el('relianHabitatNotes').value=r.habitatNotes||'';if(el('relianEvolutionNotes'))el('relianEvolutionNotes').value=r.evolutionNotes||'';el('relianClass').value=normalizeRelianClass(r.class);[1,2,3].forEach((n,i)=>{el('element'+n).value=r.elements[i]||'';updateElementSelectStyle(el('element'+n));el('specialElement'+n).value=(r.specialElements||[])[i]||'';updateElementSelectStyle(el('specialElement'+n))});renderElementPreview();el('relianStage').value=r.stage||1;el('relianEnergy').value=r.baseEnergy||0;el('relianRarity').value=r.rarity||'comum';el('relianCaptureRate').value=r.captureRate??RARITY_BASE[r.rarity||'comum'];el('relianAffinity').value=r.baseAffinity??2;el('relianImageBasic').value=r.images?.basic||r.image||'';el('relianImageShiny').value=r.images?.shiny||'';el('relianImageSpecial').value=r.images?.special||'';el('relianGenders').value=(r.genders||[]).join(',');el('relianSizes').value=(r.sizes||[]).join(',');refreshEvolutionOptions(r.id);el('relianEvolvesFrom').value=r.evolvesFrom||'';const evolutionTargets=relianEvolutionTargets(r);[...el('relianEvolvesTo').options].forEach(o=>o.selected=evolutionTargets.includes(o.value));renderEvolutionTargetsEditor();el('relianEvolutionMethod').value=r.evolutionMethod||'';clearLearnsetEditor();(r.learnset||[]).sort((a,b)=>a.level-b.level).forEach(addLearnsetRow);el('encountersEditor').innerHTML='';(r.encounters||[]).forEach(addEncounterRow);document.querySelector('[data-tab="relians"]').click()}
function clearRelianForm(){el('relianForm').reset();el('relianId').value='';if(el('relianHabitatNotes'))el('relianHabitatNotes').value='';if(el('relianEvolutionNotes'))el('relianEvolutionNotes').value='';if(el('relianCatalogVariant'))el('relianCatalogVariant').value='';el('relianFormTitle').textContent='Cadastrar Relian';el('relianStage').value=1;el('relianEnergy').value=85;el('relianRarity').value='comum';el('relianCaptureRate').value=40;el('relianAffinity').value=2;el('relianGenders').value='Macho,Fêmea';el('relianSizes').value='P,M,G';if(el('relianEvolvesFrom'))el('relianEvolvesFrom').value='';if(el('relianEvolvesTo'))[...el('relianEvolvesTo').options].forEach(o=>o.selected=false);renderEvolutionTargetsEditor();if(el('relianEvolutionMethod'))el('relianEvolutionMethod').value='';[1,2,3].forEach(n=>{el('element'+n).value='';updateElementSelectStyle(el('element'+n));el('specialElement'+n).value='';updateElementSelectStyle(el('specialElement'+n))});renderElementPreview();clearLearnsetEditor();addLearnsetRow({level:1,moveId:Object.keys(data.moves||{})[0]||''});el('encountersEditor').innerHTML='';addEncounterRow()}

function movementElementInfo(move){
  const raw=String(move?.element||'').trim();
  if(!raw)return{label:'Sem elemento',key:'nenhum'};
  const normalized=raw.toLocaleLowerCase('pt-BR');
  const found=ELEMENT_OPTIONS.slice(1).find(info=>normalized.includes(info.value.toLocaleLowerCase('pt-BR')));
  return{label:raw,key:found?.key||'nenhum'};
}
function movementOptions(selected=''){
  const list=Object.values(data.moves||{}).sort((a,b)=>(a.name||a.id).localeCompare(b.name||b.id,'pt-BR'));
  if(!list.length)return '<option value="">Nenhum movimento cadastrado</option>';
  return list.map(m=>{const info=movementElementInfo(m);return `<option value="${esc(m.id)}" data-element="${esc(info.key)}"${m.id===selected?' selected':''}>${esc(info.label)} • ${esc(m.name)} (${esc(m.id)})</option>`}).join('');
}
let activeLearnsetMoveSelect=null;
function updateLearnMoveStyle(select){
  if(!select)return;
  const move=data.moves?.[select.value];
  const info=movementElementInfo(move);
  select.dataset.element=info.key;
  select.className=`learn-move move-element-select element-${info.key}`;
  select.title=move?`${info.label} • ${move.name}`:'Nenhum movimento selecionado';
  const row=select.closest('.learnset-row');
  const button=row?.querySelector('.open-move-picker');
  if(button){
    button.dataset.element=info.key;
    button.className=`open-move-picker element-${info.key}`;
    button.innerHTML=move?`<span class="move-picker-element">${esc(info.label)}</span><strong>${esc(move.name)}</strong><small>${esc(move.id)}</small>`:'<span class="move-picker-empty">Selecionar movimento</span>';
    button.title=move?`${info.label} • ${move.name}`:'Abrir pesquisa de movimentos';
  }
}
function renderMovePickerList(){
  const listBox=el('movePickerList');if(!listBox)return;
  const query=String(el('movePickerSearch')?.value||'').trim().toLocaleLowerCase('pt-BR');
  const elementFilter=el('movePickerElement')?.value||'';
  const selected=activeLearnsetMoveSelect?.value||'';
  const moves=Object.values(data.moves||{}).filter(move=>{
    const info=movementElementInfo(move);
    const haystack=`${move.name||''} ${move.id||''} ${info.label||''}`.toLocaleLowerCase('pt-BR');
    return(!query||haystack.includes(query))&&(!elementFilter||info.key===elementFilter);
  }).sort((a,b)=>(a.name||a.id).localeCompare(b.name||b.id,'pt-BR'));
  listBox.innerHTML=moves.length?moves.map(move=>{const info=movementElementInfo(move);return `<button type="button" class="move-picker-result element-${esc(info.key)}${move.id===selected?' selected':''}" data-move-id="${esc(move.id)}"><span class="move-picker-result-element">${esc(info.label)}</span><span class="move-picker-result-main"><b>${esc(move.name)}</b><small>${esc(move.id)} · ${esc(move.type||'MOV')} · Dano ${Number(move.damage)||0} · ENG ${Number(move.energy)||0}</small></span></button>`}).join(''):'<p class="move-picker-no-results">Nenhum movimento encontrado.</p>';
  listBox.querySelectorAll('[data-move-id]').forEach(button=>button.onclick=()=>{
    if(!activeLearnsetMoveSelect)return;
    const id=button.dataset.moveId;
    activeLearnsetMoveSelect.value=id;
    updateLearnMoveStyle(activeLearnsetMoveSelect);
    activeLearnsetMoveSelect.dispatchEvent(new Event('change',{bubbles:true}));
    el('movePickerDialog')?.close();
  });
}
function openMovePicker(select){
  activeLearnsetMoveSelect=select;
  const dialog=el('movePickerDialog');if(!dialog)return;
  el('movePickerSearch').value='';
  el('movePickerElement').value='';
  renderMovePickerList();
  dialog.showModal();
  setTimeout(()=>el('movePickerSearch')?.focus(),30);
}
function addLearnsetRow(value={level:1,moveId:''}){
  const editor=el('learnsetEditor');if(!editor)return;
  const row=document.createElement('div');row.className='learnset-row';
  row.innerHTML=`<label class="learnset-level">Nível<input type="number" min="1" class="learn-level" value="${Math.max(1,Number(value.level)||1)}"></label><div class="learnset-move"><span>Movimento</span><select class="learn-move" aria-hidden="true" tabindex="-1">${movementOptions(value.moveId||'')}</select><button type="button" class="open-move-picker">Selecionar movimento</button></div><button type="button" class="danger remove-learnset" title="Remover">×</button>`;
  const moveSelect=row.querySelector('.learn-move');
  moveSelect.addEventListener('change',()=>updateLearnMoveStyle(moveSelect));
  row.querySelector('.open-move-picker').onclick=()=>openMovePicker(moveSelect);
  updateLearnMoveStyle(moveSelect);
  row.querySelector('.remove-learnset').onclick=()=>row.remove();editor.appendChild(row);
}
function clearLearnsetEditor(){const editor=el('learnsetEditor');if(editor)editor.innerHTML=''}
function refreshLearnsetMoveOptions(){
  document.querySelectorAll('.learn-move').forEach(select=>{const current=select.value;select.innerHTML=movementOptions(current);if(data.moves[current])select.value=current;updateLearnMoveStyle(select)});
  if(el('movePickerDialog')?.open)renderMovePickerList();
}
function readLearnsetEditor(){
  return [...document.querySelectorAll('.learnset-row')].map(row=>({level:Number(row.querySelector('.learn-level').value),moveId:row.querySelector('.learn-move').value})).filter(x=>Number.isFinite(x.level)&&x.level>0&&x.moveId).sort((a,b)=>a.level-b.level);
}
el('addLearnsetBtn').onclick=()=>addLearnsetRow({level:1,moveId:Object.keys(data.moves||{})[0]||''});
if(el('movePickerSearch'))el('movePickerSearch').addEventListener('input',renderMovePickerList);
if(el('movePickerElement'))el('movePickerElement').addEventListener('change',renderMovePickerList);
if(el('movePickerCloseBtn'))el('movePickerCloseBtn').onclick=()=>el('movePickerDialog')?.close();
if(el('movePickerClearBtn'))el('movePickerClearBtn').onclick=()=>{if(activeLearnsetMoveSelect){activeLearnsetMoveSelect.value='';updateLearnMoveStyle(activeLearnsetMoveSelect);activeLearnsetMoveSelect.dispatchEvent(new Event('change',{bubbles:true}))}el('movePickerDialog')?.close()};

el('newRelianBtn').onclick=clearRelianForm;el('relianRarity').onchange=()=>{el('relianCaptureRate').value=RARITY_BASE[el('relianRarity').value]??40};
function biomesForRegion(regionId){
  const region=data.regions.find(x=>x.id===regionId);
  const linked=Array.isArray(region?.biomes)?region.biomes.filter(Boolean):[];
  if(!linked.length)return data.biomes;
  const set=new Set(linked);
  return data.biomes.filter(x=>set.has(x.id));
}
function fillEncounterBiomeSelect(row,preferred=''){
  const regionId=row.querySelector('.enc-region').value;
  const select=row.querySelector('.enc-biome');
  const available=biomesForRegion(regionId);
  const current=preferred||select.value;
  fillSelect(select,available);
  if(available.some(x=>x.id===current))select.value=current;
  else select.value=available[0]?.id||'';
  updateEncounterRowDisplay(row);
}
function addEncounterRow(value={}){
  const node=el('encounterTemplate').content.firstElementChild.cloneNode(true);
  el('encountersEditor').appendChild(node);
  fillSelect(node.querySelector('.enc-region'),data.regions);
  node.querySelector('.enc-region').value=value.region||data.regions[0]?.id||'';
  fillEncounterBiomeSelect(node,value.biome||'');
  const selectedPeriods=new Set((value.periods||['manha']).map(x=>String(x).toLowerCase()));
  node.querySelectorAll('.enc-period').forEach(input=>input.checked=selectedPeriods.has(input.value));
  node.querySelector('.enc-min').value=value.minLevel||1;
  node.querySelector('.enc-max').value=value.maxLevel||10;
  node.querySelector('.enc-weight').value=value.weight||10;
  node.querySelector('.enc-region').addEventListener('change',()=>fillEncounterBiomeSelect(node));
  node.querySelector('.enc-biome').addEventListener('change',()=>updateEncounterRowDisplay(node));
  node.querySelectorAll('[data-weight]').forEach(btn=>btn.onclick=()=>{node.querySelector('.enc-weight').value=btn.dataset.weight});
  node.querySelector('.remove-enc').onclick=()=>node.remove();
  updateEncounterRowDisplay(node)
}
el('addEncounterBtn').onclick=()=>addEncounterRow();
function refreshEncounterSelects(){
  document.querySelectorAll('.encounter-row').forEach(row=>{
    const regionSelect=row.querySelector('.enc-region');
    const currentRegion=regionSelect.value;
    fillSelect(regionSelect,data.regions);
    if(data.regions.some(x=>x.id===currentRegion))regionSelect.value=currentRegion;
    fillEncounterBiomeSelect(row,row.querySelector('.enc-biome').value);
  })
}
el('relianForm').onsubmit=async e=>{
  e.preventDefault();
  const submitButton=e.submitter||e.currentTarget.querySelector('button[type="submit"]');
  if(submitButton)submitButton.disabled=true;
  try{
    const encounterRows=[...document.querySelectorAll('.encounter-row')];
    if(!encounterRows.length){alert('Adicione pelo menos uma aparição com nível mínimo e máximo.');return}
    const encounters=encounterRows.map(row=>({
      region:row.querySelector('.enc-region')?.value||'',
      biome:row.querySelector('.enc-biome')?.value||'',
      periods:[...row.querySelectorAll('.enc-period:checked')].map(x=>x.value),
      minLevel:+(row.querySelector('.enc-min')?.value||0),
      maxLevel:+(row.querySelector('.enc-max')?.value||0),
      weight:+(row.querySelector('.enc-weight')?.value||1)||1
    }));
    for(const enc of encounters){
      if(!enc.region||!enc.biome){alert('Escolha a região e o bioma de todas as aparições.');return}
      if(!enc.minLevel||!enc.maxLevel){alert('Preencha o nível mínimo e o nível máximo de todas as aparições.');return}
      if(enc.minLevel>enc.maxLevel){alert('O nível mínimo não pode ser maior que o nível máximo.');return}
      if(!enc.periods.length){alert('Informe ao menos um período em cada aparição.');return}
    }
    const originalId=el('relianId').value;
    const oldRelian=data.relians.find(x=>x.id===originalId)||null;
    const name=el('relianName').value.trim();
    if(!name){alert('Informe o nome do Relian.');return}
    const id=originalId||slug(name);
    const catalogNumber=normalizeCatalogNumber(el('relianCatalog').value);
    if(catalogNumber===null){alert('Informe um número de catálogo válido, maior que zero.');return}
    const catalogVariant=normalizeCatalogVariant(el('relianCatalogVariant')?.value);
    const repeatedCatalog=data.relians.find(x=>x.id!==originalId&&normalizeCatalogNumber(x.catalogNumber)===catalogNumber&&normalizeCatalogVariant(x.catalogVariant)===catalogVariant);
    if(repeatedCatalog){alert(`O código de catálogo #${catalogCode(catalogNumber,catalogVariant)} já pertence a ${repeatedCatalog.name}.`);return}
    const selectedEvolutionIds=[...el('relianEvolvesTo').selectedOptions].map(o=>o.value).filter(Boolean);
    const r={
      id,catalogNumber,catalogVariant,name,
      description:el('relianDescription').value.trim(),
      habitatNotes:el('relianHabitatNotes')?.value.trim()||'',
      evolutionNotes:el('relianEvolutionNotes')?.value.trim()||'',
      class:normalizeRelianClass(el('relianClass').value),
      elements:[1,2,3].map(n=>el('element'+n).value.trim()).filter(Boolean),
      specialElements:[1,2,3].map(n=>el('specialElement'+n).value.trim()).filter(Boolean),
      stage:+el('relianStage').value||1,
      baseEnergy:+el('relianEnergy').value||0,
      rarity:normalizeRarityId(el('relianRarity').value),
      captureRate:+el('relianCaptureRate').value,
      baseAffinity:+el('relianAffinity').value,
      images:{basic:el('relianImageBasic').value.trim(),shiny:el('relianImageShiny').value.trim(),special:el('relianImageSpecial').value.trim()},
      genders:el('relianGenders').value.split(',').map(x=>x.trim()).filter(Boolean),
      sizes:el('relianSizes').value.split(',').map(x=>x.trim()).filter(Boolean),
      evolvesFrom:el('relianEvolvesFrom').value,
      evolvesToMany:selectedEvolutionIds,
      evolvesTo:selectedEvolutionIds[0]||'',
      evolutionMethod:el('relianEvolutionMethod').value.trim(),
      traitIds:Array.isArray(oldRelian?.traitIds)?oldRelian.traitIds:[],
      learnset:readLearnsetEditor(),
      encounters
    };
    const idx=data.relians.findIndex(x=>x.id===originalId||x.id===id);
    if(idx>=0)data.relians[idx]={...data.relians[idx],...r};
    else data.relians.push(r);
    syncEvolutionLinks(r);
    // Primeiro salva no navegador. A gravação na pasta é feita de forma serializada logo abaixo.
    saveData({sync:false});
    editRelian(id);

    const folder=await getWritableLinkedDirectory({request:true});
    if(!folder){
      alert('Relian salvo no navegador. Para salvar automaticamente em Pasta_Relians, vincule a pasta do projeto pelo botão “Vincular projeto”.');
      return;
    }
    const result=await enqueueFolderWrite(async()=>{
      const saved=await writeRelianFile(r,oldRelian,{requestPermission:false});
      if(saved.saved){
        for(const partnerId of [r.evolvesFrom,...relianEvolutionTargets(r)].filter(Boolean)){
          const partner=data.relians.find(x=>x.id===partnerId);
          if(partner)await writeRelianFile(partner,partner,{requestPermission:false});
        }
        await writeRootSnapshotOnly();
      }
      return saved;
    },'salvar-relian');
    if(result?.saved){
      setFolderStatus(`Relian salvo automaticamente em Pasta_Relians/${result.folderName}/relian.json`,true);
      alert(`Relian salvo com sucesso em Pasta_Relians/${result.folderName}.`);
    }else{
      alert('Relian salvo no navegador, mas a pasta local não pôde ser atualizada. Clique em “Sincronizar” para autorizar novamente.');
    }
  }catch(err){
    console.error('Erro ao salvar Relian:',err);
    alert(`Não foi possível concluir o salvamento do Relian: ${err.message||err.name||'erro desconhecido'}`);
  }finally{
    if(submitButton)submitButton.disabled=false;
  }
}
el('deleteRelianBtn').onclick=async()=>{const id=el('relianId').value;if(id&&confirm('Excluir este Relian?')){const old=data.relians.find(x=>x.id===id);data.relians=data.relians.filter(x=>x.id!==id);saveData();await deleteRelianFolder(old);clearRelianForm()}}


function entityElements(item){return Array.isArray(item?.elements)?item.elements.filter(Boolean):[]}
function renderEntityElementChecks(containerId,prefix){const box=el(containerId);if(!box)return;box.innerHTML=ELEMENT_OPTIONS.slice(1).map(x=>`<label class="element-check element-${x.key}"><input type="checkbox" name="${prefix}Element" value="${esc(x.value)}"><span>${esc(x.value)}</span></label>`).join('')}
function checkedElements(prefix){return [...document.querySelectorAll(`input[name="${prefix}Element"]:checked`)].map(x=>x.value)}
renderEntityElementChecks('biomeElementChecks','biome');
let activeEncounterRow=null;
function relianEditorElements(){return [1,2,3].map(n=>el('element'+n)?.value).filter(Boolean)}
function updateEncounterRowDisplay(row){if(!row)return;const region=data.regions.find(x=>x.id===row.querySelector('.enc-region').value),biome=data.biomes.find(x=>x.id===row.querySelector('.enc-biome').value),line=row.querySelector('.encounter-place-elements');if(!line)return;const elements=entityElements(biome);line.textContent=biome?(elements.length?`${region?.name||'Sem região'} · ${biome.name} · Elementos: ${elements.join(', ')}`:`${region?.name||'Sem região'} · ${biome.name}`):'Escolha uma região e um bioma.'}
el('regionForm').onsubmit=async e=>{e.preventDefault();const name=el('regionName').value.trim(),id=slug(name),biomes=[...document.querySelectorAll('input[name="regionBiome"]:checked')].map(x=>x.value);if(!name)return;const previous=data.regions.find(x=>x.id===id);const item={id,name,biomes,elements:previous?.elements||[]};const idx=data.regions.findIndex(x=>x.id===id);idx>=0?data.regions[idx]=item:data.regions.push(item);el('regionName').value='';document.querySelectorAll('input[name="regionBiome"]').forEach(x=>x.checked=false);saveData();renderRegionBiomeChecks();refreshEncounterSelects();await writeNamedEntityFile('Regioes',item,'region')}
el('biomeForm').onsubmit=async e=>{e.preventDefault();const name=el('biomeName').value.trim(),id=slug(name),elements=checkedElements('biome');if(!name)return;const item={id,name,elements};const idx=data.biomes.findIndex(x=>x.id===id);idx>=0?data.biomes[idx]=item:data.biomes.push(item);el('biomeName').value='';document.querySelectorAll('input[name="biomeElement"]').forEach(x=>x.checked=false);saveData();renderRegionBiomeChecks();refreshEncounterSelects();await writeNamedEntityFile('Biomas',item,'biome')}
function regionBiomeNames(region){const ids=Array.isArray(region?.biomes)?region.biomes:[];return ids.map(id=>nameOf(data.biomes,id)).filter(Boolean)}
function renderRegionBiomeChecks(){const box=el('regionBiomeChecks');if(!box)return;box.innerHTML=data.biomes.length?data.biomes.slice().sort((a,b)=>a.name.localeCompare(b.name,'pt-BR')).map(b=>`<label class="region-biome-choice"><input type="checkbox" name="regionBiome" value="${esc(b.id)}"><span>${esc(b.name)}</span></label>`).join(''):'<p class="empty">Cadastre ao menos um bioma primeiro.</p>'}
function renderRegionBiomeLists(){
  el('regionsList').innerHTML=data.regions.map(x=>{const biomes=regionBiomeNames(x);return `<div class="entity-item rich-entity-item"><span><b>${esc(x.name)}</b><small>${esc(x.id)}</small><em>${biomes.map(b=>`<i>${esc(b)}</i>`).join('')||'<i>Biomas ainda não vinculados</i>'}</em></span><button class="danger" onclick="deleteRegion('${x.id}')">Excluir</button></div>`}).join('');
  el('biomesList').innerHTML=data.biomes.map(x=>`<div class="entity-item rich-entity-item"><span><b>${esc(x.name)}</b><small>${esc(x.id)}</small><em>${entityElements(x).map(e=>`<i>${esc(e)}</i>`).join('')||'<i>Sem elementos</i>'}</em></span><button class="danger" onclick="deleteBiome('${x.id}')">Excluir</button></div>`).join('');
  renderRegionBiomeChecks();
} 
window.deleteRegion=async id=>{if(data.relians.some(r=>r.encounters?.some(e=>e.region===id)))return alert('Região em uso.');data.regions=data.regions.filter(x=>x.id!==id);saveData();await deleteNamedEntityFile('Regioes',id)};window.deleteBiome=async id=>{if(data.relians.some(r=>r.encounters?.some(e=>e.biome===id)))return alert('Bioma em uso.');data.biomes=data.biomes.filter(x=>x.id!==id);data.regions.forEach(r=>{if(Array.isArray(r.biomes))r.biomes=r.biomes.filter(x=>x!==id)});saveData();renderRegionBiomeChecks();await deleteNamedEntityFile('Biomas',id)}
el('biomeOverviewSelect').onchange=renderBiomeOverview;
function renderBiomeOverview(){const id=el('biomeOverviewSelect').value,rows=[];for(const r of data.relians)for(const e of r.encounters||[])if(e.biome===id)rows.push({r,e});el('biomeRelianOverview').innerHTML=rows.length?`<table class="overview-table"><tr><th>Reli-Info</th><th>Relian</th><th>Região</th><th>Períodos</th><th>Nível</th></tr>${rows.map(x=>`<tr><td>#${x.r.catalogNumber??'—'}</td><td>${esc(x.r.name)}</td><td>${esc(nameOf(data.regions,x.e.region))}</td><td>${esc(x.e.periods.join(', '))}</td><td>${x.e.minLevel}–${x.e.maxLevel}</td></tr>`).join('')}</table>`:'<p class="empty">Nenhum Relian neste bioma.</p>'}
function renderRules(){for(const [id,key] of [['ruleBaseHp','baseHp'],['ruleHpPerEvolution','hpPerEvolution'],['ruleAttrMin','attrMin'],['ruleAttrMax','attrMax'],['ruleModMin','modMin'],['ruleModMax','modMax'],['ruleMoveLimit','moveLimit'],['ruleShinyChance','shinyChance'],['ruleSpecialChance','specialChance']])el(id).value=data.rules[key]}
el('rulesForm').onsubmit=async e=>{e.preventDefault();const shiny=+el('ruleShinyChance').value,special=+el('ruleSpecialChance').value;if(shiny+special>100)return alert('Shiny + Especial não podem ultrapassar 100%.');data.rules={baseHp:+el('ruleBaseHp').value,hpPerEvolution:+el('ruleHpPerEvolution').value,attrMin:+el('ruleAttrMin').value,attrMax:+el('ruleAttrMax').value,modMin:+el('ruleModMin').value,modMax:+el('ruleModMax').value,moveLimit:+el('ruleMoveLimit').value,shinyChance:shiny,specialChance:special};saveData();await writeConfigFile('regras.json',{kind:'rules',tipoArquivo:'regras',...data.rules});alert(linkedDirectory?'Regras salvas no banco e em config/regras.json.':'Regras salvas no navegador.')}



function safeFolderName(name){return String(name||'Relian').replace(/[<>:"/\\|?*\x00-\x1F]/g,'').trim()||'Relian'}
function normalizeCatalogNumber(value){
  const number=Number(value);
  return Number.isInteger(number)&&number>0?number:null;
}
function formatCatalogNumber(value){
  const number=normalizeCatalogNumber(value);
  return number===null?'':String(number).padStart(3,'0');
}
function normalizeCatalogVariant(value){
  return String(value||'').trim().toLocaleUpperCase('pt-BR').replace(/[^A-Z0-9]/g,'').slice(0,3);
}
function catalogCode(relianOrNumber,variant=''){
  const number=typeof relianOrNumber==='object'?relianOrNumber?.catalogNumber:relianOrNumber;
  const resolvedVariant=typeof relianOrNumber==='object'?relianOrNumber?.catalogVariant:variant;
  const base=formatCatalogNumber(number);
  const suffix=normalizeCatalogVariant(resolvedVariant);
  return base?`${base}${suffix?`-${suffix}`:''}`:'';
}
function relianFolderName(relian){
  const number=catalogCode(relian);
  const name=safeFolderName(relian?.name||'Relian').replace(/\s+/g,'_');
  return number?`${number}_${name}`:name;
}
function relianToFileData(r){return{kind:'relian',tipoArquivo:'relian',id:r.id,catalogNumber:normalizeCatalogNumber(r.catalogNumber),numeroCatalogo:normalizeCatalogNumber(r.catalogNumber),reliInfo:normalizeCatalogNumber(r.catalogNumber),catalogVariant:normalizeCatalogVariant(r.catalogVariant),variacaoCatalogo:normalizeCatalogVariant(r.catalogVariant),codigoCatalogo:catalogCode(r),nome:r.name,descricao:r.description||'',notasHabitat:r.habitatNotes||'',notasEvolucao:r.evolutionNotes||'',classe:r.class,elementos:r.elements,elementosEspeciais:r.specialElements||[],estagio:r.stage,energiaBase:r.baseEnergy,raridade:r.rarity,taxaCaptura:r.captureRate,afinidadeBase:r.baseAffinity,imagens:r.images,generos:r.genders,tamanhos:r.sizes,evoluiDe:r.evolvesFrom||'',evoluiPara:relianEvolutionTargets(r)[0]||'',evoluiParaMultiplas:relianEvolutionTargets(r),evolvesToMany:relianEvolutionTargets(r),metodoEvolucao:r.evolutionMethod||'',tracos:r.traitIds,movimentos:(r.learnset||[]).map(x=>({nivel:x.level,movimento:x.moveId})),aparicoes:(r.encounters||[]).map(e=>({regiao:e.region,bioma:e.biome,periodos:e.periods,nivelMinimo:e.minLevel,nivelMaximo:e.maxLevel,peso:e.weight}))}}
async function writeJsonFile(dirName,fileName,payload){if(!linkedDirectory)return{saved:false,reason:'no-folder'};if(!await ensurePermission(linkedDirectory,true,'readwrite'))return{saved:false,reason:'permission'};const dir=await linkedDirectory.getDirectoryHandle(dirName,{create:true});const file=await dir.getFileHandle(fileName,{create:true});const writable=await file.createWritable();await writable.write(JSON.stringify(payload,null,2));await writable.close();folderSignature='';return{saved:true}}
async function writeRootJsonFile(fileName,payload){
  if(!linkedDirectory)return{saved:false,reason:'no-folder'};
  if(!await ensurePermission(linkedDirectory,false,'readwrite'))return{saved:false,reason:'permission'};
  const file=await linkedDirectory.getFileHandle(fileName,{create:true});
  const writable=await file.createWritable();
  await writable.write(JSON.stringify(payload,null,2));
  await writable.close();
  return{saved:true};
}
function traitToFileData(trait){
  const t=normalizeTrait(trait||{});
  return{kind:'trait',tipoArquivo:'traco',id:t.id,nome:t.name,descricao:t.description||'',comportamento:t.behavior||'',paladar:t.palate||'',modificadores:t.mods||{}};
}
async function getWritableLinkedDirectory({request=false}={}){
  if(!linkedDirectory){
    try{linkedDirectory=await loadHandle()}catch(err){console.warn('Não foi possível restaurar a pasta vinculada:',err)}
  }
  if(!linkedDirectory)return null;
  const allowed=await ensurePermission(linkedDirectory,request,'readwrite');
  if(!allowed)return null;
  return linkedDirectory;
}
async function enqueueFolderWrite(task,reason='alteracao'){
  folderWriteQueue=folderWriteQueue.then(async()=>{
    const folder=await getWritableLinkedDirectory({request:false});
    if(!folder)return false;
    return task();
  }).catch(err=>{
    console.error('Falha na fila de gravação da pasta:',reason,err);
    setFolderStatus(`Falha ao salvar na pasta local: ${err.message||err.name||'erro desconhecido'}`,false,true);
    return false;
  });
  return folderWriteQueue;
}
async function writeRootSnapshotOnly(){
  if(!linkedDirectory)return false;
  const snapshot={kind:'relians-save',tipoArquivo:'banco-completo',saveVersion:SAVE_SCHEMA_VERSION,updatedAt:new Date().toISOString(),data:migrateData(clone(data))};
  return writeRootJsonFile('relians-save.json',snapshot);
}
async function writeFullFolderSnapshot(){
  if(!linkedDirectory)return false;
  if(!await ensurePermission(linkedDirectory,false,'readwrite'))return false;
  folderWriteInProgress=true;
  try{
    const snapshot={kind:'relians-save',tipoArquivo:'banco-completo',saveVersion:SAVE_SCHEMA_VERSION,updatedAt:new Date().toISOString(),data:migrateData(clone(data))};
    await writeRootJsonFile('relians-save.json',snapshot);
    await writeConfigFile('regras.json',{kind:'rules',tipoArquivo:'regras',...data.rules});
    for(const item of data.regions||[])await writeNamedEntityFile('Regioes',item,'region');
    for(const item of data.biomes||[])await writeNamedEntityFile('Biomas',item,'biome');
    for(const move of Object.values(data.moves||{}))await writeMoveFile(move);
    for(const trait of Object.values(data.traits||{}))await writeJsonFile('Tracos',`${trait.id}.json`,traitToFileData(trait));
    for(const relian of data.relians||[])await writeRelianFile(relian,null);
    for(const sheet of data.storySheets||[])await writeStorySheetFile(sheet,'');
    lastFolderWriteAt=Date.now();
    try{const files=await collectDirectoryFiles(linkedDirectory);folderSignature=signatureOf(files)}catch{folderSignature=''}
    setFolderStatus(`Tudo sincronizado com ${linkedDirectory.name} · ${new Date().toLocaleTimeString()}`,true);
    return true;
  }finally{folderWriteInProgress=false}
}
function queueFullFolderSync(reason='change'){
  if(!linkedDirectory)return;
  clearTimeout(folderSyncDebounceTimer);
  folderSyncDebounceTimer=setTimeout(()=>{
    enqueueFolderWrite(()=>writeFullFolderSnapshot(),reason);
  },450);
}

async function writeConfigFile(fileName,payload){return writeJsonFile('config',fileName,payload)}
async function writeNamedEntityFile(folder,item,kind){const result=await writeJsonFile(folder,`${item.id}.json`,{kind,tipoArquivo:kind==='region'?'regiao':'bioma',id:item.id,nome:item.name,...(kind==='region'?{biomas:item.biomes||[]}:{elementos:item.elements||[]})});if(result.saved)setFolderStatus(`${kind==='region'?'Região':'Bioma'} salvo em ${folder}/${item.id}.json`,true);return result}
async function deleteNamedEntityFile(folder,id){if(!linkedDirectory||!await ensurePermission(linkedDirectory,true,'readwrite'))return false;try{const dir=await linkedDirectory.getDirectoryHandle(folder);await dir.removeEntry(`${id}.json`);folderSignature='';return true}catch(err){if(err.name!=='NotFoundError')console.warn(err);return false}}
function relianFolderCandidates(r){
  if(!r)return[];
  return [...new Set([relianFolderName(r),safeFolderName(r.name)].filter(Boolean))];
}
async function removeRelianFolderCandidates(root,r,except=''){
  for(const folderName of relianFolderCandidates(r)){
    if(folderName===except)continue;
    try{await root.removeEntry(folderName,{recursive:true})}
    catch(err){if(err.name!=='NotFoundError')console.warn(err)}
  }
}
async function writeRelianFile(r,oldRelian=null,{requestPermission=false}={}){
  if(!linkedDirectory)return{saved:false,reason:'no-folder'};
  if(!await ensurePermission(linkedDirectory,requestPermission,'readwrite'))return{saved:false,reason:'permission'};
  const root=await linkedDirectory.getDirectoryHandle('Pasta_Relians',{create:true});
  const folderName=relianFolderName(r);
  const dir=await root.getDirectoryHandle(folderName,{create:true});
  const file=await dir.getFileHandle('relian.json',{create:true});
  const writable=await file.createWritable();
  await writable.write(JSON.stringify(relianToFileData(r),null,2));
  await writable.close();
  if(oldRelian)await removeRelianFolderCandidates(root,oldRelian,folderName);
  folderSignature='';
  setFolderStatus(`Relian salvo em Pasta_Relians/${folderName}/relian.json`,true);
  return{saved:true,folderName};
}
async function deleteRelianFolder(r){
  if(!r||!linkedDirectory||!await ensurePermission(linkedDirectory,true,'readwrite'))return false;
  try{
    const root=await linkedDirectory.getDirectoryHandle('Pasta_Relians');
    await removeRelianFolderCandidates(root,r);
    folderSignature='';
    return true;
  }catch(err){if(err.name!=='NotFoundError')console.warn(err);return false}
}


function moveToFileData(move){
  return {
    kind:'move',
    tipoArquivo:'movimento',
    id:move.id,
    nome:move.name,
    tipo:move.type,
    elementos:getMoveElements(move),
    elemento:getMoveElements(move).join(', '),
    dano:move.damage||0,
    energia:move.energy||0,
    precisao:move.accuracy||0,
    alcance:move.range||'',
    descricao:move.description||'',
    efeitos:move.effects||[],
    tags:move.tags||[]
  };
}
function clearMoveForm(){
  el('moveOriginalId').value='';el('moveName').value='';el('moveId').value='';el('moveType').value='NEH';
  el('moveDamage').value=0;el('moveEnergy').value=0;el('moveElement1').value='Nenhum';el('moveElement2').value='Nenhum';el('moveAccuracy').value=0;
  el('moveRange').value='';el('moveDescription').value='';el('moveEffects').value='';el('moveTags').value='';
  el('moveFormTitle').textContent='Cadastrar movimento';el('deleteMoveBtn').disabled=true;
}
function editMove(id){
  const m=data.moves[id];if(!m)return;el('moveOriginalId').value=id;el('moveName').value=m.name||'';el('moveId').value=m.id||'';
  el('moveType').value=m.type||'NEH';el('moveDamage').value=m.damage??0;el('moveEnergy').value=m.energy??0;
  {const moveEls=getMoveElements(m);el('moveElement1').value=moveEls[0]||'Nenhum';el('moveElement2').value=moveEls[1]||'Nenhum';}el('moveAccuracy').value=m.accuracy??0;el('moveRange').value=m.range||'';
  el('moveDescription').value=m.description||'';el('moveEffects').value=(m.effects||[]).join('\n');el('moveTags').value=(m.tags||[]).join(', ');
  el('moveFormTitle').textContent=`Editar ${m.name}`;el('deleteMoveBtn').disabled=false;
}
window.editMove=editMove;
function renderMoves(){
  if(!el('movesList'))return;const q=(el('moveSearch')?.value||'').trim().toLowerCase();
  const list=Object.values(data.moves||{}).filter(m=>!q||[m.name,m.id,m.type,...getMoveElements(m),'Neutro'].some(v=>String(v||'').toLowerCase().includes(q))).sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));
  el('movesList').innerHTML=list.length?list.map(m=>`<div class="entity-row move-list-row"><span><b>${esc(m.name)}</b><small>${esc(m.id)} · ${esc(m.type)}${` · ${esc(getMoveElements(m).join(', ')||'Neutro')}`}<br>Dano ${m.damage??0} · ENG ${m.energy??0}</small></span><button type="button" onclick="editMove('${esc(m.id)}')">Editar</button></div>`).join(''):'<p class="empty">Nenhum movimento encontrado.</p>';
}
async function writeMoveFile(move){
  if(!linkedDirectory)return{saved:false,reason:'no-folder'};
  if(!await ensurePermission(linkedDirectory,true,'readwrite'))return{saved:false,reason:'permission'};
  const dir=await linkedDirectory.getDirectoryHandle('Movimentos',{create:true});
  const file=await dir.getFileHandle(`${move.id}.json`,{create:true});
  const writable=await file.createWritable();
  await writable.write(JSON.stringify(moveToFileData(move),null,2));await writable.close();
  folderSignature='';return{saved:true};
}
async function deleteMoveFile(id){
  if(!linkedDirectory||!await ensurePermission(linkedDirectory,true,'readwrite'))return false;
  try{const dir=await linkedDirectory.getDirectoryHandle('Movimentos');await dir.removeEntry(`${id}.json`);folderSignature='';return true}catch(err){if(err.name!=='NotFoundError')console.warn(err);return false}
}
el('newMoveBtn').onclick=clearMoveForm;
el('moveSearch').addEventListener('input',renderMoves);
el('moveName').addEventListener('input',()=>{if(!el('moveOriginalId').value)el('moveId').value=slug(el('moveName').value)});
el('moveForm').onsubmit=async e=>{
  e.preventDefault();const original=el('moveOriginalId').value;const id=slug(el('moveId').value||el('moveName').value);
  if(!id)return alert('Informe um nome ou ID válido.');
  if(original!==id&&data.moves[id])return alert('Já existe um movimento com esse ID.');
  const chosenElements=[el('moveElement1').value,el('moveElement2').value].filter(x=>x&&x!=='Nenhum');const elements=[...new Set(chosenElements)].slice(0,2);const move={id,name:el('moveName').value.trim(),type:el('moveType').value.trim()||'NEH',damage:+el('moveDamage').value||0,energy:+el('moveEnergy').value||0,elements,element:elements.join(', '),accuracy:+el('moveAccuracy').value||0,range:el('moveRange').value.trim(),description:el('moveDescription').value.trim(),effects:el('moveEffects').value.split('\n').map(x=>x.trim()).filter(Boolean),tags:el('moveTags').value.split(',').map(x=>x.trim()).filter(Boolean)};
  if(original&&original!==id){delete data.moves[original];for(const r of data.relians)for(const l of r.learnset||[])if(l.moveId===original)l.moveId=id;await deleteMoveFile(original)}
  data.moves[id]=move;saveData();editMove(id);
  try{const result=await writeMoveFile(move);if(result.saved){el('moveSaveStatus').textContent=`Arquivo salvo em Movimentos/${id}.json`;setFolderStatus(`Movimento salvo na pasta: Movimentos/${id}.json`,true);alert('Movimento salvo no banco e na pasta Movimentos.')}else alert('Movimento salvo no navegador. Vincule a pasta-base para criar o arquivo automaticamente.')}catch(err){console.error(err);alert('O movimento foi salvo no navegador, mas não foi possível escrever na pasta. Verifique a permissão de edição.')}
};
el('deleteMoveBtn').onclick=async()=>{
  const id=el('moveOriginalId').value;if(!id||!confirm('Excluir este movimento?'))return;
  const used=data.relians.filter(r=>(r.learnset||[]).some(x=>x.moveId===id));if(used.length&&!confirm(`Este movimento é usado por ${used.length} Relian(s). Excluir mesmo assim?`))return;
  delete data.moves[id];for(const r of data.relians)r.learnset=(r.learnset||[]).filter(x=>x.moveId!==id);saveData();await deleteMoveFile(id);clearMoveForm();
};

function mergeNamedList(target,items){for(const raw of items||[]){const name=String(raw.name||raw.nome||'').trim();if(!name)continue;const id=String(raw.id||slug(name));const idx=target.findIndex(x=>x.id===id);const elements=Array.isArray(raw.elements||raw.elementos)?(raw.elements||raw.elementos):(idx>=0?target[idx].elements||[]:[]);const biomes=Array.isArray(raw.biomes||raw.biomas)?(raw.biomes||raw.biomas):(idx>=0?target[idx].biomes||[]:[]);const item={...(idx>=0?target[idx]:{}),...raw,id,name,elements,biomes};idx>=0?target[idx]=item:target.push(item)}}
function normalizeTrait(raw){
  const name=String(raw.name||raw.nome||'').trim();
  const status=raw.status||{};
  const sourceMods=raw.mods||raw.modificadores||{};
  const mods={...sourceMods};
  for(const k of ATTR_KEYS){
    if(status[k]!=null)mods[k]=Number(status[k])||0;
  }
  if(raw.hp!=null)mods.hp=Number(raw.hp)||0;
  if(raw.eng!=null)mods.energia=Number(raw.eng)||0;
  if(raw.energia!=null)mods.energia=Number(raw.energia)||0;
  return{
    id:String(raw.id||slug(name)),
    name,
    description:String(raw.description||raw.descricao||''),
    behavior:String(raw.behavior||raw.comportamento||''),
    palate:String(raw.palate||raw.paladar||''),
    mods
  }
}
function normalizeMove(raw){const name=String(raw.name||raw.nome||'').trim();const source=Array.isArray(raw.elements||raw.elementos)?(raw.elements||raw.elementos):String(raw.element||raw.elemento||'').split(/[\/,+]/);const elements=[...new Set(source.map(x=>String(x||'').trim()).filter(x=>MOVE_ELEMENT_COLORS[x]))].slice(0,2);return{id:String(raw.id||slug(name)),name,type:String(raw.type||raw.tipo||'NEH'),damage:Number(raw.damage??raw.dano??0),energy:Number(raw.energy??raw.energia??0),elements,element:elements.join(', '),accuracy:Number(raw.accuracy??raw.precisao??0),range:String(raw.range||raw.alcance||''),description:String(raw.description||raw.descricao||''),effects:raw.effects||raw.efeitos||[],tags:raw.tags||raw.etiquetas||[]}}
function normalizeRelian(raw){const name=String(raw.name||raw.nome||'').trim(),imgs=raw.images||raw.imagens||{};return{id:String(raw.id||slug(name)),catalogNumber:Number(raw.catalogNumber??raw.reliInfo??raw.numeroCatalogo??0)||null,catalogVariant:normalizeCatalogVariant(raw.catalogVariant??raw.variacaoCatalogo??raw.variacao??''),name,description:String(raw.description||raw.descricao||''),habitatNotes:String(raw.habitatNotes||raw.notasHabitat||''),evolutionNotes:String(raw.evolutionNotes||raw.notasEvolucao||''),class:normalizeRelianClass(raw.class||raw.classe||''),elements:raw.elements||raw.elementos||[],specialElements:raw.specialElements||raw.elementosEspeciais||raw.elementosEspecial||[],stage:Number(raw.stage??raw.estagio??1),baseEnergy:Number(raw.baseEnergy??raw.energiaBase??85),rarity:normalizeRarityId(raw.rarity||raw.raridade||'comum'),captureRate:Number(raw.captureRate??raw.taxaCaptura??RARITY_BASE[raw.rarity||raw.raridade||'comum']??40),baseAffinity:Number(raw.baseAffinity??raw.afinidadeBase??2),images:{basic:String(imgs.basic||imgs.basica||raw.image||raw.imagem||''),shiny:String(imgs.shiny||''),special:String(imgs.special||imgs.especial||'')},genders:raw.genders||raw.generos||['Indefinido'],sizes:raw.sizes||raw.tamanhos||['M'],traitIds:raw.traitIds||raw.tracos||[],evolvesFrom:String(raw.evolvesFrom||raw.evoluiDe||''),evolvesToMany:(Array.isArray(raw.evolvesToMany)?raw.evolvesToMany:Array.isArray(raw.evoluiParaMultiplas)?raw.evoluiParaMultiplas:Array.isArray(raw.evolvesTo)?raw.evolvesTo:Array.isArray(raw.evoluiPara)?raw.evoluiPara:[raw.evolvesTo||raw.evoluiPara||'']).map(x=>String(x||'')).filter(Boolean),evolvesTo:String((Array.isArray(raw.evolvesToMany)?raw.evolvesToMany[0]:Array.isArray(raw.evoluiParaMultiplas)?raw.evoluiParaMultiplas[0]:Array.isArray(raw.evolvesTo)?raw.evolvesTo[0]:Array.isArray(raw.evoluiPara)?raw.evoluiPara[0]:raw.evolvesTo||raw.evoluiPara)||''),evolutionMethod:String(raw.evolutionMethod||raw.metodoEvolucao||''),learnset:(raw.learnset||raw.movimentos||[]).map(x=>({level:Number(x.level??x.nivel??1),moveId:String(x.moveId||x.movimento||x.id||'')})),encounters:(raw.encounters||raw.aparicoes||[]).map(e=>({region:String(e.region||e.regiao||''),biome:String(e.biome||e.bioma||''),periods:e.periods||e.periodos||['manha'],minLevel:Number(e.minLevel??e.nivelMinimo??1),maxLevel:Number(e.maxLevel??e.nivelMaximo??100),weight:Number(e.weight??e.peso??10)}))}}
async function fileToDataURL(file){return new Promise((res,rej)=>{const fr=new FileReader();fr.onload=()=>res(fr.result);fr.onerror=rej;fr.readAsDataURL(file)})}
async function importFileSet(files,{silent=false}={}){
  const list=[...files],jsonFiles=list.filter(f=>f.name.toLowerCase().endsWith('.json'));let added=0,updated=0,traits=0,moves=0,ignored=0;
  const imageMap=new Map();for(const f of list)if(/\.(png|jpe?g|webp|gif)$/i.test(f.name)){const rel=(f.webkitRelativePath||f.name).replace(/\\/g,'/');imageMap.set(rel.toLowerCase(),f);imageMap.set(f.name.toLowerCase(),f)}
  for(const file of jsonFiles){try{const raw=JSON.parse(await file.text()),path=(file.webkitRelativePath||file.name).replace(/\\/g,'/').toLowerCase();if(raw?.kind==='relians-save'&&raw?.data){data=migrateData(raw.data);continue}if(Array.isArray(raw.regions)||Array.isArray(raw.biomes)){mergeNamedList(data.regions,raw.regions);mergeNamedList(data.biomes,raw.biomes);continue}if(path.includes('/regioes/')||raw.kind==='region'||raw.tipoArquivo==='regiao'){mergeNamedList(data.regions,Array.isArray(raw)?raw:[raw]);continue}if(path.includes('/biomas/')||raw.kind==='biome'||raw.tipoArquivo==='bioma'){mergeNamedList(data.biomes,Array.isArray(raw)?raw:[raw]);continue}if(path.endsWith('/config/regras.json')||raw.kind==='rules'||raw.tipoArquivo==='regras'){data.rules={...data.rules,...raw};delete data.rules.kind;delete data.rules.tipoArquivo;continue}if(path.includes('/tracos/')||raw.kind==='trait'||raw.tipoArquivo==='traco'){for(const t of(Array.isArray(raw)?raw:[raw])){const n=normalizeTrait(t);if(n.name){data.traits[n.id]=n;traits++}}continue}if(path.includes('/fichas_especiais/')||raw.kind==='story-sheet'||raw.tipoArquivo==='ficha-especial'){for(const s of(Array.isArray(raw)?raw:[raw])){if(s.id){const i=(data.storySheets||[]).findIndex(x=>x.id===s.id);i>=0?data.storySheets[i]=s:data.storySheets.push(s)}}continue}if(path.includes('/movimentos/')||raw.kind==='move'||raw.tipoArquivo==='movimento'){for(const m of(Array.isArray(raw)?raw:[raw])){const n=normalizeMove(m);if(n.name){data.moves[n.id]=n;moves++}}continue}const candidates=Array.isArray(raw)?raw:Array.isArray(raw.relians)?raw.relians:[raw];for(const c of candidates){const r=normalizeRelian(c);const relativePath=(file.webkitRelativePath||'').replace(/\\/g,'/');const parentName=relativePath.split('/').slice(-2,-1)[0]||'';const folderMatch=parentName.match(/^(\d{1,6})(?:-([A-Z0-9]{1,3}))?_(.+)$/i);if(folderMatch){if(!r.catalogNumber)r.catalogNumber=Number(folderMatch[1])||null;if(!r.catalogVariant)r.catalogVariant=normalizeCatalogVariant(folderMatch[2]||'')}if(!r.name||!r.encounters.length){ignored++;continue}const folder=relativePath.split('/').slice(0,-1).join('/');r._sourceFolder=parentName||r._sourceFolder||'';r.imageDataByColor={};for(const color of['basic','shiny','special']){const filename=r.images[color];if(!filename)continue;const img=imageMap.get(`${folder}/${filename}`.toLowerCase())||imageMap.get(filename.toLowerCase());if(img)r.imageDataByColor[color]=await fileToDataURL(img)}const idx=data.relians.findIndex(x=>x.id===r.id);if(idx>=0){data.relians[idx]={...data.relians[idx],...r};updated++}else{data.relians.push(r);added++}}}catch(err){console.warn(file.name,err);ignored++}}
  saveData();if(!silent)alert(`Importação concluída: ${added} novo(s), ${updated} atualizado(s), ${traits} traço(s), ${moves} movimento(s), ${ignored} ignorado(s).`);return{added,updated,traits,moves,ignored};
}
el('relianFolderInput').onchange=async e=>{if(e.target.files.length)await importFileSet(e.target.files);e.target.value=''}
function openHandleDB(){return new Promise((res,rej)=>{const q=indexedDB.open(HANDLE_DB,1);q.onupgradeneeded=()=>q.result.createObjectStore('handles');q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)})}
async function saveHandle(h){const db=await openHandleDB();return new Promise((res,rej)=>{const tx=db.transaction('handles','readwrite');tx.objectStore('handles').put(h,'root');tx.oncomplete=res;tx.onerror=()=>rej(tx.error)})}
async function loadHandle(){const db=await openHandleDB();return new Promise((res,rej)=>{const q=db.transaction('handles').objectStore('handles').get('root');q.onsuccess=()=>res(q.result||null);q.onerror=()=>rej(q.error)})}
async function collectDirectoryFiles(dir,prefix=''){const out=[];for await(const[name,handle]of dir.entries()){const path=prefix?`${prefix}/${name}`:name;if(handle.kind==='file'){const f=await handle.getFile();Object.defineProperty(f,'webkitRelativePath',{value:path});out.push(f)}else out.push(...await collectDirectoryFiles(handle,path))}return out}
function signatureOf(files){return files.map(f=>`${f.webkitRelativePath}:${f.size}:${f.lastModified}`).sort().join('|')}
async function ensurePermission(handle,request=false,mode='read'){if(!handle)return false;const opts={mode};if(await handle.queryPermission(opts)==='granted')return true;return request&&(await handle.requestPermission(opts)==='granted')}
async function syncLinkedFolder({request=false,silent=false,writeBack=true}={}){
  if(!linkedDirectory)return false;
  if(folderWriteInProgress)return true;
  if(!await ensurePermission(linkedDirectory,request,'readwrite')){setFolderStatus('Pasta encontrada, mas precisa de autorização de leitura e gravação.',false,true);return false}
  const files=await collectDirectoryFiles(linkedDirectory),sig=signatureOf(files);
  if(sig!==folderSignature){
    folderSignature=sig;
    await importFileSet(files,{silent:true});
  }
  if(writeBack)await writeFullFolderSnapshot();
  setFolderStatus(`Pasta sincronizada: ${linkedDirectory.name} · ${new Date().toLocaleTimeString()}`,true);
  if(!silent)alert('Pasta sincronizada. O banco e os arquivos locais estão atualizados.');
  return true
}
function setFolderStatus(text,ok=false,warn=false){el('folderStatus').textContent=text;el('folderStatus').className='folder-status'+(ok?' ok':'')+(warn?' warn':'')}
el('linkFolderBtn').onclick=async()=>{
  if(!window.isSecureContext||!window.showDirectoryPicker)return alert('Para gravar automaticamente na pasta, abra o Gerador por localhost no Chrome/Edge. Ex.: http://localhost:8000');
  try{
    linkedDirectory=await window.showDirectoryPicker({mode:'readwrite'});
    if(!await ensurePermission(linkedDirectory,true,'readwrite'))throw new Error('Permissão de gravação negada.');
    await saveHandle(linkedDirectory);
    folderSignature='';
    await syncLinkedFolder({request:false,silent:true,writeBack:true});
    startAutoSync();
    alert(`Projeto vinculado a ${linkedDirectory.name}. A partir de agora, cada alteração salva no Gerador será gravada automaticamente nessa pasta.`);
  }catch(err){
    console.error('Falha ao vincular pasta:',err);
    if(err.name!=='AbortError')alert(`Não foi possível vincular a pasta: ${err.message||err.name||'erro desconhecido'}`)
  }
}
el('syncFolderBtn').onclick=async()=>{
  try{
    if(!linkedDirectory)linkedDirectory=await loadHandle();
    if(!linkedDirectory)return alert('Nenhuma pasta vinculada.');
    if(!await ensurePermission(linkedDirectory,true,'readwrite'))return alert('Autorize leitura e gravação da pasta para sincronizar.');
    await syncLinkedFolder({request:false,silent:false,writeBack:true});
  }catch(err){console.error(err);alert(`Falha ao sincronizar: ${err.message||err.name||'erro desconhecido'}`)}
}
function startAutoSync(){clearInterval(syncTimer);syncTimer=null;/* alterações feitas no Gerador já usam saveData() -> queueFullFolderSync(); leitura da pasta fica no botão Sincronizar */}
async function restoreLinkedFolder(){
  try{
    linkedDirectory=await loadHandle();
    if(linkedDirectory){
      setFolderStatus(`Pasta lembrada: ${linkedDirectory.name}. Clique em Sincronizar se o navegador pedir autorização.`,false,true);
      const granted=await ensurePermission(linkedDirectory,false,'readwrite');
      if(granted){await syncLinkedFolder({silent:true,writeBack:true});startAutoSync()}
    }
  }catch(err){console.warn(err)}
}
el('exportBtn').onclick=()=>{const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='relians-banco-v4-4.json';a.click();URL.revokeObjectURL(a.href)}
el('importInput').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{data=migrateData(JSON.parse(await f.text()));saveData();alert('Banco importado.')}catch{alert('Arquivo inválido.')}}
el('resetBtn').onclick=()=>{if(confirm('Restaurar exemplos?')){data=clone(defaultData);saveData();clearRelianForm()}}



/* V6.3 — evolução, banco de fichas e cabeçalho refinado */
function refreshEvolutionOptions(excludeId=''){
  const from=el('relianEvolvesFrom');
  if(from){
    const old=from.value;
    from.innerHTML='<option value="">Nenhum</option>'+data.relians.filter(r=>r.id!==excludeId).sort(sortReliansByCatalog).map(r=>`<option value="${esc(r.id)}">#${catalogCode(r)||'—'} ${esc(r.name)}</option>`).join('');
    if(data.relians.some(r=>r.id===old&&r.id!==excludeId))from.value=old;
  }
  const to=el('relianEvolvesTo');
  if(to){
    const selected=[...to.selectedOptions].map(o=>o.value);
    to.innerHTML=data.relians.filter(r=>r.id!==excludeId).sort(sortReliansByCatalog).map(r=>`<option value="${esc(r.id)}">#${catalogCode(r)||'—'} ${esc(r.name)}</option>`).join('');
    [...to.options].forEach(o=>o.selected=selected.includes(o.value));
    renderEvolutionTargetsEditor();
  }
}
let activeEvolutionExcludeId='';
function selectedEvolutionTargetIds(){const select=el('relianEvolvesTo');return select?[...select.selectedOptions].map(o=>o.value).filter(Boolean):[]}
function renderEvolutionTargetsEditor(){
  const box=el('evolutionTargetsEditor'),select=el('relianEvolvesTo');if(!box||!select)return;
  const ids=selectedEvolutionTargetIds();
  if(!ids.length){box.innerHTML='<div class="evolution-target-empty">Nenhuma evolução adicionada.</div>';return}
  box.innerHTML=ids.map(id=>{const r=data.relians.find(x=>x.id===id);if(!r)return'';return `<div class="evolution-target-row"><div><small>#${esc(catalogCode(r)||'—')}</small><strong>${esc(r.name)}</strong></div><button type="button" class="danger remove-evolution-target" data-id="${esc(id)}" title="Remover evolução">×</button></div>`}).join('');
  box.querySelectorAll('.remove-evolution-target').forEach(btn=>btn.onclick=()=>{const option=[...select.options].find(o=>o.value===btn.dataset.id);if(option)option.selected=false;renderEvolutionTargetsEditor()});
}
function renderEvolutionPickerList(){
  const box=el('evolutionPickerList');if(!box)return;
  const query=String(el('evolutionPickerSearch')?.value||'').trim().toLocaleLowerCase('pt-BR');
  const selected=new Set(selectedEvolutionTargetIds());
  const rows=data.relians.filter(r=>r.id!==activeEvolutionExcludeId&&!selected.has(r.id)).sort(sortReliansByCatalog).filter(r=>{const text=`${r.name} ${r.id} ${catalogCode(r)||''}`.toLocaleLowerCase('pt-BR');return !query||text.includes(query)});
  if(!rows.length){box.innerHTML='<div class="move-picker-no-results">Nenhum Relian disponível para adicionar.</div>';return}
  box.innerHTML=rows.map(r=>`<button type="button" class="move-picker-result evolution-picker-result" data-id="${esc(r.id)}"><span class="evolution-picker-code">#${esc(catalogCode(r)||'—')}</span><span class="move-picker-result-main"><b>${esc(r.name)}</b><small>${esc((r.elements||[]).join(' / ')||'Sem elemento')} · Estágio ${Number(r.stage)||1}</small></span></button>`).join('');
  box.querySelectorAll('.evolution-picker-result').forEach(btn=>btn.onclick=()=>{const select=el('relianEvolvesTo'),option=[...select.options].find(o=>o.value===btn.dataset.id);if(option)option.selected=true;renderEvolutionTargetsEditor();el('evolutionPickerDialog')?.close()});
}
function openEvolutionPicker(){
  const dialog=el('evolutionPickerDialog');if(!dialog)return;
  activeEvolutionExcludeId=el('relianId')?.value||'';
  if(el('evolutionPickerSearch'))el('evolutionPickerSearch').value='';
  renderEvolutionPickerList();dialog.showModal();setTimeout(()=>el('evolutionPickerSearch')?.focus(),30);
}
if(el('addEvolutionTargetBtn'))el('addEvolutionTargetBtn').onclick=openEvolutionPicker;
if(el('evolutionPickerSearch'))el('evolutionPickerSearch').addEventListener('input',renderEvolutionPickerList);
if(el('evolutionPickerCloseBtn'))el('evolutionPickerCloseBtn').onclick=()=>el('evolutionPickerDialog')?.close();

function syncEvolutionLinks(r){
  const targets=relianEvolutionTargets(r);
  r.evolvesToMany=targets;
  r.evolvesTo=targets[0]||'';
  for(const other of data.relians){
    if(other.id===r.id)continue;
    if(other.evolvesFrom===r.id&&!targets.includes(other.id))other.evolvesFrom='';
  }
  if(r.evolvesFrom){
    const prev=data.relians.find(x=>x.id===r.evolvesFrom);
    if(prev){
      const prevTargets=relianEvolutionTargets(prev);
      if(!prevTargets.includes(r.id))prevTargets.push(r.id);
      prev.evolvesToMany=prevTargets;
      prev.evolvesTo=prevTargets[0]||'';
    }
  }
  for(const targetId of targets){
    const next=data.relians.find(x=>x.id===targetId);
    if(next)next.evolvesFrom=r.id;
  }
}

/* V6.2 — fichas de personagem e Relians de história */
const CHARACTER_ATTRS=[['forca','Força'],['agilidade','Agilidade'],['vigor','Vigor'],['presenca','Presença'],['intelecto','Intelecto'],['sabedoria','Sabedoria']];
const CHARACTER_SKILLS=['Acrobacias','Atletismo','Arte','História','Herborismo','Intimidação','Adestramento','Atualidade','Atuação','Iniciativa','Investigação','Luta','Culinária','Conhecimento','Ciências','Lábia','Liderança','Medicina','Crime','Carisma','Cartografia','Misticismo','Montaria','Navegação','Diplomacia','Direção','Disfarce','Psicologia','Percepção','Reflexos','Engenharia','Estratégia','Enganação','Religião','Sobrevivência','Tática','Fortitude','Furtividade','Fabricação','TI','Vontade','Zoologia'];
function storyType(){return document.querySelector('input[name="storyType"]:checked')?.value||'character'}
function refreshStoryOptions(){
 const species=el('specialSpecies');if(species){const old=species.value;species.innerHTML='<option value="">Selecione...</option>'+data.relians.map(r=>`<option value="${esc(r.id)}">#${catalogCode(r)||'—'} ${esc(r.name)}</option>`).join('');if(data.relians.some(r=>r.id===old))species.value=old}
 const trait=el('specialTrait');if(trait){const old=trait.value;trait.innerHTML='<option value="">Nenhum</option>'+Object.values(data.traits).map(t=>`<option value="${esc(t.id)}">${esc(t.name)}</option>`).join('');if(data.traits[old])trait.value=old}
 document.querySelectorAll('.special-move-select').forEach(select=>{const old=select.value;select.innerHTML='<option value="">Nenhum movimento</option>'+Object.values(data.moves).sort((a,b)=>a.name.localeCompare(b.name)).map(m=>`<option value="${esc(m.id)}">${esc(m.name)} (${esc(m.id)})</option>`).join('');if(data.moves[old])select.value=old})
 document.querySelectorAll('.team-species').forEach(select=>{const old=select.value;const saved=(data.savedRelianSheets||[]).slice().sort((a,b)=>String(a.nickname||a.speciesName||'').localeCompare(String(b.nickname||b.speciesName||''),'pt-BR'));select.innerHTML='<option value="">Selecione uma ficha salva...</option>'+saved.map(s=>`<option value="sheet:${esc(s.id)}">${esc(s.nickname||s.speciesName)} · Nv. ${Number(s.level)||1}${s.originalTrainer?` · Treinador: ${esc(s.originalTrainer)}`:''}</option>`).join('');if([...select.options].some(o=>o.value===old))select.value=old})
}
function setupSpecialAttributes(){const box=el('specialAttributes');if(box)box.innerHTML=ATTR_KEYS.map(k=>`<label>${esc(ATTR_LABELS[k])}<input class="special-attr" data-attr="${k}" type="number" min="0" value="1" /></label>`).join('')}
function setupSpecialRelianEditors(){
 const moves=el('specialMovesEditor');if(moves)moves.innerHTML=[0,1,2,3].map(i=>`<div class="special-move-row"><span class="special-slot-number">${i+1}</span><label>Movimento<select class="special-move-select" data-index="${i}"></select></label><div class="special-move-info" data-index="${i}">Nenhum movimento selecionado.</div></div>`).join('');
 const items=el('specialItemsEditor');if(items)items.innerHTML=[0,1].map(i=>`<div class="special-item-card"><div class="special-item-title">Item ${i+1}</div><label>Nome<input class="special-item-name" data-index="${i}" placeholder="Nome do item" /></label><label>Descrição<textarea class="special-item-description" data-index="${i}" rows="3" placeholder="Efeito, uso ou observações..."></textarea></label></div>`).join('');
 refreshStoryOptions();
 document.querySelectorAll('.special-move-select').forEach(select=>select.addEventListener('change',()=>{updateSpecialMoveInfo();renderStoryPreview()}));
 document.querySelectorAll('.special-item-name,.special-item-description').forEach(input=>input.addEventListener('input',renderStoryPreview));
 updateSpecialMoveInfo();
}
function updateSpecialMoveInfo(){document.querySelectorAll('.special-move-select').forEach(select=>{const box=document.querySelector(`.special-move-info[data-index="${select.dataset.index}"]`),m=data.moves[select.value];if(box)box.innerHTML=m?`<b>${esc(m.type||'MOV')}</b><span>Dano ${Number(m.damage)||0} · ENG ${Number(m.energy)||0}</span><small>${esc(m.description||'Sem descrição.')}</small>`:'Nenhum movimento selecionado.'})}
function readSpecialMoves(){return [...document.querySelectorAll('.special-move-select')].map(x=>x.value).filter(Boolean)}
function readSpecialItems(){return [0,1].map(i=>({name:document.querySelector(`.special-item-name[data-index="${i}"]`)?.value.trim()||'',description:document.querySelector(`.special-item-description[data-index="${i}"]`)?.value.trim()||''})).filter(x=>x.name||x.description)}
function setupCharacterFields(){
 el('characterAttributes').innerHTML=CHARACTER_ATTRS.map(([id,n])=>`<label>${n}<input class="character-attr" data-attr="${id}" type="number" min="1" max="35" value="1" /></label>`).join('');
 el('characterSkills').innerHTML=CHARACTER_SKILLS.map(n=>`<label><span>${n}</span><input class="character-skill" data-skill="${n}" type="number" min="0" max="15" value="0" /></label>`).join('');
 el('characterEquipment').innerHTML=[1,2,3,4].map(i=>`<div class="equipment-editor-card"><label>Item ${i}<input class="character-item-name" data-index="${i-1}" placeholder="Nome do item" /></label><label>Descrição<textarea class="character-item-description" data-index="${i-1}" rows="3"></textarea></label></div>`).join('');
}
function addCharacterBackpackItem(value={}){
 const box=el('characterBackpack');if(!box)return;
 const row=document.createElement('div');row.className='backpack-editor-card';
 row.innerHTML=`<div class="backpack-editor-head"><b>Item da mochila</b><button type="button" class="danger small remove-backpack-item" title="Remover item">×</button></div><label>Nome<input class="character-backpack-name" value="${esc(value.name||value.nome||'')}" placeholder="Nome do item" /></label><label>Descrição<textarea class="character-backpack-description" rows="3" placeholder="Uso, efeito ou observações...">${esc(value.description||value.descricao||'')}</textarea></label>`;
 row.querySelector('.remove-backpack-item').onclick=()=>{row.remove();renderStoryPreview()};
 row.querySelectorAll('input,textarea').forEach(input=>input.addEventListener('input',renderStoryPreview));
 box.appendChild(row);
}
function setupCharacterBackpack(items=[]){const box=el('characterBackpack');if(!box)return;box.innerHTML='';(Array.isArray(items)?items:[]).forEach(addCharacterBackpackItem)}
function readCharacterBackpack(){return [...document.querySelectorAll('#characterBackpack .backpack-editor-card')].map(row=>({name:row.querySelector('.character-backpack-name')?.value.trim()||'',description:row.querySelector('.character-backpack-description')?.value.trim()||''})).filter(item=>item.name||item.description)}
function toggleStoryType(){const character=storyType()==='character';el('characterFields').hidden=!character;el('specialRelianFields').hidden=character;el('storySheetTitle').textContent=el('storySheetId').value?'Editar ficha':character?'Nova ficha de personagem':'Novo Relian específico';renderStoryPreview()}
function addTrainerTeamRow(value={}){const row=document.createElement('div');row.className='story-team-row';row.innerHTML=`<label>Ficha de Relian salva<select class="team-species"></select></label><label>Apelido<input class="team-nickname" value="${esc(value.nickname||'')}" /></label><label>Nível<input class="team-level" type="number" min="1" max="100" value="${Number(value.level)||1}" /></label><label>Coloração<select class="team-color"><option value="basic">Basic</option><option value="shiny">Shiny</option><option value="special">Especial</option></select></label><label class="team-notes-label">Observações<input class="team-notes" value="${esc(value.notes||'')}" /></label><button type="button" class="danger remove-team">×</button>`;el('trainerTeamEditor').appendChild(row);refreshStoryOptions();row.querySelector('.team-species').value=value.savedSheetId?'sheet:'+value.savedSheetId:'';row.querySelector('.team-color').value=value.color||'basic';row.querySelector('.team-species').onchange=()=>{const v=row.querySelector('.team-species').value;const saved=v.startsWith('sheet:')?(data.savedRelianSheets||[]).find(x=>x.id===v.slice(6)):null;if(saved){row.querySelector('.team-nickname').value=saved.nickname||saved.speciesName;row.querySelector('.team-level').value=saved.level;row.querySelector('.team-color').value=saved.color||'basic'}renderStoryPreview()};row.querySelector('.remove-team').onclick=()=>{row.remove();renderStoryPreview()};row.querySelectorAll('input,select').forEach(x=>x.addEventListener('input',renderStoryPreview))}
function readTrainerTeam(){return [...document.querySelectorAll('.story-team-row')].map(row=>{const ref=row.querySelector('.team-species').value;const saved=ref.startsWith('sheet:')?(data.savedRelianSheets||[]).find(x=>x.id===ref.slice(6)):null;if(!saved)return null;return{speciesId:saved.speciesId,savedSheetId:saved.id,nickname:row.querySelector('.team-nickname').value.trim()||saved.nickname||saved.speciesName,level:+row.querySelector('.team-level').value||Number(saved.level)||1,color:row.querySelector('.team-color').value||saved.color||'basic',notes:row.querySelector('.team-notes').value.trim()}}).filter(Boolean)}
function linkOriginalTrainerToTeam(character){const trainer=String(character?.name||'').trim();if(!trainer)return false;let changed=false;for(const member of character.team||[]){if(!member.savedSheetId)continue;const saved=(data.savedRelianSheets||[]).find(x=>x.id===member.savedSheetId);if(!saved||saved.originalTrainer)continue;saved.originalTrainer=trainer;saved.originalTrainerTag=`Treinador Original: ${trainer}`;saved.tags=Array.isArray(saved.tags)?saved.tags:[];if(!saved.tags.some(tag=>tag?.type==='original-trainer'))saved.tags.push({type:'original-trainer',label:'Treinador Original',value:trainer});changed=true}return changed}
function updateSpecialCalculatedResources(forceCurrent=false){
  const levelInput=el('specialLevel'),traitInput=el('specialTrait');
  if(!levelInput||!traitInput)return;
  const hpMaxInput=el('specialHpMax'),engMaxInput=el('specialEngMax');
  const hpCurrentInput=el('specialHpCurrent'),engCurrentInput=el('specialEngCurrent');
  const previousHpMax=Number(hpMaxInput?.value)||0,previousEngMax=Number(engMaxInput?.value)||0;
  const previousHpCurrent=Number(hpCurrentInput?.value)||0,previousEngCurrent=Number(engCurrentInput?.value)||0;
  const resources=calculateRelianResources(levelInput.value,data.traits[traitInput.value]||null);
  if(hpMaxInput)hpMaxInput.value=resources.hp;
  if(engMaxInput)engMaxInput.value=resources.energy;
  if(hpCurrentInput&&(forceCurrent||previousHpCurrent===previousHpMax||previousHpCurrent>resources.hp))hpCurrentInput.value=resources.hp;
  if(engCurrentInput&&(forceCurrent||previousEngCurrent===previousEngMax||previousEngCurrent>resources.energy))engCurrentInput.value=resources.energy;
}
function clearStorySheet(){el('storySheetForm').reset();el('storySheetId').value='';if(el('characterEquippedTeam'))el('characterEquippedTeam').value='[]';document.querySelector('input[name="storyType"][value="character"]').checked=true;el('trainerTeamEditor').innerHTML='';addTrainerTeamRow();setupSpecialAttributes();setupSpecialRelianEditors();setupCharacterFields();setupCharacterBackpack();el('specialHpCurrent').value=100;el('specialHpMax').value=100;el('specialEngCurrent').value=65;el('specialEngMax').value=65;el('specialAffinity').value=2;toggleStoryType()}
function storySheetLabel(s){return s.type==='character'?(s.character?.name||'Personagem sem nome'):(s.relian?.nickname||data.relians.find(r=>r.id===s.relian?.speciesId)?.name||'Relian específico')}
function renderStorySheets(){const list=el('storySheetsList');if(!list)return;const q=(el('storySearch')?.value||'').toLowerCase();const rows=(data.storySheets||[]).filter(s=>JSON.stringify(s).toLowerCase().includes(q));list.innerHTML=rows.length?rows.map(s=>`<div class="entity-row story-list-row"><button type="button" class="entity-main-button" onclick="viewStorySheet('${esc(s.id)}')"><b>${esc(storySheetLabel(s))}</b><small>${s.type==='character'?'Personagem':'Relian específico'}${s.type==='relian'&&s.relian?.scene?' · '+esc(s.relian.scene):''}</small></button><button type="button" class="small" onclick="editStorySheet('${esc(s.id)}')">Editar</button></div>`).join(''):'<p class="empty">Nenhuma ficha cadastrada.</p>'}
window.viewStorySheet=id=>{editStorySheet(id);document.querySelector('.story-side-preview')?.scrollIntoView({behavior:'smooth',block:'start'})}
window.editStorySheet=id=>{const s=(data.storySheets||[]).find(x=>x.id===id);if(!s)return;clearStorySheet();el('storySheetId').value=s.id;const type=s.type==='trainer'?'character':s.type;document.querySelector(`input[name="storyType"][value="${type}"]`).checked=true;if(type==='character'){const c=s.character||s.trainer||{};[['characterPlayer','player'],['characterName','name'],['characterAge','age'],['characterRegion','region'],['characterClass','className'],['characterSpecialization','specialization'],['characterLevel','level'],['characterRank','rank'],['characterStars','stars'],['characterRays','rays'],['characterReliInf','reliInf'],['characterCredits','credits'],['characterMoney','money'],['characterImage','image'],['characterDescription','description'],['characterHpCurrent','hpCurrent'],['characterHpMax','hpMax'],['characterStaCurrent','staCurrent'],['characterStaMax','staMax']].forEach(([eid,k])=>{if(el(eid))el(eid).value=c[k]??''});document.querySelectorAll('.character-attr').forEach(x=>x.value=c.attributes?.[x.dataset.attr]??1);document.querySelectorAll('.character-skill').forEach(x=>x.value=c.skills?.[x.dataset.skill]??0);document.querySelectorAll('.character-item-name').forEach(x=>x.value=c.equipment?.[+x.dataset.index]?.name||'');document.querySelectorAll('.character-item-description').forEach(x=>x.value=c.equipment?.[+x.dataset.index]?.description||'');setupCharacterBackpack(c.backpack||c.mochila||[]);if(el('characterEquippedTeam'))el('characterEquippedTeam').value=JSON.stringify((c.equippedRelianIds||c.equippedTeam||[]).slice(0,7));el('trainerTeamEditor').innerHTML='';(c.team||[]).forEach(addTrainerTeamRow);if(!(c.team||[]).length)addTrainerTeamRow()}else{const r=s.relian||{};el('specialSpecies').value=r.speciesId||'';el('specialNickname').value=r.nickname||'';el('specialLevel').value=r.level||1;el('specialColor').value=r.color||'basic';el('specialGender').value=r.gender||'';el('specialSize').value=r.size||'';el('specialHpCurrent').value=r.hpCurrent??50;el('specialHpMax').value=r.hpMax??50;el('specialEngCurrent').value=r.engCurrent??85;el('specialEngMax').value=r.engMax??85;el('specialAffinity').value=r.affinity??2;el('specialTrait').value=r.traitId||'';el('specialScene').value=r.scene||'';document.querySelectorAll('.special-move-select').forEach((select,i)=>select.value=(r.moves||[])[i]||'');document.querySelectorAll('.special-item-name').forEach((input,i)=>input.value=(r.items||[])[i]?.name||'');document.querySelectorAll('.special-item-description').forEach((input,i)=>input.value=(r.items||[])[i]?.description||'');updateSpecialMoveInfo();el('specialNotes').value=r.notes||'';document.querySelectorAll('.special-attr').forEach(inp=>inp.value=r.attributes?.[inp.dataset.attr]??1)}toggleStoryType();document.querySelector('[data-tab="story"]').click();renderStoryPreview()}
function currentStoryPayload(){const type=storyType();if(type==='character'){const attributes={},skills={},equipment=[];document.querySelectorAll('.character-attr').forEach(x=>attributes[x.dataset.attr]=+x.value||0);document.querySelectorAll('.character-skill').forEach(x=>skills[x.dataset.skill]=+x.value||0);for(let i=0;i<4;i++)equipment.push({name:document.querySelector(`.character-item-name[data-index="${i}"]`).value.trim(),description:document.querySelector(`.character-item-description[data-index="${i}"]`).value.trim()});return{type,character:{player:el('characterPlayer').value.trim(),name:el('characterName').value.trim(),age:+el('characterAge').value||null,region:el('characterRegion').value.trim(),className:el('characterClass').value,specialization:el('characterSpecialization').value.trim(),level:+el('characterLevel').value||0,rank:el('characterRank').value.trim(),stars:+el('characterStars').value||0,rays:+el('characterRays').value||0,reliInf:+el('characterReliInf').value||0,credits:+el('characterCredits').value||0,money:+el('characterMoney').value||0,image:el('characterImage').value.trim(),description:el('characterDescription').value.trim(),hpCurrent:+el('characterHpCurrent').value||0,hpMax:+el('characterHpMax').value||1,staCurrent:+el('characterStaCurrent').value||0,staMax:+el('characterStaMax').value||1,attributes,skills,equipment,backpack:readCharacterBackpack(),team:readTrainerTeam(),equippedRelianIds:(()=>{try{return JSON.parse(el('characterEquippedTeam')?.value||'[]').slice(0,7)}catch(e){return[]}})()}}}const attrs={};document.querySelectorAll('.special-attr').forEach(inp=>attrs[inp.dataset.attr]=+inp.value||0);return{type,relian:{speciesId:el('specialSpecies').value,nickname:el('specialNickname').value.trim(),level:+el('specialLevel').value||1,color:normalizeColorId(el('specialColor').value),gender:el('specialGender').value.trim(),size:el('specialSize').value.trim(),hpCurrent:+el('specialHpCurrent').value||0,hpMax:+el('specialHpMax').value||1,engCurrent:+el('specialEngCurrent').value||0,engMax:+el('specialEngMax').value||1,affinity:+el('specialAffinity').value||0,attributes:attrs,traitId:el('specialTrait').value,moves:readSpecialMoves(),items:readSpecialItems(),scene:el('specialScene').value.trim(),notes:el('specialNotes').value.trim()}}}
function barPct(a,b){return Math.max(0,Math.min(100,b?Math.round(a/b*100):0))}
function renderStoryPreview(){const box=el('storyPreview');if(!box)return;const s=currentStoryPayload();if(s.type==='character'){const c=s.character,attrs=CHARACTER_ATTRS.map(([id,n])=>`<div><span>${n}</span><b>${c.attributes[id]||0}</b></div>`).join(''),skillRows=Object.entries(c.skills).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]).map(([n,v])=>`<span>${esc(n)} <b>${v}</b></span>`).join('');box.innerHTML=`<article class="character-sheet-preview"><header class="character-sheet-header"><div class="character-portrait"><div>${c.image?`<img src="${esc(c.image)}" alt="${esc(c.name)}">`:'<span>SEM IMAGEM</span>'}</div></div><div class="character-identity"><small>FICHA DE PERSONAGEM</small><h2>${esc(c.name||'Novo personagem')}</h2><p>${esc(c.player?'Jogador: '+c.player:'Explorador de Astra')}</p><div class="character-tags"><b>${esc(c.className||'Sem classe')}</b><span>${esc(c.region||'Região não definida')}</span><span>Nível ${c.level}</span></div><div class="character-milestones"><span>Rank ${esc(c.rank||'—')}</span><span>★ ${c.stars}</span><span>⚡ ${c.rays}</span><span>Reli-INF ${c.reliInf}</span></div></div><div class="character-resources"><div><b>PV ${c.hpCurrent}/${c.hpMax}</b><i><em style="width:${barPct(c.hpCurrent,c.hpMax)}%"></em></i></div><div><b>STAMINA ${c.staCurrent}/${c.staMax}</b><i class="sta"><em style="width:${barPct(c.staCurrent,c.staMax)}%"></em></i></div><p>Créditos: ${c.credits.toFixed(2)} · Dinheiro: ${c.money.toFixed(2)}</p></div></header><div class="character-sheet-grid"><section class="sheet-panel"><h3>Atributos</h3><div class="character-preview-attrs">${attrs}</div></section><section class="sheet-panel"><h3>Perícias treinadas</h3><div class="character-preview-skills">${skillRows||'<span>Nenhuma perícia pontuada.</span>'}</div></section><section class="sheet-panel wide"><h3>Equipamentos</h3><div class="character-preview-equipment">${c.equipment.map((x,i)=>`<div><b>Item ${i+1}: ${esc(x.name||'Vazio')}</b><p>${esc(x.description||'Sem descrição.')}</p></div>`).join('')}</div></section><section class="sheet-panel wide"><h3>Mochila</h3><div class="character-backpack-preview">${c.backpack.length?c.backpack.map((x,i)=>`<div><b>${i+1}. ${esc(x.name||'Item sem nome')}</b><p>${esc(x.description||'Sem descrição.')}</p></div>`).join(''):'<p class="empty">A mochila está vazia.</p>'}</div></section><section class="sheet-panel wide"><h3>Equipe de Relians</h3><div class="story-team-preview">${c.team.length?c.team.map(m=>{const r=data.relians.find(x=>x.id===m.speciesId);return `<div><b>${esc(m.nickname||r?.name||'Relian')}</b><span>${esc(r?.name||'')} · Nv. ${m.level} · ${esc(colorName(m.color))}</span><small>${esc(relianElementText(r,m.color))}${m.notes?' · '+esc(m.notes):''}</small></div>`}).join(''):'<p class="empty">Nenhum Relian na equipe.</p>'}</div></section></div></article>`}else{const r=s.relian,sp=data.relians.find(x=>x.id===r.speciesId),trait=data.traits[r.traitId];box.innerHTML=`<article class="story-card special-relian-card"><div class="story-card-head"><span>Relian específico</span><h2>${esc(r.nickname||sp?.name||'Nova ficha')}</h2><p>${esc(sp?.name||'Espécie não selecionada')} · Nv. ${r.level}${r.scene?' · '+esc(r.scene):''}</p></div><div class="story-card-body"><div class="story-resource-preview"><b>HP ${r.hpCurrent}/${r.hpMax}</b><b>ENG ${r.engCurrent}/${r.engMax}</b><b>Afinidade ${r.affinity}/5</b></div>${identityBadges(sp?.class,getRelianElements(sp,r.color||'basic'))}<p><b>Traço:</b> ${esc(trait?.name||'Nenhum')}</p><div class="special-preview-grid"><section><h3>Movimentos</h3><div class="special-preview-moves">${r.moves.length?r.moves.map((id,i)=>{const m=data.moves[id],visual=moveCardVisual(m);return `<div class="move-card-elemental" style="${visual.style}"><span>${i+1}</span><b>${esc(m?.name||id)}</b><small>${esc(visual.label)} · ${esc(m?.type||'MOV')} · Dano ${Number(m?.damage)||0} · ENG ${Number(m?.energy)||0}</small>${moveInfoButton(m?.description||'Movimento não encontrado no banco.')}</div>`}).join(''):'<p class="empty">Nenhum movimento.</p>'}</div></section><section><h3>Itens segurados</h3><div class="special-preview-items">${r.items.length?r.items.map((item,i)=>`<div><b>Item ${i+1}: ${esc(item.name||'Sem nome')}</b><p>${esc(item.description||'Sem descrição.')}</p></div>`).join(''):'<p class="empty">Nenhum item equipado.</p>'}</div></section></div>${sp?.description?`<div class="story-species-description"><h3>Descrição da espécie</h3><p>${esc(sp.description)}</p></div>`:''}<p>${esc(r.notes||'Sem anotações.')}</p></div></article>`}}
async function writeStorySheetFile(sheet,oldId=''){if(!linkedDirectory)return{saved:false};if(!await ensurePermission(linkedDirectory,true,'readwrite'))return{saved:false};const dir=await linkedDirectory.getDirectoryHandle('Fichas_Especiais',{create:true});const file=await dir.getFileHandle(`${sheet.id}.json`,{create:true});const writable=await file.createWritable();await writable.write(JSON.stringify({kind:'story-sheet',tipoArquivo:'ficha-especial',...sheet},null,2));await writable.close();if(oldId&&oldId!==sheet.id){try{await dir.removeEntry(`${oldId}.json`)}catch(e){}}folderSignature='';return{saved:true}}
async function deleteStorySheetFile(id){if(!linkedDirectory||!await ensurePermission(linkedDirectory,true,'readwrite'))return false;try{const dir=await linkedDirectory.getDirectoryHandle('Fichas_Especiais');await dir.removeEntry(`${id}.json`);folderSignature='';return true}catch(e){return false}}
el('storySheetForm').onsubmit=async e=>{e.preventDefault();const payload=currentStoryPayload();if(payload.type==='character'&&!payload.character.name)return alert('Informe o nome do personagem.');if(payload.type==='relian'&&!payload.relian.speciesId)return alert('Escolha a espécie do Relian.');const oldId=el('storySheetId').value;const baseName=payload.type==='character'?payload.character.name:(payload.relian.nickname||data.relians.find(r=>r.id===payload.relian.speciesId)?.name||'relian-especial');const id=oldId||`${payload.type}-${slug(baseName)}-${Date.now().toString(36)}`;if(payload.type==='character')linkOriginalTrainerToTeam(payload.character);const sheet={id,...payload,updatedAt:new Date().toISOString()};const idx=(data.storySheets||[]).findIndex(x=>x.id===oldId||x.id===id);if(idx>=0)data.storySheets[idx]=sheet;else data.storySheets.push(sheet);saveData();el('storySheetId').value=id;await writeStorySheetFile(sheet,oldId);renderStoryPreview();alert(linkedDirectory?'Ficha salva no banco e em Fichas_Especiais.':'Ficha salva no navegador.')}
el('deleteStorySheetBtn').onclick=async()=>{const id=el('storySheetId').value;if(!id||!confirm('Excluir esta ficha?'))return;data.storySheets=data.storySheets.filter(x=>x.id!==id);saveData();await deleteStorySheetFile(id);clearStorySheet()}
el('newStorySheetBtn').onclick=clearStorySheet;el('addTrainerTeamBtn').onclick=()=>addTrainerTeamRow();el('addCharacterBackpackItemBtn').onclick=()=>addCharacterBackpackItem();el('storySearch').addEventListener('input',renderStorySheets);el('savedSheetSearch')?.addEventListener('input',renderSavedRelianSheets);document.querySelectorAll('input[name="storyType"]').forEach(x=>x.addEventListener('change',toggleStoryType));el('specialLevel')?.addEventListener('input',()=>{updateSpecialCalculatedResources();renderStoryPreview()});el('specialTrait')?.addEventListener('change',()=>{updateSpecialCalculatedResources();renderStoryPreview()});el('storySheetForm').addEventListener('input',renderStoryPreview);setupSpecialAttributes();setupSpecialRelianEditors();setupCharacterFields();clearStorySheet();

setupTabs();setupElementSelectors();renderAll();clearRelianForm();clearMoveForm();restoreLinkedFolder();

/* V6.7 — banco unificado e layout corrigido */
function bankCharacterSheets(){
  return (data.storySheets||[]).filter(s=>s.type==='character'||s.type==='trainer');
}
function bankSelectedEntry(){
  const raw=String(selectedSavedSheetId||'');
  if(raw.startsWith('character:')){
    const id=raw.slice(10);
    const sheet=bankCharacterSheets().find(s=>String(s.id)===id);
    return sheet?{kind:'character',sheet}:null;
  }
  const id=raw.startsWith('relian:')?raw.slice(7):raw;
  const sheet=(data.savedRelianSheets||[]).find(s=>String(s.id)===id);
  return sheet?{kind:'relian',sheet}:null;
}
function renderSavedRelianSheets(){
  const box=el('savedRelianSheetsList');
  if(!box)return;
  const q=(el('savedSheetSearch')?.value||'').trim().toLowerCase();
  const relians=(data.savedRelianSheets||[]).filter(s=>JSON.stringify(s).toLowerCase().includes(q));
  const characters=bankCharacterSheets().filter(s=>JSON.stringify(s).toLowerCase().includes(q));
  const relianRows=relians.map(s=>{
    const sp=data.relians.find(r=>r.id===s.speciesId),rar=s.rarity||sp?.rarity||'comum';
    const key='relian:'+s.id;
    return `<button type="button" class="saved-sheet-select ${selectedSavedSheetId===key||selectedSavedSheetId===s.id?'selected':''}" data-bank-kind="relian" data-bank-id="${esc(s.id)}" onclick="openBankSheet('relian','${esc(String(s.id))}')"><span class="saved-sheet-select-main"><b>${esc(s.nickname||s.speciesName)}</b><small>${esc(s.speciesName)} · Nv. ${s.level}</small><span class="saved-sheet-tags"><i class="color-tag ${esc(s.color||'basic')}">${esc(colorName(s.color))}</i><i class="rarity-tag rarity-${esc(rar)}">${esc(RARITY_NAMES[rar]||'Comum')}</i>${s.originalTrainer?`<i class="trainer-owner-tag">${esc(s.originalTrainer)}</i>`:''}</span></span><span class="saved-sheet-open-icon" aria-hidden="true">›</span></button>`;
  }).join('');
  const characterRows=characters.map(s=>{
    const c=s.character||s.trainer||{},key='character:'+s.id;
    return `<button type="button" class="saved-sheet-select character-bank-row ${selectedSavedSheetId===key?'selected':''}" data-bank-kind="character" data-bank-id="${esc(s.id)}" onclick="openBankSheet('character','${esc(String(s.id))}')"><span class="saved-sheet-select-main"><b>${esc(c.name||'Personagem sem nome')}</b><small>${esc(c.player?('Jogador: '+c.player):(c.className||'Explorador de Astra'))}</small><span class="saved-sheet-tags"><i class="character-tag">PERSONAGEM</i>${c.className?`<i class="class-tag">${esc(c.className)}</i>`:''}<i class="level-tag">Nv. ${Number(c.level)||0}</i></span></span><span class="saved-sheet-open-icon" aria-hidden="true">›</span></button>`;
  }).join('');
  box.innerHTML=`<div class="bank-list-summary"><span>${relians.length} Relian${relians.length===1?'':'s'}</span><span>${characters.length} personagem${characters.length===1?'':'s'}</span></div>${relians.length?`<div class="bank-group-title">Relians gerados</div>${relianRows}`:''}${characters.length?`<div class="bank-group-title">Personagens</div>${characterRows}`:''}${!relians.length&&!characters.length?'<p class="empty">Nenhuma ficha encontrada.</p>':''}`;
  /* O clique é tratado por delegação abaixo. Isso evita perder o evento quando
     a lista é redesenhada depois de salvar, importar ou pesquisar fichas. */
}
function openBankSheet(kind,id,{scroll=true}={}){
  id=String(id||'').trim();
  if(!id)return;
  const isCharacter=kind==='character';
  const exists=isCharacter
    ? bankCharacterSheets().some(sheet=>String(sheet.id)===id)
    : (data.savedRelianSheets||[]).some(sheet=>String(sheet.id)===id);
  if(!exists){
    console.warn('Ficha do Banco não encontrada:',kind,id);
    return;
  }
  selectedSavedSheetId=(isCharacter?'character:':'relian:')+id;
  const bankTab=document.querySelector('[data-tab="sheetbank"]');
  if(bankTab&&!bankTab.classList.contains('active'))bankTab.click();
  renderSavedSheetDetail();
  renderSavedRelianSheets();
  if(scroll){
    requestAnimationFrame(()=>{
      const detail=el('savedSheetDetail');
      if(detail&&(window.matchMedia('(max-width: 900px)').matches||!isElementMostlyVisible(detail))){
        detail.scrollIntoView({behavior:'smooth',block:'start'});
      }
    });
  }
}
window.openBankSheet=openBankSheet;
function isElementMostlyVisible(node){
  if(!node)return false;
  const rect=node.getBoundingClientRect();
  const vh=window.innerHeight||document.documentElement.clientHeight||0;
  return rect.top>=0&&rect.top<vh*.7&&rect.bottom>Math.min(vh,120);
}
window.selectSavedRelianSheet=id=>openBankSheet('relian',id);
window.selectCharacterBankSheet=id=>openBankSheet('character',id);

/* Delegação permanente: continua funcionando mesmo quando renderSavedRelianSheets()
   substitui todo o HTML da lista. */
const savedSheetsListNode=el('savedRelianSheetsList');
if(savedSheetsListNode&&!savedSheetsListNode.dataset.bankClickReady){
  savedSheetsListNode.dataset.bankClickReady='1';
  savedSheetsListNode.addEventListener('click',event=>{
    const button=event.target.closest('.saved-sheet-select[data-bank-id]');
    if(!button||!savedSheetsListNode.contains(button))return;
    event.preventDefault();
    openBankSheet(button.dataset.bankKind==='character'?'character':'relian',button.dataset.bankId);
  });
}
function characterOwnedRelians(character){
  const seen=new Set();
  return (character?.team||[]).map(member=>{
    const saved=(data.savedRelianSheets||[]).find(sheet=>String(sheet.id)===String(member.savedSheetId));
    const id=String(member.savedSheetId||saved?.id||'');
    if(!id||seen.has(id))return null;
    seen.add(id);
    const species=data.relians.find(relian=>relian.id===(saved?.speciesId||member.speciesId));
    return {id,member,saved,species};
  }).filter(Boolean);
}
function characterEquippedIds(character){
  const owned=new Set(characterOwnedRelians(character).map(entry=>entry.id));
  const raw=Array.isArray(character?.equippedRelianIds)?character.equippedRelianIds:[];
  return raw.map(String).filter((id,index,list)=>owned.has(id)&&list.indexOf(id)===index).slice(0,7);
}
function relianOwnedCard(entry,compact=false){
  const saved=entry.saved||{},member=entry.member||{},species=entry.species;
  const nickname=member.nickname||saved.nickname||saved.speciesName||species?.name||'Relian';
  const level=Number(member.level||saved.level)||1;
  const color=member.color||saved.color||'basic';
  const image=resolveRelianImage(species,normalizeColorId(color));
  const moves=(saved.moves||[]).map(id=>data.moves[id]).filter(Boolean);
  return `<article class="owned-relian-card${compact?' compact':''}" data-owned-relian-id="${esc(String(entry.id||''))}" role="button" tabindex="0" title="Abrir ficha completa deste Relian">
    <div class="owned-relian-image">${image?`<img src="${esc(image)}" alt="${esc(nickname)}">`:'<span>?</span>'}</div>
    <div class="owned-relian-main">
      <div class="owned-relian-title"><div><small>${species?`#${esc(catalogCode(species)||'—')}`:'FICHA SALVA'}</small><h4>${esc(nickname)}</h4></div><span>${esc(colorName(color))}</span></div>
      <p>${esc(species?.name||saved.speciesName||'Espécie não encontrada')} · Nv. ${level}</p>
      <div class="owned-relian-badges">${identityBadges(species?.class,getRelianElements(species,normalizeColorId(color)))}</div>
      ${compact?'':`<div class="owned-relian-resources"><b>HP ${Number(saved.hpCurrent??saved.hpMax??0)}/${Number(saved.hpMax)||0}</b><b>ENG ${Number(saved.engCurrent??saved.engMax??0)}/${Number(saved.engMax)||0}</b><b>Afinidade ${Number(saved.affinity??2).toFixed(1)}</b></div>
      <div class="owned-relian-moves">${moves.length?moves.map(move=>`<span>${esc(move.name)}</span>`).join(''):'<span>Nenhum movimento cadastrado</span>'}</div>
      ${saved.originalTrainer?`<small class="owned-original-trainer">Treinador original: ${esc(saved.originalTrainer)}</small>`:''}`}
    </div>
  </article>`;
}
function closeCharacterGuide(){document.querySelector('.character-guide-overlay')?.remove()}
window.closeCharacterGuide=closeCharacterGuide;
function openCharacterGuide(sheetId,initialTab='summary'){
  closeCharacterGuide();
  const sheet=bankCharacterSheets().find(item=>item.id===sheetId);if(!sheet)return;
  const c=sheet.character||sheet.trainer||{},owned=characterOwnedRelians(c),equipped=new Set(characterEquippedIds(c));
  const attrs=CHARACTER_ATTRS.map(([id,name])=>`<div><span>${esc(name)}</span><b>${Number(c.attributes?.[id])||0}</b></div>`).join('');
  const equipment=(c.equipment||[]).filter(item=>item?.name||item?.description).map((item,index)=>`<div><b>${index+1}. ${esc(item.name||'Item sem nome')}</b><p>${esc(item.description||'Sem descrição.')}</p></div>`).join('');
  const backpack=(c.backpack||[]).map((item,index)=>`<div><b>${index+1}. ${esc(item.name||'Item sem nome')}</b><p>${esc(item.description||'Sem descrição.')}</p></div>`).join('');
  const equippedCards=owned.filter(entry=>equipped.has(entry.id)).map(entry=>relianOwnedCard(entry,true)).join('');
  const overlay=document.createElement('div');overlay.className='character-guide-overlay';
  overlay.innerHTML=`<div class="character-guide-dialog" role="dialog" aria-modal="true">
    <header class="character-guide-header">
      <div><small>FICHA COMPLETA</small><h2>${esc(c.name||'Personagem sem nome')}</h2><p>${esc(c.player?`Jogador: ${c.player}`:(c.className||'Explorador de Astra'))}</p></div>
      <button type="button" class="character-guide-close" aria-label="Fechar" onclick="closeCharacterGuide()">×</button>
    </header>
    <nav class="character-guide-tabs">
      <button type="button" data-guide-tab="summary">Resumo</button>
      <button type="button" data-guide-tab="relians">Relians possuídos <span>${owned.length}</span></button>
    </nav>
    <div class="character-guide-content">
      <section data-guide-panel="summary">
        <div class="guide-summary-head">
          <div class="guide-portrait">${c.image?`<img src="${esc(c.image)}" alt="${esc(c.name||'Personagem')}">`:'<span>SEM IMAGEM</span>'}</div>
          <div><h3>${esc(c.name||'Personagem sem nome')}</h3><p>${esc(c.description||'Sem descrição cadastrada.')}</p><div class="character-tags"><b>${esc(c.className||'Sem classe')}</b><span>${esc(c.region||'Região não definida')}</span><span>Nível ${Number(c.level)||0}</span></div></div>
          <div class="guide-resources"><b>PV ${Number(c.hpCurrent)||0}/${Math.max(1,Number(c.hpMax)||1)}</b><b>Stamina ${Number(c.staCurrent)||0}/${Math.max(1,Number(c.staMax)||1)}</b><span>Créditos ${Number(c.credits||0).toFixed(2)}</span><span>Dinheiro ${Number(c.money||0).toFixed(2)}</span></div>
        </div>
        <div class="guide-grid">
          <section><h3>Atributos</h3><div class="character-preview-attrs">${attrs}</div></section>
          <section><h3>Equipe equipada (${equipped.size}/7)</h3><div class="guide-equipped-grid">${equippedCards||'<p class="empty">Nenhum Relian equipado.</p>'}</div></section>
          <section><h3>Equipamentos</h3><div class="character-preview-equipment">${equipment||'<p class="empty">Nenhum equipamento.</p>'}</div></section>
          <section><h3>Mochila</h3><div class="character-backpack-preview">${backpack||'<p class="empty">A mochila está vazia.</p>'}</div></section>
        </div>
      </section>
      <section data-guide-panel="relians">
        <div class="guide-owned-head"><div><h3>Relians possuídos</h3><p>Todos os Relians catalogados nesta ficha, incluindo suas informações salvas.</p></div><span>${owned.length} registrado${owned.length===1?'':'s'}</span></div>
        <div class="owned-relians-grid">${owned.length?owned.map(entry=>relianOwnedCard(entry)).join(''):'<p class="empty">Nenhum Relian foi catalogado para este personagem.</p>'}</div>
      </section>
    </div>
  </div>`;
  document.body.appendChild(overlay);
  const activate=tab=>{
    overlay.querySelectorAll('[data-guide-tab]').forEach(button=>button.classList.toggle('active',button.dataset.guideTab===tab));
    overlay.querySelectorAll('[data-guide-panel]').forEach(panel=>panel.hidden=panel.dataset.guidePanel!==tab);
  };
  overlay.querySelectorAll('[data-guide-tab]').forEach(button=>button.onclick=()=>activate(button.dataset.guideTab));
  const openOwnedRelian=card=>{
    const id=String(card?.dataset?.ownedRelianId||'').trim();
    if(!id)return;
    closeCharacterGuide();
    openBankSheet('relian',id,{scroll:true});
  };
  overlay.querySelectorAll('.owned-relian-card[data-owned-relian-id]').forEach(card=>{
    card.addEventListener('click',event=>{event.preventDefault();openOwnedRelian(card)});
    card.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();openOwnedRelian(card)}});
  });
  overlay.onclick=event=>{if(event.target===overlay)closeCharacterGuide()};
  activate(initialTab);
}
window.openCharacterGuide=openCharacterGuide;
function renderBankCharacterDetail(sheet){
  const box=el('savedSheetDetail'),c=sheet.character||sheet.trainer||{};
  c.team=Array.isArray(c.team)?c.team:[];
  const owned=characterOwnedRelians(c);
  c.equippedRelianIds=characterEquippedIds(c);
  const attrs=CHARACTER_ATTRS.map(([id,n])=>`<div><span>${esc(n)}</span><b>${Number(c.attributes?.[id])||0}</b></div>`).join('');
  const skills=Object.entries(c.skills||{}).filter(([,v])=>Number(v)>0).sort((a,b)=>b[1]-a[1]).map(([n,v])=>`<span>${esc(n)} <b>${Number(v)}</b></span>`).join('');
  const equipment=(c.equipment||[]).slice(0,4);
  while(equipment.length<4)equipment.push({name:'',description:''});
  const backpack=(Array.isArray(c.backpack)?c.backpack:[]).map(item=>({name:String(item?.name||''),description:String(item?.description||'')}));
  const team=(c.team||[]).map(m=>{const sp=data.relians.find(r=>r.id===m.speciesId);return `<div><b>${esc(m.nickname||sp?.name||'Relian')}</b><span>${esc(sp?.name||'Espécie não encontrada')} · Nv. ${Number(m.level)||1}</span><small>${esc(colorName(m.color)||m.color||'Basic Color')} · ${esc(relianElementText(sp,m.color))}</small></div>`}).join('');
  const options=owned.map(entry=>{const saved=entry.saved||{},member=entry.member||{};return `<option value="${esc(entry.id)}">${esc(member.nickname||saved.nickname||saved.speciesName||entry.species?.name||'Relian')} · Nv. ${Number(member.level||saved.level)||1}</option>`}).join('');
  const slots=Array.from({length:7},(_,index)=>`<label class="equipped-relian-slot"><span>Slot ${index+1}</span><select class="bank-equipped-relian" data-slot="${index}"><option value="">Vazio</option>${options}</select></label>`).join('');
  box.className='saved-sheet-detail character-bank-detail';
  box.innerHTML=`<article class="character-sheet-preview bank-character-card"><header class="character-sheet-header character-full-open" title="Abrir ficha completa"><div class="character-portrait"><div>${c.image?`<img src="${esc(c.image)}" alt="${esc(c.name||'Personagem')}">`:'<span>SEM IMAGEM</span>'}</div></div><div class="character-identity"><small>FICHA DE PERSONAGEM</small><h2>${esc(c.name||'Personagem sem nome')}</h2><p>${esc(c.player?'Jogador: '+c.player:'Explorador de Astra')}</p><div class="character-tags"><b>${esc(c.className||'Sem classe')}</b><span>${esc(c.region||'Região não definida')}</span><span>Nível ${Number(c.level)||0}</span></div><div class="character-milestones"><span>Rank ${esc(c.rank||'—')}</span><span>★ ${Number(c.stars)||0}</span><span>⚡ ${Number(c.rays)||0}</span><span>Reli-INF ${Number(c.reliInf)||0}</span></div></div><div class="character-resources bank-character-resources"><div><b>PV <strong id="bankCharHpText">${Number(c.hpCurrent)||0}/${Math.max(1,Number(c.hpMax)||1)}</strong></b><div class="bank-char-controls"><button data-char-resource="hp" data-delta="-5">−5</button><button data-char-resource="hp" data-delta="-1">−1</button><button data-char-resource="hp" data-delta="1">+1</button><button data-char-resource="hp" data-delta="5">+5</button></div><i><em id="bankCharHpBar" style="width:${barPct(c.hpCurrent,c.hpMax)}%"></em></i></div><div><b>STAMINA <strong id="bankCharStaText">${Number(c.staCurrent)||0}/${Math.max(1,Number(c.staMax)||1)}</strong></b><div class="bank-char-controls"><button data-char-resource="sta" data-delta="-5">−5</button><button data-char-resource="sta" data-delta="-1">−1</button><button data-char-resource="sta" data-delta="1">+1</button><button data-char-resource="sta" data-delta="5">+5</button></div><i class="sta"><em id="bankCharStaBar" style="width:${barPct(c.staCurrent,c.staMax)}%"></em></i></div><p>Créditos: ${Number(c.credits||0).toFixed(2)} · Dinheiro: ${Number(c.money||0).toFixed(2)}</p><div class="bank-actions character-bank-actions"><button type="button" class="primary" id="bankOpenFullCharacterBtn">Abrir ficha completa</button><button type="button" class="primary bank-edit-character" id="bankEditCharacterBtn">Editar ficha</button><button type="button" class="danger bank-delete-button" id="bankDeleteCharacterBtn">Excluir ficha</button></div></div></header><div class="character-sheet-grid"><section class="sheet-panel wide equipped-team-panel"><div class="equipped-team-heading"><div><h3>Equipe equipada</h3><p>Escolha até 7 Relians entre os que este personagem possui.</p></div><b>${c.equippedRelianIds.length}/7</b></div><div class="equipped-team-slots">${slots}</div></section><section class="sheet-panel"><h3>Atributos</h3><div class="character-preview-attrs">${attrs}</div></section><section class="sheet-panel"><h3>Perícias treinadas</h3><div class="character-preview-skills">${skills||'<span>Nenhuma perícia pontuada.</span>'}</div></section><section class="sheet-panel wide"><h3>Equipamentos</h3><div class="character-preview-equipment">${equipment.map((x,i)=>`<div><b>Item ${i+1}: ${esc(x.name||'Vazio')}</b><p>${esc(x.description||'Sem descrição.')}</p></div>`).join('')}</div></section><section class="sheet-panel wide bank-backpack-panel"><h3>Mochila</h3><div id="bankBackpackEditor" class="bank-backpack-editor">${backpack.length?backpack.map((item,i)=>`<div class="bank-backpack-row" data-index="${i}"><label>Nome<input class="bank-backpack-name" value="${esc(item.name)}" placeholder="Nome do item"></label><label>Descrição<textarea class="bank-backpack-description" rows="2" placeholder="Descrição do item">${esc(item.description)}</textarea></label><button type="button" class="danger small bank-remove-backpack" title="Remover item">×</button></div>`).join(''):'<p class="empty bank-backpack-empty">A mochila está vazia.</p>'}</div><div class="bank-backpack-actions"><button type="button" id="bankAddBackpackBtn" class="small">+ Adicionar item</button><button type="button" id="bankSaveBackpackBtn" class="primary small">Salvar mochila</button></div></section><section class="sheet-panel wide"><h3>Relians possuídos</h3><div class="story-team-preview">${team||'<p class="empty">Nenhum Relian catalogado.</p>'}</div></section></div></article>`;
  box.querySelectorAll('.bank-equipped-relian').forEach((select,index)=>{
    select.value=c.equippedRelianIds[index]||'';
    select.onchange=()=>{
      const values=[...box.querySelectorAll('.bank-equipped-relian')].map(input=>input.value);
      const chosen=select.value;
      if(chosen&&values.filter(value=>value===chosen).length>1){alert('Este Relian já está equipado em outro slot.');select.value='';}
      c.equippedRelianIds=[...box.querySelectorAll('.bank-equipped-relian')].map(input=>input.value).filter((id,pos,list)=>id&&list.indexOf(id)===pos).slice(0,7);
      saveData();selectedSavedSheetId='character:'+sheet.id;renderSavedSheetDetail();
    };
  });
  box.querySelectorAll('[data-char-resource]').forEach(btn=>btn.onclick=event=>{
    event.stopPropagation();
    const resource=btn.dataset.charResource,delta=Number(btn.dataset.delta)||0;
    const currentKey=resource==='hp'?'hpCurrent':'staCurrent',maxKey=resource==='hp'?'hpMax':'staMax';
    const max=Math.max(1,Number(c[maxKey])||1);
    c[currentKey]=Math.max(0,Math.min(max,(Number(c[currentKey])||0)+delta));
    saveData();
    selectedSavedSheetId='character:'+sheet.id;
  });
  const readBankBackpack=()=>[...box.querySelectorAll('.bank-backpack-row')].map(row=>({name:row.querySelector('.bank-backpack-name')?.value.trim()||'',description:row.querySelector('.bank-backpack-description')?.value.trim()||''})).filter(item=>item.name||item.description);
  const addBankBackpackRow=(item={})=>{c.backpack=readBankBackpack();c.backpack.push({name:item.name||'',description:item.description||''});saveData();selectedSavedSheetId='character:'+sheet.id;renderSavedSheetDetail()};
  box.querySelectorAll('.bank-remove-backpack').forEach(btn=>btn.onclick=()=>{const row=btn.closest('.bank-backpack-row'),index=Number(row?.dataset.index);c.backpack=readBankBackpack();if(Number.isInteger(index))c.backpack.splice(index,1);saveData();selectedSavedSheetId='character:'+sheet.id;renderSavedSheetDetail()});
  el('bankAddBackpackBtn').onclick=()=>addBankBackpackRow();
  el('bankSaveBackpackBtn').onclick=()=>{c.backpack=readBankBackpack();saveData();selectedSavedSheetId='character:'+sheet.id;renderSavedSheetDetail();alert('Mochila atualizada.')};
  box.querySelectorAll('.owned-relian-card[data-owned-relian-id]').forEach(card=>{
    card.addEventListener('click',event=>{
      event.stopPropagation();
      const id=String(card.dataset.ownedRelianId||'').trim();
      if(id)openBankSheet('relian',id,{scroll:true});
    });
  });
  el('bankOpenFullCharacterBtn').onclick=event=>{event.stopPropagation();openCharacterGuide(sheet.id)};
  box.querySelector('.character-full-open').onclick=event=>{if(event.target.closest('button,input,select,textarea,label'))return;openCharacterGuide(sheet.id)};
  el('bankEditCharacterBtn').onclick=event=>{event.stopPropagation();editStorySheet(sheet.id)};
  el('bankDeleteCharacterBtn').onclick=async event=>{
    event.stopPropagation();
    if(!confirm(`Tem certeza que deseja excluir a ficha de ${c.name||'personagem'}? Esta ação não poderá ser desfeita.`))return;
    data.storySheets=(data.storySheets||[]).filter(x=>x.id!==sheet.id);
    selectedSavedSheetId='';
    saveData();
    await deleteStorySheetFile(sheet.id);
    renderSavedRelianSheets();
    renderSavedSheetDetail();
  };
}
function renderSavedSheetDetail(){
  const box=el('savedSheetDetail');if(!box)return;
  const entry=bankSelectedEntry();
  if(!entry){box.className='saved-sheet-detail-empty';box.innerHTML='<b>Nenhuma ficha selecionada</b><span>Escolha um Relian ou personagem na lista para abrir a ficha completa.</span>';return}
  if(entry.kind==='character'){renderBankCharacterDetail(entry.sheet);return}
  const s=entry.sheet,sp=data.relians.find(r=>r.id===s.speciesId),trait=data.traits[s.traitId],rar=s.rarity||sp?.rarity||'comum',img=resolveRelianImage(sp,normalizeColorId(s.color)),attrs=ATTR_KEYS.map(k=>{const base=Number(s.attributes?.[k])||0,red=Number(s.attributeReducers?.[k])||0,total=base+red;return `<tr><th>${esc(ATTR_LABELS[k])}</th><td>${base}</td><td><input class="bank-attr-reducer" data-attr="${esc(k)}" type="number" step="1" value="${red}"></td><td><strong class="bank-attr-total" data-total-attr="${esc(k)}">${total}</strong></td></tr>`}).join(''),moves=(s.moves||[]).map((id,i)=>{const m=data.moves[id];return `<div><span>${i+1}</span><b>${esc(m?.name||id)}</b><small>${esc(m?.type||'MOV')} · Dano ${Number(m?.damage)||0} · ENG ${Number(m?.energy)||0}</small></div>`}).join('');
  box.className=`saved-sheet-detail color-theme-${s.color||'basic'} rarity-theme-${rar}`;
  box.innerHTML=`<article class="saved-relian-card"><header class="saved-relian-header"><div class="saved-relian-portrait"><span class="color-ribbon ${esc(s.color||'basic')}">${s.color==='shiny'?'◆ ':s.color==='special'?'✦ ':''}${esc(colorName(s.color))}</span>${img?`<img src="${esc(img)}" alt="${esc(s.nickname||s.speciesName)}">`:'<div class="portrait-placeholder"><span>?</span><small>Sem imagem</small></div>'}${savedSheetParticles(s.color)}</div><div class="saved-relian-identity"><div class="catalog-line"><span class="catalog-badge">Reli-Info #${sp?catalogCode(sp):'—'}</span><span class="mini-badge">Nível ${s.level}</span><span class="rarity-summary-badge rarity-${esc(rar)}"><span class="rarity-star">✦</span>${esc(RARITY_NAMES[rar]||'Comum')}</span></div><label>Nome da ficha<input id="bankNickname" value="${esc(s.nickname||s.speciesName)}"></label><h2>${esc(s.nickname||s.speciesName)}</h2>${identityBadges(sp?.class,getRelianElements(sp,normalizeColorId(s.color)))}<p>${esc(s.gender||'Indefinido')} · Tamanho ${esc(s.size||'—')}</p><div class="bank-resource-grid"><div class="bank-resource hp"><b>♥ HP</b><div><button data-bank-resource="hp" data-delta="-5">−5</button><button data-bank-resource="hp" data-delta="-1">−1</button><strong>${s.hpCurrent} / ${s.hpMax}</strong><button data-bank-resource="hp" data-delta="1">+1</button><button data-bank-resource="hp" data-delta="5">+5</button></div><i><em style="width:${barPct(s.hpCurrent,s.hpMax)}%"></em></i><label>Máximo<input id="bankHpMax" type="number" min="1" value="${s.hpMax}"></label></div><div class="bank-resource eng"><b>⚡ ENG</b><div><button data-bank-resource="eng" data-delta="-5">−5</button><button data-bank-resource="eng" data-delta="-1">−1</button><strong>${s.engCurrent} / ${s.engMax}</strong><button data-bank-resource="eng" data-delta="1">+1</button><button data-bank-resource="eng" data-delta="5">+5</button></div><i><em style="width:${barPct(s.engCurrent,s.engMax)}%"></em></i><label>Máximo<input id="bankEngMax" type="number" min="1" value="${s.engMax}"></label></div></div><div class="bank-affinity"><label>Afinidade<input id="bankAffinity" type="number" min="0" max="5" step="0.1" value="${Number(s.affinity??2)}"></label></div><div class="bank-actions"><button type="button" class="primary" id="saveBankSheetBtn">Salvar alterações</button><button type="button" id="editBankAsStoryBtn">Criar ficha de história a partir desta</button><button type="button" class="danger bank-delete-button" id="deleteBankSheetBtn">Excluir ficha</button></div></div></header><div class="saved-relian-body"><section><h3>Atributos</h3><div class="bank-attrs-table-wrap"><table class="bank-attrs-table"><thead><tr><th>Atributo</th><th>Base</th><th>Redutor</th><th>Total</th></tr></thead><tbody>${attrs}</tbody></table></div></section><section><h3>Traço</h3><div class="bank-trait"><b>${esc(trait?.name||'Nenhum')}</b><p>${esc(trait?.description||'Sem descrição.')}</p>${trait?.palate?`<small>Paladar: ${esc(trait.palate)}</small>`:''}</div></section><section class="wide"><h3>Movimentos</h3><div class="bank-moves">${moves||'<p class="empty">Nenhum movimento equipado.</p>'}</div></section></div></article>`;
  box.querySelectorAll('[data-bank-resource]').forEach(btn=>btn.onclick=()=>{const target=btn.dataset.bankResource,delta=Number(btn.dataset.delta)||0,max=target==='hp'?s.hpMax:s.engMax,key=target==='hp'?'hpCurrent':'engCurrent';s[key]=Math.max(0,Math.min(max,Number(s[key]||0)+delta));saveData();selectedSavedSheetId='relian:'+s.id});
  el('saveBankSheetBtn').onclick=()=>{s.nickname=el('bankNickname').value.trim()||s.speciesName;s.hpMax=Math.max(1,+el('bankHpMax').value||1);s.engMax=Math.max(1,+el('bankEngMax').value||1);s.hpCurrent=Math.min(s.hpCurrent,s.hpMax);s.engCurrent=Math.min(s.engCurrent,s.engMax);s.affinity=Math.max(0,Math.min(5,+el('bankAffinity').value||0));s.attributeReducers=s.attributeReducers||{};box.querySelectorAll('.bank-attr-reducer').forEach(inp=>s.attributeReducers[inp.dataset.attr]=Number(inp.value)||0);saveData();selectedSavedSheetId='relian:'+s.id;renderSavedRelianSheets();renderSavedSheetDetail();alert('Ficha atualizada no banco.')};
  const deleteBankSheetBtn=el('deleteBankSheetBtn');
  if(deleteBankSheetBtn)deleteBankSheetBtn.onclick=()=>{
    if(!confirm(`Tem certeza que deseja excluir a ficha de ${s.nickname||s.speciesName}? Esta ação não poderá ser desfeita.`))return;
    data.savedRelianSheets=(data.savedRelianSheets||[]).filter(x=>x.id!==s.id);
    selectedSavedSheetId='';
    saveData();
    renderSavedRelianSheets();
    renderSavedSheetDetail();
  };
  el('editBankAsStoryBtn').onclick=()=>{clearStorySheet();document.querySelector('input[name="storyType"][value="relian"]').checked=true;toggleStoryType();el('specialSpecies').value=s.speciesId;el('specialNickname').value=s.nickname||s.speciesName;el('specialLevel').value=s.level;el('specialColor').value=normalizeColorId(s.color);el('specialGender').value=s.gender||'';el('specialSize').value=s.size||'';el('specialHpCurrent').value=s.hpCurrent;el('specialHpMax').value=s.hpMax;el('specialEngCurrent').value=s.engCurrent;el('specialEngMax').value=s.engMax;el('specialAffinity').value=s.affinity??2;el('specialTrait').value=s.traitId||'';document.querySelectorAll('.special-attr').forEach(inp=>inp.value=(Number(s.attributes?.[inp.dataset.attr])||0)+(Number(s.attributeReducers?.[inp.dataset.attr])||0));document.querySelectorAll('.special-move-select').forEach((sel,i)=>sel.value=(s.moves||[])[i]||'');updateSpecialMoveInfo();renderStoryPreview();document.querySelector('[data-tab="story"]')?.click()};
}
el('savedSheetSearch').oninput=renderSavedRelianSheets;

['catalogSearch','catalogElementFilter','catalogRarityFilter','catalogClassFilter','catalogSort'].forEach(id=>{if(el(id))el(id).addEventListener(id==='catalogSearch'?'input':'change',renderCatalog)});
if(el('catalogClearSearch'))el('catalogClearSearch').addEventListener('click',()=>{if(el('catalogSearch'))el('catalogSearch').value='';renderCatalog()});
if(el('catalogResetFilters'))el('catalogResetFilters').addEventListener('click',()=>{['catalogSearch','catalogElementFilter','catalogRarityFilter','catalogClassFilter'].forEach(id=>{if(el(id))el(id).value=''});if(el('catalogSort'))el('catalogSort').value='number';renderCatalog()});



/* v9.7.5 — Captura de ficha somente em PNG */
(function setupSheetCapture(){
  const dialog=document.getElementById('sheetCaptureDialog');
  const closeBtn=document.getElementById('sheetCaptureCloseBtn');
  const pngBtn=document.getElementById('sheetCapturePngBtn');
  const status=document.getElementById('sheetCaptureStatus');
  const scaleSelect=document.getElementById('sheetCaptureScale');
  const hideControls=document.getElementById('sheetCaptureHideControls');
  let activeUid='';
  if(!dialog||!pngBtn)return;

  const waitFrame=()=>new Promise(r=>requestAnimationFrame(()=>r()));
  const safeFileName=value=>String(value||'Relian').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9_-]+/gi,'-').replace(/^-+|-+$/g,'')||'Relian';
  function downloadBlob(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2500)}
  function setStatus(message,type=''){status.textContent=message;status.className='sheet-capture-status '+type}
  function setBusy(busy){pngBtn.disabled=busy;closeBtn.disabled=busy;dialog.classList.toggle('is-recording',busy)}

  async function imageToDataURL(img){
    if(!img?.src||img.src.startsWith('data:'))return img?.src||'';
    try{
      const canvas=document.createElement('canvas');
      const w=img.naturalWidth||img.width||1,h=img.naturalHeight||img.height||1;
      canvas.width=w;canvas.height=h;canvas.getContext('2d').drawImage(img,0,0,w,h);
      return canvas.toDataURL('image/png');
    }catch{}
    try{const response=await fetch(img.currentSrc||img.src);const blob=await response.blob();return await new Promise((res,rej)=>{const fr=new FileReader();fr.onload=()=>res(fr.result);fr.onerror=rej;fr.readAsDataURL(blob)})}catch{return img.currentSrc||img.src}
  }
  function copyComputedStyle(source,clone){
    const computed=getComputedStyle(source);
    let text='';
    for(const prop of computed){const val=computed.getPropertyValue(prop);if(val)text+=`${prop}:${val};`}
    clone.setAttribute('style',text);
    if(source instanceof HTMLInputElement){clone.setAttribute('value',source.value);if(source.checked)clone.setAttribute('checked','checked')}
    if(source instanceof HTMLTextAreaElement)clone.textContent=source.value;
    if(source instanceof HTMLSelectElement){[...clone.options].forEach((o,i)=>o.selected=source.options[i]?.selected)}
  }
  function addPseudo(source,clone,pseudo,prepend){
    const computed=getComputedStyle(source,pseudo),content=computed.content;
    if(!content||content==='none'||content==='normal'||content==='""')return;
    const node=document.createElement('span');let text='';
    for(const prop of computed){const val=computed.getPropertyValue(prop);if(val)text+=`${prop}:${val};`}
    node.setAttribute('style',text+'pointer-events:none;');
    node.textContent=content.replace(/^['"]|['"]$/g,'');
    node.setAttribute('data-captured-pseudo',pseudo);
    prepend?clone.prepend(node):clone.append(node);
  }
  async function cloneForCapture(root){
    const clone=root.cloneNode(true),sourceNodes=[root,...root.querySelectorAll('*')],cloneNodes=[clone,...clone.querySelectorAll('*')];
    for(let i=0;i<sourceNodes.length;i++){
      const src=sourceNodes[i],dst=cloneNodes[i];if(!dst)continue;
      copyComputedStyle(src,dst);
      if(src instanceof HTMLImageElement){const uri=await imageToDataURL(src);if(uri)dst.setAttribute('src',uri)}
      addPseudo(src,dst,'::before',true);addPseudo(src,dst,'::after',false);
    }
    clone.querySelectorAll('script,dialog').forEach(x=>x.remove());
    if(hideControls.checked)clone.querySelectorAll('.generated-sheet-actions,.resource-controls,.capture-controls,.capture-roll-btn,.affinity-adjustments').forEach(x=>x.remove());
    clone.style.margin='0';clone.style.transform='none';clone.style.width=root.getBoundingClientRect().width+'px';clone.style.maxWidth='none';
    return clone;
  }
  async function waitCaptureAssets(sheet){
    try{if(document.fonts?.ready)await document.fonts.ready}catch{}
    const images=[...sheet.querySelectorAll('img')];
    await Promise.all(images.map(img=>img.complete?Promise.resolve():new Promise(resolve=>{img.addEventListener('load',resolve,{once:true});img.addEventListener('error',resolve,{once:true});setTimeout(resolve,2500)})));
    await waitFrame();await waitFrame();
  }
  async function renderSheetCanvasFallback(sheet,scale=1){
    const rect=sheet.getBoundingClientRect(),width=Math.ceil(rect.width),height=Math.ceil(sheet.scrollHeight||rect.height);
    const clone=await cloneForCapture(sheet);
    const wrapper=document.createElement('div');wrapper.setAttribute('xmlns','http://www.w3.org/1999/xhtml');wrapper.style.width=width+'px';wrapper.style.height=height+'px';wrapper.style.background='#041b23';wrapper.appendChild(clone);
    const serialized=new XMLSerializer().serializeToString(wrapper).replace(/#/g,'%23');
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><foreignObject width="100%" height="100%">${serialized}</foreignObject></svg>`;
    const url='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg),img=new Image();
    await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(new Error('Falha no renderizador interno.'));img.src=url});
    const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(width*scale));canvas.height=Math.max(1,Math.round(height*scale));
    const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.fillStyle='#041b23';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);return canvas;
  }
  async function renderSheetCanvas(sheet,scale=1){
    await waitCaptureAssets(sheet);
    if(typeof window.html2canvas==='function'){
      return await window.html2canvas(sheet,{
        backgroundColor:'#041b23',
        scale:Math.max(1,Number(scale)||1),
        useCORS:true,
        allowTaint:true,
        logging:false,
        imageTimeout:5000,
        scrollX:0,
        scrollY:-window.scrollY,
        width:Math.ceil(sheet.scrollWidth),
        height:Math.ceil(sheet.scrollHeight),
        windowWidth:Math.max(document.documentElement.clientWidth,sheet.scrollWidth),
        windowHeight:Math.max(document.documentElement.clientHeight,sheet.scrollHeight),
        onclone:doc=>{
          const cloned=doc.getElementById(sheet.id);if(!cloned)return;
          cloned.style.margin='0';cloned.style.transform='none';cloned.style.maxWidth='none';
          if(hideControls.checked)cloned.querySelectorAll('.generated-sheet-actions,.resource-controls,.capture-controls,.capture-roll-btn,.affinity-adjustments').forEach(x=>x.remove());
        }
      });
    }
    return await renderSheetCanvasFallback(sheet,scale);
  }


  async function capturePNG(){
    const sheet=document.getElementById(`sheet-${activeUid}`);if(!sheet)return setStatus('A ficha não está mais visível.','error');
    setBusy(true);setStatus('Preparando imagem em alta qualidade…','working');
    try{await waitCaptureAssets(sheet);const scale=Number(scaleSelect.value)||2,canvas=await renderSheetCanvas(sheet,scale);const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('O navegador não criou o PNG.')),'image/png',1));const g=generatedState.get(activeUid);downloadBlob(blob,`${safeFileName(g?.r?.name)}-ficha.png`);setStatus('PNG salvo com sucesso. Verifique a pasta de Downloads.','success')}
    catch(err){console.error('Falha ao capturar PNG:',err);setStatus(`Falha ao gerar PNG: ${err?.message||'recurso bloqueado pelo navegador.'}`,'error')}
    finally{setBusy(false)}
  }

  window.openSheetCapture=uid=>{activeUid=String(uid);setStatus('Escolha o formato da captura.');dialog.showModal()};
  closeBtn.onclick=()=>dialog.close();pngBtn.onclick=capturePNG;dialog.addEventListener('click',e=>{if(e.target===dialog&&!dialog.classList.contains('is-recording'))dialog.close()});
})();

/* v9.0 — Rolador de dados de RPG */
(function setupDiceRoller(){
  const dialog=document.getElementById('diceDialog');
  const openBtn=document.getElementById('diceBtn');
  const closeBtn=document.getElementById('diceCloseBtn');
  const form=document.getElementById('diceForm');
  const input=document.getElementById('diceExpression');
  const resultBox=document.getElementById('diceResult');
  const historyBox=document.getElementById('diceHistory');
  const clearBtn=document.getElementById('diceClearHistoryBtn');
  if(!dialog||!openBtn||!form||!input||!resultBox||!historyBox)return;

  const HISTORY_KEY='relians_dice_history_v1';
  let history=[];
  try{history=JSON.parse(localStorage.getItem(HISTORY_KEY)||'[]');if(!Array.isArray(history))history=[]}catch{history=[]}

  function randomInt(max){
    if(window.crypto?.getRandomValues){const limit=Math.floor(0x100000000/max)*max;const arr=new Uint32Array(1);do{crypto.getRandomValues(arr)}while(arr[0]>=limit);return arr[0]%max+1}
    return Math.floor(Math.random()*max)+1;
  }
  function tokenizeArithmetic(source){
    const tokens=[];let i=0;
    while(i<source.length){const c=source[i];if(/\s/.test(c)){i++;continue}if(/[+\-*/()%]/.test(c)){tokens.push(c);i++;continue}if(/[0-9.]/.test(c)){let s='';while(i<source.length&&/[0-9.]/.test(source[i]))s+=source[i++];if((s.match(/\./g)||[]).length>1||s==='.')throw new Error('Número inválido.');tokens.push(Number(s));continue}throw new Error(`Símbolo não permitido: ${c}`)}
    return tokens;
  }
  function evaluateArithmetic(source){
    const t=tokenizeArithmetic(source);let pos=0;
    const peek=()=>t[pos], take=()=>t[pos++];
    function primary(){const x=peek();if(x==='+'||x==='-'){take();const v=primary();return x==='-'?-v:v}if(x==='('){take();const v=expression();if(take()!==')')throw new Error('Parênteses não fechados.');return v}if(typeof x==='number'){take();return x}throw new Error('Expressão incompleta.')}
    function multiplication(){let v=primary();while(['*','/','%'].includes(peek())){const op=take(),r=primary();if((op==='/'||op==='%')&&r===0)throw new Error('Divisão por zero.');v=op==='*'?v*r:op==='/'?v/r:v%r}return v}
    function expression(){let v=multiplication();while(peek()==='+'||peek()==='-'){const op=take(),r=multiplication();v=op==='+'?v+r:v-r}return v}
    const value=expression();if(pos!==t.length)throw new Error('Expressão inválida.');if(!Number.isFinite(value))throw new Error('Resultado inválido.');return value;
  }
  function rollExpression(raw){
    let expression=String(raw||'').trim().toLowerCase().replace(/×/g,'*').replace(/÷/g,'/');
    if(!expression)throw new Error('Digite uma expressão para rolar.');
    if(expression.length>160)throw new Error('A expressão é longa demais.');
    let rolledCount=0;const details=[];
    const resolved=expression.replace(/(\d*)d(\d+)/gi,(full,countText,sidesText)=>{
      const count=countText===''?1:Number(countText),sides=Number(sidesText);
      if(!Number.isInteger(count)||count<1||count>1000)throw new Error('Cada termo pode rolar entre 1 e 1000 dados.');
      if(!Number.isInteger(sides)||sides<2||sides>1000)throw new Error('O dado deve ter entre 2 e 1000 lados.');
      rolledCount+=count;if(rolledCount>5000)throw new Error('Limite de 5000 dados por rolagem.');
      const rolls=Array.from({length:count},()=>randomInt(sides));const subtotal=rolls.reduce((a,b)=>a+b,0);
      details.push({notation:`${count}d${sides}`,rolls,subtotal});return String(subtotal);
    });
    if(/[a-z]/i.test(resolved))throw new Error('Use apenas dados e operações matemáticas.');
    const total=evaluateArithmetic(resolved);
    return{expression,resolved,total,details};
  }
  function formatNumber(n){return Number.isInteger(n)?String(n):String(Math.round(n*1000)/1000)}
  function renderResult(entry){
    const breakdown=entry.details.map(d=>`<div><b>${d.notation}</b>: [${d.rolls.join(', ')}] = ${d.subtotal}</div>`).join('');
    resultBox.innerHTML=`<div class="dice-expression-view">${entry.expression.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}</div><div class="dice-total">${formatNumber(entry.total)}</div>${breakdown?`<div class="dice-breakdown">${breakdown}</div>`:''}<div class="dice-resolved">Cálculo: ${entry.resolved} = ${formatNumber(entry.total)}</div>`;
  }
  function saveHistory(){localStorage.setItem(HISTORY_KEY,JSON.stringify(history.slice(0,25)))}
  function renderHistory(){
    if(!history.length){historyBox.innerHTML='<div class="dice-history-empty">Nenhuma rolagem ainda.</div>';return}
    historyBox.innerHTML=history.map((h,i)=>`<div class="dice-history-item" data-history-index="${i}"><div><b>${h.expression}</b><small>${new Date(h.time).toLocaleString('pt-BR')}</small></div><strong>${formatNumber(h.total)}</strong></div>`).join('');
    historyBox.querySelectorAll('[data-history-index]').forEach(item=>item.onclick=()=>{const h=history[Number(item.dataset.historyIndex)];input.value=h.expression;renderResult(h)});
  }
  function performRoll(expression){
    try{const entry={...rollExpression(expression),time:Date.now()};renderResult(entry);history.unshift(entry);history=history.slice(0,25);saveHistory();renderHistory()}
    catch(err){resultBox.innerHTML=`<div class="dice-error">${String(err.message||err)}</div>`}
  }
  openBtn.onclick=()=>{dialog.showModal();setTimeout(()=>input.focus(),60)};
  closeBtn.onclick=()=>dialog.close();
  dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
  form.addEventListener('submit',e=>{e.preventDefault();performRoll(input.value)});
  document.querySelectorAll('[data-dice-quick]').forEach(btn=>btn.onclick=()=>{input.value=btn.dataset.diceQuick;performRoll(input.value)});
  clearBtn.onclick=()=>{if(!history.length||confirm('Limpar todo o histórico de rolagens?')){history=[];saveHistory();renderHistory()}};
  renderHistory();
})();


/* Etapa 2 (2/3): decisão ao importar fichas antigas */
(function setupPlayerSheetExchangeAndActiveView(){
  const byId=id=>document.getElementById(id);
  const safeName=value=>String(value||'ficha').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9_-]+/gi,'-').replace(/^-+|-+$/g,'')||'ficha';
  const downloadJson=(payload,name)=>{const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500)};
  const clone=value=>JSON.parse(JSON.stringify(value));
  const importedSheetVersion=pack=>{
    const candidates=[pack?.saveVersion,pack?.schemaVersion,pack?.sheet?.saveVersion];
    const found=candidates.find(value=>Number.isFinite(Number(value)));
    return found==null?0:Math.max(0,Number(found)||0);
  };
  const characterSheets=()=> (data.storySheets||[]).filter(s=>s.type==='character'||s.type==='trainer');
  function selectedBankEntrySafe(){try{return typeof bankSelectedEntry==='function'?bankSelectedEntry():null}catch{return null}}

  function askOutdatedSheetAction(sourceVersion){
    return new Promise(resolve=>{
      const existing=document.getElementById('outdatedSheetImportDialog');
      if(existing)existing.remove();

      const dialog=document.createElement('dialog');
      dialog.id='outdatedSheetImportDialog';
      dialog.innerHTML=`
        <form method="dialog" style="min-width:min(520px,88vw);max-width:620px">
          <h2 style="margin-top:0">Ficha desatualizada</h2>
          <p>Esta ficha foi criada em uma versão antiga do Gerador.</p>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:16px 0">
            <div class="sheet-stat"><small>Versão da ficha</small><b>${sourceVersion||'não informada'}</b></div>
            <div class="sheet-stat"><small>Versão atual</small><b>${SAVE_SCHEMA_VERSION}</b></div>
          </div>
          <p style="opacity:.82">Escolha como deseja continuar.</p>
          <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end;margin-top:18px">
            <button type="button" data-action="cancel" class="ghost">Cancelar</button>
            <button type="button" data-action="raw" class="secondary">Importar sem atualizar</button>
            <button type="button" data-action="update" class="primary">Atualizar ficha</button>
          </div>
        </form>`;
      document.body.appendChild(dialog);

      let finished=false;
      const finish=action=>{
        if(finished)return;
        finished=true;
        dialog.close();
        dialog.remove();
        resolve(action);
      };
      dialog.querySelector('[data-action="cancel"]').onclick=()=>finish('cancel');
      dialog.querySelector('[data-action="raw"]').onclick=()=>finish('raw');
      dialog.querySelector('[data-action="update"]').onclick=()=>finish('update');
      dialog.addEventListener('cancel',event=>{event.preventDefault();finish('cancel')});
      dialog.addEventListener('click',event=>{if(event.target===dialog)finish('cancel')});
      dialog.showModal();
    });
  }

  const exportBtn=byId('exportPlayerSheetBtn');
  if(exportBtn)exportBtn.onclick=()=>{
    const entry=selectedBankEntrySafe();
    if(!entry)return alert('Selecione uma ficha no Banco de fichas antes de exportar.');
    let payload;
    if(entry.kind==='character'){
      const sheet=migrateStorySheetRecord(clone(entry.sheet)),team=sheet.character?.team||sheet.trainer?.team||[];
      const ids=[...new Set(team.map(x=>x.savedSheetId).filter(Boolean))];
      const linked=(data.savedRelianSheets||[]).filter(s=>ids.includes(s.id)).map(s=>migrateSavedRelianSheet(clone(s)));
      payload={format:'relians-player-sheet',version:1,saveVersion:SAVE_SCHEMA_VERSION,schemaVersion:SAVE_SCHEMA_VERSION,exportedAt:new Date().toISOString(),kind:'character',sheet,linkedRelianSheets:linked};
      downloadJson(payload,`${safeName(sheet.character?.name||sheet.trainer?.name||'personagem')}.relianficha.json`);
    }else{
      payload={format:'relians-player-sheet',version:1,saveVersion:SAVE_SCHEMA_VERSION,schemaVersion:SAVE_SCHEMA_VERSION,exportedAt:new Date().toISOString(),kind:'relian',sheet:migrateSavedRelianSheet(clone(entry.sheet))};
      downloadJson(payload,`${safeName(entry.sheet.nickname||entry.sheet.speciesName||'relian')}.relianficha.json`);
    }
  };

  const importInput=byId('importPlayerSheetInput');
  if(importInput)importInput.onchange=async e=>{
    const file=e.target.files?.[0]; if(!file)return;
    try{
      const pack=JSON.parse(await file.text());
      if(pack?.format!=='relians-player-sheet'||!pack.sheet)throw new Error('Formato incompatível.');
      const sourceSaveVersion=importedSheetVersion(pack);
      if(sourceSaveVersion>SAVE_SCHEMA_VERSION){
        throw new Error(`Esta ficha usa uma estrutura mais nova (${sourceSaveVersion}) que este gerador (${SAVE_SCHEMA_VERSION}). Atualize o gerador antes de importar.`);
      }
      let importPack=clone(pack);
      let wasUpdated=false;
      if(sourceSaveVersion<SAVE_SCHEMA_VERSION){
        const action=await askOutdatedSheetAction(sourceSaveVersion);
        if(action==='cancel')return;
        if(action==='update'){
          // Mantém uma cópia exata do arquivo antigo antes de convertê-lo.
          downloadJson(
            pack,
            `${safeName(pack.sheet?.character?.name||pack.sheet?.trainer?.name||pack.sheet?.nickname||pack.sheet?.speciesName||file.name.replace(/\.[^.]+$/,''))}-backup-v${sourceSaveVersion||0}.json`
          );

          importPack={...clone(pack),saveVersion:SAVE_SCHEMA_VERSION,schemaVersion:SAVE_SCHEMA_VERSION};
          if(pack.kind==='character'){
            importPack.sheet=migrateStorySheetRecord(clone(pack.sheet));
            importPack.linkedRelianSheets=Array.isArray(pack.linkedRelianSheets)
              ? pack.linkedRelianSheets.map(sheet=>migrateSavedRelianSheet(clone(sheet)))
              : [];
          }else{
            importPack.sheet=migrateSavedRelianSheet(clone(pack.sheet));
          }
          wasUpdated=true;
        }
        // action === 'raw': continua a importação mantendo os dados como estão.
      }
      if(importPack.kind==='character'){
        const imported=clone(importPack.sheet),oldId=imported.id;
        imported.id=`character-importado-${Date.now().toString(36)}`;
        imported.updatedAt=new Date().toISOString();
        const idMap={};
        for(const rel of (importPack.linkedRelianSheets||[])){
          const nr=clone(rel),newId=`relian-importado-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;
          idMap[nr.id]=newId;nr.id=newId;(data.savedRelianSheets||(data.savedRelianSheets=[])).push(nr);
        }
        const c=imported.character||imported.trainer;
        if(c?.team)c.team.forEach(m=>{if(m.savedSheetId&&idMap[m.savedSheetId])m.savedSheetId=idMap[m.savedSheetId]});
        (data.storySheets||(data.storySheets=[])).push(imported);
        selectedSavedSheetId='character:'+imported.id;
      }else{
        const imported=clone(importPack.sheet);imported.id=`relian-importado-${Date.now().toString(36)}`;
        (data.savedRelianSheets||(data.savedRelianSheets=[])).push(imported);
        selectedSavedSheetId='relian:'+imported.id;
      }
      saveData();
      if(typeof renderSavedRelianSheets==='function')renderSavedRelianSheets();
      if(typeof renderSavedSheetDetail==='function')renderSavedSheetDetail();
      alert(wasUpdated?'Ficha atualizada para o modelo atual e importada com sucesso. O arquivo original foi salvo como backup.':'Ficha importada com sucesso.');
    }catch(err){alert('Não foi possível importar esta ficha: '+(err.message||err))}
    e.target.value='';
  };

})();

/* Mobile: transforma grupos grandes em categorias recolhíveis sem alterar o desktop. */
(function setupMobileFormCategories(){
  const mq=window.matchMedia('(max-width: 900px)');
  function apply(){
    const groups=document.querySelectorAll('#relians fieldset, #moves fieldset, #story fieldset, #rules fieldset, #biomes fieldset');
    groups.forEach((fieldset,index)=>{
      fieldset.classList.add('mobile-collapsible');
      const legend=fieldset.querySelector(':scope > legend');
      if(!legend || legend.dataset.mobileCategoryReady==='1') return;
      legend.dataset.mobileCategoryReady='1';
      legend.setAttribute('role','button');
      legend.setAttribute('tabindex','0');
      const toggle=()=>{
        if(!mq.matches) return;
        fieldset.classList.toggle('mobile-section-collapsed');
        legend.setAttribute('aria-expanded',String(!fieldset.classList.contains('mobile-section-collapsed')));
      };
      legend.addEventListener('click',toggle);
      legend.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle();}});
      if(mq.matches){
        const form=fieldset.closest('form');
        const siblings=form?[...form.querySelectorAll(':scope fieldset')]:[];
        if(siblings.indexOf(fieldset)>0) fieldset.classList.add('mobile-section-collapsed');
        legend.setAttribute('aria-expanded',String(!fieldset.classList.contains('mobile-section-collapsed')));
      }
    });
    if(!mq.matches){
      document.querySelectorAll('.mobile-collapsible').forEach(el=>el.classList.remove('mobile-section-collapsed'));
    }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',apply); else apply();
  mq.addEventListener?.('change',apply);
})();

// ===== Criadores / links oficiais =====
const RELIANS_DISCORD_INVITE = 'https://discord.gg/2HkmeKVXjM';
document.addEventListener('DOMContentLoaded', () => {
  const discordLink = document.getElementById('reliansDiscordLink');
  const discordHint = document.getElementById('discordInviteHint');
  if (!discordLink) return;
  if (RELIANS_DISCORD_INVITE) {
    discordLink.href = RELIANS_DISCORD_INVITE;
    discordLink.target = '_blank';
    if (discordHint) discordHint.hidden = true;
  } else {
    discordLink.addEventListener('click', event => {
      event.preventDefault();
      alert('O link oficial de convite do Relians World ainda não foi configurado.');
    });
  }
});
