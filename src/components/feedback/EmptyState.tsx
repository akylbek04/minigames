import { MaterialIcon } from "../icons/MaterialIcon";
import "./empty-state.scss";

interface EmptyStateProps {
  title: string;
  message: string;
  icon?: string;
  action?: { label: string; onClick: () => void };
}

// Shown when a request succeeds but there is nothing to display - a calm,
// neutral placeholder, deliberately unlike the red error banner.
export function EmptyState({ title, message, icon = "search_off", action }: EmptyStateProps) {
  return (
    <div className="empty-state" role="status">
      <MaterialIcon name={icon} className="empty-state__icon" />
      <p className="empty-state__title">{title}</p>
      <p className="empty-state__message">{message}</p>
      {action && (
        <button type="button" className="btn btn--outline" onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  );
}
