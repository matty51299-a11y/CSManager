import { crestHue, teamInitials, starRating } from '../utils/fmDerive';
import { countryToFlag } from './flags';

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

// Procedural player-photo placeholder — a head/shoulders silhouette on a
// stable per-player gradient, the same idea as Crest but round and portrait.
export function PlayerAvatar({ player, size = 40 }) {
  const hue = crestHue(player?.playerId || player?.gamertag || 'p');
  const style = {
    width: size,
    height: size,
    background: `linear-gradient(160deg, hsl(${hue} 46% 34%), hsl(${(hue + 30) % 360} 42% 18%))`,
  };
  return (
    <span className="fm-avatar" style={style} title={player?.gamertag}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 12.4c2.7 0 4.9-2.3 4.9-5.1S14.7 2.2 12 2.2 7.1 4.5 7.1 7.3 9.3 12.4 12 12.4Zm0 2.2c-3.6 0-9 1.9-9 5.5V22h18v-1.9c0-3.6-5.4-5.5-9-5.5Z" />
      </svg>
    </span>
  );
}

// Emoji flag keyed by country name or ISO code.
export function Flag({ country, size = 14, title }) {
  const { emoji } = countryToFlag(country);
  return <span className="fm-flag" style={{ fontSize: size }} title={title || country}>{emoji}</span>;
}

// Nationality chip: flag + code. Accepts a raw country name/code.
export function NatChip({ code, country }) {
  const value = country ?? code;
  const { emoji, code: iso } = countryToFlag(value);
  return <span className="fm-nat"><span className="fm-nat-flag">{emoji}</span>{iso}</span>;
}

// Procedural, non-trademarked map thumbnail — a stable gradient + a light
// abstract "layout" motif per map. No real map imagery.
export function MapThumb({ mapKey, mapName, width = 92, height = 56, label = true }) {
  const seed = mapKey || mapName || 'map';
  const hue = crestHue(seed);
  const style = {
    width,
    height,
    background: `linear-gradient(150deg, hsl(${hue} 40% 26%), hsl(${(hue + 50) % 360} 45% 12%))`,
  };
  return (
    <span className="fm-mapthumb" style={style} title={mapName}>
      <svg viewBox="0 0 100 60" preserveAspectRatio="none" aria-hidden="true">
        <path d="M10 40 L34 40 L42 24 L64 24 L72 42 L92 42" />
        <rect x="30" y="34" width="16" height="12" />
        <rect x="58" y="18" width="14" height="12" />
      </svg>
      {label && <em>{mapName}</em>}
    </span>
  );
}

// Weapon icon from the inline sprite (see WeaponSprite, mounted at app root;
// public/weapon-icons.svg mirrors it as a standalone asset). `side` tints it
// (ct / t) for round-history strips.
export function WeaponIcon({ name = 'rifle', size = 18, side }) {
  return (
    <svg className={`fm-weapon ${side ? `wep-${side}` : ''}`} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <use href={`#wep-${name}`} />
    </svg>
  );
}

export function PosBadge({ abbr, cls }) {
  return <span className={`fm-pos ${cls}`}>{abbr}</span>;
}
