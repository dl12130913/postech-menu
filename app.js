'use strict';
(() => {
  const data = window.MENU_DATA;
  const $ = id => document.getElementById(id);
  const stored = (key, fallback) => { try { return localStorage.getItem(key) || fallback; } catch { return fallback; } };
  const save = (key, value) => { try { localStorage.setItem(key, value); } catch {} };
  const seoulDate = () => {
    const parts = new Intl.DateTimeFormat('en-US', {timeZone:'Asia/Seoul', year:'numeric', month:'2-digit', day:'2-digit'}).formatToParts(new Date());
    return ['year','month','day'].map(type => parts.find(p => p.type === type).value).join('-');
  };
  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  if (!data?.days?.length) {
    $('menu').append(el('p', 'empty', '菜单数据暂时不可用，请通过来源链接查看原始菜单。'));
    return;
  }
  const dates = data.days.map(day => day.date);
  const validView = value => value === 'all' || dates.includes(value);
  let today = seoulDate();
  let view;
  try { view = decodeURIComponent(location.hash.slice(1)); } catch { view = ''; }
  if (!validView(view)) view = dates.includes(today) ? today : 'all';
  let theme = stored('menu-theme', 'system');
  if (!['system','light','dark'].includes(theme)) theme = 'system';
  const applyTheme = () => {
    if (theme === 'system') delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = theme;
    $('theme').textContent = '主题：' + {system:'系统',light:'浅色',dark:'深色'}[theme];
    save('menu-theme', theme);
  };
  applyTheme();
  $('theme').addEventListener('click', () => {
    theme = {system:'light',light:'dark',dark:'system'}[theme]; applyTheme();
  });
  const short = date => date.slice(5).split('-').map(Number).join('/');
  $('week-range').textContent = `${short(dates[0])} — ${short(dates.at(-1))}`;
  $('updated').textContent = data.updated;
  $('updated').dateTime = data.updated;
  data.restaurants.forEach(r => {
    const option = el('option', '', r.name); option.value = r.id; $('restaurant').append(option);
  });
  function buildTabs() {
    const buttons = [{date:'all',label:'整周'}, ...data.days];
    $('tabs').replaceChildren(...buttons.map(day => {
      const button = el('button', 'tab', day.date === 'all' ? '整周' : day.label.split(' ').at(-1));
      button.type = 'button'; button.dataset.view = day.date;
      if (day.date !== 'all') button.append(el('small', '', short(day.date)));
      if (day.date === today) { button.classList.add('is-today'); button.setAttribute('aria-label', `${day.label}，今天`); }
      button.addEventListener('click', () => setView(day.date));
      return button;
    }));
  }
  function setView(next, updateHash = true) {
    view = validView(next) ? next : 'all';
    if (updateHash) { try { history.replaceState(null, '', '#' + view); } catch {} }
    render();
  }
  function pick(day, restaurant) {
    const menu = day.menus[restaurant.id];
    const meal = $('meal').value;
    const query = $('query').value.trim().normalize('NFKC').toLocaleLowerCase();
    if (!menu) return null;
    if (meal !== 'all' && restaurant.meal !== 'both' && restaurant.meal !== meal) return null;
    const items = menu.items.filter(item => (meal === 'all' || item.meal === meal) &&
      (!query || `${item.ko} ${item.zh}`.normalize('NFKC').toLocaleLowerCase().includes(query)));
    return items.length ? {items, meta:menu.meta} : null;
  }
  function menuContent(menu, restaurant) {
    const fragment = document.createDocumentFragment();
    if (!menu) { fragment.append(el('p','none','暂无符合条件的菜单')); return fragment; }
    const list = el('ul', 'dishes');
    menu.items.forEach(item => {
      const li = el('li');
      const ko = el('span','ko',item.ko); ko.lang = 'ko';
      if (restaurant.meal === 'both') ko.prepend(el('span','meal-tag',item.meal === 'dinner' ? '晚' : '午'));
      li.append(ko, el('span','zh',item.zh));
      if (item.price) li.append(el('span','won','₩' + item.price));
      list.append(li);
    });
    fragment.append(list);
    if (menu.meta) fragment.append(el('p','meta',menu.meta));
    return fragment;
  }
  function render() {
    document.querySelectorAll('#tabs button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.view === view)));
    const outdated = today > dates.at(-1);
    const future = today < dates[0];
    $('notice').hidden = !(outdated || future);
    $('notice').textContent = outdated ? `当前显示 ${short(dates[0])}–${short(dates.at(-1))} 的历史菜单，新一周菜单尚未更新。` : '当前显示的是即将到来一周的菜单。';
    const days = view === 'all' ? data.days : data.days.filter(day => day.date === view);
    const restaurants = data.restaurants.filter(r => ($('restaurant').value === 'all' || r.id === $('restaurant').value) && days.some(day => pick(day,r)));
    let count = 0;
    const result = document.createDocumentFragment();
    if (!restaurants.length) {
      result.append(el('p','empty','没有找到符合条件的菜品，试试其他关键词或重置筛选。'));
    } else if (view === 'all') {
      const scroll = el('div','scroll'); scroll.tabIndex = 0; scroll.setAttribute('role','region'); scroll.setAttribute('aria-label','整周菜单，可左右滚动');
      const table = el('table','matrix-table');
      const caption = el('caption','sr-only','整周菜单：按餐厅与日期对照'); table.append(caption);
      const head = el('thead'); const row = el('tr');
      const corner = el('th','corner','餐厅 / 日期'); corner.scope = 'col'; row.append(corner);
      days.forEach(day => { const th = el('th','dayhead' + (day.date === today ? ' is-today-col' : ''),day.label); th.scope = 'col'; row.append(th); });
      head.append(row); table.append(head);
      const body = el('tbody');
      restaurants.forEach(r => {
        const row = el('tr'); const heading = el('th','rowhead'); heading.scope = 'row'; heading.append(el('b','',r.name),el('span','',r.detail)); row.append(heading);
        days.forEach(day => { const menu = pick(day,r); count += menu?.items.length || 0; const td = el('td',day.date === today ? 'is-today-col' : ''); td.append(menuContent(menu,r)); row.append(td); });
        body.append(row);
      });
      table.append(body); scroll.append(table); result.append(scroll);
    } else {
      result.append(el('h2','dayttl',days[0].label + (view === today ? ' · 今天' : '')));
      const blocks = el('div','blocks');
      restaurants.forEach(r => {
        const menu = pick(days[0],r); count += menu.items.length;
        const article = el('article','block'); const header = el('header');
        header.append(el('h3','',r.name),el('p','',r.detail));
        article.append(header,menuContent(menu,r)); blocks.append(article);
      });
      result.append(blocks);
    }
    $('menu').replaceChildren(result);
    $('status').textContent = `${view === 'all' ? '整周' : days[0].label} · ${restaurants.length} 个供餐分类 · ${count} 道菜品`;
  }
  $('query').addEventListener('input',render);
  ['restaurant','meal'].forEach(id => $(id).addEventListener('change',render));
  $('reset').addEventListener('click', () => { $('query').value = ''; $('restaurant').value = 'all'; $('meal').value = 'all'; render(); });
  $('today').addEventListener('click', () => {
    today = seoulDate(); buildTabs(); setView(dates.includes(today) ? today : 'all');
    document.querySelector('#tabs .is-today')?.scrollIntoView({block:'nearest',inline:'center'});
  });
  window.addEventListener('hashchange', () => {
    let next; try { next = decodeURIComponent(location.hash.slice(1)); } catch { next = 'all'; }
    setView(next,false);
  });
  // Recheck after a background tab returns, including across Seoul midnight.
  document.addEventListener('visibilitychange', () => { if (!document.hidden && today !== seoulDate()) { today = seoulDate(); buildTabs(); render(); } });
  buildTabs(); render();
})();
