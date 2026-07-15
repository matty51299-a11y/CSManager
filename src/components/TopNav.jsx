import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Crest } from './fm';
import { formatMoney } from '../utils/helpers';

// Primary navigation sections. Each section owns a set of routes (used to
// decide which section is "active" and which secondary tabs to show) and a
// dropdown of destinations. Routes may appear in more than one dropdown, but
// `owns` decides the active-section highlight + secondary strip.
const SECTIONS = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    home: '/',
    owns: ['/', '/calendar'],
    items: [['/', 'Overview'], ['/calendar', 'Schedule']],
    tabs: [['/', 'Overview'], ['/calendar', 'Schedule']],
  },
  {
    key: 'team',
    label: 'My Team',
    home: '/roster',
    owns: ['/roster', '/players'],
    items: [['/roster', 'Squad'], ['/players', 'Players']],
    tabs: [['/roster', 'Squad'], ['/players', 'Players']],
  },
  {
    key: 'ingame',
    label: 'In-Game',
    home: '/match-centre',
    owns: ['/match-centre', '/tournament-centre', '/event-hub'],
    items: [['/match-centre', 'Match Centre'], ['/tournament-centre', 'Sandbox'], ['/event-hub', 'Event Hub']],
    tabs: [['/match-centre', 'Match Centre'], ['/tournament-centre', 'Sandbox']],
  },
  {
    key: 'transfers',
    label: 'Transfers',
    home: '/transfers',
    owns: ['/transfers'],
    items: [['/transfers', 'Overview']],
    tabs: [['/transfers', 'Overview']],
  },
  {
    key: 'news',
    label: 'HLTV News',
    home: '/inbox',
    owns: ['/inbox'],
    items: [['/inbox', 'Latest']],
    tabs: [['/inbox', 'Latest']],
  },
  {
    key: 'stats',
    label: 'Statistics',
    home: '/rankings',
    owns: ['/rankings', '/teams', '/tournaments', '/diagnostics'],
    items: [['/rankings', 'Rankings'], ['/teams', 'Teams'], ['/diagnostics', 'Diagnostics']],
    tabs: [['/rankings', 'Rankings'], ['/teams', 'Teams'], ['/diagnostics', 'Diagnostics']],
  },
];

function sectionForPath(pathname) {
  // Most-specific prefix wins: '/teams/x' -> stats via '/teams'.
  let best = SECTIONS[0];
  let bestLen = -1;
  for (const section of SECTIONS) {
    for (const owned of section.owns) {
      const matches = owned === '/' ? pathname === '/' : pathname === owned || pathname.startsWith(`${owned}/`);
      if (matches && owned.length > bestLen) {
        best = section;
        bestLen = owned.length;
      }
    }
  }
  return best;
}

export default function TopNav({ gameState, actions }) {
  const navigate = useNavigate();
  const location = useLocation();

  const myTeam = gameState.teams.find((t) => t.teamId === gameState.selectedTeamId);
  const unread = gameState.inboxItems?.length || 0;
  const phase = gameState.currentPhase || 'dashboard';
  const activeSection = sectionForPath(location.pathname);

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
    <header className="fm-nav">
      <div className="fm-nav-primary">
        <div className="fn-brand" title="CS Dynasty Manager">CSM</div>
        <div className="fn-team">
          {myTeam && <Crest team={myTeam} size={30} />}
          <div>
            <div className="fn-team-name">{myTeam?.name || 'No Team'}</div>
            <div className="fn-team-sub">{myTeam ? `${myTeam.region} · VRS #${myTeam.currentRank ?? myTeam.ranking ?? '—'}` : 'Select a team'}</div>
          </div>
        </div>

        <nav className="fn-menu">
          {SECTIONS.map((section) => {
            const isActive = section.key === activeSection.key;
            const hasMenu = section.items.length > 1;
            return (
              <div key={section.key} className={`fn-item ${isActive ? 'active' : ''} ${hasMenu ? 'has-menu' : ''}`}>
                <button type="button" className="fn-item-btn" onClick={() => navigate(section.home)}>
                  {section.label}
                  {hasMenu && <span className="fn-caret">⌄</span>}
                </button>
                {hasMenu && (
                  <div className="fn-drop">
                    {section.items.map(([to, label]) => (
                      <button key={to} type="button" className="fn-drop-link" onClick={() => navigate(to)}>
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="fn-right">
          <span className="fn-chip">Form <b>{myTeam?.formRating ?? '—'}</b></span>
          <span className="fn-chip">VRS <b>{myTeam?.vrsPoints ?? '—'}</b></span>
          <span className="fn-chip">Budget <b>{myTeam ? formatMoney(myTeam.budget) : '—'}</b></span>
          <button type="button" className="fn-chip fn-inbox" onClick={() => navigate('/inbox')} title="Inbox">
            ✉{unread > 0 && <span className="fn-count">{unread}</span>}
          </button>
          <div className="fn-date">
            <b>{gameState.currentDateLabel || gameState.currentMonth || '—'}</b>
            <span>{phase.replace(/_/g, ' ')}</span>
          </div>
          <button type="button" className="fn-continue" onClick={onContinue}>{continueLabel}</button>
        </div>
      </div>

      <div className="fm-nav-secondary">
        <span className="fn-sec-label">{activeSection.label}</span>
        {activeSection.tabs.map(([to, label]) => (
          <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `fn-tab ${isActive ? 'active' : ''}`}>
            {label}
          </NavLink>
        ))}
      </div>
    </header>
  );
}
