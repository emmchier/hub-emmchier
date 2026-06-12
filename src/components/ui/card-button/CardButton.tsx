'use client';

import React, { Fragment, useState } from 'react';
import { ArrowExternalLinkIcon, ChatIcon, CopyIcon } from '../icon/icons';
import { Tooltip } from '../tooltip/Tooltip';
import { useMediaQuery } from '@/hooks/useMediaQuery';

function cardTitleLine(text: string) {
  const lastSpace = text.lastIndexOf(' ');
  if (lastSpace <= 0) {
    return <span className="whitespace-nowrap">{text}</span>;
  }
  return (
    <>
      {text.slice(0, lastSpace + 1)}
      <span className="whitespace-nowrap">{text.slice(lastSpace + 1)}</span>
    </>
  );
}

export type CardActionType = 'copy' | 'link' | 'email';

export interface CardAction {
  action: CardActionType;
  value: string;
  order: number;
}

const DEFAULT_ACTIONS: CardAction[] = [
  { action: 'copy', value: 'value', order: 1 },
  { action: 'link', value: 'https://instagram.com/emmchier', order: 2 },
];

interface CardButtonProps {
  color: string;
  title: string;
  subTitle: string;
  actions?: CardAction[];
  className?: string;
}

const CardButton: React.FC<CardButtonProps> = ({
  color,
  title,
  subTitle,
  actions = DEFAULT_ACTIONS,
  className = '',
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const isContactMobile = useMediaQuery('(max-width: 767px)');

  const sortedActions = [...actions].sort((a, b) => a.order - b.order);

  const runAction = (item: CardAction) => {
    if (item.action === 'copy') {
      navigator.clipboard.writeText(item.value).then(
        () => {
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2000);
        },
        (err) => console.error('Failed to copy:', err)
      );
    } else if (item.action === 'link') {
      window.open(item.value, '_blank');
    } else if (item.action === 'email') {
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
        item.value
      )}`;
      window.open(gmailUrl, '_blank');
    }
  };

  const renderActionIcon = (action: CardActionType) => {
    const iconProps = {
      width: 24,
      height: 24,
      color: 'currentColor' as const,
    };

    switch (action) {
      case 'copy':
        return <CopyIcon {...iconProps} />;
      case 'link':
        return <ArrowExternalLinkIcon {...iconProps} />;
      case 'email':
        return <ChatIcon {...iconProps} />;
      default:
        return null;
    }
  };

  const actionClasses =
    'w-10 h-10 flex items-center justify-center cursor-pointer border-0 bg-transparent p-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 rounded transition-colors duration-300' +
    (isContactMobile ? '' : ' hover:bg-[#1A4862] hover:text-[#E5E5E5]');

  return (
    <div
      className={`
        w-full h-full min-h-[72px] md:min-h-[96px]
        p-2 md:p-4
        flex flex-col justify-end
        ${className}
      `}
      style={{
        backgroundColor: '#13384D',
        border: 'none',
        color,
      }}
    >
      <div className="flex items-end justify-between gap-4 w-full">
        <div className="flex flex-col items-start gap-0 text-left min-w-0">
          {/* Mobile: solid fill. Tablet+: outline stroke */}
          <span
            className="block min-w-0 font-semibold tracking-[-0.02em] text-[32px] leading-[32px] md:text-[46px] md:leading-[58px] lg:text-[50px] lg:leading-[65px]"
            style={
              isContactMobile
                ? { color }
                : {
                    color: 'transparent',
                    WebkitTextFillColor: 'transparent',
                    WebkitTextStroke: `1px ${color}`,
                    paintOrder: 'stroke fill',
                  }
            }
          >
            {cardTitleLine(title)}
          </span>

          <span
            className="block min-w-0 font-semibold text-[16px] leading-[24px] md:text-[22px] md:leading-[30px] lg:text-[24px] lg:leading-[32px]"
            style={{ color: isCopied ? '#E5E5E5' : color }}
          >
            {isCopied ? 'Copiado!' : subTitle}
          </span>
        </div>

        <div className="flex shrink-0 items-center" style={{ gap: '8px' }}>
          {sortedActions.map((item, index) => {
            const tooltipContent =
              item.action === 'copy'
                ? 'Copy link'
                : item.action === 'link'
                  ? 'Open link'
                  : 'Send an email';
            const button = (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  runAction(item);
                }}
                className={actionClasses}
                style={{ color }}
                aria-label={tooltipContent}
              >
                {renderActionIcon(item.action)}
              </button>
            );
            const key = `${item.action}-${index}`;
            return isContactMobile ? (
              <Fragment key={key}>{button}</Fragment>
            ) : (
              <Tooltip key={key} content={tooltipContent} direction="top">
                {button}
              </Tooltip>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CardButton;
