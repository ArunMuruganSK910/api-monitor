import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import "./App.css";

const API = "https://api-monitor-v9hg.onrender.com";

const HISTORY_BARS = [90,120,100,85,200,95,110,88,130,95,90,105,92,88,95,100,90,95,null,90,88,100,92,110];

export default function App() {
  const [monitors, setMonitors]       = useState([]);
  const [showAdd, setShowAdd]         = useState(false);
  const [showHistory, setShowHistory] = useState(null);
  const [history, setHistory]         = useState([]);
  const [newName, setNewName]         = useState("");
  const [newUrl, setNewUrl]           = useState("");
  const [checkedIds, setCheckedIds]   = useState({});

  const fetchMonitors = () =>
    fetch(`${API}/monitors`)
      .then(r => r.json())
      .then(d => setMonitors(d.monitors || []));

  useEffect(() => {
    fetchMonitors();
    const t = setInterval(fetchMonitors, 30000);
    return () => clearInterval(t);
  }, []);

  const addMonitor = () => {
    if (!newName || !newUrl) return;
    fetch(`${API}/monitors`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, url: newUrl }),
    }).then(() => {
      fetchMonitors();
      setShowAdd(false);
      setNewName("");
      setNewUrl("");
    });
  };

  const deleteMonitor = (id, e) => {
    e.stopPropagation();
    fetch(`${API}/monitors/${id}`, { method: "DELETE" }).then(fetchMonitors);
  };

  const manualCheck = (id, e) => {
    e.stopPropagation();
    fetch(`${API}/monitors/${id}/check`, { method: "POST" }).then(() => {
      setCheckedIds(p => ({ ...p, [id]: true }));
      setTimeout(() => setCheckedIds(p => ({ ...p, [id]: false })), 2000);
      fetchMonitors();
    });
  };

  const openHistory = (mon) => {
    setShowHistory(mon);
    fetch(`${API}/monitors/${mon.id}/checks`)
      .then(r => r.json())
      .then(d => setHistory(d.checks || []));
  };

  const total     = monitors.length;
  const upCount   = monitors.filter(m => m.is_up).length;
  const downCount = monitors.filter(m => !m.is_up).length;
  const avgUptime = total
    ? Math.round(monitors.reduce((s, m) => s + (m.uptime_percent || 0), 0) / total)
    : 0;

  const tickerText = monitors.length
    ? monitors.map(m =>
        `${m.name.toUpperCase()} — ${Math.round(m.uptime_percent || 0)}% UPTIME${!m.is_up ? " — DOWN" : ""}`
      ).join("  ✦  ")
    : "NO MONITORS YET  ✦  ADD YOUR FIRST ENDPOINT";

  const tickerFull = tickerText + "  ✦  " + tickerText + "  ✦  ";

  return (
    <div className="app">

      {/* HEADER */}
      <motion.div className="header"
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="logo-block">
          <div className="logo-title">API Monitor</div>
          <div className="logo-sub">Uptime Intelligence System</div>
        </div>
        <div className="header-right">
          <div className="live-pill"><div className="live-dot" /> System Live</div>
          <button className="add-btn" onClick={() => setShowAdd(true)}>+ Add Endpoint</button>
        </div>
      </motion.div>

      {/* TICKER */}
      <div className="ticker-wrap">
        <span className="ticker-inner">{tickerFull}</span>
      </div>

      {/* STATS */}
      <div className="stats-grid">
        {[
          { cls: "total", label: "Total",     value: total,           mini: "Endpoints"  },
          { cls: "up",    label: "Online",    value: upCount,         mini: "Responding" },
          { cls: "down",  label: "Down",      value: downCount,       mini: "Failing"    },
          { cls: "avg",   label: "Avg Uptime",value: `${avgUptime}%`, mini: "24 Hours"   },
        ].map((s, i) => (
          <motion.div key={s.cls} className={`stat-card ${s.cls}`}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.35 }}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-mini">{s.mini}</div>
          </motion.div>
        ))}
      </div>

      {/* MONITORS */}
      <div className="monitors-title">Active Monitors</div>
      <div className="monitor-list">
        <AnimatePresence>
          {monitors.map((mon, i) => {
            const isUp   = mon.is_up;
            const uptime = Math.round(mon.uptime_percent || 0);
            const respMs = mon.response_time ? Math.round(mon.response_time) : null;
            return (
              <motion.div key={mon.id} className="monitor-row"
                onClick={() => openHistory(mon)}
                initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }} transition={{ delay: i * 0.07 }}>
                <div className="status-col">
                  <div className={`status-box ${isUp ? "up" : "down"}`} />
                </div>
                <div className="monitor-info">
                  <div className="monitor-name">{mon.name}</div>
                  <div className="monitor-url">{mon.url}</div>
                </div>
                <div className="uptime-col">
                  <div className={`uptime-num ${isUp ? "up" : "down"}`}>{uptime}%</div>
                  <div className="uptime-track">
                    <div className={`uptime-fill ${isUp ? "up" : "down"}`} style={{ width: `${uptime}%` }} />
                  </div>
                </div>
                <div className="resp-col">
                  <div className="resp-num">{respMs ?? "—"}</div>
                  <span className="resp-unit">{respMs ? "ms" : "timeout"}</span>
                </div>
                <div className="tag-col">
                  <span className={`tag ${isUp ? "up" : "down"}`}>{isUp ? "Online" : "Down"}</span>
                </div>
                <div className="action-col" style={{ gap: "4px", display: "flex" }}>
                  <button className={`check-btn ${checkedIds[mon.id] ? "done" : ""}`}
                    onClick={e => manualCheck(mon.id, e)}>
                    {checkedIds[mon.id] ? "✓" : "↻"}
                  </button>
                  <button className="delete-btn" onClick={e => deleteMonitor(mon.id, e)}>✕</button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {monitors.length === 0 && (
          <div style={{ padding: "32px", textAlign: "center", opacity: 0.4, fontSize: "13px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            No monitors yet — add your first endpoint
          </div>
        )}
      </div>

      {/* BOTTOM ROW */}
      <div className="bottom-row">
        <motion.div className="info-block"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <div className="info-block-title">System Info</div>
          <div className="mini-row"><span className="mini-label">Check Interval</span><span className="mini-val">5 min</span></div>
          <div className="mini-row"><span className="mini-label">Total Monitors</span><span className="mini-val">{total}</span></div>
          <div className="mini-row"><span className="mini-label">Online</span><span className="mini-val">{upCount}</span></div>
          <div className="mini-row"><span className="mini-label">Down</span><span className="mini-val">{downCount}</span></div>
          <div className="mini-row"><span className="mini-label">Avg Uptime</span><span className="mini-val">{avgUptime}%</span></div>
        </motion.div>

        <motion.div className="graph-block"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <div className="graph-block-title">Response History</div>
          <div className="bars">
            {HISTORY_BARS.map((v, i) => (
              <div key={i} className={`bar ${v === null ? "down" : ""}`}
                style={{ height: v ? `${Math.round((v / 200) * 100)}%` : "35%" }} />
            ))}
          </div>
        </motion.div>
      </div>

      {/* ADD MODAL */}
      <AnimatePresence>
        {showAdd && (
          <motion.div className="modal-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowAdd(false)}>
            <motion.div className="modal"
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              onClick={e => e.stopPropagation()}>
              <div className="modal-title">Add Endpoint</div>
              <div className="modal-field">
                <label>Name</label>
                <input placeholder="e.g. My API" value={newName} onChange={e => setNewName(e.target.value)} />
              </div>
              <div className="modal-field">
                <label>URL</label>
                <input placeholder="https://..." value={newUrl} onChange={e => setNewUrl(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addMonitor()} />
              </div>
              <div className="modal-btns">
                <button className="modal-cancel" onClick={() => setShowAdd(false)}>Cancel</button>
                <button className="modal-submit" onClick={addMonitor}>Add Monitor</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HISTORY MODAL */}
      <AnimatePresence>
        {showHistory && (
          <motion.div className="modal-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowHistory(null)}>
            <motion.div className="modal"
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              onClick={e => e.stopPropagation()}>
              <div className="modal-title">{showHistory.name} — History</div>
              <div className="history-list">
                {history.length === 0 && (
                  <div style={{ opacity: 0.4, fontSize: 12, textAlign: "center", padding: "20px 0" }}>
                    No checks yet
                  </div>
                )}
                {history.slice(0, 20).map((h, i) => (
                  <div key={i} className="history-item">
                    <div className={`h-dot ${h.is_up ? "up" : "down"}`} />
                    <div className="h-time">{new Date(h.checked_at).toLocaleTimeString()}</div>
                    <div className="h-ms">{h.response_time ? `${Math.round(h.response_time)}ms` : "—"}</div>
                    <div className={`h-status ${h.is_up ? "up" : "down"}`}>{h.is_up ? "up" : "down"}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}