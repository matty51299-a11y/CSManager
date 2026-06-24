const FALLBACK_EVENTS = [
  { eventId: 'blast_open_s1', name: 'BLAST Open Season 1', eventType: 'BLAST Open', tier: 'B', month: 'January', teams: 8, format: 'gsl_groups_to_playoffs', prizePool: 250000, rankingWeight: 40, regionRestriction: 'Global', inviteMethod: 'VRS Invite', notes: '' },
  { eventId: 'iem_katowice', name: 'IEM Katowice', eventType: 'IEM Championship', tier: 'S', month: 'February', teams: 24, format: 'playin_groups_playoffs', prizePool: 1000000, rankingWeight: 90, regionRestriction: 'Global', inviteMethod: 'VRS Invite + Qualifiers', notes: '' },
  { eventId: 'esl_pro_league_s1', name: 'ESL Pro League Season 1', eventType: 'ESL Pro League', tier: 'A', month: 'March', teams: 32, format: '8_groups_of_4_to_16_playoff', prizePool: 750000, rankingWeight: 75, regionRestriction: 'Global', inviteMethod: 'VRS Invite', notes: '' },
  { eventId: 'major_s1', name: 'Major Championship', eventType: 'Major', tier: 'S+', month: 'May', teams: 24, format: 'major_swiss_to_playoffs', prizePool: 1250000, rankingWeight: 100, regionRestriction: 'Global', inviteMethod: 'VRS Invite + RMR', notes: '' },
];

export default FALLBACK_EVENTS;
