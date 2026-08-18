
(() => {
  const buttons = [...document.querySelectorAll('[data-blog-filter]')];
  const posts = [...document.querySelectorAll('[data-blog-kind]')];

  function filterPosts(kind){
    buttons.forEach(btn => {
      const active = btn.dataset.blogFilter === kind;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });

    posts.forEach(post => {
      const show = kind === 'all' || post.dataset.blogKind === kind;
      post.hidden = !show;
    });
  }

  buttons.forEach(btn => btn.addEventListener('click', () => filterPosts(btn.dataset.blogFilter)));
})();
