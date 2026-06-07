'use client';

import { ReactNode } from 'react';
import Sidebar from '@/components/ui/sidebar/Sidebar';
import { WorkData } from '@/interfaces';
import { useUIStore } from '@/store/ui/ui-store';

interface WorkLayoutClientProps {
  collection: WorkData;
  children: ReactNode;
}

export function WorkLayoutClient({
  collection,
  children,
}: WorkLayoutClientProps) {
  const { isSidebarOpen } = useUIStore();
  return (
    <div className="flex w-full min-h-0">
      {/* Sidebar - Solo visible en desktop */}
      <div
        className={[
          'hidden min-[1266px]:block transition-all duration-300 ease-in-out',
          isSidebarOpen ? 'w-[20%]' : 'w-0',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <Sidebar collection={collection} />
      </div>

      {/* Contenido principal */}
      <div
        className={[
          'flex-1 transition-all duration-300 ease-in-out',
          isSidebarOpen ? 'min-[1266px]:w-[80%]' : 'w-full',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {children}
      </div>
    </div>
  );
}
