import { getNextSwissPairings } from '../utils/swissEngine';
import { sortStandings } from '../utils/tournamentStandings';
import { formatMoney } from '../utils/helpers';

function MatchResult({ match, userTeamId }) {
  if (!match || !match.teamA || !match.teamB || !match.winner || !match.loser) return null;
  const maps = (match.maps || []).map((m) => `${m.mapName} ${m.scoreA}-${m.scoreB}`).join(', ');
  const isUserMatch = match.teamA.teamId === userTeamId || match.teamB.teamId === userTeamId;
  return (
    <div className={`match-card ${isUserMatch ? 'your-match-card' : ''}`}>
      <div className="match-line"><strong>{match.teamA.shortName}</strong><span>{match.seriesScore}</span><strong>{match.teamB.shortName}</strong></div>
      <div className="muted">{match.winner.name} won. {match.upset && <b className="upset-tag">UPSET</b>}</div>
      <div className="muted">{maps}</div>
      <div className="muted">Top performer: {match.topPerformer?.gamertag} ({match.topPerformer?.rating})</div>
      <p className="muted">{match.winner.name} beat {match.loser.name} {match.seriesScore} after {maps}. {match.topPerformer?.gamertag} led the server.</p>
    </div>
  );
}

export default function EventHub({ gameState, simUserMatch, simOtherMatch, simAiMatches, advanceSwissRound, generatePlayoffs, simPlayoffRound, completeEvent, returnToDashboard }) {
  const t = gameState.activeTournament;
  if (!t || !t.swiss || !t.event) {
    return (
      <div>
        <div className="page-header"><h1>Event Hub</h1><div className="subtitle">No active career event.</div></div>
        <div className="panel"><div className="panel-body muted">Enter an event from the Dashboard or Calendar to open the Event Hub.</div></div>
      </div>
    );
  }

  const userTeamId = gameState.selectedTeamId;
  const activeRound = t.swiss.rounds.find((r) => !r.complete);
  const basePairings = activeRound?.pendingPairings || (!t.swiss.complete ? getNextSwissPairings(t.swiss) : []);
  const completedKeys = new Set((activeRound?.matches || []).map((m) => [m.teamA.teamId, m.teamB.teamId].sort().join('-')));
  const pairings = basePairings.filter(([a, b]) => a && b && !completedKeys.has([a.teamId, b.teamId].sort().join('-')));
  const pendingUser = pairings.find(([a, b]) => [a.teamId, b.teamId].includes(userTeamId));
  const roundComplete = !t.swiss.complete && basePairings.length > 0 && pairings.length === 0;
  const userStanding = t.swiss.standings.find((r) => r.teamId === userTeamId);
  const userAlive = userStanding?.status !== 'eliminated';
  const summary = (gameState.completedEvents || []).find((e) => e.eventId === t.event.eventId);
  const stage = t.champion ? 'Champion crowned' : t.playoffs ? 'Playoffs' : 'Swiss stage';

  return (
    <div>
      <div className="event-hero">
        <div>
          <h1>{t.event.name}</h1>
          <p>{t.event.eventType} · {formatMoney(t.event.prizePool)} · {t.teams.length} teams · <span className="stage-pill">{stage}</span></p>
        </div>
        <div>
          <strong>Your team: {gameState.teams.find((team) => team.teamId === userTeamId)?.name || '—'}</strong>
          {userStanding && <div className="muted">Record: {userStanding.wins}-{userStanding.losses} ({userStanding.status})</div>}
        </div>
      </div>

      {!t.swiss.complete && (
        <div className="panel">
          <div className="panel-header">
            <h2>Swiss Round {activeRound?.number || t.swiss.rounds.length + 1}</h2>
            <div className="action-row">
              <button onClick={simAiMatches}>Sim AI Matches</button>
              {roundComplete && <button onClick={advanceSwissRound}>Advance Swiss Round</button>}
            </div>
          </div>
          <div className="panel-body">
            <h3>Your Match</h3>
            <div className="match-grid">
              {pendingUser ? (
                <div className="match-card your-match-card">
                  <div className="match-line"><strong>{pendingUser[0].team.shortName}</strong><span>vs</span><strong>{pendingUser[1].team.shortName}</strong></div>
                  <button onClick={() => simUserMatch({ teamAId: pendingUser[0].teamId, teamBId: pendingUser[1].teamId })}>Play / Sim Your Match</button>
                </div>
              ) : (
                <div className="muted">{userAlive ? 'No active user match this round.' : 'Your team has been eliminated from Swiss.'}</div>
              )}
            </div>
            <h3>Other Matches</h3>
            <div className="match-grid">
              {pairings.filter((p) => p !== pendingUser).map(([a, b]) => (
                <div className="match-card" key={a.teamId + b.teamId}>
                  <div className="match-line"><strong>{a.team.shortName}</strong><span>vs</span><strong>{b.team.shortName}</strong></div>
                  <button onClick={() => simOtherMatch({ teamAId: a.teamId, teamBId: b.teamId })}>Sim Other Match</button>
                </div>
              ))}
              {pairings.length === 0 && <div className="muted">No remaining matches this round.</div>}
            </div>
          </div>
        </div>
      )}

      {t.swiss.complete && !t.playoffs && (
        <div className="panel"><div className="panel-body"><button onClick={generatePlayoffs}>Generate Playoffs</button></div></div>
      )}

      {t.playoffs && (
        <div className="panel">
          <div className="panel-header">
            <h2>Playoff Bracket</h2>
            {!t.champion && <button onClick={simPlayoffRound}>Sim Other/Remaining Playoff Round</button>}
          </div>
          <div className="panel-body bracket-grid">
            {t.playoffs.rounds.map((r, ri) => (
              <div key={r.name}>
                <h3>{r.name}</h3>
                {r.matches.map((m, mi) => (
                  <div key={mi}>
                    {m.result ? (
                      <MatchResult match={m.result} userTeamId={userTeamId} />
                    ) : (
                      <div className={`match-card ${[m.teamA?.teamId, m.teamB?.teamId].includes(userTeamId) ? 'your-match-card' : ''}`}>
                        {m.teamA?.shortName || 'TBD'} vs {m.teamB?.shortName || 'TBD'}
                        {m.teamA && m.teamB && [m.teamA.teamId, m.teamB.teamId].includes(userTeamId) && (
                          <button onClick={() => simUserMatch({ roundIndex: ri, matchIndex: mi })}>Play / Sim Your Match</button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {t.champion && !summary && (
        <div className="panel"><div className="panel-body"><button onClick={completeEvent}>Finish Event</button></div></div>
      )}

      {t.champion && (
        <div className="champion-card">
          Champion: {t.champion.name}
          {summary && <button style={{ marginLeft: 12 }} onClick={returnToDashboard}>Return to Dashboard</button>}
        </div>
      )}

      <div className="grid-2">
        <div className="panel">
          <div className="panel-header"><h2>Swiss Standings</h2></div>
          <table>
            <tbody>
              {sortStandings(t.swiss.standings).map((r) => (
                <tr key={r.teamId} className={r.teamId === userTeamId ? 'your-team-row' : ''}>
                  <td>{r.team.name}</td>
                  <td>{r.wins}-{r.losses}</td>
                  <td><span className={`status-${r.status}`}>{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="panel">
          <div className="panel-header"><h2>Event News / Results</h2></div>
          <div className="panel-body match-grid">
            {t.swiss.rounds.flatMap((r) => r.matches).slice(-8).map((m, i) => (
              <MatchResult key={i} match={m} userTeamId={userTeamId} />
            ))}
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="panel">
          <div className="panel-header"><h2>Qualified Teams ({t.swiss.qualified.length})</h2></div>
          <div className="panel-body">
            {t.swiss.qualified.length === 0 && <div className="muted">No teams have qualified yet.</div>}
            {t.swiss.qualified.map((r) => (
              <div key={r.teamId} className={`diag-row ${r.teamId === userTeamId ? 'your-team-row' : ''}`}>
                <span>{r.team.name}</span>
                <span className="muted" style={{ marginLeft: 'auto' }}>{r.wins}-{r.losses}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="panel">
          <div className="panel-header"><h2>Eliminated Teams ({t.swiss.eliminated.length})</h2></div>
          <div className="panel-body">
            {t.swiss.eliminated.length === 0 && <div className="muted">No teams have been eliminated yet.</div>}
            {t.swiss.eliminated.map((r) => (
              <div key={r.teamId} className={`diag-row ${r.teamId === userTeamId ? 'your-team-row' : ''}`}>
                <span>{r.team.name}</span>
                <span className="muted" style={{ marginLeft: 'auto' }}>{r.wins}-{r.losses}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {summary && (
        <div className="panel">
          <div className="panel-header"><h2>Event Summary</h2></div>
          <div className="panel-body event-summary-card">
            <p>Champion: {summary.champion?.name || 'Unknown'} · Runner-up: {summary.runnerUp?.name || 'None'} · Your record: {summary.userRecord.wins}-{summary.userRecord.losses} · Prize money: {formatMoney(summary.prizeMoneyEarned)} · Reputation: +{summary.reputationChange} · Ranking movement: {summary.rankingMovement}</p>
            <p>Biggest upset: {summary.biggestUpset ? `${summary.biggestUpset.winner.shortName} over ${summary.biggestUpset.loser.shortName}` : 'None'} · MVP candidate: {summary.mvp?.gamertag || 'TBD'}</p>
          </div>
        </div>
      )}

      {!userAlive && !t.champion && (
        <div className="panel"><div className="panel-body muted">Your team has been eliminated. You can quickly simulate the rest of the event.</div></div>
      )}
    </div>
  );
}
