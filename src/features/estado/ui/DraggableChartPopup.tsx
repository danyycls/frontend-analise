import { useState, useEffect, useCallback, useRef } from 'react';
import { PieChart, CHART_SIZE_LG } from './chart-utils';

interface DraggableChartPopupProps {
  titulo: string;
  data: { nome: string; valor: number }[];
  onFechar: () => void;
}

export function DraggableChartPopup({ titulo, data, onFechar }: DraggableChartPopupProps) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, origX: 0, origY: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y };
  }, [pos]);

  useEffect(() => {
    if (!dragging) return;
    const handleMove = (e: MouseEvent) => {
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      setPos({ x: dragRef.current.origX + dx, y: dragRef.current.origY + dy });
    };
    const handleUp = () => setDragging(false);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [dragging]);

  return (
    <div className="dm-modal-overlay" onClick={onFechar} style={{ alignItems: 'center' }}>
      <div
        className="dm-modal chart-popup-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 560, transform: `translate(${pos.x}px, ${pos.y}px)`, cursor: dragging ? 'grabbing' : 'default' }}
      >
        <div className="dm-modal-header" onMouseDown={handleMouseDown} style={{ cursor: 'grab', userSelect: 'none' }}>
          <h3>{titulo} <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 400 }}>(arraste para mover)</span></h3>
          <button className="dm-modal-close" onClick={onFechar}>×</button>
        </div>
        <div className="dm-modal-body" style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
          <PieChart data={data} size={CHART_SIZE_LG} />
        </div>
      </div>
    </div>
  );
}
