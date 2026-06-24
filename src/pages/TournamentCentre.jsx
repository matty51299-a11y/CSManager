import { useMemo, useState } from 'react';
import { createTournament, generatePlayoffs, simulatePlayoffRound, simulateSwissRound } from '../utils/tournamentEngine.js';
import { getNextSwissPairings } from '../utils/swissEngine.js';
import { sortStandings } from '../utils/tournamentStandings.js';

function MatchCard({ match }) {
  if (!match) return null;
  const maps = match.maps.map((map) => `${map.mapName} ${map.scoreA}-${map.scoreB}`).join(' · ');
  return (
    <div className="match-card">
      <div className="match-line"><strong>{match.teamA.shortName}</strong><span>{match.seriesScore}</span><strong>{match.teamB.shortName}</strong></div>
      <div className="muted">Winner: {match.winner.shortName} {match.upset && <span className="upset-tag">UPSET</span>}</div>
      <div className="muted">Maps: {maps}</div>
      <div className="muted">Top: {match.topPerformer?.gamertag || '—'} ({match.topPerformer?.rating || '—'})</div>
    </div>
  );
}

export default function TournamentCentre({ gameState }) {
  const events = gameState.events;
  const rankedTeams = useMemo(() => [...gameState.teams].sort((a, b) => a.ranking - b.ranking), [gameState.teams]);
  const [eventId, setEventId] = useState(events[0]?.eventId || events[0]?.id || '');
  const [selectedTeamIds, setSelectedTeamIds] = useState(rankedTeams.slice(0, 16).map((team) => team.teamId));
  const [tournament, setTournament] = useState(null);
  const [history, setHistory] = useState([]);

  const selectedEvent = events.find((event) => (event.eventId || event.id) === eventId) || events[0];
  const selectedTeams = selectedTeamIds.map((id) => rankedTeams.find((team) => team.teamId === id)).filter(Boolean);
  const nextPairings = tournament?.swiss && !tournament.swiss.complete ? getNextSwissPairings(tournament.swiss) : [];

  function autofillTeams() { setSelectedTeamIds(rankedTeams.slice(0, 16).map((team) => team.teamId)); }
  function generateTournament() { setTournament(createTournament({ event: selectedEvent, teams: selectedTeams })); }
  function simulateSwiss() { setTournament((current) => simulateSwissRound(current, gameState)); }
  function makePlayoffs() { setTournament((current) => generatePlayoffs(current)); }
  function simulatePlayoffs() {
    setTournament((current) => {
      const next = simulatePlayoffRound(current, gameState);
      if (!current.champion && next.champion) {
        const playoffMatches = next.playoffs.rounds.flatMap((round) => round.matches.map((match) => match.result).filter(Boolean));
        const biggestUpset = playoffMatches.concat(next.swiss.rounds.flatMap((round) => round.matches)).filter((match) => match.upset)[0];
        const semiFinalists = next.playoffs.rounds[1]?.matches.flatMap((match) => [match.teamA, match.teamB]).filter(Boolean) || [];
        setHistory((old) => [{ event: next.event, champion: next.champion, runnerUp: next.playoffs.runnerUp, semiFinalists, qualified: next.swiss.qualified, biggestUpset }, ...old]);
      }
      return next;
    });
  }

  return (
    <div>
      <div className="page-header"><h1>Tournament Centre</h1><div className="subtitle">16-team Swiss stage into single-elimination Bo3 playoffs.</div></div>

      <div className="panel"><div className="panel-header"><h2>Event Setup</h2></div><div className="panel-body tournament-controls">
        <label>Event<select value={eventId} onChange={(e) => setEventId(e.target.value)}>{events.map((event) => <option key={event.eventId || event.id} value={event.eventId || event.id}>{event.name}</option>)}</select></label>
        <button type="button" onClick={autofillTeams}>Auto-fill Top 16</button>
        <button type="button" onClick={generateTournament} disabled={selectedTeams.length !== 16}>Generate Tournament</button>
      </div></div>

      <div className="panel"><div className="panel-header"><h2>Selected Teams ({selectedTeams.length}/16)</h2></div><div className="panel-body team-picker">
        {rankedTeams.map((team) => <label key={team.teamId}><input type="checkbox" checked={selectedTeamIds.includes(team.teamId)} disabled={!selectedTeamIds.includes(team.teamId) && selectedTeamIds.length >= 16} onChange={(e) => setSelectedTeamIds((ids) => e.target.checked ? [...ids, team.teamId] : ids.filter((id) => id !== team.teamId))} /> #{team.ranking} {team.shortName}</label>)}
      </div></div>

      {tournament && <>
        <div className="result-card"><div><span className="muted">Event</span><strong>{tournament.event?.name || 'Tournament'}</strong></div><div><span className="muted">Swiss</span><strong>{tournament.swiss.qualified.length} qualified</strong></div><div><span className="muted">Champion</span><strong>{tournament.champion?.name || 'TBD'}</strong></div></div>

        {!tournament.swiss.complete && <div className="panel"><div className="panel-header"><h2>Swiss Round {tournament.swiss.rounds.length + 1}</h2><button type="button" onClick={simulateSwiss}>Simulate Next Swiss Round</button></div><div className="panel-body match-grid">{nextPairings.map(([a, b]) => <div className="match-card" key={`${a.teamId}-${b.teamId}`}><div className="match-line"><strong>#{a.seed} {a.team.shortName}</strong><span>vs</span><strong>#{b.seed} {b.team.shortName}</strong></div><div className="muted">Record group: {a.wins}-{a.losses} / {b.wins}-{b.losses}</div></div>)}</div></div>}

        {tournament.swiss.rounds.map((round) => <div className="panel" key={round.number}><div className="panel-header"><h2>Swiss Round {round.number} Results</h2></div><div className="panel-body match-grid">{round.matches.map((match) => <MatchCard key={`${round.number}-${match.teamA.teamId}-${match.teamB.teamId}`} match={match} />)}</div></div>)}

        <div className="panel"><div className="panel-header"><h2>Swiss Standings</h2></div><div className="panel-body"><table><thead><tr><th>Team</th><th>Seed</th><th>W-L</th><th>Maps</th><th>Rounds</th><th>Status</th><th>Opponents</th></tr></thead><tbody>{sortStandings(tournament.swiss.standings).map((row) => <tr key={row.teamId}><td>{row.team.name}</td><td>{row.seed}</td><td>{row.wins}-{row.losses}</td><td>{row.mapsWon}-{row.mapsLost}</td><td>{row.roundsWon}-{row.roundsLost}</td><td><span className={`status-${row.status}`}>{row.status}</span></td><td>{row.opponents.length}</td></tr>)}</tbody></table></div></div>

        <div className="grid-2"><div className="panel"><div className="panel-header"><h2>Qualified</h2></div><div className="panel-body">{tournament.swiss.qualified.map((row) => <div className="list-row" key={row.teamId}>#{row.seed} {row.team.name} ({row.wins}-{row.losses})</div>)}</div></div><div className="panel"><div className="panel-header"><h2>Eliminated</h2></div><div className="panel-body">{tournament.swiss.eliminated.map((row) => <div className="list-row" key={row.teamId}>#{row.seed} {row.team.name} ({row.wins}-{row.losses})</div>)}</div></div></div>

        {tournament.swiss.complete && !tournament.playoffs && <button type="button" onClick={makePlayoffs}>Generate Playoffs</button>}
        {tournament.playoffs && <div className="panel"><div className="panel-header"><h2>Playoff Bracket</h2>{!tournament.champion && <button type="button" onClick={simulatePlayoffs}>Simulate Playoffs Round</button>}</div><div className="panel-body bracket-grid">{tournament.playoffs.rounds.map((round) => <div key={round.name}><h3>{round.name}</h3>{round.matches.map((match, index) => match.result ? <MatchCard key={index} match={match.result} /> : <div className="match-card" key={index}>{match.teamA?.shortName || 'TBD'} vs {match.teamB?.shortName || 'TBD'}</div>)}</div>)}</div></div>}
        {tournament.champion && <div className="champion-card">Champion: {tournament.champion.name}</div>}
      </>}

      {history.length > 0 && <div className="panel"><div className="panel-header"><h2>Session Tournament History</h2></div><div className="panel-body"><table><thead><tr><th>Event</th><th>Champion</th><th>Runner-up</th><th>Biggest Upset</th></tr></thead><tbody>{history.map((item, index) => <tr key={index}><td>{item.event?.name}</td><td>{item.champion?.name}</td><td>{item.runnerUp?.name}</td><td>{item.biggestUpset ? `${item.biggestUpset.winner.shortName} upset` : '—'}</td></tr>)}</tbody></table></div></div>}
    </div>
  );
}
