(() => {
'use strict';
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const api={
parseRange(move){const explicit=Number(move?.tacticalRange??move?.alcanceTatico);if(Number.isFinite(explicit)&&explicit>0)return clamp(Math.round(explicit),1,12);const raw=String(move?.range||move?.alcance||'').toLowerCase(),n=raw.match(/\d+/);if(n)return clamp(Number(n[0]),1,8);if(/corpo|melee|adjacen/.test(raw))return 1;if(/longo|longa|dist/.test(raw))return 4;return['EFT','HIB'].includes(String(move?.type||move?.tipo||'').toUpperCase())?3:1;},
areaShape(move){return String(move?.tacticalShape||move?.formatoArea||'alvo').toLowerCase();},
shapeLabel(move){return({alvo:'Alvo',cruz:'Cruz',quadrado:'Quadrado',linha:'Linha'})[api.areaShape(move)]||'Alvo';}
};
window.ReliansBattle=window.ReliansBattle||{};window.ReliansBattle.Tactical=api;
})();