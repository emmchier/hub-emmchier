import { useState, useEffect } from 'react';

export const useScrollDirection = () => {
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(
    null
  );
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    const handleScroll = () => {
      // Usar window.scrollY como fallback si document.body.scrollTop no está disponible
      const currentScrollY =
        document.body.scrollTop ||
        document.documentElement.scrollTop ||
        window.scrollY ||
        0;

      // Calcular si estamos cerca del bottom (dentro de 100px)
      const scrollHeight =
        document.documentElement.scrollHeight ||
        document.body.scrollHeight ||
        0;
      const clientHeight =
        document.documentElement.clientHeight || window.innerHeight || 0;
      const isNearBottom = scrollHeight - currentScrollY - clientHeight < 100;

      // Si estamos cerca del bottom, no cambiar la dirección para evitar el "batido"
      if (isNearBottom) {
        return;
      }

      if (currentScrollY > lastScrollY && currentScrollY > 10) {
        setScrollDirection('down');
      } else if (currentScrollY < lastScrollY) {
        setScrollDirection('up');
      }

      setLastScrollY(currentScrollY);
    };

    // Usar window en lugar de document.body para mejor compatibilidad
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return isMounted ? scrollDirection : null;
};
