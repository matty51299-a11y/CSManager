import { useNavigate } from 'react-router-dom';
import { Crest } from './fm';
import { formatMoney } from '../utils/helpers';

export default function TopBar({ gameState, actions }) {
  const navigate = useNavigate();
  const myTeam = gameState.teams.find((t) => t.teamId === gameState.selectedTeamId);
  const unread = gameState.inboxItems?.length || 0;
  const phase = gameState.currentPhase || 'dashboard';

  let continueLabel = 'Continue';
  let onContinue = () => actions.advanceToNextEvent();
  if (phase === 'event_ready') {
    continueLabel = 'Enter Event';
    onContinue = () => { actions.enterEvent(); navigate('/event-hub'); };
  } else if (phase.startsWith('event_active')) {
    continueLabel = 'Go To Event';
    onContinue = () => navigate('/event-hub');
  } else if (phase === 'season_complete') {
    continueLabel = 'Season Over';
    onContinue = () => navigate('/calendar');
  }

  return (
    <header className="fm-topbar">
      <div className="tb-brand" title="CS Dynasty Manager">CSM</div>
      <div className="tb-team">
        {myTeam && <Crest team={myTeam} size={30} />}
        <div>
          <div className="tb-team-name">{myTeam?.name || 'No Team'}</div>
          <div className="tb-team-sub">{myTeam ? `${myTeam.region} · VRS #${myTeam.currentRank ?? myTeam.ranking ?? '—'}` : 'Select a team'}</div>
        </div>
      </div>
      <div className="tb-mid">
        <span className="tb-chip">Form <b>{myTeam?.formRating ?? '—'}</b></span>
        <span className="tb-chip">VRS Pts <b>{myTeam?.vrsPoints ?? '—'}</b></span>
        <span className="tb-chip">Budget <b>{myTeam ? formatMoney(myTeam.budget) : '—'}</b></span>
        <span className="tb-chip tb-inbox" onClick={() => navigate('/inbox')} title="Inbox">
          ✉ Inbox {unread > 0 && <span className="tb-count">{unread}</span>}
        </span>
      </div>
      <div className="tb-right">
        <div className="tb-date">
          <b>{gameState.currentDateLabel || gameState.currentMonth || '—'}</b>
          <span>{phase.replace(/_/g, ' ')}</span>
        </div>
        <button className="fm-continue" onClick={onContinue}>{continueLabel}</button>
      </div>
    </header>
  );
}
