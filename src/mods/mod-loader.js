(() => {
  'use strict';

  const STORAGE_KEY='relians-mod-manager-v1';
  const CURRENT_VERSION='10.3.1';

  function clone(value){return JSON.parse(JSON.stringify(value));}
  function norm(value){return String(value??'').trim();}
  function normalizeVersion(v){return norm(v).replace(/^v/i,'');}
  function compareVersion(a,b){
    const aa=normalizeVersion(a).split('.').map(n=>Number(n)||0);
    const bb=normalizeVersion(b).split('.').map(n=>Number(n)||0);
    const length=Math.max(aa.length,bb.length);
    for(let i=0;i<length;i++){
      if((aa[i]||0)>(bb[i]||0))return 1;
      if((aa[i]||0)<(bb[i]||0))return -1;
    }
    return 0;
  }

  function emptyState(){
    return {version:1,mods:[],updatedAt:''};
  }

  function loadState(){
    try{
      const parsed=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');
      if(!parsed||typeof parsed!=='object')return emptyState();
      if(!Array.isArray(parsed.mods))parsed.mods=[];
      return parsed;
    }catch{
      return emptyState();
    }
  }

  function saveState(state){
    const next=state&&typeof state==='object'?state:emptyState();
    next.version=1;
    next.updatedAt=new Date().toISOString();
    localStorage.setItem(STORAGE_KEY,JSON.stringify(next));
    return next;
  }

  function compatibility(manifest={}){
    const min=normalizeVersion(manifest.minReliansVersion||manifest.minVersion||'');
    const max=normalizeVersion(manifest.maxReliansVersion||manifest.maxVersion||'');
    if(min&&compareVersion(CURRENT_VERSION,min)<0){
      return {ok:false,message:`Requer Relians ${min} ou superior.`};
    }
    if(max&&compareVersion(CURRENT_VERSION,max)>0){
      return {ok:false,message:`Compatível somente até Relians ${max}.`};
    }
    return {ok:true,message:'Compatível'};
  }

  function normalizeManifest(raw={}){
    const id=norm(raw.id||raw.modId).toLowerCase().replace(/[^a-z0-9._-]+/g,'-').replace(/^-+|-+$/g,'');
    return {
      id,
      name:norm(raw.name||raw.nome||id||'Mod sem nome'),
      version:norm(raw.version||raw.versao||'1.0.0'),
      author:norm(raw.author||raw.autor||'Autor não informado'),
      description:norm(raw.description||raw.descricao||''),
      minReliansVersion:norm(raw.minReliansVersion||raw.minVersion||''),
      maxReliansVersion:norm(raw.maxReliansVersion||raw.maxVersion||''),
      homepage:norm(raw.homepage||raw.url||'')
    };
  }

  function contentCounts(content={}){
    return {
      relians:Array.isArray(content.relians)?content.relians.length:0,
      moves:Array.isArray(content.moves)?content.moves.length:0,
      traits:Array.isArray(content.traits)?content.traits.length:0,
      regions:Array.isArray(content.regions)?content.regions.length:0,
      biomes:Array.isArray(content.biomes)?content.biomes.length:0,
      items:Array.isArray(content.items)?content.items.length:0
    };
  }

  function mark(value,record,base=null){
    const out=clone(value);
    out._modId=record.manifest.id;
    out._modName=record.manifest.name;
    out._modVersion=record.manifest.version;
    if(base!=null)out._modBase=clone(base);
    return out;
  }

  function stripArray(arr){
    const result=[];
    for(const value of Array.isArray(arr)?arr:[]){
      if(value&&value._modId){
        if(value._modBase!=null)result.push(clone(value._modBase));
      }else result.push(value);
    }
    return result;
  }

  function stripMap(map){
    const result={};
    for(const [id,value] of Object.entries(map||{})){
      if(value&&value._modId){
        if(value._modBase!=null)result[id]=clone(value._modBase);
      }else result[id]=value;
    }
    return result;
  }

  function stripRuntimeMods(data){
    if(!data||typeof data!=='object')return data;
    data.relians=stripArray(data.relians);
    data.regions=stripArray(data.regions);
    data.biomes=stripArray(data.biomes);
    data.moves=stripMap(data.moves);
    data.traits=stripMap(data.traits);
    return data;
  }

  function mergeArray(target,entries,record){
    if(!Array.isArray(target))target=[];
    for(const raw of entries||[]){
      if(!raw||typeof raw!=='object')continue;
      const id=norm(raw.id||raw.relianId);
      if(!id)continue;
      const index=target.findIndex(x=>String(x?.id||'')===id);
      const base=index>=0?target[index]:null;
      const next=mark({...base,...raw,id},record,base);
      if(index>=0)target[index]=next;else target.push(next);
    }
    return target;
  }

  function mergeMap(target,entries,record){
    if(!target||typeof target!=='object'||Array.isArray(target))target={};
    for(const raw of entries||[]){
      if(!raw||typeof raw!=='object')continue;
      const id=norm(raw.id);
      if(!id)continue;
      const base=target[id]||null;
      target[id]=mark({...base,...raw,id},record,base);
    }
    return target;
  }

  function activeRecords(){
    return loadState().mods.filter(record=>{
      if(!record?.enabled)return false;
      if(!record?.manifest?.id)return false;
      return compatibility(record.manifest).ok;
    });
  }

  function applyStoredMods(data){
    if(!data||typeof data!=='object')return data;
    stripRuntimeMods(data);
    for(const record of activeRecords()){
      const content=record.content||{};
      data.relians=mergeArray(data.relians,content.relians,record);
      data.regions=mergeArray(data.regions,content.regions,record);
      data.biomes=mergeArray(data.biomes,content.biomes,record);
      data.moves=mergeMap(data.moves,content.moves,record);
      data.traits=mergeMap(data.traits,content.traits,record);
    }
    return data;
  }

  function runtimeItems(){
    const merged=new Map();
    for(const record of activeRecords()){
      for(const item of record.content?.items||[]){
        const id=norm(item?.id);
        if(!id)continue;
        merged.set(id,{...clone(item),id,_modId:record.manifest.id,_modName:record.manifest.name,official:false});
      }
    }
    return [...merged.values()];
  }

  function diagnostics(records=loadState().mods){
    const issues=[];
    const active=(records||[]).filter(x=>x?.enabled);
    const categories=['relians','moves','traits','regions','biomes','items'];
    for(const record of active){
      const compat=compatibility(record.manifest);
      if(!compat.ok)issues.push({level:'error',modId:record.manifest.id,message:compat.message});
    }
    for(const category of categories){
      const seen=new Map();
      for(const record of active){
        for(const value of record.content?.[category]||[]){
          const id=norm(value?.id);
          if(!id)continue;
          if(seen.has(id)){
            issues.push({
              level:'warn',
              modId:record.manifest.id,
              message:`${category}: o ID "${id}" também é fornecido por ${seen.get(id)}. O mod carregado por último terá prioridade.`
            });
          }else seen.set(id,record.manifest.name);
        }
      }
    }
    return issues;
  }

  window.ReliansMods={
    STORAGE_KEY,CURRENT_VERSION,loadState,saveState,normalizeManifest,
    compatibility,contentCounts,applyStoredMods,stripRuntimeMods,runtimeItems,
    diagnostics,compareVersion
  };
})();