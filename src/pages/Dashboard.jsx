import { Link, useNavigate } from 'react-router-dom';
import { OvrBadge } from '../components/StatBadge';
import { formatMoney, tierBadgeClass } from '../utils/helpers';
import { compareDate, formatDate } from '../utils/calendarDates';

function movementText(value) {
  if (value > 0) return `↑ ${value}`;
  if (value < 0) return `↓ ${Math.abs(value)}`;
  return '—';
}

export default function Dashboard({ gameState, advanceToNextEvent, enterEvent, resetCareer }) {
  const navigate = useNavigate();
  const myTeam = gameState.teams.find((t) => t.teamId === gameState.selectedTeamId);
  const myPlayers = gameState.players.filter((p) => p.teamId === gameState.selectedTeamId && p.status === 'active');
  const topTeams = [...gameState.teams].sort((a, b) => a.currentRank - b.currentRank).slice(0, 12);
  const nextEvents = [...gameState.events].sort((a, b) => compareDate(a.startDate, b.startDate));
  const completedIds = new Set(gameState.completedEvents.map((e) => e.eventId));
  const nextEvent = nextEvents.find((e) => !completedIds.has(e.eventId));
  const activeOrNextEvent = gameState.currentEventId ? gameState.events.find((e) => e.eventId === gameState.currentEventId) : nextEvent;
  const starPlayer = [...myPlayers].sort((a, b) => b.overall - a.overall)[0];
  const averageOverall = Math.round(myPlayers.reduce((sum, p) => sum + Number(p.overall || 0), 0) / Math.max(1, myPlayers.length));
  const inviteSnapshot = activeOrNextEvent ? gameState.eventInviteSnapshots?.[activeOrNextEvent.eventId] : null;
  const inviteRow = inviteSnapshot?.invitees?.find((invite) => invite.teamId === gameState.selectedTeamId);
  const inviteCutoff = inviteSnapshot?.cutoffRank || activeOrNextEvent?.teams || 16;
  const nextAction = gameState.currentPhase === 'event_ready' ? 'Enter event' : gameState.currentPhase?.startsWith('event_active') ? 'Open event mode' : 'Advance to next event';

  return (
    <div className="dashboard-page">
      <section className="dashboard-hero panel">
        <div>
          <div className="eyebrow">Manager Command</div>
          <h1>{myTeam?.name || 'CS Dynasty'} <span>{myTeam?.shortName}</span></h1>
          <p>{gameState.currentDateLabel} · Dynamic VRS season · {gameState.dataSource}</p>
        </div>
        <div className="hero-stat-grid">
          <div><span>VRS Rank</span><strong>#{myTeam?.currentRank ?? '—'}</strong></div>
          <div><span>Form</span><strong>{myTeam?.formRating ?? '—'}</strong></div>
          <div><span>Next Action</span><strong>{nextAction}</strong></div>
          <div><span>Next Event</span><strong>{activeOrNextEvent?.name || 'Season complete'}</strong></div>
        </div>
      </section>

      <section className="panel cockpit-panel career-command">
        <div className="panel-header"><h2>Career Control</h2><span className="status-pill status-current">{gameState.currentPhase}</span></div>
        <div className="panel-body command-grid">
          <div className="command-copy">
            <div className="eyebrow">Current Date</div>
            <strong>{gameState.currentDateLabel}</strong>
            <p>{activeOrNextEvent ? `${activeOrNextEvent.name} · ${formatDate(activeOrNextEvent.startDate)} – ${formatDate(activeOrNextEvent.endDate)}` : 'No remaining scheduled events.'}</p>
          </div>
          <div className="mini-stat"><span>Invite</span><strong>{inviteRow ? `Seed #${inviteRow.seed}` : myTeam?.currentRank <= inviteCutoff ? 'Projected' : `Need +${myTeam?.currentRank - inviteCutoff}`}</strong></div>
          <div className="mini-stat"><span>Cutoff</span><strong>Top {inviteCutoff}</strong></div>
          <div className="command-actions">
            {!gameState.currentPhase.startsWith('event_active') && gameState.currentPhase !== 'event_ready' && <button onClick={advanceToNextEvent}>Advance to Next Event</button>}
            {gameState.currentPhase === 'event_ready' && <button onClick={() => { enterEvent(); navigate('/event-hub'); }}>Enter Event</button>}
            {gameState.currentPhase.startsWith('event_active') && <button onClick={() => navigate('/event-hub')}>Open Event Mode</button>}
            <button className="ghost-button" onClick={resetCareer}>Reset Career</button>
          </div>
        </div>
      </section>

      <div className="dashboard-grid">
        {myTeam && (
          <section className="panel team-hub">
            <div className="panel-header"><h2>My Team Hub</h2><Link to={`/teams/${myTeam.teamId}`}>View Team</Link></div>
            <div className="panel-body">
              <div className="team-hub-top"><div><div className="eyebrow">{myTeam.region}</div><h2>{myTeam.name}</h2></div><span className="team-pill">#{myTeam.currentRank} VRS</span></div>
              <div className="stat-grid compact-stats">
                <div className="stat-item"><div className="label">VRS Points</div><div className="value">{myTeam.vrsPoints}</div></div>
                <div className="stat-item"><div className="label">Form</div><div className="value">{myTeam.formRating}</div></div>
                <div className="stat-item"><div className="label">Movement</div><div className="value">{movementText(myTeam.rankMovement)}</div></div>
                <div className="stat-item"><div className="label">Budget</div><div className="value">{formatMoney(myTeam.budget)}</div></div>
                <div className="stat-item"><div className="label">Avg OVR</div><div className="value">{averageOverall}</div></div>
                <div className="stat-item"><div className="label">Star Player</div><div className="value">{starPlayer?.gamertag || '—'}</div></div>
              </div>
            </div>
            <table><thead><tr><th>Player</th><th>Role</th><th className="text-right">OVR</th></tr></thead><tbody>{myPlayers.map((p) => <tr key={p.playerId} className="your-player-row"><td><Link to={`/players/${p.playerId}`}>{p.gamertag}</Link></td><td><span className="role-pill">{p.rolePrimary}</span></td><td className="text-right"><OvrBadge value={p.overall} /></td></tr>)}</tbody></table>
          </section>
        )}

        <section className="panel rankings-panel">
          <div className="panel-header"><h2>VRS Rankings</h2><Link to="/rankings">Full Table</Link></div>
          <table><thead><tr><th>#</th><th>Team</th><th>Move</th><th className="text-right">VRS</th><th className="text-right">Form</th></tr></thead><tbody>{topTeams.map((t) => <tr key={t.teamId} className={t.teamId === gameState.selectedTeamId ? 'your-team-row' : ''}><td className="rank-cell">{t.currentRank}</td><td><Link to={`/teams/${t.teamId}`}>{t.shortName}</Link></td><td><span className={`movement-pill ${t.rankMovement > 0 ? 'up' : t.rankMovement < 0 ? 'down' : ''}`}>{movementText(t.rankMovement)}</span></td><td className="text-right">{t.vrsPoints}</td><td className="text-right">{t.formRating}</td></tr>)}</tbody></table>
        </section>
      </div>

      <section className="panel calendar-panel">
        <div className="panel-header"><h2>Calendar Intel</h2><Link to="/calendar">Full Calendar</Link></div>
        <div className="panel-body event-card-grid">
          {nextEvents.slice(0, 6).map((e) => {
            const invited = gameState.eventInviteSnapshots?.[e.eventId]?.invitees?.some((invite) => invite.teamId === gameState.selectedTeamId) || (myTeam?.currentRank <= (e.teams || 16));
            const isCurrent = gameState.currentEventId === e.eventId;
            return <div key={e.eventId} className={`event-intel-card ${isCurrent ? 'current' : ''}`}><div className="event-card-head"><Link to={`/tournaments/${e.eventId}`}>{e.name}</Link><span className={tierBadgeClass(e.tier)}>{e.tier}</span></div><div className="muted">{formatDate(e.startDate)} – {formatDate(e.endDate)} · {e.eventType}</div><div className="event-card-meta"><span>Top {e.teams || 16}</span><span>{formatMoney(e.prizePool)}</span><span className={invited ? 'status-good' : 'status-bad'}>{invited ? 'Projected invited' : 'Outside cut'}</span></div></div>;
          })}
        </div>
      </section>
    </div>
  );
}
