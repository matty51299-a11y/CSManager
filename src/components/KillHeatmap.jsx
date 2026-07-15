import { useMemo, useState } from 'react';
import { crestHue } from '../utils/fmDerive';
import { CHART } from './charts/palette';

// Deterministic 0..1 pseudo-random from a seed string.
function rand(seed) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

// Build placeholder kill positions from per-player kill counts. Real match
// generation does not track coordinates, so positions are seeded per kill —
// stable per map/player, consistent with the procedural asset approach.
function buildEvents(map) {
  const events = [];
  const add = (players, side) => {
    (players || []).forEach((p) => {
      for (let i = 0; i < (p.kills || 0); i += 1) {
        const x = 0.08 + rand(`${map.mapKey}-${p.playerId}-x-${i}`) * 0.84;
        const y = 0.1 + rand(`${map.mapKey}-${p.playerId}-y-${i}`) * 0.8;
        events.push({ x, y, side, playerId: p.playerId, gamertag: p.gamertag });
      }
    });
  };
  add(map.teamAStats, 'A');
  add(map.teamBStats, 'B');
  return events;
}

export default function KillHeatmap({ map, teamA, teamB }) {
  const [side, setSide] = useState('both');
  const [playerId, setPlayerId] = useState('all');

  const events = useMemo(() => buildEvents(map), [map]);
  const roster = useMemo(() => {
    const seen = new Map();
    events.forEach((e) => { if (!seen.has(e.playerId)) seen.set(e.playerId, { playerId: e.playerId, gamertag: e.gamertag, side: e.side }); });
    return [...seen.values()];
  }, [events]);

  const shown = events.filter((e) => (side === 'both' || e.side === side) && (playerId === 'all' || e.playerId === playerId));
  const hue = crestHue(map.mapKey || map.mapName || 'map');
  const bg = { background: `linear-gradient(150deg, hsl(${hue} 34% 20%), hsl(${(hue + 50) % 360} 40% 9%))` };

  return (
    <div className="heatmap">
      <div className="heatmap-controls">
        <label>Side
          <select value={side} onChange={(e) => setSide(e.target.value)}>
            <option value="both">Both Teams</option>
            <option value="A">{teamA?.shortName || 'Team A'}</option>
            <option value="B">{teamB?.shortName || 'Team B'}</option>
          </select>
        </label>
        <label>Player
          <select value={playerId} onChange={(e) => setPlayerId(e.target.value)}>
            <option value="all">All Players</option>
            {roster.map((r) => <option key={r.playerId} value={r.playerId}>{r.gamertag}</option>)}
          </select>
        </label>
        <span className="heatmap-count">{shown.length} kills</span>
      </div>
      <div className="heatmap-canvas" style={bg}>
        <svg className="heatmap-layout" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <rect x="14" y="12" width="26" height="20" rx="2" />
          <rect x="60" y="16" width="24" height="20" rx="2" />
          <rect x="40" y="60" width="26" height="22" rx="2" />
          <path d="M27 32 L27 55 L52 60" />
          <path d="M72 36 L72 58 L60 66" />
          <path d="M40 46 L60 46" />
          <text x="27" y="24" className="heatmap-site">A</text>
          <text x="72" y="28" className="heatmap-site">B</text>
        </svg>
        {shown.map((e, i) => (
          <span
            key={i}
            className={`heatmap-dot dot-${e.side}`}
            style={{ left: `${e.x * 100}%`, top: `${e.y * 100}%`, background: e.side === 'A' ? CHART.teamA : CHART.teamB }}
            title={e.gamertag}
          />
        ))}
      </div>
      <div className="chart-legend" style={{ marginTop: 8 }}>
        <span><i style={{ background: CHART.teamA, borderRadius: '50%', width: 10, height: 10 }} />{teamA?.shortName || 'Team A'} kills</span>
        <span><i style={{ background: CHART.teamB, borderRadius: '50%', width: 10, height: 10 }} />{teamB?.shortName || 'Team B'} kills</span>
      </div>
    </div>
  );
}
