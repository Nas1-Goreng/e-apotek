import { fmtNum } from '../lib/format.js';

const short = (n) => {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1).replace('.', ',')} jt`;
  if (n >= 1e3) return `${Math.round(n / 1e3)} rb`;
  return String(n);
};

function HatchDefs({ id }) {
  return (
    <defs>
      <pattern id={id} patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
        <rect width="8" height="8" fill="#e4f7ea" />
        <rect width="3.5" height="8" fill="#17613a" />
      </pattern>
    </defs>
  );
}

// data: [{ label, value, open }]. Batang bergaris miring menandai hari yang belum selesai.
export function BarChart({ data, title, valueName = 'Penjualan', money = true }) {
  const W = 560, H = 230, top = 28, bottom = 34, pad = 8;
  const max = Math.max(1, ...data.map((d) => d.value));
  const band = (W - pad * 2) / data.length;
  const bw = Math.min(56, band * 0.58);
  const plotH = H - top - bottom;
  const fmt = (n) => (money ? short(n) : fmtNum(n));
  const summary = `${title}. ${data.map((d) => `${d.label}: ${money ? `Rp ${fmtNum(d.value)}` : fmtNum(d.value)}`).join('; ')}.`;

  return (
    <>
      <svg className="chart-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={summary}>
        <HatchDefs id="hatch-bar" />
        <line x1={pad} x2={W - pad} y1={H - bottom} y2={H - bottom} stroke="#5e7a6b" strokeWidth="1.5" />
        {data.map((d, i) => {
          const h = d.value > 0 ? Math.max(4, (d.value / max) * plotH) : 0;
          const x = pad + band * i + (band - bw) / 2;
          const y = H - bottom - h;
          return (
            <g key={d.label + i}>
              {h > 0 && (
                <rect x={x} y={y} width={bw} height={h} rx="6"
                  fill={d.open ? 'url(#hatch-bar)' : '#1f7a48'} stroke="#17613a" strokeWidth={d.open ? 1.5 : 0} />
              )}
              {h > 0 && <text x={x + bw / 2} y={y - 7} textAnchor="middle" fontSize="13" fontWeight="700" fill="#12261b">{fmt(d.value)}</text>}
              {h === 0 && <text x={x + bw / 2} y={H - bottom - 8} textAnchor="middle" fontSize="12" fill="#4a5f53">0</text>}
              <text x={x + bw / 2} y={H - 11} textAnchor="middle" fontSize="13" fontWeight={d.open ? 800 : 600} fill="#12261b">{d.label}</text>
            </g>
          );
        })}
      </svg>
      <table className="sr-only">
        <caption>{title}</caption>
        <thead><tr><th>Hari</th><th>{valueName}</th></tr></thead>
        <tbody>{data.map((d, i) => <tr key={i}><td>{d.label}</td><td>{money ? `Rp ${fmtNum(d.value)}` : fmtNum(d.value)}</td></tr>)}</tbody>
      </table>
    </>
  );
}

export function Gauge({ safe, total, label }) {
  const pct = total > 0 ? (safe / total) * 100 : 0;
  const arc = 'M30 120 A90 90 0 0 1 210 120';
  return (
    <div className="gauge-wrap">
      <svg viewBox="0 0 240 130" width="260" role="img" aria-label={`${safe} dari ${total} obat ${label}`}>
        <HatchDefs id="hatch-gauge" />
        <path d={arc} fill="none" stroke="url(#hatch-gauge)" strokeWidth="28" />
        <path d={arc} fill="none" stroke="#1f7a48" strokeWidth="28" pathLength="100" strokeDasharray={`${pct} ${100 - pct}`} />
        <path d="M16 120 A104 104 0 0 1 224 120 M44 120 A76 76 0 0 1 196 120" fill="none" stroke="#17613a" strokeWidth="1.5" />
      </svg>
      <div className="gauge-center">
        <strong>{safe}/{total}</strong>
        <span className="muted">obat {label}</span>
      </div>
    </div>
  );
}
