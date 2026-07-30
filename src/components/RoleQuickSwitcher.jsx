import { useApp } from "../context/AppContext";
import { ACCOUNT_PRESETS } from "../data/initialData";
import { UserCheck, Sparkles } from "lucide-react";

export default function RoleQuickSwitcher() {
  const { state, dispatch } = useApp();
  const currentUser = state.currentUser || ACCOUNT_PRESETS[0];

  const handleSelectRole = (acc) => {
    dispatch({
      type: "SET_USER",
      payload: acc,
    });
  };

  return (
    <div style={{
      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
      borderRadius: "12px",
      padding: "14px 20px",
      color: "#ffffff",
      marginBottom: "24px",
      boxShadow: "0 8px 20px rgba(15, 23, 42, 0.15)",
      display: "flex",
      flexDirection: "column",
      gap: "12px",
    }}>
      {/* Header Info */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "34px", height: "34px", borderRadius: "8px",
            background: "rgba(255, 255, 255, 0.12)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#38bdf8"
          }}>
            <UserCheck size={20} />
          </div>
          <div>
            <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "#f8fafc", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>Pengguna Aktif: <strong>{currentUser.nama}</strong></span>
              <span style={{
                padding: "2px 10px",
                borderRadius: "12px",
                fontSize: "0.7rem",
                fontWeight: 800,
                background: currentUser.roleKey === "admin" ? "#9333ea" : currentUser.roleKey === "kadin" ? "#0284c7" : "#16a34a",
                color: "#ffffff",
              }}>
                {currentUser.badgeText || currentUser.role}
              </span>
            </div>
            <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "2px" }}>
              Akses Scope: <strong style={{ color: "#38bdf8" }}>{currentUser.bidang === "Semua" ? "Seluruh Bidang Kesehatan" : `Bidang ${currentUser.bidang}`}</strong> — {currentUser.deskripsi}
            </div>
          </div>
        </div>

        <div style={{ fontSize: "0.72rem", color: "#cbd5e1", display: "flex", alignItems: "center", gap: "4px", background: "rgba(255,255,255,0.08)", padding: "4px 10px", borderRadius: "6px" }}>
          <Sparkles size={14} style={{ color: "#f59e0b" }} /> Klik tombol role di bawah untuk berganti akun secara instan!
        </div>
      </div>

      {/* Interactive Role Switcher Pills */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", marginRight: "4px" }}>Simulasi Switch Role:</span>
        {ACCOUNT_PRESETS.map((acc) => {
          const isActive = currentUser.roleKey === acc.roleKey;
          return (
            <button
              key={acc.id}
              onClick={() => handleSelectRole(acc)}
              style={{
                padding: "6px 14px",
                borderRadius: "8px",
                fontSize: "0.78rem",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s ease",
                border: isActive ? "2px solid #38bdf8" : "1px solid rgba(255, 255, 255, 0.15)",
                background: isActive ? "rgba(56, 189, 248, 0.2)" : "rgba(255, 255, 255, 0.05)",
                color: isActive ? "#ffffff" : "#cbd5e1",
                boxShadow: isActive ? "0 0 12px rgba(56, 189, 248, 0.3)" : "none",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>{acc.roleKey === "admin" ? "👑" : acc.roleKey === "kadin" ? "👔" : "📍"}</span>
              <span>{acc.badgeText}</span>
              {isActive && <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#38bdf8" }} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
