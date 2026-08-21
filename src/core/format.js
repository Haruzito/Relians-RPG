(() => {
'use strict';
const api={
normalizeColorId(value='basic'){const raw=String(value||'basic').trim().toLowerCase();if(raw==='special'||raw==='especial'||raw.includes('especial')||raw.includes('special'))return'special';if(raw==='shiny'||raw.includes('shiny'))return'shiny';return'basic';},
normalizeRarityId(value){const raw=String(value||'comum').trim().toLowerCase();const clean=raw.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[_-]+/g,' ').replace(/\s+/g,' ').trim();if(clean==='lendario especial')return'unico';if(clean==='unico')return'unico';return raw;},
hexToRgb(hex){const clean=String(hex||'').replace('#','');const value=clean.length===3?clean.split('').map(x=>x+x).join(''):clean.padEnd(6,'0').slice(0,6);return[parseInt(value.slice(0,2),16)||0,parseInt(value.slice(2,4),16)||0,parseInt(value.slice(4,6),16)||0];},
normalizedText(value){return String(value??'').trim().toLocaleLowerCase('pt-BR');},
battleHistoryDate(value){const date=new Date(value);if(Number.isNaN(date.getTime()))return'Data desconhecida';return date.toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});},
battleHistoryResultLabel(kind){return({win:'Vitória',trainerWin:'Vitória',playerWin:'Vitória',playerLoss:'Derrota',loss:'Derrota',capture:'Captura',escape:'Fuga'})[kind]||'Batalha';},
battleHistoryResultClass(kind){if(kind==='win'||kind==='trainerWin'||kind==='playerWin')return'win';if(kind==='loss'||kind==='playerLoss')return'loss';if(kind==='capture')return'capture';if(kind==='escape')return'escape';return'neutral';}
};
window.ReliansCore=window.ReliansCore||{};window.ReliansCore.Format=api;
})();