import { Link } from 'react-router-dom';
import { formatMoney } from '../utils/helpers';
import { Crest } from '../components/fm';

export default function Transfers({ gameState }) {
  const myTeam = gameState.teams.find((t) => t.teamId === gameState.selectedTeamId);
  const myPlayers = gameState.players.filter((p) => p.teamId === gameState.selectedTeamId && p.status === 'active');

  const bank = myTeam?.budget ?? 0;
  const wageTotal = myPlayers.reduce((s, p) => s + (p.salary || 0), 0);
  // Transfer budget = the share of the bank the board frees up for incoming
  // deals (a simple, deterministic split until a real budget engine exists).
  const transferBudget = Math.round(bank * 0.6);

  const cards = [
    { key: 'bank', label: 'Bank Balance', value: bank, sub: 'Total club funds' },
    { key: 'transfer', label: 'Transfer Budget', value: transferBudget, sub: 'Available for incoming deals' },
    { key: 'wage', label: 'Wage Budget', value: wageTotal, sub: 'Current annual squad wages' },
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
            </div>
          </section>
        ))}
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
                  <td style={{ display: 'flex', alignItems: 'center', gap: 7 }}><Crest team={myTeam} size={16} /><Link to={`/players/${p.playerId}`}>{p.gamertag}</Link></td>
                  <td>{p.rolePrimary}</td>
                  <td><span className="fm-nat">{p.country || p.nationality || '—'}</span></td>
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
