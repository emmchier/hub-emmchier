'use client';

import { ReactNode } from 'react';
import { Button, Tooltip } from '@/components';

export interface ButtonGroupItemProps {
  id: string;
  icon: ReactNode;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
  tooltipContent?: string;
  tooltipDirection?: 'top' | 'right' | 'bottom' | 'left' | undefined;
  tooltipEnabled?: boolean; // Nueva prop para habilitar/deshabilitar Tooltip
}

export const ButtonGroupItem = ({
  icon,
  onClick,
  selected,
  tooltipContent = '',
  tooltipDirection = 'top',
  tooltipEnabled = true, // Valor por defecto: true
}: ButtonGroupItemProps) => {
  // Clases determinísticas sin clsx
  const baseClasses =
    'flex items-center justify-center transition-colors duration-200';
  const sizeClasses = 'w-[32px] h-[32px]';
  const selectedClasses = selected
    ? 'bg-secondary-background-hover pointer-events-none'
    : '';
  const textClasses = !selected ? 'text-primary-text' : '';

  const finalClassName = [
    baseClasses,
    sizeClasses,
    selectedClasses,
    textClasses,
  ]
    .filter(Boolean)
    .join(' ');

  const button = (
    <li>
      <Button
        ariaLabel=""
        onClick={onClick}
        state={selected ? 'selected' : 'enabled'}
        className={finalClassName}
        size="s"
        iconButton
        icon={icon}
      />
    </li>
  );

  // Si tooltipEnabled es false, solo renderizamos el botón sin Tooltip
  if (!tooltipEnabled || !tooltipContent) {
    return button;
  }

  return (
    <Tooltip content={tooltipContent} direction={tooltipDirection}>
      {button}
    </Tooltip>
  );
};
