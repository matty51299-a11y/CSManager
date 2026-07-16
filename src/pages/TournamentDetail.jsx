import { useParams, Link } from 'react-router-dom';
import { tierBadgeClass, formatMoney } from '../utils/helpers';
import { formatDate } from '../utils/calendarDates';
import { Crest } from '../components/fm';

const STAGE_LABEL = {
  group: 'Group Stage', swiss: 'Swiss', roundOf32: 'Round of 32', roundOf16: 'Round of 16',
  quarterfinal: 'Quarterfinal', semifinal: 'Semifinal', final: 'Final', upper: 'Upper', lower: 'Lower',
  lowerFinal: 'Lower Final', grandFinal: 'Grand Final',
};

function StageTracker({ stages = [], currentStage, complete }) {
  if (!stages.length) return null;
  const activeIndex = complete ? stages.length : stages.indexOf(currentStage);
  return (
    <div className="stage-tracker">
      {stages.map((s, i) => (
        <span key={s} className={`stage-chip ${i === activeIndex ? 'active' : i < activeIndex ? 'done' : ''}`}>{STAGE_LABEL[s] || s}</span>
      ))}
      <span className={`stage-chip ${complete ? 'done' : ''}`}>Champion</span>
    </div>
  );
}

function MatchRow({ fixture, teamById, userTeamId }) {
  const a = teamById.get(fixture.teamAId);
  const b = teamById.get(fixture.teamBId);
  const done = fixture.result;
  const [sa, sb] = String(done?.seriesScore || '').split('-');
  const winId = done?.winner?.teamId;
  const isUser = [fixture.teamAId, fixture.teamBId].includes(userTeamId);
  return (
    <div className={`bd-match ${isUser ? 'is-user' : ''}`}>
      <div className={`bd-team ${winId === a?.teamId ? 'win' : done ? 'lose' : ''}`}>
        {a ? <><Crest team={a} size={16} /><span>{a.shortName}</span></> : <span className="muted">TBD</span>}
        <b>{done ? sa : ''}</b>
      </div>
      <div className={`bd-team ${winId === b?.teamId ? 'win' : done ? 'lose' : ''}`}>
        {b ? <><Crest team={b} size={16} /><span>{b.shortName}</span></> : <span className="muted">TBD</span>}
        <b>{done ? sb : ''}</b>
      </div>
    </div>
  );
}

export default function TournamentDetail({ gameState }) {
  const { tournamentId } = useParams();
  const event = gameState.events.find((e) => e.eventId === tournamentId);
  if (!event) return <div className="panel"><div className="panel-body">Event not found.</div></div>;

  const userTeamId = gameState.selectedTeamId;
  const teamById = new Map(gameState.teams.map((t) => [t.teamId, t]));
  const tournament = gameState.tournaments?.[tournamentId];
  const fixtures = (gameState.fixtures || []).filter((f) => f.tournamentId === tournamentId);
  const format = tournament?.format;
  const championTeam = tournament?.champion ? teamById.get(tournament.champion) : null;

  // Bracket = non-group fixtures grouped by stage, in the format's stage order.
  const stageOrder = format?.stages || ['roundOf32', 'roundOf16', 'quarterfinal', 'semifinal', 'final'];
  const bracketStages = stageOrder
    .filter((s) => s !== 'group' && s !== 'swiss')
    .map((stage) => ({ stage, matches: fixtures.filter((f) => f.stageId === stage) }))
    .filter((col) => col.matches.length > 0);
  const groupTables = tournament?.groupTables ? Object.values(tournament.groupTables) : [];

  return (
    <div className="tournament-detail">
      <div className="page-header">
        <h1>{event.name}</h1>
        <div className="subtitle">
          <span className={tierBadgeClass(event.tier)}>{event.tier}</span> · {(event.format || '').replace(/_/g, ' ')} · {formatDate(event.startDate)} – {formatDate(event.endDate)} · {formatMoney(event.prizePool)}
        </div>
      </div>

      {format && (
        <div className="panel">
          <div className="panel-header"><h2>Stage Progress</h2><span className="muted">{tournament.champion ? 'Complete' : STAGE_LABEL[tournament.currentStage] || tournament.currentStage}</span></div>
          <div className="panel-body"><StageTracker stages={stageOrder} currentStage={tournament.currentStage} complete={!!tournament.champion} /></div>
        </div>
      )}

      {championTeam && (
        <div className="champion-card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Crest team={championTeam} size={38} /> {championTeam.name} — Champion
        </div>
      )}

      {groupTables.length > 0 && (
        <div className="panel">
          <div className="panel-header"><h2>Group Stage</h2></div>
          <div className="panel-body group-grid">
            {groupTables.map((table) => (
              <div className="group-card" key={table.groupId}>
                <h3>Group {table.groupId}</h3>
                {table.rows.map((r) => {
                  const team = teamById.get(r.teamId);
                  return (
                    <div key={r.teamId} className={`group-row ${r.teamId === userTeamId ? 'is-user' : ''} ${r.qualificationStatus === 'qualified' ? 'qualified' : r.qualificationStatus === 'eliminated' ? 'eliminated' : ''}`}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><b style={{ color: 'var(--fm-text-3)' }}>{r.position || '-'}</b><Crest team={team} size={14} />{team?.shortName}</span>
                      <strong>{r.wins}-{r.losses}</strong>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {bracketStages.length > 0 && (
        <div className="panel">
          <div className="panel-header"><h2>Playoff Bracket</h2></div>
          <div className="panel-body bracket-detail-grid">
            {bracketStages.map((col) => (
              <div className="bracket-detail-col" key={col.stage}>
                <h3>{STAGE_LABEL[col.stage] || col.stage}</h3>
                {col.matches.map((f) => <MatchRow key={f.id} fixture={f} teamById={teamById} userTeamId={userTeamId} />)}
              </div>
            ))}
          </div>
        </div>
      )}

      {fixtures.length === 0 && (
        <div className="panel"><div className="panel-header"><h2>Fixtures</h2></div><div className="panel-body"><p className="muted">Fixtures will be generated when the event begins.</p></div></div>
      )}

      <div style={{ marginTop: 12 }}>
        <Link to="/fixtures">← Back to Fixtures</Link>
      </div>
    </div>
  );
}
