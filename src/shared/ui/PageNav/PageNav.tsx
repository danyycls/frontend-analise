import { useState, useEffect, useCallback } from 'react';
import './PageNav.css';

interface Section {
  id: string;
  label: string;
}

interface PageNavProps {
  sections: Section[];
  position?: 'left' | 'right';
}

export default function PageNav({ sections, position = 'right' }: PageNavProps) {
  const [active, setActive] = useState(sections.length > 0 ? sections[0].id : '');

  useEffect(() => {
    const ids = sections.map((s) => s.id);
    const elements = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActive(visible[0].target.id);
        }
      },
      { rootMargin: '-15% 0px -70% 0px', threshold: 0 },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sections]);

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  return (
    <nav className={`page-nav page-nav-${position}`}>
      {sections.map((section) => (
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
