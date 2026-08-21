
(() => {
  const page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();

  const items = [
    {href:'index.html', icon:'⌂', title:'Início', desc:'Portal Relians World'},
    {href:'generator.html', icon:'🧬', title:'Gerador', desc:'Criação, fichas e catálogo'},
    {href:'updates.html', icon:'📰', title:'Blog', desc:'Novidades e mundo de Relians'},
    {href:'games.html', icon:'🎮', title:'Jogos', desc:'Battle Cards e Battle Arena'},
    {href:'mods.html', icon:'🧩', title:'Mods', desc:'Conteúdo externo e extensões'},
  ];

  function sideLink(item){
    const active = page === item.href.toLowerCase();
    return `<a class="rw-side-link${active?' active':''}" href="${item.href}"${active?' aria-current="page"':''}>
      <span class="rw-side-link-icon" aria-hidden="true">${item.icon}</span>
      <span class="rw-side-link-copy"><b>${item.title}</b><small>${item.desc}</small></span>
      <span class="rw-side-link-arrow" aria-hidden="true">›</span>
    </a>`;
  }

  function mount(){
    if(document.querySelector('.rw-side-nav')) return;

    document.body.classList.add('rw-nav-ready');

    const savedTheme=localStorage.getItem('relians-world-theme')||'dark';
    const applyTheme=(theme)=>{
      const next=theme==='light'?'light':'dark';
      document.documentElement.dataset.rwTheme=next;
      localStorage.setItem('relians-world-theme',next);
      document.querySelectorAll('[data-discord-theme-icon]').forEach((img)=>{
        img.src=next==='dark'?'assets/icons/discord-white.png':'assets/icons/discord-black.png';
      });
      const control=document.querySelector('[data-rw-theme-toggle]');
      if(control){
        const icon=control.querySelector('.rw-side-link-icon');
        const title=control.querySelector('.rw-side-link-copy b');
        const small=control.querySelector('.rw-side-link-copy small');
        if(icon)icon.textContent=next==='dark'?'☾':'☀';
        if(title)title.textContent=next==='dark'?'Tema escuro':'Tema claro';
        if(small)small.textContent=next==='dark'?'Verde musgo ativo':'Bege claro ativo';
      }
    };
    applyTheme(savedTheme);

    const button = document.createElement('button');
    button.className = 'rw-nav-toggle';
    button.type = 'button';
    button.setAttribute('aria-label','Abrir menu do Relians World');
    button.setAttribute('aria-expanded','false');
    button.innerHTML = '<span class="rw-nav-toggle-lines" aria-hidden="true"></span>';

    const backdrop = document.createElement('div');
    backdrop.className = 'rw-nav-backdrop';
    backdrop.setAttribute('aria-hidden','true');

    const aside = document.createElement('aside');
    aside.className = 'rw-side-nav';
    aside.setAttribute('aria-label','Menu Relians World');
    aside.innerHTML = `
      <a class="rw-side-brand" href="index.html">
        <img src="assets/icons/relians-logo.png" alt="Logo Relians">
        <span><strong>RELIANS</strong><small>World Navigation</small></span>
      </a>

      <nav class="rw-side-group" aria-label="Projetos Relians">
        <div class="rw-side-label">Explorar</div>
        ${items.map(sideLink).join('')}
      </nav>

      <nav class="rw-side-group" aria-label="Aparência">
        <div class="rw-side-label">Aparência</div>
        <button class="rw-side-link rw-theme-toggle" type="button" data-rw-theme-toggle>
          <span class="rw-side-link-icon" aria-hidden="true">☾</span>
          <span class="rw-side-link-copy"><b>Tema escuro</b><small>Alternar claro / verde musgo</small></span>
          <span class="rw-side-link-arrow" aria-hidden="true">↔</span>
        </button>
      </nav>

      <nav class="rw-side-group" aria-label="Comunidade">
        <div class="rw-side-label">Comunidade</div>
        <a class="rw-side-link" href="https://discord.gg/2HkmeKVXjM" target="_blank" rel="noopener noreferrer">
          <span class="rw-side-link-icon" aria-hidden="true"><img src="assets/icons/discord-white.png" data-discord-theme-icon alt=""></span>
          <span class="rw-side-link-copy"><b>Relians World</b><small>Servidor oficial no Discord</small></span>
          <span class="rw-side-link-arrow" aria-hidden="true">↗</span>
        </a>
      </nav>

      <div class="rw-side-footer">
        <b>Relians World</b>
        Um menu compartilhado entre os projetos do universo Relians.
      </div>`;

    document.body.append(backdrop, aside, button);

    applyTheme(savedTheme);
    aside.querySelector('[data-rw-theme-toggle]')?.addEventListener('click',()=>{
      applyTheme(document.documentElement.dataset.rwTheme==='dark'?'light':'dark');
    });

    const open = () => {
      document.body.classList.add('rw-nav-open');
      button.setAttribute('aria-expanded','true');
      button.setAttribute('aria-label','Fechar menu do Relians World');
    };
    const close = () => {
      document.body.classList.remove('rw-nav-open');
      button.setAttribute('aria-expanded','false');
      button.setAttribute('aria-label','Abrir menu do Relians World');
    };
    const toggle = () => document.body.classList.contains('rw-nav-open') ? close() : open();

    button.addEventListener('click', toggle);
    backdrop.addEventListener('click', close);
    aside.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
    document.addEventListener('keydown', e => {
      if(e.key === 'Escape') close();
    });
    window.addEventListener('orientationchange', close, {passive:true});
    window.addEventListener('resize', () => {
      if(window.innerWidth > 900) close();
    }, {passive:true});
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', mount, {once:true});
  }else{
    mount();
  }
})();


// Central de Jogos Relians
document.addEventListener('click', (ev) => {
  const btn = ev.target.closest('[data-open-game]');
  if (!btn) return;
  const tabId = btn.dataset.openGame;
  const targetTab = document.querySelector(`.tab[data-tab="${tabId}"]`);
  if (targetTab) {
    targetTab.click();
    requestAnimationFrame(() => {
      const panel = document.getElementById(tabId);
      if (panel) panel.scrollIntoView({behavior:'smooth', block:'start'});
    });
  }
});
