import { Crest, MapThumb } from './fm';

// Horizontal veto card strip: one card per veto step, each with a map
// thumbnail, the acting team's crest overlaid on bans/picks, and a
// BAN / PICK / DECIDER label. A step with no mapKey renders as an empty
// "+" placeholder (e.g. an unresolved decider slot).
export default function MapVetoStrip({ steps = [], teamA, teamB }) {
  if (!steps.length) return null;
  const teamFor = (teamId) => (teamId === teamA?.teamId ? teamA : teamId === teamB?.teamId ? teamB : null);

  return (
    <div className="veto-strip">
      {steps.map((s, i) => {
        const team = teamFor(s.teamId);
        if (!s.mapKey) {
          return (
            <div className="veto-card veto-empty" key={`empty-${i}`}>
              <div className="veto-plus">+</div>
              <div className={`veto-label veto-${s.action}`}>{s.action}</div>
            </div>
          );
        }
        return (
          <div className={`veto-card veto-${s.action}`} key={`${s.action}-${s.mapKey}-${i}`}>
            <div className="veto-thumb">
              <MapThumb mapKey={s.mapKey} mapName={s.mapName} width={104} height={128} label={false} />
              {team && <span className="veto-crest"><Crest team={team} size={26} /></span>}
              <span className="veto-mapname">{s.mapName}</span>
            </div>
            <div className={`veto-label veto-label-${s.action}`}>{s.action}</div>
          </div>
        );
      })}
    </div>
  );
}
