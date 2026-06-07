'use client';
import { Button, ChatIcon } from '@/components';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export const ContactButton = () => {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Don't render anything during SSR to avoid hydration mismatch
  if (!isMounted) return null;

  // Solo mostrar en Home Page (ruta raíz)
  if (pathname !== '/') return null;

  return (
    <Button
      ariaLabel=""
      onClick={() => {}}
      size="l"
      className={`fixed bottom-4 right-4 z-[50] bg-secondary-background bg-opacity-50 shadow-lg md:hidden`}
      icon={<ChatIcon color="activated" className="h-[32px] w-[32px]" />}
      iconButton
      rounded
    />
  );
};
