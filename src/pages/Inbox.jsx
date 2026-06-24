export default function Inbox({ gameState }) {
  return <div><div className="page-header"><h1>Inbox</h1><div className="subtitle">Career news, invites and match reports.</div></div><div className="panel"><div className="panel-body news-feed">{gameState.inboxItems.length === 0 ? <div className="muted">No messages yet.</div> : gameState.inboxItems.map((n)=><div className="news-item" key={n.id}><strong>{n.title}</strong><span>Week {n.week} · {n.type}</span><p>{n.body}</p></div>)}</div></div></div>;
}
