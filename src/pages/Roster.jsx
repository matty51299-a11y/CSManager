import { Link } from 'react-router-dom';
import { formatMoney, statColor } from '../utils/helpers';
import { getTeamMapRatings } from '../utils/helpers';
import { Crest, Stars, ConditionChip, MoraleChip, NatChip, PosBadge } from '../components/fm';
import {
  condition, morale, natCode, roleAbbr, roleClass,
  transferValue, contractExpiryYear, squadStatus,
} from '../utils/fmDerive';

export default function Roster({ gameState }) {
  const myTeam = gameState.teams.find((t) => t.teamId === gameState.playerTeamId);
  if (!myTeam) return <div className="panel"><div className="panel-body">No team selected.</div></div>;

  const players = gameState.players
    .filter((p) => p.teamId === gameState.playerTeamId && p.status === 'active')
    .sort((a, b) => b.overall - a.overall);
  const maps = gameState.maps;
  const ratings = getTeamMapRatings(gameState.playerTeamId, gameState.teamMapRatings);
  const dateSeed = gameState.currentDate || gameState.currentDateLabel;

  const totalSalary = players.reduce((sum, p) => sum + p.salary, 0);
  const avgOvr = players.length > 0 ? Math.round(players.reduce((sum, p) => sum + p.overall, 0) / players.length) : 0;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Crest team={myTeam} size={40} />
        <div>
          <h1>Squad</h1>
          <div className="subtitle">{myTeam.name} — {players.length} registered players · {myTeam.region}</div>
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom: 12 }}>
        <div className="stat-item">
          <div className="label">Players</div>
          <div className="value" style={{ color: players.length >= 5 ? 'var(--fm-green)' : 'var(--fm-red)' }}>{players.length}/5</div>
        </div>
        <div className="stat-item">
          <div className="label">Avg Rating</div>
          <div className="value"><Stars value={avgOvr} /></div>
        </div>
        <div className="stat-item">
          <div className="label">Wage Bill</div>
          <div className="value">{formatMoney(totalSalary)} p/m</div>
        </div>
        <div className="stat-item">
          <div className="label">Transfer Budget</div>
          <div className="value">{formatMoney(myTeam.budget)}</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header"><h2>Players — All Squad View</h2><span className="muted">Sorted by ability</span></div>
        <div className="dense-scroll">
          <table>
            <thead>
              <tr>
                <th>Pos</th>
                <th>Name</th>
                <th>Nat</th>
                <th className="text-right">Age</th>
                <th>Ability</th>
                <th>Potential</th>
                <th>Morale</th>
                <th>Cond</th>
                <th className="text-right">AIM</th>
                <th className="text-right">AWP</th>
                <th className="text-right">ENT</th>
                <th className="text-right">CLU</th>
                <th className="text-right">UTL</th>
                <th>Squad Status</th>
                <th className="text-right">Wage</th>
                <th className="text-right">Expires</th>
                <th className="text-right">Value</th>
              </tr>
            </thead>
            <tbody>
              {players.map((p) => {
                const status = squadStatus(p, players);
                return (
                  <tr key={p.playerId}>
                    <td><PosBadge abbr={roleAbbr(p.rolePrimary)} cls={roleClass(p.rolePrimary)} /></td>
                    <td>
                      <Link to={`/players/${p.playerId}`}>{p.gamertag}</Link>
                      {p.realName && <div className="muted" style={{ fontSize: 10 }}>{p.realName}</div>}
                    </td>
                    <td><NatChip code={natCode(p.nationality)} /></td>
                    <td className="text-right">{p.age}</td>
                    <td><Stars value={p.overall} /></td>
                    <td><Stars value={p.overall} potential={p.potential} /></td>
                    <td><MoraleChip level={morale(p, myTeam)} /></td>
                    <td><ConditionChip value={condition(p, dateSeed)} /></td>
                    <td className="text-right">{p.aim}</td>
                    <td className="text-right">{p.awp}</td>
                    <td className="text-right">{p.entry}</td>
                    <td className="text-right">{p.clutch}</td>
                    <td className="text-right">{p.utility}</td>
                    <td><span className={status.cls}>{status.label}</span></td>
                    <td className="text-right">{formatMoney(p.salary)} p/m</td>
                    <td className="text-right">{contractExpiryYear(p, gameState.currentDate)}</td>
                    <td className="text-right">{formatMoney(transferValue(p))}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2>Map Pool Ratings</h2>
          {ratings && <span className="muted">Ban: {ratings.defaultBan} | Best: {ratings.bestMap}</span>}
        </div>
        <div className="panel-body">
          {ratings ? maps.map((m) => {
            const rating = ratings[m.mapId] || 0;
            const color = statColor(rating);
            return (
              <div key={m.mapId} className="map-bar" style={{ marginBottom: 8 }}>
                <span style={{ width: 80, fontSize: 12, color: 'var(--fm-text-2)' }}>{m.name}</span>
                <div className="map-bar-track">
                  <div className={`map-bar-fill ${color}`} style={{ width: `${rating}%` }} />
                </div>
                <span style={{ width: 28, textAlign: 'right', fontSize: 12, fontWeight: 700 }}>{rating}</span>
              </div>
            );
          }) : <p className="muted">No map ratings available.</p>}
        </div>
      </div>
    </div>
  );
}
