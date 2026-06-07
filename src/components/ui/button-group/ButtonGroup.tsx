'use client';
import { ReactNode } from 'react';

interface ButtonGroupProps {
  children: ReactNode;
}

export const ButtonGroup = ({ children }: ButtonGroupProps) => {
  return <ul className="flex border border-[#2F506B]">{children}</ul>;
};
