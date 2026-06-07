'use client';

import { useState, useEffect, useRef, ReactNode } from 'react';
import { useUIStore } from '@/store/ui/ui-store';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface ListItem {
  value: string;
  label: string;
  icon?: ReactNode;
  onClick?: () => void;
  className?: string;
}

interface DropdownProps {
  trigger: ReactNode;
  content?: 'list' | 'custom';
  listItems?: ListItem[];
  menuWidth?: string;
  menuAlignment?: 'bottomLeft' | 'bottomRight' | 'topLeft' | 'topRight';
  showIcons?: boolean;
  openBy?: 'click' | 'hover';
  children?: ReactNode;
  className?: string;
  iconPosition?: 'left' | 'right';
  closeOnItemClick?: boolean;
}

export const Dropdown = ({
  trigger,
  content = 'list',
  listItems = [],
  menuWidth = 'w-auto',
  menuAlignment = 'bottomLeft',
  showIcons = false,
  openBy = 'hover',
  children,
  className,
  iconPosition = 'left',
  closeOnItemClick = true,
}: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { openBottomSheet } = useUIStore();
  /** Viewport &lt; lg: use bottom sheet on explicit click only (no hover → sheet on resize). */
  const isNarrowViewport = useMediaQuery('(max-width: 1023px)');

  const toggleMenu = () => {
    if (isNarrowViewport) {
      openBottomSheet({
        mode: 'list',
        listItems: listItems,
      });
      return;
    }
    setIsOpen((prev) => !prev);
    setHighlightedIndex(-1);
  };

  const openMenu = () => {
    if (isNarrowViewport) {
      openBottomSheet({
        mode: 'list',
        listItems: listItems,
      });
      return;
    }
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node)
    ) {
      setIsOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev: number) => {
        if (prev === -1) return 0;
        return (prev + 1) % listItems.length;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev: number) => {
        if (prev <= 0) return listItems.length - 1;
        return (prev - 1) % listItems.length;
      });
    } else if (e.key === 'Enter') {
      if (isOpen) {
        if (highlightedIndex >= 0) {
          const selectedItem = listItems[highlightedIndex];
          if (selectedItem.onClick) {
            selectedItem.onClick();
          }
          setIsOpen(false);
        }
      } else {
        openMenu();
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const triggerEvents =
    openBy === 'hover' && !isNarrowViewport
      ? {
          onMouseEnter: openMenu,
          onMouseLeave: (e: React.MouseEvent<HTMLDivElement>) => {
            const target = e.relatedTarget as Node | null;
            if (target && !dropdownRef.current?.contains(target)) {
              closeMenu();
            }
          },
          onKeyDown: handleKeyDown,
          tabIndex: 0,
        }
      : {
          onClick: toggleMenu,
          onKeyDown: handleKeyDown,
          tabIndex: 0,
        };

  const handleMenuMouseLeave = (e: React.MouseEvent) => {
    const target = e.relatedTarget;
    if (
      target instanceof Node &&
      dropdownRef.current &&
      !dropdownRef.current.contains(target)
    ) {
      closeMenu();
    }
  };

  const isBottomAligned =
    menuAlignment === 'bottomLeft' || menuAlignment === 'bottomRight';
  const isTopAligned =
    menuAlignment === 'topLeft' || menuAlignment === 'topRight';

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <div {...triggerEvents} className="cursor-pointer">
        {trigger}
      </div>

      {isOpen && !isNarrowViewport && (isBottomAligned || isTopAligned) && (
        <div
          onMouseEnter={openMenu}
          onMouseLeave={handleMenuMouseLeave}
          className={[
            'absolute left-0 right-0 h-1',
            isBottomAligned ? 'top-full' : '',
            isTopAligned ? 'bottom-full' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        />
      )}

      {isOpen && !isNarrowViewport && (
        <div
          onMouseEnter={openMenu}
          onMouseLeave={handleMenuMouseLeave}
          className={[
            'absolute z-50 border border-primary-text bg-primary-background-hover shadow-lg overflow-hidden',
            menuWidth,
            className || '',
            menuAlignment === 'topLeft' ? 'bottom-full left-0' : '',
            menuAlignment === 'topRight' ? 'bottom-full right-0' : '',
            menuAlignment === 'bottomLeft' ? 'top-full left-0 mt-1' : '',
            menuAlignment === 'bottomRight' ? 'top-full right-0 mt-1' : '',
            menuAlignment === 'topLeft' ? 'mb-1' : '',
            menuAlignment === 'topRight' ? 'mb-1' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          {content === 'list' && listItems.length > 0
            ? listItems.map((item, index) => (
                <div
                  key={item.value}
                  onClick={() => {
                    if (item.onClick) item.onClick();
                    if (closeOnItemClick) setIsOpen(false);
                  }}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`flex items-center justify-between py-[18px] px-[18px] cursor-pointer hover:bg-[#112F40] transition-colors duration-200 ease-out ${item.className || ''}`}
                  role="menuitem"
                  tabIndex={0}
                  onFocus={() => setHighlightedIndex(index)}
                >
                  {showIcons && item.icon && iconPosition === 'left' && (
                    <span className="mr-[16px]">{item.icon}</span>
                  )}
                  <span className={item.className || ''}>{item.label}</span>
                  {showIcons && item.icon && iconPosition === 'right' && (
                    <span className="ml-[16px]">{item.icon}</span>
                  )}
                </div>
              ))
            : children}
        </div>
      )}
    </div>
  );
};
