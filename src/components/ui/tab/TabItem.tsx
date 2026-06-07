import { ReactNode } from 'react';

export interface TabItemProps {
  label: string;
  icon?: React.ReactNode; // Icono opcional
  count?: number; // Contador opcional para mostrar junto al label
  children?: ReactNode; // Contenido del tab (puede ser cualquier tipo de contenido)
}

export const TabItem: React.FC<TabItemProps> = ({ children }) => {
  return <>{children}</>; // Solo renderiza los hijos que se le pasan
};
