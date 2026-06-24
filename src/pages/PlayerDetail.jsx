import { useParams, Link } from 'react-router-dom';
import { StatWithBar } from '../components/StatBadge';
import { formatMoney, ovrClass } from '../utils/helpers';

const SKILL_FIELDS = [
  { key: 'aim', label: 'Aim' },
  { key: 'awp', label: 'AWP' },
  { key: 'entry', label: 'Entry' },
  { key: 'clutch', label: 'Clutch' },
  { key: 'utility', label: 'Utility' },
  { key: 'trading', label: 'Trading' },
  { key: 'anchor', label: 'Anchor' },
  { key: 'calling', label: 'Calling' },
  { key: 'discipline', label: 'Discipline' },
  { key: 'composure', label: 'Composure' },
  { key: 'consistency', label: 'Consistency' },
];

export default function PlayerDetail({ gameState }) {
  const { playerId } = useParams();
  const player = gameState.players.find((p) => p.playerId === playerId);
  if (!player) return <div>Player not found.</div>;

  const team = gameState.teams.find((t) => t.teamId === player.teamId);

  return (
    <div>
      <div className="page-header">
        <h1>{player.gamertag}</h1>
        <div className="subtitle">
          {player.realName} — {player.nationality} — Age {player.age}
        </div>
      </div>

      <div className="grid-2">
        {/* Info Panel */}
        <div className="panel">
          <div className="panel-header"><h2>Player Info</h2></div>
          <div className="panel-body">
            <div className="stat-grid">
              <div className="stat-item">
                <div className="label">Team</div>
                <div className="value">
                  {team ? <Link to={`/teams/${team.teamId}`}>{team.shortName}</Link> : 'Free Agent'}
                </div>
              </div>
              <div className="stat-item">
                <div className="label">Primary Role</div>
                <div className="value">{player.rolePrimary}</div>
              </div>
              <div className="stat-item">
                <div className="label">Secondary Role</div>
                <div className="value">{player.roleSecondary}</div>
              </div>
              <div className="stat-item">
                <div className="label">Overall</div>
                <div className={`value ${ovrClass(player.overall)}`}>{player.overall}</div>
              </div>
              <div className="stat-item">
                <div className="label">Potential</div>
                <div className={`value ${ovrClass(player.potential)}`}>{player.potential}</div>
              </div>
              <div className="stat-item">
                <div className="label">Status</div>
                <div className="value">{player.status}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Contract Panel */}
        <div className="panel">
          <div className="panel-header"><h2>Contract</h2></div>
          <div className="panel-body">
            <div className="stat-grid">
              <div className="stat-item">
                <div className="label">Salary</div>
                <div className="value">{formatMoney(player.salary)}/mo</div>
              </div>
              <div className="stat-item">
                <div className="label">Contract</div>
                <div className="value">{player.contractYears} yr{player.contractYears !== 1 ? 's' : ''}</div>
              </div>
              <div className="stat-item">
                <div className="label">Buyout</div>
                <div className="value">{formatMoney(player.buyout)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Skills Panel */}
      <div className="panel" style={{ marginTop: 16 }}>
        <div className="panel-header"><h2>Skills</h2></div>
        <div className="panel-body">
          <div className="stat-grid">
            {SKILL_FIELDS.map((f) => (
              <div key={f.key} className="stat-item">
                <div className="label">{f.label}</div>
                <div className="value"><StatWithBar value={player[f.key]} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
