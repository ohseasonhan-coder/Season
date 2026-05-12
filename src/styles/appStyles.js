export const STYLES = `
@import url('https://cdn.jsdelivr.net/npm/pretendard@1.3.9/dist/web/static/pretendard.css');
*{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#0d0f14;
  --surface:#161920;
  --surface2:#1e2129;
  --surface3:#252830;
  --border:#2a2d36;
  --border2:#353840;
  --text:#f0f1f3;
  --text2:#9ba3b5;
  --text3:#5a6278;
  --accent:#6c7dff;
  --accent2:#8b9aff;
  --accent-bg:rgba(108,125,255,0.12);
  --green:#34d58a;
  --green-bg:rgba(52,213,138,0.12);
  --red:#ff5c72;
  --red-bg:rgba(255,92,114,0.12);
  --amber:#f0b429;
  --amber-bg:rgba(240,180,41,0.12);
  --radius:14px;
  --radius-lg:20px;
  --radius-xl:28px;
  --shadow:0 2px 12px rgba(0,0,0,0.4);
  --shadow-lg:0 8px 32px rgba(0,0,0,0.5);
}

/* ═══════════════════════════════════════
   SCROLL ROOT — body가 유일한 스크롤 컨테이너
   모든 wrapper는 높이 고정 없이 콘텐츠 크기만큼 늘어남
═══════════════════════════════════════ */
html {
  height: 100%;
  overflow-x: hidden;
}
body {
  font-family: 'Pretendard', sans-serif;
  background: var(--bg);
  color: var(--text);
  min-height: 100%;
  min-height: 100dvh;
  height: auto;               /* 고정 높이 없음 */
  overflow-x: hidden;
  overflow-y: auto;           /* body가 스크롤 */
  -webkit-overflow-scrolling: touch;
  -webkit-font-smoothing: antialiased;
}
button { font-family: inherit; cursor: pointer; }
input, select, textarea { font-family: inherit; }

/* Scrollbar */
*::-webkit-scrollbar{width:4px;height:4px}
*::-webkit-scrollbar-track{background:transparent}
*::-webkit-scrollbar-thumb{background:var(--border2);border-radius:99px}

/* ─── Layout wrappers — 절대 height 고정 금지 ─── */
.app {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  height: auto;               /* ← 핵심: auto */
  overflow: visible;          /* ← 자식 잘리지 않게 */
}
.shell {
  display: flex;
  flex: 1;
  height: auto;               /* ← auto */
  overflow: visible;
}
.main {
  flex: 1;
  margin-left: 220px;
  height: auto;               /* ← auto */
  overflow: visible;
  transition: margin-left .28s cubic-bezier(.2,.8,.2,1);
}
.page {
  padding: 28px 32px;
  max-width: 1400px;
  height: auto;
  overflow: visible;
}

/* Sidebar Nav */
.sidebar{width:220px;flex-shrink:0;background:var(--surface);border-right:1px solid var(--border);display:flex;flex-direction:column;padding:20px 12px;gap:4px;overflow-y:auto;position:fixed;height:100vh;height:100dvh;z-index:50}
.sidebar-logo{padding:8px 12px 20px;display:flex;align-items:center;gap:10px}
.logo-mark{width:32px;height:32px;background:var(--accent);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:900;color:#fff;flex-shrink:0}
.logo-text{font-size:14px;font-weight:700;color:var(--text);letter-spacing:-.02em}
.logo-sub{font-size:10px;color:var(--text3);margin-top:1px}
.nav-section{font-size:10px;font-weight:700;color:var(--text3);letter-spacing:.08em;padding:12px 12px 6px;text-transform:uppercase}
.nav-item{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:10px;font-size:13px;font-weight:500;color:var(--text2);cursor:pointer;transition:.15s ease;border:none;background:none;width:100%;text-align:left;white-space:nowrap}
.nav-item:hover{background:var(--surface2);color:var(--text)}
.nav-item.active{background:var(--accent-bg);color:var(--accent);font-weight:600}
.nav-item .nav-icon{font-size:15px;width:20px;text-align:center;flex-shrink:0}
.nav-dot{width:6px;height:6px;border-radius:99px;background:var(--red);margin-left:auto;flex-shrink:0}

/* Collapsible sidebar */
.sidebar{
  transition:width .28s cubic-bezier(.2,.8,.2,1), padding .28s cubic-bezier(.2,.8,.2,1), background .28s ease, box-shadow .28s ease;
  backdrop-filter:blur(22px) saturate(160%);
  -webkit-backdrop-filter:blur(22px) saturate(160%);
  background:rgba(22,25,32,.82);
  box-shadow:inset -1px 0 0 rgba(255,255,255,.04), 12px 0 40px rgba(0,0,0,.18);
}
.sidebar-logo,.nav-item,.sidebar-toggle{transition:all .24s cubic-bezier(.2,.8,.2,1)}
.logo-copy,.nav-label,.nav-section{transition:opacity .16s ease, transform .18s ease}
.sidebar-toggle{height:32px;margin:2px 6px 10px;border:1px solid rgba(255,255,255,.08);border-radius:14px;background:rgba(255,255,255,.055);color:rgba(240,241,243,.72);font-weight:800;display:flex;align-items:center;justify-content:center;transition:background .18s ease,color .18s ease,transform .18s ease,border-color .18s ease,box-shadow .18s ease;box-shadow:inset 0 1px 0 rgba(255,255,255,.05);}
.sidebar-toggle:hover{background:rgba(255,255,255,.105);color:#fff;border-color:rgba(255,255,255,.14);transform:translateY(-1px);box-shadow:0 8px 20px rgba(0,0,0,.18), inset 0 1px 0 rgba(255,255,255,.07);}
.toggle-glyph{font-size:16px;line-height:1;opacity:.86;transform:translateY(-1px);transition:transform .2s cubic-bezier(.2,.8,.2,1), opacity .18s ease;}
.sidebar-toggle:hover .toggle-glyph{opacity:1;transform:translateY(-1px) scale(1.12)}
.sidebar.collapsed{width:72px;padding:14px 10px;background:rgba(22,25,32,.9);overflow:visible;}
.sidebar.collapsed .sidebar-logo{padding:4px 0 8px;justify-content:center;margin-bottom:0;}
.sidebar.collapsed .logo-mark{width:34px;height:34px;border-radius:12px;}
.sidebar.collapsed .logo-copy,.sidebar.collapsed .nav-label{opacity:0;transform:translateX(-8px);pointer-events:none;width:0;max-width:0;overflow:hidden;}
.sidebar.collapsed .nav-section{display:none;}
.sidebar.collapsed .nav-item{width:42px;height:40px;min-height:40px;justify-content:center;padding:0;margin:2px auto;gap:0;border-radius:15px;position:relative;overflow:visible;}
.sidebar.collapsed .nav-item.active{background:rgba(108,125,255,.18);box-shadow:inset 0 0 0 1px rgba(108,125,255,.16);}
.sidebar.collapsed .nav-icon{width:auto;font-size:17px;line-height:1;}
.sidebar.collapsed .nav-dot{position:absolute;right:8px;top:8px;margin-left:0;}
.sidebar.collapsed .sidebar-toggle{width:42px;height:30px;margin:0 auto 8px;border-radius:15px;}
.main.expanded{margin-left:72px}
.nav-item{position:relative;overflow:hidden}
.nav-item:before{content:"";position:absolute;inset:0;border-radius:inherit;background:linear-gradient(135deg,rgba(255,255,255,.08),transparent 65%);opacity:0;transition:opacity .18s ease;pointer-events:none;}
.nav-item:hover:before,.nav-item.active:before{opacity:1}
.sidebar.collapsed .nav-item::after{content:attr(data-tip);position:absolute;left:calc(100% + 12px);top:50%;transform:translateY(-50%) translateX(-4px);opacity:0;visibility:hidden;pointer-events:none;white-space:nowrap;z-index:9999;padding:8px 10px;border-radius:12px;background:rgba(28,30,36,.96);color:#f5f7fb;border:1px solid rgba(255,255,255,.10);box-shadow:0 14px 30px rgba(0,0,0,.28);font-size:12px;font-weight:700;letter-spacing:-.01em;transition:opacity .14s ease, transform .14s ease, visibility .14s ease;}
.sidebar.collapsed .nav-item::before{border-radius:15px;}
.sidebar.collapsed .nav-item:hover::after{opacity:1;visibility:visible;transform:translateY(-50%) translateX(0);}

/* Top bar */
.topbar{padding:16px 32px;border-bottom:1px solid var(--border);background:var(--surface);display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:40}
.topbar-title{font-size:18px;font-weight:700;letter-spacing:-.02em}
.topbar-right{display:flex;align-items:center;gap:10px}

/* Cards */
.card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:22px}
.card-sm{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:16px}
.card h3{font-size:14px;font-weight:600;color:var(--text);margin-bottom:16px;letter-spacing:-.01em}
.card-title{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}
.card-title h3{margin-bottom:0}

/* KPI Cards */
.kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px}
.kpi-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:20px;position:relative;overflow:hidden;transition:.2s ease}
.kpi-card:hover{border-color:var(--border2);transform:translateY(-1px)}
.kpi-card::after{content:"";position:absolute;inset:0;border-radius:inherit;background:linear-gradient(135deg,rgba(255,255,255,.02) 0%,transparent 60%);pointer-events:none}
.kpi-label{font-size:11px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px}
.kpi-value{font-size:26px;font-weight:800;letter-spacing:-.04em;color:var(--text);line-height:1}
.kpi-unit{font-size:13px;font-weight:500;color:var(--text3);margin-left:2px}
.kpi-sub{font-size:11px;margin-top:8px;display:flex;align-items:center;gap:5px}
.kpi-accent{border-color:rgba(108,125,255,.35);background:linear-gradient(135deg,var(--surface) 60%,rgba(108,125,255,.08))}
.kpi-green{border-color:rgba(52,213,138,.25)}
.kpi-red{border-color:rgba(255,92,114,.25)}

/* Grid */
.g2{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}
.g3{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.g4{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
.stack{display:flex;flex-direction:column;gap:14px}
.row{display:flex;align-items:center;gap:10px}
.row-between{display:flex;align-items:center;justify-content:space-between;gap:10px}

/* Badges */
.badge{display:inline-flex;align-items:center;padding:3px 9px;border-radius:99px;font-size:11px;font-weight:600}
.badge-accent{background:var(--accent-bg);color:var(--accent)}
.badge-green{background:var(--green-bg);color:var(--green)}
.badge-red{background:var(--red-bg);color:var(--red)}
.badge-amber{background:var(--amber-bg);color:var(--amber)}
.badge-muted{background:var(--surface2);color:var(--text2)}

/* Buttons */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:9px 16px;border-radius:10px;font-size:13px;font-weight:600;border:none;transition:.15s ease;white-space:nowrap}
.btn:hover{opacity:.88;transform:translateY(-1px)}
.btn:active{transform:translateY(0)}
.btn-primary{background:var(--accent);color:#fff}
.btn-ghost{background:var(--surface2);color:var(--text2);border:1px solid var(--border)}
.btn-danger{background:var(--red-bg);color:var(--red);border:1px solid rgba(255,92,114,.25)}
.btn-success{background:var(--green-bg);color:var(--green);border:1px solid rgba(52,213,138,.25)}
.btn-sm{padding:6px 12px;font-size:12px;border-radius:8px}

/* Forms */
.field{display:flex;flex-direction:column;gap:6px}
.field label{font-size:11px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:.05em}
.field input,.field select,.field textarea{width:100%;padding:10px 13px;border:1px solid var(--border2);border-radius:10px;background:var(--surface2);color:var(--text);font-size:13px;transition:.15s;outline:none}
.field input:focus,.field select:focus,.field textarea:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-bg)}
.field textarea{min-height:80px;resize:vertical}
.field select option{background:var(--surface2)}
.table-wrap input,.table-wrap select,.table-wrap textarea{width:100%;min-width:92px;padding:9px 12px;border:1px solid var(--border2);border-radius:10px;background:var(--surface2);color:var(--text);font-size:13px;transition:.15s;outline:none;font-family:inherit}
.table-wrap input:focus,.table-wrap select:focus,.table-wrap textarea:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-bg)}
.table-wrap input::placeholder{color:var(--text3)}
.form-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
.form-grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.form-actions{display:flex;gap:8px;margin-top:14px}

/* Field validation */
.field-label-with-alert{display:flex;align-items:center;gap:6px}
.field-hint{font-size:10.5px;color:var(--text3);margin-top:5px;line-height:1.35;opacity:0;max-height:0;overflow:hidden;transition:opacity .14s ease, max-height .14s ease, margin-top .14s ease;margin-top:0!important;}
.field:hover .field-hint,.field:focus-within .field-hint{opacity:1;max-height:28px;margin-top:5px!important;}
.field-alert-dot{position:relative;width:15px;height:15px;border-radius:99px;display:inline-flex;align-items:center;justify-content:center;font-size:10px;font-weight:900;line-height:1;cursor:help;transition:.16s ease;box-shadow:0 0 0 1px rgba(255,255,255,.08), 0 6px 14px rgba(0,0,0,.18);outline:none;}
.field-alert-dot.danger{background:var(--red-bg);color:var(--red);border:1px solid rgba(255,92,114,.32)}
.field-alert-dot.warn{background:var(--amber-bg);color:var(--amber);border:1px solid rgba(240,180,41,.32)}
.field-alert-dot::after{content:attr(data-msg);position:absolute;bottom:140%;left:50%;transform:translateX(-50%) translateY(4px);min-width:max-content;max-width:260px;padding:7px 9px;border-radius:9px;background:rgba(20,22,28,.98);color:#fff;border:1px solid rgba(255,255,255,.12);box-shadow:0 12px 28px rgba(0,0,0,.36);font-size:11px;font-weight:700;white-space:nowrap;opacity:0;visibility:hidden;pointer-events:none;z-index:9999;transition:opacity .14s ease, transform .14s ease, visibility .14s ease;}
.field-alert-dot:hover::after,.field-alert-dot:focus::after{opacity:1;visibility:visible;transform:translateX(-50%) translateY(0);}
.field-has-error input,.field-has-error select,.field-has-error textarea{border-color:rgba(255,92,114,.55)!important;box-shadow:0 0 0 3px rgba(255,92,114,.10)}
.field-has-warn input,.field-has-warn select,.field-has-warn textarea{border-color:rgba(240,180,41,.46)!important;box-shadow:0 0 0 3px rgba(240,180,41,.09)}
.suggestion-chips{display:flex;gap:6px;flex-wrap:wrap;margin-top:7px}
.suggestion-chip{border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.045);color:var(--text2);padding:4px 8px;border-radius:999px;font-size:10.5px;font-weight:700;transition:.15s ease;}
.suggestion-chip:hover{background:rgba(108,125,255,.14);border-color:rgba(108,125,255,.24);color:var(--accent2);transform:translateY(-1px)}
.input-status-row{margin-top:12px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;}
.input-status-left,.input-status-right{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.input-status-caption{font-size:11px;color:var(--text3)}

/* Info tooltip */
.info-tooltip{position:relative;display:inline-flex;align-items:center;justify-content:center;min-width:22px;height:22px;padding:0 8px;border-radius:999px;font-size:11px;font-weight:900;cursor:help;border:1px solid rgba(255,255,255,.10);background:rgba(255,255,255,.045);color:var(--text2);outline:none;}
.info-tooltip.ok{background:var(--green-bg);color:var(--green);border-color:rgba(52,213,138,.25)}
.info-tooltip.danger{background:var(--red-bg);color:var(--red);border-color:rgba(255,92,114,.28)}
.info-tooltip.warn{background:var(--amber-bg);color:var(--amber);border-color:rgba(240,180,41,.28)}
.info-tooltip.info{background:var(--accent-bg);color:var(--accent2);border-color:rgba(108,125,255,.24)}
.info-tooltip::after{content:attr(data-msg);position:absolute;top:130%;left:50%;transform:translateX(-50%) translateY(-4px);min-width:max-content;max-width:320px;padding:8px 10px;border-radius:10px;background:rgba(20,22,28,.98);color:#fff;border:1px solid rgba(255,255,255,.12);box-shadow:0 14px 30px rgba(0,0,0,.34);font-size:11px;font-weight:700;white-space:nowrap;opacity:0;visibility:hidden;pointer-events:none;z-index:9999;transition:opacity .14s ease, transform .14s ease, visibility .14s ease;}
.info-tooltip:hover::after,.info-tooltip:focus::after{opacity:1;visibility:visible;transform:translateX(-50%) translateY(0);}

/* CFO verification */
.cfo-verification-panel{margin-top:14px;padding:14px;border-radius:20px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.075)}
.cfo-verification-panel strong{font-size:13px;color:var(--text)}
.cfo-verification-panel p{font-size:11.5px;color:var(--text3);margin-top:3px;line-height:1.45}
.cfo-verification-grid{display:flex;flex-direction:column;gap:7px;margin-top:12px}
.cfo-verification-row{display:grid;grid-template-columns:minmax(86px,1fr) minmax(86px,auto) 16px minmax(86px,auto);align-items:center;gap:8px;padding:9px 10px;border-radius:13px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.055);}
.cfo-verification-row span{font-size:11.5px;color:var(--text3);font-weight:800}
.cfo-verification-row b{font-size:11.5px;color:var(--text);font-variant-numeric:tabular-nums;text-align:right;white-space:nowrap}
.cfo-verification-row em{font-style:normal;color:var(--text3);font-weight:900;text-align:center}
.cfo-force-run{display:flex;align-items:center;gap:7px;margin-top:8px;font-size:12px;font-weight:800;color:var(--text);cursor:pointer}
@media(max-width:760px){.cfo-verification-row{grid-template-columns:1fr;gap:4px;}.cfo-verification-row b{text-align:left;white-space:normal}.cfo-verification-row em{display:none}}

/* Table */
.table-wrap{overflow:auto;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface)}
table{width:100%;border-collapse:collapse;font-size:12.5px}
thead tr{background:var(--surface2)}
th{padding:10px 12px;text-align:left;font-size:11px;font-weight:700;color:var(--text3);letter-spacing:.04em;text-transform:uppercase;border-bottom:1px solid var(--border);white-space:nowrap;position:sticky;top:0;background:var(--surface2);z-index:1}
td{padding:10px 12px;border-bottom:1px solid var(--border);color:var(--text2);vertical-align:middle}
tr:last-child td{border-bottom:none}
tr:hover td{background:rgba(255,255,255,.02);color:var(--text)}
.td-right{text-align:right}
.td-mono{font-variant-numeric:tabular-nums;font-family:'Pretendard',monospace}
.td-name{font-weight:600;color:var(--text)}

/* Progress bar */
.progress{height:5px;border-radius:99px;background:var(--surface3);overflow:hidden}
.progress-fill{height:100%;border-radius:99px;transition:width .4s ease}
.pf-accent{background:var(--accent)}
.pf-green{background:var(--green)}
.pf-red{background:var(--red)}
.pf-amber{background:var(--amber)}

.type-income{color:var(--green)}
.type-expense{color:var(--red)}
.type-transfer{color:var(--text2)}
.hr{height:1px;background:var(--border);margin:16px 0}

/* Alert */
.alert{padding:12px 14px;border-radius:10px;font-size:13px}
.alert-ok{background:var(--green-bg);border:1px solid rgba(52,213,138,.25);color:var(--green)}
.alert-warn{background:var(--amber-bg);border:1px solid rgba(240,180,41,.25);color:var(--amber)}
.alert-danger{background:var(--red-bg);border:1px solid rgba(255,92,114,.25);color:var(--red)}
.alert-info{background:var(--accent-bg);border:1px solid rgba(108,125,255,.25);color:var(--accent2)}
.empty{padding:32px;text-align:center;color:var(--text3);font-size:13px}

/* Auth */
.auth-bar{background:rgba(13,15,20,.72);backdrop-filter:blur(16px) saturate(150%);-webkit-backdrop-filter:blur(16px) saturate(150%);border-bottom:1px solid rgba(255,255,255,.06);padding:10px 28px;display:flex;align-items:center;justify-content:space-between;gap:14px;font-size:12px;color:var(--text3);}
.auth-bar-logo-row{display:flex;align-items:center;gap:8px}
.auth-bar-logo{width:22px;height:22px;border-radius:7px;background:var(--accent);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;color:#fff}
.auth-bar-brand{font-size:12px;font-weight:700;color:var(--text2);letter-spacing:-.01em}
.auth-bar-sync{display:flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;background:rgba(52,213,138,.09);border:1px solid rgba(52,213,138,.18);font-size:11px;font-weight:700;color:var(--green)}
.auth-bar-sync.syncing{background:rgba(108,125,255,.09);border-color:rgba(108,125,255,.18);color:var(--accent2)}
.auth-bar-sync.error{background:rgba(255,92,114,.09);border-color:rgba(255,92,114,.18);color:var(--red)}
.auth-input{padding:8px 13px;border:1px solid rgba(255,255,255,.10);border-radius:10px;background:rgba(255,255,255,.055);color:var(--text);font-size:12px;outline:none;min-width:160px;transition:.15s ease}
.auth-input:focus{border-color:var(--accent);background:rgba(108,125,255,.08);box-shadow:0 0 0 3px rgba(108,125,255,.12)}
.auth-input::placeholder{color:var(--text3)}

/* Charts */
.chart-svg{width:100%;height:auto;display:block}
.chart-legend{display:flex;gap:14px;flex-wrap:wrap;margin-bottom:10px;font-size:11px;color:var(--text3)}
.legend-dot{display:inline-block;width:8px;height:8px;border-radius:99px;margin-right:4px}
.donut-wrap{display:grid;grid-template-columns:220px 1fr;gap:16px;align-items:center}

/* Stat row */
.stat-row{display:flex;align-items:center;justify-content:space-between;padding:9px 0;border-bottom:1px solid var(--border);font-size:13px}
.stat-row:last-child{border-bottom:none}
.stat-label{color:var(--text3)}
.stat-value{font-weight:600;color:var(--text);font-variant-numeric:tabular-nums}
.muted{color:var(--text3)}
.mono{font-variant-numeric:tabular-nums}
.text-green{color:var(--green)}
.text-red{color:var(--red)}
.text-accent{color:var(--accent)}
.fw7{font-weight:700}
.small{font-size:12px}

/* FAB */
.fab{position:fixed;bottom:28px;right:28px;z-index:100;width:56px;height:56px;border-radius:99px;background:var(--accent);border:none;color:#fff;font-size:22px;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 28px rgba(108,125,255,.5);cursor:pointer;transition:.22s cubic-bezier(.2,.8,.2,1);font-weight:300}
.fab:hover{transform:scale(1.1) translateY(-2px);box-shadow:0 14px 36px rgba(108,125,255,.6)}
.fab.fab-open{transform:rotate(45deg) scale(1.08);background:var(--red)}
.fab-hint{position:fixed;bottom:96px;right:22px;z-index:101;background:var(--surface);border:1px solid var(--border2);border-radius:14px;padding:10px 14px;font-size:12px;font-weight:700;color:var(--text);box-shadow:var(--shadow-lg);cursor:pointer;animation:fabHintIn .4s cubic-bezier(.2,.8,.2,1);white-space:nowrap}
.fab-hint-arrow{position:absolute;bottom:-7px;right:24px;width:14px;height:7px;background:var(--surface);clip-path:polygon(0 0,100% 0,50% 100%);border-left:1px solid var(--border2);border-right:1px solid var(--border2)}
.fab-hint-text{display:flex;align-items:center;gap:6px}
@keyframes fabHintIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.empty-state-wrap{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:56px 20px;text-align:center}
.empty-state-icon{font-size:42px;margin-bottom:14px}
.empty-state-title{font-size:16px;font-weight:700;color:var(--text);margin-bottom:8px}
.empty-state-desc{font-size:13px;color:var(--text3);line-height:1.6;margin-bottom:18px;max-width:320px}
.empty-state-actions{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}
.empty-state-btn{padding:10px 20px;border-radius:11px;font-size:13px;font-weight:700;cursor:pointer;border:none;font-family:inherit;transition:.15s}
.empty-state-btn.primary{background:var(--accent);color:#fff}
.empty-state-btn.ghost{background:var(--surface2);color:var(--text2);border:1px solid var(--border)}
.empty-state-banner{background:linear-gradient(135deg,rgba(108,125,255,.07),rgba(52,213,138,.05));border:1px solid rgba(108,125,255,.2);border-radius:var(--radius-lg);padding:20px 22px;display:flex;gap:16px;align-items:flex-start;margin-bottom:4px}
.esb-icon{font-size:28px;flex-shrink:0;margin-top:2px}
.esb-body{flex:1}
.esb-title{font-size:15px;font-weight:800;color:var(--text);margin-bottom:5px;letter-spacing:-.01em}
.esb-desc{font-size:12.5px;color:var(--text3);margin-bottom:12px;line-height:1.55}
.esb-steps{display:flex;flex-direction:column;gap:7px}
.esb-step{display:flex;align-items:center;gap:10px;font-size:12px;color:var(--text2)}
.esb-num{width:20px;height:20px;border-radius:50%;background:var(--accent-bg);color:var(--accent);font-size:10px;font-weight:900;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.esb-step strong{color:var(--text)}
.dashboard-greeting-row{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:2px}
.dashboard-greeting{font-size:14px;color:var(--text3);padding:2px 4px;font-weight:400}
.dashboard-greeting strong{color:var(--text);font-weight:700}
.streak-badge{display:inline-flex;align-items:center;gap:5px;padding:4px 12px;border-radius:99px;background:rgba(240,180,41,.1);border:1px solid rgba(240,180,41,.25);font-size:12px;font-weight:700;color:var(--amber);animation:streakPop .4s cubic-bezier(.2,.8,.2,1)}
@keyframes streakPop{from{transform:scale(.85);opacity:0}to{transform:scale(1);opacity:1}}

/* 커맨드 팔레트 */
.cmd-overlay{position:fixed;inset:0;z-index:99990;background:rgba(0,0,0,.7);backdrop-filter:blur(16px);display:flex;align-items:flex-start;justify-content:center;padding-top:80px;animation:cmdIn .15s ease}
@keyframes cmdIn{from{opacity:0}to{opacity:1}}
.cmd-box{background:var(--surface);border:1px solid rgba(108,125,255,.25);border-radius:20px;width:100%;max-width:580px;box-shadow:0 32px 80px rgba(0,0,0,.6),0 0 0 1px rgba(108,125,255,.08);overflow:hidden;animation:cmdUp .2s cubic-bezier(.16,1,.3,1)}
@keyframes cmdUp{from{transform:translateY(-12px);opacity:0}to{transform:translateY(0);opacity:1}}
.cmd-search-row{display:flex;align-items:center;gap:10px;padding:14px 18px;border-bottom:1px solid var(--border)}
.cmd-search-icon{font-size:16px;flex-shrink:0;opacity:.6}
.cmd-input{flex:1;background:none;border:none;outline:none;font-size:15px;color:var(--text);font-family:inherit}
.cmd-input::placeholder{color:var(--text3)}
.cmd-esc{padding:3px 7px;border-radius:6px;background:var(--surface2);border:1px solid var(--border2);font-size:11px;color:var(--text3);cursor:pointer;flex-shrink:0;font-family:inherit}
.cmd-list{max-height:360px;overflow-y:auto;padding:6px}
.cmd-empty{padding:28px;text-align:center;font-size:13px;color:var(--text3)}
.cmd-item{display:flex;align-items:center;gap:10px;width:100%;padding:10px 12px;border-radius:12px;border:none;background:none;cursor:pointer;text-align:left;font-family:inherit;transition:.12s}
.cmd-item:hover,.cmd-item.sel{background:var(--accent-bg)}
.cmd-item-icon{font-size:16px;width:22px;flex-shrink:0;text-align:center}
.cmd-item-label{font-size:13px;font-weight:600;color:var(--text);flex-shrink:0}
.cmd-item-desc{font-size:12px;color:var(--text3);flex:1;text-overflow:ellipsis;overflow:hidden;white-space:nowrap}
.cmd-enter{padding:2px 6px;border-radius:5px;background:var(--surface2);border:1px solid var(--border2);font-size:10px;color:var(--text3);flex-shrink:0;font-family:inherit}
.cmd-footer{display:flex;align-items:center;gap:14px;padding:10px 18px;border-top:1px solid var(--border);font-size:11px;color:var(--text3)}
.cmd-footer kbd{padding:2px 5px;border-radius:4px;background:var(--surface2);border:1px solid var(--border2);font-size:10px;font-family:inherit}
.cmd-footer-tip{margin-left:auto;color:var(--text3)}

/* topbar 검색 버튼 */
.topbar-search-btn{display:flex;align-items:center;gap:6px;padding:5px 10px;border-radius:9px;background:var(--surface2);border:1px solid var(--border);color:var(--text2);font-size:12px;cursor:pointer;font-family:inherit;transition:.15s}
.topbar-search-btn:hover{background:var(--surface3);color:var(--text);border-color:var(--accent)}
.topbar-search-label{font-weight:500}
.topbar-kbd{padding:1px 5px;border-radius:4px;background:var(--surface3);border:1px solid var(--border2);font-size:10px;color:var(--text3);font-family:inherit}

/* 금융 용어 툴팁 */
.term-tip{position:relative;display:inline-flex;align-items:center;gap:3px;cursor:help;border-bottom:1px dashed rgba(108,125,255,.4)}
.term-tip-icon{display:inline-flex;align-items:center;justify-content:center;width:14px;height:14px;border-radius:50%;background:var(--accent-bg);color:var(--accent);font-size:9px;font-weight:900;flex-shrink:0}
.term-tip::after{content:attr(data-tip);position:absolute;bottom:calc(100% + 8px);left:50%;transform:translateX(-50%);min-width:220px;max-width:280px;padding:9px 12px;border-radius:11px;background:rgba(20,22,28,.98);color:#f0f1f3;border:1px solid rgba(255,255,255,.12);box-shadow:0 12px 32px rgba(0,0,0,.4);font-size:11.5px;font-weight:400;line-height:1.55;white-space:normal;word-break:keep-all;opacity:0;visibility:hidden;pointer-events:none;z-index:9999;transition:opacity .14s ease,transform .14s ease;transform:translateX(-50%) translateY(4px)}
.term-tip:hover::after,.term-tip:focus::after{opacity:1;visibility:visible;transform:translateX(-50%) translateY(0)}

/* QuickAdd 금액 미리보기 + 최근 카테고리 */
.qa-amount-preview{font-size:11px;color:var(--accent);font-weight:700;margin-top:-4px;margin-bottom:2px;padding-left:2px}
.qa-recent-cats{display:flex;align-items:center;gap:7px;flex-wrap:wrap;padding:8px 2px}
.qa-recent-label{font-size:10px;font-weight:700;color:var(--text3);letter-spacing:.05em;text-transform:uppercase;flex-shrink:0}
.qa-recent-chip{padding:5px 12px;border-radius:99px;font-size:12px;font-weight:600;border:1px solid rgba(108,125,255,.25);background:rgba(108,125,255,.08);color:var(--accent2);cursor:pointer;transition:.15s;font-family:inherit}
.qa-recent-chip:hover{background:rgba(108,125,255,.18);border-color:var(--accent)}

/* QA Sheet */
.qa-overlay{position:fixed;inset:0;z-index:200;background:rgba(0,0,0,.5);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);animation:qa-fade-in .18s ease}
@keyframes qa-fade-in{from{opacity:0}to{opacity:1}}
.qa-sheet{position:fixed;bottom:0;left:0;right:0;z-index:201;background:var(--surface);border-radius:24px 24px 0 0;box-shadow:0 -8px 48px rgba(0,0,0,.45);max-height:92vh;overflow-y:auto;animation:qa-slide-up .28s cubic-bezier(.2,.8,.2,1);padding-bottom:env(safe-area-inset-bottom,0)}
@keyframes qa-slide-up{from{transform:translateY(100%)}to{transform:translateY(0)}}
.qa-handle{width:40px;height:4px;background:var(--border2);border-radius:99px;margin:12px auto 0}
.qa-header{padding:16px 20px 0;display:flex;align-items:center;justify-content:space-between}
.qa-title{font-size:17px;font-weight:700;letter-spacing:-.02em;color:var(--text)}
.qa-close{width:30px;height:30px;border-radius:99px;border:none;background:var(--surface3);color:var(--text3);font-size:16px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:.15s ease}
.qa-close:hover{background:var(--border2);color:var(--text)}
.qa-body{padding:16px 20px 24px}
.qa-type-row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:18px}
.qa-type-btn{padding:12px 6px;border-radius:14px;border:2px solid transparent;background:var(--surface2);color:var(--text2);font-size:13px;font-weight:600;cursor:pointer;transition:.15s ease;text-align:center;font-family:inherit}
.qa-type-btn:hover{background:var(--surface3);color:var(--text)}
.qa-type-btn.active-income{background:var(--green-bg);color:var(--green);border-color:var(--green)}
.qa-type-btn.active-expense{background:var(--red-bg);color:var(--red);border-color:var(--red)}
.qa-type-btn.active-transfer{background:var(--accent-bg);color:var(--accent);border-color:var(--accent)}
.qa-amount-wrap{position:relative;margin-bottom:16px}
.qa-amount-input{width:100%;padding:18px 60px 18px 18px;font-size:28px;font-weight:700;font-family:inherit;border-radius:16px;border:2px solid var(--border2);background:var(--surface2);color:var(--text);outline:none;letter-spacing:-.02em;transition:.15s ease}
.qa-amount-input:focus{border-color:var(--accent);box-shadow:0 0 0 4px var(--accent-bg)}
.qa-amount-unit{position:absolute;right:18px;top:50%;transform:translateY(-50%);font-size:15px;font-weight:600;color:var(--text3)}
.qa-quick-amounts{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px}
.qa-quick-amount{padding:6px 12px;border-radius:99px;border:1px solid var(--border2);background:var(--surface3);color:var(--text2);font-size:12px;font-weight:600;cursor:pointer;transition:.12s ease;font-family:inherit}
.qa-quick-amount:hover{background:var(--accent-bg);color:var(--accent);border-color:var(--accent)}
.qa-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px}
.qa-form-grid.single{grid-template-columns:1fr}
.qa-field{display:flex;flex-direction:column;gap:5px}
.qa-label{font-size:11px;font-weight:700;color:var(--text3);letter-spacing:.04em;text-transform:uppercase}
.qa-select,.qa-input{width:100%;padding:10px 13px;border-radius:12px;border:1.5px solid var(--border2);background:var(--surface2);color:var(--text);font-size:13px;font-family:inherit;outline:none;transition:.15s ease;appearance:none;-webkit-appearance:none}
.qa-select:focus,.qa-input:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-bg)}
.qa-suggestion-row{display:flex;gap:5px;flex-wrap:wrap;margin-top:5px}
.qa-suggestion-chip{padding:3px 8px;border-radius:99px;border:1px solid var(--border);background:var(--surface3);color:var(--text3);font-size:11px;cursor:pointer;font-family:inherit;transition:.12s ease}
.qa-suggestion-chip:hover{background:var(--accent-bg);color:var(--accent);border-color:var(--accent)}
.qa-save-btn{width:100%;padding:16px;border-radius:16px;border:none;font-size:16px;font-weight:700;cursor:pointer;font-family:inherit;transition:.18s ease;margin-top:8px}
.qa-save-btn.income{background:var(--green);color:#fff}
.qa-save-btn.expense{background:var(--red);color:#fff}
.qa-save-btn.transfer{background:var(--accent);color:#fff}
.qa-save-btn:hover{filter:brightness(1.1);transform:translateY(-1px)}
.qa-save-btn:disabled{opacity:.45;cursor:not-allowed;transform:none;filter:none}
.qa-template-section{margin-bottom:16px}
.qa-template-title{font-size:11px;font-weight:700;color:var(--text3);letter-spacing:.04em;text-transform:uppercase;margin-bottom:8px}
.qa-template-list{display:flex;gap:6px;flex-wrap:wrap}
.qa-template-chip{padding:6px 12px;border-radius:99px;border:1px solid var(--border2);background:var(--surface2);color:var(--text2);font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;transition:.12s ease}
.qa-template-chip:hover{background:var(--accent-bg);color:var(--accent);border-color:var(--accent)}
.qa-success-toast{position:fixed;bottom:100px;left:50%;transform:translateX(-50%);z-index:300;background:var(--green);color:#fff;padding:12px 24px;border-radius:99px;font-size:14px;font-weight:700;box-shadow:0 4px 20px rgba(52,213,138,.4);animation:qa-toast-in .25s cubic-bezier(.2,.8,.2,1) forwards}
@keyframes qa-toast-in{from{opacity:0;transform:translateX(-50%) translateY(20px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
@media(min-width:769px){
  .qa-sheet{left:50%;right:auto;width:480px;border-radius:24px;bottom:50%;top:auto;transform:translateX(-50%) translateY(50%);max-height:85vh;animation:qa-modal-in .24s cubic-bezier(.2,.8,.2,1)}
  @keyframes qa-modal-in{from{opacity:0;transform:translateX(-50%) translateY(calc(50% + 24px))}to{opacity:1;transform:translateX(-50%) translateY(50%)}}
}

/* Modal */
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:200;display:flex;align-items:flex-end;justify-content:center;backdrop-filter:blur(4px)}
.modal-sheet{background:var(--surface);border-radius:28px 28px 0 0;padding:28px;width:100%;max-width:680px;max-height:85vh;overflow-y:auto;border-top:1px solid var(--border2)}
.modal-handle{width:40px;height:4px;border-radius:99px;background:var(--border2);margin:0 auto 20px}
.modal-title{font-size:17px;font-weight:700;margin-bottom:20px;letter-spacing:-.02em}

/* Insight / TX / Budget / Gauge / Tab */
.insight-card{background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius);padding:14px;display:flex;gap:12px;align-items:flex-start}
.insight-icon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}
.insight-body h4{font-size:13px;font-weight:600;color:var(--text);margin-bottom:3px}
.insight-body p{font-size:12px;color:var(--text3);line-height:1.5}
.tx-item{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border)}
.tx-item:last-child{border-bottom:none}
.tx-icon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0}
.tx-meta{flex:1;min-width:0}
.tx-name{font-size:13px;font-weight:600;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tx-date{font-size:11px;color:var(--text3);margin-top:2px}
.tx-amt{font-size:14px;font-weight:700;font-variant-numeric:tabular-nums;flex-shrink:0}
.budget-item{padding:12px 0;border-bottom:1px solid var(--border)}
.budget-item:last-child{border-bottom:none}
.budget-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:7px}
.budget-name{font-size:13px;font-weight:600;color:var(--text)}
.budget-nums{font-size:11px;color:var(--text3)}
.gauge-wrap{text-align:center}
.gauge-pct{font-size:32px;font-weight:900;letter-spacing:-.04em;line-height:1;margin:8px 0 4px}
.gauge-label{font-size:11px;color:var(--text3);text-transform:uppercase;letter-spacing:.06em}
.tab-row{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:20px}
.tab-chip{padding:7px 14px;border-radius:99px;font-size:12px;font-weight:600;border:none;cursor:pointer;transition:.15s;background:var(--surface2);color:var(--text2)}
.tab-chip.active{background:var(--accent-bg);color:var(--accent)}
.tab-chip:hover:not(.active){background:var(--surface3);color:var(--text)}

/* Hero sections */
.automation-hero{display:flex;align-items:center;justify-content:space-between;gap:20px;background:linear-gradient(135deg,var(--surface),rgba(108,125,255,.08));border-color:rgba(108,125,255,.20)}
.automation-hero h2{font-size:24px;font-weight:900;letter-spacing:-.04em;margin:4px 0}
.automation-hero p{font-size:13px;color:var(--text3);line-height:1.5}
.automation-score{font-size:52px;font-weight:900;letter-spacing:-.06em;line-height:1}
.automation-score span{font-size:18px;color:var(--text3);margin-left:3px}
.automation-alert{display:grid;grid-template-columns:auto 1fr;gap:12px;align-items:flex-start;padding:13px;border-radius:14px;border:1px solid var(--border);background:var(--surface2)}
.automation-alert.danger{background:var(--red-bg);border-color:rgba(255,92,114,.28)}
.automation-alert.warn{background:var(--amber-bg);border-color:rgba(240,180,41,.28)}
.automation-alert.info{background:var(--accent-bg);border-color:rgba(108,125,255,.24)}
.automation-alert strong{font-size:13px;color:var(--text)}
.automation-alert p{font-size:12px;color:var(--text2);line-height:1.5;margin-top:3px}
.cfo-hero,.goal-hero{display:flex;align-items:center;justify-content:space-between;gap:20px;background:linear-gradient(135deg,var(--surface),rgba(52,213,138,.08));border-color:rgba(52,213,138,.20)}
.cfo-hero h2,.goal-hero h2{font-size:24px;font-weight:900;letter-spacing:-.04em;margin:4px 0}
.cfo-hero p,.goal-hero p{font-size:13px;color:var(--text3);line-height:1.5}
.cfo-score{font-size:52px;font-weight:900;letter-spacing:-.06em;line-height:1}
.cfo-score span{font-size:18px;color:var(--text3);margin-left:3px}
.cfo-step{display:grid;grid-template-columns:34px 1fr;gap:12px;padding:14px;border-radius:14px;border:1px solid var(--border);background:var(--surface2)}
.cfo-step.danger{background:var(--red-bg);border-color:rgba(255,92,114,.25)}
.cfo-step.warn{background:var(--amber-bg);border-color:rgba(240,180,41,.25)}
.cfo-step.info{background:var(--accent-bg);border-color:rgba(108,125,255,.25)}
.cfo-step.green{background:var(--green-bg);border-color:rgba(52,213,138,.25)}
.cfo-step-no{width:30px;height:30px;border-radius:999px;background:rgba(255,255,255,.08);display:flex;align-items:center;justify-content:center;font-weight:900}
.cfo-step strong{display:block;margin:7px 0 4px;font-size:14px;color:var(--text)}
.cfo-step p{font-size:12px;color:var(--text2);line-height:1.5}
.goal-item-pro{border:1px solid var(--border)}
.goal-conflict{border-color:rgba(255,92,114,.35)!important;background:var(--red-bg)}
.goal-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
.goal-head strong{font-size:15px;color:var(--text)}
.goal-head p{font-size:11.5px;color:var(--text3);margin-top:3px}
.goal-item{padding:12px;border-bottom:1px solid var(--border)}
.goal-sub{font-size:12px;color:var(--text3);margin:4px 0}
.decision-hero{display:flex;align-items:center;justify-content:space-between;gap:20px;background:linear-gradient(135deg,var(--surface),rgba(240,180,41,.08));border-color:rgba(240,180,41,.20)}
.decision-hero h2{font-size:24px;font-weight:900;letter-spacing:-.04em;margin:4px 0}
.decision-hero p{font-size:13px;color:var(--text3);line-height:1.5}
.decision-score{font-size:48px;font-weight:900;letter-spacing:-.06em;line-height:1}
.decision-score span{font-size:17px;color:var(--text3);margin-left:3px}
.decision-card{border:1px solid var(--border);background:var(--surface2);border-radius:14px;padding:14px}
.decision-card.danger{background:var(--red-bg);border-color:rgba(255,92,114,.25)}
.decision-card.warn{background:var(--amber-bg);border-color:rgba(240,180,41,.25)}
.decision-card.info{background:var(--accent-bg);border-color:rgba(108,125,255,.25)}
.decision-card.green{background:var(--green-bg);border-color:rgba(52,213,138,.25)}
.decision-card-head{display:flex;align-items:center;gap:8px;margin-bottom:7px}
.decision-card-head strong{font-size:13px;color:var(--text)}
.decision-card p{font-size:12px;color:var(--text2);line-height:1.5}
.decision-action{margin-top:9px;font-size:12px;font-weight:800;color:var(--text)}
.allocation-row{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:12px 0;border-bottom:1px solid var(--border)}
.allocation-row:last-child{border-bottom:none}
.allocation-row strong{font-size:13px;color:var(--text)}
.allocation-row p{font-size:11.5px;color:var(--text3);margin-top:3px}
.allocation-row span{font-size:13px;font-weight:900;color:var(--accent);font-variant-numeric:tabular-nums;white-space:nowrap}
.report-hero{display:flex;align-items:center;justify-content:space-between;gap:20px;background:linear-gradient(135deg,var(--surface),rgba(108,125,255,.08));border-color:rgba(108,125,255,.20)}
.report-hero h2{font-size:24px;font-weight:900;letter-spacing:-.04em;margin:4px 0}
.report-hero p{font-size:13px;color:var(--text3);line-height:1.5}
.monthly-report textarea:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-bg)}
.retirement-hero{display:flex;align-items:center;justify-content:space-between;gap:20px;background:linear-gradient(135deg,var(--surface),rgba(52,213,138,.07));border-color:rgba(52,213,138,.20)}
.retirement-hero h2{font-size:24px;font-weight:900;letter-spacing:-.04em;margin:4px 0}
.retirement-hero p{font-size:13px;color:var(--text3);line-height:1.5}
.retirement-pro .compact-insight{min-height:76px}

/* Report spotlight */
.report-summary-spotlight{position:relative;overflow:hidden;padding:26px;border-radius:24px;background:linear-gradient(135deg,rgba(108,125,255,.15),rgba(255,255,255,.045));border-color:rgba(108,125,255,.26);box-shadow:0 18px 44px rgba(0,0,0,.22);}
.report-summary-spotlight.good{background:linear-gradient(135deg,rgba(52,213,138,.14),rgba(108,125,255,.07));border-color:rgba(52,213,138,.26)}
.report-summary-spotlight.warn{background:linear-gradient(135deg,rgba(240,180,41,.14),rgba(108,125,255,.06));border-color:rgba(240,180,41,.26)}
.report-summary-spotlight.danger{background:linear-gradient(135deg,rgba(255,92,114,.14),rgba(108,125,255,.06));border-color:rgba(255,92,114,.26)}
.summary-kicker{font-size:12px;font-weight:900;color:var(--accent2);letter-spacing:.08em;text-transform:uppercase;margin-bottom:10px}
.report-summary-spotlight.good .summary-kicker{color:var(--green)}
.report-summary-spotlight.warn .summary-kicker{color:var(--amber)}
.report-summary-spotlight.danger .summary-kicker{color:var(--red)}
.summary-headline{font-size:28px;font-weight:950;letter-spacing:-.045em;line-height:1.2;margin-bottom:12px;color:var(--text)}
.summary-friendly-text{font-size:15px;line-height:1.8;color:var(--text2);white-space:pre-line;max-width:920px}
.summary-chip-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:18px}
.summary-chip-lg{display:inline-flex;align-items:center;gap:6px;padding:8px 11px;border-radius:999px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.09);font-size:12px;font-weight:800;color:var(--text)}

/* AI Coach */
.ai-coach-hero{display:grid;grid-template-columns:1.2fr .8fr;gap:14px;align-items:stretch}
.ai-coach-panel{position:relative;overflow:hidden;padding:24px;border-radius:24px;background:linear-gradient(135deg,rgba(108,125,255,.16),rgba(52,213,138,.07));border:1px solid rgba(108,125,255,.24)}
.ai-coach-panel.warn{background:linear-gradient(135deg,rgba(240,180,41,.16),rgba(108,125,255,.06));border-color:rgba(240,180,41,.28)}
.ai-coach-panel.danger{background:linear-gradient(135deg,rgba(255,92,114,.16),rgba(108,125,255,.06));border-color:rgba(255,92,114,.28)}
.ai-coach-panel.good{background:linear-gradient(135deg,rgba(52,213,138,.15),rgba(108,125,255,.06));border-color:rgba(52,213,138,.28)}
.ai-coach-kicker{font-size:12px;font-weight:950;color:var(--accent2);letter-spacing:.08em;text-transform:uppercase;margin-bottom:10px}
.ai-coach-title{font-size:27px;font-weight:950;letter-spacing:-.045em;line-height:1.22;color:var(--text);margin-bottom:12px}
.ai-coach-message{font-size:15px;line-height:1.75;color:var(--text2);white-space:pre-line;max-width:920px}
.ai-coach-score-card{background:var(--surface);border:1px solid var(--border);border-radius:24px;padding:22px;display:flex;flex-direction:column;justify-content:center;gap:12px}
.ai-coach-score{font-size:48px;font-weight:950;letter-spacing:-.06em;line-height:1}
.ai-coach-score span{font-size:18px;color:var(--text3);margin-left:3px}
.ai-coach-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.ai-coach-card{background:var(--surface);border:1px solid var(--border);border-radius:18px;padding:16px;min-height:128px}
.ai-coach-card.warn{background:var(--amber-bg);border-color:rgba(240,180,41,.24)}
.ai-coach-card.danger{background:var(--red-bg);border-color:rgba(255,92,114,.24)}
.ai-coach-card.good{background:var(--green-bg);border-color:rgba(52,213,138,.24)}
.ai-coach-card.info{background:var(--accent-bg);border-color:rgba(108,125,255,.24)}
.ai-coach-card-head{display:flex;align-items:center;gap:8px;margin-bottom:8px}
.ai-coach-card-head strong{font-size:13px;color:var(--text)}
.ai-coach-card p{font-size:12px;color:var(--text2);line-height:1.55}
.ai-coach-next{display:grid;grid-template-columns:auto 1fr;gap:10px;align-items:flex-start;padding:12px;border-radius:14px;background:var(--surface2);border:1px solid var(--border)}
.ai-coach-next-no{width:26px;height:26px;border-radius:999px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.08);font-size:12px;font-weight:900;color:var(--text)}
.ai-coach-next strong{font-size:13px;color:var(--text)}
.ai-coach-next p{font-size:12px;color:var(--text3);line-height:1.45;margin-top:3px}

/* CFO animated score */
.goal-gauge-compact{width:100%;padding:12px;border-radius:16px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.07)}
.cfo-score-box-unified{display:flex!important;flex-direction:column!important;align-items:flex-start!important;justify-content:center!important;gap:10px!important;min-width:280px;}
.animated-score-wrap{width:100%;margin-bottom:4px;}
.animated-score-top{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px;}
.animated-score-top span{display:inline-flex;align-items:center;min-height:24px;padding:5px 9px;border-radius:999px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);color:var(--text2);font-size:11px;font-weight:900;}
.animated-score-top b{font-size:12px;font-weight:900;color:var(--text3);font-variant-numeric:tabular-nums;}
.animated-score-track{position:relative;width:100%;height:9px;border-radius:999px;background:rgba(255,255,255,.08);overflow:hidden;box-shadow:inset 0 1px 3px rgba(0,0,0,.25);}
.animated-score-fill{height:100%;border-radius:999px;transition:width .85s cubic-bezier(.2,.8,.2,1);min-width:4px;}
.animated-score-glow{position:absolute;top:50%;width:16px;height:16px;border-radius:999px;transform:translate(-50%,-50%);filter:blur(7px);opacity:.55;transition:left .85s cubic-bezier(.2,.8,.2,1);}
.animated-score-scale{display:flex;align-items:center;justify-content:space-between;margin-top:6px;color:var(--text3);font-size:10.5px;font-weight:800;}

/* CFO app screen */
.cfo-app-screen{position:relative;display:flex;flex-direction:column;gap:14px;animation:cfoScreenIn .42s cubic-bezier(.2,.8,.2,1)}
@keyframes cfoScreenIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
.cfo-app-status-card{position:relative;overflow:hidden;min-height:132px;display:grid;grid-template-columns:1fr 300px;gap:18px;align-items:center;padding:24px;border-radius:30px;border:1px solid rgba(255,255,255,.085);background:linear-gradient(135deg,rgba(22,25,32,.98),rgba(30,33,41,.86));box-shadow:0 18px 50px rgba(0,0,0,.28)}
.cfo-app-status-card:after{content:"";position:absolute;right:-140px;top:-160px;width:360px;height:360px;background:radial-gradient(circle,rgba(108,125,255,.16),transparent 68%);pointer-events:none}
.cfo-app-screen.danger .cfo-app-status-card:after{background:radial-gradient(circle,rgba(255,92,114,.17),transparent 68%)}
.cfo-app-screen.warn .cfo-app-status-card:after{background:radial-gradient(circle,rgba(240,180,41,.16),transparent 68%)}
.cfo-app-screen.ok .cfo-app-status-card:after{background:radial-gradient(circle,rgba(52,213,138,.16),transparent 68%)}
.cfo-app-status-left,.cfo-app-score-card{position:relative;z-index:1}
.cfo-app-kicker,.cfo-app-section-label{display:block;font-size:11px;font-weight:950;letter-spacing:.12em;color:var(--accent2);margin-bottom:8px}
.cfo-app-status-left h2{font-size:30px;line-height:1.15;letter-spacing:-.055em;font-weight:950;margin-bottom:8px}
.cfo-app-status-left p{color:var(--text2);font-size:14px;line-height:1.6}
.cfo-app-score-card{display:flex;flex-direction:column;justify-content:center;gap:10px;padding:18px;border-radius:24px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.085)}
.cfo-app-score{display:flex;align-items:baseline;gap:4px;font-size:54px;font-weight:950;letter-spacing:-.07em;line-height:.95}
.cfo-app-score span:last-child{font-size:18px;color:var(--text3);font-weight:900}
.cfo-app-conclusion{padding:18px 20px;border-radius:24px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.075);animation:cfoCardIn .46s cubic-bezier(.2,.8,.2,1) both;animation-delay:.06s}
.cfo-app-conclusion span{display:block;font-size:11px;font-weight:950;color:var(--text3);margin-bottom:7px}
.cfo-app-conclusion strong{display:block;font-size:24px;line-height:1.25;letter-spacing:-.045em;margin-bottom:8px}
.cfo-app-conclusion p{color:var(--text2);font-size:13px;line-height:1.55}
.cfo-app-action-card{padding:20px;border-radius:28px;background:linear-gradient(135deg,rgba(108,125,255,.14),rgba(255,255,255,.04));border:1px solid rgba(108,125,255,.20);box-shadow:0 18px 45px rgba(0,0,0,.22);animation:cfoCardIn .46s cubic-bezier(.2,.8,.2,1) both;animation-delay:.12s;transition:transform .18s ease,border-color .18s ease,box-shadow .18s ease}
.cfo-app-action-card:hover{transform:translateY(-2px);border-color:rgba(108,125,255,.32);box-shadow:0 22px 55px rgba(0,0,0,.27)}
@keyframes cfoCardIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
.cfo-app-action-main{display:grid;grid-template-columns:42px 1fr;gap:14px;align-items:flex-start}
.cfo-app-action-badge{width:42px;height:42px;border-radius:16px;display:flex;align-items:center;justify-content:center;background:var(--accent);color:#fff;font-size:18px;font-weight:950;box-shadow:0 12px 26px rgba(108,125,255,.32)}
.cfo-app-action-copy h3{font-size:22px;letter-spacing:-.04em;margin:6px 0 8px}
.cfo-app-action-copy p{color:var(--text2);font-size:13px;line-height:1.6}
.cfo-app-preview-strip{margin-top:16px;display:flex;align-items:center;gap:10px;padding:14px;border-radius:20px;background:rgba(13,15,20,.38);border:1px solid rgba(255,255,255,.075)}
.cfo-app-preview-strip div:not(.cfo-app-preview-note){display:flex;flex-direction:column;gap:3px}
.cfo-app-preview-strip span{font-size:11px;font-weight:900;color:var(--text3)}
.cfo-app-preview-strip strong{font-size:24px;font-weight:950;letter-spacing:-.045em}
.cfo-app-preview-strip strong.after{color:var(--green)}
.cfo-app-preview-strip em{color:var(--text3);font-style:normal;font-weight:950}
.cfo-app-preview-note{margin-left:auto;padding:7px 10px;border-radius:999px;background:var(--green-bg);color:var(--green);font-size:12px;font-weight:950}
.cfo-app-primary-btn{margin-top:16px;width:100%;min-height:58px;border:none;border-radius:20px;background:linear-gradient(135deg,#6c7dff,#8b9aff);color:white;font-size:17px;font-weight:950;box-shadow:0 16px 36px rgba(108,125,255,.32);transition:transform .16s ease,filter .16s ease,box-shadow .16s ease}
.cfo-app-primary-btn:hover{transform:translateY(-1px) scale(1.01);filter:brightness(1.06);box-shadow:0 20px 46px rgba(108,125,255,.40)}
.cfo-app-primary-btn:active{transform:translateY(1px) scale(.99)}
.cfo-app-result-card{display:grid;grid-template-columns:42px 1fr;gap:12px;align-items:center;padding:14px;border-radius:20px;background:rgba(52,213,138,.09);border:1px solid rgba(52,213,138,.22);animation:cfoResultPop .32s cubic-bezier(.2,.8,.2,1)}
@keyframes cfoResultPop{from{opacity:0;transform:translateY(8px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}
.cfo-app-result-icon{width:42px;height:42px;border-radius:16px;display:flex;align-items:center;justify-content:center;background:var(--green);color:#07110c;font-size:18px;font-weight:950}
.cfo-app-result-card strong{color:var(--green);font-size:14px}
.cfo-app-result-card p{color:var(--text);font-size:13px;font-weight:850;margin-top:2px}
.cfo-app-result-card span{display:block;color:var(--text3);font-size:12px;margin-top:2px}
.cfo-app-accordion{display:flex;flex-direction:column;gap:8px;animation:cfoCardIn .46s cubic-bezier(.2,.8,.2,1) both;animation-delay:.18s}
.cfo-app-accordion>button{width:100%;display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-radius:18px;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.035);color:var(--text);font-size:13px;font-weight:900}
.cfo-app-accordion>button span{color:var(--text3);font-size:12px}
.cfo-app-accordion-body{padding:12px;border-radius:18px;background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.055);animation:cfoAccordionIn .2s ease}
@keyframes cfoAccordionIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
.cfo-app-score-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.cfo-app-score-item{padding:13px;border-radius:16px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.06)}
.cfo-app-score-item b{font-size:13px}
.cfo-app-score-item span{font-size:12px;font-weight:950}
.cfo-app-score-item p{margin-top:8px;color:var(--text3);font-size:11.5px;line-height:1.45}
.cfo-app-secondary-action{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;padding:12px;border-radius:16px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.06)}
.cfo-app-secondary-action strong{font-size:13px;color:var(--text)}
.cfo-app-secondary-action p{color:var(--text3);font-size:11.5px;line-height:1.45;margin-top:3px}

/* CFO flow / action panels */
.cfo-input-preview-live{grid-template-columns:1fr 1fr}
.cfo-live-wide{grid-column:1/-1}
.cfo-live-wide em{display:block;margin-top:6px;font-style:normal;color:var(--green);font-size:11px;font-weight:900}
.cfo-flow-strip{margin:16px 0 0;display:grid;grid-template-columns:1fr auto 1fr;gap:10px;align-items:center;padding:12px;border-radius:18px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.07);}
.cfo-flow-step{display:grid;grid-template-columns:34px 1fr;gap:10px;align-items:center;min-width:0;}
.cfo-flow-no{width:34px;height:34px;border-radius:14px;display:flex;align-items:center;justify-content:center;background:rgba(108,125,255,.14);color:var(--accent2);border:1px solid rgba(108,125,255,.22);font-weight:950;font-size:12px;}
.cfo-flow-step.done .cfo-flow-no{background:var(--green-bg);color:var(--green);border-color:rgba(52,213,138,.28)}
.cfo-flow-copy span{display:block;font-size:10px;font-weight:900;color:var(--text3);letter-spacing:.06em;text-transform:uppercase;margin-bottom:3px}
.cfo-flow-copy strong{display:block;font-size:12.5px;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cfo-flow-copy p{font-size:11px;color:var(--text3);line-height:1.35;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cfo-flow-arrow{color:var(--text3);font-weight:950;font-size:18px;opacity:.7}
.cfo-next-action-panel{margin-top:14px;display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;padding:14px;border-radius:18px;background:linear-gradient(135deg,rgba(52,213,138,.12),rgba(108,125,255,.07));border:1px solid rgba(52,213,138,.22);}
.cfo-next-action-panel small{display:block;font-size:10px;font-weight:950;color:var(--green);letter-spacing:.08em;text-transform:uppercase;margin-bottom:4px}
.cfo-next-action-panel strong{display:block;font-size:14px;color:var(--text);margin-bottom:4px}
.cfo-next-action-panel p{font-size:12px;color:var(--text2);line-height:1.45}
.cfo-next-action-panel .btn{min-width:110px}
.cfo-input-modal{width:min(620px,100%)}
.cfo-input-preview{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;}
.cfo-input-preview div{padding:12px;border-radius:16px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.07);}
.cfo-input-preview small{display:block;font-size:10.5px;color:var(--text3);font-weight:900;margin-bottom:5px;}
.cfo-input-preview b{font-size:13px;color:var(--text);}
.cfo-input-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;}
.cfo-input-full{grid-column:1/-1}

/* Apple CFO Modal */
.apple-cfo-modal-overlay{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,.58);backdrop-filter:blur(16px) saturate(150%);-webkit-backdrop-filter:blur(16px) saturate(150%);overflow:hidden;}
.apple-cfo-modal{width:min(520px,100%);border-radius:28px;padding:22px;background:rgba(28,31,39,.92);border:1px solid rgba(255,255,255,.12);box-shadow:0 30px 90px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.06);animation:appleModalIn .22s cubic-bezier(.2,.8,.2,1)}
@keyframes appleModalIn{from{opacity:0;transform:translateY(16px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}
.apple-cfo-modal-handle{width:42px;height:4px;border-radius:999px;background:rgba(255,255,255,.18);margin:0 auto 18px}
.apple-cfo-modal-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:10px}
.apple-cfo-modal-head span{font-size:11px;font-weight:950;letter-spacing:.1em;color:var(--accent2)}
.apple-cfo-modal-head h3{margin-top:6px;font-size:22px;line-height:1.25;letter-spacing:-.04em}
.apple-cfo-close{width:34px;height:34px;border-radius:999px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.06);color:var(--text2);font-size:22px;line-height:1}
.apple-cfo-modal-desc{font-size:13px;line-height:1.65;color:var(--text2);margin-bottom:16px}
.apple-cfo-preview-score{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:12px;padding:14px;border-radius:20px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.075);margin-bottom:12px}
.apple-cfo-preview-score div{display:flex;flex-direction:column;gap:4px}
.apple-cfo-preview-score span{font-size:11px;font-weight:900;color:var(--text3)}
.apple-cfo-preview-score strong{font-size:30px;font-weight:950;color:var(--text);letter-spacing:-.055em}
.apple-cfo-preview-score strong.after{color:var(--green)}
.apple-cfo-preview-score em{font-style:normal;color:var(--text3);font-weight:950}
.apple-cfo-preview-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.apple-cfo-preview-grid div{padding:12px;border-radius:16px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.065)}
.apple-cfo-preview-grid small{display:block;margin-bottom:6px;font-size:10.5px;font-weight:900;color:var(--text3)}
.apple-cfo-preview-grid b{display:block;font-size:12px;line-height:1.45;color:var(--text2);word-break:keep-all}
.apple-cfo-modal-note{margin-top:12px;padding:11px 12px;border-radius:16px;background:rgba(108,125,255,.09);border:1px solid rgba(108,125,255,.14);color:var(--text2);font-size:12px;line-height:1.55}
.apple-cfo-modal-note b{color:var(--accent2)}
.apple-cfo-modal-actions{display:grid;grid-template-columns:1fr 1.4fr;gap:10px;margin-top:16px}
.apple-cfo-confirm-btn{border:none;border-radius:14px;padding:12px;background:linear-gradient(135deg,#6c7dff,#8b9aff);color:white;font-size:14px;font-weight:950;box-shadow:0 14px 30px rgba(108,125,255,.26)}
.apple-cfo-confirm-btn:disabled{cursor:not-allowed;box-shadow:none;}
.apple-cfo-undo-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:10000;display:flex;align-items:center;gap:12px;max-width:calc(100vw - 32px);padding:12px 14px 12px 16px;border-radius:999px;background:rgba(20,22,28,.92);border:1px solid rgba(255,255,255,.10);box-shadow:0 20px 50px rgba(0,0,0,.42);backdrop-filter:blur(16px) saturate(150%);-webkit-backdrop-filter:blur(16px) saturate(150%)}
.apple-cfo-undo-toast span{color:var(--text);font-size:13px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.apple-cfo-undo-toast button{border:none;border-radius:999px;padding:7px 11px;background:var(--accent-bg);color:var(--accent2);font-size:12px;font-weight:950}
.apple-cfo-modal.cfo-input-modal{width:min(680px,calc(100vw - 32px));max-height:calc(100dvh - 32px);overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;}
.apple-cfo-modal.cfo-input-modal .apple-cfo-modal-head{position:sticky;top:-22px;z-index:5;padding-top:4px;padding-bottom:10px;background:linear-gradient(180deg,rgba(28,31,39,.98) 78%,rgba(28,31,39,0));backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);}
.apple-cfo-modal.cfo-input-modal .apple-cfo-modal-actions{position:sticky;bottom:-22px;z-index:6;margin-left:-2px;margin-right:-2px;padding:12px 2px 4px;background:linear-gradient(0deg,rgba(28,31,39,.98) 78%,rgba(28,31,39,0));backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);}

/* CFO history */
.cfo-history-panel{margin-top:14px;padding:14px;border-radius:20px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.075)}
.cfo-history-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}
.cfo-history-head strong{font-size:13px;color:var(--text)}
.cfo-history-head span{font-size:11px;color:var(--text3);font-weight:800}
.cfo-history-list{display:flex;flex-direction:column;gap:8px}
.cfo-history-item{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;padding:11px;border-radius:16px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.065)}
.cfo-history-item h4{font-size:13px;color:var(--text);margin:0 0 4px;font-weight:900}
.cfo-history-item p{font-size:11.5px;color:var(--text3);line-height:1.45;margin:0}
.cfo-history-tags{display:flex;gap:6px;flex-wrap:wrap;margin-top:7px}
.cfo-history-tag{display:inline-flex;align-items:center;padding:4px 7px;border-radius:999px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);font-size:10.5px;font-weight:900;color:var(--text2)}
.cfo-history-rollback{border:none;border-radius:12px;padding:8px 10px;background:var(--red-bg);color:var(--red);font-size:11.5px;font-weight:950;white-space:nowrap}
.cfo-history-rollback:hover{transform:translateY(-1px);opacity:.9}
.cfo-executed-panel{position:relative;z-index:1;margin-top:12px;display:grid;grid-template-columns:42px 1fr;gap:12px;align-items:flex-start;padding:14px;border-radius:20px;background:rgba(52,213,138,.09);border:1px solid rgba(52,213,138,.22);}
.cfo-executed-icon{width:42px;height:42px;border-radius:16px;display:flex;align-items:center;justify-content:center;background:var(--green);color:#07110c;font-weight:950;font-size:18px;}
.cfo-executed-copy strong{display:block;color:var(--green);font-size:14px;margin-bottom:4px;}
.cfo-executed-copy p{color:var(--text);font-size:13px;font-weight:800;margin-bottom:10px;}
.cfo-executed-detail{display:grid;grid-template-columns:auto 1fr;gap:6px 10px;padding:10px;border-radius:14px;background:rgba(0,0,0,.14);border:1px solid rgba(255,255,255,.06);}
.cfo-executed-detail span{font-size:11px;font-weight:900;color:var(--text3);}
.cfo-executed-detail b{font-size:11.5px;color:var(--text2);font-weight:900;}
.cfo-action-preview{margin-top:14px;padding:14px;border-radius:18px;background:rgba(13,15,20,.42);border:1px solid rgba(255,255,255,.075);}
.cfo-preview-score{display:flex;align-items:baseline;gap:8px;margin-bottom:12px;}
.cfo-preview-score span{font-size:11px;font-weight:900;color:var(--text3);}
.cfo-preview-score strong{font-size:24px;font-weight:950;letter-spacing:-.05em;color:var(--text);font-variant-numeric:tabular-nums;}
.cfo-preview-score strong.after{color:var(--green);}
.cfo-preview-score em{color:var(--text3);font-style:normal;font-weight:900;}
.cfo-preview-change{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;}
.cfo-preview-change div{padding:10px;border-radius:14px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);}
.cfo-preview-change small{display:block;font-size:10.5px;color:var(--text3);font-weight:900;margin-bottom:5px;}
.cfo-preview-change b{display:block;font-size:12px;line-height:1.45;color:var(--text2);word-break:keep-all;}
.cfo-preview-note{margin-top:10px;display:inline-flex;padding:6px 10px;border-radius:999px;font-size:11px;font-weight:900;color:var(--green);background:var(--green-bg);}
.cfo-execute-btn{align-self:stretch;min-width:138px;border:none;border-radius:18px;padding:14px 18px;background:linear-gradient(135deg,#6c7dff,#8b9aff);color:white;font-size:14px;font-weight:950;box-shadow:0 14px 32px rgba(108,125,255,.28);transition:.18s ease;}
.cfo-execute-btn:hover{transform:translateY(-1px);box-shadow:0 18px 40px rgba(108,125,255,.36);}

/* CFO Decision */
.cfo-decision-hero{position:relative;overflow:hidden;border-radius:26px;padding:24px;background:linear-gradient(135deg,rgba(108,125,255,.16),rgba(52,213,138,.07));border:1px solid rgba(108,125,255,.25);box-shadow:0 18px 48px rgba(0,0,0,.22)}
.cfo-decision-head{display:grid;grid-template-columns:1.1fr .9fr;gap:18px;align-items:stretch;position:relative;z-index:1}
.cfo-kicker{font-size:11px;font-weight:950;letter-spacing:.09em;text-transform:uppercase;color:var(--accent2);margin-bottom:9px}
.cfo-main-title{font-size:26px;font-weight:950;letter-spacing:-.045em;line-height:1.18;margin-bottom:10px}
.cfo-main-message{font-size:14px;line-height:1.72;color:var(--text2);white-space:pre-line;max-width:760px}
.cfo-score-box{display:flex;align-items:center;justify-content:space-between;gap:14px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.08);border-radius:22px;padding:18px}
.cfo-big-score{font-size:54px;font-weight:950;letter-spacing:-.07em;line-height:1}
.cfo-big-score span{font-size:16px;color:var(--text3);margin-left:3px}
.cfo-status-pill{display:inline-flex;padding:7px 11px;border-radius:999px;font-size:12px;font-weight:900;margin-top:8px}
.cfo-score-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:16px;position:relative;z-index:1}
.cfo-score-item{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:13px}
.cfo-score-item strong{display:block;font-size:18px;font-weight:950;letter-spacing:-.035em;margin-top:6px}
.cfo-score-item small{font-size:11px;color:var(--text3);font-weight:800}
.cfo-score-item p{font-size:11px;color:var(--text3);line-height:1.42;margin-top:5px}
.cfo-action-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:14px}
.cfo-problem-card,.cfo-action-card{background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:18px}
.cfo-problem-list,.cfo-action-list{display:flex;flex-direction:column;gap:9px;margin-top:12px}
.cfo-list-row{display:grid;grid-template-columns:30px 1fr auto;gap:10px;align-items:flex-start;padding:11px;border-radius:14px;background:var(--surface2);border:1px solid var(--border)}
.cfo-list-no{width:30px;height:30px;border-radius:999px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:950;background:rgba(255,255,255,.07)}
.cfo-list-row strong{display:block;font-size:13px;color:var(--text);margin-bottom:3px}
.cfo-list-row p{font-size:11.5px;color:var(--text3);line-height:1.45}
.cfo-priority{font-size:10px;font-weight:900;padding:4px 7px;border-radius:999px;white-space:nowrap}
.cfo-priority.high{background:var(--red-bg);color:var(--red);border:1px solid rgba(255,92,114,.25)}
.cfo-priority.mid{background:var(--amber-bg);color:var(--amber);border:1px solid rgba(240,180,41,.25)}
.cfo-priority.low{background:var(--green-bg);color:var(--green);border:1px solid rgba(52,213,138,.25)}
.cfo-why-box{margin-top:16px;padding:13px 14px;border-radius:16px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.08);max-width:760px}
.cfo-why-box strong{display:block;font-size:13px;color:var(--text);margin-bottom:5px}
.cfo-why-box p{font-size:12px;color:var(--text2);line-height:1.55}
.cfo-score-reason{margin-top:9px;padding-top:9px;border-top:1px solid rgba(255,255,255,.07);font-size:11px;color:var(--text2);line-height:1.45}
.cfo-expected{display:inline-flex;margin-top:6px;font-style:normal;font-size:10.5px;font-weight:900;color:var(--green);background:var(--green-bg);border:1px solid rgba(52,213,138,.23);border-radius:999px;padding:3px 7px}
.cfo-simulation-card{margin-top:14px;background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:18px}
.cfo-sim-grid{display:grid;grid-template-columns:1.25fr repeat(4,1fr);gap:10px}
.cfo-sim-main,.cfo-sim-point{border:1px solid var(--border);background:var(--surface2);border-radius:16px;padding:14px}
.cfo-sim-main strong{font-size:22px;font-weight:950;letter-spacing:-.04em;color:var(--text)}
.cfo-sim-main p,.cfo-sim-point p{font-size:11.5px;color:var(--text3);line-height:1.45;margin-top:5px}
.cfo-sim-point small{font-size:11px;color:var(--text3);font-weight:800}
.cfo-sim-point strong{display:block;font-size:24px;font-weight:950;letter-spacing:-.045em;color:var(--accent);margin-top:6px}
.cfo-detail-panel{display:grid;grid-template-columns:1.18fr .82fr;gap:14px;margin-top:14px;position:relative;z-index:1;}
.cfo-detail-card{background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.08);border-radius:20px;padding:18px;min-width:0;}
.cfo-detail-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;}
.cfo-detail-row{display:grid;grid-template-columns:34px 1fr;gap:11px;align-items:flex-start;padding:13px;border-radius:16px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.07);min-height:108px;}
.cfo-detail-icon{width:34px;height:34px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:rgba(108,125,255,.12);border:1px solid rgba(108,125,255,.18);font-size:15px;}
.cfo-detail-copy{min-width:0}
.cfo-detail-top{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:7px;}
.cfo-detail-top strong{font-size:13px;font-weight:900;color:var(--text);}
.cfo-detail-top span{display:inline-flex;max-width:55%;justify-content:flex-end;text-align:right;font-size:12px;font-weight:900;color:var(--accent2);font-variant-numeric:tabular-nums;white-space:nowrap;}
.cfo-detail-copy p{font-size:12px;color:var(--text2);line-height:1.58;word-break:keep-all;}
.cfo-guard-desc{font-size:12px;line-height:1.6;color:var(--text2);margin-bottom:12px;}
.cfo-guard-grid{display:grid;grid-template-columns:1fr;gap:9px;}
.cfo-guard-card{padding:12px;border-radius:15px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.045);}
.cfo-guard-card span{display:block;font-size:11px;font-weight:800;color:var(--text3);margin-bottom:5px;}
.cfo-guard-card strong{display:block;font-size:18px;font-weight:950;color:var(--text);line-height:1.1;}
.cfo-guard-card small{display:block;margin-top:5px;font-size:11px;line-height:1.35;color:var(--text3);}
.cfo-guard-card.ok{background:rgba(52,213,138,.075);border-color:rgba(52,213,138,.20);}
.cfo-guard-card.ok strong{color:var(--green)}
.cfo-guard-card.danger{background:rgba(255,92,114,.085);border-color:rgba(255,92,114,.22);}
.cfo-guard-card.danger strong{color:var(--red)}
.cfo-plan-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:14px;position:relative;z-index:1;}
.cfo-plan-card{padding:14px;border-radius:18px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.08);}
.cfo-plan-card small{display:block;font-size:11px;font-weight:900;color:var(--text3);margin-bottom:7px;}
.cfo-plan-card strong{display:block;font-size:24px;font-weight:950;color:var(--accent2);letter-spacing:-.04em;margin-bottom:8px;}
.cfo-plan-card p{font-size:12px;color:var(--text2);line-height:1.55;}
.cfo-plan-card p b{color:var(--text);font-weight:900;}
.cfo-product-card{position:relative;overflow:hidden;border-radius:28px;padding:24px;border:1px solid rgba(255,255,255,.085);background:linear-gradient(135deg,rgba(22,25,32,.98),rgba(30,33,41,.86));box-shadow:0 18px 50px rgba(0,0,0,.28);}
.cfo-product-card:after{content:"";position:absolute;right:-120px;top:-160px;width:340px;height:340px;background:radial-gradient(circle,rgba(108,125,255,.16),transparent 68%);pointer-events:none;}
.cfo-product-card.danger:after{background:radial-gradient(circle,rgba(255,92,114,.15),transparent 68%)}
.cfo-product-card.warn:after{background:radial-gradient(circle,rgba(240,180,41,.15),transparent 68%)}
.cfo-product-card.ok:after{background:radial-gradient(circle,rgba(52,213,138,.15),transparent 68%)}
.cfo-product-hero{display:grid;grid-template-columns:minmax(0,1.35fr) 300px;gap:22px;align-items:stretch;position:relative;z-index:1;}
.cfo-product-kicker{font-size:11px;font-weight:950;letter-spacing:.12em;color:var(--accent2);margin-bottom:10px;}
.cfo-product-left h2{font-size:30px;line-height:1.18;letter-spacing:-.055em;font-weight:950;margin-bottom:12px;max-width:780px;}
.cfo-product-left p{font-size:14px;line-height:1.7;color:var(--text2);max-width:820px;}
.cfo-product-score{display:flex;flex-direction:column;justify-content:center;align-items:flex-start;gap:10px;min-height:220px;padding:20px;border-radius:24px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.085);}
.cfo-product-score-row{display:flex;align-items:baseline;gap:4px;}
.cfo-product-score-row strong{font-size:58px;font-weight:950;letter-spacing:-.07em;line-height:.92;}
.cfo-product-score-row span{color:var(--text3);font-size:18px;font-weight:900;}
.cfo-action-focus{display:grid;grid-template-columns:36px 1fr auto;gap:14px;align-items:center;padding:16px;border-radius:20px;background:rgba(108,125,255,.09);border:1px solid rgba(108,125,255,.16);}
.cfo-action-rank{width:36px;height:36px;border-radius:14px;display:flex;align-items:center;justify-content:center;background:var(--accent);color:white;font-weight:950;}
.cfo-action-copy strong{font-size:15px;color:var(--text);}
.cfo-action-copy p{margin-top:7px;font-size:12.5px;line-height:1.55;color:var(--text2);}
.cfo-action-impact{margin-top:9px;display:inline-flex;padding:5px 9px;border-radius:999px;font-size:11px;font-weight:900;color:var(--green);background:var(--green-bg);}
.cfo-product-grid{position:relative;z-index:1;margin-top:14px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;}
.cfo-product-mini{padding:14px;border-radius:18px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);}
.cfo-product-mini span{display:block;font-size:11px;font-weight:900;color:var(--text3);margin-bottom:7px;}
.cfo-product-mini strong{display:block;font-size:18px;color:var(--text);letter-spacing:-.035em;margin-bottom:7px;}
.cfo-product-mini p{font-size:12px;line-height:1.5;color:var(--text2);}
.cfo-product-detail{position:relative;z-index:1;margin-top:14px;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;}
.cfo-product-score-item{padding:13px;border-radius:16px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.065);}
.cfo-product-score-item span{font-size:12px;font-weight:900;color:var(--text2);}
.cfo-product-score-item b{font-size:13px;font-weight:950;}
.cfo-product-score-item p{margin-top:9px;font-size:11.5px;color:var(--text3);line-height:1.45;}

/* Dashboard */
.dashboard-hero{display:grid;grid-template-columns:1.1fr 1.4fr;gap:14px}
.health-card{background:linear-gradient(135deg,var(--surface),rgba(108,125,255,.08));border:1px solid rgba(108,125,255,.22);border-radius:var(--radius-lg);padding:22px;overflow:hidden}
.health-score{font-size:52px;font-weight:900;letter-spacing:-.06em;line-height:1}
.health-score span{font-size:18px;color:var(--text3);letter-spacing:-.02em;margin-left:3px}
.health-grade{display:inline-flex;margin-top:10px;padding:5px 11px;border-radius:999px;font-size:12px;font-weight:800}
.dashboard-summary-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}
.mini-metric{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:17px;display:flex;flex-direction:column;gap:6px}
.mini-metric span{font-size:11px;color:var(--text3);font-weight:700;letter-spacing:.05em;text-transform:uppercase}
.mini-metric strong{font-size:25px;font-weight:900;letter-spacing:-.04em}
.mini-metric small{font-size:11px;color:var(--text3)}
.compact-insight{display:flex;gap:10px;align-items:flex-start;padding:11px;border-radius:12px;border:1px solid var(--border);background:var(--surface2)}
.compact-insight span{font-size:18px}
.compact-insight strong,.action-item strong{font-size:12.5px;color:var(--text)}
.compact-insight p,.action-item p{font-size:11.5px;color:var(--text3);line-height:1.45;margin-top:2px}
.compact-insight.danger{border-color:rgba(255,92,114,.24);background:var(--red-bg)}
.compact-insight.warn{border-color:rgba(240,180,41,.22);background:var(--amber-bg)}
.compact-insight.info{border-color:rgba(108,125,255,.22);background:var(--accent-bg)}
.compact-insight.green{border-color:rgba(52,213,138,.22);background:var(--green-bg)}
.action-item{display:grid;grid-template-columns:auto 1fr;gap:10px;align-items:flex-start;padding:11px;border-radius:12px;background:var(--surface2);border:1px solid var(--border)}
.dashboard-linked-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:14px 0}
.dashboard-linked-card{display:flex;gap:10px;align-items:flex-start;padding:12px;border-radius:13px;border:1px solid var(--border);background:var(--surface2)}
.dashboard-linked-card span{font-size:18px;line-height:1;flex-shrink:0}
.dashboard-linked-card strong{font-size:12.5px;color:var(--text);display:block;margin-bottom:3px}
.dashboard-linked-card p{font-size:11.5px;color:var(--text3);line-height:1.45}
.dashboard-linked-card.green{border-color:rgba(52,213,138,.22);background:var(--green-bg)}
.dashboard-linked-card.amber{border-color:rgba(240,180,41,.24);background:var(--amber-bg)}
.dashboard-linked-card.red{border-color:rgba(255,92,114,.24);background:var(--red-bg)}
.dashboard-linked-card.info,.dashboard-linked-card.accent{border-color:rgba(108,125,255,.22);background:var(--accent-bg)}
.dashboard-advice-card{background:linear-gradient(135deg,var(--surface),rgba(108,125,255,.055));border-color:rgba(108,125,255,.18);}
.dashboard-advice-list{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:12px;}
.dashboard-advice-item{display:grid;grid-template-columns:24px 1fr;gap:9px;align-items:flex-start;padding:11px;border-radius:12px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.07);}
.dashboard-advice-no{width:24px;height:24px;border-radius:999px;display:flex;align-items:center;justify-content:center;background:var(--accent-bg);color:var(--accent2);font-size:11px;font-weight:900;}
.dashboard-advice-item strong{display:block;font-size:12.5px;color:var(--text);line-height:1.35;}
.dashboard-advice-item p{font-size:11px;color:var(--text3);line-height:1.4;margin-top:3px;}

/* Tax */
/* 세금 간트차트 */
.tax-gantt-wrap{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:20px 22px;margin-bottom:14px;overflow:hidden}
.tax-gantt-header{display:flex;align-items:center;margin-bottom:4px;height:28px;position:relative}
.tax-gantt-label-col{width:180px;flex-shrink:0;font-size:10px;font-weight:700;color:var(--text3);letter-spacing:.06em;text-transform:uppercase;padding-right:12px}
.tax-gantt-track-area{flex:1;position:relative;height:100%}
.tax-gantt-month-col{position:absolute;top:0;bottom:0;display:flex;align-items:center;border-left:1px dashed var(--border)}
.tax-gantt-month-lbl{font-size:10px;font-weight:700;color:var(--text3);padding-left:4px;white-space:nowrap}
.tax-gantt-rows{display:flex;flex-direction:column;gap:5px}
.tax-gantt-row{display:flex;align-items:center;min-height:32px;border-radius:8px;transition:.15s;cursor:default}
.tax-gantt-row:hover{background:rgba(255,255,255,.03)}
.tax-gantt-row.past .tax-gantt-title{color:var(--text3)}
.tax-gantt-row.active{background:rgba(108,125,255,.04)}
.tax-gantt-label-col{width:180px;flex-shrink:0;display:flex;align-items:center;gap:6px;padding-right:12px;overflow:hidden}
.tax-gantt-type-icon{font-size:13px;flex-shrink:0}
.tax-gantt-title{font-size:11px;font-weight:600;color:var(--text2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tax-gantt-track-area{flex:1;position:relative;height:28px}
.tax-gantt-grid-line{position:absolute;top:0;bottom:0;width:1px;background:var(--border);opacity:.5;pointer-events:none}
.tax-gantt-today-line{position:absolute;top:0;bottom:0;width:2px;background:var(--red);opacity:.7;z-index:2;pointer-events:none}
.tax-gantt-today-badge{position:absolute;top:-20px;left:50%;transform:translateX(-50%);font-size:9px;font-weight:800;color:var(--red);white-space:nowrap;background:var(--surface);padding:1px 4px;border-radius:4px;border:1px solid var(--red)}
.tax-gantt-bar{position:absolute;top:4px;bottom:4px;border-radius:6px;border:1.5px solid;display:flex;align-items:center;overflow:hidden;transition:.2s;z-index:1}
.tax-gantt-bar:hover{filter:brightness(1.15);z-index:3}
.tax-gantt-bar-text{font-size:9px;font-weight:700;padding:0 6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;opacity:.85}
.tax-gantt-tooltip{position:absolute;top:calc(100% + 4px);left:0;min-width:220px;max-width:300px;background:rgba(20,22,28,.97);border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:10px 13px;z-index:99;box-shadow:0 12px 32px rgba(0,0,0,.5);pointer-events:none}
.tax-gantt-tt-title{font-size:12px;font-weight:800;color:#f0f1f3;margin-bottom:4px}
.tax-gantt-tt-period{font-size:11px;color:rgba(240,241,243,.6);margin-bottom:5px;font-variant-numeric:tabular-nums}
.tax-gantt-tt-desc{font-size:11px;color:rgba(240,241,243,.75);line-height:1.55}
.tax-gantt-tt-past{font-size:10px;color:var(--text3);margin-top:5px;font-weight:700}
.tax-gantt-tt-active{font-size:10px;color:var(--green);margin-top:5px;font-weight:800}
@media(max-width:760px){.tax-gantt-label-col{width:110px}.tax-gantt-title{font-size:10px}.tax-gantt-bar-text{display:none}}
.tax-calendar-month-card{background:linear-gradient(135deg,var(--surface),rgba(108,125,255,.06));border:1px solid rgba(108,125,255,.18);border-radius:var(--radius-lg);padding:22px}
.tax-cal-header{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px;flex-wrap:wrap}
.tax-cal-title{display:flex;align-items:center;gap:10px}
.tax-cal-title h3{font-size:16px;margin:0;font-weight:900;letter-spacing:-.02em}
.tax-cal-nav{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.tax-cal-nav-btn{width:36px;height:36px;border-radius:12px;border:1px solid var(--border2);background:var(--surface2);color:var(--text);font-size:18px;font-weight:900;display:flex;align-items:center;justify-content:center;transition:.15s ease}
.tax-cal-nav-btn:hover{background:rgba(108,125,255,.14);border-color:rgba(108,125,255,.28);color:var(--accent2);transform:translateY(-1px)}
.tax-cal-input{height:36px;border:1px solid var(--border2);border-radius:12px;background:var(--surface2);color:var(--text);padding:0 10px;font-size:13px;font-weight:800;outline:none}
.tax-cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:8px}
.tax-cal-weekday{font-size:11px;font-weight:900;color:var(--text3);text-align:center;padding:6px 0;letter-spacing:.04em}
.tax-cal-day{min-height:112px;border:1px solid var(--border);border-radius:14px;background:var(--surface2);padding:9px;display:flex;flex-direction:column;gap:7px;transition:.15s ease;overflow:hidden}
.tax-cal-day:hover{border-color:rgba(108,125,255,.28);transform:translateY(-1px)}
.tax-cal-day.outside{opacity:.35;background:rgba(255,255,255,.025)}
.tax-cal-day.today{box-shadow:inset 0 0 0 1px rgba(108,125,255,.45);border-color:rgba(108,125,255,.45)}
.tax-cal-date{display:flex;align-items:center;justify-content:space-between;font-size:12px;font-weight:900;color:var(--text)}
.tax-cal-events{display:flex;flex-direction:column;gap:5px}
.tax-cal-event{border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:6px;background:rgba(255,255,255,.04)}
.tax-cal-event strong{display:block;font-size:11.5px;color:var(--text);line-height:1.25;margin-top:4px}
.tax-cal-event p{font-size:10.5px;color:var(--text3);line-height:1.35;margin-top:3px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.tax-update-box{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-top:14px;padding:14px;border-radius:14px;border:1px solid rgba(108,125,255,.20);background:rgba(108,125,255,.08)}
.tax-update-box strong{font-size:13px;color:var(--text)}
.tax-update-box p{font-size:12px;color:var(--text2);line-height:1.5;margin-top:4px}
.tax-update-status-box{align-items:stretch}
.tax-update-status-card{display:grid;grid-template-columns:38px 1fr;gap:12px;align-items:flex-start;width:100%;padding:13px;border-radius:14px;border:1px solid var(--border);background:var(--surface2)}
.tax-update-status-card.green{background:var(--green-bg);border-color:rgba(52,213,138,.26)}
.tax-update-status-card.amber{background:var(--amber-bg);border-color:rgba(240,180,41,.28)}
.tax-update-status-card.accent,.tax-update-status-card.info{background:var(--accent-bg);border-color:rgba(108,125,255,.24)}
.tax-update-status-icon{width:34px;height:34px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.07);font-size:17px;}
.tax-update-status-top{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:3px}
.tax-update-status-top strong{font-size:13.5px;color:var(--text)}
.tax-update-date{font-size:12px;font-weight:900;color:var(--text);margin:2px 0 5px}
.tax-update-brief{font-size:12px;color:var(--text2);line-height:1.45;margin:0}
.tax-action-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.tax-action-item{border:1px solid var(--border);background:var(--surface2);border-radius:14px;padding:14px;min-height:142px}
.tax-action-item.green{background:var(--green-bg);border-color:rgba(52,213,138,.25)}
.tax-action-item.warn{background:var(--amber-bg);border-color:rgba(240,180,41,.25)}
.tax-action-item.danger{background:var(--red-bg);border-color:rgba(255,92,114,.25)}
.tax-action-item.info{background:var(--accent-bg);border-color:rgba(108,125,255,.22)}
.tax-action-top{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px}
.tax-action-item strong{display:block;font-size:14px;color:var(--text);margin-bottom:6px}
.tax-action-item p{font-size:12px;color:var(--text2);line-height:1.55}
.tax-action-amount{margin-top:10px;padding:7px 9px;border-radius:10px;background:rgba(255,255,255,.06);font-size:12px;font-weight:800;color:var(--text)}

/* QA split */
.qa-mode-row{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px}
.qa-mode-btn{padding:10px 8px;border-radius:14px;border:1px solid var(--border2);background:var(--surface2);color:var(--text2);font-size:12px;font-weight:800;transition:.15s ease}
.qa-mode-btn.active{background:var(--accent-bg);color:var(--accent2);border-color:rgba(108,125,255,.35);}
.qa-split-panel{padding:12px;border-radius:16px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.035);margin-bottom:12px}
.qa-split-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:10px 0 12px}
.qa-split-metric{padding:10px;border-radius:12px;background:var(--surface2);border:1px solid var(--border);font-size:11px;color:var(--text3)}
.qa-split-metric strong{display:block;font-size:14px;color:var(--text);margin-top:4px;font-variant-numeric:tabular-nums}
.qa-preview-list{display:flex;flex-direction:column;gap:8px;margin:12px 0}
.qa-preview-row{display:grid;grid-template-columns:1fr auto;gap:10px;padding:10px 12px;border-radius:12px;background:var(--surface2);border:1px solid var(--border);font-size:12px}
.qa-confirm-box{padding:13px;border-radius:16px;border:1px solid rgba(108,125,255,.24);background:var(--accent-bg);margin-bottom:12px}
.qa-confirm-box h4{font-size:13px;margin-bottom:6px;color:var(--text)}
.qa-confirm-box p{font-size:12px;line-height:1.55;color:var(--text2)}
.qa-validation-list{display:flex;flex-direction:column;gap:6px;margin:10px 0}
.qa-validation-item{padding:8px 10px;border-radius:10px;font-size:11.5px;font-weight:800;border:1px solid var(--border);background:var(--surface2)}
.qa-validation-item.error{color:var(--red);border-color:rgba(255,92,114,.28);background:var(--red-bg)}
.qa-validation-item.warn{color:var(--amber);border-color:rgba(240,180,41,.28);background:var(--amber-bg)}
.qa-validation-item.ok{color:var(--green);border-color:rgba(52,213,138,.25);background:var(--green-bg)}

/* Backup */
.backup-hero-card{background:linear-gradient(135deg,var(--surface),rgba(108,125,255,.08));border-color:rgba(108,125,255,.22)}
.backup-health-box{min-width:132px;padding:18px;border-radius:20px;background:rgba(255,255,255,.055);border:1px solid rgba(255,255,255,.08);text-align:center}
.backup-health-value{font-size:42px;font-weight:950;letter-spacing:-.06em;line-height:1;color:var(--accent2)}
.backup-health-label{font-size:11px;font-weight:800;color:var(--text3);margin-top:7px;letter-spacing:.04em;text-transform:uppercase}
.backup-summary-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:18px}
.backup-summary-item{padding:14px;border-radius:15px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07)}
.backup-summary-item span{display:block;font-size:11px;color:var(--text3);font-weight:800;letter-spacing:.05em;text-transform:uppercase;margin-bottom:7px}
.backup-summary-item strong{display:block;font-size:18px;color:var(--text);font-weight:900;letter-spacing:-.03em;line-height:1.25}
.backup-summary-item small{display:block;margin-top:6px;font-size:11px;color:var(--text3)}
.networth-timeline-card{border-color:rgba(108,125,255,.22);background:linear-gradient(135deg,var(--surface),rgba(108,125,255,.055))}
.networth-timeline-card .table-wrap{max-height:360px}
.calc-audit-hero{background:linear-gradient(135deg,var(--surface),rgba(52,213,138,.07));border-color:rgba(52,213,138,.20)}

/* Misc */
.disclaimer-banner{display:flex;align-items:flex-start;gap:10px;padding:10px 16px;background:rgba(240,180,41,.08);border:1px solid rgba(240,180,41,.2);border-radius:10px;margin-bottom:14px;font-size:11px;color:var(--text3);line-height:1.5}
.disclaimer-banner strong{color:var(--amber);font-size:11px;white-space:nowrap}
.disclaimer-banner a{color:var(--accent);text-decoration:none}
.disclaimer-banner a:hover{text-decoration:underline}
.legal-footer{text-align:center;font-size:10px;color:var(--text3);padding:16px 20px 8px;line-height:1.6;border-top:1px solid var(--border);margin-top:24px}

/* Dark/Light toggle */
:root[data-theme='light']{--bg:#f4f5f7;--surface:#ffffff;--surface2:#eef0f4;--surface3:#e4e7ed;--border:#d0d5e0;--border2:#bcc3d4;--text:#131620;--text2:#44506a;--text3:#828fa8;--accent:#5060e8;--accent2:#6070ff;--accent-bg:rgba(80,96,232,.10);--green:#179e5e;--green-bg:rgba(23,158,94,.10);--red:#d63550;--red-bg:rgba(214,53,80,.10);--amber:#c78a0c;--amber-bg:rgba(199,138,12,.10);}
:root[data-theme='light'] body{background:var(--bg)}
:root[data-theme='light'] .sidebar{background:rgba(255,255,255,.90);box-shadow:inset -1px 0 0 rgba(0,0,0,.07)}
:root[data-theme='light'] .sidebar.collapsed{background:rgba(255,255,255,.95)}
:root[data-theme='light'] .sidebar-toggle{border-color:rgba(0,0,0,.11);background:rgba(0,0,0,.04);color:rgba(19,22,32,.6)}
:root[data-theme='light'] .topbar{background:rgba(255,255,255,.92);backdrop-filter:blur(12px)}
:root[data-theme='light'] table thead tr,:root[data-theme='light'] th{background:var(--surface2)}
:root[data-theme='light'] tr:hover td{background:rgba(0,0,0,.025)}
.theme-toggle{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:10px;border:1px solid var(--border2);background:var(--surface2);color:var(--text2);cursor:pointer;font-size:16px;transition:.18s ease;flex-shrink:0}
.theme-toggle:hover{background:var(--surface3);color:var(--text);transform:translateY(-1px)}

/* Onboarding ─ redesigned */
.ob-overlay{position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.88);display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(24px);animation:obIn .25s ease;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;touch-action:pan-y}
@keyframes obIn{from{opacity:0}to{opacity:1}}
.ob-card{background:var(--surface,#161920);border:1px solid rgba(108,125,255,.22);border-radius:28px;width:100%;max-width:540px;max-height:calc(100dvh - 40px);padding:40px 44px;box-shadow:0 48px 120px rgba(0,0,0,.8),0 0 0 1px rgba(108,125,255,.06),inset 0 1px 0 rgba(255,255,255,.04);animation:obUp .4s cubic-bezier(.16,1,.3,1);overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;overscroll-behavior:contain}
@keyframes obUp{from{opacity:0;transform:translateY(32px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
.ob-logo-row{display:flex;align-items:center;gap:10px;margin-bottom:28px}
.ob-logo-mark{width:36px;height:36px;background:linear-gradient(135deg,var(--accent,#6c7dff),#a78bfa);border-radius:11px;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:900;color:#fff;flex-shrink:0;box-shadow:0 4px 14px rgba(108,125,255,.4)}
.ob-logo-name{font-size:14px;font-weight:700;color:var(--text,#f0f1f3);letter-spacing:-.02em}
.ob-stepper-wrap{margin-bottom:24px}
.ob-progress-bar{height:6px;border-radius:99px;background:var(--surface3,#252830);margin-bottom:12px;overflow:hidden}
.ob-progress-fill{height:100%;border-radius:99px;background:linear-gradient(90deg,var(--accent,#6c7dff),#a78bfa);transition:width .5s cubic-bezier(.16,1,.3,1)}
.ob-progress-label{font-size:11px;color:var(--text3,#5a6278);text-align:right;margin-top:5px;font-weight:700;letter-spacing:.05em}
.ob-stepper{display:flex;align-items:center;gap:0;margin-bottom:0}
.ob-st{display:flex;align-items:center;flex:1}
.ob-st-dot{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;border:2px solid var(--border2,#353840);color:var(--text3,#5a6278);background:var(--surface2,#1e2129);transition:.25s}
.ob-st-dot.active{border-color:var(--accent,#6c7dff);color:var(--accent,#6c7dff);background:rgba(108,125,255,.15);box-shadow:0 0 0 4px rgba(108,125,255,.1)}
.ob-st-dot.done{border-color:var(--green,#34d58a);color:var(--green,#34d58a);background:rgba(52,213,138,.12)}
.ob-st-line{flex:1;height:2px;background:var(--border,#2a2d36);margin:0 4px;transition:.4s;border-radius:1px}
.ob-st-line.done{background:var(--green,#34d58a)}
.ob-st-line.active{background:linear-gradient(90deg,var(--green,#34d58a),var(--accent,#6c7dff))}
.ob-eyebrow{font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--accent,#6c7dff);margin-bottom:6px;opacity:.8}
.ob-h{font-size:24px;font-weight:900;letter-spacing:-.04em;color:var(--text,#f0f1f3);line-height:1.25;margin-bottom:6px}
.ob-sub{font-size:13px;color:var(--text3,#5a6278);line-height:1.6;margin-bottom:24px}
.ob-fstack{display:flex;flex-direction:column;gap:14px}
.ob-row2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.ob-f{display:flex;flex-direction:column;gap:6px}
.ob-f label{font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text3,#5a6278)}
.ob-f input,.ob-f select{width:100%;padding:11px 14px;border:1.5px solid var(--border2,#353840);border-radius:12px;background:var(--surface2,#1e2129);color:var(--text,#f0f1f3);font-size:14px;font-family:inherit;outline:none;transition:.18s}
.ob-f input:focus,.ob-f select:focus{border-color:var(--accent,#6c7dff);box-shadow:0 0 0 4px rgba(108,125,255,.12);background:rgba(108,125,255,.04)}
.ob-f input::placeholder{color:var(--text3,#5a6278)}
.ob-f input[type=number]{-moz-appearance:textfield}
.ob-f input[type=number]::-webkit-outer-spin-button,.ob-f input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none}
.ob-hint{font-size:11px;color:var(--text3,#5a6278);margin-top:3px;line-height:1.5}
.ob-tags{display:flex;gap:8px;flex-wrap:wrap}
.ob-tag{padding:8px 16px;border-radius:99px;font-size:13px;font-weight:600;border:1.5px solid var(--border2,#353840);background:var(--surface2,#1e2129);color:var(--text2,#9ba3b5);cursor:pointer;transition:.18s;font-family:inherit}
.ob-tag.sel{border-color:var(--accent,#6c7dff);background:rgba(108,125,255,.16);color:var(--accent,#6c7dff);box-shadow:0 0 0 3px rgba(108,125,255,.1)}
.ob-tag:hover:not(.sel){background:var(--surface3,#252830);color:var(--text,#f0f1f3)}
.ob-preview{padding:14px 16px;border-radius:14px;margin-top:4px;background:rgba(108,125,255,.08);border:1.5px solid rgba(108,125,255,.2)}
.ob-preview-label{font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text3,#5a6278);margin-bottom:5px}
.ob-preview-val{font-size:22px;font-weight:900;letter-spacing:-.04em;color:var(--accent,#6c7dff);font-variant-numeric:tabular-nums}
.ob-preview-sub{font-size:11px;color:var(--text3,#5a6278);margin-top:4px}
.ob-footer{display:flex;align-items:center;justify-content:space-between;margin-top:28px;gap:10px}
.ob-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:13px 24px;border-radius:13px;font-size:14px;font-weight:700;border:none;cursor:pointer;transition:.2s cubic-bezier(.2,.8,.2,1);font-family:inherit}
.ob-btn.primary{background:linear-gradient(135deg,var(--accent,#6c7dff),#8b9aff);color:#fff;box-shadow:0 6px 22px rgba(108,125,255,.4)}
.ob-btn.primary:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 10px 30px rgba(108,125,255,.5)}
.ob-btn.primary:active:not(:disabled){transform:translateY(0)}
.ob-btn.ghost{background:var(--surface2,#1e2129);color:var(--text2,#9ba3b5);border:1.5px solid var(--border,#2a2d36)}
.ob-btn.ghost:hover{background:var(--surface3,#252830);color:var(--text,#f0f1f3)}
.ob-btn:disabled{opacity:.35;cursor:not-allowed;transform:none!important}
.ob-skip{font-size:12px;color:var(--text3,#5a6278);cursor:pointer;background:none;border:none;font-family:inherit;text-decoration:underline}
.ob-skip:hover{color:var(--text2,#9ba3b5)}
.ob-disclaimer-box{background:rgba(240,180,41,.06);border:1.5px solid rgba(240,180,41,.28);border-radius:18px;padding:22px;margin-bottom:24px}
.ob-disclaimer-icon{font-size:28px;margin-bottom:10px}
.ob-disclaimer-title{font-size:14px;font-weight:800;color:var(--amber,#f0b429);margin-bottom:12px;letter-spacing:-.01em}
.ob-disclaimer-body{font-size:13px;color:var(--text2,#9ba3b5);line-height:1.72;margin-bottom:16px}
.ob-disclaimer-body strong{color:var(--text,#f0f1f3)}
.ob-disclaimer-check{display:flex;align-items:flex-start;gap:10px;cursor:pointer;font-size:13px;font-weight:600;color:var(--text,#f0f1f3);line-height:1.5;padding:12px 14px;border-radius:12px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);transition:.15s}
.ob-disclaimer-check:hover{background:rgba(255,255,255,.05)}
.ob-quickstart-btn{width:100%;justify-content:center;flex-direction:column;padding:13px 24px;gap:4px;border:1.5px solid var(--border,#2a2d36)!important}
.ob-quickstart-sub{font-size:11px;font-weight:500;color:var(--text3,#5a6278)}
.ob-style-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:8px}
.ob-style-card{display:flex;flex-direction:column;align-items:center;gap:5px;padding:18px 10px;border-radius:18px;border:1.5px solid var(--border2,#353840);background:var(--surface2,#1e2129);cursor:pointer;transition:.2s cubic-bezier(.2,.8,.2,1);font-family:inherit}
.ob-style-card:hover{background:var(--surface3,#252830);border-color:rgba(108,125,255,.35);transform:translateY(-3px);box-shadow:0 8px 24px rgba(0,0,0,.3)}
.ob-style-card.sel{border-color:var(--accent,#6c7dff);background:rgba(108,125,255,.12);box-shadow:0 0 0 4px rgba(108,125,255,.1),0 8px 24px rgba(108,125,255,.15);transform:translateY(-2px)}
.ob-style-icon{font-size:28px;margin-bottom:2px}
.ob-style-name{font-size:13px;font-weight:800;color:var(--text,#f0f1f3)}
.ob-style-sub{font-size:10px;font-weight:600;color:var(--accent,#6c7dff)}
.ob-style-detail{font-size:9.5px;color:var(--text3,#5a6278);text-align:center;line-height:1.4}

/* Mobile login modal */
.mobile-login-modal-overlay{position:fixed;inset:0;z-index:500;background:rgba(0,0,0,.75);backdrop-filter:blur(20px) saturate(160%);-webkit-backdrop-filter:blur(20px) saturate(160%);display:flex;align-items:flex-end;justify-content:center;animation:mloOverlayIn .22s ease;}
@keyframes mloOverlayIn{from{opacity:0}to{opacity:1}}
.mobile-login-sheet{width:100%;max-width:520px;background:var(--surface);border-radius:32px 32px 0 0;border-top:1px solid rgba(255,255,255,.10);padding:0 0 max(32px, env(safe-area-inset-bottom));box-shadow:0 -24px 80px rgba(0,0,0,.55);animation:mloSheetIn .3s cubic-bezier(.2,.8,.2,1);overflow:hidden;}
@keyframes mloSheetIn{from{transform:translateY(100%)}to{transform:translateY(0)}}
.mlo-header{position:relative;padding:32px 28px 24px;background:linear-gradient(135deg,rgba(108,125,255,.18),rgba(52,213,138,.07));border-bottom:1px solid rgba(255,255,255,.07);}
.mlo-glow{position:absolute;right:-60px;top:-80px;width:220px;height:220px;background:radial-gradient(circle,rgba(108,125,255,.22),transparent 68%);pointer-events:none;}
.mlo-handle{width:36px;height:4px;border-radius:99px;background:rgba(255,255,255,.20);margin:0 auto 20px}
.mlo-logo-row{display:flex;align-items:center;gap:10px;margin-bottom:14px}
.mlo-logo-mark{width:38px;height:38px;border-radius:14px;background:linear-gradient(135deg,#6c7dff,#8b9aff);display:flex;align-items:center;justify-content:center;font-size:19px;font-weight:900;color:#fff;box-shadow:0 8px 22px rgba(108,125,255,.35)}
.mlo-logo-text{font-size:16px;font-weight:800;color:var(--text);letter-spacing:-.02em}
.mlo-logo-sub{font-size:11px;color:var(--text3);margin-top:1px}
.mlo-headline{font-size:22px;font-weight:900;letter-spacing:-.04em;color:var(--text);line-height:1.25}
.mlo-sub{font-size:13px;color:var(--text3);margin-top:6px;line-height:1.5}
.mlo-body{padding:24px 28px 0}
.mlo-field{display:flex;flex-direction:column;gap:6px;margin-bottom:14px}
.mlo-field label{font-size:11px;font-weight:700;color:var(--text3);letter-spacing:.05em;text-transform:uppercase}
.mlo-input-wrap{position:relative}
.mlo-input-icon{position:absolute;left:14px;top:50%;transform:translateY(-50%);font-size:16px;pointer-events:none;opacity:.6}
.mlo-input{width:100%;padding:14px 14px 14px 42px;border:1.5px solid var(--border2);border-radius:14px;background:var(--surface2);color:var(--text);font-size:15px;outline:none;transition:.18s ease;font-family:inherit;}
.mlo-input:focus{border-color:var(--accent);background:rgba(108,125,255,.07);box-shadow:0 0 0 4px rgba(108,125,255,.13)}
.mlo-input::placeholder{color:var(--text3)}
.mlo-btn-row{display:flex;flex-direction:column;gap:10px;margin-top:8px}
.mlo-btn-primary{width:100%;padding:16px;border:none;border-radius:16px;background:linear-gradient(135deg,#6c7dff,#8b9aff);color:#fff;font-size:16px;font-weight:800;box-shadow:0 14px 36px rgba(108,125,255,.35);transition:.18s ease;font-family:inherit;cursor:pointer;}
.mlo-btn-primary:hover{transform:translateY(-1px);box-shadow:0 18px 44px rgba(108,125,255,.42)}
.mlo-btn-primary:disabled{opacity:.5;cursor:not-allowed;transform:none}
.mlo-btn-secondary{width:100%;padding:14px;border:1.5px solid var(--border2);border-radius:16px;background:transparent;color:var(--text2);font-size:14px;font-weight:700;transition:.15s ease;font-family:inherit;cursor:pointer;}
.mlo-btn-secondary:hover{background:var(--surface2);color:var(--text)}
.mlo-msg{font-size:12px;color:var(--red);margin-top:6px;padding:8px 12px;border-radius:10px;background:var(--red-bg);border:1px solid rgba(255,92,114,.2)}
.mlo-msg.ok{color:var(--green);background:var(--green-bg);border-color:rgba(52,213,138,.2)}
.mlo-divider{display:flex;align-items:center;gap:10px;margin:16px 0;color:var(--text3);font-size:11px;font-weight:700}
.mlo-divider::before,.mlo-divider::after{content:"";flex:1;height:1px;background:var(--border)}
.mlo-local-chip{display:flex;align-items:center;gap:8px;padding:12px 14px;border-radius:14px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);font-size:12px;font-weight:700;color:var(--text3);cursor:pointer;transition:.15s ease;width:100%;text-align:left;}
.mlo-local-chip:hover{background:var(--surface2);color:var(--text2)}
.mlo-local-icon{width:30px;height:30px;border-radius:10px;background:var(--surface3);display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0}
.mlo-session-bar{display:flex;align-items:center;gap:10px;padding:12px 14px;border-radius:14px;background:rgba(52,213,138,.08);border:1px solid rgba(52,213,138,.18);margin-bottom:14px;}
.mlo-session-avatar{width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,#6c7dff,#34d58a);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:900;color:#fff;flex-shrink:0}
.mlo-session-email{font-size:12px;font-weight:700;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mlo-session-status{font-size:11px;color:var(--green);font-weight:700}
.mlo-action-row{display:flex;gap:8px;flex-wrap:wrap}
.mlo-action-btn{flex:1;min-width:0;padding:11px 8px;border:1px solid var(--border2);border-radius:12px;background:var(--surface2);color:var(--text2);font-size:12px;font-weight:700;transition:.15s ease;font-family:inherit;cursor:pointer;white-space:nowrap}
.mlo-action-btn:hover{background:var(--surface3);color:var(--text)}
.mlo-action-btn.danger{color:var(--red);border-color:rgba(255,92,114,.2);background:var(--red-bg)}

/* ═══════════════════════════════════════
   MOBILE HEADER & TABBAR
═══════════════════════════════════════ */
.mobile-header{display:none;position:sticky;top:0;z-index:90;background:rgba(13,15,20,.88);backdrop-filter:blur(20px) saturate(160%);-webkit-backdrop-filter:blur(20px) saturate(160%);border-bottom:1px solid rgba(255,255,255,.07);padding:0 16px;height:56px;align-items:center;justify-content:space-between;gap:10px;}
.mobile-header-left{display:flex;align-items:center;gap:8px}
.mobile-header-logo{width:28px;height:28px;border-radius:9px;background:var(--accent);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:900;color:#fff;flex-shrink:0}
.mobile-header-title{font-size:15px;font-weight:700;color:var(--text);letter-spacing:-.02em}
.mobile-header-right{display:flex;align-items:center;gap:6px}
.mobile-header-sync{display:flex;align-items:center;gap:4px;padding:5px 9px;border-radius:99px;font-size:10px;font-weight:800;border:1px solid rgba(52,213,138,.25);background:rgba(52,213,138,.09);color:var(--green);cursor:pointer;}
.mobile-header-sync.offline{border-color:rgba(90,98,120,.3);background:rgba(90,98,120,.09);color:var(--text3)}
.mobile-header-theme{width:34px;height:34px;border-radius:10px;border:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.05);color:var(--text2);font-size:16px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:.15s ease}
.mobile-header-badge{display:flex;align-items:center;padding:3px 8px;border-radius:99px;font-size:10px;font-weight:800;}
.mobile-header-badge.surplus{background:rgba(52,213,138,.12);color:var(--green)}
.mobile-header-badge.deficit{background:rgba(255,92,114,.12);color:var(--red)}

.mobile-tabbar{display:none;position:fixed;bottom:0;left:0;right:0;z-index:95;background:rgba(16,18,24,.94);backdrop-filter:blur(24px) saturate(180%);-webkit-backdrop-filter:blur(24px) saturate(180%);border-top:1px solid rgba(255,255,255,.07);padding:10px 8px max(16px, env(safe-area-inset-bottom));}
.mobile-tabbar-inner{display:flex;align-items:center;justify-content:space-around;max-width:460px;margin:0 auto;gap:4px;}
.mobile-tab-btn{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;flex:1;min-width:0;padding:6px 4px 4px;border:none;background:none;color:var(--text3);font-family:inherit;transition:all .18s cubic-bezier(.2,.8,.2,1);position:relative;border-radius:14px;cursor:pointer;-webkit-tap-highlight-color:transparent;}
.mobile-tab-btn.active{color:var(--accent2)}
.mobile-tab-btn.active .mobile-tab-icon-wrap{background:rgba(108,125,255,.18);border:1px solid rgba(108,125,255,.25);transform:scale(1.04);}
.mobile-tab-btn:active{transform:scale(.93)}
.mobile-tab-icon-wrap{width:40px;height:30px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:transparent;border:1px solid transparent;transition:all .18s cubic-bezier(.2,.8,.2,1);}
.mobile-tab-icon{font-size:18px;line-height:1}
.mobile-tab-label{font-size:9.5px;font-weight:700;letter-spacing:.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:54px}
.mobile-tab-dot{position:absolute;top:4px;right:calc(50% - 24px);width:7px;height:7px;border-radius:99px;background:var(--red);border:2px solid rgba(16,18,24,.94);}

.mobile-more-sheet-overlay{position:fixed;inset:0;z-index:200;background:rgba(0,0,0,.6);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);animation:mmoOverlayIn .18s ease;}
@keyframes mmoOverlayIn{from{opacity:0}to{opacity:1}}
.mobile-more-sheet{position:fixed;bottom:0;left:0;right:0;z-index:201;background:var(--surface);border-radius:28px 28px 0 0;border-top:1px solid rgba(255,255,255,.09);padding:12px 16px max(28px, env(safe-area-inset-bottom));box-shadow:0 -20px 60px rgba(0,0,0,.45);animation:mmoSheetIn .28s cubic-bezier(.2,.8,.2,1);}
@keyframes mmoSheetIn{from{transform:translateY(100%)}to{transform:translateY(0)}}
.mobile-more-handle{width:36px;height:4px;border-radius:99px;background:var(--border2);margin:0 auto 16px}
.mobile-more-section{font-size:10px;font-weight:800;color:var(--text3);letter-spacing:.07em;text-transform:uppercase;padding:0 4px;margin-bottom:8px}
.mobile-more-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:16px}
.mobile-more-item{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;padding:13px 6px 11px;border-radius:18px;border:1px solid var(--border);background:var(--surface2);font-size:10px;font-weight:700;color:var(--text2);cursor:pointer;transition:.15s cubic-bezier(.2,.8,.2,1);-webkit-tap-highlight-color:transparent;}
.mobile-more-item:active{transform:scale(.93);background:var(--surface3)}
.mobile-more-item.active{background:rgba(108,125,255,.14);border-color:rgba(108,125,255,.32);color:var(--accent2);}
.mobile-more-icon{width:36px;height:36px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.07);margin-bottom:2px;}
.mobile-more-item.active .mobile-more-icon{background:rgba(108,125,255,.18);border-color:rgba(108,125,255,.28);}

/* ═══════════════════════════════════════
   PC RESPONSIVE (900px 이하)
═══════════════════════════════════════ */
@media(max-width:900px){
  .sidebar{width:180px}
  .main{margin-left:180px}
  .kpi-grid{grid-template-columns:repeat(2,1fr)}
  .g4{grid-template-columns:repeat(2,1fr)}
  .form-grid{grid-template-columns:repeat(2,1fr)}
  .donut-wrap{grid-template-columns:1fr}
  .page{padding:20px}
  .automation-hero,.cfo-hero,.goal-hero,.decision-hero,.report-hero,.retirement-hero{flex-direction:column;align-items:flex-start}
  .dashboard-hero,.cfo-decision-head,.cfo-detail-panel,.ai-coach-hero{grid-template-columns:1fr}
  .dashboard-summary-grid{grid-template-columns:repeat(2,1fr)}
  .cfo-score-grid{grid-template-columns:repeat(2,1fr)}
  .cfo-action-grid{grid-template-columns:1fr}
  .cfo-app-status-card{grid-template-columns:1fr}
  .cfo-sim-grid{grid-template-columns:repeat(2,1fr)}
  .cfo-sim-main{grid-column:1/-1}
  .cfo-product-hero{grid-template-columns:1fr}
  .cfo-product-grid{grid-template-columns:1fr}
  .cfo-product-detail{grid-template-columns:repeat(2,1fr)}
  .cfo-plan-grid{grid-template-columns:1fr}
  .cfo-detail-list{grid-template-columns:1fr}
  .ai-coach-grid{grid-template-columns:1fr}
  .tax-action-grid{grid-template-columns:1fr 1fr}
  .dashboard-advice-list{grid-template-columns:repeat(2,1fr)}
  .dashboard-linked-grid{grid-template-columns:repeat(2,1fr)}
  .backup-summary-grid{grid-template-columns:1fr}
  .backup-health-box{width:100%}
  .cfo-preview-change{grid-template-columns:1fr}
  .cfo-execute-btn{width:100%}
  .tax-cal-grid{gap:6px}
  .tax-cal-day{min-height:92px;padding:7px}
  .tax-cal-event p{display:none}
  .summary-headline{font-size:22px}
  .summary-friendly-text{font-size:13.5px}
  .report-summary-spotlight{padding:20px}
}

/* ═══════════════════════════════════════
   MOBILE (768px 이하) — 핵심 스크롤 픽스
   body가 스크롤. 모든 wrapper는 auto.
═══════════════════════════════════════ */
@media(max-width:768px){
  /* 사이드바/탑바 숨김, 모바일 UI 표시 */
  .sidebar{display:none!important}
  .topbar{display:none!important}
  .mobile-header{display:flex!important}
  .mobile-tabbar{display:flex!important}

  /* ── 스크롤 루트 완전 개방 ── */
  html,body{
    width:100%!important;
    height:auto!important;
    min-height:100%!important;
    max-height:none!important;
    overflow-x:hidden!important;
    overflow-y:auto!important;      /* body가 스크롤 */
    position:static!important;
    -webkit-overflow-scrolling:touch!important;
    overscroll-behavior-y:auto!important;
    touch-action:pan-y!important;
  }

  /* ── 모든 래퍼: 높이 잠금 해제 ── */
  .app,.shell,.main,.page{
    display:block!important;
    width:100%!important;
    height:auto!important;
    min-height:0!important;
    max-height:none!important;
    overflow:visible!important;     /* 잘리지 않게 */
    position:static!important;
    transform:none!important;
    margin-left:0!important;
  }

  /* 하단 탭바 높이만큼 여백 */
  .main{
    padding-bottom:calc(80px + env(safe-area-inset-bottom, 0px))!important;
  }
  .page{
    padding:14px 14px calc(100px + env(safe-area-inset-bottom, 0px))!important;
    max-width:100%!important;
  }
  .page>*{max-width:100%!important;overflow-x:hidden!important;}

  /* sticky 요소 */
  .mobile-header{position:sticky!important;top:0!important;z-index:90!important;}
  .auth-bar{
    display:flex!important;
    position:sticky!important;
    top:56px!important;
    z-index:88!important;
    width:100%!important;
    box-sizing:border-box!important;
    padding:10px 12px!important;
    flex-direction:column!important;
    align-items:stretch!important;
    gap:8px!important;
    border-top:1px solid rgba(255,255,255,.04)!important;
    border-bottom:1px solid rgba(255,255,255,.08)!important;
    max-height:none!important;
    overflow:visible!important;
    height:auto!important;
  }
  .auth-bar .row{display:grid!important;grid-template-columns:1fr 1fr!important;width:100%!important;gap:8px!important;}
  .auth-bar .auth-input{min-width:0!important;width:100%!important;box-sizing:border-box!important;}
  .auth-bar .btn{width:100%!important;min-height:38px!important;}

  /* fixed 요소 */
  .mobile-tabbar{position:fixed!important;bottom:0!important;left:0!important;right:0!important;z-index:95!important;}
  .fab{bottom:calc(72px + env(safe-area-inset-bottom, 0px));right:16px;width:50px;height:50px;font-size:21px;}



  /* 첫 실행 온보딩 팝업: 모바일에서 내부 스크롤 가능하게 고정 */
  .ob-overlay{
    align-items:flex-start!important;
    justify-content:center!important;
    padding:12px!important;
    overflow-y:auto!important;
    overflow-x:hidden!important;
    -webkit-overflow-scrolling:touch!important;
    touch-action:pan-y!important;
  }
  .ob-card{
    width:100%!important;
    max-width:100%!important;
    max-height:none!important;
    min-height:auto!important;
    margin:0 auto max(18px, env(safe-area-inset-bottom, 0px))!important;
    padding:22px 16px 18px!important;
    border-radius:22px!important;
    overflow-y:visible!important;
    overflow-x:hidden!important;
    box-sizing:border-box!important;
  }
  .ob-row2{grid-template-columns:1fr!important;}
  .ob-footer{
    position:sticky!important;
    bottom:-18px!important;
    z-index:5!important;
    margin-left:-16px!important;
    margin-right:-16px!important;
    margin-bottom:-18px!important;
    padding:12px 16px calc(14px + env(safe-area-inset-bottom, 0px))!important;
    background:linear-gradient(0deg,var(--surface,#161920) 78%,rgba(22,25,32,0))!important;
    backdrop-filter:blur(14px)!important;
    -webkit-backdrop-filter:blur(14px)!important;
  }
  .ob-btn{min-height:44px!important;}

    /* 모달/시트 */
  .modal-sheet,.qa-sheet,.mobile-more-sheet,.mobile-login-sheet{max-height:86dvh!important;overflow-y:auto!important;-webkit-overflow-scrolling:touch!important;}
  .modal-sheet,.qa-sheet{border-radius:24px 24px 0 0}
  .apple-cfo-modal-overlay{align-items:flex-end!important;padding:0!important;}
  .apple-cfo-modal.cfo-input-modal{width:100vw!important;max-height:92dvh!important;border-radius:24px 24px 0 0!important;padding:18px 16px 16px!important;}
  .apple-cfo-modal-actions{grid-template-columns:1fr!important;}
  .apple-cfo-undo-toast{left:16px;right:16px;transform:none;justify-content:space-between}

  /* 그리드/카드 */
  .kpi-grid{grid-template-columns:repeat(2,1fr)!important;gap:10px}
  .kpi-card{padding:14px}
  .kpi-value{font-size:21px}
  .g2,.g3{grid-template-columns:1fr!important}
  .g4{grid-template-columns:repeat(2,1fr)!important}
  .form-grid,.form-grid-3{grid-template-columns:1fr!important}
  .donut-wrap{grid-template-columns:1fr!important}
  .card{padding:16px;border-radius:16px}
  .card-sm{padding:13px;border-radius:14px}
  .dashboard-summary-grid{grid-template-columns:repeat(2,1fr)!important}
  .health-score{font-size:44px}

  /* 테이블 */
  .table-wrap{overflow-x:auto!important;-webkit-overflow-scrolling:touch;border-radius:12px}
  table{min-width:560px;font-size:12px}
  th,td{padding:8px 10px;white-space:nowrap}

  /* 버튼/배지 */
  .badge{font-size:10px;padding:2px 7px}
  .btn{padding:9px 14px;font-size:12.5px}
  .btn-sm{padding:7px 11px;font-size:11.5px}

  /* 탭 가로 스크롤 */
  .tab-row{overflow-x:auto!important;-webkit-overflow-scrolling:touch;flex-wrap:nowrap!important;padding-bottom:4px;gap:6px;margin-bottom:16px}
  .tab-row::-webkit-scrollbar{display:none}
  .tab-chip{flex-shrink:0;padding:7px 13px;font-size:11.5px}

  /* 텍스트 */
  h2,h3{word-break:keep-all}
  .stat-row{font-size:12.5px}

  /* 세금 */
  .tax-cal-grid{grid-template-columns:repeat(2,1fr)!important}
  .tax-cal-weekday{display:none}
  .tax-cal-day.outside{display:none}
  .tax-action-grid{grid-template-columns:1fr!important}
  .qa-mode-row{grid-template-columns:1fr!important}
  .qa-split-summary{grid-template-columns:1fr!important}
  .qa-form-grid{grid-template-columns:1fr!important}
  .mobile-more-grid{grid-template-columns:repeat(4,1fr)}
  .cfo-detail-top{align-items:flex-start;flex-direction:column}
  .cfo-detail-top span{max-width:100%;text-align:left}
  .cfo-flow-strip{grid-template-columns:1fr!important}
  .cfo-flow-arrow{display:none}
  .cfo-next-action-panel{grid-template-columns:1fr!important}
  .cfo-app-action-main{grid-template-columns:1fr!important}
  .cfo-app-preview-strip{align-items:flex-start;flex-wrap:wrap}
  .cfo-app-preview-note{margin-left:0}
  .cfo-app-score-grid{grid-template-columns:1fr!important}
  .cfo-app-secondary-action{grid-template-columns:1fr!important}
  .cfo-score-grid{grid-template-columns:1fr!important}
  .cfo-action-grid{grid-template-columns:1fr!important}
  .cfo-app-status-card{grid-template-columns:1fr!important;padding:18px;border-radius:24px}
  .cfo-app-status-left h2{font-size:24px}
  .cfo-app-conclusion strong{font-size:20px}
  .cfo-app-action-card{padding:18px;border-radius:24px}
  .cfo-history-item{grid-template-columns:1fr!important}
  .cfo-history-rollback{width:100%}
  .cfo-input-preview{grid-template-columns:1fr!important}
  .cfo-input-grid{grid-template-columns:1fr!important}
  .cfo-verification-row{grid-template-columns:1fr!important;gap:4px}
  .cfo-verification-row b{text-align:left;white-space:normal}
  .cfo-verification-row em{display:none}
  .cfo-sim-grid{grid-template-columns:1fr!important}
  .cfo-product-hero{grid-template-columns:1fr!important}
  .cfo-product-detail{grid-template-columns:1fr!important}
  .cfo-action-focus{grid-template-columns:1fr!important}
  .cfo-plan-grid{grid-template-columns:1fr!important}
  .cfo-preview-change{grid-template-columns:1fr!important}
  .apple-cfo-preview-grid{grid-template-columns:1fr!important}
  .ai-coach-hero{grid-template-columns:1fr!important}
  .ai-coach-grid{grid-template-columns:1fr!important}
  .ai-coach-title{font-size:22px}
  .ai-coach-score{font-size:40px}
  .dashboard-linked-grid{grid-template-columns:1fr!important}
  .dashboard-advice-list{grid-template-columns:1fr!important}
  .backup-summary-grid{grid-template-columns:1fr!important}
  .ob-row2{grid-template-columns:1fr!important}
  .ob-card{padding:24px 20px;border-radius:18px}
  .ob-h{font-size:19px}
  .summary-headline{font-size:20px}
  .summary-friendly-text{font-size:13px}
}

@media(max-width:430px){
  .kpi-grid{grid-template-columns:1fr!important}
  .g4{grid-template-columns:1fr!important}
  .page{padding:12px 12px calc(96px + env(safe-area-inset-bottom, 0px))!important}
  .card{padding:14px;border-radius:14px}
  .mobile-more-grid{grid-template-columns:repeat(3,1fr)!important}
  .dashboard-summary-grid{grid-template-columns:1fr!important}
  .health-score{font-size:38px}
}

/* Light theme mobile */
:root[data-theme='light'] .mobile-tabbar{background:rgba(248,249,252,.95);border-top-color:rgba(0,0,0,.09);}
:root[data-theme='light'] .mobile-header{background:rgba(248,249,252,.92);border-bottom-color:rgba(0,0,0,.08);}
:root[data-theme='light'] .mobile-more-sheet{background:var(--surface)}
:root[data-theme='light'] .mobile-login-sheet{background:var(--surface)}
:root[data-theme='light'] .mobile-tab-btn.active{color:var(--accent)}
:root[data-theme='light'] .mobile-tab-btn.active .mobile-tab-icon-wrap{background:rgba(80,96,232,.12);border-color:rgba(80,96,232,.22)}
:root[data-theme='light'] .mlo-header{background:linear-gradient(135deg,rgba(80,96,232,.14),rgba(23,158,94,.06))}
:root[data-theme='light'] .mlo-logo-mark{background:linear-gradient(135deg,#5060e8,#6070ff)}

@media print{
  .sidebar,.topbar,.auth-bar,.fab,.tab-row,.btn{display:none!important}
  .main{margin-left:0!important}
  .page{max-width:none!important;padding:0!important}
  body{background:#fff!important;color:#111!important}
  .card,.kpi-card,.card-sm{break-inside:avoid;background:#fff!important;color:#111!important;border-color:#ddd!important}
}

/* FINAL FIX: mobile onboarding popup scroll lock */
@media (max-width: 768px){
  .ob-overlay{
    position:fixed!important;
    inset:0!important;
    height:100dvh!important;
    min-height:100dvh!important;
    display:block!important;
    padding:12px!important;
    overflow-y:auto!important;
    overflow-x:hidden!important;
    -webkit-overflow-scrolling:touch!important;
    overscroll-behavior-y:contain!important;
    touch-action:pan-y!important;
    box-sizing:border-box!important;
  }
  .ob-card{
    width:100%!important;
    max-width:580px!important;
    max-height:none!important;
    min-height:auto!important;
    margin:0 auto calc(24px + env(safe-area-inset-bottom, 0px))!important;
    padding:22px 16px 18px!important;
    border-radius:22px!important;
    overflow:visible!important;
    box-sizing:border-box!important;
  }
  .ob-footer{
    position:sticky!important;
    bottom:-18px!important;
    z-index:10!important;
    margin-left:-16px!important;
    margin-right:-16px!important;
    margin-bottom:-18px!important;
    padding:12px 16px calc(14px + env(safe-area-inset-bottom, 0px))!important;
    background:linear-gradient(0deg,var(--surface,#161920) 78%,rgba(22,25,32,0))!important;
    backdrop-filter:blur(14px)!important;
    -webkit-backdrop-filter:blur(14px)!important;
  }
}


/* CLEAN LOGIN UI OVERRIDE: minimal premium login panel */
.season-login-panel{
  margin:10px 24px 0!important;
  padding:12px 14px!important;
  border:1px solid rgba(255,255,255,.08)!important;
  border-radius:20px!important;
  background:rgba(18,21,29,.72)!important;
  backdrop-filter:blur(18px) saturate(150%)!important;
  -webkit-backdrop-filter:blur(18px) saturate(150%)!important;
  box-shadow:0 14px 42px rgba(0,0,0,.22)!important;
  display:flex!important;
  align-items:center!important;
  justify-content:space-between!important;
  gap:14px!important;
}
.season-login-panel-logo-row{display:flex!important;align-items:center!important;gap:10px!important;min-width:max-content!important}
.season-login-panel-logo{
  width:34px!important;height:34px!important;border-radius:12px!important;
  background:linear-gradient(135deg,rgba(255,255,255,.98),rgba(194,202,255,.92))!important;
  color:#12151d!important;display:flex!important;align-items:center!important;justify-content:center!important;
  font-size:16px!important;font-weight:950!important;box-shadow:0 10px 26px rgba(108,125,255,.22)!important;
}
.season-login-panel-brand{font-size:13px!important;font-weight:850!important;color:var(--text)!important;letter-spacing:-.02em!important}
.season-login-panel .row{align-items:center!important;gap:8px!important;flex-wrap:wrap!important;justify-content:flex-end!important}
.season-login-panel .auth-input{
  height:38px!important;min-width:150px!important;padding:0 12px!important;border-radius:12px!important;
  border:1px solid rgba(255,255,255,.09)!important;background:rgba(255,255,255,.055)!important;
  color:var(--text)!important;font-size:12px!important;font-weight:650!important;box-shadow:none!important;
}
.season-login-panel .auth-input:focus{border-color:rgba(140,153,255,.72)!important;background:rgba(108,125,255,.10)!important;box-shadow:0 0 0 4px rgba(108,125,255,.12)!important}
.season-login-panel .btn{height:38px!important;border-radius:12px!important;padding:0 14px!important;font-weight:850!important}
.season-login-panel .btn-primary{background:linear-gradient(135deg,#f7f8ff,#bfc8ff)!important;color:#111521!important;border:0!important;box-shadow:0 10px 26px rgba(108,125,255,.24)!important}
.season-login-panel .btn-ghost{background:rgba(255,255,255,.045)!important;border:1px solid rgba(255,255,255,.08)!important;color:var(--text2)!important}

.mobile-login-modal-overlay{
  background:rgba(5,7,12,.62)!important;
  backdrop-filter:blur(18px) saturate(150%)!important;
  -webkit-backdrop-filter:blur(18px) saturate(150%)!important;
}
.mobile-login-sheet{
  left:50%!important;right:auto!important;bottom:max(12px,env(safe-area-inset-bottom))!important;
  transform:translateX(-50%)!important;width:calc(100% - 24px)!important;max-width:430px!important;
  max-height:calc(100dvh - 24px)!important;overflow-y:auto!important;-webkit-overflow-scrolling:touch!important;
  border-radius:30px!important;border:1px solid rgba(255,255,255,.10)!important;
  background:linear-gradient(180deg,rgba(25,28,38,.98),rgba(15,17,24,.98))!important;
  box-shadow:0 28px 90px rgba(0,0,0,.55)!important;
  padding:0 0 max(18px,env(safe-area-inset-bottom))!important;
  animation:mloCleanIn .22s cubic-bezier(.2,.8,.2,1)!important;
}
@keyframes mloCleanIn{from{opacity:0;transform:translateX(-50%) translateY(16px) scale(.98)}to{opacity:1;transform:translateX(-50%) translateY(0) scale(1)}}
.mlo-header{
  padding:22px 22px 16px!important;background:transparent!important;border-bottom:0!important;text-align:left!important;
}
.mlo-glow{right:-90px!important;top:-90px!important;width:220px!important;height:220px!important;background:radial-gradient(circle,rgba(108,125,255,.20),transparent 68%)!important}
.mlo-handle{width:34px!important;height:4px!important;margin:0 auto 18px!important;background:rgba(255,255,255,.16)!important}
.mlo-logo-row{margin-bottom:20px!important;gap:10px!important}
.mlo-logo-mark{
  width:40px!important;height:40px!important;border-radius:14px!important;
  background:linear-gradient(135deg,#f8f9ff,#b7c2ff)!important;color:#111521!important;
  font-size:18px!important;box-shadow:0 10px 28px rgba(108,125,255,.24)!important;
}
.mlo-logo-text{font-size:15px!important;font-weight:900!important;color:var(--text)!important}
.mlo-logo-sub{font-size:11px!important;color:var(--text3)!important}
.mlo-headline{font-size:25px!important;line-height:1.18!important;letter-spacing:-.055em!important;margin-top:2px!important}
.mlo-sub{font-size:13px!important;line-height:1.55!important;color:var(--text3)!important;margin-top:9px!important}
.mlo-body{padding:4px 22px 0!important}
.mlo-field{gap:7px!important;margin-bottom:12px!important}
.mlo-field label{font-size:11px!important;letter-spacing:-.01em!important;text-transform:none!important;color:var(--text2)!important;font-weight:800!important}
.mlo-input-wrap{position:relative!important}
.mlo-input-icon{left:15px!important;font-size:14px!important;opacity:.55!important;filter:grayscale(1)!important}
.mlo-input{
  height:52px!important;padding:0 14px 0 42px!important;border-radius:16px!important;
  border:1px solid rgba(255,255,255,.09)!important;background:rgba(255,255,255,.055)!important;
  font-size:15px!important;font-weight:650!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.03)!important;
}
.mlo-input:focus{border-color:rgba(150,162,255,.76)!important;background:rgba(108,125,255,.10)!important;box-shadow:0 0 0 4px rgba(108,125,255,.13)!important}
.mlo-btn-row{gap:9px!important;margin-top:14px!important}
.mlo-btn-primary{
  height:52px!important;padding:0 16px!important;border-radius:16px!important;
  background:linear-gradient(135deg,#f7f8ff,#bec8ff)!important;color:#111521!important;
  font-size:15px!important;font-weight:950!important;box-shadow:0 14px 36px rgba(108,125,255,.27)!important;
}
.mlo-btn-secondary{
  height:48px!important;padding:0 16px!important;border-radius:16px!important;background:rgba(255,255,255,.045)!important;
  border:1px solid rgba(255,255,255,.08)!important;color:var(--text2)!important;font-size:14px!important;font-weight:850!important;
}
.mlo-divider{margin:16px 0 12px!important;font-size:11px!important;color:rgba(255,255,255,.35)!important}
.mlo-local-chip{
  padding:13px 14px!important;border-radius:16px!important;background:rgba(255,255,255,.035)!important;
  border:1px solid rgba(255,255,255,.07)!important;color:var(--text2)!important;
}
.mlo-local-icon{background:rgba(255,255,255,.06)!important;border:1px solid rgba(255,255,255,.06)!important}
.mlo-msg{border-radius:14px!important;padding:10px 12px!important;font-weight:750!important;background:rgba(255,92,114,.10)!important}
.mlo-session-bar{border-radius:18px!important;padding:14px!important;background:rgba(52,213,138,.10)!important}
.mlo-action-btn{border-radius:14px!important;padding:12px 10px!important;background:rgba(255,255,255,.045)!important}

@media(max-width:768px){
  .season-login-panel{display:none!important}
  .mobile-login-sheet{width:calc(100% - 20px)!important;bottom:max(10px,env(safe-area-inset-bottom))!important;border-radius:28px!important}
  .mlo-header{padding:20px 20px 14px!important}
  .mlo-body{padding:4px 20px 0!important}
  .mlo-headline{font-size:24px!important}
  .mlo-input,.mlo-btn-primary{height:50px!important}
}
:root[data-theme='light'] .season-login-panel{background:rgba(255,255,255,.80)!important;border-color:rgba(20,25,40,.08)!important;box-shadow:0 14px 40px rgba(20,25,40,.08)!important}
:root[data-theme='light'] .season-login-panel .auth-input{background:rgba(20,25,40,.035)!important;border-color:rgba(20,25,40,.08)!important}
:root[data-theme='light'] .mobile-login-modal-overlay{background:rgba(242,244,250,.68)!important}
:root[data-theme='light'] .mobile-login-sheet{background:linear-gradient(180deg,rgba(255,255,255,.98),rgba(247,248,252,.98))!important;border-color:rgba(20,25,40,.08)!important;box-shadow:0 28px 80px rgba(20,25,40,.18)!important}
:root[data-theme='light'] .mlo-input{background:rgba(20,25,40,.035)!important;border-color:rgba(20,25,40,.08)!important}
:root[data-theme='light'] .mlo-btn-secondary,:root[data-theme='light'] .mlo-local-chip{background:rgba(20,25,40,.035)!important;border-color:rgba(20,25,40,.08)!important}


/* DASHBOARD_QUICK_ENTRY_V1 */
.dashboard-quick-entry{
  overflow:hidden;
  border:1px solid rgba(255,255,255,.10);
  background:linear-gradient(135deg,rgba(255,255,255,.075),rgba(255,255,255,.035));
  box-shadow:0 20px 50px rgba(0,0,0,.18);
}
.dq-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:16px}
.dq-eyebrow{display:inline-flex;margin-bottom:6px;font-size:12px;font-weight:900;color:var(--accent);letter-spacing:.08em}
.dq-head h3{margin:0;font-size:20px;letter-spacing:-.02em}
.dq-head p{margin:6px 0 0;color:var(--text2);font-size:13px;line-height:1.5}
.dq-saved{flex:0 0 auto;padding:9px 12px;border-radius:999px;background:var(--green-bg);color:var(--green);font-weight:900;font-size:12px}
.dq-tabs{display:flex;gap:8px;padding:6px;border-radius:18px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.08);margin-bottom:14px}
.dq-tabs button{flex:1;border:0;border-radius:14px;padding:11px 10px;background:transparent;color:var(--text2);font-weight:850;cursor:pointer}
.dq-tabs button.active{color:#fff;box-shadow:0 12px 28px rgba(0,0,0,.20)}
.dq-tabs button.active.expense{background:linear-gradient(135deg,#ff5c72,#ff8a5c)}
.dq-tabs button.active.income{background:linear-gradient(135deg,#27c779,#5ae0a2)}
.dq-tabs button.active.split{background:linear-gradient(135deg,#6c7dff,#8f6cff)}
.dq-grid{display:grid;grid-template-columns:1.2fr .8fr 1fr 1fr 1fr 1fr auto;gap:10px;align-items:center}
.dq-amount{display:flex;align-items:center;gap:8px;min-height:48px;padding:0 14px;border-radius:16px;background:rgba(0,0,0,.18);border:1px solid rgba(255,255,255,.10)}
.dq-amount input{width:100%;min-width:0;border:0;background:transparent;color:var(--text);font-size:22px;font-weight:950;outline:0}
.dq-amount span{color:var(--text3);font-size:13px;font-weight:900}
.dq-input,.dq-split-rows input,.dq-split-rows select{height:48px;border-radius:16px;border:1px solid rgba(255,255,255,.10);background:rgba(255,255,255,.055);color:var(--text);padding:0 12px;font-weight:750;outline:0;min-width:0}
.dq-input:focus,.dq-split-rows input:focus,.dq-split-rows select:focus{border-color:rgba(108,125,255,.75);box-shadow:0 0 0 4px rgba(108,125,255,.12)}
.dq-wide{min-width:160px}
.dq-save{height:48px;border:0;border-radius:16px;padding:0 18px;color:#fff;font-weight:950;cursor:pointer;white-space:nowrap;box-shadow:0 16px 32px rgba(0,0,0,.18)}
.dq-save.expense{background:linear-gradient(135deg,#ff5c72,#ff8a5c)}
.dq-save.income{background:linear-gradient(135deg,#27c779,#5ae0a2)}
.dq-save.split{background:linear-gradient(135deg,#6c7dff,#8f6cff)}
.dq-save:disabled{opacity:.42;cursor:not-allowed;filter:grayscale(.25);box-shadow:none}
.dq-split{display:flex;flex-direction:column;gap:12px}
.dq-split-top{display:grid;grid-template-columns:1.2fr .8fr;gap:10px}
.dq-split-rows{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.dq-split-rows label{display:grid;grid-template-columns:76px 1fr 1fr;gap:8px;align-items:center;padding:10px;border-radius:18px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.07)}
.dq-split-rows label span{font-size:12px;font-weight:900;color:var(--text2)}
.dq-split-foot{display:flex;align-items:center;justify-content:flex-end;gap:14px;padding-top:2px;color:var(--text2);font-size:13px;font-weight:800}
.dq-split-foot b{color:inherit}
:root[data-theme='light'] .dashboard-quick-entry{background:linear-gradient(135deg,rgba(255,255,255,.96),rgba(246,248,252,.94));border-color:rgba(20,25,40,.08);box-shadow:0 16px 40px rgba(20,25,40,.08)}
:root[data-theme='light'] .dq-tabs,:root[data-theme='light'] .dq-split-rows label{background:rgba(20,25,40,.035);border-color:rgba(20,25,40,.07)}
:root[data-theme='light'] .dq-amount{background:rgba(20,25,40,.04);border-color:rgba(20,25,40,.08)}
:root[data-theme='light'] .dq-input,:root[data-theme='light'] .dq-split-rows input,:root[data-theme='light'] .dq-split-rows select{background:rgba(20,25,40,.035);border-color:rgba(20,25,40,.08)}
@media(max-width:1180px){.dq-grid{grid-template-columns:1fr 1fr}.dq-wide{min-width:0}.dq-save{grid-column:1/-1}.dq-split-rows{grid-template-columns:1fr}}
@media(max-width:768px){
  .dashboard-quick-entry{padding:16px!important;border-radius:24px!important}
  .dq-head{flex-direction:column;gap:10px;margin-bottom:12px}
  .dq-head h3{font-size:18px}.dq-head p{font-size:12px}
  .dq-tabs{overflow-x:auto}.dq-tabs button{min-width:96px}
  .dq-grid,.dq-split-top{grid-template-columns:1fr;gap:9px}
  .dq-amount{height:54px}.dq-amount input{font-size:24px}
  .dq-input{width:100%}
  .dq-split-rows label{grid-template-columns:1fr;gap:7px;padding:12px}
  .dq-split-foot{flex-direction:column;align-items:stretch;gap:8px}.dq-split-foot .dq-save{width:100%}
}


/* DASHBOARD_QUICK_ENTRY_COMPACT_V2 */
.dashboard-quick-entry.compact{padding:22px!important;border-radius:28px!important;overflow:hidden!important}
.dashboard-quick-entry.compact .dq-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:18px}
.dq-all-btn,.dq-detail-link{border:1px solid rgba(255,255,255,.10);background:rgba(255,255,255,.065);color:var(--text);border-radius:16px;padding:11px 14px;font-weight:900;cursor:pointer;white-space:nowrap;transition:transform .16s ease,background .16s ease,border-color .16s ease}
.dq-all-btn:hover,.dq-detail-link:hover{transform:translateY(-1px);background:rgba(255,255,255,.10);border-color:rgba(255,255,255,.18)}
.dq-action-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
.dq-action-card{position:relative;min-height:132px;text-align:left;border:1px solid rgba(255,255,255,.10);border-radius:24px;padding:18px;overflow:hidden;background:rgba(255,255,255,.045);color:var(--text);cursor:pointer;box-shadow:0 18px 40px rgba(0,0,0,.14);transition:transform .18s ease,border-color .18s ease,box-shadow .18s ease}
.dq-action-card:before{content:"";position:absolute;inset:auto -28px -46px auto;width:120px;height:120px;border-radius:999px;background:rgba(255,255,255,.10);filter:blur(.2px)}
.dq-action-card:hover{transform:translateY(-2px);border-color:rgba(255,255,255,.22);box-shadow:0 24px 54px rgba(0,0,0,.20)}
.dq-action-card.expense{background:linear-gradient(135deg,rgba(255,92,114,.18),rgba(255,138,92,.075))}
.dq-action-card.income{background:linear-gradient(135deg,rgba(39,199,121,.18),rgba(90,224,162,.075))}
.dq-action-card.split{background:linear-gradient(135deg,rgba(108,125,255,.20),rgba(143,108,255,.08))}
.dq-action-icon{display:inline-flex;width:42px;height:42px;border-radius:16px;align-items:center;justify-content:center;background:rgba(255,255,255,.09);font-size:22px;margin-bottom:12px}
.dq-action-card strong{display:block;font-size:17px;letter-spacing:-.02em;margin-bottom:6px}
.dq-action-card em{display:block;font-style:normal;color:var(--text2);font-size:12px;font-weight:800;line-height:1.45;margin-bottom:12px}
.dq-action-card b{display:inline-flex;position:relative;z-index:1;font-size:12px;color:#fff;padding:7px 10px;border-radius:999px;background:rgba(255,255,255,.11);border:1px solid rgba(255,255,255,.10)}
.dq-mini-footer{display:flex;justify-content:space-between;align-items:center;gap:14px;margin-top:14px;padding:13px 14px;border-radius:20px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.07)}
.dq-mini-footer span{display:block;font-size:12px;font-weight:950;color:var(--text2);margin-bottom:4px}.dq-mini-footer p{margin:0;color:var(--text3);font-size:12px;font-weight:750;line-height:1.4}.dq-detail-link{padding:9px 12px;font-size:12px}
:root[data-theme='light'] .dq-all-btn,:root[data-theme='light'] .dq-detail-link,:root[data-theme='light'] .dq-action-card,:root[data-theme='light'] .dq-mini-footer{background:rgba(20,25,40,.035);border-color:rgba(20,25,40,.08);box-shadow:0 14px 32px rgba(20,25,40,.07)}
:root[data-theme='light'] .dq-action-card b{color:var(--text);background:rgba(20,25,40,.055);border-color:rgba(20,25,40,.08)}
@media(max-width:900px){.dq-action-grid{grid-template-columns:1fr}.dashboard-quick-entry.compact .dq-head{flex-direction:column}.dq-all-btn{width:100%}.dq-action-card{min-height:116px}.dq-mini-footer{align-items:flex-start;flex-direction:column}.dq-detail-link{width:100%}}

`;
