'use client';

import { ReactNode, RefObject, useCallback, useEffect, useState } from 'react';
import { Button, ChevronLeftIcon, ChevronRightIcon } from '@/components';

interface NavLinkTriggerProps {
  navRef: RefObject<HTMLUListElement | null>;
  children?: ReactNode;
  isOverflowing: boolean;
  isNavbarHovered: boolean;
}

export const NavLinkTriggers = ({
  navRef,
  children,
  isOverflowing,
  isNavbarHovered,
}: NavLinkTriggerProps) => {
  const [scrollPosition, setScrollPosition] = useState(0);

  // Moverse a la derecha
  const scrollRight = () => {
    if (navRef.current) {
      const navWidth = navRef.current.offsetWidth;
      navRef.current.scrollBy({
        left: navWidth, // Scroll a la derecha por el ancho visible
        behavior: 'smooth',
      });
    }
  };

  // Moverse a la izquierda
  const scrollLeft = () => {
    if (navRef.current) {
      const navWidth = navRef.current.offsetWidth;
      navRef.current.scrollBy({
        left: -navWidth, // Scroll a la izquierda por el ancho visible
        behavior: 'smooth',
      });
    }
  };

  // Detectar el cambio de scroll
  const handleScroll = useCallback(() => {
    if (navRef.current) {
      const navWidth = navRef.current.offsetWidth;
      const scrollWidth = navRef.current.scrollWidth;
      const scrollLeft = navRef.current.scrollLeft;
      const maxScroll = scrollWidth - navWidth;

      if (scrollLeft === 0) {
        setScrollPosition(0); // Al principio
      } else if (scrollLeft >= maxScroll - 1) {
        setScrollPosition(1); // Al final
      } else {
        setScrollPosition(0.5); // En medio
      }
    }
  }, [navRef]);

  useEffect(() => {
    const navElement = navRef.current; // Guardamos la referencia en una variable local

    // Función para manejar el resize
    const handleResize = () => {
      handleScroll(); // Recalcula el scroll position en resize
    };

    // Agregar el listener de scroll al componente
    if (navElement) {
      navElement.addEventListener('scroll', handleScroll);
    }

    // Agregar el listener de resize
    window.addEventListener('resize', handleResize);

    // Limpiar los listeners cuando el componente se desmonte
    return () => {
      if (navElement) {
        navElement.removeEventListener('scroll', handleScroll);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [handleScroll, navRef]);

  return (
    <>
      {/* Botón Izquierda */}
      {isOverflowing && (
        <Button
          ariaLabel=""
          onClick={scrollLeft}
          size="s"
          icon={<ChevronLeftIcon color="secondary" size="md" />}
          className={`left-0 absolute w-[24px]! h-[56px] md:max-[1265px]:h-[48px] min-[1266px]:h-[72px] bg-gray! opacity-80 hover:opacity-100 soft transform z-50 ${scrollPosition === 0 || isNavbarHovered === false ? 'lg:hidden' : 'lg:flex'} hidden`}
          iconButton
        />
      )}

      {/* Botón Derecha */}
      <div className="flex items-center relative">
        {isOverflowing && (
          <Button
            ariaLabel=""
            onClick={scrollRight}
            size="s"
            state="selected"
            icon={<ChevronRightIcon color="secondary" size="md" />}
            className={`right-0 absolute w-[24px]! h-[56px] md:max-[1265px]:h-[48px] min-[1266px]:h-[72px] bg-gray! opacity-80 hover:opacity-100 soft transform z-50 ${scrollPosition === 1 || scrollPosition === 0.5 || isNavbarHovered === false ? 'lg:hidden' : 'lg:flex'} hidden`}
            iconButton
          />
        )}
        {children}
      </div>
    </>
  );
};
