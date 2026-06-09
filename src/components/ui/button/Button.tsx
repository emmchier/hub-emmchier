'use client';

import React, { ReactNode, CSSProperties, PointerEventHandler } from 'react';
import { FCC } from '../../../types/types';
import { ArrowLeftIcon, ArrowRightIcon } from '../icon/icons';

interface ButtonProps {
  ariaLabel: string;
  type?: 'button' | 'reset' | 'submit';
  size?: 's' | 'm' | 'l';
  variant?: 'filled' | 'outlined' | 'text';
  state?: 'enabled' | 'selected' | 'activated' | 'disabled';
  icon?: ReactNode;
  iconButton?: boolean;
  className?: string;
  style?: CSSProperties;
  children?: string | ReactNode;
  tabIndex?: number;
  fullWidth?: boolean;
  rounded?: boolean;
  noPadding?: boolean;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onPointerDown?: PointerEventHandler<HTMLButtonElement>;
  onKeyDown?: (e: React.KeyboardEvent<HTMLButtonElement>) => void;
  role?: string;
  /**
   * Enables a directional arrow that slides in on hover (desktop/tablet only,
   * hidden on mobile via `hidden md:inline-flex`).
   *
   * - `'right'` (default when truthy): arrow appears to the RIGHT of the label,
   *   slides in from the left. Label stays centered.
   * - `'left'`: arrow appears to the LEFT of the label, slides in from the right.
   * - `false` / omitted: no arrow; label stays centered with standard hover bg.
   *
   * Has no effect on icon buttons (`iconButton={true}`).
   */
  hoverArrow?: 'left' | 'right' | false;
}

export const Button: FCC<ButtonProps> = ({
  ariaLabel = '',
  type = 'button',
  size = 'm',
  variant = 'filled',
  icon = null,
  iconButton = false,
  className,
  style,
  children = 'Label',
  tabIndex,
  fullWidth = false,
  rounded = false,
  noPadding = false,
  state = 'enabled',
  onClick = () => {},
  onMouseEnter = () => {},
  onMouseLeave = () => {},
  onPointerDown,
  onKeyDown,
  role,
  hoverArrow = false,
}) => {
  const isDisabled = state === 'disabled';

  // Clases base fijas
  const baseClasses =
    'flex font-semibold items-center justify-center align-middle transition-colors duration-300 whitespace-nowrap';

  // Clases de tamaño fijas
  let sizeClasses = '';
  if (size === 's' && !iconButton) {
    sizeClasses = noPadding
      ? 'h-[32px] text-title-mobile-S lg:text-title-tablet-S xl:text-title-desk-S'
      : 'h-[32px] px-[8px] text-title-mobile-S lg:text-title-tablet-S xl:text-title-desk-S';
  } else if (size === 'm' && !iconButton) {
    sizeClasses =
      'h-[56px] px-[24px] text-title-mobile-M lg:text-title-tablet-M xl:text-title-desk-M';
  } else if (variant === 'text') {
    sizeClasses = 'h-auto';
  } else if (size === 's' && iconButton) {
    sizeClasses = 'w-[32px] h-[32px]';
  } else if (size === 'm' && iconButton) {
    sizeClasses = 'w-[48px] h-[48px]';
  } else if (size === 'l' && iconButton) {
    sizeClasses = 'w-[56px] h-[56px]';
  }

  // Clases de variante fijas
  let variantClasses = '';
  if (variant === 'filled') {
    variantClasses =
      'bg-primary-background text-primary-text border-transparent hover:bg-primary-background-hover';
  } else if (variant === 'outlined') {
    variantClasses =
      'bg-transparent border border-primary-text hover:bg-primary-background-hover';
  } else if (variant === 'text') {
    variantClasses =
      'bg-transparent border-transparent hover:text-primary-text-hover';
  }

  // Clases de estado fijas
  let stateClasses = '';
  if (state === 'enabled') {
    stateClasses = 'text-primary-text';
  } else if (state === 'selected') {
    stateClasses = 'text-selected-text';
  } else if (state === 'activated') {
    stateClasses = '!text-activated-text';
  } else if (state === 'disabled') {
    stateClasses =
      'cursor-not-allowed opacity-50 bg-transparent hover:bg-transparent';
  }

  // Clases adicionales
  const widthClasses = fullWidth && !iconButton ? 'w-full' : '';
  const cursorClasses = !isDisabled ? 'cursor-pointer' : '';
  const roundedClasses = rounded
    ? size === 's'
      ? 'rounded-[4px]'
      : 'rounded-[8px]'
    : '';

  // Add 'group' when hoverArrow is active on non-icon buttons so the
  // CSS group-hover utilities on the arrow span work correctly.
  const groupClass = !iconButton && hoverArrow ? 'group' : '';

  const finalClassName = [
    baseClasses,
    cursorClasses,
    sizeClasses,
    widthClasses,
    roundedClasses,
    variantClasses,
    stateClasses,
    groupClass,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const isMdIconButton = iconButton && size === 'm';
  const wants16 = Boolean(className?.includes('icon-16'));
  const wants24Mobile = Boolean(className?.includes('icon-24-mobile'));

  const iconWrapperClasses = isMdIconButton
    ? [
        // Default: ALL md icon buttons render 20px icons.
        '[&>svg]:!w-[20px] [&>svg]:!h-[20px] [&_svg]:!w-[20px] [&_svg]:!h-[20px]',
        // Override: used by lightbox chevrons.
        wants16
          ? '[&>svg]:!w-[16px] [&>svg]:!h-[16px] [&_svg]:!w-[16px] [&_svg]:!h-[16px]'
          : '',
        // Override: ONLY in mobile, for Contact CTA chat icon.
        wants24Mobile
          ? 'max-md:[&>svg]:!w-[24px] max-md:[&>svg]:!h-[24px] max-md:[&_svg]:!w-[24px] max-md:[&_svg]:!h-[24px]'
          : '',
      ]
        .filter(Boolean)
        .join(' ')
    : '';

  return (
    <button
      type={type}
      role={role}
      aria-label={ariaLabel}
      onClick={isDisabled ? undefined : onClick}
      onMouseEnter={isDisabled ? undefined : onMouseEnter}
      onMouseLeave={isDisabled ? undefined : onMouseLeave}
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
      tabIndex={isDisabled ? -1 : tabIndex}
      aria-disabled={isDisabled}
      className={finalClassName}
      style={style}
    >
      {!iconButton && hoverArrow ? (
        // Arrow mode (desktop/tablet only — md:inline-flex on the arrow span).
        //
        // The arrow expands from max-w-0 to max-w-[22px] (8px gap + 14px icon)
        // on hover, pushing the label in the opposite direction and widening the
        // button. `overflow-hidden` on the arrow span prevents the icon from
        // being visible while it is still at max-w-0.
        //
        // Layout: flex row without gap. The gap is baked into the arrow span as
        // padding (pl-[8px] for right arrow, pr-[8px] for left arrow) so that
        // the flex gap does not leak when the arrow is collapsed.
        <span className="flex items-center justify-center">
          {hoverArrow === 'left' && (
            <span
              aria-hidden
              className="hidden md:inline-flex items-center pr-[8px] min-w-0 max-w-0 overflow-hidden opacity-0 transition-all duration-300 ease-out group-hover:max-w-[calc(8px+0.8em)] group-hover:opacity-70"
            >
              <span className="[&>svg]:!w-[0.8em] [&>svg]:!h-[0.8em] inline-flex items-center shrink-0">
                <ArrowLeftIcon color="currentColor" />
              </span>
            </span>
          )}
          <span>{children}</span>
          {hoverArrow === 'right' && (
            <span
              aria-hidden
              className="hidden md:inline-flex items-center pl-[8px] min-w-0 max-w-0 overflow-hidden opacity-0 transition-all duration-300 ease-out group-hover:max-w-[calc(8px+0.8em)] group-hover:opacity-70"
            >
              <span className="[&>svg]:!w-[0.8em] [&>svg]:!h-[0.8em] inline-flex items-center shrink-0">
                <ArrowRightIcon color="currentColor" />
              </span>
            </span>
          )}
        </span>
      ) : (
        !iconButton && children
      )}
      <span
        className={[
          'flex items-center justify-center',
          iconWrapperClasses,
        ].join(' ')}
      >
        {icon}
      </span>
    </button>
  );
};
