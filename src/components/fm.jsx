import { crestHue, teamInitials, starRating } from '../utils/fmDerive';

// Procedurally coloured team crest — a shield monogram with a stable hue per team.
export function Crest({ team, size = 34 }) {
  const hue = crestHue(team?.teamId || team?.name || 'x');
  const style = {
    width: size,
    height: size * 1.12,
    fontSize: Math.max(9, size * 0.34),
    background: `linear-gradient(160deg, hsl(${hue} 62% 46%), hsl(${(hue + 40) % 360} 68% 28%))`,
  };
  return (
    <span className="fm-crest" style={style} title={team?.name}>
      {teamInitials(team)}
    </span>
  );
}

// 5-star rating with half-star support. When `potential` is passed, the
// extra headroom is shown as hollow "potential" stars, FM-style.
export function Stars({ value, potential }) {
  const cur = starRating(value);
  const pot = potential != null ? Math.max(starRating(potential), cur) : cur;
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    let cls = 'star-empty';
    if (cur >= i) cls = 'star-full';
    else if (cur >= i - 0.5) cls = 'star-half';
    else if (pot >= i) cls = 'star-pot';
    else if (pot >= i - 0.5) cls = 'star-pot-half';
    stars.push(<i key={i} className={`fm-star ${cls}`} />);
  }
  return <span className="fm-stars" title={potential != null ? `${cur} / ${pot} potential` : `${cur} stars`}>{stars}</span>;
}

// FM-style condition "heart": percentage chip coloured by fitness band.
export function ConditionChip({ value }) {
  const cls = value >= 95 ? 'cond-peak' : value >= 90 ? 'cond-good' : value >= 85 ? 'cond-ok' : 'cond-low';
  return (
    <span className={`fm-cond ${cls}`}>
      <i className="fm-cond-pip" style={{ '--fill': `${value}%` }} />
      {value}%
    </span>
  );
}

export function MoraleChip({ level }) {
  return <span className={`fm-morale ${level.cls}`} title={level.label}><i />{level.label}</span>;
}

export function NatChip({ code }) {
  return <span className="fm-nat">{code}</span>;
}

export function PosBadge({ abbr, cls }) {
  return <span className={`fm-pos ${cls}`}>{abbr}</span>;
}
