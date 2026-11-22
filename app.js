'use strict';
/* =========================================================
   MONOPOLY · BANCO — lógica de la aplicación
   Calcula el dinero de cada jugador, rentas, casas,
   hipotecas, patrimonio y da recomendaciones en vivo.
   ========================================================= */

// ---------- Datos del juego ----------
const THIMBLE_SVG = `<svg viewBox="0 0 64 64"><defs><linearGradient id="thg" x1="0" x2="1"><stop offset="0" stop-color="#6d727a"/><stop offset=".45" stop-color="#f4f6f8"/><stop offset="1" stop-color="#5d626a"/></linearGradient></defs><path d="M17 50 L21 20 Q32 4 43 20 L47 50 Z" fill="url(#thg)" stroke="#3d424a" stroke-width="2.5"/><g fill="#3d424a" opacity=".55"><circle cx="27" cy="22" r="1.8"/><circle cx="33" cy="20" r="1.8"/><circle cx="38" cy="24" r="1.8"/><circle cx="25" cy="30" r="1.8"/><circle cx="31" cy="28" r="1.8"/><circle cx="37" cy="31" r="1.8"/><circle cx="24" cy="38" r="1.8"/><circle cx="30" cy="36" r="1.8"/><circle cx="36" cy="38" r="1.8"/><circle cx="41" cy="36" r="1.8"/></g><rect x="13" y="47" width="38" height="9" rx="4" fill="url(#thg)" stroke="#3d424a" stroke-width="2.5"/></svg>`;

const TOKENS = [
  { id: 'perro', name: 'Perro', emoji: '🐕' },
  { id: 'acorazado', name: 'Acorazado', emoji: '🚢' },
  { id: 'coche', name: 'Coche de carreras', emoji: '🏎️' },
  { id: 'sombrero', name: 'Sombrero de copa', emoji: '🎩' },
  { id: 'gato', name: 'Gato', emoji: '🐈' },
  { id: 'pinguino', name: 'Pingüino', emoji: '🐧' },
  { id: 'dedal', name: 'Dedal', svg: THIMBLE_SVG },
  { id: 'patito', name: 'Patito de goma', emoji: '🐤' },
];
const TOKEN = Object.fromEntries(TOKENS.map(t => [t.id, t]));
const ACCENTS = ['#ED1B24', '#0072BB', '#1FB25A', '#F7941D', '#D93A96', '#955436', '#7B3FA0', '#00A3A3'];

const GROUPS = {
  brown: { name: 'Marrón', color: '#955436', house: 50 },
  lightblue: { name: 'Celeste', color: '#AAE0FA', house: 50, dark: true },
  pink: { name: 'Rosa', color: '#D93A96', house: 100 },
  orange: { name: 'Naranja', color: '#F7941D', house: 100 },
  red: { name: 'Rojo', color: '#ED1B24', house: 150 },
  yellow: { name: 'Amarillo', color: '#FEF200', house: 150, dark: true },
  green: { name: 'Verde', color: '#1FB25A', house: 200 },
  darkblue: { name: 'Azul', color: '#0072BB', house: 200 },
  rail: { name: 'Ferrocarriles', color: '#2b2b2b' },
  util: { name: 'Servicios', color: '#9AA5AD', dark: true },
};
const GROUP_ORDER = ['brown', 'lightblue', 'pink', 'orange', 'red', 'yellow', 'green', 'darkblue', 'rail', 'util'];

const st = (id, name, short, group, price, rent) => ({ id, name, short, group, type: 'street', price, rent });
const rr = (id, name, short) => ({ id, name, short, group: 'rail', type: 'rail', price: 200 });
const ut = (id, name, short) => ({ id, name, short, group: 'util', type: 'util', price: 150 });

const PROPS = [
  st('mediterraneo', 'Av. Mediterráneo', 'Mediterr.', 'brown', 60, [2, 10, 30, 90, 160, 250]),
  st('baltico', 'Av. Báltico', 'Báltico', 'brown', 60, [4, 20, 60, 180, 320, 450]),
  rr('rr_reading', 'Ferrocarril Reading', 'F. Reading'),
  st('oriental', 'Av. Oriental', 'Oriental', 'lightblue', 100, [6, 30, 90, 270, 400, 550]),
  st('vermont', 'Av. Vermont', 'Vermont', 'lightblue', 100, [6, 30, 90, 270, 400, 550]),
  st('connecticut', 'Av. Connecticut', 'Connectic.', 'lightblue', 120, [8, 40, 100, 300, 450, 600]),
  st('stcharles', 'Plaza San Carlos', 'S. Carlos', 'pink', 140, [10, 50, 150, 450, 625, 750]),
  ut('electrica', 'Compañía Eléctrica', 'Eléctrica'),
  st('estados', 'Av. Estados', 'Estados', 'pink', 140, [10, 50, 150, 450, 625, 750]),
  st('virginia', 'Av. Virginia', 'Virginia', 'pink', 160, [12, 60, 180, 500, 700, 900]),
  rr('rr_penn', 'Ferrocarril Pennsylvania', 'F. Penn.'),
  st('stjames', 'Plaza San Jaime', 'S. Jaime', 'orange', 180, [14, 70, 200, 550, 750, 950]),
  st('tennessee', 'Av. Tennessee', 'Tennessee', 'orange', 180, [14, 70, 200, 550, 750, 950]),
  st('nuevayork', 'Av. Nueva York', 'N. York', 'orange', 200, [16, 80, 220, 600, 800, 1000]),
  st('kentucky', 'Av. Kentucky', 'Kentucky', 'red', 220, [18, 90, 250, 700, 875, 1050]),
  st('indiana', 'Av. Indiana', 'Indiana', 'red', 220, [18, 90, 250, 700, 875, 1050]),
  st('illinois', 'Av. Illinois', 'Illinois', 'red', 240, [20, 100, 300, 750, 925, 1100]),
  rr('rr_bo', 'Ferrocarril B&O', 'F. B&O'),
  st('atlantico', 'Av. Atlántico', 'Atlántico', 'yellow', 260, [22, 110, 330, 800, 975, 1150]),
  st('ventnor', 'Av. Ventnor', 'Ventnor', 'yellow', 260, [22, 110, 330, 800, 975, 1150]),
  ut('agua', 'Compañía de Agua', 'Agua'),
  st('marvin', 'Jardines Marvin', 'Marvin', 'yellow', 280, [24, 120, 360, 850, 1025, 1200]),
  st('pacifico', 'Av. Pacífico', 'Pacífico', 'green', 300, [26, 130, 390, 900, 1100, 1275]),
  st('carolina', 'Av. Carolina del Norte', 'Carolina N.', 'green', 300, [26, 130, 390, 900, 1100, 1275]),
  st('pennsylvania', 'Av. Pennsylvania', 'Pennsylv.', 'green', 320, [28, 150, 450, 1000, 1200, 1400]),
  rr('rr_short', 'Ferrocarril Short Line', 'F. Short L.'),
  st('parkplace', 'Plaza Park', 'Pl. Park', 'darkblue', 350, [35, 175, 500, 1100, 1300, 1500]),
  st('muelle', 'El Muelle', 'Muelle', 'darkblue', 400, [50, 200, 600, 1400, 1700, 2000]),
];
const PROP = Object.fromEntries(PROPS.map(p => [p.id, p]));
const TOTAL_HOUSES = 32, TOTAL_HOTELS = 12;
const STORE_KEY = 'monobank_v1', UNDO_KEY = 'monobank_undo_v1';

// ---------- Estado ----------
function newState(prev) {
  return {
    phase: 'setup',
    players: [],
    props: Object.fromEntries(PROPS.map(p => [p.id, { owner: null, houses: 0, mortgaged: false }])),
    settings: prev ? { ...prev } : { start: 1500, salary: 200, parking: false },
    pot: 0,
    log: [],
    nextId: 1,
  };
}
function load() {
  try { const s = JSON.parse(localStorage.getItem(STORE_KEY)); return s && s.props ? s : null; } catch { return null; }
}
let S = load() || newState();
let undoStack = (() => { try { return JSON.parse(localStorage.getItem(UNDO_KEY)) || []; } catch { return []; } })();
let setupDraft = { name: '', token: null };
let sheet = null;

function save() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(S));
    localStorage.setItem(UNDO_KEY, JSON.stringify(undoStack.slice(-25)));
  } catch { /* almacenamiento lleno: se ignora */ }
}

// ---------- Utilidades ----------
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function fmt(n) {
  n = Math.round(n || 0);
  const s = Math.abs(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return (n < 0 ? '-$' : '$') + s;
}
const player = id => S.players.find(p => p.id === id);
const activePlayers = () => S.players.filter(p => !p.bankrupt);
const pname = id => id === 'bank' ? 'Banco' : id === 'pot' ? 'Parada Libre' : esc(player(id)?.name || '?');
const groupProps = g => PROPS.filter(p => p.group === g);
const ownedBy = pid => PROPS.filter(p => S.props[p.id].owner === pid);
const countOwned = (pid, g) => groupProps(g).filter(p => S.props[p.id].owner === pid).length;
const ownsGroup = (pid, g) => groupProps(g).every(p => S.props[p.id].owner === pid);
const houseCost = id => GROUPS[PROP[id].group].house || 0;
const mortgageValue = id => PROP[id].price / 2;
const unmortgageCost = id => Math.ceil(mortgageValue(id) * 1.1 - 1e-9);
const groupHasHouses = g => groupProps(g).some(p => S.props[p.id].houses > 0);

function tokenHTML(tid, size = '') {
  const t = TOKEN[tid];
  if (!t) return `<div class="token ${size}"><span>🏦</span></div>`;
  return `<div class="token ${size}">${t.svg ? t.svg : `<span>${t.emoji}</span>`}</div>`;
}
function bankToken(size = 'xs') { return `<div class="token ${size}"><span>🏦</span></div>`; }
function potToken(size = 'xs') { return `<div class="token ${size}"><span>🅿️</span></div>`; }
function whoToken(id, size = 'xs') {
  if (id === 'bank') return bankToken(size);
  if (id === 'pot') return potToken(size);
  return tokenHTML(player(id)?.token, size);
}
function houseIcons(h) { return h === 5 ? '🏨' : h > 0 ? '🏠'.repeat(h) : ''; }

function bankHouses() {
  let used = 0; for (const p of PROPS) { const h = S.props[p.id].houses; if (h > 0 && h < 5) used += h; }
  return TOTAL_HOUSES - used;
}
function bankHotels() { return TOTAL_HOTELS - PROPS.filter(p => S.props[p.id].houses === 5).length; }

// ---------- Cálculos financieros ----------
function rentOf(id, dice = 7, cardBonus = false) {
  const p = PROP[id], s = S.props[id];
  if (!s.owner || s.mortgaged) return 0;
  if (p.type === 'street') {
    if (s.houses > 0) return p.rent[s.houses];
    return ownsGroup(s.owner, p.group) ? p.rent[0] * 2 : p.rent[0];
  }
  if (p.type === 'rail') {
    const n = countOwned(s.owner, 'rail');
    return 25 * Math.pow(2, n - 1) * (cardBonus ? 2 : 1);
  }
  const n = countOwned(s.owner, 'util');
  return ((n >= 2 || cardBonus) ? 10 : 4) * (Number(dice) || 0);
}
function rentWhy(id, dice, cardBonus) {
  const p = PROP[id], s = S.props[id];
  if (s.mortgaged) return 'Hipotecada: no cobra renta';
  if (p.type === 'street') {
    if (s.houses === 5) return 'Con hotel';
    if (s.houses > 0) return `Con ${s.houses} casa${s.houses > 1 ? 's' : ''}`;
    return ownsGroup(s.owner, p.group) ? 'Monopolio sin casas: renta doble' : 'Renta básica';
  }
  if (p.type === 'rail') {
    const n = countOwned(s.owner, 'rail');
    return `${n} ferrocarril${n > 1 ? 'es' : ''} del dueño${cardBonus ? ' · Carta: paga doble' : ''}`;
  }
  const n = countOwned(s.owner, 'util');
  return `${(n >= 2 || cardBonus) ? 10 : 4} × dados (${dice || 0})${cardBonus ? ' · Carta' : ''}`;
}
function netWorth(pid) {
  const pl = player(pid); if (!pl) return 0;
  let w = pl.cash;
  for (const p of ownedBy(pid)) {
    const s = S.props[p.id];
    w += s.mortgaged ? p.price / 2 : p.price;
    if (s.houses) w += s.houses * houseCost(p.id);
  }
  return w;
}
function worthParts(pid) {
  let props = 0, build = 0, mort = 0;
  for (const p of ownedBy(pid)) {
    const s = S.props[p.id];
    props += s.mortgaged ? p.price / 2 : p.price;
    if (s.mortgaged) mort += unmortgageCost(p.id);
    build += s.houses * houseCost(p.id);
  }
  return { props, build, mort };
}
/** Dinero que podría reunir: efectivo + vender casas (mitad) + hipotecar */
function liquidity(pid) {
  const pl = player(pid); let l = pl.cash;
  for (const p of ownedBy(pid)) {
    const s = S.props[p.id];
    l += s.houses * houseCost(p.id) / 2;
    if (!s.mortgaged) l += mortgageValue(p.id);
  }
  return l;
}
/** La renta más alta que el jugador podría pagar si cae en propiedad ajena */
function exposure(pid) {
  let best = { rent: 0, prop: null };
  for (const p of PROPS) {
    const s = S.props[p.id];
    if (!s.owner || s.owner === pid) continue;
    const r = rentOf(p.id, 7);
    if (r > best.rent) best = { rent: r, prop: p };
  }
  return best;
}
function ranking() { return activePlayers().map(p => ({ p, w: netWorth(p.id) })).sort((a, b) => b.w - a.w); }

function buildCheck(id) {
  const p = PROP[id], s = S.props[id];
  if (p.type !== 'street') return { ok: false, reason: 'Solo las calles admiten casas.' };
  if (!s.owner) return { ok: false, reason: 'No tiene dueño.' };
  const g = GROUPS[p.group];
  if (!ownsGroup(s.owner, p.group)) return { ok: false, reason: `Necesita todo el grupo ${g.name} para construir.` };
  const gp = groupProps(p.group);
  if (gp.some(x => S.props[x.id].mortgaged)) return { ok: false, reason: 'Hay propiedades hipotecadas en el grupo.' };
  if (s.houses >= 5) return { ok: false, reason: 'Ya tiene hotel (máximo).' };
  const min = Math.min(...gp.map(x => S.props[x.id].houses));
  if (s.houses > min) return { ok: false, reason: 'Construcción pareja: primero construye en las otras del grupo.' };
  if (s.houses < 4 && bankHouses() <= 0) return { ok: false, reason: 'El banco no tiene casas disponibles.' };
  if (s.houses === 4 && bankHotels() <= 0) return { ok: false, reason: 'El banco no tiene hoteles disponibles.' };
  if (player(s.owner).cash < g.house) return { ok: false, reason: `No le alcanza (cuesta ${fmt(g.house)}).` };
  return { ok: true, cost: g.house };
}
function sellCheck(id) {
  const p = PROP[id], s = S.props[id];
  if (p.type !== 'street' || s.houses <= 0) return { ok: false, reason: '' };
  const max = Math.max(...groupProps(p.group).map(x => S.props[x.id].houses));
  if (s.houses < max) return { ok: false, reason: 'Venta pareja: vende primero en las que tienen más casas.' };
  if (s.houses === 5 && bankHouses() < 4) return { ok: false, reason: 'El banco no tiene 4 casas para cambiar el hotel.' };
  return { ok: true, refund: houseCost(id) / 2 };
}
function mortgageCheck(id) {
  const p = PROP[id], s = S.props[id];
  if (!s.owner) return { ok: false, reason: '' };
  if (s.mortgaged) {
    const c = unmortgageCost(id);
    if (player(s.owner).cash < c) return { ok: false, unm: true, cost: c, reason: `Necesita ${fmt(c)} para levantar la hipoteca.` };
    return { ok: true, unm: true, cost: c };
  }
  if (p.type === 'street' && groupHasHouses(p.group)) return { ok: false, reason: 'Vende primero las casas del grupo para hipotecar.' };
  return { ok: true, unm: false, value: mortgageValue(id) };
}

// ---------- Plan para pagar deudas ----------
function liquidationPlan(pid, need) {
  const steps = []; let got = 0;
  const mine = ownedBy(pid);
  // 1) Hipotecar lo que menos renta pierde (sin monopolio ni casas)
  const cheap = mine.filter(p => !S.props[p.id].mortgaged && !(p.type === 'street' && (ownsGroup(pid, p.group))))
    .sort((a, b) => rentOf(a.id) - rentOf(b.id));
  for (const p of cheap) { if (got >= need) break; got += mortgageValue(p.id); steps.push(`hipotecar ${p.short} (+${fmt(mortgageValue(p.id))})`); }
  // 2) Vender casas, del grupo más barato primero
  if (got < need) {
    for (const g of GROUP_ORDER) {
      if (got >= need) break;
      const gp = groupProps(g).filter(p => S.props[p.id].owner === pid && S.props[p.id].houses > 0);
      if (!gp.length) continue;
      const half = GROUPS[g].house / 2;
      const total = gp.reduce((a, p) => a + S.props[p.id].houses, 0);
      const n = Math.min(total, Math.ceil((need - got) / half));
      got += n * half; steps.push(`vender ${n} casa${n > 1 ? 's' : ''} ${GROUPS[g].name} (+${fmt(n * half)})`);
    }
  }
  // 3) Hipotecar monopolios
  if (got < need) {
    const mono = mine.filter(p => !S.props[p.id].mortgaged && !cheap.includes(p)).sort((a, b) => a.price - b.price);
    for (const p of mono) { if (got >= need) break; got += mortgageValue(p.id); steps.push(`hipotecar ${p.short} (+${fmt(mortgageValue(p.id))})`); }
  }
  return steps;
}

// ---------- Motor de recomendaciones ----------
function tipsFor(pid) {
  const pl = player(pid); if (!pl || pl.bankrupt) return [];
  const tips = []; const add = (prio, level, icon, html) => tips.push({ prio, level, icon, html });
  const mine = ownedBy(pid);
  const others = activePlayers().filter(p => p.id !== pid);
  const exp = exposure(pid);
  const liq = liquidity(pid);
  const reserve = Math.min(600, Math.max(150, Math.round(exp.rent * 0.5 / 10) * 10));
  const unownedCount = PROPS.filter(p => !S.props[p.id].owner).length;
  const streetGroups = GROUP_ORDER.slice(0, 8);

  // Deudas
  if (pl.cash < 0) {
    const need = -pl.cash, raisable = liq - pl.cash;
    if (raisable >= need) {
      const plan = liquidationPlan(pid, need);
      add(100, 'danger', '🚨', `Debe <b>${fmt(need)}</b>. Plan sugerido: ${plan.join(' → ') || 'negociar con otro jugador'}.`);
    } else {
      add(100, 'danger', '💀', `Debe <b>${fmt(need)}</b> y como máximo puede reunir ${fmt(raisable)}. Intente negociar; si no, debe declararse en bancarrota.`);
    }
  }
  // Riesgo de rentas altas
  if (exp.prop && pl.cash >= 0) {
    const ow = pname(S.props[exp.prop.id].owner);
    if (exp.rent > liq) add(85, 'danger', '⚠️', `Si cae en <b>${exp.prop.name}</b> (de ${ow}) pagaría <b>${fmt(exp.rent)}</b> y no le alcanzaría ni hipotecando todo. ¡No gaste!`);
    else if (exp.rent > pl.cash) add(75, 'warn', '⚠️', `Ojo: la renta más alta es <b>${fmt(exp.rent)}</b> en ${exp.prop.short} (de ${ow}). Tiene ${fmt(pl.cash)}; mantenga efectivo.`);
  }
  // Construir en monopolios
  for (const g of streetGroups) {
    if (!ownsGroup(pid, g)) continue;
    const gp = groupProps(g), G = GROUPS[g];
    if (gp.some(p => S.props[p.id].mortgaged)) {
      const c = gp.filter(p => S.props[p.id].mortgaged).reduce((a, p) => a + unmortgageCost(p.id), 0);
      add(65, 'warn', '🔓', `Levante las hipotecas de <b>${G.name}</b> (${fmt(c)}) para poder construir casas.`);
      continue;
    }
    const need3 = gp.reduce((a, p) => a + Math.max(0, 3 - S.props[p.id].houses), 0);
    const needMax = gp.reduce((a, p) => a + (5 - S.props[p.id].houses), 0);
    if (needMax === 0) continue;
    const n = Math.floor((pl.cash - reserve) / G.house);
    const best = gp[gp.length - 1];
    if (n >= 1) {
      const k = Math.min(n, need3 > 0 ? need3 : needMax);
      if (need3 > 0) add(70, 'good', '🏠', `Construya <b>${k} casa${k > 1 ? 's' : ''}</b> en ${G.name} (${fmt(G.house)} c/u). La 3ª casa es la más rentable: ${best.short} pasaría de ${fmt(rentOf(best.id))} a <b>${fmt(best.rent[3])}</b>.`);
      else add(58, 'good', '🏨', `Puede seguir construyendo en ${G.name}: ${k} casa${k > 1 ? 's' : ''}/hotel a ${fmt(G.house)} c/u, sin perder su reserva.`);
    } else if (need3 > 0) {
      add(45, 'info', '💰', `Ahorre para casas en <b>${G.name}</b> (${fmt(G.house)} c/u). Un monopolio sin casas cobra poco.`);
    }
  }
  // Escasez de casas
  if (bankHouses() <= 8 && streetGroups.some(g => ownsGroup(pid, g))) {
    add(50, 'info', '🏘️', `Quedan solo <b>${bankHouses()}</b> casas en el banco. Quedarse en 4 casas (sin hotel) bloquea a los rivales.`);
  }
  // Le falta una para monopolio
  for (const g of streetGroups) {
    const gp = groupProps(g), mineN = countOwned(pid, g);
    if (mineN !== gp.length - 1 || mineN < 1) continue;
    const miss = gp.find(p => S.props[p.id].owner !== pid);
    const o = S.props[miss.id].owner;
    if (!o) add(60, 'good', '🎯', `Le falta <b>${miss.name}</b> para el monopolio ${GROUPS[g].name}. ¡Si cae ahí, cómprela sin dudar!`);
    else {
      const offer = findOffer(pid, o);
      add(55, 'info', '🤝', `<b>${pname(o)}</b> tiene ${miss.name}. Negocie para completar ${GROUPS[g].name}${offer ? `: ofrézcale <b>${offer.short}</b>, que a él le sirve` : ` (ofrezca ~${fmt(Math.round(miss.price * 1.5 / 10) * 10)})`}.`);
    }
  }
  // Bloquear rivales
  for (const opp of others) {
    for (const g of streetGroups) {
      const gp = groupProps(g);
      if (countOwned(opp.id, g) !== gp.length - 1) continue;
      const miss = gp.find(p => S.props[p.id].owner !== opp.id);
      const mo = S.props[miss.id].owner;
      if (!mo) add(52, 'info', '🛡️', `Bloquee a <b>${esc(opp.name)}</b>: le falta ${miss.name} para el monopolio ${GROUPS[g].name}. Si cae ahí, cómprela.`);
      else if (mo === pid) add(48, 'info', '🔑', `<b>${miss.short}</b> es clave para ${esc(opp.name)}. No la venda barata: pida al menos ${fmt(miss.price * 2)} o un cambio que le dé un monopolio.`);
    }
  }
  // Levantar hipotecas
  const morts = mine.filter(p => S.props[p.id].mortgaged)
    .sort((a, b) => (ownsGroup(pid, b.group) - ownsGroup(pid, a.group)) || (b.price - a.price));
  const um = morts.find(p => pl.cash - unmortgageCost(p.id) >= reserve + 100);
  if (um && !tips.some(t => t.icon === '🔓')) add(40, 'info', '🔓', `Levante la hipoteca de <b>${um.name}</b> por ${fmt(unmortgageCost(um.id))} para volver a cobrar renta.`);
  // Ferrocarriles
  if (countOwned(pid, 'rail') === 3) {
    const r4 = groupProps('rail').find(p => S.props[p.id].owner !== pid);
    const o = S.props[r4.id].owner;
    add(42, 'info', '🚂', `Tiene 3 ferrocarriles: el 4º sube la renta de $100 a <b>$200</b> en cada uno. ${o ? `Negocie ${r4.short} con ${pname(o)}.` : `Si cae en ${r4.short}, cómprelo.`}`);
  }
  // Inicio de partida
  if (mine.length < 3 && pl.cash >= 400 && unownedCount > 12) {
    add(30, 'info', '🛒', 'Inicio de partida: compre todo lo que pueda. <b>Naranjas</b> y <b>rojas</b> son las casillas más visitadas.');
  }
  if (pl.cash > 1000 && unownedCount === 0 && !streetGroups.some(g => ownsGroup(pid, g))) {
    add(35, 'info', '💼', 'Tiene mucho efectivo sin producir. Negocie un monopolio aunque pague de más: sin casas no se gana.');
  }
  // Posición
  const rk = ranking();
  if (rk.length > 1 && S.log.length > 2) {
    if (rk[0].p.id === pid && rk[0].w > rk[1].w) add(10, 'good', '🏆', `Va primero en patrimonio (${fmt(rk[0].w - rk[1].w)} sobre el 2º). Juegue seguro y siga construyendo.`);
    else if (rk[rk.length - 1].p.id === pid) add(12, 'info', '📉', 'Va último: busque intercambios que le den un monopolio, aunque sea barato (marrones o celestes).');
  }
  if (!tips.length) add(0, 'good', '✅', `Todo en orden. Mantenga una reserva de ~${fmt(reserve)} para rentas.`);
  return tips.sort((a, b) => b.prio - a.prio);
}
function findOffer(pid, other) {
  const cands = ownedBy(pid).filter(p => p.type === 'street' && countOwned(pid, p.group) === 1 && countOwned(other, p.group) >= 1 && !S.props[p.id].mortgaged);
  cands.sort((a, b) => (countOwned(other, b.group) - countOwned(other, a.group)) || (b.price - a.price));
  return cands[0] || null;
}
function buyAdvice(pid, id, price) {
  const p = PROP[id], pl = player(pid), out = [];
  if (!p || !pl) return out;
  const after = pl.cash - price, gp = groupProps(p.group), mineN = countOwned(pid, p.group);
  if (after < 0) out.push(['danger', '🚫', `No le alcanza: le faltan ${fmt(-after)}. Puede hipotecar algo antes, o el banco la subasta.`]);
  if (p.type === 'street' && mineN === gp.length - 1) out.push(['good', '👑', `¡Completa el monopolio ${GROUPS[p.group].name}! Renta doble y podrá construir. Muy recomendada.`]);
  else if (p.type === 'street' && mineN >= 1) out.push(['good', '🎯', `Ya tiene ${mineN} del grupo ${GROUPS[p.group].name}: se acerca al monopolio.`]);
  if (p.type === 'rail' && mineN >= 1) out.push(['good', '🚂', `Tendría ${mineN + 1} ferrocarriles: renta ${fmt(25 * 2 ** mineN)} en cada uno.`]);
  for (const opp of activePlayers()) {
    if (opp.id === pid || p.type !== 'street') continue;
    if (countOwned(opp.id, p.group) === gp.length - 1) out.push(['good', '🛡️', `Bloquea a ${esc(opp.name)}, que la necesita para su monopolio.`]);
  }
  if (['orange', 'red'].includes(p.group)) out.push(['info', '🔥', 'Grupo de los más visitados del tablero: excelente inversión.']);
  if (p.type === 'util' && mineN === 0) out.push(['info', '💡', 'Los servicios rinden poco; cómprela solo si le sobra dinero.']);
  const exp = exposure(pid);
  if (after >= 0 && exp.rent > after) out.push(['warn', '⚠️', `Quedaría con ${fmt(after)} y la renta más alta en juego es ${fmt(exp.rent)}.`]);
  if (price > p.price) out.push(['warn', '💸', `Paga ${fmt(price - p.price)} por encima del valor impreso.`]);
  if (price < p.price && price > 0) out.push(['good', '🏷️', `¡Ganga! ${fmt(p.price - price)} por debajo del valor.`]);
  if (!out.length) out.push(['info', 'ℹ️', `Compra razonable. Le quedarían ${fmt(after)}.`]);
  return out;
}
function adviceHTML(list) {
  return `<div class="advice">${list.map(([lv, ic, t]) => `<div class="tip ${lv}"><span class="ic">${ic}</span><div>${t}</div></div>`).join('')}</div>`;
}

// ---------- Transacciones ----------
function commit(text, mutate, deltas = {}, kind = '') {
  undoStack.push(JSON.stringify(S));
  if (undoStack.length > 40) undoStack.shift();
  mutate();
  S.log.unshift({ t: Date.now(), text });
  if (S.log.length > 300) S.log.length = 300;
  save(); render(); animate(deltas);
  if (text) toast(text, kind);
}
/** Mueve dinero entre jugadores, banco o Parada Libre; devuelve deltas */
function move(from, to, amount, deltas) {
  if (from === to || !amount) return;
  if (from === 'pot') S.pot -= amount; else if (from !== 'bank') { player(from).cash -= amount; deltas[from] = (deltas[from] || 0) - amount; }
  if (to === 'pot') S.pot += amount; else if (to !== 'bank') { player(to).cash += amount; deltas[to] = (deltas[to] || 0) + amount; }
}
const taxDest = () => S.settings.parking ? 'pot' : 'bank';

function undo() {
  if (!undoStack.length) return;
  S = JSON.parse(undoStack.pop());
  save(); render(); if (sheet) renderSheet();
  toast('↩️ Última acción deshecha');
}

// ---------- Animaciones y avisos ----------
function animate(deltas) {
  for (const [pid, d] of Object.entries(deltas)) {
    if (!d) continue;
    const card = document.querySelector(`.pcard[data-pid="${pid}"]`);
    if (!card) continue;
    card.classList.remove('flash-up', 'flash-down'); void card.offsetWidth;
    card.classList.add(d > 0 ? 'flash-up' : 'flash-down');
    const f = document.createElement('span');
    f.className = 'float ' + (d > 0 ? 'up' : 'down');
    f.textContent = (d > 0 ? '+' : '') + fmt(d);
    card.appendChild(f);
    setTimeout(() => f.remove(), 1500);
  }
  if (navigator.vibrate) try { navigator.vibrate(25); } catch { }
}
function toast(text, kind = '') {
  const el = document.createElement('div');
  el.className = 'toast ' + kind;
  el.innerHTML = text;
  $('#toasts').appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

// =========================================================
//                       RENDER
// =========================================================
function render() {
  const app = $('#app');
  if (S.phase === 'setup') { app.innerHTML = renderSetup(); return; }
  app.innerHTML = renderGame();
}

function renderSetup() {
  const taken = new Set(S.players.map(p => p.token));
  return `
  <div class="setup">
    <div class="setup-hero">
      <div class="logo"><b>MONOPOLY</b><small>BANCO</small></div>
      <p>El banquero digital: cuentas claras, partidas sin peleas.</p>
    </div>

    <div class="panel">
      <h3>👥 Jugadores <span class="count">${S.players.length}/8</span></h3>
      <div class="setup-players">
        ${S.players.length ? S.players.map(p => `
          <div class="setup-player" style="--accent:${p.color}">
            ${tokenHTML(p.token, 'sm')}
            <div><div class="nm">${esc(p.name)}</div><div class="tk">${TOKEN[p.token].name}</div></div>
            <button class="icon-btn" data-action="remove-player" data-pid="${p.id}" aria-label="Quitar">🗑️</button>
          </div>`).join('') : `<div class="empty">Agrega al menos 2 jugadores para comenzar</div>`}
      </div>
    </div>

    ${S.players.length < 8 ? `
    <div class="panel">
      <h3>➕ Nuevo jugador</h3>
      <label class="field"><span>Nombre</span>
        <input class="input" id="new-name" data-bind-setup="name" maxlength="16" placeholder="Ej: Camila" value="${esc(setupDraft.name)}" autocomplete="off" />
      </label>
      <div class="field"><span>Elige su ficha</span>
        <div class="token-grid">
          ${TOKENS.map(t => `
            <button class="token-opt ${setupDraft.token === t.id ? 'sel' : ''} ${taken.has(t.id) ? 'taken' : ''}" data-action="pick-token" data-token="${t.id}">
              ${tokenHTML(t.id, 'sm')}<span class="lbl">${t.name}</span>
            </button>`).join('')}
        </div>
      </div>
      <button class="btn blue block" data-action="add-player">Agregar jugador</button>
    </div>` : ''}

    <div class="panel">
      <h3>⚙️ Reglas de la partida</h3>
      <div class="row2">
        <label class="field"><span>Dinero inicial</span>
          <input class="input money" type="number" inputmode="numeric" data-bind-setting="start" value="${S.settings.start}" />
        </label>
        <label class="field"><span>Pasar por Salida</span>
          <input class="input money" type="number" inputmode="numeric" data-bind-setting="salary" value="${S.settings.salary}" />
        </label>
      </div>
      <label class="switch"><span>🅿️ Impuestos y multas van al pozo de <b>Parada Libre</b> (regla de la casa)</span>
        <input type="checkbox" data-bind-setting="parking" ${S.settings.parking ? 'checked' : ''} /></label>
    </div>
  </div>
  <div class="sticky-cta"><button class="btn primary big block" data-action="start-game" ${S.players.length < 2 ? 'disabled' : ''}>🎲 Comenzar partida</button></div>`;
}

function renderGame() {
  const rk = ranking();
  const rankOf = Object.fromEntries(rk.map((r, i) => [r.p.id, i + 1]));
  const alive = activePlayers();
  const ordered = [...S.players].sort((a, b) => (a.bankrupt - b.bankrupt));
  return `
  <header class="topbar">
    <div class="logo sm"><b>MONOPOLY</b><small>BANCO</small></div>
    <div class="spacer"></div>
    <button class="icon-btn" data-action="undo" ${undoStack.length ? '' : 'disabled'} aria-label="Deshacer">↩️</button>
    <button class="icon-btn" data-action="open" data-sheet="history" aria-label="Historial">📜</button>
    <button class="icon-btn" data-action="open" data-sheet="more" aria-label="Menú">☰</button>
  </header>
  <div class="bankbar">
    <span class="pill">🏠 ${bankHouses()}/${TOTAL_HOUSES} casas</span>
    <span class="pill">🏨 ${bankHotels()}/${TOTAL_HOTELS} hoteles</span>
    <span class="pill">📋 ${PROPS.filter(p => !S.props[p.id].owner).length} propiedades libres</span>
    ${S.settings.parking ? `<button class="pill pot" data-action="open" data-sheet="pot">🅿️ Pozo ${fmt(S.pot)}</button>` : ''}
  </div>
  ${alive.length === 1 && S.players.length > 1 ? `
  <div class="winner"><div class="panel">${tokenHTML(alive[0].token, 'lg')}<h3>🏆 ¡${esc(alive[0].name)} gana la partida!</h3>
  <button class="btn primary" data-action="new-game">Nueva partida</button></div></div>` : ''}
  <main class="cards">
    ${ordered.map(p => renderCard(p, rankOf[p.id], rk.length)).join('')}
  </main>
  <nav class="bottomnav">
    <button class="navbtn" data-action="open" data-sheet="buy"><span class="ni">🏠</span>Comprar</button>
    <button class="navbtn" data-action="open" data-sheet="go"><span class="ni">💵</span>Salida</button>
    <button class="navbtn main" data-action="open" data-sheet="rent"><span class="ni">💸</span>Renta</button>
    <button class="navbtn" data-action="open" data-sheet="transfer"><span class="ni">⇄</span>Pagar</button>
    <button class="navbtn" data-action="open" data-sheet="board"><span class="ni">🗺️</span>Tablero</button>
  </nav>`;
}

function propsStrip(pid, clickable = true) {
  const mine = ownedBy(pid);
  if (!mine.length) return `<div class="none">Aún sin propiedades</div>`;
  return GROUP_ORDER.map(g => {
    const gp = groupProps(g).filter(p => S.props[p.id].owner === pid);
    if (!gp.length) return '';
    const mono = ownsGroup(pid, g);
    return `<div class="pgroup ${mono ? 'mono' : ''}">${gp.map(p => {
      const s = S.props[p.id];
      return `<button class="mini ${s.mortgaged ? 'mort' : ''}" style="--c:${GROUPS[g].color}" ${clickable ? `data-action="prop" data-prop="${p.id}"` : ''}>
        <i></i><span>${p.short}</span><em>${s.mortgaged ? 'HIPOT.' : houseIcons(s.houses) || (p.type === 'rail' ? '🚂' : p.type === 'util' ? (p.id === 'agua' ? '🚰' : '💡') : '')}</em></button>`;
    }).join('')}</div>`;
  }).join('');
}

function renderCard(p, rank, n) {
  const w = netWorth(p.id);
  const tips = p.bankrupt ? [] : tipsFor(p.id);
  const show = tips.slice(0, 2);
  return `
  <article class="pcard ${p.bankrupt ? 'bankrupt' : ''}" data-pid="${p.id}" style="--accent:${p.color}">
    <button class="pcard-head" data-action="player" data-pid="${p.id}">
      ${tokenHTML(p.token, 'lg')}
      <div class="pinfo">
        <div class="pname">${esc(p.name)}</div>
        <div class="psub">${p.bankrupt ? '<span class="rank">EN BANCARROTA</span>' : `<span class="rank ${rank === 1 ? 'r1' : ''}">#${rank}</span>`} ${TOKEN[p.token].name}</div>
      </div>
      <div class="pmoney">
        <div class="cash ${p.cash < 0 ? 'neg' : ''}">${fmt(p.cash)}</div>
        <div class="worth">Patrimonio <b>${fmt(w)}</b></div>
        ${p.cash < 0 ? '<span class="debt-tag">DEBE DINERO</span>' : ''}
      </div>
    </button>
    <div class="pprops">${propsStrip(p.id)}</div>
    ${show.length ? `<div class="ptips">
      ${show.map(t => `<div class="tip ${t.level}"><span class="ic">${t.icon}</span><div>${t.html}</div></div>`).join('')}
      ${tips.length > 2 ? `<button class="more-tips" data-action="player" data-pid="${p.id}">Ver ${tips.length - 2} consejo${tips.length - 2 > 1 ? 's' : ''} más →</button>` : ''}
    </div>` : ''}
  </article>`;
}

// ---------- Componentes de hoja ----------
function playerChips(key, opts = {}) {
  const { exclude = [], bank = false, pot = false, showCash = true } = opts;
  const cur = sheet[key];
  let html = '';
  if (bank) html += `<button class="chip bank ${cur === 'bank' ? 'sel' : ''}" data-action="sel" data-key="${key}" data-val="bank">${bankToken('sm')}Banco</button>`;
  if (pot && S.settings.parking) html += `<button class="chip ${cur === 'pot' ? 'sel' : ''}" data-action="sel" data-key="${key}" data-val="pot">${potToken('sm')}Parada Libre <small>${fmt(S.pot)}</small></button>`;
  html += activePlayers().filter(p => !exclude.includes(p.id)).map(p => `
    <button class="chip ${cur === p.id ? 'sel' : ''}" data-action="sel" data-key="${key}" data-val="${p.id}">
      ${tokenHTML(p.token, 'sm')}<span>${esc(p.name)}${showCash ? `<br><small>${fmt(p.cash)}</small>` : ''}</span>
    </button>`).join('');
  return `<div class="chips">${html}</div>`;
}
function propList(filter, key, extra) {
  return `<div class="plist">${GROUP_ORDER.map(g => {
    const items = groupProps(g).filter(filter);
    if (!items.length) return '';
    return `<div><div class="pl-group-title" style="--c:${GROUPS[g].color}"><i></i>${GROUPS[g].name}</div>
      <div class="pl-items">${items.map(p => `
        <button class="prow ${sheet[key] === p.id ? 'sel' : ''} ${S.props[p.id].mortgaged ? 'dim' : ''}" style="--c:${GROUPS[g].color}" data-action="sel" data-key="${key}" data-val="${p.id}">
          <i></i><div class="pn">${p.name}${extra ? `<small>${extra(p)}</small>` : ''}</div>
        </button>`).join('')}</div></div>`;
  }).join('') || '<div class="empty">No hay propiedades aquí</div>'}</div>`;
}
const BILLS = [[1, '#ffffff'], [5, '#F8C8DC'], [10, '#FFF3A0'], [20, '#BDE8B5'], [50, '#A9D8F5'], [100, '#F5E1B8'], [500, '#F9C38B']];
function billsHTML(key) {
  return `<div class="bills">${BILLS.map(([v, c]) => `<button class="bill" style="--bc:${c}" data-action="add-amt" data-key="${key}" data-amt="${v}">+${v}</button>`).join('')}
    <button class="bill reset" data-action="add-amt" data-key="${key}" data-amt="0">Borrar</button></div>`;
}
function flowHTML(from, to, amount, why) {
  return `<div class="flow">
      <div class="who">${whoToken(from, 'sm')}${pname(from)}</div>
      <div class="arrow">➜</div>
      <div class="who">${whoToken(to, 'sm')}${pname(to)}</div>
    </div>
    <div class="amount">${fmt(amount)}</div>
    ${why ? `<div class="why">${why}</div>` : ''}`;
}
function afterHTML(from, to, amount) {
  const parts = [];
  for (const [id, d] of [[from, -amount], [to, amount]]) {
    if (id === 'bank') continue;
    const cur = id === 'pot' ? S.pot : player(id).cash;
    parts.push(`<span>${pname(id)}: <b style="color:${cur + d < 0 ? 'var(--rojo)' : 'inherit'}">${fmt(cur + d)}</b></span>`);
  }
  return parts.length ? `<div class="after">${parts.join('')}</div>` : '';
}

// =========================================================
//                 HOJAS (pantallas modales)
// =========================================================
const SHEETS = {};

// ----- Comprar -----
SHEETS.buy = {
  title: '🏠 Comprar propiedad',
  render() {
    return `
    <div class="sec"><div class="sec-title">1. ¿Quién compra?</div>${playerChips('buyer')}</div>
    <div class="sec"><div class="sec-title">2. Propiedad</div>${propList(p => !S.props[p.id].owner, 'prop', p => fmt(p.price))}</div>
    <div class="sec"><div class="sec-title">3. Precio <span>(cámbialo si fue subasta)</span></div>
      <input class="input money" type="number" inputmode="numeric" data-bind="price" value="${sheet.price ?? ''}" placeholder="$0" />
      ${billsHTML('price')}
    </div>
    <div id="sheet-live">${this.live()}</div>`;
  },
  live() {
    const { buyer, prop } = sheet, price = Number(sheet.price) || 0;
    if (!buyer || !prop) return `<div class="note">Elige comprador y propiedad.</div>`;
    const pl = player(buyer);
    return `<div class="summary">${flowHTML(buyer, 'bank', price, PROP[prop].name)}${afterHTML(buyer, 'bank', price)}</div>
      ${adviceHTML(buyAdvice(buyer, prop, price))}
      <button class="btn green big block" data-action="confirm-buy" ${pl.cash < price ? 'disabled' : ''}>✅ Confirmar compra</button>`;
  },
};

// ----- Renta -----
SHEETS.rent = {
  title: '💸 Cobrar renta',
  render() {
    const owner = sheet.prop ? S.props[sheet.prop].owner : null;
    const p = sheet.prop ? PROP[sheet.prop] : null;
    return `
    <div class="sec"><div class="sec-title">1. ¿En qué propiedad cayó?</div>
      ${propList(x => !!S.props[x.id].owner, 'prop', x => {
        const s = S.props[x.id];
        return `${player(s.owner).name} · ${s.mortgaged ? 'hipotecada' : x.type === 'util' ? 'según dados' : fmt(rentOf(x.id))}`;
      })}
    </div>
    ${p && p.type === 'util' ? `<div class="sec"><div class="sec-title">Suma de los dados</div>
      <div class="chips">${[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(d => `<button class="chip ${Number(sheet.dice) === d ? 'sel' : ''}" style="padding:8px 13px" data-action="sel" data-key="dice" data-val="${d}">${d}</button>`).join('')}</div></div>` : ''}
    ${p && p.type !== 'street' ? `<label class="switch"><span>🃏 Carta de Suerte (${p.type === 'rail' ? 'paga el doble' : 'paga 10× los dados'})</span>
      <input type="checkbox" data-action="toggle-card" ${sheet.card ? 'checked' : ''} /></label>` : ''}
    ${p ? `<div class="sec"><div class="sec-title">2. ¿Quién cayó?</div>${playerChips('payer', { exclude: [owner] })}</div>` : ''}
    <div id="sheet-live">${this.live()}</div>`;
  },
  live() {
    const { prop, payer } = sheet;
    if (!prop) return `<div class="note">Toca la propiedad donde cayó el jugador.</div>`;
    const p = PROP[prop], owner = S.props[prop].owner;
    if (p.type === 'util' && !sheet.dice) return `<div class="note">Indica la suma de los dados.</div>`;
    if (!payer) return `<div class="note">Elige quién cayó.</div>`;
    const amount = rentOf(prop, sheet.dice, sheet.card);
    const pl = player(payer);
    let warn = '';
    if (amount > pl.cash) {
      const liq = liquidity(payer);
      warn = amount > liq
        ? adviceHTML([['danger', '💀', `${esc(pl.name)} no puede pagar ni liquidando todo (máx. ${fmt(liq)}). Quedará en deuda: deberá negociar o declararse en bancarrota.`]])
        : adviceHTML([['warn', '⚠️', `A ${esc(pl.name)} le faltan ${fmt(amount - pl.cash)}. Quedará en negativo; plan: ${liquidationPlan(payer, amount - pl.cash).join(' → ')}.`]]);
    }
    return `<div class="summary">${flowHTML(payer, owner, amount, `${p.name} · ${rentWhy(prop, sheet.dice, sheet.card)}`)}${afterHTML(payer, owner, amount)}</div>
      ${warn}
      <button class="btn primary big block" data-action="confirm-rent" ${amount <= 0 ? 'disabled' : ''}>💸 Cobrar ${fmt(amount)}</button>`;
  },
};

// ----- Salida -----
SHEETS.go = {
  title: '💵 Pasó por la Salida',
  render() {
    return `<p class="note">Toca al jugador para darle ${fmt(S.settings.salary)} al instante.</p>
    <div class="plist" style="gap:10px">${activePlayers().map(p => `
      <button class="btn block big" style="justify-content:flex-start" data-action="go" data-pid="${p.id}">
        ${tokenHTML(p.token, 'sm')}<span style="flex:1;text-align:left">${esc(p.name)}</span><span style="color:var(--verde-dinero)">+${fmt(S.settings.salary)}</span>
      </button>`).join('')}</div>`;
  },
};

// ----- Pagar / transferir -----
SHEETS.transfer = {
  title: '⇄ Pagar / Cobrar',
  render() {
    return `
    <div class="sec"><div class="sec-title">Paga</div>${playerChips('from', { bank: true, pot: true, exclude: [] })}</div>
    <div class="sec"><div class="sec-title">Recibe</div>${playerChips('to', { bank: true, pot: true })}</div>
    <div class="sec"><div class="sec-title">Monto</div>
      <input class="input money" type="number" inputmode="numeric" data-bind="amount" value="${sheet.amount ?? ''}" placeholder="$0" />
      ${billsHTML('amount')}
    </div>
    <label class="field"><span>Concepto (opcional)</span><input class="input" data-bind="note" value="${esc(sheet.note || '')}" placeholder="Ej: Multa, intercambio, carta…" /></label>
    <div id="sheet-live">${this.live()}</div>`;
  },
  live() {
    const { from, to } = sheet, amount = Number(sheet.amount) || 0;
    if (!from || !to) return `<div class="note">Elige quién paga y quién recibe.</div>`;
    if (from === to) return `<div class="note">Deben ser distintos.</div>`;
    let warn = '';
    if (from !== 'bank' && from !== 'pot' && amount > player(from).cash) warn = adviceHTML([['warn', '⚠️', `${pname(from)} quedará en negativo (${fmt(player(from).cash - amount)}).`]]);
    if (from === 'pot' && amount > S.pot) warn = adviceHTML([['danger', '🚫', 'El pozo no tiene tanto dinero.']]);
    return `<div class="summary">${flowHTML(from, to, amount, esc(sheet.note || ''))}${afterHTML(from, to, amount)}</div>${warn}
      <button class="btn blue big block" data-action="confirm-transfer" ${amount <= 0 || (from === 'pot' && amount > S.pot) ? 'disabled' : ''}>Confirmar ${fmt(amount)}</button>`;
  },
};

// ----- Menú Más -----
SHEETS.more = {
  title: '☰ Más acciones',
  render() {
    return `<div class="tiles">
      <button class="tile" data-action="open" data-sheet="tax"><span class="ti">🧾</span>Impuestos</button>
      <button class="tile" data-action="open" data-sheet="jail"><span class="ti">🚔</span>Cárcel</button>
      <button class="tile" data-action="open" data-sheet="cards"><span class="ti">🃏</span>Cartas</button>
      <button class="tile" data-action="open" data-sheet="ranking"><span class="ti">🏆</span>Ranking</button>
      <button class="tile" data-action="open" data-sheet="history"><span class="ti">📜</span>Historial</button>
      <button class="tile" data-action="open" data-sheet="board"><span class="ti">🗺️</span>Tablero</button>
      ${S.settings.parking ? `<button class="tile" data-action="open" data-sheet="pot"><span class="ti">🅿️</span>Pozo ${fmt(S.pot)}</button>` : ''}
      <button class="tile" data-action="open" data-sheet="settings"><span class="ti">⚙️</span>Ajustes</button>
      <button class="tile red" data-action="new-game"><span class="ti">🔄</span>Nueva partida</button>
    </div>`;
  },
};

// ----- Impuestos -----
SHEETS.tax = {
  title: '🧾 Impuestos',
  render() {
    const pid = sheet.pid;
    let body = '';
    if (pid) {
      const w = netWorth(pid), pct = Math.round(w * 0.1);
      const best = pct < 200 ? 'pct' : 'fixed';
      body = `
      <div class="sec"><div class="sec-title">Impuesto sobre la renta</div>
        ${adviceHTML([['good', '💡', `Le conviene pagar <b>${best === 'pct' ? `el 10% (${fmt(pct)})` : '$200 fijo'}</b>. Su patrimonio es ${fmt(w)}.`]])}
        <div class="row2">
          <button class="btn ${best === 'fixed' ? 'green' : ''} block" data-action="tax" data-amt="200" data-label="Impuesto sobre la renta">$200 fijo</button>
          <button class="btn ${best === 'pct' ? 'green' : ''} block" data-action="tax" data-amt="${pct}" data-label="Impuesto sobre la renta (10%)">10% · ${fmt(pct)}</button>
        </div>
      </div>
      <div class="sec"><div class="sec-title">Impuesto de lujo</div>
        <button class="btn block" data-action="tax" data-amt="100" data-label="Impuesto de lujo">💎 Pagar $100</button>
      </div>
      <p class="note">El dinero va ${S.settings.parking ? 'al pozo de Parada Libre' : 'al banco'}.</p>`;
    }
    return `<div class="sec"><div class="sec-title">¿Quién paga?</div>${playerChips('pid')}</div>${body}`;
  },
};

// ----- Cárcel -----
SHEETS.jail = {
  title: '🚔 Cárcel',
  render() {
    const danger = PROPS.filter(p => S.props[p.id].houses >= 3).length;
    const tip = danger >= 3
      ? ['warn', '🧠', `Hay ${danger} propiedades con 3+ casas en el tablero: conviene <b>quedarse en la cárcel</b> (no paga rentas mientras tanto).`]
      : ['good', '🧠', 'Aún hay propiedades por comprar: conviene <b>pagar y salir rápido</b> para seguir comprando.'];
    return `${adviceHTML([tip])}
      <div class="sec"><div class="sec-title">¿Quién paga la fianza de $50?</div>${playerChips('pid')}</div>
      <button class="btn primary big block" data-action="jail" ${sheet.pid ? '' : 'disabled'}>🔓 Pagar $50 y salir</button>`;
  },
};

// ----- Cartas (Suerte / Arca comunal) -----
SHEETS.cards = {
  title: '🃏 Cartas',
  render() {
    const pid = sheet.pid;
    let body = '';
    if (pid) {
      const h = ownedBy(pid).reduce((a, p) => a + (S.props[p.id].houses < 5 ? S.props[p.id].houses : 0), 0);
      const ht = ownedBy(pid).filter(p => S.props[p.id].houses === 5).length;
      const n = activePlayers().length - 1;
      body = `
      <div class="sec"><div class="sec-title">Con todos los jugadores (${n})</div>
        <div class="row2">
          <button class="btn green block" data-action="card-all" data-mode="collect" data-amt="10">🎂 Cobrar $10 a c/u<br><small>+${fmt(10 * n)}</small></button>
          <button class="btn block" data-action="card-all" data-mode="pay" data-amt="50">👔 Pagar $50 a c/u<br><small>-${fmt(50 * n)}</small></button>
        </div>
        <div class="row2" style="margin-top:8px">
          <input class="input money" type="number" inputmode="numeric" data-bind="amtAll" value="${sheet.amtAll ?? ''}" placeholder="Otro monto" />
          <div class="row2"><button class="btn green" data-action="card-all" data-mode="collect">Cobrar</button><button class="btn" data-action="card-all" data-mode="pay">Pagar</button></div>
        </div>
      </div>
      <div class="sec"><div class="sec-title">Reparaciones (tiene ${h} 🏠 y ${ht} 🏨)</div>
        <div class="row2">
          <button class="btn block" data-action="repairs" data-h="25" data-ht="100">🔧 Generales<br><small>$25/casa · $100/hotel = ${fmt(h * 25 + ht * 100)}</small></button>
          <button class="btn block" data-action="repairs" data-h="40" data-ht="115">🚧 Calles<br><small>$40/casa · $115/hotel = ${fmt(h * 40 + ht * 115)}</small></button>
        </div>
      </div>
      <div class="sec"><div class="sec-title">Del banco</div>
        <div class="row2">
          <button class="btn green block" data-action="bank-amt" data-amt="200">💰 Error bancario +$200</button>
          <button class="btn green block" data-action="bank-amt" data-amt="100">🎁 Herencia +$100</button>
          <button class="btn green block" data-action="bank-amt" data-amt="50">📈 Venta acciones +$50</button>
          <button class="btn block" data-action="bank-amt" data-amt="-100">🏥 Hospital -$100</button>
          <button class="btn block" data-action="bank-amt" data-amt="-50">👨‍⚕️ Médico -$50</button>
          <button class="btn block" data-action="bank-amt" data-amt="-15">🚓 Multa -$15</button>
        </div>
      </div>`;
    }
    return `<div class="sec"><div class="sec-title">¿Quién sacó la carta?</div>${playerChips('pid')}</div>${body}`;
  },
};

// ----- Pozo de Parada Libre -----
SHEETS.pot = {
  title: '🅿️ Parada Libre',
  render() {
    return `<div class="summary"><div class="amount">${fmt(S.pot)}</div><div class="why">acumulado en el pozo</div></div>
    <div class="sec"><div class="sec-title">¿Quién cayó en Parada Libre?</div>${playerChips('pid')}</div>
    <button class="btn green big block" data-action="collect-pot" ${sheet.pid && S.pot > 0 ? '' : 'disabled'}>Cobrar el pozo</button>`;
  },
};

// ----- Tablero -----
SHEETS.board = {
  title: '🗺️ Tablero',
  render() {
    return `<p class="note">Toca una propiedad para ver su título, construir casas, hipotecar, vender o cobrar renta.</p>
    <div class="plist">${GROUP_ORDER.map(g => `
      <div><div class="pl-group-title" style="--c:${GROUPS[g].color}"><i></i>${GROUPS[g].name}</div>
      <div class="pl-items">${groupProps(g).map(p => {
        const s = S.props[p.id];
        return `<button class="prow ${s.mortgaged ? 'dim' : ''}" style="--c:${GROUPS[g].color}" data-action="prop" data-prop="${p.id}">
          <i></i><div class="pn">${p.name}<small>${s.owner ? `${esc(player(s.owner).name)} ${s.mortgaged ? '· hipotecada' : houseIcons(s.houses)}` : `Libre · ${fmt(p.price)}`}</small></div>
          ${s.owner ? tokenHTML(player(s.owner).token, 'xs') : ''}
        </button>`;
      }).join('')}</div></div>`).join('')}</div>`;
  },
};

// ----- Propiedad (título) -----
SHEETS.prop = {
  title() { return PROP[sheet.prop].name; },
  render() {
    const p = PROP[sheet.prop], s = S.props[p.id], G = GROUPS[p.group];
    const lvl = s.owner ? (p.type === 'street' ? s.houses : countOwned(s.owner, p.group)) : -1;
    let rows = '';
    if (p.type === 'street') {
      const labels = ['Renta', 'Con 1 casa', 'Con 2 casas', 'Con 3 casas', 'Con 4 casas', 'Con HOTEL'];
      const mono = s.owner && ownsGroup(s.owner, p.group) && s.houses === 0;
      rows = p.rent.map((r, i) => `<tr class="${lvl === i && !s.mortgaged ? 'on' : ''}"><td>${labels[i]}${i === 0 && mono ? ' (monopolio ×2)' : ''}</td><td>${fmt(i === 0 && mono ? r * 2 : r)}</td></tr>`).join('');
    } else if (p.type === 'rail') {
      rows = [1, 2, 3, 4].map(n => `<tr class="${lvl === n && !s.mortgaged ? 'on' : ''}"><td>Con ${n} ferrocarril${n > 1 ? 'es' : ''}</td><td>${fmt(25 * 2 ** (n - 1))}</td></tr>`).join('');
    } else {
      rows = `<tr class="${lvl === 1 && !s.mortgaged ? 'on' : ''}"><td>Con 1 servicio</td><td>4× dados</td></tr><tr class="${lvl === 2 && !s.mortgaged ? 'on' : ''}"><td>Con 2 servicios</td><td>10× dados</td></tr>`;
    }
    const icon = p.type === 'rail' ? '🚂' : p.type === 'util' ? (p.id === 'agua' ? '🚰' : '💡') : '';
    const deed = `
      <div class="deed">
        <div class="deed-head" style="--c:${p.type === 'street' ? G.color : '#fff'};--tc:${p.type === 'street' ? (G.dark ? '#111' : '#fff') : '#111'}">
          ${icon ? `<div class="ico">${icon}</div>` : '<small>TÍTULO DE PROPIEDAD</small>'}
          <h3>${p.name}</h3>
        </div>
        <table>${rows}</table>
        <div class="foot">
          Precio ${fmt(p.price)} · Hipoteca ${fmt(mortgageValue(p.id))}<br>
          ${p.type === 'street' ? `Casa ${fmt(G.house)} c/u · Hotel ${fmt(G.house)} + 4 casas` : ''}
        </div>
        ${s.mortgaged ? '<div class="stamp">HIPOTECADA</div>' : ''}
      </div>`;

    if (!s.owner) {
      return `${deed}
        <div class="owner-line">🏦 Libre — propiedad del banco</div>
        <div class="sec"><div class="sec-title">Vender a</div>${playerChips('buyer')}</div>
        <div class="sec"><div class="sec-title">Precio</div>
          <input class="input money" type="number" inputmode="numeric" data-bind="price" value="${sheet.price ?? p.price}" />${billsHTML('price')}</div>
        <div id="sheet-live">${this.live()}</div>`;
    }

    const o = player(s.owner);
    const bc = buildCheck(p.id), sc = sellCheck(p.id), mc = mortgageCheck(p.id);
    const housesBlock = p.type === 'street' ? `
      <div class="sec"><div class="sec-title">Construcciones <span>Banco: ${bankHouses()} 🏠 · ${bankHotels()} 🏨</span></div>
        <div class="houses-ctrl">
          <button class="btn" data-action="house-sell" ${sc.ok ? '' : 'disabled'}>➖ Vender<small>+${fmt(G.house / 2)}</small></button>
          <div class="houses-view">${houseIcons(s.houses) || '—'}<small>${s.houses === 5 ? 'HOTEL' : `${s.houses} casa${s.houses !== 1 ? 's' : ''}`}</small></div>
          <button class="btn green" data-action="house-add" ${bc.ok ? '' : 'disabled'}>➕ ${s.houses === 4 ? 'Hotel' : 'Casa'}<small>-${fmt(G.house)}</small></button>
        </div>
        ${!bc.ok && s.houses < 5 ? `<div class="reason">${bc.reason}</div>` : ''}
        ${!sc.ok && sc.reason ? `<div class="reason">${sc.reason}</div>` : ''}
      </div>` : '';

    return `${deed}
      <div class="owner-line">${tokenHTML(o.token, 'sm')} Dueño: ${esc(o.name)} · <span style="color:var(--verde-dinero)">${fmt(o.cash)}</span></div>
      ${housesBlock}
      <div class="sec"><div class="sec-title">Acciones</div>
        <div class="row2">
          <button class="btn primary block" data-action="rent-from-prop" ${s.mortgaged ? 'disabled' : ''}>💸 Cobrar renta</button>
          ${mc.unm
            ? `<button class="btn blue block" data-action="unmortgage" ${mc.ok ? '' : 'disabled'}>🔓 Levantar hipoteca<br><small>-${fmt(unmortgageCost(p.id))}</small></button>`
            : `<button class="btn dark block" data-action="mortgage" ${mc.ok ? '' : 'disabled'}>🏦 Hipotecar<br><small>+${fmt(mortgageValue(p.id))}</small></button>`}
        </div>
        ${!mc.ok && mc.reason ? `<div class="reason">${mc.reason}</div>` : ''}
      </div>
      <div class="sec"><div class="sec-title">Vender / intercambiar a otro jugador</div>
        ${groupHasHouses(p.group) && p.type === 'street' ? '<div class="note">Primero vende todas las casas del grupo para poder traspasarla.</div>' : `
        ${playerChips('tradeTo', { exclude: [s.owner] })}
        <div class="row2" style="margin-top:8px">
          <input class="input money" type="number" inputmode="numeric" data-bind="tradePrice" value="${sheet.tradePrice ?? ''}" placeholder="$ (0 = cambio)" />
          <button class="btn blue" data-action="trade" ${sheet.tradeTo ? '' : 'disabled'}>🤝 Traspasar</button>
        </div>
        ${s.mortgaged ? '<p class="note">Está hipotecada: quien la reciba paga 10% de interés al banco.</p>' : ''}`}
      </div>`;
  },
  live() {
    const p = PROP[sheet.prop];
    if (S.props[p.id].owner) return '';
    const price = Number(sheet.price ?? p.price) || 0;
    if (!sheet.buyer) return '<div class="note">Elige quién la compra.</div>';
    return `<div class="summary">${flowHTML(sheet.buyer, 'bank', price, p.name)}${afterHTML(sheet.buyer, 'bank', price)}</div>
      ${adviceHTML(buyAdvice(sheet.buyer, p.id, price))}
      <button class="btn green big block" data-action="confirm-buy" ${player(sheet.buyer).cash < price ? 'disabled' : ''}>✅ Confirmar compra</button>`;
  },
};

// ----- Jugador (carta completa) -----
SHEETS.player = {
  title() { return '🎴 Carta del jugador'; },
  render() {
    const p = player(sheet.pid);
    const wp = worthParts(p.id), tips = tipsFor(p.id);
    return `
      <div class="phead">${tokenHTML(p.token, 'xl')}
        <div class="nm">${esc(p.name)}</div>
        <div class="cash ${p.cash < 0 ? 'neg' : ''}">${fmt(p.cash)}</div>
        <div class="worth">Patrimonio total <b>${fmt(netWorth(p.id))}</b></div>
      </div>
      <div class="breakdown">
        <div class="bd"><small>Efectivo</small><b>${fmt(p.cash)}</b></div>
        <div class="bd"><small>Propiedades</small><b>${fmt(wp.props)}</b></div>
        <div class="bd"><small>Casas y hoteles</small><b>${fmt(wp.build)}</b></div>
        <div class="bd"><small>Puede reunir</small><b>${fmt(liquidity(p.id))}</b></div>
      </div>
      ${p.bankrupt ? '' : `<div class="sec"><div class="sec-title">💡 Recomendaciones</div>
        <div class="advice">${tips.map(t => `<div class="tip ${t.level}"><span class="ic">${t.icon}</span><div>${t.html}</div></div>`).join('')}</div></div>`}
      <div class="sec"><div class="sec-title">Propiedades (${ownedBy(p.id).length})</div><div class="pprops" style="padding:0">${propsStrip(p.id)}</div></div>
      ${p.bankrupt ? '' : `
      <div class="row2">
        <button class="btn green block" data-action="go" data-pid="${p.id}">💵 Salida +${fmt(S.settings.salary)}</button>
        <button class="btn blue block" data-action="open" data-sheet="transfer" data-from="${p.id}">⇄ Pagar</button>
        <button class="btn block" data-action="open" data-sheet="tax" data-pid="${p.id}">🧾 Impuesto</button>
        <button class="btn block" data-action="open" data-sheet="cards" data-pid="${p.id}">🃏 Carta</button>
      </div>
      <button class="btn ghost block" style="margin-top:14px;color:var(--rojo)" data-action="open" data-sheet="bankrupt" data-pid="${p.id}">💀 Declarar bancarrota</button>`}`;
  },
};

// ----- Bancarrota -----
SHEETS.bankrupt = {
  title: '💀 Bancarrota',
  render() {
    const p = player(sheet.pid);
    return `<p class="note"><b>${esc(p.name)}</b> queda fuera del juego. ¿A quién le debía?</p>
      <div class="sec">${playerChips('creditor', { bank: true, exclude: [p.id] })}</div>
      ${adviceHTML([['info', 'ℹ️', 'Si es un jugador: recibe su efectivo, sus propiedades (hipotecadas tal cual) y la mitad del valor de las casas. Si es el banco: las propiedades vuelven a quedar libres.']])}
      <button class="btn primary big block" data-action="confirm-bankrupt" ${sheet.creditor ? '' : 'disabled'}>Confirmar bancarrota</button>`;
  },
};

// ----- Ranking -----
SHEETS.ranking = {
  title: '🏆 Ranking',
  render() {
    const rk = ranking(); const max = Math.max(1, ...rk.map(r => r.w));
    return rk.map((r, i) => `
      <div class="rank-row" style="--accent:${r.p.color}">
        <b style="width:22px">${['🥇', '🥈', '🥉'][i] || i + 1}</b>${tokenHTML(r.p.token, 'sm')}
        <div class="bar-wrap"><div class="nm"><span>${esc(r.p.name)}</span><span>${fmt(r.w)}</span></div>
        <div class="bar" style="width:${Math.max(4, r.w / max * 100)}%"></div>
        <div class="note">Efectivo ${fmt(r.p.cash)} · ${ownedBy(r.p.id).length} propiedades</div></div>
      </div>`).join('') + `<p class="note">Patrimonio = efectivo + valor de propiedades (hipotecadas a la mitad) + casas y hoteles a costo.</p>`;
  },
};

// ----- Historial -----
SHEETS.history = {
  title: '📜 Historial',
  render() {
    if (!S.log.length) return '<div class="empty">Sin movimientos todavía</div>';
    return `<button class="btn block" data-action="undo" ${undoStack.length ? '' : 'disabled'} style="margin-bottom:10px">↩️ Deshacer última acción</button>` +
      S.log.map(l => {
        const d = new Date(l.t);
        return `<div class="log-item"><time>${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}</time><div>${l.text}</div></div>`;
      }).join('');
  },
};

// ----- Ajustes -----
SHEETS.settings = {
  title: '⚙️ Ajustes',
  render() {
    return `
      <label class="field"><span>Monto al pasar por Salida</span>
        <input class="input money" type="number" inputmode="numeric" data-bind-setting="salary" value="${S.settings.salary}" /></label>
      <label class="switch"><span>🅿️ Pozo de Parada Libre (impuestos y multas al pozo)</span>
        <input type="checkbox" data-bind-setting="parking" ${S.settings.parking ? 'checked' : ''} /></label>
      <p class="note">Los datos se guardan automáticamente en este celular. Puedes cerrar el navegador sin perder la partida.</p>`;
  },
};

// ---------- Control de hojas ----------
function openSheet(type, data = {}) {
  sheet = { type, ...data };
  renderSheet();
  $('#sheet-wrap').classList.add('open');
  $('#sheet-wrap').setAttribute('aria-hidden', 'false');
  $('#sheet-body').scrollTop = 0;
}
function closeSheet() { sheet = null; $('#sheet-wrap').classList.remove('open'); $('#sheet-wrap').setAttribute('aria-hidden', 'true'); }
function renderSheet() {
  if (!sheet) return;
  const def = SHEETS[sheet.type];
  if (sheet.type === 'prop' && !PROP[sheet.prop]) return closeSheet();
  if ((sheet.type === 'player' || sheet.type === 'bankrupt') && !player(sheet.pid)) return closeSheet();
  const scroll = $('#sheet-body').scrollTop;
  $('#sheet-title').textContent = typeof def.title === 'function' ? def.title() : def.title;
  $('#sheet-body').innerHTML = def.render();
  $('#sheet-body').scrollTop = scroll;
}
function refreshLive() {
  const def = sheet && SHEETS[sheet.type], el = $('#sheet-live');
  if (def && def.live && el) el.innerHTML = def.live();
}

// =========================================================
//                       ACCIONES
// =========================================================
const ACTIONS = {
  close: closeSheet,
  undo,
  open(d) {
    const data = {};
    if (d.from) data.from = d.from;
    if (d.pid) data.pid = d.pid;
    if (d.sheet === 'cards') data.amtAll = '';
    openSheet(d.sheet, data);
  },
  player(d) { openSheet('player', { pid: d.pid }); },
  prop(d) { openSheet('prop', { prop: d.prop, price: PROP[d.prop].price }); },
  sel(d) {
    const v = d.key === 'dice' ? Number(d.val) : d.val;
    sheet[d.key] = sheet[d.key] === v && d.key !== 'dice' ? null : v;
    if (d.key === 'prop' && sheet.type === 'buy' && sheet.prop) sheet.price = PROP[sheet.prop].price;
    if (d.key === 'prop' && sheet.type === 'rent') { sheet.payer = null; sheet.dice = null; sheet.card = false; }
    renderSheet();
  },
  'add-amt'(d) {
    const a = Number(d.amt);
    sheet[d.key] = a === 0 ? '' : (Number(sheet[d.key]) || 0) + a;
    const inp = document.querySelector(`[data-bind="${d.key}"]`);
    if (inp) inp.value = sheet[d.key];
    refreshLive();
  },
  'toggle-card'(d, el) { sheet.card = el.checked; refreshLive(); },

  // --- Configuración ---
  'pick-token'(d) {
    setupDraft.token = d.token;
    if (!setupDraft.name.trim()) setupDraft.name = '';
    render();
  },
  'add-player'() {
    const name = setupDraft.name.trim();
    if (!name) return toast('Escribe el nombre del jugador', 'danger');
    if (!setupDraft.token) return toast('Elige una ficha', 'danger');
    if (S.players.some(p => p.name.toLowerCase() === name.toLowerCase())) return toast('Ese nombre ya existe', 'danger');
    const used = new Set(S.players.map(p => p.color));
    S.players.push({ id: 'p' + S.nextId++, name, token: setupDraft.token, cash: 0, bankrupt: false, color: ACCENTS.find(c => !used.has(c)) || ACCENTS[0] });
    setupDraft = { name: '', token: null };
    save(); render();
  },
  'remove-player'(d) { S.players = S.players.filter(p => p.id !== d.pid); save(); render(); },
  'start-game'() {
    if (S.players.length < 2) return;
    const start = Math.max(0, Number(S.settings.start) || 1500);
    S.players.forEach(p => { p.cash = start; p.bankrupt = false; });
    S.phase = 'game'; undoStack = [];
    S.log.unshift({ t: Date.now(), text: `🎲 Partida iniciada: ${S.players.length} jugadores con ${fmt(start)} cada uno` });
    save(); render();
    toast('🎲 ¡Que empiece el juego!', 'good');
  },
  'new-game'() {
    if (!confirm('¿Terminar esta partida y empezar una nueva? Se mantendrán los jugadores.')) return;
    const keep = S.players.map(p => ({ ...p, cash: 0, bankrupt: false }));
    const ns = newState(S.settings); ns.players = keep; ns.nextId = S.nextId;
    S = ns; undoStack = []; closeSheet(); save(); render();
  },

  // --- Dinero ---
  go(d) {
    const p = player(d.pid), amt = Number(S.settings.salary) || 200, deltas = {};
    commit(`💵 ${esc(p.name)} pasó por la Salida: +${fmt(amt)}`, () => move('bank', p.id, amt, deltas), deltas, 'good');
    closeSheet();
  },
  'confirm-buy'() {
    const buyer = sheet.buyer, prop = sheet.prop, price = Number(sheet.price ?? PROP[prop].price) || 0;
    const p = player(buyer); if (!p || !prop || S.props[prop].owner) return;
    if (p.cash < price) return toast('No le alcanza el dinero', 'danger');
    const deltas = {};
    commit(`🏠 ${esc(p.name)} compró <b>${PROP[prop].name}</b> por ${fmt(price)}`, () => {
      move(buyer, 'bank', price, deltas); S.props[prop].owner = buyer;
    }, deltas, 'good');
    closeSheet();
    const comp = PROP[prop].type === 'street' && ownsGroup(buyer, PROP[prop].group);
    if (comp) setTimeout(() => toast(`👑 ¡${esc(p.name)} tiene el monopolio ${GROUPS[PROP[prop].group].name}!`, 'good'), 600);
  },
  'confirm-rent'() {
    const { prop, payer } = sheet; const owner = S.props[prop].owner;
    const amt = rentOf(prop, sheet.dice, sheet.card); if (!amt || !payer) return;
    const deltas = {};
    commit(`💸 ${pname(payer)} pagó ${fmt(amt)} de renta a ${pname(owner)} (${PROP[prop].short})`, () => move(payer, owner, amt, deltas), deltas);
    closeSheet();
    if (player(payer).cash < 0) setTimeout(() => toast(`🚨 ${pname(payer)} quedó debiendo ${fmt(-player(payer).cash)}`, 'danger'), 500);
  },
  'confirm-transfer'() {
    const { from, to } = sheet, amt = Number(sheet.amount) || 0;
    if (!from || !to || from === to || amt <= 0) return;
    const deltas = {}, note = sheet.note ? ` (${esc(sheet.note)})` : '';
    commit(`⇄ ${pname(from)} → ${pname(to)}: ${fmt(amt)}${note}`, () => move(from, to, amt, deltas), deltas);
    closeSheet();
  },
  tax(d) {
    const amt = Number(d.amt), deltas = {}, pid = sheet.pid;
    commit(`🧾 ${pname(pid)} pagó ${d.label}: ${fmt(amt)}`, () => move(pid, taxDest(), amt, deltas), deltas);
    closeSheet();
  },
  jail() {
    const deltas = {}, pid = sheet.pid;
    commit(`🚔 ${pname(pid)} pagó $50 para salir de la cárcel`, () => move(pid, taxDest(), 50, deltas), deltas);
    closeSheet();
  },
  'card-all'(d) {
    const amt = Number(d.amt || sheet.amtAll) || 0; if (amt <= 0) return toast('Escribe un monto', 'danger');
    const pid = sheet.pid, deltas = {}, others = activePlayers().filter(p => p.id !== pid);
    const collect = d.mode === 'collect';
    commit(`🃏 ${pname(pid)} ${collect ? 'cobró' : 'pagó'} ${fmt(amt)} ${collect ? 'a' : 'a'} cada jugador`, () => {
      others.forEach(o => collect ? move(o.id, pid, amt, deltas) : move(pid, o.id, amt, deltas));
    }, deltas);
    closeSheet();
  },
  repairs(d) {
    const pid = sheet.pid, mine = ownedBy(pid);
    const h = mine.reduce((a, p) => a + (S.props[p.id].houses < 5 ? S.props[p.id].houses : 0), 0);
    const ht = mine.filter(p => S.props[p.id].houses === 5).length;
    const amt = h * Number(d.h) + ht * Number(d.ht);
    if (!amt) { toast(`${pname(pid)} no tiene construcciones: no paga nada 😎`, 'good'); return closeSheet(); }
    const deltas = {};
    commit(`🔧 ${pname(pid)} pagó reparaciones: ${fmt(amt)}`, () => move(pid, taxDest(), amt, deltas), deltas);
    closeSheet();
  },
  'bank-amt'(d) {
    const amt = Number(d.amt), pid = sheet.pid, deltas = {};
    if (amt > 0) commit(`🃏 ${pname(pid)} recibió ${fmt(amt)} del banco`, () => move('bank', pid, amt, deltas), deltas, 'good');
    else commit(`🃏 ${pname(pid)} pagó ${fmt(-amt)}`, () => move(pid, taxDest(), -amt, deltas), deltas);
    closeSheet();
  },
  'collect-pot'() {
    const pid = sheet.pid, amt = S.pot, deltas = {};
    if (!amt) return;
    commit(`🅿️ ${pname(pid)} cobró el pozo de Parada Libre: ${fmt(amt)}`, () => move('pot', pid, amt, deltas), deltas, 'good');
    closeSheet();
  },

  // --- Propiedad ---
  'house-add'() {
    const id = sheet.prop, c = buildCheck(id); if (!c.ok) return toast(c.reason, 'danger');
    const s = S.props[id], deltas = {};
    const what = s.houses === 4 ? 'un hotel 🏨' : 'una casa 🏠';
    commit(`🔨 ${pname(s.owner)} construyó ${what} en ${PROP[id].short} (-${fmt(c.cost)})`, () => { move(s.owner, 'bank', c.cost, deltas); s.houses++; }, deltas);
    renderSheet();
  },
  'house-sell'() {
    const id = sheet.prop, c = sellCheck(id); if (!c.ok) return;
    const s = S.props[id], deltas = {};
    commit(`🏚️ ${pname(s.owner)} vendió ${s.houses === 5 ? 'el hotel' : 'una casa'} de ${PROP[id].short} (+${fmt(c.refund)})`, () => { move('bank', s.owner, c.refund, deltas); s.houses--; }, deltas);
    renderSheet();
  },
  mortgage() {
    const id = sheet.prop, c = mortgageCheck(id); if (!c.ok || c.unm) return;
    const s = S.props[id], deltas = {};
    commit(`🏦 ${pname(s.owner)} hipotecó ${PROP[id].short} (+${fmt(c.value)})`, () => { move('bank', s.owner, c.value, deltas); s.mortgaged = true; }, deltas);
    renderSheet();
  },
  unmortgage() {
    const id = sheet.prop, c = mortgageCheck(id); if (!c.ok || !c.unm) return;
    const s = S.props[id], deltas = {};
    commit(`🔓 ${pname(s.owner)} levantó la hipoteca de ${PROP[id].short} (-${fmt(c.cost)})`, () => { move(s.owner, 'bank', c.cost, deltas); s.mortgaged = false; }, deltas);
    renderSheet();
  },
  'rent-from-prop'() { openSheet('rent', { prop: sheet.prop }); },
  trade() {
    const id = sheet.prop, s = S.props[id], to = sheet.tradeTo, price = Number(sheet.tradePrice) || 0;
    if (!to || to === s.owner) return;
    const from = s.owner, deltas = {};
    const interest = s.mortgaged ? Math.round(mortgageValue(id) * 0.1) : 0;
    commit(`🤝 ${pname(from)} traspasó ${PROP[id].short} a ${pname(to)}${price ? ` por ${fmt(price)}` : ''}${interest ? ` (+${fmt(interest)} interés de hipoteca)` : ''}`, () => {
      if (price) move(to, from, price, deltas);
      if (interest) move(to, 'bank', interest, deltas);
      s.owner = to;
    }, deltas);
    closeSheet();
  },

  // --- Bancarrota ---
  'confirm-bankrupt'() {
    const pid = sheet.pid, cred = sheet.creditor, p = player(pid), deltas = {};
    commit(`💀 ${esc(p.name)} se declaró en bancarrota${cred !== 'bank' ? ` ante ${pname(cred)}` : ''}`, () => {
      let houseCash = 0;
      for (const pr of ownedBy(pid)) {
        const s = S.props[pr.id];
        houseCash += s.houses * houseCost(pr.id) / 2; s.houses = 0;
        if (cred === 'bank') { s.owner = null; s.mortgaged = false; } else s.owner = cred;
      }
      if (cred !== 'bank') {
        const total = Math.max(0, p.cash) + houseCash;
        if (total) { player(cred).cash += total; deltas[cred] = total; }
      }
      p.cash = 0; p.bankrupt = true;
    }, deltas, 'danger');
    closeSheet();
  },
};

// ---------- Eventos globales ----------
document.addEventListener('click', e => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const fn = ACTIONS[el.dataset.action];
  if (!fn) return;
  if (el.dataset.action === 'toggle-card') { fn(el.dataset, el, e); return; }
  e.preventDefault();
  fn(el.dataset, el, e);
});
document.addEventListener('input', e => {
  const el = e.target;
  if (el.dataset.bind && sheet) {
    sheet[el.dataset.bind] = el.type === 'number' ? (el.value === '' ? '' : Number(el.value)) : el.value;
    refreshLive();
    if (el.dataset.bind === 'tradePrice') { /* sin refresco completo para no perder el foco */ }
  } else if (el.dataset.bindSetup) {
    setupDraft[el.dataset.bindSetup] = el.value;
  }
});
document.addEventListener('change', e => {
  const el = e.target;
  if (el.dataset.bindSetting) {
    const k = el.dataset.bindSetting;
    S.settings[k] = el.type === 'checkbox' ? el.checked : Math.max(0, Number(el.value) || 0);
    save();
    if (S.phase === 'game') render();
  }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.id === 'new-name') { e.preventDefault(); ACTIONS['add-player'](); }
  if (e.key === 'Escape' && sheet) closeSheet();
});
// Habilitar botón "Traspasar" al elegir jugador ya se maneja por re-render en "sel".

render();
