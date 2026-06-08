import type { HistoryItem } from "../hooks/useHistory";

interface HistoryPanelProps {
  history: HistoryItem[];
  showHistory: boolean;
  setShowHistory: (val: boolean) => void;
  onStumble?: () => void;
}

export function HistoryPanel({
  history,
  showHistory,
  setShowHistory,
  onStumble,
}: HistoryPanelProps) {
  return (
    <div className="history-section">
      <button
        className="btn secondary history-toggle"
        onClick={() => setShowHistory(!showHistory)}
      >
        {showHistory ? "🔽 Hide History" : "📋 View History"} ({history.length})
      </button>
      {showHistory && (
        <div className="history-panel">
          {history.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📜</div>
              <h3>No history yet</h3>
              <p>
                Your journey has just begun. Stumble and rate to see your path.
              </p>
              <button className="btn-primary" onClick={onStumble}>
                Explore now
              </button>
            </div>
          ) : (
            <ul className="history-list">
              {history.slice(0, 10).map((item) => (
                <li key={item.timestamp.toString()} className="history-item">
                  <span className="history-rating">
                    {item.rating_val === "like" ? "👍" : "👎"}
                  </span>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="history-url"
                  >
                    {item.title || item.url}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
