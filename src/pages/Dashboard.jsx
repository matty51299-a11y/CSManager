import { Link, useNavigate } from 'react-router-dom';
import { formatMoney, tierBadgeClass } from '../utils/helpers';
import { compareDate, formatDate } from '../utils/calendarDates';
import { Crest, MoraleChip } from '../components/fm';
import { burnoutRisk, condition, morale, trainingRating } from '../utils/fmDerive';

function movementText(value) {
  if (value > 0) return `▲ ${value}`;
  if (value < 0) return `▼ ${Math.abs(value)}`;
  return '—';
}

function posZone(rank, total) {
  if (rank <= 4) return 'zone-elite';
  if (rank <= 8) return 'zone-quali';
  if (rank > total - 3) return 'zone-drop';
  return 'zone-mid';
}

export default function Dashboard({ gameState, advanceToNextEvent, enterEvent, resetCareer }) {
  const navigate = useNavigate();
  const myTeam = gameState.teams.find((t) => t.teamId === gameState.selectedTeamId);
  const myPlayers = gameState.players.filter((p) => p.teamId === gameState.selectedTeamId && p.status === 'active');
  const tableTeams = [...gameState.teams].sort((a, b) => a.currentRank - b.currentRank);
  const nextEvents = [...gameState.events].sort((a, b) => compareDate(a.startDate, b.startDate));
  const completedIds = new Set(gameState.completedEvents.map((e) => e.eventId));
  const nextEvent = nextEvents.find((e) => !completedIds.has(e.eventId));
  const activeOrNextEvent = gameState.currentEventId ? gameState.events.find((e) => e.eventId === gameState.currentEventId) : nextEvent;
  const inviteSnapshot = activeOrNextEvent ? gameState.eventInviteSnapshots?.[activeOrNextEvent.eventId] : null;
  const inviteRow = inviteSnapshot?.invitees?.find((invite) => invite.teamId === gameState.selectedTeamId);
  const inviteCutoff = inviteSnapshot?.cutoffRank || activeOrNextEvent?.teams || 16;
  const invited = inviteRow || (myTeam && myTeam.currentRank <= inviteCutoff);
  const dateSeed = gameState.currentDate || gameState.currentDateLabel;

  const teamMorale = myTeam ? morale({ playerId: 'team', composure: 80 }, myTeam) : null;
  const riskList = [...myPlayers]
    .map((p) => ({ p, risk: burnoutRisk(p, dateSeed), cond: condition(p, dateSeed) }))
    .sort((a, b) => b.risk.score - a.risk.score);
  const highRiskCount = riskList.filter((r) => r.risk.cls === 'risk-vhigh' || r.risk.cls === 'risk-high').length;

  const trained = [...myPlayers]
    .map((p) => ({ p, rating: trainingRating(p, dateSeed) }))
    .sort((a, b) => b.rating - a.rating);
  const avgTraining = trained.length ? (trained.reduce((s, t) => s + t.rating, 0) / trained.length).toFixed(2) : '—';
  const best = trained.slice(0, 2);
  const worst = trained.slice(-2).reverse();

  const latestNews = (gameState.inboxItems || []).slice(0, 4);
  const lastResult = (gameState.completedEvents || [])[0];

  return (
    <div className="dashboard-page">
      {/* ---- Next match / event centrepiece ---- */}
      <section className="panel next-match-panel">
        <div className="panel-header">
          <h2>Home</h2>
          <span className="status-pill status-current">{(gameState.currentPhase || '').replace(/_/g, ' ')}</span>
        </div>
        <div className="panel-body">
          <div className="nm-strip">Next {activeOrNextEvent ? 'Event' : 'Fixture'}</div>
          <div className="nm-main">
            <div className="nm-side">
              {myTeam && <Crest team={myTeam} size={52} />}
              <div className="nm-team-name">{myTeam?.name || '—'}</div>
              <div className="nm-team-sub">VRS #{myTeam?.currentRank ?? '—'} · {myTeam?.region}</div>
            </div>
            <div className="nm-centre">
              {activeOrNextEvent ? (
                <>
                  <div className="nm-title">{activeOrNextEvent.name}</div>
                  <div className="nm-date">{formatDate(activeOrNextEvent.startDate)} — {formatDate(activeOrNextEvent.endDate)}</div>
                  <div className="nm-meta">{activeOrNextEvent.eventType || 'Tournament'} · {activeOrNextEvent.tier} Tier · Top {activeOrNextEvent.teams || 16}</div>
                  <div className="inline-actions" style={{ justifyContent: 'center', marginTop: 10 }}>
                    {!gameState.currentPhase.startsWith('event_active') && gameState.currentPhase !== 'event_ready' && (
                      <button onClick={advanceToNextEvent}>Advance To Event</button>
                    )}
                    {gameState.currentPhase === 'event_ready' && (
                      <button onClick={() => { enterEvent(); navigate('/event-hub'); }}>Enter Event</button>
                    )}
                    {gameState.currentPhase.startsWith('event_active') && (
                      <button onClick={() => navigate('/event-hub')}>Open Event Mode</button>
                    )}
                    <button className="ghost-button" onClick={resetCareer}>Reset Career</button>
                  </div>
                </>
              ) : (
                <>
                  <div className="nm-title">Season Complete</div>
                  <div className="nm-date">No remaining scheduled events</div>
                  <div className="inline-actions" style={{ justifyContent: 'center', marginTop: 10 }}>
                    <button className="ghost-button" onClick={resetCareer}>Reset Career</button>
                  </div>
                </>
              )}
            </div>
            <div className="nm-side">
              <span className="nm-event-badge">{(activeOrNextEvent?.name || 'CS').split(/\s+/).map((w) => w[0]).join('').slice(0, 3).toUpperCase()}</span>
              <div className="nm-team-name">{activeOrNextEvent ? formatMoney(activeOrNextEvent.prizePool) : '—'}</div>
              <div className="nm-team-sub">Prize Pool</div>
            </div>
          </div>
          <div className="nm-footer">
            <span>Invite: <b className={invited ? 'status-good' : 'status-bad'}>{inviteRow ? `Seed #${inviteRow.seed}` : invited ? 'Projected' : `Outside cut (need +${Math.max(0, (myTeam?.currentRank || 99) - inviteCutoff)})`}</b></span>
            <span>Cutoff: <b>Top {inviteCutoff}</b></span>
            <span>Form: <b>{myTeam?.formRating ?? '—'}</b></span>
            {teamMorale && <span>Team Morale: <MoraleChip level={teamMorale} /></span>}
          </div>
        </div>
      </section>

      <div className="fm-home-grid">
        {/* ---- Left column: league table ---- */}
        <div className="fm-home-col">
          <section className="panel">
            <div className="panel-header"><h2>League Table</h2><Link to="/rankings">VRS</Link></div>
            <table>
              <thead>
                <tr><th>Pos</th><th>Team</th><th className="text-right">Pts</th><th className="text-right">Form</th><th className="text-right">Mv</th></tr>
              </thead>
              <tbody>
                {tableTeams.slice(0, 18).map((t) => (
                  <tr key={t.teamId} className={t.teamId === gameState.selectedTeamId ? 'your-team-row clickable-row' : 'clickable-row'} onClick={() => navigate(`/teams/${t.teamId}`)}>
                    <td><span className={`pos-stripe ${posZone(t.currentRank, tableTeams.length)}`}>{t.currentRank}</span></td>
                    <td style={{ display: 'flex', alignItems: 'center', gap: 7 }}><Crest team={t} size={16} />{t.shortName}</td>
                    <td className="text-right">{t.vrsPoints}</td>
                    <td className="text-right">{t.formRating}</td>
                    <td className="text-right"><span className={`movement-pill ${t.rankMovement > 0 ? 'up' : t.rankMovement < 0 ? 'down' : ''}`}>{movementText(t.rankMovement)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>

        {/* ---- Centre column: preparation + news ---- */}
        <div className="fm-home-col">
          <section className="panel">
            <div className="panel-header"><h2>Match Preparation</h2><Link to="/roster">Squad</Link></div>
            <div className="panel-body">
              <div className="muted" style={{ marginBottom: 8 }}>Special focus has been placed on the following areas ahead of {activeOrNextEvent?.name || 'the next event'}:</div>
              <div className="stat-grid compact-stats">
                <div className="stat-item"><div className="label">Avg Overall</div><div className="value">{myPlayers.length ? Math.round(myPlayers.reduce((s, p) => s + p.overall, 0) / myPlayers.length) : '—'}</div></div>
                <div className="stat-item"><div className="label">Roster</div><div className="value" style={{ color: myPlayers.length >= 5 ? 'var(--fm-green)' : 'var(--fm-red)' }}>{myPlayers.length}/5</div></div>
                <div className="stat-item"><div className="label">Budget</div><div className="value">{myTeam ? formatMoney(myTeam.budget) : '—'}</div></div>
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panel-header"><h2>Team News</h2><Link to="/inbox">Inbox</Link></div>
            <div className="panel-body">
              {latestNews.length === 0 && <div className="muted">No team news.</div>}
              <div className="news-feed">
                {latestNews.map((n, i) => (
                  <div key={i} className="news-item">
                    <b>{n.title}</b>
                    <span>{n.date ? formatDate(n.date) : n.type}</span>
                    <p>{n.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {lastResult && (
            <section className="panel">
              <div className="panel-header"><h2>Last Event Feedback</h2></div>
              <div className="panel-body">
                <div className="news-item">
                  <b>{lastResult.eventName || 'Previous event'}</b>
                  <span>
                    {lastResult.userRecord ? `Record ${lastResult.userRecord.wins}-${lastResult.userRecord.losses}` : 'Completed'}
                    {lastResult.rankMovement ? ` · Rank ${lastResult.rankMovement > 0 ? '▲' : '▼'} ${Math.abs(lastResult.rankMovement)}` : ''}
                  </span>
                  <p>{lastResult.champion ? `${lastResult.champion.name} lifted the trophy.` : 'The staff have nothing specific to report from the previous event.'}</p>
                </div>
              </div>
            </section>
          )}

          <section className="panel">
            <div className="panel-header"><h2>Fixtures</h2><Link to="/calendar">Schedule</Link></div>
            <div className="panel-body">
              {nextEvents.filter((e) => !completedIds.has(e.eventId)).slice(0, 5).map((e) => (
                <div key={e.eventId} className="risk-row">
                  <div className="risk-who">
                    <b><Link to={`/tournaments/${e.eventId}`}>{e.name}</Link></b>
                    <span>{formatDate(e.startDate)} · {e.eventType || 'Tournament'}</span>
                  </div>
                  <span className={tierBadgeClass(e.tier)}>{e.tier}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* ---- Right column: medical centre + training ---- */}
        <div className="fm-home-col">
          <section className="panel">
            <div className="panel-header"><h2>Medical Centre</h2><span className="muted">{highRiskCount} at risk</span></div>
            <div className="panel-body">
              {riskList.slice(0, 5).map(({ p, risk, cond }) => (
                <div key={p.playerId} className="risk-row">
                  <div className="risk-who">
                    <b><Link to={`/players/${p.playerId}`}>{p.gamertag}</Link></b>
                    <span>{p.rolePrimary} · {cond}% condition</span>
                  </div>
                  <span className={`risk-tag ${risk.cls}`}>{risk.label}<small>{cond < 88 ? 'Low Condition' : 'Monitored'}</small></span>
                </div>
              ))}
              {riskList.length === 0 && <div className="muted">No players on the books.</div>}
            </div>
          </section>

          <section className="panel">
            <div className="panel-header"><h2>Training Performance</h2></div>
            <div className="panel-body">
              <div className="training-avg"><b>{avgTraining}</b><span>Avg Training Rating</span></div>
              <div className="eyebrow" style={{ marginBottom: 6 }}>Best</div>
              {best.map(({ p, rating }) => (
                <div key={p.playerId} className="training-card train-good">
                  <Crest team={myTeam} size={22} />
                  <div className="t-name"><b>{p.gamertag}</b><span>Training Rating</span></div>
                  <div className="t-score">{rating.toFixed(2)}</div>
                </div>
              ))}
              <div className="eyebrow" style={{ margin: '8px 0 6px' }}>Worst</div>
              {worst.map(({ p, rating }) => (
                <div key={p.playerId} className="training-card train-bad">
                  <Crest team={myTeam} size={22} />
                  <div className="t-name"><b>{p.gamertag}</b><span>Training Rating</span></div>
                  <div className="t-score">{rating.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="panel-header"><h2>Upcoming Events</h2></div>
            <div className="panel-body event-card-grid" style={{ gridTemplateColumns: '1fr' }}>
              {nextEvents.slice(0, 4).map((e) => {
                const isCurrent = gameState.currentEventId === e.eventId;
                const inv = gameState.eventInviteSnapshots?.[e.eventId]?.invitees?.some((x) => x.teamId === gameState.selectedTeamId) || (myTeam?.currentRank <= (e.teams || 16));
                return (
                  <div key={e.eventId} className={`event-intel-card ${isCurrent ? 'current' : ''}`}>
                    <div className="event-card-head"><Link to={`/tournaments/${e.eventId}`}>{e.name}</Link><span className={tierBadgeClass(e.tier)}>{e.tier}</span></div>
                    <div className="muted">{formatDate(e.startDate)} – {formatDate(e.endDate)}</div>
                    <div className="event-card-meta">
                      <span>Top {e.teams || 16}</span>
                      <span>{formatMoney(e.prizePool)}</span>
                      <span className={inv ? 'status-good' : 'status-bad'}>{inv ? 'Invited' : 'Outside cut'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
