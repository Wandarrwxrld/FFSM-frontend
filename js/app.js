import { Store, Auth, Audit } from './store.js';
import { NAV_GROUPS, ENTITIES, ICONS, groupForEntity } from './schema.js';
import { bannerKeyForGroup, bannerSvg } from './banners.js';

/* ---------------------------------------------------------------------- */
/* Bootstrap — resolves the session against the real backend before any   */
/* UI renders, so a stale/invalid token bounces straight back to login.   */
/* ---------------------------------------------------------------------- */
const user = await Auth.requireSession();

if (user){
  document.getElementById('avatarInitials').textContent =
    (user.firstName[0] + user.lastName[0]).toUpperCase();
  document.getElementById('userName').textContent = `${user.firstName} ${user.lastName}`;
  document.getElementById('userRole').textContent = Auth.roleLabel(user.role);
  document.getElementById('topRoleBadge').textContent = Auth.roleLabel(user.role);

  document.getElementById('signOutBtn').addEventListener('click', async () => {
    await Auth.signOut();
    window.location.href = 'login.html';
  });
}

function icon(key, size = 16){
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[key] || ''}</svg>`;
}

function canAccess(entityKey){
  const def = ENTITIES[entityKey];
  if (!def) return false;
  return def.roles.includes(user.role);
}

/* ---------------------------------------------------------------------- */
/* In-memory cache — avoids re-fetching a referenced entity's whole table  */
/* every time a foreign-key label needs resolving (e.g. every row in the  */
/* Fields table needs the parent Farm's name). Cheap and good enough for  */
/* a single session; invalidated on writes to that entity.                */
/* ---------------------------------------------------------------------- */
const cache = {};
async function fetchCached(entity, force = false){
  if (force || !cache[entity]){
    cache[entity] = await Store.all(entity);
  }
  return cache[entity];
}
function invalidate(entity){
  delete cache[entity];
}

/* ---------------------------------------------------------------------- */
/* Sidebar                                                                */
/* ---------------------------------------------------------------------- */
function buildSidebar(activeKey){
  const nav = document.getElementById('navContainer');
  nav.innerHTML = '';
  NAV_GROUPS.forEach(group => {
    const visible = group.items.filter(canAccess);
    if (!visible.length) return;
    const label = document.createElement('div');
    label.className = 'group-label';
    label.textContent = group.label;
    nav.appendChild(label);
    visible.forEach(key => {
      const def = ENTITIES[key];
      const a = document.createElement('a');
      a.href = `#/${key}`;
      a.className = 'nav-item' + (key === activeKey ? ' active' : '');
      a.innerHTML = `${icon(key)}<span>${def.label}</span>`;
      nav.appendChild(a);
    });
  });
}

/* ---------------------------------------------------------------------- */
/* Sidebar Toggle                                                          */
/* ---------------------------------------------------------------------- */
function setSidebarOpen(open){
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebarBackdrop');
  if (sidebar) sidebar.classList.toggle('open', open);
  if (backdrop) backdrop.classList.toggle('show', open);
}

document.getElementById('menuToggle')?.addEventListener('click', () => {
  const sidebar = document.getElementById('sidebar');
  const isOpen = sidebar ? sidebar.classList.contains('open') : false;
  setSidebarOpen(!isOpen);
});

document.getElementById('sidebarBackdrop')?.addEventListener('click', () => setSidebarOpen(false));
/* ---------------------------------------------------------------------- */
/* Farm picker                                                            */
/* ---------------------------------------------------------------------- */
async function refreshFarmPicker(){
  const picker = document.getElementById('farmPicker');
  const farms = await fetchCached('farms');
  const selected = localStorage.getItem('ffms_selected_farm');
  if (!farms.length){
    picker.innerHTML = `<option>No farms yet</option>`;
    return;
  }
  picker.innerHTML = farms.map(f =>
    `<option value="${f.id}" ${String(f.id) === selected ? 'selected' : ''}>${escapeHtml(f.farm_name)}</option>`
  ).join('');
  if (!selected) localStorage.setItem('ffms_selected_farm', farms[0].id);
}
document.getElementById('farmPicker').addEventListener('change', (e) => {
  localStorage.setItem('ffms_selected_farm', e.target.value);
});

/* ---------------------------------------------------------------------- */
/* Toasts                                                                 */
/* ---------------------------------------------------------------------- */
function toast(msg, isErr = false){
  const stack = document.getElementById('toastStack');
  const t = document.createElement('div');
  t.className = 'toast' + (isErr ? ' err' : '');
  t.textContent = msg;
  stack.appendChild(t);
  setTimeout(() => t.remove(), 2800);
}

/* ---------------------------------------------------------------------- */
/* Helpers                                                                */
/* ---------------------------------------------------------------------- */
function escapeHtml(str){
  if (str === null || str === undefined) return '';
  return String(str).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function labelForRef(field, record){
  if (!record) return null;
  if (field.refLabel && !field.refLabel.startsWith('#') && record[field.refLabel] !== undefined && record[field.refLabel] !== ''){
    return record[field.refLabel];
  }
  const def = ENTITIES[field.ref];
  return `${def?.singular || field.ref} #${record.id}`;
}

/** Synchronous — assumes the referenced entity is already in cache (renderEntityView/openDrawer pre-fetch it). */
function resolveRefLabelSync(field, value){
  if (value === undefined || value === null || value === '') return '\u2014';
  const list = cache[field.ref] || [];
  const rec = list.find(r => String(r.id) === String(value));
  if (!rec) return `#${value}`;
  return labelForRef(field, rec);
}

const STATUS_PILL = {
  active: 'olive', operational: 'olive', completed: 'olive', paid: 'olive',
  effective: 'olive', delivered: 'olive', confirmed: 'olive', approved: 'olive',
  fulfilled: 'olive', stored: 'olive', permanent: 'olive',
  pending: 'neutral', scheduled: 'neutral', draft: 'neutral', requested: 'neutral',
  planned: 'neutral', casual: 'neutral', in_progress: 'ochre',
  maintenance: 'ochre', under_maintenance: 'ochre', partially_paid: 'ochre',
  dispatched: 'ochre', partially_effective: 'ochre', moderate: 'ochre', contract: 'neutral',
  cancelled: 'rust', failed: 'rust', deceased: 'rust', out_of_service: 'rust',
  ineffective: 'rust', disposed: 'rust', inactive: 'rust', suspended: 'rust', severe: 'rust', high: 'rust',
};
function pill(value){
  if (value === undefined || value === null || value === '') return '\u2014';
  const cls = STATUS_PILL[String(value)] || 'neutral';
  return `<span class="pill pill-${cls}">${escapeHtml(String(value).replace(/_/g, ' '))}</span>`;
}

function bannerHtml(entityKey){
  const groupLabel = groupForEntity(entityKey);
  const key = bannerKeyForGroup(groupLabel);
  return `<div class="module-banner">${bannerSvg(key)}<span class="banner-label">${escapeHtml(groupLabel)}</span></div>`;
}

/* ---------------------------------------------------------------------- */
/* Drawer (add / edit)                                                    */
/* ---------------------------------------------------------------------- */
const overlay = document.getElementById('overlay');
const drawer = document.getElementById('drawer');
const drawerBody = document.getElementById('drawerBody');
const drawerTitle = document.getElementById('drawerTitle');
const drawerSave = document.getElementById('drawerSave');

let activeEntity = null;
let editingId = null;

async function openDrawer(entityKey, record = null){
  activeEntity = entityKey;
  editingId = record ? record.id : null;
  const def = ENTITIES[entityKey];
  drawerTitle.textContent = record ? `Edit ${def.singular}` : `Add ${def.singular}`;
  drawerBody.innerHTML = '';

  // Pre-fetch every referenced entity this form's selects will need.
  const refEntities = [...new Set(def.fields.filter(f => f.type === 'select' && f.ref).map(f => f.ref))];
  await Promise.all(refEntities.map(e => fetchCached(e)));

  for (const f of def.fields){
    const wrap = document.createElement('div');
    wrap.className = 'field';
    const val = record ? record[f.name] : (f.default !== undefined ? f.default : '');

    let inputHtml = '';
    if (f.type === 'textarea'){
      inputHtml = `<textarea id="fld_${f.name}">${escapeHtml(val)}</textarea>`;
    } else if (f.type === 'select' && f.ref){
      const selected = localStorage.getItem('ffms_selected_farm');
      const options = (cache[f.ref] || []).map(r =>
        `<option value="${r.id}" ${String(val) === String(r.id) ? 'selected' : ''}>${escapeHtml(labelForRef(f, r))}</option>`
      ).join('');
      const preselect = !record && f.name === 'farm_id' && selected;
      inputHtml = `<select id="fld_${f.name}"><option value="">Select\u2026</option>${options}</select>`;
      wrap.dataset.preselect = preselect ? selected : '';
    } else if (f.type === 'select'){
      const options = f.options.map(o =>
        `<option value="${o}" ${val === o ? 'selected' : ''}>${escapeHtml(o.replace(/_/g,' '))}</option>`
      ).join('');
      inputHtml = `<select id="fld_${f.name}">${options}</select>`;
    } else if (f.type === 'datetime'){
      const dv = val ? String(val).slice(0,16) : '';
      inputHtml = `<input type="datetime-local" id="fld_${f.name}" value="${dv}">`;
    } else {
      const step = f.step ? ` step="${f.step}"` : '';
      inputHtml = `<input type="${f.type}" id="fld_${f.name}" value="${escapeHtml(val)}"${step} placeholder="${escapeHtml(f.placeholder || '')}">`;
    }

    wrap.innerHTML = `<label>${f.label}</label>${inputHtml}`;
    drawerBody.appendChild(wrap);

    if (f.type === 'select' && f.ref && wrap.dataset.preselect){
      wrap.querySelector('select').value = wrap.dataset.preselect;
    }
    if (f.type === 'select' && f.ref && !(cache[f.ref] || []).length){
      const note = document.createElement('p');
      note.className = 'help-text';
      note.textContent = `No ${ENTITIES[f.ref].label.toLowerCase()} recorded yet \u2014 add one first.`;
      wrap.appendChild(note);
    }
  }

  overlay.classList.add('show');
  drawer.classList.add('show');
}

function closeDrawer(){
  overlay.classList.remove('show');
  drawer.classList.remove('show');
  activeEntity = null;
  editingId = null;
}
document.getElementById('drawerClose').addEventListener('click', closeDrawer);
document.getElementById('drawerCancel').addEventListener('click', closeDrawer);
overlay.addEventListener('click', closeDrawer);

drawerSave.addEventListener('click', async () => {
  const def = ENTITIES[activeEntity];
  const record = {};
  for (const f of def.fields){
    const el = document.getElementById(`fld_${f.name}`);
    let v = el.value;
    if (f.required && !v){
      el.focus();
      toast(`${f.label} is required.`, true);
      return;
    }
    if (v !== '' && f.type === 'number') v = Number(v);
    if (f.type === 'select' && f.ref && v !== '') v = Number(v);
    record[f.name] = v;
  }

  drawerSave.disabled = true;
  drawerSave.textContent = 'Saving\u2026';
  try{
    if (editingId){
      await Store.update(activeEntity, editingId, record);
      toast(`${def.singular} updated.`);
    } else {
      await Store.insert(activeEntity, record);
      toast(`${def.singular} added.`);
    }
    invalidate(activeEntity);
    closeDrawer();
    await renderRoute();
  }catch(err){
    toast(err.message || 'Could not save.', true);
  }finally{
    drawerSave.disabled = false;
    drawerSave.textContent = 'Save';
  }
});

/* ---------------------------------------------------------------------- */
/* Generic entity list view                                               */
/* ---------------------------------------------------------------------- */
async function renderEntityView(entityKey){
  const def = ENTITIES[entityKey];
  const view = document.getElementById('view');
  view.innerHTML = `<div class="empty-state"><p>Loading\u2026</p></div>`;

  const rows = await fetchCached(entityKey, true);
  const cols = (def.fields || []).slice(0, 6);

  // Pre-fetch every referenced entity these columns need to render labels.
  const refEntities = [...new Set(cols.filter(f => f.type === 'select' && f.ref).map(f => f.ref))];
  await Promise.all(refEntities.map(e => fetchCached(e)));

  view.innerHTML = `
    ${bannerHtml(entityKey)}
    <div class="page-head">
      <div>
        <h1>${def.label}</h1>
        <p class="desc">${def.description || ''}</p>
      </div>
      <button class="btn btn-primary" id="addBtn">+ Add ${def.singular}</button>
    </div>
    <div class="toolbar">
      <div class="search-box">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
        <input type="text" id="searchInput" placeholder="Search ${def.label.toLowerCase()}\u2026">
      </div>
      <div class="toolbar-spacer"></div>
      <span class="count-tag" id="countTag">${rows.length} record${rows.length === 1 ? '' : 's'}</span>
    </div>
    <div id="tableHost"></div>
  `;

  document.getElementById('addBtn').addEventListener('click', async () => {
    try{ await openDrawer(entityKey); }
    catch(err){ toast(err.message || 'Could not open the form.', true); }
  });

  function draw(filtered){
    const host = document.getElementById('tableHost');
    if (!filtered.length){
      host.innerHTML = emptyStateHtml(entityKey, def);
      const btn = host.querySelector('.empty-add');
      if (btn) btn.addEventListener('click', () => openDrawer(entityKey));
      return;
    }
    const theadCells = cols.map(f => `<th>${f.label}</th>`).join('');
    const rowsHtml = filtered.map(r => {
      const tds = cols.map(f => {
        let display;
        if (f.type === 'select' && f.ref){
          display = escapeHtml(resolveRefLabelSync(f, r[f.name]));
        } else if (f.type === 'select'){
          display = pill(r[f.name]);
        } else if (f.type === 'number'){
          display = `<span class="num">${r[f.name] !== undefined && r[f.name] !== '' ? r[f.name] : '\u2014'}</span>`;
        } else {
          display = r[f.name] !== undefined && r[f.name] !== '' ? escapeHtml(r[f.name]) : '\u2014';
        }
        return `<td>${display}</td>`;
      }).join('');
      return `
        <tr data-id="${r.id}">
          ${tds}
          <td>
            <div class="row-actions">
              <button class="edit-btn" data-id="${r.id}">Edit</button>
              <button class="del del-btn" data-id="${r.id}">Delete</button>
            </div>
          </td>
        </tr>`;
    }).join('');

    host.innerHTML = `
      <div class="table-wrap">
        <table>
          <thead><tr>${theadCells}<th></th></tr></thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </div>`;

    host.querySelectorAll('.edit-btn').forEach(b => b.addEventListener('click', async () => {
      const rec = rows.find(r => String(r.id) === b.dataset.id);
      try{ await openDrawer(entityKey, rec); }
      catch(err){ toast(err.message || 'Could not open the form.', true); }
    }));
    host.querySelectorAll('.del-btn').forEach(b => b.addEventListener('click', async () => {
      if (confirm(`Delete this ${def.singular.toLowerCase()}? This can't be undone.`)){
        const id = Number(b.dataset.id);
        try{
          await Store.remove(entityKey, id);
          invalidate(entityKey);
          toast(`${def.singular} deleted.`);
          await renderRoute();
        }catch(err){
          toast(err.message || 'Could not delete.', true);
        }
      }
    }));
  }

  draw(rows);

  document.getElementById('searchInput').addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    const filtered = !q ? rows : rows.filter(r =>
      cols.some(f => String(r[f.name] ?? '').toLowerCase().includes(q))
    );
    document.getElementById('countTag').textContent = `${filtered.length} record${filtered.length === 1 ? '' : 's'}`;
    draw(filtered);
  });
}

function emptyStateHtml(entityKey, def){
  return `
    <div class="table-wrap">
      <div class="empty-state">
        <div class="glyph">${icon(entityKey, 44)}</div>
        <h3>No ${def.label.toLowerCase()} yet</h3>
        <p>Records you add will appear here. Start by adding your first ${def.singular.toLowerCase()}.</p>
        <button class="btn btn-primary empty-add">+ Add ${def.singular}</button>
      </div>
    </div>`;
}

/* ---------------------------------------------------------------------- */
/* Dashboard                                                              */
/* ---------------------------------------------------------------------- */
async function renderDashboard(){
  const view = document.getElementById('view');
  view.innerHTML = `<div class="empty-state"><p>Loading\u2026</p></div>`;

  const [farms, fields, plantings, livestock, inventoryItems, tasks, finance] = await Promise.all([
    fetchCached('farms', true), fetchCached('fields', true), fetchCached('crop_plantings', true),
    fetchCached('livestock', true), fetchCached('inventory_items', true),
    fetchCached('task_allocations', true), fetchCached('financial_transactions', true),
  ]);

  const activePlantings = plantings.filter(p => p.status === 'active').length;
  const livestockCount = livestock.filter(a => a.status === 'active').length;
  const lowStock = inventoryItems.filter(i => Number(i.current_stock) <= Number(i.reorder_threshold)).length;
  const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length;
  const income = finance.filter(t => t.transaction_type === 'income').reduce((s,t)=>s+Number(t.amount||0),0);
  const expense = finance.filter(t => t.transaction_type === 'expense').reduce((s,t)=>s+Number(t.amount||0),0);

  const hasAnyData = farms.length || fields.length || plantings.length;

  view.innerHTML = `
    ${bannerHtml('dashboard')}
    <div class="page-head">
      <div>
        <h1>Good day, ${escapeHtml(user.firstName)}</h1>
        <p class="desc">Here's where things stand across ${farms.length ? escapeHtml(farms[0].farm_name) + (farms.length > 1 ? ` and ${farms.length - 1} other farm${farms.length > 2 ? 's' : ''}` : '') : 'your farm'}.</p>
      </div>
    </div>

    <div class="stat-grid">
      <div class="stat-card"><div class="label">Farms</div><div class="value olive">${farms.length}</div></div>
      <div class="stat-card"><div class="label">Fields</div><div class="value olive">${fields.length}</div></div>
      <div class="stat-card"><div class="label">Active plantings</div><div class="value ochre">${activePlantings}</div></div>
      <div class="stat-card"><div class="label">Livestock on hand</div><div class="value ochre">${livestockCount}</div></div>
      <div class="stat-card"><div class="label">Items below reorder point</div><div class="value ${lowStock ? 'rust' : 'olive'}">${lowStock}</div></div>
      <div class="stat-card"><div class="label">Open tasks</div><div class="value slate">${pendingTasks}</div></div>
    </div>

    <div class="panel-grid">
      <div class="panel">
        <h3>Net position (recorded so far)</h3>
        ${income || expense ? `
          <div class="stat-grid" style="grid-template-columns:1fr 1fr 1fr;margin-bottom:8px;">
            <div class="stat-card"><div class="label">Income</div><div class="value olive num">${income.toLocaleString()}</div></div>
            <div class="stat-card"><div class="label">Expense</div><div class="value rust num">${expense.toLocaleString()}</div></div>
            <div class="stat-card"><div class="label">Net</div><div class="value num">${(income-expense).toLocaleString()}</div></div>
          </div>
        ` : `<div class="empty-state" style="padding:28px 10px;">
              <p>No financial transactions recorded yet. Figures will total here once income or expenses are logged.</p>
            </div>`}
      </div>
      <div class="panel">
        <h3>Getting started</h3>
        ${hasAnyData ? `
          <p style="color:var(--ink-soft);font-size:13.5px;line-height:1.6;">Keep building out records \u2014 add plantings, log growth stages, and track harvests as the season moves forward.</p>
        ` : `
          <p style="color:var(--ink-soft);font-size:13.5px;line-height:1.6;margin-bottom:12px;">Nothing recorded yet. A good first step:</p>
          <ol style="padding-left:18px;color:var(--ink-soft);font-size:13.5px;line-height:1.9;">
            <li>Add your <a href="#/farms" style="color:var(--olive-dark);font-weight:600;">first farm</a></li>
            <li>Break it into <a href="#/fields" style="color:var(--olive-dark);font-weight:600;">fields</a></li>
            <li>Record a <a href="#/crop_plantings" style="color:var(--olive-dark);font-weight:600;">planting</a> to start tracking a season</li>
          </ol>
        `}
      </div>
    </div>
  `;
}

/* ---------------------------------------------------------------------- */
/* Notifications                                                          */
/* ---------------------------------------------------------------------- */
async function renderNotifications(){
  const view = document.getElementById('view');
  view.innerHTML = `<div class="empty-state"><p>Loading\u2026</p></div>`;
  const all = await fetchCached('notifications', true);
  const items = all.filter(n => Number(n.user_id) === Number(user.id));

  view.innerHTML = `
    ${bannerHtml('notifications')}
    <div class="page-head">
      <div><h1>Notifications</h1><p class="desc">Low stock, weather and task alerts land here.</p></div>
    </div>
    <div id="notifHost"></div>
  `;
  const host = document.getElementById('notifHost');
  if (!items.length){
    host.innerHTML = `
      <div class="table-wrap">
        <div class="empty-state">
          <div class="glyph">${icon('notifications', 44)}</div>
          <h3>You're all caught up</h3>
          <p>Alerts about low stock, upcoming irrigation, and due tasks will show up here as your data grows.</p>
        </div>
      </div>`;
    return;
  }
  host.innerHTML = `<div class="table-wrap"><table>
    <thead><tr><th>Type</th><th>Message</th><th>When</th></tr></thead>
    <tbody>${items.map(n => `<tr><td>${pill(n.alert_type)}</td><td>${escapeHtml(n.message)}</td><td>${n.created_at ? new Date(n.created_at).toLocaleString() : '\u2014'}</td></tr>`).join('')}</tbody>
  </table></div>`;
}

/* ---------------------------------------------------------------------- */
/* Live Weather & Maps \u2014 generated automatically from each farm's saved  */
/* coordinates, via Open-Meteo (free, no API key, CORS-open).             */
/* ---------------------------------------------------------------------- */
async function renderWeather(){
  const view = document.getElementById('view');
  view.innerHTML = `<div class="empty-state"><p>Loading\u2026</p></div>`;
  const farms = await fetchCached('farms', true);

  view.innerHTML = `
    ${bannerHtml('weather')}
    <div class="page-head">
      <div><h1>Weather & Maps</h1><p class="desc">Forecasts are generated automatically from each farm's saved coordinates \u2014 no manual entry needed.</p></div>
    </div>
    <div id="weatherHost"></div>
  `;
  const host = document.getElementById('weatherHost');

  const withCoords = farms.filter(f => f.latitude !== null && f.latitude !== '' && f.longitude !== null && f.longitude !== '');
  if (!farms.length){
    host.innerHTML = `<div class="table-wrap"><div class="empty-state">
      <div class="glyph">${icon('weather', 44)}</div>
      <h3>No farms yet</h3>
      <p>Add a farm with its latitude and longitude to see an automatic forecast here.</p>
      <a href="#/farms" class="btn btn-primary">Add a farm</a>
    </div></div>`;
    return;
  }

  host.innerHTML = farms.map(f => `
    <div class="panel">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">
        <div>
          <h3 style="margin-bottom:2px;">${escapeHtml(f.farm_name)}</h3>
          <p class="help-text" style="margin:0;">${escapeHtml(f.address || 'No address on file')}${(f.latitude && f.longitude) ? ` \u00b7 ${f.latitude}, ${f.longitude}` : ''}</p>
        </div>
        ${(f.latitude && f.longitude)
          ? `<button class="btn btn-primary btn-sm load-forecast" data-id="${f.id}" data-lat="${f.latitude}" data-lon="${f.longitude}" data-name="${escapeHtml(f.farm_name)}">Load forecast</button>`
          : `<span class="pill pill-neutral">No coordinates saved</span>`}
      </div>
      <div id="forecast_${f.id}" style="margin-top:14px;"></div>
    </div>
  `).join('');

  host.querySelectorAll('.load-forecast').forEach(btn => btn.addEventListener('click', async () => {
    const { lat, lon, id, name } = btn.dataset;
    const target = document.getElementById(`forecast_${id}`);
    btn.disabled = true;
    btn.textContent = 'Loading\u2026';
    target.innerHTML = `<p class="help-text">Fetching forecast\u2026</p>`;
    try{
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Weather service unavailable right now.');
      const data = await res.json();
      target.innerHTML = renderForecast(data, name);
    }catch(err){
      target.innerHTML = `<p class="help-text" style="color:var(--rust);">Couldn't load the forecast: ${escapeHtml(err.message)}</p>`;
    }finally{
      btn.disabled = false;
      btn.textContent = 'Reload forecast';
    }
  }));
}

function renderForecast(data, farmName){
  const cur = data.current || {};
  const daily = data.daily || {};
  const days = (daily.time || []).map((date, i) => ({
    date,
    low: daily.temperature_2m_min?.[i],
    high: daily.temperature_2m_max?.[i],
    rain: daily.precipitation_sum?.[i],
  }));

  return `
    <div class="stat-grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:14px;">
      <div class="stat-card"><div class="label">Temperature</div><div class="value slate">${cur.temperature_2m ?? '\u2014'} \u00b0C</div></div>
      <div class="stat-card"><div class="label">Humidity</div><div class="value slate">${cur.relative_humidity_2m ?? '\u2014'}%</div></div>
      <div class="stat-card"><div class="label">Wind</div><div class="value slate">${cur.wind_speed_10m ?? '\u2014'} km/h</div></div>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Date</th><th>Low \u00b0C</th><th>High \u00b0C</th><th>Rain mm</th></tr></thead>
        <tbody>${days.map(d => `
          <tr>
            <td>${new Date(d.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</td>
            <td class="num">${d.low ?? '\u2014'}</td>
            <td class="num">${d.high ?? '\u2014'}</td>
            <td class="num">${d.rain ?? 0}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
    <p class="help-text" style="margin-top:10px;">Weather data: <a href="https://open-meteo.com" target="_blank" rel="noopener" style="color:var(--olive-dark);">Open-Meteo</a>, generated from ${escapeHtml(farmName)}'s saved coordinates. Check local conditions before changing irrigation or field work.</p>
  `;
}

/* ---------------------------------------------------------------------- */
/* Team & Roles                                                           */
/* ---------------------------------------------------------------------- */
async function renderTeam(){
  const view = document.getElementById('view');
  view.innerHTML = `<div class="empty-state"><p>Loading\u2026</p></div>`;
  const users = await Auth.listUsers();
  const canEdit = ['admin', 'owner'].includes(user.role);

  view.innerHTML = `
    ${bannerHtml('team')}
    <div class="page-head">
      <div><h1>Team & Roles</h1><p class="desc">Everyone who can sign in, and what they're allowed to see and do.</p></div>
    </div>
    ${canEdit ? '' : `<div class="access-note">Only an Administrator or Farm Owner can change a teammate's role or status.</div>`}
    <div class="table-wrap">
      <table>
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Verified</th><th>Joined</th></tr></thead>
        <tbody>
          ${users.map(u => `
            <tr>
              <td>${escapeHtml(u.firstName)} ${escapeHtml(u.lastName)}${u.id === user.id ? ' <span class="pill pill-slate">You</span>' : ''}</td>
              <td>${escapeHtml(u.email)}</td>
              <td>
                ${canEdit && u.id !== user.id
                  ? `<select class="role-edit" data-id="${u.id}">${[
                      ['admin','Administrator'],['owner','Farm Owner'],['manager','Farm Manager'],
                      ['agronomist','Agronomist'],['accountant','Accountant'],['worker','Worker'],
                    ].map(([id,label]) => `<option value="${id}" ${id===u.role?'selected':''}>${label}</option>`).join('')}</select>`
                  : Auth.roleLabel(u.role)}
              </td>
              <td>
                ${canEdit && u.id !== user.id
                  ? `<select class="status-edit" data-id="${u.id}">
                      ${['active','inactive','suspended'].map(s => `<option value="${s}" ${s===u.status?'selected':''}>${s}</option>`).join('')}
                     </select>`
                  : pill(u.status)}
              </td>
              <td>${u.emailVerifiedAt ? pill('verified') : pill('pending')}</td>
              <td>${u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '\u2014'}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
  `;

  if (canEdit){
    view.querySelectorAll('.role-edit').forEach(sel => sel.addEventListener('change', async (e) => {
      try{
        await Auth.updateUser(Number(e.target.dataset.id), { role: e.target.value });
        toast('Role updated.');
      }catch(err){ toast(err.message || 'Could not update role.', true); }
      renderTeam();
    }));
    view.querySelectorAll('.status-edit').forEach(sel => sel.addEventListener('change', async (e) => {
      try{
        await Auth.updateUser(Number(e.target.dataset.id), { status: e.target.value });
        toast('Status updated.');
      }catch(err){ toast(err.message || 'Could not update status.', true); }
      renderTeam();
    }));
  }
}

/* ---------------------------------------------------------------------- */
/* Audit log \u2014 visible to Farm Owner and Administrator                   */
/* ---------------------------------------------------------------------- */
async function renderAudit(){
  const view = document.getElementById('view');
  view.innerHTML = `<div class="empty-state"><p>Loading\u2026</p></div>`;
  const logs = await Audit.list();

  view.innerHTML = `
    ${bannerHtml('audit_logs')}
    <div class="page-head">
      <div><h1>Audit Log</h1><p class="desc">Logins, password changes, and every create, update and delete \u2014 who did it, and when.</p></div>
    </div>
    <div id="auditHost"></div>
  `;
  const host = document.getElementById('auditHost');
  if (!logs.length){
    host.innerHTML = `<div class="table-wrap"><div class="empty-state">
      <div class="glyph">${icon('audit_logs', 44)}</div>
      <h3>Nothing logged yet</h3>
      <p>As people sign in and records are created, edited or removed, an entry will appear here.</p>
    </div></div>`;
    return;
  }
  host.innerHTML = `<div class="table-wrap"><table>
    <thead><tr><th>When</th><th>Who</th><th>Action</th><th>Table</th><th>Record</th><th>IP</th></tr></thead>
    <tbody>${logs.map(l => `
      <tr>
        <td>${new Date(l.createdAt).toLocaleString()}</td>
        <td>${escapeHtml(l.actor)}</td>
        <td>${pill(l.action)}</td>
        <td>${escapeHtml(l.tableAffected || '\u2014')}</td>
        <td class="num">${l.recordId ? '#' + l.recordId : '\u2014'}</td>
        <td class="num">${escapeHtml(l.ipAddress || '\u2014')}</td>
      </tr>`).join('')}</tbody>
  </table></div>`;
}

/* ---------------------------------------------------------------------- */
/* Reports                                                                */
/* ---------------------------------------------------------------------- */
async function renderReports(){
  const view = document.getElementById('view');
  view.innerHTML = `<div class="empty-state"><p>Loading\u2026</p></div>`;

  const [harvests, sales, finance] = await Promise.all([
    fetchCached('harvests', true), fetchCached('sales_orders', true), fetchCached('financial_transactions', true),
  ]);
  const totalHarvest = harvests.reduce((s,h)=>s+Number(h.quantity_harvested||0),0);
  const totalLoss = harvests.reduce((s,h)=>s+Number(h.loss_quantity||0),0);
  const totalSales = sales.reduce((s,o)=>s+Number(o.total_amount||0),0);
  const totalIncome = finance.filter(t=>t.transaction_type==='income').reduce((s,t)=>s+Number(t.amount||0),0);
  const totalExpense = finance.filter(t=>t.transaction_type==='expense').reduce((s,t)=>s+Number(t.amount||0),0);
  const anyData = harvests.length || sales.length || finance.length;

  view.innerHTML = `
    ${bannerHtml('reports')}
    <div class="page-head">
      <div><h1>Reports & Analytics</h1><p class="desc">Rolled-up figures across harvests, sales and finance. Updates automatically as records are added.</p></div>
    </div>
    ${anyData ? `
      <div class="stat-grid">
        <div class="stat-card"><div class="label">Total harvested</div><div class="value olive num">${totalHarvest.toLocaleString()}</div></div>
        <div class="stat-card"><div class="label">Total post-harvest loss</div><div class="value rust num">${totalLoss.toLocaleString()}</div></div>
        <div class="stat-card"><div class="label">Total sales value</div><div class="value ochre num">${totalSales.toLocaleString()}</div></div>
        <div class="stat-card"><div class="label">Recorded income</div><div class="value olive num">${totalIncome.toLocaleString()}</div></div>
        <div class="stat-card"><div class="label">Recorded expense</div><div class="value rust num">${totalExpense.toLocaleString()}</div></div>
        <div class="stat-card"><div class="label">Net</div><div class="value num">${(totalIncome-totalExpense).toLocaleString()}</div></div>
      </div>
    ` : `
      <div class="table-wrap"><div class="empty-state">
        <div class="glyph">${icon('reports', 44)}</div>
        <h3>Nothing to report yet</h3>
        <p>Once harvests, sales orders or financial transactions are recorded, summary figures will appear here.</p>
      </div></div>
    `}
  `;
}

/* ---------------------------------------------------------------------- */
/* Router                                                                 */
/* ---------------------------------------------------------------------- */
async function renderRoute(){
  const hash = window.location.hash.replace('#/', '') || 'dashboard';
  const def = ENTITIES[hash];
  window.scrollTo(0, 0);

  if (!def || !def.roles.includes(user.role)){
    document.getElementById('view').innerHTML = `
      <div class="table-wrap"><div class="empty-state">
        <h3>Access restricted</h3>
        <p>Your role (${Auth.roleLabel(user.role)}) doesn't have access to this module.</p>
        <a href="#/dashboard" class="btn btn-primary">Back to dashboard</a>
      </div></div>`;
    buildSidebar(null);
    return;
  }

  setSidebarOpen(false);
  buildSidebar(hash);
  refreshFarmPicker();

  try{
    if (hash === 'dashboard') return await renderDashboard();
    if (hash === 'notifications') return await renderNotifications();
    if (def.special === 'weather') return await renderWeather();
    if (def.special === 'team') return await renderTeam();
    if (def.special === 'audit') return await renderAudit();
    if (hash === 'reports') return await renderReports();
    return await renderEntityView(hash);
  }catch(err){
    document.getElementById('view').innerHTML = `
      <div class="table-wrap"><div class="empty-state">
        <h3>Couldn't load this page</h3>
        <p>${escapeHtml(err.message || 'Something went wrong while fetching data.')}</p>
        <button class="btn btn-primary" id="retryRoute">Try again</button>
      </div></div>`;
    document.getElementById('retryRoute')?.addEventListener('click', () => renderRoute());
  }
}

window.addEventListener('hashchange', () => { renderRoute(); });
renderRoute();
