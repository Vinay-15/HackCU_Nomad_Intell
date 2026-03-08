import { useState, useEffect, useRef, useCallback } from "react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid } from "recharts";

/* ── FONTS ── */
const F = () => <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Outfit:wght@400;500&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet" />;

/* ── LEAFLET LOADER ── */
function loadLeaflet() {
  return new Promise(res => {
    if (window.L) return res(window.L);
    if (!document.getElementById("lf-css")) {
      const l = document.createElement("link");
      l.id = "lf-css"; l.rel = "stylesheet";
      l.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(l);
    }
    const s = document.createElement("script");
    s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    s.onload = () => res(window.L); s.onerror = () => res(null);
    document.head.appendChild(s);
  });
}

/* ── CSS ── */
const S = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{background:#eef2f7;color:#1a1a2e;font-family:'Outfit',sans-serif;min-height:100vh}
::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:linear-gradient(180deg,#1B365D,#E8002D);border-radius:2px}
a{font-family:'Syne',sans-serif;font-weight:800;font-size:16px;letter-spacing:2px}
.nav{position:sticky;top:0;z-index:999;display:flex;align-items:center;justify-content:space-between;padding:13px 24px;background:rgba(255,255,255,.95);backdrop-filter:blur(16px);border-bottom:2px solid transparent;border-image:linear-gradient(90deg,#1B365D,#FFC300,#E8002D) 1}
.logo{font-family:'Syne',sans-serif;font-weight:800;font-size:16px;letter-spacing:2px;color:#1B365D}.logo em{color:#E8002D;font-style:normal}
.nmode{font-family:'JetBrains Mono',monospace;font-size:10px;padding:3px 10px;border-radius:4px;background:rgba(27,54,93,.08);color:#1B365D;border:1px solid rgba(27,54,93,.2)}
.pg{max-width:820px;margin:0 auto;padding:40px 18px 90px}
.hero{text-align:center;margin-bottom:36px}
.kicker{font-family:'JetBrains Mono',monospace;font-size:10px;color:#D4A800;letter-spacing:3px;text-transform:uppercase;margin-bottom:12px;display:flex;align-items:center;justify-content:center;gap:8px}
.kicker::before,.kicker::after{content:'';flex:1;max-width:50px;height:1px;background:linear-gradient(90deg,transparent,#FFC300)}
.hero h1{font-family:'Syne',sans-serif;font-size:clamp(24px,4vw,38px);font-weight:800;color:#1B365D;margin-bottom:8px}
.hero p{color:#5a6577;font-size:13px;max-width:420px;margin:0 auto;line-height:1.6}
.steps{display:flex;gap:5px;justify-content:center;margin-bottom:32px}
.dot{width:6px;height:6px;border-radius:50%;background:#c5cdd8;transition:all .3s}
.dot.on{background:linear-gradient(135deg,#E8002D,#FFC300);width:22px;border-radius:3px}.dot.dn{background:#8896a8}
.card{background:rgba(255,255,255,.55);border:1px solid rgba(27,54,93,.12);border-radius:13px;padding:20px;margin-bottom:12px;box-shadow:0 4px 16px rgba(27,54,93,.06),inset 0 1px 0 rgba(255,255,255,.6);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);transition:all .25s}
.card:hover{border-color:rgba(27,54,93,.22);box-shadow:0 6px 20px rgba(27,54,93,.1),inset 0 1px 0 rgba(255,255,255,.7)}
.ch{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}
.ct{font-family:'Syne',sans-serif;font-size:11px;font-weight:700;color:#1B365D;letter-spacing:2px;text-transform:uppercase;display:flex;align-items:center;gap:7px}
.ct::before{content:'';width:2px;height:11px;background:linear-gradient(180deg,#FFC300,#E8002D);border-radius:1px}
.ctag{font-family:'JetBrains Mono',monospace;font-size:9px;color:#D4A800;border:1px solid rgba(212,168,0,.35);padding:2px 7px;border-radius:4px;background:rgba(255,195,0,.06)}
.mgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px}
.mbtn{background:rgba(240,245,252,.6);border:1px solid rgba(27,54,93,.1);border-radius:9px;padding:11px 7px;cursor:pointer;transition:all .2s;text-align:center;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
.mbtn:hover{border-color:rgba(27,54,93,.2);background:rgba(235,240,248,.7)}.mbtn.act{border-color:#E8002D;background:rgba(232,0,45,.06);box-shadow:0 0 0 3px rgba(232,0,45,.08)}
.mbtn .mi{font-size:18px;margin-bottom:4px}.mbtn .ml{font-family:'Syne',sans-serif;font-size:12px;font-weight:700;color:#1B365D;display:block}
.mbtn .md{font-size:10px;color:#5a6577;display:block;margin-top:1px}.mbtn.act .ml{color:#E8002D}
.mrule{font-family:'JetBrains Mono',monospace;font-size:10px;color:#5a6577;background:rgba(27,54,93,.04);border:1px solid rgba(27,54,93,.1);border-left:3px solid #FFC300;border-radius:7px;padding:8px 12px;margin-bottom:18px;line-height:1.5;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}
.mrule strong{color:#E8002D}
.fg{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.ff{grid-column:1/-1}.fg>div{display:flex;flex-direction:column;gap:6px}
.lbl{font-family:'JetBrains Mono',monospace;font-size:10px;color:#1B365D;letter-spacing:1.5px;text-transform:uppercase;opacity:.7}
.inp{background:rgba(245,248,252,.7);border:1px solid rgba(27,54,93,.1);border-radius:7px;padding:9px 12px;color:#1a1a2e;font-size:14px;font-family:'Outfit',sans-serif;outline:none;transition:all .2s;width:100%;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}
.inp:focus{border-color:#1B365D;box-shadow:0 0 0 2px rgba(27,54,93,.1)}.inp::placeholder{color:#a0aaba}
.sr{display:flex;align-items:center;gap:9px}
input[type=range]{flex:1;-webkit-appearance:none;height:3px;background:linear-gradient(90deg,#d8e0ea,#c5cdd8);border-radius:2px;outline:none;cursor:pointer}
input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:13px;height:13px;border-radius:50%;background:linear-gradient(135deg,#E8002D,#FFC300);cursor:pointer;box-shadow:0 0 6px rgba(232,0,45,.35)}
.sv{font-family:'JetBrains Mono',monospace;font-size:12px;color:#D4A800;min-width:26px;text-align:right;font-weight:600}
.pgs{display:flex;flex-wrap:wrap;gap:7px}
.pc{background:rgba(240,245,252,.55);border:1px solid rgba(27,54,93,.1);border-radius:18px;padding:6px 13px;cursor:pointer;font-size:12px;color:#5a6577;transition:all .2s;display:flex;align-items:center;gap:5px;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}
.pc:hover{border-color:rgba(27,54,93,.2);color:#1B365D}.pc.sel{background:rgba(27,54,93,.08);border-color:#1B365D;color:#1B365D;font-weight:600}
.btn{display:flex;align-items:center;justify-content:center;gap:7px;padding:12px 22px;border-radius:9px;border:none;cursor:pointer;font-family:'Syne',sans-serif;font-size:14px;font-weight:700;transition:all .2s;width:100%}
.bp{background:linear-gradient(135deg,#B0001F,#E8002D);color:#ffffff;position:relative;overflow:hidden}
.bp::after{content:'';position:absolute;top:0;right:0;width:40%;height:100%;background:linear-gradient(135deg,transparent,rgba(255,195,0,.15));pointer-events:none}
.bp:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(232,0,45,.3)}
.bp:disabled{opacity:.35;transform:none;cursor:not-allowed}
.bg{background:#ffffff;border:1px solid #d8e0ea;color:#5a6577;font-size:13px}
.bg:hover{border-color:#a8b8cc;color:#1B365D}
.sw{position:relative;margin-bottom:12px}
.si{width:100%;background:#ffffff;border:1px solid #d8e0ea;border-radius:11px;padding:15px 48px 15px 18px;color:#1B365D;font-size:17px;font-family:'Syne',sans-serif;font-weight:700;outline:none;transition:all .2s;box-shadow:0 2px 8px rgba(27,54,93,.06)}
.si:focus{border-color:#1B365D;box-shadow:0 0 0 3px rgba(27,54,93,.12)}.si::placeholder{color:#a0aaba;font-weight:400;font-size:14px}
.sic{position:absolute;right:16px;top:50%;transform:translateY(-50%);color:#FFC300;font-size:18px}
.agrow{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-bottom:16px}
.agc{background:#ffffff;border:1px solid #d8e0ea;border-radius:9px;padding:11px 7px;text-align:center;transition:all .3s;box-shadow:0 1px 3px rgba(27,54,93,.04)}
.agc.run{border-color:#1B365D;background:rgba(27,54,93,.04);box-shadow:0 0 0 2px rgba(27,54,93,.12)}.agc.dn{border-color:#D4A800;background:rgba(255,195,0,.06)}
.agn{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:600;color:#5a6577}
.agc.run .agn{color:#1B365D}.agc.dn .agn{color:#D4A800}
.spin{width:7px;height:7px;border:1.5px solid #1B365D;border-top-color:transparent;border-radius:50%;animation:sp .7s linear infinite;margin:5px auto 0}
@keyframes sp{to{transform:rotate(360deg)}}
.ck{color:#D4A800;margin-top:4px;font-size:13px}
.lb{background:#f5f8fc;border:1px solid #d8e0ea;border-radius:9px;padding:12px;max-height:170px;overflow-y:auto;margin-top:16px}
.ll{display:flex;gap:9px;padding:3px 0;font-family:'JetBrains Mono',monospace;font-size:11px;animation:fu .25s ease;border-bottom:1px solid #e8edf3}
.ll:last-child{border-bottom:none}
@keyframes fu{from{opacity:0;transform:translateY(4px)}to{opacity:1}}
.la{font-weight:600;min-width:80px;color:#1B365D}.lm{color:#5a6577;flex:1}
.ls{font-size:9px;padding:2px 6px;border-radius:3px;white-space:nowrap}
.lr{background:rgba(27,54,93,.08);color:#1B365D;border:1px solid rgba(27,54,93,.2)}.lk{background:rgba(255,195,0,.1);color:#D4A800;border:1px solid rgba(212,168,0,.25)}.le{background:rgba(232,0,45,.08);color:#E8002D;border:1px solid rgba(232,0,45,.2)}
.tabs{display:flex;gap:2px;background:#e4eaf1;border:1px solid #d8e0ea;border-radius:9px;padding:3px;margin-bottom:18px;overflow-x:auto}
.tab{flex:1;padding:8px 10px;border-radius:6px;border:none;background:transparent;cursor:pointer;font-family:'Syne',sans-serif;font-size:12px;font-weight:700;color:#5a6577;transition:all .2s;white-space:nowrap}
.tab:hover{color:#1B365D}.tab.on{background:#ffffff;color:#1B365D;border:1px solid rgba(27,54,93,.2);box-shadow:0 1px 3px rgba(27,54,93,.08)}
.vwrap{display:flex;gap:10px;margin-bottom:18px;flex-wrap:wrap}
.vc{flex:1;min-width:190px;border-radius:11px;padding:14px 18px;border:1px solid}
.vc.REC{background:rgba(255,195,0,.06);border-color:rgba(212,168,0,.35)}.vc.CON{background:rgba(27,54,93,.04);border-color:rgba(27,54,93,.25)}.vc.DIS{background:rgba(232,0,45,.05);border-color:rgba(232,0,45,.25)}
.vl{font-family:'Syne',sans-serif;font-size:18px;font-weight:800}.REC .vl{color:#D4A800}.CON .vl{color:#2B4C7E}.DIS .vl{color:#E8002D}
.vs{font-size:11px;color:#5a6577;margin-top:3px}
.dh{background:#ffffff;border:1px solid #d8e0ea;border-radius:11px;padding:14px 18px;display:flex;flex-direction:column;justify-content:center;min-width:130px;box-shadow:0 2px 8px rgba(27,54,93,.06)}
.db{font-family:'JetBrains Mono',monospace;font-size:32px;font-weight:600}.dl{font-size:11px;color:#5a6577;margin-top:1px}
.ap{display:inline-flex;align-items:center;gap:5px;font-family:'JetBrains Mono',monospace;font-size:9px;padding:3px 9px;border-radius:4px;margin-top:7px}
.ar{background:rgba(255,195,0,.1);color:#D4A800;border:1px solid rgba(212,168,0,.25)}.as{background:rgba(27,54,93,.05);color:#5a6577;border:1px solid #d8e0ea}.ad{background:rgba(232,0,45,.08);color:#E8002D;border:1px solid rgba(232,0,45,.2)}
.adot{width:5px;height:5px;border-radius:50%;background:currentColor}
.dgrid{display:grid;grid-template-columns:1fr 1fr;gap:9px}
.di{background:#f5f8fc;border:1px solid #d8e0ea;border-radius:9px;padding:12px}
.dih{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
.dil{font-size:11px;color:#5a6577;display:flex;align-items:center;gap:4px}
.dv{font-family:'JetBrains Mono',monospace;font-size:11px}
.dt{height:3px;background:#d8e0ea;border-radius:2px;overflow:hidden;margin-bottom:4px}
.df{height:100%;border-radius:2px;transition:width .9s ease}
.da{font-family:'JetBrains Mono',monospace;font-size:9px;color:#8896a8}
.mwrap{border-radius:11px;overflow:hidden;border:1px solid #d8e0ea;margin-bottom:12px;box-shadow:0 2px 8px rgba(27,54,93,.06)}
.mbox{height:400px;width:100%;position:relative;background:#dde4ed}
.mleg{display:flex;flex-wrap:wrap;gap:6px;padding:10px 14px;background:#ffffff;border-top:1px solid #d8e0ea}
.li{display:flex;align-items:center;gap:4px;font-size:11px;color:#5a6577;cursor:pointer;padding:3px 8px;border-radius:4px;border:1px solid transparent;transition:all .15s}
.li:hover,.li.on{background:#edf1f7;border-color:#d8e0ea;color:#1B365D}
.ldot{width:7px;height:7px;border-radius:50%;flex-shrink:0}
.ml2{display:flex;align-items:center;justify-content:center;flex-direction:column;gap:8px;position:absolute;inset:0;background:#e8edf3;z-index:10}
.ml2 span{font-family:'JetBrains Mono',monospace;font-size:11px;color:#5a6577}
.mspin{width:22px;height:22px;border:2px solid rgba(27,54,93,.2);border-top-color:#1B365D;border-radius:50%;animation:sp .8s linear infinite}
.alist{display:grid;grid-template-columns:1fr 1fr;gap:7px;max-height:280px;overflow-y:auto}
.ac{background:#f5f8fc;border:1px solid #d8e0ea;border-radius:8px;padding:10px 12px;display:flex;gap:9px;cursor:pointer;transition:all .2s}
.ac:hover{border-color:#a8b8cc;background:#edf1f7}.ac.sel{border-color:#1B365D;background:rgba(27,54,93,.04)}
.ai{font-size:18px;line-height:1}.an{font-size:12px;font-weight:600;color:#1B365D;line-height:1.3}
.at{font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:1px;text-transform:uppercase;margin-top:2px}
.adk{font-family:'JetBrains Mono',monospace;font-size:10px;color:#E8002D;margin-top:2px}
.ad2{font-size:11px;color:#5a6577;margin-top:2px;line-height:1.35}
.osg{display:grid;grid-template-columns:1fr 1fr;gap:7px}
.os{background:#f5f8fc;border:1px solid #d8e0ea;border-radius:7px;padding:9px 11px}
.oh{display:flex;justify-content:space-between;font-size:11px;margin-bottom:6px}
.ol{color:#5a6577}.ov{font-family:'JetBrains Mono',monospace;color:#1B365D}
.ob{height:3px;background:#d8e0ea;border-radius:2px}
.of{height:100%;border-radius:2px;transition:width .9s ease}
.cbg{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-bottom:12px}
.ci{background:#f5f8fc;border:1px solid #d8e0ea;border-radius:8px;padding:11px 13px}
.cc{font-size:11px;color:#5a6577;margin-top:2px}.ca{font-family:'JetBrains Mono',monospace;font-size:17px;font-weight:600;color:#1B365D}
.cbt{height:3px;background:#d8e0ea;border-radius:2px;margin-top:5px}.cbf{height:100%;border-radius:2px}
.ir{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-bottom:12px}
.ic{background:#f5f8fc;border:1px solid #d8e0ea;border-radius:9px;padding:13px}
.it{font-family:'JetBrains Mono',monospace;font-size:10px;color:#8896a8;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:7px}
.im{font-size:13px;color:#1B365D;line-height:1.5;font-weight:500}
.ib{font-size:11px;color:#5a6577;margin-top:5px;line-height:1.45}
.mr{display:flex;flex-wrap:wrap;gap:5px}
.mc{font-family:'JetBrains Mono',monospace;font-size:10px;padding:4px 9px;border-radius:5px;border:1px solid}
.mb{background:rgba(255,195,0,.08);color:#D4A800;border-color:rgba(212,168,0,.3)}.mo{background:rgba(27,54,93,.05);color:#5a6577;border-color:rgba(27,54,93,.15)}.mbd{background:rgba(232,0,45,.07);color:#E8002D;border-color:rgba(232,0,45,.2)}
.hl{display:flex;gap:9px;align-items:flex-start;background:rgba(255,195,0,.05);border:1px solid rgba(212,168,0,.2);border-left:3px solid #FFC300;border-radius:9px;padding:11px 13px;margin-top:11px;font-size:13px;color:#1B365D;line-height:1.5}
.hl::before{content:'↗';color:#FFC300;font-size:13px}
.bb{display:flex;align-items:center;gap:5px;background:none;border:none;color:#8896a8;cursor:pointer;font-size:12px;font-family:'Outfit',sans-serif;padding:0;margin-bottom:24px;transition:color .2s}
.bb:hover{color:#1B365D}
@media(max-width:560px){.fg,.dgrid,.ir,.cbg,.alist,.osg{grid-template-columns:1fr}.agrow{grid-template-columns:repeat(2,1fr)}.vwrap{flex-direction:column}}
`;

/* ── CONSTANTS ── */
const MODES = {
  executive: { icon: "◈", label: "Executive", desc: "Zero compromise", color: "#ffb800", rule: "Work dims must match or exceed anchor" },
  relocator: { icon: "◉", label: "Relocator", desc: "Upgrade baseline", color: "#E8002D", rule: "DNA match ≥0.75 AND mean delta >0.15" },
  nomad: { icon: "◎", label: "Nomad", desc: "Floor enforcement", color: "#FFC300", rule: "All critical floors must be satisfied" },
};
const APREFS = [
  { key: "hiking", label: "Hiking", icon: "🏔" }, { key: "water", label: "Water Sports", icon: "🏄" },
  { key: "cycling", label: "Cycling", icon: "🚴" }, { key: "climbing", label: "Climbing", icon: "🧗" },
  { key: "wellness", label: "Wellness", icon: "🧘" }, { key: "urban", label: "Urban", icon: "☕" },
];
const DIMS = [
  { key: "internet", label: "Internet", icon: "⚡", unit: "Mbps" },
  { key: "workspace", label: "Workspace", icon: "🖥", unit: "/10" },
  { key: "cost", label: "Cost", icon: "💰", unit: "$/mo", inv: true },
  { key: "safety", label: "Safety", icon: "🛡", unit: "/10" },
  { key: "outdoor", label: "Outdoor", icon: "🏔", unit: "/10" },
  { key: "lifestyle", label: "Lifestyle", icon: "☕", unit: "/10" },
];
const ATYPES = [
  { key: "hiking", icon: "🏔", label: "Hiking", c: "#a78bfa" },
  { key: "beach", icon: "🏖", label: "Beach", c: "#06b6d4" },
  { key: "park", icon: "🌳", label: "Park", c: "#22c55e" },
  { key: "viewpoint", icon: "👁", label: "View", c: "#fb923c" },
  { key: "coworking", icon: "💻", label: "Cowork", c: "#E8002D" },
  { key: "wellness", icon: "🧘", label: "Wellness", c: "#f472b6" },
  { key: "food", icon: "🍽", label: "Food", c: "#facc15" },
  { key: "cycling", icon: "🚴", label: "Cycling", c: "#4ade80" },
];
const MOS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const OCATS = [
  { key: "hiking", label: "Hiking", icon: "🏔" }, { key: "water", label: "Water", icon: "🏄" },
  { key: "cycling", label: "Cycling", icon: "🚴" }, { key: "climbing", label: "Climbing", icon: "🧗" },
  { key: "wellness", label: "Wellness", icon: "🧘" }, { key: "urban", label: "Urban", icon: "☕" },
];
const CCATS = [
  { key: "cost_housing", label: "Housing", c: "#06b6d4" },
  { key: "cost_food", label: "Food", c: "#22c55e" },
  { key: "cost_coworking", label: "Coworking", c: "#a78bfa" },
  { key: "cost_transport", label: "Transport", c: "#f59e0b" },
  { key: "cost_leisure", label: "Leisure", c: "#fb923c" },
];


/* ── API ── */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

async function analyzeCity(payload) {
  const r = await fetch(`${API_BASE_URL}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.detail || "Analysis failed.");
  return d;
}


/* ── MATH ── */
function delta(anchor, target) {
  const dims = {}; let tot = 0;
  DIMS.forEach(({ key, inv }) => {
    const a = anchor[key] ?? 0, t = target[key] ?? 0;
    const raw = inv ? a - t : t - a;
    const n = key === "internet" ? raw / 10 : key === "cost" ? (raw / Math.max(a, 1)) * 10 : raw;
    dims[key] = { a, t, raw, n }; tot += n;
  });
  return { dims, overall: tot / DIMS.length };
}
function verdict(d, mode, anc) {
  if (mode === "executive") return ["internet", "workspace"].every(k => d.dims[k]?.raw >= 0) ? "REC" : "DIS";
  if (mode === "relocator") return d.overall > 1.5 ? "REC" : d.overall > 0 ? "CON" : "DIS";
  return (d.dims.internet?.t >= (anc.minInternet ?? 30) && d.dims.workspace?.t >= (anc.minWorkspace ?? 5)) ? "REC" : "CON";
}

/* ── MAP ── */
function Map({ geo, acts, selId, onSel }) {
  const ref = useRef(null), inst = useRef(null), marks = useRef([]);
  const [st, setSt] = useState("loading");

  const addMarkers = useCallback((L, map, acts, selId, onSel) => {
    marks.current.forEach(m => m.remove()); marks.current = [];
    acts.forEach(a => {
      if (!a?.lat || !a?.lon) return;
      const td = ATYPES.find(t => t.key === a.type) || ATYPES[0];
      const sel = a.id === selId, sz = sel ? 34 : 28;
      const mk = L.marker([a.lat, a.lon], {
        icon: L.divIcon({
          className: "", iconSize: [sz, sz], iconAnchor: [sz / 2, sz / 2],
          html: `<div style="width:${sz}px;height:${sz}px;border-radius:50%;background:${td.c}18;border:2px solid ${td.c};display:flex;align-items:center;justify-content:center;font-size:${sel ? 15 : 12}px;cursor:pointer;box-shadow:${sel ? `0 0 10px ${td.c}` : "none"}">${td.icon}</div>`
        }),
        zIndexOffset: sel ? 1000 : 0
      }).addTo(map)
        .bindPopup(`<div style="font-family:monospace;padding:3px;min-width:140px"><b style="color:${td.c};font-size:12px">${a.name}</b><br><span style="font-size:9px;color:#888;text-transform:uppercase">${td.label}</span><br><span style="font-size:11px;color:#aaa">${a.description || ""}</span></div>`)
        .on("click", () => onSel(a.id));
      if (sel) mk.openPopup();
      marks.current.push(mk);
    });
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      const L = await loadLeaflet();
      if (!L || !ref.current || !alive) { setSt("error"); return; }
      if (inst.current) { inst.current.remove(); inst.current = null; }
      const map = L.map(ref.current, { center: [geo.latitude, geo.longitude], zoom: 12, zoomControl: false });
      L.control.zoom({ position: "bottomright" }).addTo(map);
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", { subdomains: "abcd", maxZoom: 19, attribution: "© OSM © CARTO" }).addTo(map);
      L.marker([geo.latitude, geo.longitude], {
        icon: L.divIcon({
          className: "", iconSize: [16, 16], iconAnchor: [8, 8],
          html: `<div style="width:16px;height:16px;border-radius:50%;background:#E8002D;border:2px solid #ffffff;box-shadow:0 0 16px #E8002D"></div>`
        })
      })
        .addTo(map).bindPopup(`<b style="color:#E8002D">${geo.name}</b>`);
      inst.current = map; setSt("ready");
      addMarkers(L, map, acts, selId, onSel);
    })();
    return () => { alive = false; if (inst.current) { inst.current.remove(); inst.current = null; } };
  }, [geo]);

  useEffect(() => {
    if (inst.current && window.L && st === "ready") addMarkers(window.L, inst.current, acts, selId, onSel);
  }, [acts, selId, st]);

  useEffect(() => {
    if (!inst.current || !selId) return;
    const a = acts.find(x => x.id === selId);
    if (a?.lat && a?.lon) inst.current.flyTo([a.lat, a.lon], 14, { duration: .8 });
  }, [selId]);

  const counts = ATYPES.reduce((acc, t) => { acc[t.key] = acts.filter(a => a.type === t.key).length; return acc; }, {});
  return (
    <div className="mwrap">
      <div className="mbox" ref={ref}>
        {st === "loading" && <div className="ml2"><div className="mspin" /><span>Loading map…</span></div>}
        {st === "error" && <div className="ml2"><span style={{ color: "#ff4757" }}>Map unavailable</span></div>}
      </div>
      <div className="mleg">
        <div style={{ fontSize: 11, color: "#aaaabc", fontFamily: "JetBrains Mono", alignSelf: "center" }}>{acts.length} spots</div>
        {ATYPES.map(t => counts[t.key] > 0 && (
          <div key={t.key} className="li"><span className="ldot" style={{ background: t.c }} />{t.icon} {t.label} ({counts[t.key]})</div>
        ))}
      </div>
    </div>
  );
}

/* ── RADAR ── */
function Radar2({ anchor, intel }) {
  const data = [
    { d: "Internet", A: Math.min(anchor.internet / 10, 10), B: Math.min((intel.internet || 0) / 10, 10) },
    { d: "Workspace", A: anchor.workspace, B: intel.workspace || 0 },
    { d: "Afford", A: Math.max(0, 10 - anchor.budget / 400), B: Math.max(0, 10 - (intel.cost_total || 0) / 400) },
    { d: "Safety", A: 6, B: intel.safety || 0 },
    { d: "Outdoor", A: anchor.outdoor, B: intel.outdoor || 0 },
    { d: "Lifestyle", A: 6, B: intel.lifestyle || 0 },
  ];
  return (
    <ResponsiveContainer width="100%" height={230}>
      <RadarChart data={data} margin={{ top: 8, right: 18, bottom: 8, left: 18 }}>
        <PolarGrid stroke="#d8e0ea" />
        <PolarAngleAxis dataKey="d" tick={{ fill: "#5a6577", fontSize: 10, fontFamily: "JetBrains Mono" }} />
        <PolarRadiusAxis angle={90} domain={[0, 10]} tick={false} axisLine={false} />
        <Radar name="Baseline" dataKey="A" stroke="#b8c8dc" fill="#b8c8dc" fillOpacity={0.3} strokeWidth={2} />
        <Radar name="Target" dataKey="B" stroke="#1B365D" fill="#1B365D" fillOpacity={0.12} strokeWidth={2} dot={{ r: 3, fill: "#FFC300" }} />
        <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #d8e0ea", fontFamily: "JetBrains Mono", fontSize: 11 }} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

/* ── WEATHER CHART ── */
function WChart({ wx }) {
  if (!wx?.daily) return null;
  const data = wx.daily.time.map((t, i) => ({
    d: t.slice(5),
    Hi: Math.round(wx.daily.temperature_2m_max[i]),
    Lo: Math.round(wx.daily.temperature_2m_min[i]),
    Rain: +(wx.daily.precipitation_sum[i] || 0).toFixed(1),
  }));
  return (<>
    <div className="ct" style={{ marginBottom: 12 }}>7-Day Forecast</div>
    <ResponsiveContainer width="100%" height={150}>
      <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -22 }}>
        <defs><linearGradient id="gH" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#E8002D" stopOpacity={0.15} /><stop offset="95%" stopColor="#E8002D" stopOpacity={0} /></linearGradient></defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#d8e0ea" vertical={false} />
        <XAxis dataKey="d" tick={{ fill: "#5a6577", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#5a6577", fontSize: 9, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #d8e0ea", fontFamily: "JetBrains Mono", fontSize: 11 }} formatter={(v, n) => [`${v}°C`, n]} />
        <Area type="monotone" dataKey="Hi" stroke="#E8002D" fill="url(#gH)" strokeWidth={2} dot={{ r: 2, fill: "#E8002D" }} />
        <Area type="monotone" dataKey="Lo" stroke="#8896a8" fill="none" strokeWidth={1.5} />
      </AreaChart>
    </ResponsiveContainer>
    <ResponsiveContainer width="100%" height={65}>
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -22 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#d8e0ea" vertical={false} />
        <XAxis dataKey="d" tick={{ fill: "#5a6577", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#5a6577", fontSize: 9, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #d8e0ea", fontFamily: "JetBrains Mono", fontSize: 11 }} formatter={v => [`${v}mm`, "Rain"]} />
        <Bar dataKey="Rain" fill="#2B4C7E" opacity={0.7} radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  </>);
}

/* ── STEP 1: ONBOARD ── */
function Onboard({ mode, setMode, anc, upd, prefs, setPrefs, onNext }) {
  return (
    <div className="pg">
      <div className="steps"><div className="dot on" /><div className="dot" /><div className="dot" /></div>
      <div className="hero"><div className="kicker">Step 1</div>
        <h1>Your Setup</h1>
        <p>Set your current city, budget and preferences.</p>
      </div>
      <div className="card">
        <div className="ch"><div className="ct">Travel Mode</div></div>
        <div className="mgrid">
          {Object.entries(MODES).map(([k, m]) => (
            <button key={k} className={`mbtn${mode === k ? " act" : ""}`} onClick={() => setMode(k)}>
              <div className="mi">{m.icon}</div><span className="ml">{m.label}</span><span className="md">{m.desc}</span>
            </button>
          ))}
        </div>
        <div className="mrule"><strong>Filter: </strong>{MODES[mode].rule}</div>
      </div>
      <div className="card">
        <div className="ch"><div className="ct">Current Setup</div></div>
        <div className="fg">
          <div className="ff fgrp"><label className="lbl">Current City</label>
            <input className="inp" placeholder="e.g. Austin, Texas" value={anc.currentCity} onChange={e => upd("currentCity", e.target.value)} />
          </div>
          <div><label className="lbl">Monthly Budget (USD)</label>
            <input className="inp" type="number" value={anc.budget} onChange={e => upd("budget", +e.target.value)} />
          </div>
          <div><label className="lbl">Internet Speed (Mbps)</label>
            <input className="inp" type="number" value={anc.internet} onChange={e => upd("internet", +e.target.value)} />
          </div>
          <div className="ff"><label className="lbl">Workspace Quality — {anc.workspace}/10</label>
            <div className="sr"><input type="range" min="1" max="10" step=".5" value={anc.workspace} onChange={e => upd("workspace", +e.target.value)} /><span className="sv">{anc.workspace}</span></div>
          </div>
          <div className="ff"><label className="lbl">Outdoor Importance — {anc.outdoor}/10</label>
            <div className="sr"><input type="range" min="1" max="10" step=".5" value={anc.outdoor} onChange={e => upd("outdoor", +e.target.value)} /><span className="sv">{anc.outdoor}</span></div>
          </div>
          {mode === "nomad" && <>
            <div><label className="lbl">Min Internet Floor (Mbps)</label><input className="inp" type="number" value={anc.minInternet} onChange={e => upd("minInternet", +e.target.value)} /></div>
            <div><label className="lbl">Min Workspace Floor (/10)</label><input className="inp" type="number" value={anc.minWorkspace} onChange={e => upd("minWorkspace", +e.target.value)} /></div>
          </>}
        </div>
      </div>
      <div className="card">
        <div className="ch"><div className="ct">Activity Preferences</div></div>
        <div className="pgs">
          {APREFS.map(p => (
            <div key={p.key} className={`pc${prefs.includes(p.key) ? " sel" : ""}`} onClick={() => setPrefs(v => v.includes(p.key) ? v.filter(x => x !== p.key) : [...v, p.key])}>
              <span>{p.icon}</span>{p.label}
            </div>
          ))}
        </div>
      </div>
      <button className="btn bp" onClick={onNext} disabled={!anc.currentCity.trim()}>Set Baseline & Continue →</button>
    </div>
  );
}

/* ── STEP 2: ANALYZE ── */
function Analyze({ mode, anc, prefs, city, setCity, logs, logRef, ags, running, onRun, onBack }) {
  const agents = [{ k: "SCOUT", r: "Finding Location" }, { k: "TERRA", r: "Climate & Outdoors" }, { k: "LEDGER", r: "Cost & Visa" }, { k: "ORACLE", r: "City Map & Places" }];
  return (
    <div className="pg">
      <div className="steps"><div className="dot dn" /><div className="dot on" /><div className="dot" /></div>
      <button className="bb" onClick={onBack}>← Edit baseline</button>
      <div className="hero"><div className="kicker">Step 2</div>
        <h1>Where to next?</h1>
        <p>Enter a city to get a full AI-powered analysis with map, costs and climate.</p>
      </div>
      <div style={{ background: "#ffffff", border: "1px solid #e2e2ea", borderRadius: 11, padding: "11px 15px", marginBottom: 16, display: "flex", alignItems: "center", gap: 11 }}>
        <span style={{ color: MODES[mode].color, fontFamily: "JetBrains Mono", fontSize: 11 }}>{MODES[mode].icon} {mode.toUpperCase()}</span>
        <span style={{ color: "#aaaabc", fontSize: 12 }}>·</span>
        <span style={{ color: "#6b7280", fontSize: 12 }}>{anc.currentCity || "No city"} · ${anc.budget?.toLocaleString()}/mo</span>
        {prefs.length > 0 && <span style={{ marginLeft: "auto", fontSize: 12 }}>{prefs.map(k => APREFS.find(p => p.key === k)?.icon).join(" ")}</span>}
      </div>
      <div className="agrow">
        {agents.map(({ k, r }) => (
          <div key={k} className={`agc${ags[k] === "running" ? " run" : ""}${ags[k] === "done" ? " dn" : ""}`}>
            <div className="agn">{r}</div>
            {ags[k] === "running" && <div className="spin" />}
            {ags[k] === "done" && <div className="ck">✓</div>}
          </div>
        ))}
      </div>
      <div className="sw">
        <input className="si" placeholder="Enter destination city…" value={city} onChange={e => setCity(e.target.value)} onKeyDown={e => e.key === "Enter" && !running && onRun()} disabled={running} />
        <span className="sic">↗</span>
      </div>
      <button className="btn bp" onClick={onRun} disabled={running || !city.trim()}>{running ? "Agents running…" : "Run Intelligence Analysis →"}</button>
      {logs.length > 0 && (
        <div className="lb" ref={logRef}>
          {logs.map(l => (
            <div key={l.id} className="ll">
              <span className="la" style={{ color: l.agent === "ORACLE" ? "#E8002D" : l.agent === "TERRA" ? "#FFC300" : l.agent === "LEDGER" ? "#ffb800" : "#FFC300" }}>{{ SCOUT: "Location", TERRA: "Climate", LEDGER: "Cost & Visa", ORACLE: "Map & Places" }[l.agent] || l.agent}</span>
              <span className="lm">{l.msg}</span>
              <span className={`ls ${l.s === "running" ? "lr" : l.s === "done" ? "lk" : "le"}`}>{l.s}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── STEP 3: RESULTS ── */
function Results({ res, onBack }) {
  const [tab, setTab] = useState("overview");
  const [sel, setSel] = useState(null);
  const { city, country, code, geo, intel, d, v, wx, mode, anc, prefs } = res;
  const acts = intel.activities ?? [];
  const oc = d.overall > 1 ? "#D4A800" : d.overall < -1 ? "#E8002D" : "#2B4C7E";
  const ac = intel.arbitrage_signal === "rising" ? "ar" : intel.arbitrage_signal === "declining" ? "ad" : "as";
  const bM = intel.best_months ?? []; const wM = intel.worst_months ?? [];
  const vLabel = { REC: "✓ Recommended", CON: "⚠ Conditional", DIS: "✗ Disqualified" }[v] || v;
  const maxC = Math.max(...CCATS.map(({ key }) => intel[key] ?? 0), 1);
  return (
    <div className="pg">
      <div className="steps"><div className="dot dn" /><div className="dot dn" /><div className="dot on" /></div>
      <button className="bb" onClick={onBack}>← New search</button>
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontFamily: "JetBrains Mono", fontSize: 10, color: "#aaaabc", letterSpacing: 2, textTransform: "uppercase", marginBottom: 5, display: "flex", alignItems: "center", gap: 9 }}>
          <span style={{ color: MODES[mode]?.color }}>{MODES[mode]?.icon} {mode.toUpperCase()}</span>
          <span>·</span>{country}
          {acts.length > 0 && <span style={{ marginLeft: "auto", color: "#E8002D", fontSize: 10 }}>{acts.length} activities mapped</span>}
        </div>
        <div style={{ fontFamily: "Syne", fontSize: "clamp(28px,5vw,42px)", fontWeight: 800, color: "#1B365D", marginBottom: 13 }}>
          {city}<sup style={{ fontSize: "0.38em", color: "#8896a8", marginLeft: 8, verticalAlign: "middle" }}>{code}</sup>
        </div>
        <div className="vwrap">
          <div className={`vc ${v}`}>
            <div className="vl">{vLabel}</div>
            <div className="vs">{MODES[mode]?.rule}</div>
            <div className={`ap ${ac}`}><span className="adot" />{intel.arbitrage_signal?.toUpperCase() ?? "STABLE"}</div>
          </div>
          <div className="dh">
            <div className="db" style={{ color: oc }}>{d.overall > 0 ? "+" : ""}{d.overall.toFixed(1)}</div>
            <div className="dl">setup delta</div>
          </div>
        </div>
      </div>
      <div className="tabs">
        {[["overview", "Overview"], ["activities", "🗺 Activities"], ["cost", "💰 Cost"], ["climate", "🌤 Climate"]].map(([k, l]) => (
          <button key={k} className={`tab${tab === k ? " on" : ""}`} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {tab === "overview" && <>
        <div className="card">
          <div className="ch"><div className="ct">Vector Comparison</div></div>
          <Radar2 anchor={anc} intel={intel} />
        </div>
        <div className="card">
          <div className="ch"><div className="ct">Setup Delta</div></div>
          <div className="dgrid">
            {DIMS.map(({ key, label, icon, inv }) => {
              const di = d.dims[key]; if (!di) return null;
              const col = di.raw > 0 ? "#FFC300" : di.raw === 0 ? "#3d5a7a" : "#ff4757";
              const pct = Math.min(Math.abs(di.n) * 10, 100);
              const dsp = key === "cost" ? `${di.raw > 0 ? "+" : ""}$${Math.abs(Math.round(di.raw))}/mo` : key === "internet" ? `${di.raw > 0 ? "+" : ""}${Math.round(di.raw)} Mbps` : `${di.raw > 0 ? "+" : ""}${di.raw.toFixed(1)}`;
              const anc2 = key === "cost" ? `$${di.a}/mo → $${Math.round(di.t)}/mo` : key === "internet" ? `${di.a} → ${Math.round(di.t)} Mbps` : `${di.a} → ${di.t?.toFixed(1)}/10`;
              return (
                <div key={key} className="di">
                  <div className="dih"><span className="dil">{icon} {label}</span><span className="dv" style={{ color: col }}>{dsp}</span></div>
                  <div className="dt"><div className="df" style={{ width: `${pct}%`, background: col }} /></div>
                  <div className="da">{anc2}</div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="card">
          <div className="ch"><div className="ct">Intelligence Summary</div></div>
          <p style={{ color: "#5a6577", fontSize: 13, lineHeight: 1.7 }}>{intel.summary}</p>
          {intel.top_highlight && <div className="hl">{intel.top_highlight}</div>}
          {intel.arbitrage_note && (
            <div style={{ marginTop: 11, padding: "9px 13px", background: "rgba(27,54,93,.03)", border: "1px solid #d8e0ea", borderRadius: 8 }}>
              <div style={{ fontFamily: "JetBrains Mono", fontSize: 9, color: "#8896a8", marginBottom: 4 }}>MARKET TREND</div>
              <p style={{ fontFamily: "JetBrains Mono", fontSize: 11, color: "#5a6577", lineHeight: 1.55 }}>{intel.arbitrage_note}</p>
            </div>
          )}
        </div>
      </>}

      {tab === "activities" && <>
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: "15px 18px 10px" }}><div className="ct">Outdoor Activity Map</div></div>
          <Map geo={geo} acts={acts} selId={sel} onSel={id => setSel(v => v === id ? null : id)} />
        </div>
        <div className="card">
          <div className="ch"><div className="ct">Category Scores</div></div>
          <div className="osg">
            {OCATS.map(({ key, label, icon }) => {
              const sc = intel.outdoor_scores?.[key] ?? 5;
              const col = sc >= 7 ? "#D4A800" : sc >= 5 ? "#2B4C7E" : "#8896a8";
              const isPref = prefs.includes(key);
              return (
                <div key={key} className="os" style={isPref ? { borderColor: "rgba(232,0,45,.25)" } : {}}>
                  <div className="oh"><span className="ol">{icon} {label}{isPref && <span style={{ color: "#E8002D", marginLeft: 3, fontSize: 9 }}>★</span>}</span><span className="ov" style={{ color: col }}>{sc}/10</span></div>
                  <div className="ob"><div className="of" style={{ width: `${sc * 10}%`, background: col }} /></div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="card">
          <div className="ch"><div className="ct">All Locations ({acts.length})</div></div>
          {acts.length === 0
            ? <div style={{ textAlign: "center", padding: 36, color: "#aaaabc", fontSize: 12 }}>No activities — try re-analyzing.</div>
            : <div className="alist">
              {acts.map(a => {
                const td = ATYPES.find(t => t.key === a.type) || ATYPES[0];
                return (
                  <div key={a.id} className={`ac${sel === a.id ? " sel" : ""}`} onClick={() => { setSel(v => v === a.id ? null : a.id); }}>
                    <div className="ai">{td.icon}</div>
                    <div>
                      <div className="an">{a.name}</div>
                      <div className="at" style={{ color: td.c }}>{td.label}</div>
                      {a.distance && <div className="adk">~{a.distance} km</div>}
                      {a.description && <div className="ad2">{a.description}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          }
        </div>
        {intel.mode_specific_note && (
          <div className="card"><div className="ch"><div className="ct">{MODES[mode]?.icon} {MODES[mode]?.label} Note</div></div>
            <p style={{ color: "#5a6577", fontSize: 13, lineHeight: 1.65 }}>{intel.mode_specific_note}</p>
          </div>
        )}
      </>}

      {tab === "cost" && <>
        <div className="card">
          <div className="ch"><div className="ct">Cost Breakdown</div><div className="ctag">~${(intel.cost_total ?? 0).toLocaleString()}/mo</div></div>
          <div className="cbg">
            {CCATS.map(({ key, label, c }) => {
              const amt = intel[key] ?? Math.round((intel.cost_total ?? 0) * 0.2);
              return (
                <div key={key} className="ci">
                  <div className="ca">${amt.toLocaleString()}</div>
                  <div className="cc">{label}</div>
                  <div className="cbt"><div className="cbf" style={{ width: `${(amt / maxC) * 100}%`, background: c }} /></div>
                </div>
              );
            })}
          </div>
          {anc.budget && (
            <div style={{ padding: "11px 13px", background: "rgba(27,54,93,.03)", borderRadius: 7, marginTop: 7, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "#5a6577" }}>vs your ${anc.budget.toLocaleString()}/mo budget</span>
              <span style={{ fontFamily: "JetBrains Mono", fontSize: 13, color: (intel.cost_total ?? 0) <= anc.budget ? "#D4A800" : "#E8002D" }}>
                {(intel.cost_total ?? 0) <= anc.budget ? `$${anc.budget - (intel.cost_total ?? 0)} under` : `$${(intel.cost_total ?? 0) - anc.budget} over`} budget
              </span>
            </div>
          )}
        </div>
        <div className="ir">
          <div className="ic"><div className="it">Best Neighborhood</div><div className="im">{intel.neighborhood ?? "—"}</div><div className="ib">{intel.neighborhood_why ?? ""}</div></div>
          <div className="ic"><div className="it">Visa & Entry</div><div className="im" style={{ color: (intel.visa_ease ?? 5) >= 7 ? "#b8860b" : "#c87000" }}>Ease {intel.visa_ease ?? "—"}/10</div><div className="ib">{intel.visa_details ?? ""}</div></div>
        </div>
        <div className="ir">
          <div className="ic"><div className="it">Community</div><div className="im">{intel.community_vibe ?? ""}</div>
            <div className="ib" style={{ display: "flex", gap: 10, marginTop: 7 }}>
              <span style={{ fontFamily: "JetBrains Mono", fontSize: 10 }}>English <span style={{ color: "#E8002D" }}>{intel.english_friendly ?? 0}/10</span></span>
              <span style={{ fontFamily: "JetBrains Mono", fontSize: 10 }}>Cowork <span style={{ color: "#E8002D" }}>{intel.coworking_scene ?? 0}/10</span></span>
            </div>
          </div>
          <div className="ic"><div className="it">Safety & Air</div>
            <div className="im" style={{ fontFamily: "JetBrains Mono", fontSize: 21, color: (intel.safety ?? 0) >= 7 ? "#16a34a" : (intel.safety ?? 0) >= 5 ? "#c87000" : "#E8002D" }}>{intel.safety ?? 0}/10</div>
            <div className="ib">Air quality: {intel.air_quality ?? 0}/10</div>
          </div>
        </div>
      </>}

      {tab === "climate" && <>
        <div className="card"><WChart wx={wx} /></div>
        {bM.length > 0 && (
          <div className="card">
            <div className="ch"><div className="ct">Best Months</div></div>
            <div className="mr">
              {MOS.map(m => <span key={m} className={`mc ${bM.includes(m) ? "mb" : wM.includes(m) ? "mbd" : "mo"}`}>{m}</span>)}
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
              {[["#b8860b", "Best"], ["#6b7280", "OK"], ["#E8002D", "Avoid"]].map(([c, l]) => (
                <span key={l} style={{ fontFamily: "JetBrains Mono", fontSize: 10, color: c }}>● {l}</span>
              ))}
            </div>
          </div>
        )}
        {wx?.daily && (() => {
          const avgH = Math.round(wx.daily.temperature_2m_max.reduce((a, b) => a + b, 0) / 7);
          const avgS = Math.round(wx.daily.sunshine_duration.reduce((a, b) => a + b, 0) / 3600 / 7);
          const totR = wx.daily.precipitation_sum.reduce((a, b) => a + b, 0).toFixed(1);
          const avgW = wx.daily.wind_speed_10m_max ? Math.round(wx.daily.wind_speed_10m_max.reduce((a, b) => a + b, 0) / 7) : 0;
          return (
            <div className="ir">
              <div className="ic"><div className="it">This Week</div><div className="im" style={{ fontFamily: "JetBrains Mono", fontSize: 20, color: "#1B365D" }}>{avgH}°C avg</div><div className="ib">{avgS}h sun/day · {totR}mm rain</div></div>
              <div className="ic"><div className="it">Wind & Air</div><div className="im" style={{ fontFamily: "JetBrains Mono", fontSize: 20, color: "#D4A800" }}>{avgW} km/h</div><div className="ib">Air quality {intel.air_quality ?? 0}/10</div></div>
            </div>
          );
        })()}
        {intel.climate_note && <div className="card"><div className="ch"><div className="ct">Climate Note</div></div><p style={{ color: "#5a6577", fontSize: 13, lineHeight: 1.65 }}>{intel.climate_note}</p></div>}
      </>}

      <div style={{ display: "flex", gap: 9, marginTop: 10 }}>
        <button className="btn bg" style={{ flex: 1 }} onClick={onBack}>Try Another City</button>
        <button className="btn bp" style={{ flex: 2, marginTop: 0 }} onClick={onBack}>New Analysis →</button>
      </div>
    </div>
  );
}

/* ── ROOT ── */
export default function App() {
  const [screen, setScreen] = useState("onboard");
  const [mode, setMode] = useState("nomad");
  const [anc, setAnc] = useState({ currentCity: "", budget: 2500, internet: 80, workspace: 7, outdoor: 7, minInternet: 30, minWorkspace: 5 });
  const [prefs, setPrefs] = useState(["hiking", "urban"]);
  const [city, setCity] = useState("");
  const [logs, setLogs] = useState([]);
  const [ags, setAgs] = useState({});
  const [res, setRes] = useState(null);
  const [running, setRunning] = useState(false);
  const logRef = useRef(null);
  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, [logs]);

  const upd = (k, v) => setAnc(p => ({ ...p, [k]: v }));
  const log = (agent, msg, s = "running") => {
    setLogs(p => [...p, { agent, msg, s, id: Date.now() + Math.random() }]);
    setAgs(p => ({ ...p, [agent]: s }));
  };


  const run = async () => {
    if (!city.trim()) return;
    setRunning(true); setLogs([]); setAgs({}); setRes(null);
    try {
      log("SCOUT", "Locating city and coordinates…");
      log("TERRA", "Fetching 7-day climate data (Open-Meteo)…");
      log("LEDGER", "Analysing costs, visa & community…");
      log("ORACLE", "Building intelligence + activity map…");

      const data = await analyzeCity({ mode, target_city: city, anchor: anc, prefs });
      const geo = data.geo;
      const wx = data.weather;
      const fullIntel = data.intel;

      log("SCOUT", `Located: ${geo.name}, ${geo.country_code?.toUpperCase()}`, "done");
      log("TERRA", "Climate data retrieved", "done");
      log("LEDGER", "Cost, visa & community analysis ready", "done");
      log("ORACLE", `${(fullIntel.activities || []).length} mapped locations + synthesis ready`, "done");

      const av = { internet: anc.internet, workspace: anc.workspace, cost: anc.budget, safety: 6, outdoor: anc.outdoor, lifestyle: 6 };
      const tv = { internet: fullIntel.internet, workspace: fullIntel.workspace, cost: fullIntel.cost_total, safety: fullIntel.safety, outdoor: fullIntel.outdoor, lifestyle: fullIntel.lifestyle };
      const d = delta(av, tv);

      setRes({ city: geo.name, country: geo.country, code: geo.country_code?.toUpperCase(), geo, wx, intel: fullIntel, d, v: verdict(d, mode, anc), mode, anc, prefs });
      setScreen("results");
    } catch (e) {
      log("ORACLE", `Error: ${e.message}`, "error");
    }
    setRunning(false);
  };

  const reset = () => { setCity(""); setRes(null); setLogs([]); setScreen("analyze"); };

  return (<>
    <F />
    <style>{S}</style>
    <nav className="nav">
      <div className="logo">NOMAD<em>·</em>INTELLIGENCE</div>

      {screen !== "onboard" && <div className="nmode">{MODES[mode]?.icon} {mode.toUpperCase()}</div>}
    </nav>
    {screen === "onboard" && <Onboard mode={mode} setMode={setMode} anc={anc} upd={upd} prefs={prefs} setPrefs={setPrefs} onNext={() => setScreen("analyze")} />}
    {screen === "analyze" && <Analyze mode={mode} anc={anc} prefs={prefs} city={city} setCity={setCity} logs={logs} logRef={logRef} ags={ags} running={running} onRun={run} onBack={() => setScreen("onboard")} />}
    {screen === "results" && res && <Results res={res} onBack={reset} />}
  </>);
}
