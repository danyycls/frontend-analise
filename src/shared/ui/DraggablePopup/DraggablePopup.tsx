import { useState, useRef, type ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './DraggablePopup.css';

interface DraggablePopupProps {
  titulo: string;
  onFechar: () => void;
  children: ReactNode;
}

export default function DraggablePopup({ titulo, onFechar, children }: DraggablePopupProps) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [centered, setCentered] = useState(true);
  const dragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = popupRef.current;
    if (el && centered) {
      const w = Math.min(640, window.innerWidth - 32);
      const h = Math.min(480, window.innerHeight - 32);
      setPos({
        x: (window.innerWidth - w) / 2,
        y: (window.innerHeight - h) / 2,
      });
      setCentered(false);
    }
  }, [centered]);

  function onMouseDown(e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest('.draggable-popup-close')) return;
    dragging.current = true;
    dragOffset.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    };
  }

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!dragging.current) return;
      setPos({
        x: e.clientX - dragOffset.current.x,
        y: e.clientY - dragOffset.current.y,
      });
    }
    function onMouseUp() {
      dragging.current = false;
    }
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  return createPortal(
    <div className="draggable-popup-overlay" onClick={onFechar}>
      <div
        ref={popupRef}
        className="draggable-popup"
        style={{ left: pos.x, top: pos.y }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="draggable-popup-header" onMouseDown={onMouseDown}>
          <span className="draggable-popup-titulo">{titulo}</span>
          <button className="draggable-popup-close" onClick={onFechar}>✕</button>
        </div>
        <div className="draggable-popup-body">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
