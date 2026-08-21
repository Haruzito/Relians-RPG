(() => {
  'use strict';
  const $=sel=>document.querySelector(sel);
  let state=ReliansMods.loadState();
  let selectedId=state.mods[0]?.manifest?.id||'';

  const categoryFromPath=path=>{
    const p=String(path||'').toLowerCase().replace(/\\/g,'/');
    if(/(^|\/)(relians|pasta_relians)\//.test(p))return'relians';
    if(/(^|\/)(movimentos|moves)\//.test(p))return'moves';
    if(/(^|\/)(tracos|traços|traits)\//.test(p))return'traits';
    if(/(^|\/)(regioes|regiões|regions)\//.test(p))return'regions';
    if(/(^|\/)(biomas|biomes)\//.test(p))return'biomes';
    if(/(^|\/)(itens|items)\//.test(p))return'items';
    return'';
  };

  function emptyContent(){
    return {relians:[],moves:[],traits:[],regions:[],biomes:[],items:[]};
  }

  function normalizeEntity(raw,category){
    if(Array.isArray(raw))return raw.flatMap(x=>normalizeEntity(x,category));
    if(!raw||typeof raw!=='object')return[];
    if(category==='moves'&&raw.moves&&typeof raw.moves==='object'&&!Array.isArray(raw.moves))return Object.values(raw.moves);
    if(category==='traits'&&raw.traits&&typeof raw.traits==='object'&&!Array.isArray(raw.traits))return Object.values(raw.traits);
    const aliases={
      relians:['relians'],moves:['moves','movimentos'],traits:['traits','tracos','traços'],
      regions:['regions','regioes','regiões'],biomes:['biomes','biomas'],items:['items','itens']
    };
    for(const key of aliases[category]||[]){
      if(Array.isArray(raw[key]))return raw[key];
    }
    return [raw];
  }

  async function parseModFiles(files,rootPrefix=''){
    const entries=[...files].map(file=>({
      file,
      path:String(file.webkitRelativePath||file._relativePath||file.name).replace(/\\/g,'/')
    }));
    const manifestEntry=entries.find(x=>x.path.toLowerCase().endsWith('/mod.json')||x.path.toLowerCase()==='mod.json');
    if(!manifestEntry)throw new Error('mod.json não encontrado.');

    let manifest;
    try{manifest=ReliansMods.normalizeManifest(JSON.parse(await manifestEntry.file.text()))}
    catch{throw new Error('O mod.json não contém JSON válido.');}
    if(!manifest.id)throw new Error('O mod.json precisa possuir um "id".');

    const content=emptyContent();
    const errors=[];
    for(const entry of entries){
      if(!entry.path.toLowerCase().endsWith('.json')||entry===manifestEntry)continue;
      const category=categoryFromPath(entry.path);
      if(!category)continue;
      try{
        const raw=JSON.parse(await entry.file.text());
        for(const value of normalizeEntity(raw,category)){
          if(value&&typeof value==='object')content[category].push(value);
        }
      }catch(err){
        errors.push(`${entry.path}: ${err.message||err}`);
      }
    }

    return {
      manifest,content,enabled:true,source:'folder',
      importedAt:new Date().toISOString(),errors
    };
  }

  function groupByTopFolder(files){
    const groups=new Map();
    for(const file of files){
      const path=String(file.webkitRelativePath||file.name).replace(/\\/g,'/');
      const parts=path.split('/').filter(Boolean);
      // If selected directory is "mods", use mod folder as second part.
      const key=parts.length>2?parts[1]:(parts[0]||'mod');
      if(!groups.has(key))groups.set(key,[]);
      groups.get(key).push(file);
    }
    return groups;
  }

  async function importFileList(files){
    if(!files?.length)return;
    const groups=groupByTopFolder(files);
    const imported=[];
    const failures=[];
    for(const [folder,group] of groups){
      try{imported.push(await parseModFiles(group,folder))}
      catch(err){failures.push(`${folder}: ${err.message||err}`)}
    }
    for(const record of imported){
      const index=state.mods.findIndex(x=>x.manifest.id===record.manifest.id);
      const old=index>=0?state.mods[index]:null;
      if(old)record.enabled=old.enabled!==false;
      if(index>=0)state.mods[index]=record;else state.mods.push(record);
    }
    ReliansMods.saveState(state);
    if(imported.length&&!selectedId)selectedId=imported[0].manifest.id;
    render();
    setStatus(`${imported.length} mod(s) importado(s)${failures.length?` • ${failures.length} falha(s)`:''}.`,failures.length?'warn':'ok');
    if(failures.length)console.warn('Mods não importados:',failures);
  }

  async function directoryFiles(handle,prefix=''){
    const out=[];
    for await(const [name,entry] of handle.entries()){
      const path=prefix?`${prefix}/${name}`:name;
      if(entry.kind==='directory')out.push(...await directoryFiles(entry,path));
      else{
        const file=await entry.getFile();
        Object.defineProperty(file,'webkitRelativePath',{value:path,configurable:true});
        out.push(file);
      }
    }
    return out;
  }

  async function chooseModsFolder(){
    try{
      if(window.showDirectoryPicker&&window.isSecureContext){
        const handle=await window.showDirectoryPicker({mode:'read'});
        const files=await directoryFiles(handle,handle.name);
        await importFileList(files);
      }else $('#modFolderInput').click();
    }catch(err){
      if(err?.name!=='AbortError')setStatus(`Falha ao ler a pasta: ${err.message||err}`,'error');
    }
  }

  function selected(){
    return state.mods.find(x=>x.manifest.id===selectedId)||null;
  }

  function setStatus(text,type=''){
    const node=$('#modsStatus');
    node.textContent=text;
    node.dataset.type=type;
  }

  function summary(counts){
    const rows=[
      ['Relians',counts.relians],['Movimentos',counts.moves],['Itens',counts.items],
      ['Traços',counts.traits],['Regiões',counts.regions],['Biomas',counts.biomes]
    ].filter(([,n])=>n);
    return rows.length?rows.map(([name,n])=>`<span><b>${n}</b>${name}</span>`):'<span><b>0</b>Conteúdo</span>';
  }

  function renderList(){
    const list=$('#modList');
    if(!state.mods.length){
      list.innerHTML='<div class="mods-empty"><b>Nenhum mod instalado</b><span>Vincule sua pasta Mods ou importe uma pasta para começar.</span></div>';
      return;
    }
    list.innerHTML=state.mods.map(record=>{
      const m=record.manifest;
      const counts=ReliansMods.contentCounts(record.content);
      const compat=ReliansMods.compatibility(m);
      const active=selectedId===m.id?' active':'';
      return `<button class="mod-list-card${active}" data-select-mod="${escapeHtml(m.id)}">
        <span class="mod-state ${record.enabled?'on':'off'}">${record.enabled?'ATIVO':'INATIVO'}</span>
        <b>${escapeHtml(m.name)}</b>
        <small>v${escapeHtml(m.version)} • ${escapeHtml(m.author)}</small>
        <em class="${compat.ok?'ok':'bad'}">${escapeHtml(compat.message)}</em>
        <span class="mod-mini-count">${Object.values(counts).reduce((a,b)=>a+b,0)} entradas</span>
      </button>`;
    }).join('');
  }

  function renderDetail(){
    const detail=$('#modDetail');
    const record=selected();
    if(!record){
      detail.innerHTML='<div class="mod-detail-placeholder"><span>◈</span><b>Selecione um mod</b><p>Os detalhes do conteúdo aparecerão aqui.</p></div>';
      return;
    }
    const m=record.manifest;
    const counts=ReliansMods.contentCounts(record.content);
    const compat=ReliansMods.compatibility(m);
    const issues=ReliansMods.diagnostics(state.mods).filter(x=>x.modId===m.id);
    detail.innerHTML=`
      <div class="mod-detail-head">
        <div>
          <span class="mods-kicker">MOD INSTALADO</span>
          <h2>${escapeHtml(m.name)}</h2>
          <p>v${escapeHtml(m.version)} • por ${escapeHtml(m.author)}</p>
        </div>
        <label class="mod-switch">
          <input type="checkbox" data-toggle-mod="${escapeHtml(m.id)}" ${record.enabled?'checked':''}>
          <span></span><b>${record.enabled?'Ativado':'Desativado'}</b>
        </label>
      </div>
      <p class="mod-description">${escapeHtml(m.description||'Este mod não possui descrição.')}</p>
      <div class="mod-compat ${compat.ok?'ok':'bad'}"><b>${compat.ok?'✓ Compatível':'✕ Incompatível'}</b><span>${escapeHtml(compat.message)} • Relians atual: v${ReliansMods.CURRENT_VERSION}</span></div>
      <div class="mod-content-grid">${summary(counts)}</div>
      <section class="mod-detail-section">
        <h3>Conteúdo</h3>
        <div class="mod-content-lines">
          ${Object.entries(counts).map(([key,n])=>`<div><span>${key}</span><b>${n}</b></div>`).join('')}
        </div>
      </section>
      <section class="mod-detail-section">
        <h3>Diagnóstico</h3>
        ${issues.length?`<div class="mod-issues">${issues.map(i=>`<p class="${i.level}">${i.level==='error'?'✕':'⚠'} ${escapeHtml(i.message)}</p>`).join('')}</div>`:'<p class="mod-clean">✓ Nenhum conflito entre os mods ativos foi detectado.</p>'}
        ${(record.errors||[]).length?`<div class="mod-issues">${record.errors.map(x=>`<p class="warn">⚠ ${escapeHtml(x)}</p>`).join('')}</div>`:''}
      </section>
      <div class="mod-detail-actions">
        <button type="button" class="danger" data-remove-mod="${escapeHtml(m.id)}">Remover da lista</button>
      </div>`;
  }

  function escapeHtml(value){
    return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function render(){
    state=ReliansMods.loadState();
    if(selectedId&&!state.mods.some(x=>x.manifest.id===selectedId))selectedId=state.mods[0]?.manifest?.id||'';
    $('#installedCount').textContent=state.mods.length;
    $('#enabledCount').textContent=state.mods.filter(x=>x.enabled).length;
    $('#issueCount').textContent=ReliansMods.diagnostics(state.mods).length;
    renderList();
    renderDetail();
  }

  document.addEventListener('click',event=>{
    const select=event.target.closest('[data-select-mod]');
    if(select){selectedId=select.dataset.selectMod;render();return;}
    const remove=event.target.closest('[data-remove-mod]');
    if(remove){
      const id=remove.dataset.removeMod;
      if(confirm('Remover este mod da lista do Relians? Os arquivos originais não serão apagados.')){
        state.mods=state.mods.filter(x=>x.manifest.id!==id);
        ReliansMods.saveState(state);selectedId='';render();
        setStatus('Mod removido da lista.','ok');
      }
    }
  });

  document.addEventListener('change',event=>{
    if(event.target.matches('[data-toggle-mod]')){
      const record=state.mods.find(x=>x.manifest.id===event.target.dataset.toggleMod);
      if(record){record.enabled=event.target.checked;ReliansMods.saveState(state);render();setStatus('Alteração salva. Reabra o Gerador/Battle Arena para aplicar.','ok');}
    }
  });

  $('#chooseModsFolder').addEventListener('click',chooseModsFolder);
  $('#importMods').addEventListener('click',()=>$('#modFolderInput').click());
  $('#refreshMods').addEventListener('click',()=>{render();setStatus('Lista atualizada.','ok');});
  $('#modFolderInput').addEventListener('change',event=>importFileList(event.target.files));

  render();
})();