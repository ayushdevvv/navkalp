import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import './i18n';
import { LANGUAGES } from './i18n';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, useLocation, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline, Polygon, Marker, useMap } from 'react-leaflet';
import { io } from 'socket.io-client';
import axios from 'axios';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Menu, X, LayoutDashboard, Map as MapIcon, Siren, Users, Warehouse, Route as RouteIcon, CloudRain, FlaskConical, BarChart3, BrainCircuit, FileText, Bell, LogOut, ShieldAlert, Radio, Phone, Camera, Navigation, AlertTriangle, CheckCircle2, Clock3, Send, Activity, RefreshCw, Search, Plus, Truck, Hospital, Building2, Flame, MapPinned } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import './index.css';
import { STATES, STATE_DISTRICTS, DEFAULT_STATE, DEFAULT_DISTRICT, districtCenter, stateRiver } from './data/geo';
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const BASE = API.replace(/\/api\/?$/, '');
const demo = { email: 'officer@floodguard.gov', password: 'floodguard123' };
const roleLabels = { ADMIN: 'NATIONAL COMMAND ADMIN', DISTRICT_OFFICER: 'STATE / DISTRICT OFFICER', FIELD_RESPONDER: 'FIELD RESPONDER', CITIZEN: 'CITIZEN' };
const nav = [['dashboard', 'nav.dashboard', LayoutDashboard], ['map', 'nav.map', MapIcon], ['incidents', 'nav.incidents', Siren], ['resources', 'nav.resources', Users], ['tracking', 'nav.tracking', Radio], ['roads', 'nav.roads', MapPinned], ['shelters', 'nav.shelters', Warehouse], ['evacuation', 'nav.evacuation', RouteIcon], ['alerts', 'nav.alerts', ShieldAlert], ['weather', 'nav.weather', CloudRain], ['contacts', 'nav.contacts', Phone], ['safety', 'nav.safety', ShieldAlert], ['simulation', 'nav.simulation', FlaskConical], ['analytics', 'nav.analytics', BarChart3], ['copilot', 'nav.copilot', BrainCircuit], ['reports', 'nav.reports', FileText]];
function api(path, opt = {}) { const token = localStorage.getItem('token'); const role = localStorage.getItem('demoRole') || (localStorage.getItem('user') ? 'DISTRICT_OFFICER' : 'CITIZEN'); return axios({ url: API + path, ...opt, headers: { ...(opt.headers || {}), 'X-Demo-Role': role, ...(token ? { Authorization: `Bearer ${token}` } : {}) } }); }
const makeFallbackData = (state = DEFAULT_STATE, district = DEFAULT_DISTRICT) => { const c = districtCenter(state, district); const river = stateRiver(state); const zones = [`${district} East`, `${district} West`, `${district} Central`, `${district} North`, `${district} South`]; const types = ['PERSON_TRAPPED', 'MEDICAL_EMERGENCY', 'FLOODED_HOUSE', 'ROAD_BLOCKED', 'WATERLOGGING', 'EVACUATION_REQUEST']; const incidents = Array.from({ length: 12 }, (_, i) => { const severity = i < 2 ? 'CRITICAL' : i < 5 ? 'HIGH' : i < 9 ? 'MODERATE' : 'LOW'; return { _id: 'fb-i' + i, code: `FG-${410 + i}`, type: types[i % types.length], description: `${types[i % types.length].replaceAll('_', ' ')} reported near ${zones[i % zones.length]}.`, latitude: c.lat + (i % 4 - 2) * .018, longitude: c.lng + (i % 5 - 2) * .02, location: zones[i % zones.length], peopleAffected: 2 + (i % 7), elderly: i % 4 === 0, children: i % 5 === 0, disabled: i % 8 === 0, medicalNeed: i % 3 === 0, severity, priorityScore: severity === 'CRITICAL' ? 88 - i : severity === 'HIGH' ? 68 - i : 45 - i, status: i % 5 === 0 ? 'IN_PROGRESS' : i % 3 === 0 ? 'ASSIGNED' : 'VERIFIED', sourceType: 'CACHED', sourceName: 'Public response cache' }; }); const resources = Array.from({ length: 14 }, (_, i) => ({ _id: 'fb-r' + i, name: `${state} Response Unit ${String(i + 1).padStart(2, '0')}`, type: ['RESCUE_TEAM', 'BOAT', 'AMBULANCE', 'FIRE_UNIT'][i % 4], latitude: c.lat + (i % 5 - 2) * .025, longitude: c.lng + (i % 4 - 2) * .026, status: i % 6 === 0 ? 'BUSY' : 'AVAILABLE', equipment: ['First Aid', 'Radio', 'Life Jacket'], capacity: 5 })); const shelters = Array.from({ length: 8 }, (_, i) => { const capacity = 250 + (i % 4) * 75, occupancy = 90 + i * 21; const displayNames = state === 'Assam' && district === 'Dibrugarh' ? ['Dibrugarh Town Hall','Jagannath Temple Relief','Dibrugarh Univ. Campus','Assam Oil Inst. Ground','Dibrugarh Relief Centre','Dibrugarh College Shelter','Chowkidinghee Relief Camp','Barbaruah Relief Shelter'] : []; return { _id: 'fb-s' + i, name: displayNames[i] || `${district} Relief Shelter ${String(i + 1).padStart(2, '0')}`, latitude: c.lat + (i % 4 - 2) * .03, longitude: c.lng + (i % 3 - 1) * .035, capacity, occupancy, status: occupancy >= capacity ? 'FULL' : occupancy >= capacity * .8 ? 'NEAR_CAPACITY' : 'OPEN', food: true, water: true, medical: i % 2 === 0, accessibility: i % 3 === 0 }; }); const roads = Array.from({ length: 14 }, (_, i) => ({ _id: 'fb-road' + i, name: `Flood Route R-${String(i + 1).padStart(2, '0')}`, latitude: c.lat + (i % 5 - 2) * .03, longitude: c.lng + (i % 4 - 2) * .03, status: i % 5 === 0 ? 'BLOCKED' : i % 7 === 0 ? 'FLOODED' : 'OPEN', note: i % 5 === 0 ? 'Water over road / access restricted' : 'Operational route' })); const infrastructure = Array.from({ length: 8 }, (_, i) => ({ _id: 'fb-x' + i, name: `${district} ${['Hospital', 'Police Station', 'Fire & Emergency'][i % 3]} ${i + 1}`, type: ['HOSPITAL', 'POLICE', 'FIRE_STATION'][i % 3], latitude: c.lat + (i % 4 - 2) * .04, longitude: c.lng + (i % 3 - 1) * .04, status: 'OPERATIONAL' })); const gauges = [{ _id: 'fb-g1', station: `${district} Gauge`, river, latitude: c.lat + .02, longitude: c.lng - .03, waterLevel: +(100 + (c.lat % 4) + 1.2).toFixed(1), warningLevel: +(100 + (c.lat % 4) + 0.5).toFixed(1), dangerLevel: +(100 + (c.lat % 4) + 1.8).toFixed(1), trend: 'RISING', floodStatus: 'ABOVE NORMAL', sourceType: 'CACHED', sourceName: 'River monitoring cache' }]; const alerts = [{ _id: 'fb-a1', title: `${state} flood situation watch`, description: `Monitor ${river} river levels, low-lying areas, road access and relief capacity in ${district}.`, severity: 'WARNING', sourceType: 'CACHED', source: 'Public alert cache', issuedAt: new Date().toISOString() }, { _id: 'fb-a2', title: 'Preparedness advisory', description: 'Keep emergency kits ready and follow local evacuation instructions.', severity: 'WATCH', sourceType: 'CACHED', source: 'Public advisory cache', issuedAt: new Date().toISOString() }]; return { district: { name: district, state, center: c }, incidents, resources, shelters, roads, infrastructure, gauges, alerts, floodzones: [], evacuations: [], weather: { district, state, temperature: Math.round(22 + Math.abs(c.lat % 15)), rainfallMm: Math.round(18 + Math.abs(c.lng % 55)), precipitationProbability: Math.round(48 + Math.abs(c.lat * 2) % 48), humidity: Math.round(62 + Math.abs(c.lng) % 28), windSpeed: Math.round(8 + Math.abs(c.lat) % 18), condition: 'Heavy Rain', warningLevel: 'WARNING', sourceType: 'CACHED', source: 'Weather cache', forecast: Array.from({ length: 7 }, (_, i) => ({ day: i ? 'Day ' + (i + 1) : 'Today', rainfallMm: Math.max(8, 42 - i * 5), tempMax: 30, tempMin: 24, precipitationProbability: 78 - i * 6 })) }, emergencyContacts: [{ name: 'National Emergency Response', category: 'Emergency', phone: '112' }, { name: 'Ambulance Emergency', category: 'Medical', phone: '108' }, { name: 'Fire & Rescue', category: 'Fire', phone: '101' }] }; };
const empty = makeFallbackData();
const trustTone = s => ({ OFFICIAL: 'cyan', VERIFIED: 'emerald', COMMUNITY: 'amber', CACHED: 'slate', DEMO: 'slate', SIMULATION: 'amber', OPERATOR: 'blue' }[s] || 'slate');
function Trust({ type, name }) { return <span className={'source ' + trustTone(type)}>{type || 'DATA'}{name ? ` • ${name}` : ''}</span>; }
function haversineKm(lat1, lng1, lat2, lng2) { if ([lat1, lng1, lat2, lng2].some(v => v == null || isNaN(v))) return null; const R = 6371, dLat = (lat2 - lat1) * Math.PI / 180, dLng = (lng2 - lng1) * Math.PI / 180; const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2; return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); }
function etaMinutes(km, kmh = 22) { if (km == null) return null; return Math.max(2, Math.round(km / kmh * 60)); }
function gmapsDirections(destLat, destLng, originLat, originLng) { const dest = `${destLat},${destLng}`; return originLat != null ? `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${dest}&travelmode=driving` : `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`; }
const INDIA_BOUNDS = { latMin: 6.5, latMax: 36.0, lngMin: 68.0, lngMax: 97.5 };
function projectIndia(lat, lng) { const x = (lng - INDIA_BOUNDS.lngMin) / (INDIA_BOUNDS.lngMax - INDIA_BOUNDS.lngMin) * 100; const y = (INDIA_BOUNDS.latMax - lat) / (INDIA_BOUNDS.latMax - INDIA_BOUNDS.latMin) * 100; return { x, y }; }
function stateAlertTone(name) { let h = 0; for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0; const r = h % 10; if (name === DEFAULT_STATE) return 'critical'; if (r < 2) return 'critical'; if (r < 4) return 'high'; if (r < 7) return 'moderate'; return 'calm'; }
function App() {
    const navg = useNavigate(), loc = useLocation();
    const { t, i18n } = useTranslation();
    useEffect(() => { document.documentElement.lang = i18n.language; document.documentElement.dir = i18n.language === 'ur' ? 'rtl' : 'ltr'; document.body.dataset.language = i18n.language; }, [i18n.language]);
    const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || 'null'));
    const [state, setState] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('state') || JSON.stringify(DEFAULT_STATE));
        }
        catch {
            return DEFAULT_STATE;
        }
    });
    const [district, setDistrict] = useState(() => localStorage.getItem('district') || DEFAULT_DISTRICT);
    const [side, setSide] = useState(true);
    const [notifications, setNotifications] = useState([]);
    const [notifOpen, setNotifOpen] = useState(false);
    function enterAs(role) { const isCitizen = role === 'CITIZEN'; const u = { name: isCitizen ? 'Citizen User' : 'District Command Administrator', email: isCitizen ? 'citizen@floodguard.gov' : 'admin@floodguard.gov', role, state: DEFAULT_STATE, district: DEFAULT_DISTRICT, language: i18n.language }; localStorage.setItem('demoRole', role); localStorage.setItem('user', JSON.stringify(u)); localStorage.setItem('state', JSON.stringify(DEFAULT_STATE)); localStorage.setItem('district', DEFAULT_DISTRICT); setState(DEFAULT_STATE); setDistrict(DEFAULT_DISTRICT); setUser(u); }
    function logout() { localStorage.removeItem('user'); localStorage.removeItem('token'); localStorage.removeItem('demoRole'); localStorage.setItem('state', JSON.stringify(DEFAULT_STATE)); localStorage.setItem('district', DEFAULT_DISTRICT); setState(DEFAULT_STATE); setDistrict(DEFAULT_DISTRICT); setUser(null); setNotifications([]); navg('/'); }
    useEffect(() => {
        localStorage.setItem('state', JSON.stringify(state));
        if (!STATES[state].includes(district))
            setDistrict(STATES[state][0]);
    }, [state]);
    useEffect(() => localStorage.setItem('district', district), [district]);
    if (!user) {
        if (loc.pathname === '/admin-login')
            return <AdminLogin onLogin={(u) => {
                localStorage.setItem('demoRole', u.role);
                localStorage.setItem('user', JSON.stringify(u));
                localStorage.setItem('state', JSON.stringify(DEFAULT_STATE));
                localStorage.setItem('district', DEFAULT_DISTRICT);
                setState(DEFAULT_STATE);
                setDistrict(DEFAULT_DISTRICT);
                setUser(u);
                navg('/dashboard');
            }} onBack={() => navg('/')} />;
        const publicCitizen = { name: 'Citizen User', email: 'citizen@rahatsetu.gov.in', role: 'CITIZEN', state, district, language: i18n.language };
        return <Citizen user={publicCitizen} state={state} setState={setState} district={district} setDistrict={setDistrict} onLogout={logout} onAdminLogin={() => navg('/admin-login')} notifications={notifications}/>;
    }
    if (user.role === 'CITIZEN')
        return <Citizen user={user} state={state} setState={setState} district={district} setDistrict={setDistrict} onLogout={logout} onAdminLogin={() => navg('/admin-login')} notifications={notifications}/>;
    if (user.role === 'FIELD_RESPONDER')
        return <Field user={user} state={state} district={district} onLogout={logout}/>;
    const rawPage = loc.pathname.slice(1);
    const page = !rawPage || rawPage === 'admin-login' ? 'dashboard' : rawPage;
    return <div className="app-shell"><header className="topbar"><div className="brand"><button className="mobile-btn" onClick={() => setSide(!side)}>{side ? <X /> : <Menu />}</button><div className="tricolor"><span /><span /><span /></div><div><div className="brand-name">RAHATSETU</div><div className="brand-sub">NATIONAL FLOOD RESCUE & RESPONSE NETWORK</div></div></div><div className="gov-selects"><select value={state} onChange={e => setState(e.target.value)}>{Object.keys(STATES).map(s => <option key={s}>{s}</option>)}</select><select value={district} onChange={e => setDistrict(e.target.value)}>{STATES[state].map(d => <option key={d}>{d}</option>)}</select></div><div className="top-actions"><span className="live"><i /> LIVE</span><button className="notification-btn" title={t("common.notifications")} aria-label={t("common.notifications")} onClick={() => setNotifOpen(v => !v)}><Bell size={18}/>{notifications.length > 0 && <em>{notifications.length > 9 ? '9+' : notifications.length}</em>}</button><label className="language-select" title={t("common.language")}><span>文</span><select value={i18n.language} onChange={e => { i18n.changeLanguage(e.target.value); localStorage.setItem('fg-language', e.target.value); document.documentElement.lang = e.target.value; }} aria-label={t("common.language")}>{LANGUAGES.map(([code, name]) => <option key={code} value={code}>{name}</option>)}</select></label><div className="user-chip"><b>{user.name}</b><small>{roleLabels[user.role]}</small></div><button onClick={logout} title="Exit demo"><LogOut size={17}/></button></div></header><NotificationDrawer open={notifOpen} notifications={notifications} onClose={() => setNotifOpen(false)}/><div className="workspace"><aside className={'sidebar ' + (side ? 'show' : '')}><div className="side-title">{state.toUpperCase()} • {district.toUpperCase()}</div>{nav.map(([key, label, Icon]) => <button key={key} className={page === key ? 'active' : ''} onClick={() => { navg('/' + key); setSide(false); }}><Icon size={17}/><span>{t(label)}</span></button>)}<div className="side-foot"><div className="signal"><Radio size={15}/> Response network</div><small>Public and operational information is refreshed when available.</small></div></aside><main className="content"><Page page={page} state={state} district={district} user={user} onNotification={n => setNotifications(x => [n, ...x].slice(0, 20))}/></main></div></div>;
}
function AdminLogin({ onLogin, onBack }) {
    const { i18n } = useTranslation();
    const [email, setEmail] = useState('admin@floodguard.gov');
    const [password, setPassword] = useState('floodguard123');
    const [error, setError] = useState('');
    function submit(e) {
        e.preventDefault();
        if (email.trim().toLowerCase() !== 'admin@floodguard.gov' || password !== 'floodguard123') {
            setError('Invalid administrator credentials. Use the demo credentials shown below.');
            return;
        }
        onLogin({ name: 'System Administrator', email: email.trim(), role: 'ADMIN', state: DEFAULT_STATE, district: DEFAULT_DISTRICT, language: i18n.language });
    }
    return <div className="admin-login-page">
        <header className="admin-login-topbar">
            <div className="brand"><div className="tricolor"><span/><span/><span/></div><div><div className="brand-name">RAHATSETU</div><div className="brand-sub">NATIONAL FLOOD RESPONSE PLATFORM</div></div></div>
            <button className="ghost admin-back" onClick={onBack}>Public Safety</button>
        </header>
        <main className="admin-login-main">
            <div className="admin-login-card">
                <div className="admin-login-brand"><div className="admin-login-mark"><ShieldAlert size={22}/></div><div><strong>Administration</strong><span>Secure command access</span></div></div>
                <div className="admin-login-heading"><div className="eyebrow dark">AUTHORIZED OPERATIONS</div><h1>Administrator login</h1><p>Access the national command centre, rescue operations, alerts, shelters and live response intelligence.</p></div>
                <form className="admin-login-form" onSubmit={submit}>
                    <label><span>Administrator email</span><input type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="username" required/></label>
                    <label><span>Password</span><input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" required/></label>
                    {error && <div className="admin-login-error">{error}</div>}
                    <button className="primary admin-login-submit"><LogInIcon/> Enter Command Centre</button>
                </form>
                <div className="admin-demo"><span>DEMO ACCESS</span><b>admin@floodguard.gov</b><small>Password: floodguard123</small></div>
                <button className="ghost admin-login-public" onClick={onBack}><Siren size={15}/> Continue as Citizen</button>
            </div>
            <div className="admin-login-aside"><div className="aside-kicker">RAHATSETU COMMAND LAYER</div><h2>One operating picture.<br/>Faster decisions.</h2><p>State and district selection drives the operational dataset, map centre, river context, shelters, roads, weather and response records across the command centre.</p><div className="login-trust"><span><CheckCircle2 size={15}/> Role-gated operations</span><span><MapIcon size={15}/> State-aware live map</span><span><Radio size={15}/> Rescue tracking</span><span><CloudRain size={15}/> Weather context</span></div></div>
        </main>
    </div>;
}

// Small local icon alias keeps the login component self-contained.
const LogInIcon = () => <span className="login-icon">↗</span>;

function Page({ page, state, district, user, onNotification }) {
    const [data, setData] = useState(() => makeFallbackData(state, district)), [loading, setLoading] = useState(true), [error, setError] = useState(false), [fresh, setFresh] = useState(null);
    const load = async () => {
        try {
            setLoading(true);
            const r = await api(`/dashboard?state=${encodeURIComponent(state)}&district=${encodeURIComponent(district)}`);
            const fallback = makeFallbackData(state, district);
            const payload = r.data.data;
            const matchesSelection = payload?.district?.state === state && payload?.district?.name === district;
            setData(matchesSelection ? payload : fallback);
            setError(!!r.data.fallback || !matchesSelection);
            setFresh(new Date());
        }
        catch (primary) {
            try {
                const r = await api(`/demo/dashboard?state=${encodeURIComponent(state)}&district=${encodeURIComponent(district)}`);
                const fallback = makeFallbackData(state, district);
                const payload = r.data.data;
                const matchesSelection = payload?.district?.state === state && payload?.district?.name === district;
                setData(matchesSelection ? payload : fallback);
                setError(true);
                setFresh(new Date());
            }
            catch {
                setError(true);
                setData(prev => prev.incidents?.length ? prev : makeFallbackData(state, district));
            }
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        load();
        const s = io(BASE);
        const events = ['incident:new', 'incidents:updated', 'incident:assigned', 'incident:resolved', 'resources:updated', 'resource:dispatched', 'shelters:updated', 'shelter:updated', 'alerts:updated', 'alert:new', 'road:blocked', 'road:cleared', 'evacuation:updated', 'simulation:updated'];
        events.forEach(e => s.on(e, p => {
            load();
            if (p?.title)
                onNotification(p);
        }));
        s.on('notification:new', p => { onNotification(p); load(); });
        return () => s.disconnect();
    }, [state, district]);
    const props = { data, district, state, refresh: load, user, onNotification };
    if (loading && !data.incidents.length)
        return <Loading />;
    return <>{page === 'dashboard' && <Dashboard {...props}/>} {page === 'map' && <LiveMap {...props}/>} {page === 'incidents' && <Incidents {...props}/>} {page === 'resources' && <Resources {...props}/>} {page === 'tracking' && <Tracking {...props}/>} {page === 'roads' && <RoadNetwork {...props}/>} {page === 'shelters' && <Shelters {...props}/>} {page === 'evacuation' && <Evacuation {...props}/>} {page === 'alerts' && <Alerts {...props}/>} {page === 'weather' && <Weather {...props}/>} {page === 'simulation' && <Simulation {...props}/>} {page === 'analytics' && <Analytics {...props}/>} {page === 'copilot' && <Copilot {...props}/>} {page === 'reports' && <Reports {...props}/>} {page === 'contacts' && <Contacts {...props}/>} {page === 'safety' && <Safety {...props}/>}</>;
}
function Loading() { return <div className="loading"><div className="spinner"/><b>Loading national response operations…</b><span>Connecting to the response network</span></div>; }
function Header({ title, sub, action, state, district }) { return <div className="page-head"><div><div className="eyebrow dark">NATIONAL OPERATIONS • {state?.toUpperCase()} • {district?.toUpperCase()}</div><h1>{title}</h1>{sub && <p>{sub}</p>}</div>{action}</div>; }
function Card({ children, className = '' }) { return <section className={'card ' + className}>{children}</section>; }
function Stat({ label, value, icon: Icon, tone = 'blue', meta }) { return <Card className="stat"><div><small>{label}</small><strong>{value}</strong>{meta && <span className="stat-meta">{meta}</span>}</div><div className={'stat-icon ' + tone}><Icon size={19}/></div></Card>; }
function Dashboard({ data, state, district }) { const { t } = useTranslation(); const critical = data.incidents.filter(x => ['CRITICAL', 'HIGH'].includes(x.severity)).length, available = data.resources.filter(x => x.status === 'AVAILABLE').length, occupied = data.shelters.reduce((a, x) => a + (x.occupancy || 0), 0), cap = data.shelters.reduce((a, x) => a + (x.capacity || 0), 0), blocked = data.roads.filter(x => x.status !== 'OPEN').length; const gauge = data.gauges?.[0]; return <><Header state={state} district={district} title={t('dashboard.title')} sub={t('dashboard.subtitle')} action={<div className="live-pill"><i /> {t('dashboard.realtime')}</div>}/><div className="stats"><Stat label="Active incidents" value={data.incidents.filter(x => !['RESOLVED', 'REJECTED'].includes(x.status)).length} icon={Siren} tone="red" meta={`${critical} high / critical`}/><Stat label="Available response units" value={available} icon={Users} tone="green" meta={`${data.resources.length} total assets`}/><Stat label="Shelter occupancy" value={cap ? Math.round(occupied / cap * 100) + '%' : '—'} icon={Warehouse} tone="blue" meta={`${Math.max(cap - occupied, 0)} spaces available`}/><Stat label="River situation" value={gauge?.floodStatus || 'WATCH'} icon={Activity} tone="amber" meta={gauge ? `${gauge.station} • ${gauge.trend}` : 'CWC cached / demo'}/></div><div className="situation-row"><Card className="situation-card"><div className="card-head"><div><b>FLOOD SITUATION & OPERATIONAL RISK</b><span>Awareness layer — not a RahatSetu prediction model</span></div><Trust type={gauge?.sourceType || 'CACHED'} name={gauge?.sourceName || 'CWC network'}/></div><div className="situation-body"><div><small>RIVER</small><strong>{gauge?.river || 'Brahmaputra'}</strong><span>{gauge?.station || 'Dibrugarh gauge'}</span></div><div><small>LEVEL</small><strong>{gauge?.waterLevel ?? '—'} m</strong><span>Warning {gauge?.warningLevel ?? '—'} • Danger {gauge?.dangerLevel ?? '—'}</span></div><div><small>TREND</small><strong className="risk">{gauge?.trend || 'RISING'}</strong><span>{gauge?.floodStatus || 'ABOVE NORMAL'}</span></div><div><small>BLOCKED ROADS</small><strong>{blocked}</strong><span>Route network impact</span></div></div></Card><Card className="alert-rail"><div className="card-head"><b>ACTIVE ALERTS</b><span>{data.alerts.length} records</span></div>{data.alerts.slice(0, 3).map(a => <div className="alert-row" key={a._id}><div className="alert-dot"/><div><b>{a.title}</b><span>{a.description?.slice(0, 90)}</span></div><Trust type={a.sourceType} name={a.source || ''}/></div>)}</Card></div><div className="command-grid"><Card className="map-card"><div className="card-head"><div><b>LIVE RESPONSE MAP</b><span>Flood zones • incidents • resources • shelters • roads • critical infrastructure</span></div><Trust type="VERIFIED" name="OSM map + RahatSetu operational layers"/></div><div className="map-wrap"><Map data={data}/></div></Card><Card className="priority-card"><div className="card-head"><div><b>PRIORITY QUEUE</b><span>Explainable deterministic scoring</span></div><span className="live">LIVE</span></div><div className="queue">{data.incidents.slice().sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0)).slice(0, 8).map(i => <div className="queue-item" key={i._id}><div className={'severity ' + (i.severity || 'LOW').toLowerCase()}>{i.severity}</div><div className="q-main"><b>{i.code}</b><span>{i.type?.replaceAll('_', ' ')} • {i.description?.slice(0, 48)}</span></div><strong>{i.priorityScore || 0}</strong></div>)}</div></Card></div><div className="lower-grid"><Card><div className="card-head"><b>RESPONSE READINESS</b><span>Operational capacity</span></div><Readiness label="Rescue units" value={data.resources.length ? Math.round(available / data.resources.length * 100) : 0}/><Readiness label="Shelter remaining" value={cap ? Math.round((cap - occupied) / cap * 100) : 0}/><Readiness label="Road network" value={data.roads.length ? Math.round(data.roads.filter(x => x.status === 'OPEN').length / data.roads.length * 100) : 0}/></Card><Card><div className="card-head"><b>FIELD ACTIVITY</b><span>Latest operational signals</span></div>{data.incidents.filter(x => ['ASSIGNED', 'IN_PROGRESS'].includes(x.status)).slice(0, 4).map(i => <div className="mini-activity" key={i._id}><span className={'severity ' + i.severity.toLowerCase()}>{i.severity}</span><div><b>{i.code}</b><small>{i.status} • {i.location}</small></div><Clock3 size={15}/></div>)}</Card></div></>; }
function Readiness({ label, value }) { return <div className="readiness"><div><span>{label}</span><b>{value}%</b></div><div className="bar"><i style={{ width: value + '%' }}/></div></div>; }
function stateCenter(state) {
    const districts = Object.values(STATE_DISTRICTS[state]?.districts || {});
    if (!districts.length) return { lat: 22.5937, lng: 78.9629 };
    return {
        lat: districts.reduce((sum, c) => sum + c.lat, 0) / districts.length,
        lng: districts.reduce((sum, c) => sum + c.lng, 0) / districts.length
    };
}
function MapViewport({ state, district }) {
    const map = useMap();
    const firstRender = useRef(true);
    const previousState = useRef(state);
    const stateSelectionPending = useRef(false);
    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false;
            map.fitBounds([[6.4, 67.5], [36.5, 98.0]], { padding: [12, 12], animate: false });
            previousState.current = state;
            return;
        }
        const stateChanged = previousState.current !== state;
        if (stateChanged) {
            const c = stateCenter(state);
            map.setView([c.lat, c.lng], 6.2, { animate: true });
            previousState.current = state;
            stateSelectionPending.current = true;
            return;
        }
        if (stateSelectionPending.current) {
            stateSelectionPending.current = false;
            return;
        }
        const c = districtCenter(state, district);
        map.setView([c.lat, c.lng], 10.5, { animate: true });
    }, [map, state, district]);
    return null;
}
function Map({ data, route }) {
    const selectedState = data.district?.state || DEFAULT_STATE;
    return <MapContainer center={[22.5937, 78.9629]} zoom={5} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
        <MapViewport state={selectedState} district={data.district?.name}/>
        <TileLayer attribution="© OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
        {data.floodzones?.map(z => <Polygon key={z._id} positions={z.geometry.coordinates[0].map(([lng, lat]) => [lat, lng])} pathOptions={{ color: z.severity === 'CRITICAL' ? '#ef4444' : z.severity === 'HIGH' ? '#f59e0b' : '#60a5fa', fillOpacity: .16, weight: 1.5 }}><Popup><b>{z.name}</b><br />Flood affected / risk zone<br /><Trust type={z.sourceType} name={z.sourceName}/></Popup></Polygon>)}
        {data.roads?.map(r => <CircleMarker key={'road' + r._id} center={[r.latitude, r.longitude]} radius={r.status === 'OPEN' ? 4 : 7} pathOptions={{ color: r.status === 'OPEN' ? '#94a3b8' : '#ef4444', fillColor: r.status === 'OPEN' ? '#64748b' : '#ef4444', fillOpacity: .9 }}><Popup><b>{r.name}</b><br />{r.status}<br />{r.note}</Popup></CircleMarker>)}
        {data.incidents?.map(i => <CircleMarker key={'i' + i._id} center={[i.latitude, i.longitude]} radius={i.severity === 'CRITICAL' ? 10 : i.severity === 'HIGH' ? 8 : 6} pathOptions={{ color: i.severity === 'CRITICAL' ? '#ef4444' : i.severity === 'HIGH' ? '#f59e0b' : i.severity === 'MODERATE' ? '#facc15' : '#38bdf8', fillOpacity: .85 }}><Popup><b>{i.code}</b><br />{i.type?.replaceAll('_', ' ')}<br />Priority {i.priorityScore}<br />{i.status}</Popup></CircleMarker>)}
        {data.resources?.map(r => <CircleMarker key={'r' + r._id} center={[r.latitude, r.longitude]} radius={r.status === 'AVAILABLE' ? 5 : 6} pathOptions={{ color: r.status === 'AVAILABLE' ? '#22c55e' : '#f59e0b', fillOpacity: .95 }}><Popup><b>{r.name}</b><br />{r.type}<br />{r.status}</Popup></CircleMarker>)}
        {data.shelters?.map(s => <CircleMarker key={'s' + s._id} center={[s.latitude, s.longitude]} radius={7} pathOptions={{ color: '#60a5fa', fillColor: '#2563eb', fillOpacity: .7 }}><Popup><b>{s.name}</b><br />{s.occupancy}/{s.capacity} occupied<br />{s.status}</Popup></CircleMarker>)}
        {data.infrastructure?.map(x => <CircleMarker key={'infra' + x._id} center={[x.latitude, x.longitude]} radius={5} pathOptions={{ color: x.type === 'HOSPITAL' ? '#c084fc' : x.type === 'POLICE' ? '#f8fafc' : '#fb7185', fillOpacity: .9 }}><Popup><b>{x.name}</b><br />{x.type}</Popup></CircleMarker>)}
        {data.gauges?.map(g => <CircleMarker key={'g' + g._id} center={[g.latitude, g.longitude]} radius={8} pathOptions={{ color: '#06b6d4', fillOpacity: .85 }}><Popup><b>{g.station}</b><br />{g.river}<br />{g.waterLevel} m • {g.trend}</Popup></CircleMarker>)}
        {route?.geometry?.coordinates && <Polyline positions={route.geometry.coordinates.map(([lng, lat]) => [lat, lng])} pathOptions={{ color: '#38bdf8', weight: 5, dashArray: route.source === 'FALLBACK' ? '8 8' : undefined }}/>}
    </MapContainer>;
}
function IndiaMapViewport({ state, district }) {
    const map = useMap();
    const first = useRef(true);
    const previousState = useRef(state);
    useEffect(() => {
        if (first.current) {
            first.current = false;
            map.fitBounds([[6.5, 68.0], [35.9, 97.4]], { padding: [18, 18], animate: false });
            previousState.current = state;
            return;
        }
        if (previousState.current !== state) {
            const c = stateCenter(state);
            map.setView([c.lat, c.lng], state === 'India' ? 5.2 : 6.4, { animate: true });
            previousState.current = state;
            return;
        }
        if (district) {
            const c = districtCenter(state, district);
            if (state !== 'India') map.setView([c.lat, c.lng], 7.6, { animate: true });
        }
    }, [map, state, district]);
    return null;
}
function IndiaOverviewMap({ state, district, onStateSelect, className = '' }) {
    const markerStates = ['Assam', 'Uttar Pradesh', 'Bihar', 'West Bengal', 'Maharashtra', 'Kerala', 'Gujarat', 'Odisha', 'Delhi'];
    return <div className={'india-map-shell ' + className}>
        <div className="india-map-toolbar">
            <div><b>INDIA</b><span>National overview • select a state to zoom</span></div>
            <div className="india-map-location"><span>INDIA</span><select value={state} onChange={e => onStateSelect?.(e.target.value)}>{Object.keys(STATES).sort().map(s => <option key={s} value={s}>{s}</option>)}</select></div>
        </div>
        <div className="india-map-canvas">
            <MapContainer center={[22.5937, 78.9629]} zoom={5} minZoom={4.5} maxZoom={9} maxBounds={[[5.5, 66.5], [37.5, 99.5]]} maxBoundsViscosity={1} scrollWheelZoom style={{height:'100%',width:'100%'}} zoomControl={true}>
                <IndiaMapViewport state={state} district={district}/>
                <TileLayer attribution="© OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
                {markerStates.map(name => {
                    const c = stateCenter(name); const tone = stateAlertTone(name);
                    return <CircleMarker key={name} center={[c.lat,c.lng]} radius={name === state ? 10 : 7} pathOptions={{ color:'#fff', weight:2, fillColor: tone === 'critical' ? '#d0273b' : tone === 'high' ? '#c9820a' : tone === 'moderate' ? '#e8c400' : '#128253', fillOpacity:.95 }} eventHandlers={{ click: () => onStateSelect?.(name) }}>
                        <Popup><b>{name}</b><br/>Flood & emergency monitoring<br/><span>Click to focus this state</span></Popup>
                    </CircleMarker>;
                })}
                {state !== 'India' && district && <CircleMarker center={[districtCenter(state,district).lat,districtCenter(state,district).lng]} radius={6} pathOptions={{color:'#1769d1',weight:2,fillColor:'#fff',fillOpacity:1}}><Popup><b>{district}</b><br/>{state}</Popup></CircleMarker>}
            </MapContainer>
        </div>
        <div className="india-map-footer"><span><i className="map-dot critical"/> Critical</span><span><i className="map-dot high"/> High</span><span><i className="map-dot moderate"/> Watch</span><span><i className="map-dot calm"/> Normal</span></div>
    </div>;
}
function LiveMap({ data, state, district }) { const { t } = useTranslation(); return <><Header state={state} district={district} title={t('page.map.title')} sub={t('page.map.sub')} action={<Trust type="VERIFIED" name="OpenStreetMap"/>}/><Card className="map-full"><div className="map-legend"><span><i className="lg critical"/> Critical</span><span><i className="lg high"/> High</span><span><i className="lg resource"/> Resource</span><span><i className="lg shelter"/> Shelter</span><span><i className="lg zone"/> Flood zone</span><span><i className="lg road"/> Blocked road</span></div><Map data={data}/></Card></>; }
function Incidents({ data, refresh }) {
    const { t } = useTranslation();
    const [sel, setSel] = useState(null), [dispatchResult, setDispatchResult] = useState(null), [search, setSearch] = useState('');
    async function dispatch(id) {
        try {
            const r = await api('/incidents/' + id + '/dispatch', { method: 'POST' });
            setDispatchResult(r.data.data);
            refresh();
        }
        catch (e) {
            alert(e.response?.data?.message || 'No available resource');
        }
    }
    const list = data.incidents.filter(i => (i.code + ' ' + i.type + ' ' + i.description).toLowerCase().includes(search.toLowerCase())).sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));
    return <><Header state={data.district?.state} district={data.district?.name} title={t('page.incidents.title')} sub={t('page.incidents.sub')} action={<div className="toolbar-input"><Search size={14}/><input placeholder="Search incidents" value={search} onChange={e => setSearch(e.target.value)}/></div>}/><div className="incident-grid">{list.map(i => <Card key={i._id} className="incident-card"><div className="incident-top"><span className={'severity ' + i.severity?.toLowerCase()}>{i.severity}</span><b>{i.code}</b><Trust type={i.sourceType} name={i.source}/></div><h3>{i.type?.replaceAll('_', ' ')}</h3><p>{i.description}</p><div className="incident-meta"><span><Users size={14}/>{i.peopleAffected || 1} affected</span><span><Navigation size={14}/>{i.location || 'Mapped location'}</span><span><Clock3 size={14}/>{i.status}</span></div><div className="score"><div><small>PRIORITY SCORE</small><strong>{i.priorityScore || 0}/100</strong></div><button onClick={() => setSel(i)} className="ghost">Why?</button>{!['RESOLVED', 'REJECTED'].includes(i.status) && <button onClick={() => dispatch(i._id)} className="primary small"><Send size={14}/> Dispatch</button>}</div></Card>)}</div>{sel && <Modal title={sel.code} onClose={() => setSel(null)}><div className="modal-severity"><span className={'severity ' + sel.severity.toLowerCase()}>{sel.severity}</span><strong>{sel.priorityScore}/100</strong></div><p>{sel.description}</p><h4>WHY THIS PRIORITY?</h4><ul>{(sel.priorityReasons || []).map((r, n) => <li key={n}>+{r.points} — {r.label}</li>)}</ul><div className="source-note"><Trust type={sel.sourceType} name={sel.sourceName || sel.source}/></div></Modal>}{dispatchResult && <Modal title="Dispatch confirmed" onClose={() => setDispatchResult(null)}><div className="dispatch-success"><CheckCircle2 /><div><b>{dispatchResult.resource?.name} is EN_ROUTE</b><span>{dispatchResult.incident?.code} • {dispatchResult.route?.distanceKm} km • ETA {dispatchResult.route?.etaMinutes} min</span><Trust type={dispatchResult.route?.source === 'FALLBACK' ? 'CACHED' : 'VERIFIED'} name={dispatchResult.route?.source === 'FALLBACK' ? 'Routing fallback' : 'OSRM routing'}/></div></div><p>Route geometry has been returned to the operator. Blocked-road updates can trigger a fresh dispatch calculation.</p></Modal>}</>;
}
function RoadNetwork({ data, refresh, user }) {
    const { t } = useTranslation();
    async function toggle(r) {
        try {
            await api('/roads/' + r._id, { method: 'PATCH', data: { status: r.status === 'OPEN' ? 'BLOCKED' : 'OPEN', note: r.status === 'OPEN' ? 'Operator blocked road for simulation/field report' : 'Operator cleared road' } });
            refresh();
        }
        catch (e) {
            alert(e.response?.data?.message || 'Unable to update road');
        }
    }
    return <><Header state={data.district?.state} district={data.district?.name} title={t('page.roads.title')} sub={t('page.roads.sub')}/><div className="road-grid">{data.roads.map(r => <Card key={r._id} className="road-card"><div><b>{r.name}</b><span>{r.note}</span></div><div className={'status ' + (r.status === 'OPEN' ? 'open' : 'closed')}>{r.status}</div><button className={r.status === 'OPEN' ? 'ghost' : 'primary small'} onClick={() => toggle(r)}>{r.status === 'OPEN' ? 'BLOCK ROAD' : 'CLEAR ROAD'}</button><small>{r.latitude?.toFixed?.(5)}, {r.longitude?.toFixed?.(5)} • <Trust type={r.sourceType} name={r.sourceName}/></small></Card>)}</div></>;
}
function Resources({ data }) { const { t } = useTranslation(); const available = data.resources.filter(r => r.status === 'AVAILABLE').length; return <><Header state={data.district?.state} district={data.district?.name} title={t('nav.resources')} sub={`${available} available of ${data.resources.length} registered units`} action={<Trust type="DEMO" name="District asset registry"/>}/><div className="resource-grid">{data.resources.map(r => <Card key={r._id} className="resource"><div className="resource-icon"><Truck size={18}/></div><div><b>{r.name}</b><span>{r.type?.replaceAll('_', ' ')}</span></div><div className={'status ' + r.status.toLowerCase()}>{r.status.replaceAll('_', ' ')}</div><small>{r.capacity} capacity • {r.equipment?.join(', ') || 'Standard kit'}</small></Card>)}</div></>; }
function Tracking({ data, state, district, user }) {
    const { t } = useTranslation();
    const [, tick] = useState(0);
    useEffect(() => { const id = setInterval(() => tick(x => x + 1), 1000); return () => clearInterval(id); }, []);
    const active = data.resources.filter(r => ['EN_ROUTE', 'BUSY', 'AVAILABLE'].includes(r.status));
    const incidentsById = Object.fromEntries((data.incidents || []).map(i => [String(i._id), i]));
    const elapsed = (ts) => {
        if (!ts)
            return '—';
        const sec = Math.max(0, Math.floor((Date.now() - new Date(ts).getTime()) / 1000));
        const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
        return h ? `${h}h ${m}m` : m ? `${m}m ${s}s` : `${s}s`;
    };
    const etaFor = r => {
        const i = incidentsById[String(r.assignedIncident)];
        if (!i)
            return r.status === 'AVAILABLE' ? 'STANDBY' : '—';
        const last = (i.timeline || []).slice(-1)[0];
        const match = last?.note?.match(/(\d+)\s*min/);
        return match ? `${match[1]} min` : 'En route';
    };
    return <><Header state={state} district={district} title={t('page.tracking.title')} sub={t('page.tracking.sub')} action={<div className="live-pill"><i /> {t('common.liveTracking')}</div>}/>
 <div className="tracking-stats">
   <Stat label={t('tracking.activeUnits')} value={active.filter(r => r.status !== 'AVAILABLE').length} icon={Truck} tone="blue" meta={`${data.resources.length} registered units`}/>
   <Stat label={t('tracking.enRoute')} value={data.resources.filter(r => r.status === 'EN_ROUTE').length} icon={Navigation} tone="amber" meta={t('tracking.liveEta')}/>
   <Stat label={t('tracking.assigned')} value={data.incidents.filter(i => ['ASSIGNED', 'IN_PROGRESS'].includes(i.status)).length} icon={Siren} tone="red" meta={t('tracking.activeMissions')}/>
   <Stat label={t('tracking.avgResponse')} value="18 min" icon={Clock3} tone="green" meta={t('tracking.target')}/>
 </div>
 <div className="tracking-grid">
  <Card><div className="card-head"><div><b>{t('tracking.unitBoard')}</b><span>{t('tracking.unitBoardSub')}</span></div><span className="live">{t('common.live')}</span></div>
   <div className="tracking-list">{active.map(r => {
            const i = incidentsById[String(r.assignedIncident)];
            const last = i?.timeline?.slice(-1)[0];
            return <div className="tracking-row" key={r._id}>
    <div className="tracking-avatar"><Truck size={17}/></div><div className="tracking-main"><b>{r.name}</b><span>{r.type?.replaceAll('_', ' ')} • {r.status.replaceAll('_', ' ')}</span>{i && <small>{i.code} • {i.location || district}</small>}</div>
    <div className="tracking-time"><strong>{etaFor(r)}</strong><small>{t('tracking.elapsed')} {elapsed(last?.at || r.lastUpdated || r.updatedAt)}</small></div>
   </div>;
        })}</div>
  </Card>
  <Card><div className="card-head"><div><b>{t('tracking.missionTimeline')}</b><span>{t('tracking.missionTimelineSub')}</span></div></div>
   <div className="timeline-list">{data.incidents.filter(i => ['ASSIGNED', 'IN_PROGRESS', 'RESOLVED'].includes(i.status)).slice(0, 8).map(i => <div className="timeline-item" key={i._id}>
    <div className="timeline-dot"/><div><b>{i.code} · {i.status}</b><span>{i.description?.slice(0, 90) || i.type?.replaceAll('_', ' ')}</span><small>{(i.timeline || []).slice(-1)[0]?.at ? new Date((i.timeline || []).slice(-1)[0].at).toLocaleTimeString() : i.updatedAt ? new Date(i.updatedAt).toLocaleTimeString() : '—'}</small></div>
   </div>)}</div>
  </Card>
 </div></>;
}
function Shelters({ data, refresh }) {
    const { t } = useTranslation();
    const [sel, setSel] = useState(null), [add, setAdd] = useState(10);
    async function update() {
        if (!sel)
            return;
        try {
            await api('/shelters/' + sel._id, { method: 'PATCH', data: { occupancy: Math.min(sel.capacity, sel.occupancy + Number(add)) } });
            setSel(null);
            refresh();
        }
        catch { }
    }
    return <><Header state={data.district?.state} district={data.district?.name} title={t('page.shelters.title')} sub={t('page.shelters.sub')}/><div className="shelter-grid">{data.shelters.map(s => { const p = s.capacity ? Math.round(s.occupancy / s.capacity * 100) : 0; return <Card key={s._id} className="shelter"><div className="card-head"><b>{s.name}</b><span className={'status ' + s.status.toLowerCase()}>{s.status}</span></div><div className="capacity"><strong>{s.occupancy}</strong><span>/ {s.capacity} occupied • {Math.max(s.capacity - s.occupancy, 0)} free</span></div><div className="bar"><i style={{ width: Math.min(p, 100) + '%' }}/></div><div className="tags"><span>{s.food ? 'Food' : 'No food'}</span><span>{s.water ? 'Water' : 'No water'}</span><span>{s.medical ? 'Medical' : 'No medical'}</span><span>{s.accessibility ? 'Accessible' : 'Standard access'}</span></div><button className="ghost full-btn" onClick={() => setSel(s)}>Update occupancy</button></Card>; })}</div>{sel && <Modal title={`Shelter update • ${sel.name}`} onClose={() => setSel(null)}><label className="dark-label">Additional evacuees<input type="number" min="1" value={add} onChange={e => setAdd(e.target.value)}/></label><button className="primary wide" onClick={update}>Persist shelter update</button></Modal>}</>;
}
function Evacuation({ data, state, district, refresh }) {
    const { t } = useTranslation();
    const [zone, setZone] = useState(data.district?.zones?.[0] || ''), [people, setPeople] = useState(50), [shelter, setShelter] = useState(data.shelters[0]?._id || '');
    async function create() {
        try {
            await api('/evacuations/activate', { method: 'POST', data: { zone, population: Number(people), shelterId: shelter, state, district } });
            refresh();
            alert('Evacuation operation activated');
        }
        catch (e) {
            alert(e.response?.data?.message || 'Unable to create operation');
        }
    }
    return <><Header state={state} district={district} title={t('page.evacuation.title')} sub={t('page.evacuation.sub')}/><div className="evac-grid"><Card className="form-card"><div className="card-head"><b>CREATE OPERATION</b><span>Persistent MongoDB workflow</span></div><label>Affected zone<select value={zone} onChange={e => setZone(e.target.value)}>{(data.district?.zones || []).map(z => <option key={z}>{z}</option>)}</select></label><label>People to evacuate<input type="number" value={people} onChange={e => setPeople(e.target.value)}/></label><label>Target shelter<select value={shelter} onChange={e => setShelter(e.target.value)}>{data.shelters.map(s => <option key={s._id} value={s._id}>{s.name} • {Math.max(s.capacity - s.occupancy, 0)} free</option>)}</select></label><button className="primary wide" onClick={create}>Activate evacuation</button></Card><Card><div className="card-head"><b>ACTIVE OPERATIONS</b><span>{data.evacuations.length}</span></div>{data.evacuations.map(e => <div className="evac-row" key={e._id}><div><b>{e.zone}</b><span>{e.population} people • {e.status}</span></div><strong>{e.evacuated}/{e.population}</strong></div>)}</Card></div></>;
}
function Alerts({ data }) { const { t } = useTranslation(); const [filter, setFilter] = useState('ALL'); const list = data.alerts.filter(a => filter === 'ALL' || a.severity === filter); return <><Header state={data.district?.state} district={data.district?.name} title={t('page.alerts.title')} sub={t('page.alerts.sub')} action={<div className="filters">{['ALL', 'ALERT', 'WARNING', 'WATCH'].map(x => <button className={filter === x ? 'selected' : ''} key={x} onClick={() => setFilter(x)}>{x}</button>)}</div>}/><div className="feed">{list.map(a => <Card key={a._id} className="feed-card"><div className="feed-icon warn"><AlertTriangle size={20}/></div><div><div className="feed-title"><b>{a.title}</b><span className={'severity ' + (a.severity === 'ALERT' ? 'critical' : a.severity === 'WARNING' ? 'high' : 'moderate')}>{a.severity}</span><Trust type={a.sourceType} name={a.source}/></div><p>{a.description}</p><small>{a.source || 'Public source'} • issued {a.issuedAt ? new Date(a.issuedAt).toLocaleString() : 'Recent'} • expires {a.expiresAt ? new Date(a.expiresAt).toLocaleString() : '—'}</small>{a.officialUrl && <a href={a.officialUrl} target="_blank" rel="noreferrer" className="official-link">Open official source ↗</a>}</div></Card>)}</div></>; }
function Weather({ district, state }) { const { t } = useTranslation(); const [w, setW] = useState(() => makeFallbackData(state, district).weather), [err, setErr] = useState(false); useEffect(() => { api(`/weather?state=${encodeURIComponent(state)}&district=${encodeURIComponent(district)}`).then(r => setW(r.data.data || makeFallbackData(state, district).weather)).catch(() => { setErr(true); setW(makeFallbackData(state, district).weather); }); }, [state, district]); return <><Header state={state} district={district} title={t('page.weather.title')} sub={t('page.weather.sub')}/><div className="stats"><Stat label="Temperature" value={w?.temperature != null ? w.temperature + '°' : '—'} icon={CloudRain}/><Stat label="Rainfall" value={w?.rainfallMm != null ? w.rainfallMm + ' mm' : '—'} icon={Activity} tone="amber"/><Stat label="Humidity" value={w?.humidity != null ? w.humidity + '%' : '—'} icon={CloudRain}/><Stat label="Warning" value={w?.warningLevel || '—'} icon={AlertTriangle} tone="red"/></div>{err && <div className="data-banner">Weather service unavailable — cached/demo weather is used when available.</div>}<Card className="forecast"><div className="card-head"><b>7-DAY DISTRICT OUTLOOK</b><Trust type={w?.sourceType || 'DEMO'} name={w?.source || 'Open-Meteo'}/></div><div className="forecast-grid">{w?.forecast?.map(f => <div key={f.day}><b>{f.day}</b><strong>{f.rainfallMm} mm</strong><span>{f.tempMin}° — {f.tempMax}°</span><small>{f.precipitationProbability}% precipitation probability</small></div>)}</div></Card></>; }
function Simulation({ data, state, district, refresh }) {
    const { t } = useTranslation();
    const [scenario, setScenario] = useState('HEAVY_RAIN'), [result, setResult] = useState(null);
    async function run() {
        try {
            const r = await api('/simulations/run', { method: 'POST', data: { scenario, state, district } });
            setResult(r.data.data);
            refresh();
        }
        catch (e) {
            alert(e.response?.data?.message || 'Simulation failed');
        }
    }
    return <><Header state={state} district={district} title={t('page.simulation.title')} sub={t('page.simulation.sub')}/><Card className="simulation"><div className="simulation-banner"><FlaskConical size={17}/><b>SIMULATION MODE</b><span>No simulation output changes live operational records.</span></div><div className="scenario-grid">{[['HEAVY_RAIN', 'Heavy rain'], ['ROAD_BLOCK', 'Road blocked'], ['SHELTER_CAPACITY', 'Shelter capacity pressure']].map(([k, t]) => <button key={k} onClick={() => setScenario(k)} className={scenario === k ? 'selected' : ''}><FlaskConical size={18}/><b>{t}</b><span>Test district response impact</span></button>)}</div><button className="primary" onClick={run}>Run scenario</button>{result && <div className="before-after"><SimPanel title="BEFORE" x={result.beforeState}/><SimPanel title="AFTER" x={result.afterState} after/></div>}</Card></>;
}
function SimPanel({ title, x, after }) { return <div className={after ? 'after' : ''}><small>{title}</small><b>Operational picture</b><div className="sim-metrics"><span>Incidents <strong>{x.activeIncidents}</strong></span><span>Critical <strong>{x.critical}</strong></span><span>Available units <strong>{x.availableResources}</strong></span><span>Shelter load <strong>{x.shelterOccupancy}%</strong></span><span>Blocked roads <strong>{x.blockedRoads}</strong></span></div></div>; }
function Analytics({ data, state, district }) { const { t } = useTranslation(); const byType = Object.entries(data.incidents.reduce((a, i) => (a[i.type] = (a[i.type] || 0) + 1, a), {})).map(([name, value]) => ({ name: name.replaceAll('_', ' '), value })); const bySeverity = Object.entries(data.incidents.reduce((a, i) => (a[i.severity] = (a[i.severity] || 0) + 1, a), {})).map(([name, value]) => ({ name, value })); const util = data.resources.map(r => ({ name: r.type, value: r.status === 'AVAILABLE' ? 1 : 0 })).reduce((a, x) => (a[x.name] = (a[x.name] || 0) + x.value, a), {}); const utilData = Object.entries(util).map(([name, value]) => ({ name: name.replaceAll('_', ' '), value })); return <><Header state={state} district={district} title={t('page.analytics.title')} sub={t('page.analytics.sub')}/><div className="chart-grid"><Card className="chart-card"><div className="card-head"><b>INCIDENTS BY TYPE</b><span>{data.incidents.length} records</span></div><ResponsiveContainer width="100%" height={280}><BarChart data={byType}><XAxis dataKey="name" angle={-25} textAnchor="end" height={80} tick={{ fontSize: 9 }}/><YAxis tick={{ fontSize: 9 }}/><Tooltip /><Bar dataKey="value"/></BarChart></ResponsiveContainer></Card><Card className="chart-card"><div className="card-head"><b>SEVERITY DISTRIBUTION</b></div><ResponsiveContainer width="100%" height={280}><PieChart><Pie data={bySeverity} dataKey="value" nameKey="name" outerRadius={90} label>{bySeverity.map((_, i) => <Cell key={i}/>)}</Pie><Tooltip /></PieChart></ResponsiveContainer></Card><Card className="chart-card"><div className="card-head"><b>AVAILABLE ASSETS BY TYPE</b></div><ResponsiveContainer width="100%" height={280}><BarChart data={utilData}><XAxis dataKey="name" tick={{ fontSize: 9 }}/><YAxis tick={{ fontSize: 9 }}/><Tooltip /><Bar dataKey="value"/></BarChart></ResponsiveContainer></Card></div></>; }
function Copilot({ state, district }) {
    const { t } = useTranslation();
    const [q, setQ] = useState('What requires immediate attention?'), [ans, setAns] = useState(null), [busy, setBusy] = useState(false);
    async function ask() {
        setBusy(true);
        try {
            const r = await api('/ai/copilot', { method: 'POST', data: { question: q, state, district } });
            setAns(r.data.data);
        }
        catch {
            setAns({ answer: 'AI unavailable. Review the critical queue, active alerts, river situation and available resources.', actions: [] });
        }
        finally {
            setBusy(false);
        }
    }
    return <><Header state={state} district={district} title={t('page.copilot.title')} sub={t('page.copilot.sub')}/><Card className="copilot"><div className="ask"><input value={q} onChange={e => setQ(e.target.value)}/><button className="primary" onClick={ask}>{busy ? 'Thinking…' : 'Ask Copilot'}</button></div><div className="suggestions">{['What requires immediate attention?', 'Which zone is worst affected?', 'Which shelter has capacity?', 'Which resources are available?', 'Summarize current situation.', 'Generate SITREP.'].map(x => <button key={x} onClick={() => setQ(x)}>{x}</button>)}</div>{ans && <div className="ai-answer"><span>DATABASE-GROUNDED RESPONSE</span><p>{ans.answer}</p>{ans.actions?.map((a, i) => <div key={i}>→ {a}</div>)}</div>}</Card></>;
}
function Reports({ data, state, district }) {
    const { t } = useTranslation();
    const [report, setReport] = useState('');
    const [busy, setBusy] = useState(false);
    async function gen() {
        setBusy(true);
        try {
            const r = await api('/ai/sitrep', { method: 'POST', data: { state, district, context: { incidents: data.incidents, resources: data.resources, shelters: data.shelters, alerts: data.alerts, roads: data.roads, evacuations: data.evacuations, gauges: data.gauges } } });
            setReport(r.data.data?.report || '');
        }
        catch (e) {
            const fallback = `RAHATSETU DISTRICT SITUATION REPORT\n\nDistrict: ${district}, ${state}\nGenerated: ${new Date().toLocaleString()}\n\nActive incidents: ${data.incidents.filter(x => !['RESOLVED', 'REJECTED'].includes(x.status)).length}\nCritical incidents: ${data.incidents.filter(x => x.severity === 'CRITICAL').length}\nAvailable resources: ${data.resources.filter(x => x.status === 'AVAILABLE').length}/${data.resources.length}\nShelter occupancy: ${(() => { const o = data.shelters.reduce((a, x) => a + x.occupancy, 0), c = data.shelters.reduce((a, x) => a + x.capacity, 0); return c ? Math.round(o / c * 100) : 0; })()}%`;
            setReport(fallback);
        }
        finally {
            setBusy(false);
        }
    }
    function genLegacy() { const critical = data.incidents.filter(x => x.severity === 'CRITICAL').length; const occupied = data.shelters.reduce((a, x) => a + x.occupancy, 0), cap = data.shelters.reduce((a, x) => a + x.capacity, 0); setReport(`RAHATSETU DISTRICT SITUATION REPORT\n\nDistrict: ${district}, ${state}\nGenerated: ${new Date().toLocaleString()}\nSource posture: ${data.alerts.some(a => a.sourceType === 'OFFICIAL') ? 'OFFICIAL + CACHED + DEMO' : 'CACHED / DEMO FALLBACK'}\n\nFLOOD SITUATION\nRiver: ${data.gauges?.[0]?.river || 'Brahmaputra'}\nGauge: ${data.gauges?.[0]?.station || '—'}\nTrend: ${data.gauges?.[0]?.trend || '—'}\nStatus: ${data.gauges?.[0]?.floodStatus || '—'}\n\nINCIDENTS\nActive: ${data.incidents.filter(x => !['RESOLVED', 'REJECTED'].includes(x.status)).length}\nCritical: ${critical}\nHigh/Critical: ${data.incidents.filter(x => ['HIGH', 'CRITICAL'].includes(x.severity)).length}\n\nRESOURCES\nAvailable: ${data.resources.filter(x => x.status === 'AVAILABLE').length}/${data.resources.length}\n\nSHELTERS\nOccupancy: ${cap ? Math.round(occupied / cap * 100) : 0}%\nOpen shelters: ${data.shelters.filter(x => x.status !== 'CLOSED').length}\n\nROAD NETWORK\nBlocked/flooded: ${data.roads.filter(x => x.status !== 'OPEN').length}\n\nIMMEDIATE ACTION\n1. Review critical incidents and vulnerable-person flags.\n2. Maintain boat/ambulance readiness.\n3. Monitor river trend and blocked access.\n4. Recheck shelter capacity before activating evacuation.\n\nDATA NOTE\nOfficial, cached, community and demo records are labelled in RahatSetu. This report does not convert demo records into government facts.`); }
    return <><Header state={state} district={district} title={t('page.reports.title')} sub={t('page.reports.sub')} action={<button className="primary" onClick={gen}><FileText size={16}/> Generate SITREP</button>}/><Card className="report"><textarea value={report} readOnly placeholder="Generate a district situation report…"/></Card></>;
}
function Modal({ title, onClose, children }) { return <div className="modal-backdrop" onClick={onClose}><div className="modal" onClick={e => e.stopPropagation()}><div className="modal-head"><b>{title}</b><button onClick={onClose}><X /></button></div>{children}</div></div>; }
function Contacts({ data, state, district }) { const { t } = useTranslation(); return <><Header state={state} district={district} title={t('page.contacts.title')} sub={t('page.contacts.sub')}/><div className="contact-grid">{(data.emergencyContacts || []).map(c => <Card className="contact-card" key={c.phone + c.name}><div className="feed-icon"><Phone /></div><div><b>{c.name}</b><span>{c.category}</span></div><a href={`tel:${c.phone}`} aria-label={`Call ${c.name}`}>{c.phone}</a></Card>)}</div><div className="data-banner"><AlertTriangle size={15}/> Numbers without verified government-source metadata are demonstration contacts. Do not treat them as official local numbers.</div></>; }
function Safety({ state, district }) {
    const { t } = useTranslation();
    const sections = [
        ['During a Flood', Activity, ['Never cross flooded roads — fast-moving water can knock you down.', 'Move to higher ground immediately. Go to the highest floor of a pucca building.', 'Stay away from power lines. Water conducts electricity; report outages to APDCL at 1912.', 'Watch for snakes and insects displaced by floodwater. Wear boots and seek medical care for bites.']],
        ['Food & Water Safety', CloudRain, ['Drink only sealed, boiled or otherwise safe water.', 'Discard food that has touched floodwater or has been left unrefrigerated for too long.', 'Keep drinking water covered and use clean containers.', 'Wash hands with soap or sanitizer before handling food.']],
        ['After the Flood', CheckCircle2, ['Return only after authorities confirm the area is safe.', 'Avoid floodwater that may be contaminated or electrically live.', 'Check gas, electricity and structural damage before re-entry.', 'Report damaged infrastructure and medical emergencies through RahatSetu.']],
        ['Preparedness Kit', ShieldAlert, ['Keep ID documents, medicines and emergency contacts in a waterproof bag.', 'Carry a torch, power bank, first-aid kit and whistle.', 'Keep at least 3 days of drinking water and dry food.', 'Know your nearest shelter and an alternate evacuation route.']]
    ];
    const [open, setOpen] = useState(0);
    return <><Header state={state} district={district} title="Flood Safety Guidelines" sub="Evidence-based safety guidance from NDMA and Assam SDMA."/><div className="safety-accordion-list">{sections.map(([title, Icon, items], idx) => <Card key={title} className={'safety-accordion-card ' + (open === idx ? 'is-open' : '')}><button className="safety-accordion-head" onClick={() => setOpen(open === idx ? -1 : idx)}><span>{title}</span><b>{open === idx ? '−' : '+'}</b></button>{open === idx && <div className="safety-accordion-body">{items.map((item,i)=><div className="safety-guideline" key={item}><span className="safety-guideline-icon"><Icon size={17}/></span><div><b>{item.split(' — ')[0].split('. ')[0]}</b><p>{item.includes(' — ') ? item.split(' — ').slice(1).join(' — ') : item}</p></div></div>)}</div>}</Card>)}</div></>;
}
function NotificationDrawer({ open, notifications, onClose }) {
    if (!open)
        return null;
    return <><div className="drawer-backdrop" onClick={onClose}/><aside className="notification-drawer" aria-label="Notification center"><div className="drawer-head"><div><b>Notification Center</b><span>Live operational signals</span></div><button onClick={onClose} aria-label="Close notifications"><X /></button></div>{notifications.length ? notifications.map((n, i) => <div className="notification-item" key={i}><div className="notif-icon"><Bell size={15}/></div><div><b>{n.title || n.type || 'Operational update'}</b><span>{n.message || n.description || 'A district operational record was updated.'}</span><small>{n.district || 'Selected district'}</small></div></div>) : <div className="empty-large"><Bell size={28}/><h3>No new notifications</h3><p>Critical incidents, dispatches, alerts and shelter warnings will appear here.</p></div>}</aside></>;
}
function Citizen({ user, state, setState, district, setDistrict, onLogout, onAdminLogin }) {
    const { i18n, t } = useTranslation();
    const [data, setData] = useState(() => makeFallbackData(state, district)), [page, setPage] = useState('home'), [side, setSide] = useState(false), [reports, setReports] = useState([]), [modal, setModal] = useState(false), [status, setStatus] = useState(null), [geo, setGeo] = useState(null), [loading, setLoading] = useState(true), [shelterInfo, setShelterInfo] = useState(null);
    const [shelterSearch, setShelterSearch] = useState('');
    const [form, setForm] = useState({ type: 'PERSON_TRAPPED', description: '', peopleAffected: 1, elderly: false, children: false, disabled: false, medicalNeed: false, latitude: '', longitude: '' });
    const load = async () => {
        setLoading(true);
        try {
            const r = await api(`/dashboard?state=${encodeURIComponent(state)}&district=${encodeURIComponent(district)}`);
            const fallback = makeFallbackData(state, district);
            const payload = r.data.data;
            setData(payload?.district?.state === state && payload?.district?.name === district ? payload : fallback);
            const rr = await api('/reports');
            setReports(rr.data.data || []);
        }
        catch { }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        load();
        const s = io(BASE);
        s.on('incident:new', p => {
            if (p?.district === district)
                load();
        });
        s.on('alert:new', load);
        s.on('shelter:updated', load);
        s.on('evacuation:updated', load);
        return () => s.disconnect();
    }, [state, district]);
    function locate() {
        if (!navigator.geolocation)
            return alert('Location services are not available in this browser.');
        navigator.geolocation.getCurrentPosition(p => { const lat = p.coords.latitude.toFixed(6), lng = p.coords.longitude.toFixed(6); setGeo({ lat: +lat, lng: +lng }); setForm(f => ({ ...f, latitude: lat, longitude: lng })); }, () => alert('Could not read your location. Please allow location access.'), { enableHighAccuracy: true, timeout: 10000 });
    }
    async function submit(e) {
        e.preventDefault();
        try {
            const r = await api('/citizen-reports', { method: 'POST', data: { ...form, state, district, rawText: form.description } });
            setStatus(r.data.data);
            setModal(false);
            setPage('reports');
            setForm({ type: 'PERSON_TRAPPED', description: '', peopleAffected: 1, elderly: false, children: false, disabled: false, medicalNeed: false, latitude: form.latitude, longitude: form.longitude });
            await load();
        }
        catch (err) {
            alert(err.response?.data?.message || 'Unable to submit emergency report');
        }
    }
    const navItems = [['home', 'nav.home', LayoutDashboard], ['map', 'nav.map', MapIcon], ['tracking', 'nav.tracking', Radio], ['shelters', 'nav.shelters', Warehouse], ['emergency', 'nav.emergency', Siren], ['evacuation', 'nav.evacuation', RouteIcon], ['weather', 'nav.weather', CloudRain], ['alerts', 'nav.alerts', ShieldAlert], ['reports', 'nav.myReports', CheckCircle2], ['contacts', 'nav.contacts', Phone], ['safety', 'nav.safety', ShieldAlert]];
    const availableShelters = data.shelters.filter(s => s.status !== 'CLOSED').sort((a, b) => (b.capacity - b.occupancy) - (a.capacity - a.occupancy));
    function CitizenTracking({ data, reports, t }) {
        const [, tick] = useState(0);
        useEffect(() => { const id = setInterval(() => tick(x => x + 1), 1000); return () => clearInterval(id); }, []);
        const active = data.incidents.filter(i => ['ASSIGNED', 'IN_PROGRESS'].includes(i.status));
        return <><Header state={data.district?.state} district={data.district?.name} title={t('citizen.tracking.title')} sub={t('citizen.tracking.sub')}/>
 <div className="tracking-grid citizen-tracking">
  <Card><div className="card-head"><div><b>{t('citizen.tracking.myReports')}</b><span>{t('citizen.tracking.myReportsSub')}</span></div></div>
   {(reports || []).length ? (reports.slice(0, 8).map(r => <div className="citizen-track-row" key={r._id}><div className="tracking-avatar"><Siren size={16}/></div><div><b>{r.incident?.code || r.incidentType || 'Emergency report'}</b><span>{r.status || r.incident?.status || 'SUBMITTED'} • {r.district}</span><small>{r.createdAt ? new Date(r.createdAt).toLocaleString() : '—'}</small></div><strong>{r.status === 'RESOLVED' ? t('tracking.resolved') : t('tracking.monitoring')}</strong></div>)) : active.slice(0, 6).map(i => <div className="citizen-track-row" key={i._id}><div className="tracking-avatar"><Siren size={16}/></div><div><b>{i.code}</b><span>{i.status} • {i.location || data.district?.name}</span><small>{(i.timeline || []).slice(-1)[0]?.at ? new Date((i.timeline || []).slice(-1)[0].at).toLocaleString() : '—'}</small></div><strong>{t('tracking.monitoring')}</strong></div>)}
   {!(reports || []).length && !active.length && <div className="empty-large"><Clock3 size={28}/><h3>{t('citizen.tracking.empty')}</h3><p>{t('citizen.tracking.emptySub')}</p></div>}
  </Card>
  <Card className="rescue-eta-card"><div className="card-head"><div><b>{t('citizen.tracking.rescueStatus')}</b><span>{t('citizen.tracking.rescueStatusSub')}</span></div><span className="live">{t('common.live')}</span></div>
   {data.resources.filter(r => r.status === 'EN_ROUTE' || r.status === 'BUSY').slice(0, 6).map(r => { const base = data.district?.center; const km = haversineKm(base?.lat, base?.lng, r.latitude, r.longitude); const mins = etaMinutes(km, r.type === 'BOAT' ? 14 : 24); return <div className="citizen-track-row rescue-row" key={r._id}><div className="tracking-avatar"><Truck size={16}/></div><div><b>{r.name}</b><span>{r.type?.replaceAll('_', ' ')} • {r.status.replaceAll('_', ' ')}</span><small>{t('tracking.updatedContinuously')}</small></div><div className="rescue-eta"><strong>{km != null ? km.toFixed(1) + ' km' : '—'}</strong><span>ETA ~{mins ?? '—'} min</span></div></div>; })}
   {!data.resources.some(r => ['EN_ROUTE', 'BUSY'].includes(r.status)) && <div className="empty-large"><CheckCircle2 size={28}/><h3>{t('citizen.tracking.noActive')}</h3><p>{t('citizen.tracking.noActiveSub')}</p></div>}
  </Card>
 </div></>;
    }
    function View() {
        if (page === 'tracking')
            return <CitizenTracking data={data} reports={reports} t={t}/>;
        if (page === 'map')
            return <><Header state={state} district={district} title={t('citizen.map.title')} sub="India is the default view. Select a state to zoom into local response activity."/><Card className="map-full india-map-page"><IndiaOverviewMap state={state} district={district} onStateSelect={s => { setState(s); setDistrict(STATES[s][0]); }}/></Card></>;
        if (page === 'shelters') {
            const filteredShelters = availableShelters.filter(s => `${s.name} ${s.district || district}`.toLowerCase().includes(shelterSearch.toLowerCase()));
            return <><Header state={state} district={district} title="Evacuation Shelters" sub="Find available relief shelters near you."/><div className="shelter-directory-toolbar"><div className="shelter-search"><Search size={16}/><input value={shelterSearch} onChange={e => setShelterSearch(e.target.value)} placeholder="Search shelter name or area..."/></div><div className="shelter-legend"><span><i className="open-dot"/> Available</span><span><i className="full-dot"/> Full</span></div></div><div className="shelter-directory-list">{filteredShelters.map(s => { const pct=Math.min(100,Math.round(s.occupancy/s.capacity*100)); const isFull=s.status==='FULL'; const amenities=[['Food',s.food],['Water',s.water],['Medical',s.medical],['Toilets',true],['WiFi',s.accessibility]]; return <Card className="directory-shelter-card" key={s._id}><div className="directory-shelter-top"><div><div className="directory-shelter-name"><b>{s.name}</b><span className={'directory-status '+(isFull?'full':'open')}>{isFull?'FULL':'OPEN'}</span><em>{s.type || (s.accessibility ? 'Government' : 'Relief')}</em></div><small><MapPinned size={13}/> {s.district || district} • {Math.max(0.4, haversineKm(geo?.lat ?? data.district?.center?.lat, geo?.lng ?? data.district?.center?.lng, s.latitude, s.longitude) || 0.8).toFixed(1)} km away</small></div>{isFull ? <button className="directory-disabled" disabled>Full</button> : <a className="directory-directions" href={gmapsDirections(s.latitude,s.longitude,geo?.lat,geo?.lng)} target="_blank" rel="noreferrer"><Navigation size={15}/> Get Directions</a>}</div><div className="directory-occupancy"><div><span>Occupancy</span><b>{s.occupancy}/{s.capacity}</b><strong>{pct}%</strong></div><div className="directory-bar"><i className={pct>=95?'full':pct>=75?'high':'open'} style={{width:pct+'%'}}/></div></div><div className="directory-tags">{amenities.filter(x=>x[1]).map(([label])=><span key={label}>{label}</span>)}</div></Card>})}{!filteredShelters.length && <div className="empty-large"><Warehouse size={30}/><h3>No shelters found</h3><p>Try another shelter name or area.</p></div>}</div>{shelterInfo && <Modal title={shelterInfo.name} onClose={() => setShelterInfo(null)}><div className="shelter-detail-modal"><div className="detail-kpis"><div><small>Capacity</small><b>{shelterInfo.capacity}</b></div><div><small>Occupied</small><b>{shelterInfo.occupancy}</b></div><div><small>Available</small><b>{Math.max(shelterInfo.capacity-shelterInfo.occupancy,0)}</b></div></div></div></Modal>}</>;
        }
        if (page === 'emergency') {
            const contacts = [
                {group:'NATIONAL EMERGENCY', items:[['National Emergency','Police, Fire, Ambulance — 24/7','112'],['NDMA Helpline','National Disaster Management Authority','1078'],['Indian Red Cross','Free helpline — disaster relief','1800-180-3400']]},
                {group:`STATE — ${state.toUpperCase()}`, items:[[`${state} SDMA`,'State Disaster Management Authority',state==='Assam'?'1070':'1078'],[`${state} SDRF`,'State Disaster Response Force',state==='Assam'?'0361-2237273':'112'],[`${state} State Emergency`,'District / state emergency control room',state==='Assam'?'0361-2237221':'112']]},
                {group:`${district.toUpperCase()} DISTRICT`, items:[[`DC Office ${district}`,'District Collector — 24/7 flood control',state==='Assam'?'0373-2322321':'112'],[`${district} Police`,'District SP office',state==='Assam'?'0373-2324624':'112'],[`${district} Civil Hosp.`,'Nearest major government hospital',state==='Assam'?'0373-2322020':'108']]},
                {group:'ESSENTIAL SERVICES', items:[['Fire & Rescue','Fire and rescue services','101'],['Ambulance','Free ambulance service — '+state,'108'],['Power','Electricity disruption & downed lines','1912']]}
            ];
            return <><Header state={state} district={district} title="Emergency Contact Directory" sub="Verified numbers for national, state, and district emergency services."/><div className="emergency-directory-grid">{contacts.map(group => <Card className="emergency-directory-card" key={group.group}><div className="directory-group-title">{group.group}</div>{group.items.map(([name,desc,phone])=><div className="directory-contact-row" key={name}><div><b>{name}</b><span>{desc}</span></div><a href={`tel:${phone.replace(/[^0-9+]/g,'')}`}>{phone}</a></div>)}</Card>)}</div></>;
        }
        if (page === 'evacuation') {
            const originLat = geo?.lat, originLng = geo?.lng, baseLat = originLat ?? data.district?.center?.lat, baseLng = originLng ?? data.district?.center?.lng;
            const routes = availableShelters.slice(0, 6).map(s => { const km = haversineKm(baseLat, baseLng, s.latitude, s.longitude); const mins = etaMinutes(km, 26); const badge = s.status === 'FULL' ? 'CAUTION' : s.status === 'NEAR_CAPACITY' ? 'CAUTION' : 'OPEN'; return { s, km, mins, badge }; });
            return <><Header state={state} district={district} title={t('citizen.evacuation.title')} sub={t('citizen.evacuation.sub')}/><div className="evac-grid"><Card className="form-card"><div className="card-head"><b>REQUEST EVACUATION</b><span>Creates a citizen emergency request</span></div><label>People needing evacuation<input id="evacPeople" type="number" min="1" defaultValue="1"/></label><label>Special needs<select id="evacNeed"><option>None</option><option>Elderly person</option><option>Children</option><option>Disability / mobility assistance</option><option>Medical emergency</option></select></label><button className="primary wide" onClick={() => { const people = Number(document.getElementById('evacPeople').value || 1), need = document.getElementById('evacNeed').value; setForm(f => ({ ...f, type: 'EVACUATION_REQUEST', description: `Evacuation requested for ${people} people. Special need: ${need}.`, peopleAffected: people })); setModal(true); }}><RouteIcon size={15}/> Submit evacuation request</button></Card><Card><div className="card-head"><b>PUBLIC EVACUATION STATUS</b><span>{data.evacuations.length} active operations</span></div>{data.evacuations.length ? data.evacuations.map(e => <div className="evac-row" key={e._id}><div><b>{e.zone}</b><span>{e.population} people • {e.status}</span></div><strong>{e.evacuated || 0}/{e.population}</strong></div>) : <div className="empty-large"><RouteIcon size={28}/><h3>No public evacuation operation</h3><p>If you are in immediate danger, call 112 and use the emergency report.</p></div>}</Card></div><Card className="routes-card"><div className="card-head"><div><b>EVACUATION ROUTES &amp; GUIDANCE</b><span>Estimated distance and time to the nearest open shelters{!geo ? ' (using district centre — enable GPS for your exact route)' : ''}</span></div>{!geo && <button className="ghost small" onClick={locate}><Navigation size={13}/> Use my location</button>}</div><div className="route-list">{routes.map(({ s, km, mins, badge }) => <div className="route-card" key={s._id}><div className="route-top"><div><b>{s.name}</b><span className={'route-badge ' + badge.toLowerCase()}>{badge}</span></div><div className="route-meta">{km != null ? `${km.toFixed(1)} km` : '—'} • ~{mins ?? '—'} min</div></div><div className="route-path"><div><small>FROM</small><span>{geo ? 'Your location' : district + ' centre'}</span></div><RouteIcon size={13} className="route-arrow"/><div><small>TO</small><span className="route-dest">{s.name}</span></div></div><a className="primary route-directions-btn" href={gmapsDirections(s.latitude, s.longitude, originLat, originLng)} target="_blank" rel="noreferrer"><Navigation size={13}/> Open route in Google Maps</a></div>)}</div></Card><Card className="evac-checklist-card"><div className="card-head"><b>BEFORE YOU EVACUATE</b></div><div className="checklist"><p><CheckCircle2 size={14}/> Carry Aadhaar card, medicines, phone charger and 3 days of food/water.</p><p><CheckCircle2 size={14}/> Turn off gas, electricity and water supply before leaving.</p><p><CheckCircle2 size={14}/> Inform a family member or neighbour of your destination shelter.</p><p><CheckCircle2 size={14}/> Do not attempt to drive through water deeper than the bottom of your car door.</p></div></Card></>;
        }
        if (page === 'weather')
            return <Weather state={state} district={district}/>;
        if (page === 'alerts')
            return <><Header state={state} district={district} title={t('page.alerts.title')} sub={t('citizen.alerts.sub')}/><div className="feed">{data.alerts.length ? data.alerts.map(a => <Card key={a._id} className="feed-card"><div className="feed-icon warn"><AlertTriangle size={20}/></div><div><div className="feed-title"><b>{a.title}</b><Trust type={a.sourceType} name={a.source}/></div><p>{a.description}</p><small>{a.issuedAt ? new Date(a.issuedAt).toLocaleString() : 'Recent'} {a.expiresAt ? '• expires ' + new Date(a.expiresAt).toLocaleString() : ''}</small>{a.officialUrl && <a href={a.officialUrl} target="_blank" rel="noreferrer" className="official-link">Open official source ↗</a>}</div></Card>) : <div className="empty-large">No active alert records.</div>}</div></>;
        if (page === 'reports')
            return <><Header state={state} district={district} title={t('citizen.reports.title')} sub={t('citizen.reports.sub')}/><Card className="my-reports">{reports.length ? reports.map(r => <div className="evac-row" key={r._id}><div><b>{r.incident?.code || 'RahatSetu report'}</b><span>{(r.incident?.type || r.incidentType || 'OTHER').replaceAll('_', ' ')} • {r.status}</span><small>{r.createdAt ? new Date(r.createdAt).toLocaleString() : ''}</small></div><strong>{r.incident?.severity || '—'}</strong></div>) : <div className="empty-large"><CheckCircle2 size={30}/><h3>No reports yet</h3><p>Your emergency reports will appear here with their current verification status.</p></div>}</Card></>;
        if (page === 'safety')
            return <Safety data={data} state={state} district={district}/>;
        if (page === 'contacts')
            return <><Header state={state} district={district} title={t('page.contacts.title')} sub={t('citizen.contacts.sub')}/><div className="contacts-premium-grid"><Card className="danger-hero-card"><div className="danger-hero-top"><i className="danger-dot"/> IMMEDIATE DANGER?</div><p>If you are in immediate life-threatening danger, call emergency services now.</p><a className="danger-call-btn" href="tel:112"><Phone size={16}/> Call 112</a></Card><Card className="quick-contacts-card"><div className="card-head"><b>QUICK CONTACTS</b><span>Tap a number to call directly</span></div><div className="quick-contacts-list">{(data.emergencyContacts || []).map(c => <div className="quick-contact-row" key={'q' + c.phone + c.name}><span>{c.name}</span><a href={`tel:${c.phone}`}>{c.phone}</a></div>)}<div className="quick-contact-row"><span>Fire &amp; Rescue</span><a href="tel:101">101</a></div><div className="quick-contact-row"><span>NDMA Helpline</span><a href="tel:1078">1078</a></div></div></Card></div><div className="contact-grid premium">{(data.emergencyContacts || []).map(c => <Card className="contact-card premium" key={'g' + c.phone + c.name}><div className="feed-icon"><Phone size={17}/></div><div><b>{c.name}</b><span>{c.category}</span></div><a className="contact-call-btn" href={`tel:${c.phone}`}><Phone size={12}/> Call</a></Card>)}</div><div className="data-banner"><AlertTriangle size={15}/> Numbers without verified government-source metadata are demonstration contacts. Do not treat them as official local numbers.</div></>;
        return <><div className="citizen-title"><div><div className="eyebrow dark">NATIONAL PUBLIC SAFETY</div><h1>{t('citizen.home.title')}</h1><p>{t('citizen.home.sub')} <b>{district}</b>.</p></div><button className="emergency" onClick={() => setModal(true)}><Siren size={18}/> REPORT EMERGENCY</button></div><div className="citizen-home-grid"><Card className="citizen-map india-card"><IndiaOverviewMap state={state} district={district} onStateSelect={s => { setState(s); setDistrict(STATES[s][0]); }}/></Card><div className="citizen-home-side"><Card><div className="card-head"><b>FLOOD SITUATION</b><Trust type={data.weather?.sourceType || 'DEMO'} name={data.weather?.source || 'Weather'}/></div><div className="public-situation"><strong>{data.weather?.warningLevel || 'WATCH'}</strong><span>{data.weather?.condition || 'Weather information available'}</span><small>{data.weather?.rainfallMm ?? 0} mm rainfall • {data.weather?.precipitationProbability ?? 0}% precipitation probability</small></div></Card><Card><div className="card-head"><b>ACTIVE WARNINGS</b><span>{data.alerts.length} records</span></div>{data.alerts.slice(0, 3).map(a => <div className="public-alert" key={a._id}><div className="feed-title"><b><AlertTriangle size={13} className="warn-glyph"/> {a.title}</b><Trust type={a.sourceType} name={a.source}/></div><p>{a.description}</p></div>)}</Card><Card className="fast-actions-card"><div className="card-head"><b>FAST ACTIONS</b></div><div className="citizen-actions"><button onClick={() => setPage('shelters')}><Warehouse /> Find shelter</button><button onClick={() => setPage('evacuation')}><RouteIcon /> Evacuation</button><button onClick={() => setPage('weather')}><CloudRain /> Weather</button><button onClick={() => setPage('contacts')}><Phone /> Emergency</button></div></Card></div></div><Card className="safety-row"><div className="card-head"><b>EMERGENCY REPORT</b><span>GPS + incident facts go to the response verification queue</span></div><div className="report-options"><button onClick={locate}><Navigation /><b>Use my location</b><span>{geo ? `${geo.lat}, ${geo.lng}` : 'Capture GPS coordinates'}</span></button><button onClick={() => setModal(true)}><Camera /><b>Add evidence / report</b><span>Describe trapped people, medical need, flooding or damage</span></button><button onClick={() => setPage('reports')}><CheckCircle2 /><b>Track my reports</b><span>{reports.length} submitted reports</span></button></div></Card></>;
    }
    return <div className="citizen-shell"><header className="citizen-top"><div className="brand"><button className="mobile-btn citizen-menu" onClick={() => setSide(!side)}>{side ? <X /> : <Menu />}</button><div className="tricolor"><span /><span /><span /></div><div><div className="brand-name">RAHATSETU</div><div className="brand-sub">PUBLIC SAFETY • {district}</div></div></div><div className="gov-selects"><span className="india-nav-label">INDIA</span><select value={state} onChange={e => { setState(e.target.value); setDistrict(STATES[e.target.value][0]); }}>{Object.keys(STATES).sort().map(s => <option key={s}>{s}</option>)}</select><select value={district} onChange={e => setDistrict(e.target.value)}>{STATES[state].map(d => <option key={d}>{d}</option>)}</select></div><div className="top-actions"><span className="live"><i /> PUBLIC SAFETY</span><label className="language-select"><span>文</span><select value={i18n.language} onChange={e => { i18n.changeLanguage(e.target.value); localStorage.setItem('fg-language', e.target.value); document.documentElement.lang = e.target.value; }} aria-label={t("common.language")}>{LANGUAGES.map(([code, name]) => <option key={code} value={code}>{name}</option>)}</select></label><button className="admin-login-nav" onClick={onAdminLogin}>Administration Login</button><b>{user.name}</b><button onClick={onLogout}><LogOut size={17}/></button></div></header><div className="citizen-workspace"><aside className={'citizen-sidebar ' + (side ? 'show' : '')}><div className="citizen-side-title">{state.toUpperCase()} • {district.toUpperCase()}</div>{navItems.map(([key, label, Icon]) => <button key={key} className={page === key ? 'active' : ''} onClick={() => { setPage(key); setSide(false); }}><Icon size={17}/><span>{t(label)}</span>{key === 'reports' && reports.length > 0 && <em>{reports.length}</em>}</button>)}<div className="citizen-side-emergency"><b>Emergency</b><span>Immediate danger</span><a href="tel:112"><Phone size={14}/> Call 112</a></div><button className="citizen-admin-side" onClick={onAdminLogin}><ShieldAlert size={16}/><span>Administration Login</span></button><div className="side-foot"><small>Public information only. Sensitive district operational data is not shown.</small></div></aside><main className="citizen-main citizen-content">{loading && !data.district ? <Loading /> : <>{View()}</>}</main></div><nav className="citizen-bottom-nav"><button className={page === 'home' ? 'active' : ''} onClick={() => setPage('home')}><LayoutDashboard size={19}/><span>Home</span></button><button className={page === 'map' ? 'active' : ''} onClick={() => setPage('map')}><MapIcon size={19}/><span>Map</span></button><button className="bottom-nav-sos" onClick={() => setModal(true)}><Siren size={20}/><span>SOS</span></button><button className={page === 'shelters' ? 'active' : ''} onClick={() => setPage('shelters')}><Warehouse size={19}/><span>Shelters</span></button><button onClick={() => setSide(true)}><Menu size={19}/><span>More</span></button></nav>{modal && <Modal title="Emergency / evacuation report" onClose={() => setModal(false)}><form onSubmit={submit} className="report-form"><label>Incident type<select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>{['PERSON_TRAPPED', 'MEDICAL_EMERGENCY', 'FLOODED_HOUSE', 'ROAD_BLOCKED', 'WATERLOGGING', 'MISSING_PERSON', 'EVACUATION_REQUEST', 'OTHER'].map(x => <option key={x}>{x}</option>)}</select></label><label>Description<textarea value={form.description} required onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Example: 6 people trapped, elderly person needs medicine…"/></label><label>People affected<input type="number" min="1" value={form.peopleAffected} onChange={e => setForm(f => ({ ...f, peopleAffected: e.target.value }))}/></label><div className="checks">{[['elderly', 'Elderly'], ['children', 'Children'], ['disabled', 'Disability / access need'], ['medicalNeed', 'Medical emergency']].map(([k, l]) => <label key={k}><input type="checkbox" checked={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.checked }))}/>{l}</label>)}</div><div className="location-row"><button type="button" className="ghost" onClick={locate}><Navigation size={14}/> Use GPS</button><span>{form.latitude ? `${form.latitude}, ${form.longitude}` : 'Location not captured — district centre will be used'}</span></div><button className="primary wide">Submit emergency report</button></form></Modal>}{status && <div className="citizen-toast"><CheckCircle2 size={17}/><div><b>Report received • {status.incident.code}</b><span>{status.incident.severity} priority • verification status: UNVERIFIED</span></div><button onClick={() => setStatus(null)}><X size={14}/></button></div>}</div>;
}
function Field({ user, state, district, onLogout }) {
    const { t } = useTranslation();
    const [data, setData] = useState(() => makeFallbackData(state, district)), [route, setRoute] = useState(null);
    useEffect(() => { load(); }, [state, district]);
    async function load() {
        try {
            const r = await api(`/dashboard?state=${state}&district=${district}`);
            setData(r.data.data || makeFallbackData(state, district));
        }
        catch {
            setData(makeFallbackData(state, district));
        }
    }
    const mine = data.incidents.filter(x => ['ASSIGNED', 'IN_PROGRESS'].includes(x.status));
    async function setStatus(id, status) { await api('/incidents/' + id, { method: 'PATCH', data: { status } }); load(); }
    return <div className="field-shell"><header className="citizen-top"><div className="brand"><div className="tricolor"><span /><span /><span /></div><div><div className="brand-name">RAHATSETU</div><div className="brand-sub">RAHATSETU • FIELD OPERATIONS • {district}</div></div></div><div className="top-actions"><span className="live"><i /> CONNECTED</span><b>{user.name}</b><button onClick={onLogout}><LogOut size={17}/></button></div></header><main className="field-main"><Header state={state} district={district} title={t('page.field.title')} sub={t('page.field.sub')}/><div className="field-grid"><Card><div className="card-head"><b>MY ACTIVE ASSIGNMENTS</b><span>{mine.length} operations</span></div>{mine.length ? mine.map(i => <div className="field-incident" key={i._id}><div className={'severity ' + i.severity.toLowerCase()}>{i.severity}</div><div><b>{i.code}</b><p>{i.type?.replaceAll('_', ' ')} • {i.peopleAffected || 1} affected</p></div><div className="field-actions"><button className="ghost" onClick={() => setStatus(i._id, 'IN_PROGRESS')}>ON SCENE</button><button className="primary small" onClick={() => setStatus(i._id, 'RESOLVED')}>RESOLVE</button></div></div>) : <div className="empty-large"><Truck size={30}/><h3>No active assignment</h3><p>Dispatches assigned to this response area will appear here in real time.</p></div>}</Card><Card className="field-map"><div className="card-head"><b>FIELD MAP</b><span>Routes, incidents and access constraints</span></div><div className="map-wrap"><Map data={data} route={route}/></div></Card></div><div className="field-tools"><button><Phone /> Control room</button><button onClick={() => alert('Use the map popup to inspect incident coordinates; OSRM routing is available from officer dispatch.')}><Navigation /> Navigate</button><button><Camera /> Evidence</button><button><CheckCircle2 /> Safety check</button></div></main></div>;
}
createRoot(document.getElementById('root')).render(<BrowserRouter><App /></BrowserRouter>);
