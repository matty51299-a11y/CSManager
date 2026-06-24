import { ACTIVE_MAP_POOL, calculateTeamStrength } from '../../utils/teamStrength';
import { getLiveModel } from '../../utils/liveEventController';

// The overlay model now comes from the format-agnostic live event controller,
// so single-elimination, groups, Swiss and Major events all render from one
// uniform shape instead of a Swiss-only model.
export function getOverlayModel(tournament, gameState) {
  return getLiveModel(tournament, gameState);
}

// Seed of a team in the live field (1-based), falling back to its ranking.
export function teamSeed(team, tournament) {
  if (!team) return 99;
  const idx = (tournament?.teams || []).findIndex((entry) => entry.teamId === team.teamId);
  return idx >= 0 ? idx + 1 : Number(team.ranking || 99);
}

export function bestFinish(tournament, status) {
  if (tournament.champion) return tournament.champion.shortName ? `${tournament.champion.shortName} champion` : 'Event complete';
  if (status === 'Eliminated') return 'Placement locked';
  if (status === 'Waiting') return 'Awaiting entry';
  return 'Champion possible';
}

export function mapPreview(teamA, teamB, gameState) {
  if (!teamA || !teamB) return null;
  const strengths = ACTIVE_MAP_POOL.map((map) => {
    const a = calculateTeamStrength(teamA, gameState.players, gameState.teamMapRatings, map.key);
    const b = calculateTeamStrength(teamB, gameState.players, gameState.teamMapRatings, map.key);
    return { map, a: a.breakdown.mapRating, b: b.breakdown.mapRating, edge: a.breakdown.mapRating - b.breakdown.mapRating };
  }).sort((x, y) => Math.abs(y.edge) - Math.abs(x.edge));
  return {
    teamA: calculateTeamStrength(teamA, gameState.players, gameState.teamMapRatings, strengths[0]?.map.key || 'ancient'),
    teamB: calculateTeamStrength(teamB, gameState.players, gameState.teamMapRatings, strengths[0]?.map.key || 'ancient'),
    maps: strengths,
    projected: strengths.slice(0, 3),
  };
}
