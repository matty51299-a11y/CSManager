// Event Invite Engine
// Decides which teams are invited to an event using the live VRS rankings.
// The number of invites comes from the event's format:
//   8-team events  -> top 8
//   16-team events -> top 16
//   24-team events -> top 24
//   32-team events -> top 32 (Majors invite the top 32 for now)
//
// The invite list is captured as a snapshot when the event starts so the
// field never changes once the event is live.

import { getRankingRows } from './vrsRankingEngine.js';
import { getEventFormat } from './eventFormatEngine.js';

// Build the invite snapshot for an event from the current rankings.
export function buildInviteSnapshot(event, rankings = [], teams = []) {
  const format = getEventFormat(event);
  const count = Math.min(format.inviteCount || 0, rankings.length);
  const rows = getRankingRows(rankings, teams).slice(0, count);
  return {
    eventId: event.eventId,
    formatType: format.formatType,
    generatedAt: event.startDate,
    teamCount: format.teamCount,
    cutoffRank: count,
    cutoffPoints: rows[count - 1]?.vrsPoints || 0,
    invitees: rows.map((row, index) => ({
      teamId: row.teamId,
      shortName: row.shortName,
      name: row.name,
      seed: index + 1,
      rank: row.currentRank,
      vrsPoints: row.vrsPoints,
    })),
  };
}

// Work out a team's invite status for an event (used by the event modal).
export function getInviteStatus(event, rankings, teams, teamId, existingSnapshot = null) {
  const snapshot = existingSnapshot || buildInviteSnapshot(event, rankings, teams);
  const invite = snapshot.invitees.find((row) => row.teamId === teamId);
  const rank = getRankingRows(rankings, teams).find((row) => row.teamId === teamId)?.currentRank || 999;
  const projectedSeed = invite ? invite.seed : (rank <= snapshot.cutoffRank ? rank : null);
  return {
    snapshot,
    invited: Boolean(invite),
    seed: invite?.seed || null,
    projectedSeed,
    cutoffRank: snapshot.cutoffRank,
    cutoffPoints: snapshot.cutoffPoints,
    teamCount: snapshot.teamCount,
    userRank: rank,
    reason: invite
      ? `Invited as seed #${invite.seed}.`
      : `Your VRS rank is #${rank} and this event invites the top ${snapshot.cutoffRank}.`,
    placesNeeded: invite ? 0 : Math.max(0, rank - snapshot.cutoffRank),
  };
}

// Return the invited teams (full team objects) for a snapshot.
export function snapshotTeams(snapshot, teams = []) {
  const byId = new Map(teams.map((team) => [team.teamId, team]));
  return snapshot.invitees
    .map((invite, index) => {
      const team = byId.get(invite.teamId);
      return team ? { ...team, seed: index + 1, eventRank: invite.rank } : null;
    })
    .filter(Boolean);
}
