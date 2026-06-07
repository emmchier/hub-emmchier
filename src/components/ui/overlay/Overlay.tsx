'use client';

import { useEffect, useState } from 'react';

interface OverlayProps {
  show: boolean;
  closeOnClickOverlay?: boolean;
  onClose?: () => void;
  blur?: boolean; // Nueva prop para manejar el blur
  className?: string;
}

export const Overlay: React.FC<OverlayProps> = ({
  show,
  closeOnClickOverlay = true,
  onClose,
  blur = false, // Por defecto el blur está desactivado
  className,
}) => {
  const [isClosing, setIsClosing] = useState(false); // Estado para controlar el cierre

  const handleOverlayClick = () => {
    if (closeOnClickOverlay && onClose) {
      setIsClosing(true); // Activa el proceso de cierre
      setTimeout(() => {
        onClose(); // Llama a la función de cierre después de la animación
      }, 300); // Duración de la animación de cierre
    }
  };

  useEffect(() => {
    if (show) {
      setIsClosing(false); // Resetea el estado de cierre cuando se muestra el overlay
    }
  }, [show]);

  // Solo se monta cuando está mostrando o cerrando
  if (!show && !isClosing) return null;

  return (
    <div
      onClick={handleOverlayClick}
      className={[
        'fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 ease-in-out',
        blur ? 'backdrop-blur-sm' : '',
        isClosing ? 'opacity-0' : 'opacity-100',
        className || '',
      ]
        .filter(Boolean)
        .join(' ')}
    />
  );
};
