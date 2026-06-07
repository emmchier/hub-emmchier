'use client';

import { useEffect, useState, RefObject } from 'react';
import { Button, ChevronUpIcon } from '@/components';

interface ScrollToTopProps {
  scrollContainer?: RefObject<HTMLElement | null>;
}

export const ScrollToTop = ({ scrollContainer }: ScrollToTopProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    const handleScroll = () => {
      const container = scrollContainer?.current;

      if (container) {
        const scrollY = container.scrollTop || 0;
        const viewportHeight = container.clientHeight;

        // Mostrar cuando se pasa de 100vh (viewportHeight)
        setIsVisible(scrollY > viewportHeight);
      } else {
        // Fallback a window si no hay contenedor
        const scrollY =
          window.scrollY ||
          window.pageYOffset ||
          document.documentElement.scrollTop ||
          document.body.scrollTop ||
          0;
        const viewportHeight = window.innerHeight;

        // Mostrar cuando se pasa de 100vh
        setIsVisible(scrollY > viewportHeight);
      }
    };

    // Pequeño delay para asegurar que el DOM esté listo
    const timeoutId = setTimeout(() => {
      handleScroll();
    }, 100);

    const container = scrollContainer?.current;

    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      window.addEventListener('resize', handleScroll, { passive: true });

      return () => {
        clearTimeout(timeoutId);
        container.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', handleScroll);
      };
    } else {
      window.addEventListener('scroll', handleScroll, { passive: true });
      window.addEventListener('resize', handleScroll, { passive: true });

      return () => {
        clearTimeout(timeoutId);
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', handleScroll);
      };
    }
  }, [scrollContainer]);

  const scrollToTop = () => {
    const container = scrollContainer?.current;

    if (container) {
      container.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    } else {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  };

  return (
    <Button
      ariaLabel="Scroll to top"
      onClick={scrollToTop}
      iconButton
      size="s"
      className={`fixed bottom-4 right-4 z-[101] !w-[32px] !h-[32px] border border-primary-text transition-opacity duration-300 hover:opacity-90 ${
        isMounted && isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      style={{
        backgroundColor: '#173B4F',
      }}
      icon={<ChevronUpIcon color="currentColor" size="md" />}
    />
  );
};
