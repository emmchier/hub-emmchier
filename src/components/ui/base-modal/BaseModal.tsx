'use client';

import ReactDOM from 'react-dom';
import {
  CSSProperties,
  ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Button, CloseIcon, Text } from '@/components';
import { useBreakpoint } from '@/hooks/useBreakpoint';

type DefaultAction = {
  label: string;
  onClick?: () => void;
};

type BaseModalDefaultProps = {
  type?: 'default';
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  negativeAction?: DefaultAction;
  possitiveAction?: DefaultAction;
};

type BaseModalAvatarProps = {
  type: 'avatar';
  /** Element clickable in the UI (e.g. Avatar). */
  trigger: ReactNode;
  /** Element to render inside the modal (same Avatar). */
  content: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export type BaseModalProps = BaseModalDefaultProps | BaseModalAvatarProps;

const TRANSITION_MS = 300;

export const BaseModal = (props: BaseModalProps) => {
  if (props.type === 'avatar') {
    return <AvatarBaseModal {...props} />;
  }

  return <DefaultBaseModal {...props} type="default" />;
};

function DefaultBaseModal({
  open,
  onClose,
  title,
  description,
  negativeAction,
  possitiveAction,
}: BaseModalDefaultProps) {
  const [isClosing, setIsClosing] = useState(false);

  const safeNegative = useMemo(
    () => ({
      label: negativeAction?.label ?? 'Cancelar',
      onClick: negativeAction?.onClick ?? (() => {}),
    }),
    [negativeAction]
  );

  const safePossitive = useMemo(
    () => ({
      label: possitiveAction?.label ?? 'Aceptar',
      onClick: possitiveAction?.onClick ?? (() => {}),
    }),
    [possitiveAction]
  );

  useEffect(() => {
    if (!open && !isClosing) {
      setIsClosing(true);
      const t = setTimeout(() => setIsClosing(false), 100);
      return () => clearTimeout(t);
    }
  }, [open, isClosing]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open && !isClosing) return null;

  return ReactDOM.createPortal(
    <div
      className={`fixed inset-0 z-100 flex items-center justify-center bg-primary-background transition-all duration-300 ease-in-out ${
        open ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
      }`}
      style={{ pointerEvents: open ? 'auto' : 'none' }}
      onClick={onClose}
    >
      <div
        className="relative w-[92vw] max-w-[520px] border border-primary-text bg-primary-background-hover shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 px-[18px] pt-[18px]">
          <div className="min-w-0">
            <Text type="title" size="l" weight="bold" className="text-white">
              {title}
            </Text>
            {description ? (
              <Text type="body" size="m" className="mt-2 text-primary-text">
                {description}
              </Text>
            ) : null}
          </div>
          <Button
            ariaLabel="Close"
            onClick={onClose}
            variant="outlined"
            icon={<CloseIcon className="h-[14px] w-[14px]" />}
            iconButton
            size="s"
          />
        </div>

        <div className="flex items-center justify-end gap-2 px-[18px] pb-[18px] pt-[16px]">
          <Button
            ariaLabel={safeNegative.label}
            variant="outlined"
            state="selected"
            size="s"
            onClick={() => {
              onClose();
              safeNegative.onClick?.();
            }}
          >
            {safeNegative.label}
          </Button>
          <Button
            ariaLabel={safePossitive.label}
            variant="outlined"
            state="selected"
            size="s"
            onClick={() => {
              onClose();
              safePossitive.onClick?.();
            }}
          >
            {safePossitive.label}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function AvatarBaseModal({
  trigger,
  content,
  open: openProp,
  onOpenChange,
}: BaseModalAvatarProps) {
  const isControlled = typeof openProp === 'boolean';
  const [openUncontrolled, setOpenUncontrolled] = useState(false);
  const open = isControlled ? Boolean(openProp) : openUncontrolled;

  const [isClosing, setIsClosing] = useState(false);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [fromRect, setFromRect] = useState<DOMRect | null>(null);
  const [animateIn, setAnimateIn] = useState(false);
  const { breakpoint } = useBreakpoint();

  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) setOpenUncontrolled(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange]
  );

  const close = useCallback(() => setOpen(false), [setOpen]);

  useEffect(() => {
    if (!open && !isClosing) {
      setIsClosing(true);
      const t = setTimeout(() => setIsClosing(false), 100);
      return () => clearTimeout(t);
    }
  }, [open, isClosing]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, close]);

  useLayoutEffect(() => {
    if (!open) return;
    const el = triggerRef.current;
    if (!el) return;
    setFromRect(el.getBoundingClientRect());
  }, [open]);

  useEffect(() => {
    if (!open) {
      setAnimateIn(false);
      return;
    }
    const id = requestAnimationFrame(() => setAnimateIn(true));
    return () => cancelAnimationFrame(id);
  }, [open]);

  const overlay = (open || isClosing) && fromRect;

  const baseStyle: CSSProperties | undefined = useMemo(() => {
    if (!fromRect) return undefined;
    return {
      position: 'fixed',
      left: fromRect.left,
      top: fromRect.top,
      width: fromRect.width,
      height: fromRect.height,
      transformOrigin: 'center',
    };
  }, [fromRect]);

  const expandedStyle: CSSProperties = useMemo(
    () => ({
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%) scale(4.75)',
    }),
    []
  );

  const expandedLeft = useMemo(
    () => (expandedStyle.left as string) ?? '50%',
    [expandedStyle.left]
  );
  const expandedTop = useMemo(
    () => (expandedStyle.top as string) ?? '50%',
    [expandedStyle.top]
  );

  return (
    <>
      <span
        ref={triggerRef}
        className={[
          'inline-flex',
          breakpoint === 'desktop' || breakpoint === 'macbook'
            ? 'cursor-pointer'
            : '',
        ]
          .filter(Boolean)
          .join(' ')}
        onClick={() => setOpen(true)}
      >
        {trigger}
      </span>

      {overlay
        ? ReactDOM.createPortal(
            <div
              className={`fixed inset-0 z-100 flex items-center justify-center bg-black/80 transition-all duration-300 ease-in-out ${
                open ? 'opacity-100' : 'opacity-0'
              }`}
              style={{ pointerEvents: open ? 'auto' : 'none' }}
              onClick={close}
            >
              <div className="relative h-full w-full">
                <div
                  className="fixed right-[8px] top-[8px] z-101"
                  onClick={(e) => {
                    e.stopPropagation();
                    close();
                  }}
                >
                  <Button
                    ariaLabel="Close"
                    onClick={() => {}}
                    variant="outlined"
                    icon={<CloseIcon />}
                    iconButton
                    size="m"
                  />
                </div>
                <div
                  className="absolute"
                  style={{
                    ...baseStyle,
                    transition: `transform ${TRANSITION_MS}ms ease-in-out, left ${TRANSITION_MS}ms ease-in-out, top ${TRANSITION_MS}ms ease-in-out`,
                    transform: animateIn ? expandedStyle.transform : undefined,
                    left: animateIn ? expandedLeft : baseStyle?.left,
                    top: animateIn ? expandedTop : baseStyle?.top,
                  }}
                  onClick={close}
                >
                  {/* Avatar clone (no changes to the real Avatar component) */}
                  <div className="relative" onClick={close}>
                    {content}
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
