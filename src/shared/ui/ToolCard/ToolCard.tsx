import { type ReactNode } from 'react';
import './ToolCard.css';

interface ToolCardProps {
  icon?: string;
  title?: string | ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
  onClick?: () => void;
}

export default function ToolCard({ icon, title, children, className = '', id, onClick }: ToolCardProps) {
  return (
    <div className={`tool-card ${className}`} id={id} onClick={onClick}>
      {icon && <div className="tool-card-icon">{icon}</div>}
      {title && <h3 className="tool-card-title">{title}</h3>}
      <div className="tool-card-body">{children}</div>
    </div>
  );
}
