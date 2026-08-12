import { useState, useMemo, Component } from "react";
import { usePrograms, useKegiatan, useSubKegiatan } from "../hooks/useSupabase";
import { formatAnggaranShort } from "../data/initialData";
import { Loader2, ZoomIn, ZoomOut, Maximize2, ChevronDown, ChevronRight } from "lucide-react";

/* ─── Color per level ─── */
const C = {
  program:     { bg: "#e8f5e9", border: "#43a047", text: "#1b4d1e", chip: "#43a047", chipText: "#fff" },
  kegiatan:    { bg: "#e3f2fd", border: "#1976d2", text: "#0d2a4f", chip: "#1976d2", chipText: "#fff" },
  subKegiatan: { bg: "#fce4ec", border: "#e91e63", text: "#560018", chip: "#e91e63", chipText: "#fff" },
};

const H = 28;
const VG = 14;

/* ─── Error Boundary ─── */
class ErrBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false, msg: "" }; }
  static getDerivedStateFromError(err) { return { hasError: true, msg: err.message }; }
  render() {
    if (this.state.hasError) return (
      <div style={{ padding: 40, textAlign: "center", color: "#e53935" }}>
        <h3>Terjadi kesalahan saat merender bagan</h3>
        <p style={{ fontSize: "0.85rem", color: "#94a3b8" }}>{this.state.msg}</p>
      </div>
    );
    return this.props.children;
  }
}

/* ─── Node box ─── */
function Node({ label, sub, color, badge, onClick, collapsed }) {
  if (!color) return null;
  return (
    <div
      onClick={onClick}
      title={label}
      style={{
        background: color.bg, border: "2px solid " + color.border,
        borderRadius: 6, padding: "8px 12px",
        minWidth: 155, maxWidth: 195,
        cursor: onClick ? "pointer" : "default",
        transition: "box-shadow 0.18s, transform 0.15s",
        boxShadow: "0 2px 6px rgba(0,0,0,0.13)",
        userSelect: "none", position: "relative", flexShrink: 0,
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.22)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.13)"; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      {badge > 0 && (
        <span style={{
          position: "absolute", top: -9, right: -9,
          background: color.chip, color: color.chipText,
          borderRadius: "50%", fontSize: "0.62rem", fontWeight: 800,
          width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 1px 4px rgba(0,0,0,0.22)",
        }}>{badge}</span>
      )}
      {onClick && (
        <span style={{ position: "absolute", top: 4, right: 4, color: color.border, opacity: 0.7 }}>
          {collapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
        </span>
      )}
      <div style={{ fontSize: "0.78rem", fontWeight: 700, color: color.text, lineHeight: 1.35, wordBreak: "break-word" }}>
        {label || "-"}
      </div>
      {sub && (
        <div style={{ fontSize: "0.67rem", color: color.text, opacity: 0.55, marginTop: 4, wordBreak: "break-word" }}>
          {sub}
        </div>
      )}
    </div>
  );
}

/* ─── Vertical spine connector ─── */
function Spine({ borderColor, children }) {
  return (
    <div style={{ position: "relative" }}>
      <div style={{
        position: "absolute", left: 0,
        top: VG / 2 + 22, bottom: VG / 2 + 22,
        width: 2, background: borderColor,
      }} />
      <div style={{ display: "flex", flexDirection: "column" }}>{children}</div>
    </div>
  );
}

/* ─── Sub Kegiatan leaf row ─── */
function SKRow({ sk }) {
  if (!sk) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: VG }}>
      <div style={{ width: H, borderTop: "2px solid " + C.subKegiatan.border, flexShrink: 0 }} />
      <Node
        label={sk.nama}
        sub={sk.anggaran ? formatAnggaranShort(sk.anggaran) : undefined}
        color={C.subKegiatan}
      />
    </div>
  );
}

/* ─── Kegiatan row ─── */
function KegRow({ keg, skList, collapsed, onToggle }) {
  if (!keg) return null;
  const has = Array.isArray(skList) && skList.length > 0;
  return (
    <div style={{ display: "flex", alignItems: "flex-start", marginBottom: VG }}>
      <div style={{ width: H, borderTop: "2px solid " + C.kegiatan.border, flexShrink: 0, marginTop: 22 }} />
      <Node
        label={keg.nama}
        sub={keg.anggaran ? formatAnggaranShort(keg.anggaran) : undefined}
        color={C.kegiatan} badge={skList.length}
        onClick={has ? onToggle : undefined}
        collapsed={collapsed}
      />
      {has && !collapsed && (
        <>
          <div style={{ width: H, borderTop: "2px solid " + C.subKegiatan.border, flexShrink: 0, marginTop: 22 }} />
          <Spine borderColor={C.subKegiatan.border}>
            {skList.map(sk => <SKRow key={sk.id} sk={sk} />)}
          </Spine>
        </>
      )}
    </div>
  );
}

/* ─── MAIN INNER COMPONENT ─── */
function BaganPohonInner() {
  const { programs = [],    loading: lProg } = usePrograms();
  const { kegiatan = [],    loading: lKeg } = useKegiatan();
  const { subKegiatan = [], loading: lSub } = useSubKegiatan();
  const loading = lProg || lKeg || lSub;

  const [zoom, setZoom] = useState(1);
  const [cMap, setCMap] = useState({});

  const expandAll   = () => { setCMap({}); };
  const collapseAll = () => {
    const m = {};
    programs.forEach(p => { m["prog_" + p.id] = true; });
    setCMap(m);
  };
  const toggleMap = key => setCMap(prev => ({ ...prev, [key]: !prev[key] }));

  const stats = useMemo(() => ({
    program:     programs.length,
    kegiatan:    kegiatan.length,
    subKegiatan: subKegiatan.length,
  }), [programs, kegiatan, subKegiatan]);

  const STAT_ITEMS = [
    { label: "Program Utama", val: stats.program,     color: C.program.border },
    { label: "Kegiatan",      val: stats.kegiatan,    color: C.kegiatan.border },
    { label: "Sub Keg.",      val: stats.subKegiatan, color: C.subKegiatan.border },
  ];

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="page-header-actions" style={{ marginBottom: 20 }}>
        <div className="page-header">
          <h1>Bagan Pohon Kinerja</h1>
          <p>Hierarki Program (Utama) &rarr; Kegiatan &rarr; Sub Kegiatan</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <button className="btn btn-outline" onClick={expandAll}   style={{ fontSize: "0.8rem" }}>Buka Semua</button>
          <button className="btn btn-outline" onClick={collapseAll} style={{ fontSize: "0.8rem" }}>Tutup Semua</button>
          <button className="btn btn-outline" onClick={() => setZoom(z => Math.min(z + 0.1, 2.5))} style={{ padding: "6px 10px" }} title="Zoom In"><ZoomIn size={16} /></button>
          <button className="btn btn-outline" onClick={() => setZoom(z => Math.max(z - 0.1, 0.3))} style={{ padding: "6px 10px" }} title="Zoom Out"><ZoomOut size={16} /></button>
          <button className="btn btn-outline" onClick={() => setZoom(1)} style={{ padding: "6px 10px" }} title="Reset"><Maximize2 size={16} /></button>
          <span style={{ fontSize: "0.75rem", color: "#94a3b8", minWidth: 40, textAlign: "center" }}>{Math.round(zoom * 100)}%</span>
        </div>
      </div>

      {/* Legend + Stats */}
      <div style={{
        background: "var(--bg-card)", border: "1px solid var(--border-light)",
        borderRadius: "var(--radius-md)", padding: "12px 20px",
        display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center",
        marginBottom: 16,
      }}>
        {Object.entries(C).map(([key, c]) => (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 13, height: 13, borderRadius: 3, background: c.bg, border: "2px solid " + c.border }} />
            <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-primary)" }}>
              {key === "subKegiatan" ? "Sub Kegiatan" : key.charAt(0).toUpperCase() + key.slice(1)}
            </span>
          </div>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", gap: 24 }}>
          {STAT_ITEMS.map(({ label, val, color }) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "1.25rem", fontWeight: 800, color }}>{val}</div>
              <div style={{ fontSize: "0.68rem", color: "var(--text-secondary)", fontWeight: 600 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tree Canvas */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{
          overflowX: "auto", overflowY: "auto",
          maxHeight: "calc(100vh - 280px)",
          padding: "36px 32px",
          background: "repeating-linear-gradient(0deg,transparent,transparent 23px,rgba(0,0,0,0.018) 24px),repeating-linear-gradient(90deg,transparent,transparent 23px,rgba(0,0,0,0.018) 24px)",
        }}>
          {loading ? (
            <div style={{ padding: 60, textAlign: "center", color: "#64748b" }}>
              <Loader2 className="animate-spin" size={36} style={{ margin: "0 auto 16px auto" }} />
              <h3>Memuat bagan pohon...</h3>
            </div>
          ) : programs.length === 0 ? (
            <div style={{ padding: 60, textAlign: "center", color: "#94a3b8" }}>
              <div style={{ fontSize: "3rem", marginBottom: 16 }}>🌳</div>
              <h3>Belum ada data program di database</h3>
            </div>
          ) : (
            <div style={{
              transform: "scale(" + zoom + ")",
              transformOrigin: "top left",
              transition: "transform 0.25s ease",
              display: "inline-flex",
              flexDirection: "column",
              gap: VG * 4,
              minWidth: "max-content",
            }}>
              {programs.map(prog => {
                if (!prog || prog.id === undefined) return null;
                const pId = String(prog.id);
                const myKeg = kegiatan.filter(k => k && String(k.programId) === pId);
                const isCollapsed = !!cMap["prog_" + pId];

                return (
                  <div key={pId} style={{ display: "flex", alignItems: "flex-start" }}>
                    <Node
                      label={prog.nama}
                      sub={prog.anggaranPagu ? formatAnggaranShort(prog.anggaranPagu) : undefined}
                      color={C.program}
                      badge={myKeg.length}
                      onClick={myKeg.length > 0 ? () => toggleMap("prog_" + pId) : undefined}
                      collapsed={isCollapsed}
                    />

                    {myKeg.length > 0 && !isCollapsed && (
                      <>
                        <div style={{ width: H, borderTop: "2px solid " + C.kegiatan.border, flexShrink: 0, marginTop: 22 }} />
                        <Spine borderColor={C.kegiatan.border}>
                          {myKeg.map(keg => {
                            const mySK = subKegiatan.filter(s => s && String(s.kegiatanId) === String(keg.id));
                            return (
                              <KegRow
                                key={keg.id}
                                keg={keg}
                                skList={mySK}
                                collapsed={!!cMap["keg_" + keg.id]}
                                onToggle={() => toggleMap("keg_" + keg.id)}
                              />
                            );
                          })}
                        </Spine>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Tips */}
      <div style={{ marginTop: 10, fontSize: "0.73rem", color: "#94a3b8", display: "flex", gap: 20, flexWrap: "wrap" }}>
        <span>💡 Klik node untuk buka/tutup cabang</span>
        <span>🔍 Gunakan +/- untuk zoom</span>
        <span>🖱️ Scroll horizontal untuk melihat seluruh bagan</span>
      </div>
    </div>
  );
}

export default function BaganPohon() {
  return (
    <ErrBoundary>
      <BaganPohonInner />
    </ErrBoundary>
  );
}
