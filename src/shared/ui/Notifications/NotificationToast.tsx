import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearchNotification } from './SearchNotificationProvider';
import './NotificationToast.css';

export function NotificationToast() {
  const { notifications, dismiss } = useSearchNotification();
  const navigate = useNavigate();

  const latest = notifications[notifications.length - 1] || null;

  useEffect(() => {
    if (!latest || latest.status === 'pending') return;
    const timer = setTimeout(() => dismiss(latest.id), 10000);
    return () => clearTimeout(timer);
  }, [latest, dismiss]);

  const handleClick = useCallback(() => {
    if (latest && latest.status !== 'pending') {
      dismiss(latest.id);
      navigate(latest.route);
    }
  }, [latest, dismiss, navigate]);

  if (!latest) return null;

  const statusClass = latest.status === 'error' ? ' error' : '';

  return (
    <div
      className={`notification-toast${statusClass}`}
      onClick={handleClick}
    >
      {latest.status === 'pending' && <div className="notification-toast-icon pending" />}
      {latest.status === 'success' && <span className="notification-toast-icon success">✓</span>}
      {latest.status === 'error' && <span className="notification-toast-icon error">✕</span>}
      <div className="notification-toast-body">
        <div className="notification-toast-label">{latest.label}</div>
        <div className="notification-toast-status">
          {latest.status === 'pending' && 'Busca em andamento...'}
          {latest.status === 'success' && 'Busca concluída'}
          {latest.status === 'error' && (latest.error || 'Erro na busca')}
        </div>
      </div>
      {latest.status !== 'pending' && (
        <span className="notification-toast-action">
          Ver resultado
        </span>
      )}
      <button
        className="notification-toast-dismiss"
        onClick={(e) => { e.stopPropagation(); dismiss(latest.id); }}
      >
        ×
      </button>
    </div>
  );
}