import { useState, useEffect, useCallback } from 'react';
import MapaBrasil from '@/features/estado/ui/MapaBrasil';

const PAGE_SECTIONS = [
  { id: 'mapa-container', label: 'Mapa' },
];

function PageNav() {
  const [active, setActive] = useState('mapa-container');

  useEffect(() => {
    const el = document.getElementById('mapa-container');
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setActive('mapa-container');
        }
      },
      { rootMargin: '-15% 0px -70% 0px', threshold: 0 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  return (
    <nav className="estado-page-nav">
      {PAGE_SECTIONS.map((section) => (
        <button
          key={section.id}
          className={`page-nav-item ${active === section.id ? 'active' : ''}`}
          onClick={() => scrollTo(section.id)}
        >
          <span className="page-nav-dot" />
          <span>{section.label}</span>
        </button>
      ))}
    </nav>
  );
}

export default function EstadoPage() {
  return (
    <div className="tab-page">
      <PageNav />
      <MapaBrasil />
    </div>
  );
}
