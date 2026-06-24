import { formatMoney } from '../../utils/helpers';
export default function EventPlacementsPanel({ tournament, model, summary }) {
  const prize = Number(tournament.event.prizePool || 0);
  return <div className="overlay-panel compact"><h3>Placements / Prize</h3><div className="prize-row"><span>Champion reward</span><b>{formatMoney(Math.round(prize * 0.4))}</b></div><div className="prize-row"><span>Runner-up</span><b>{formatMoney(Math.round(prize * 0.18))}</b></div><div className="prize-row"><span>Semi-finalists</span><b>{formatMoney(Math.round(prize * 0.08))}</b></div><div className="prize-row user"><span>Your finish</span><b>{summary ? `${summary.userRecord.wins}-${summary.userRecord.losses}` : model.status}</b></div>{tournament.champion && <div className="champion-stamp">Champion: {tournament.champion.name}</div>}</div>;
}
