(() => {
'use strict';
const api={
normalizeCatalogNumber(value){const number=Number(value);return Number.isInteger(number)&&number>0?number:null;},
formatCatalogNumber(value){const number=api.normalizeCatalogNumber(value);return number===null?'':String(number).padStart(3,'0');},
normalizeCatalogVariant(value){return String(value||'').trim().toLocaleUpperCase('pt-BR').replace(/[^A-Z0-9]/g,'').slice(0,3);},
catalogCode(relianOrNumber,variant=''){const number=typeof relianOrNumber==='object'?relianOrNumber?.catalogNumber:relianOrNumber;const resolvedVariant=typeof relianOrNumber==='object'?relianOrNumber?.catalogVariant:variant;const base=api.formatCatalogNumber(number),suffix=api.normalizeCatalogVariant(resolvedVariant);return base?`${base}${suffix?`-${suffix}`:''}`:'';}
};
window.Relians=window.Relians||{};window.Relians.CatalogUtils=api;
})();