'use client';

import {
  Button,
  BehanceIcon,
  LinkedInIcon,
  DribbbleIcon,
  InstagramIcon,
  Tooltip,
  LinkIcon,
  Text,
} from '@/components';
import { useTranslation } from '@/hooks/useTranslation';

const socialIconButtonClassName =
  '!w-[40px] !h-[40px] !bg-transparent !text-[#437B9A] transition-colors duration-300 hover:!bg-primary-background-hover md:hover:!text-[#E5E5E5]';

export const SideFooter = () => {
  const t = useTranslation();
  return (
    <div className="flex h-full w-full min-w-0 max-w-full flex-col justify-center gap-3 overflow-hidden">
      {/* HIDDEN — Show when design.emmchier.com is ready */}
      {false && (
        <div className="flex min-w-0 max-w-full flex-col gap-1">
          <Text
            type="body"
            color="primary"
            weight="regular"
            className="text-[16px]! leading-[22px]!"
          >
            {t.visit}
          </Text>
          <a
            href="https://design.emmchier.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-w-0 max-w-full items-center justify-start gap-2 opacity-100 transition-opacity duration-300 ease-out hover:opacity-80"
            aria-label="Open design.emmchier.com"
          >
            <span className="min-w-0 truncate text-[18px] font-medium leading-[24px] text-activated-text">
              design.emmchier.com
            </span>
            <LinkIcon color="activated" className="shrink-0" />
          </a>
        </div>
      )}

      {/* Redes sociales */}
      <div className="flex h-full min-h-[48px] min-w-0 max-w-full flex-wrap items-center gap-2">
        <Tooltip content="Behance" direction="top-left">
          <a
            href="https://www.behance.net/emmchier"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Behance"
            className="inline-flex items-center justify-center"
          >
            <Button
              ariaLabel="Behance"
              iconButton
              size="s"
              className={socialIconButtonClassName}
              icon={<BehanceIcon />}
            />
          </a>
        </Tooltip>
        <Tooltip content="LinkedIn" direction="top-left">
          <a
            href="https://www.linkedin.com/in/emmchier"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            className="inline-flex items-center justify-center"
          >
            <Button
              ariaLabel="LinkedIn"
              iconButton
              size="s"
              className={socialIconButtonClassName}
              icon={<LinkedInIcon />}
            />
          </a>
        </Tooltip>
        <Tooltip content="Dribbble" direction="top-left">
          <a
            href="https://dribbble.com/emmchier"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Dribbble"
            className="inline-flex items-center justify-center"
          >
            <Button
              ariaLabel="Dribbble"
              iconButton
              size="s"
              className={socialIconButtonClassName}
              icon={<DribbbleIcon />}
            />
          </a>
        </Tooltip>
        <Tooltip content="Instagram" direction="top-left">
          <a
            href="https://www.instagram.com/emmchier"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="inline-flex items-center justify-center"
          >
            <Button
              ariaLabel="Instagram"
              iconButton
              size="s"
              className={socialIconButtonClassName}
              icon={<InstagramIcon />}
            />
          </a>
        </Tooltip>
      </div>
    </div>
  );
};
