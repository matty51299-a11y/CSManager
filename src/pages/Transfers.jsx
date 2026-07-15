import { Link } from 'react-router-dom';
import { formatMoney } from '../utils/helpers';
import { PlayerAvatar, NatChip } from '../components/fm';
import Sparkline from '../components/charts/Sparkline';
import DeltaChip from '../components/charts/DeltaChip';
import { CHART } from '../components/charts/palette';

// Reconstruct a chronological balance trend ending at the current value.
// When real prize-money history exists it is used to walk the balance back;
// otherwise a stable, seeded illustrative trend is generated so the card
// still shows a sparkline shape.
function trendSeries(current, seed, increments) {
  if (increments && increments.length >= 2) {
    let bal = current;
    const hist = [current];
    increments.forEach((inc) => { bal -= inc; hist.push(Math.max(0, Math.round(bal))); });
    return hist.reverse();
  }
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) % 9973;
  const points = 7;
  const arr = [];
  for (let i = 0; i < points; i += 1) {
    const noise = (((h + i * 97) % 100) / 100 - 0.5) * 0.05;
    const ramp = 0.92 + (i / (points - 1)) * 0.08;
    arr.push(Math.round(current * (ramp + noise)));
  }
  arr[arr.length - 1] = current;
  return arr;
}

export default function Transfers({ gameState }) {
  const myTeam = gameState.teams.find((t) => t.teamId === gameState.selectedTeamId);
  const myPlayers = gameState.players.filter((p) => p.teamId === gameState.selectedTeamId && p.status === 'active');

  const bank = myTeam?.budget ?? 0;
  const wageTotal = myPlayers.reduce((s, p) => s + (p.salary || 0), 0);
  // Transfer budget = the share of the bank the board frees up for incoming
  // deals (a simple, deterministic split until a real budget engine exists).
  const transferBudget = Math.round(bank * 0.6);

  const prizeIncrements = (gameState.completedEvents || []).slice(0, 6).map((e) => e.prizeMoneyEarned || 0);
  const teamId = myTeam?.teamId || 'x';
  const bankSeries = trendSeries(bank, `${teamId}-bank`, prizeIncrements);
  const transferSeries = trendSeries(transferBudget, `${teamId}-transfer`);
  const wageSeries = trendSeries(wageTotal, `${teamId}-wage`);

  const cards = [
    { key: 'bank', label: 'Bank Balance', value: bank, sub: 'Total club funds', series: bankSeries, color: CHART.teamA },
    { key: 'transfer', label: 'Transfer Budget', value: transferBudget, sub: 'Available for incoming deals', series: transferSeries, color: CHART.gold },
    { key: 'wage', label: 'Wage Budget', value: wageTotal, sub: 'Current annual squad wages', series: wageSeries, color: CHART.teamB },
  ];

  return (
    <div className="transfers-page">
      <div className="page-header">
        <h1>Transfers</h1>
        <div className="subtitle">Budgets, contracts and squad-building overview for {myTeam?.name || 'your club'}.</div>
      </div>

      <div className="budget-card-grid">
        {cards.map((c) => (
          <section key={c.key} className="panel budget-card">
            <div className="panel-body">
              <div className="label">{c.label}</div>
              <div className="budget-figure">{formatMoney(c.value)}</div>
              <div className="muted">{c.sub}</div>
              <div className="budget-spark"><Sparkline data={c.series} color={c.color} /></div>
            </div>
          </section>
        ))}
      </div>

      <div className="grid-2" style={{ marginBottom: 12 }}>
        <DeltaChip label="Bank Balance Trend" before={bankSeries[0]} after={bankSeries[bankSeries.length - 1]} format={formatMoney} />
        <DeltaChip label="Wage Bill Trend" before={wageSeries[0]} after={wageSeries[wageSeries.length - 1]} format={formatMoney} />
      </div>

      <section className="panel">
        <div className="panel-header"><h2>Contracts</h2><Link to="/roster">Squad</Link></div>
        <div className="panel-body">
          <table>
            <thead>
              <tr><th>Player</th><th>Role</th><th>Nat</th><th className="text-right">Overall</th><th className="text-right">Wage</th></tr>
            </thead>
            <tbody>
              {myPlayers.map((p) => (
                <tr key={p.playerId} className="your-player-row clickable-row">
                  <td style={{ display: 'flex', alignItems: 'center', gap: 8 }}><PlayerAvatar player={p} size={24} /><Link to={`/players/${p.playerId}`}>{p.gamertag}</Link></td>
                  <td>{p.rolePrimary}</td>
                  <td><NatChip country={p.nationality} /></td>
                  <td className="text-right">{p.overall}</td>
                  <td className="text-right">{formatMoney(p.salary || 0)}</td>
                </tr>
              ))}
              {myPlayers.length === 0 && <tr><td colSpan={5} className="muted">No players under contract.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
