'use client';

import { WorkItem } from '@/interfaces';
import { Badge, Text, ShareButton, Empty } from '@/components';
import { hasMakingOfRichTextContent } from '@/utils/making-of-content';
import { usePathname } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

interface InformationProps {
  subItem: WorkItem;
  categorySlug?: string;
}

type RichTextNode = {
  nodeType?: string;
  value?: string;
  content?: RichTextNode[];
  data?: Record<string, unknown>;
  marks?: Array<{ type?: string }>;
};

const assetUrl = (url?: string | null) => {
  if (!url) return null;
  return url.startsWith('http') ? url : `https:${url}`;
};

const applyTextMarks = (
  value: string,
  marks: Array<{ type?: string }> = []
): ReactNode => {
  const types = new Set(marks.map((m) => m.type).filter(Boolean));
  let el: ReactNode = value;
  if (types.has('code')) {
    el = (
      <code className="rounded bg-indigo-50 px-1 py-0.5 font-mono text-[0.9em] text-primary-text">
        {el}
      </code>
    );
  }
  if (types.has('bold')) el = <strong>{el}</strong>;
  if (types.has('italic')) el = <em>{el}</em>;
  if (types.has('underline')) {
    el = <u>{el}</u>;
  }
  return el;
};

const renderPhrasingNodes = (
  nodes: RichTextNode[] = [],
  keyPrefix: string
): ReactNode[] =>
  nodes.map((node, index) => {
    const k = `${keyPrefix}-${index}`;

    if (node.nodeType === 'text') {
      return (
        <span key={k}>{applyTextMarks(node.value ?? '', node.marks)}</span>
      );
    }

    if (node.nodeType === 'hyperlink') {
      const uri = (node.data?.uri as string | undefined) ?? '';
      const inner = renderPhrasingNodes(node.content ?? [], `${k}-h`);
      if (!uri) {
        return <span key={k}>{inner}</span>;
      }
      const isInternal = uri.startsWith('/') && !uri.startsWith('//');
      if (isInternal) {
        return (
          <Link
            key={k}
            href={uri}
            className="text-selected-text underline underline-offset-2 hover:opacity-80"
          >
            {inner}
          </Link>
        );
      }
      return (
        <a
          key={k}
          href={uri}
          target="_blank"
          rel="noopener noreferrer"
          className="text-selected-text underline underline-offset-2 hover:opacity-80"
        >
          {inner}
        </a>
      );
    }

    if (node.nodeType === 'entry-hyperlink') {
      const target = node.data?.target as
        | { fields?: Record<string, unknown> }
        | undefined;
      const fields = target?.fields ?? {};
      const slug = typeof fields.slug === 'string' ? fields.slug : undefined;
      const label =
        (typeof fields.title === 'string' && fields.title) ||
        (typeof fields.name === 'string' && fields.name) ||
        '';
      const inner = node.content?.length
        ? renderPhrasingNodes(node.content, `${k}-e`)
        : [<span key={`${k}-fallback`}>{label || 'Link'}</span>];

      if (slug) {
        return (
          <Link
            key={k}
            href={`/${slug}`}
            className="text-selected-text underline underline-offset-2 hover:opacity-80"
          >
            {inner}
          </Link>
        );
      }
      return (
        <span key={k} className="text-primary-text">
          {inner}
        </span>
      );
    }

    if (node.nodeType === 'asset-hyperlink') {
      const target = node.data?.target as
        | { fields?: { file?: { url?: string }; title?: string } }
        | undefined;
      const file = target?.fields?.file;
      const title = target?.fields?.title ?? 'Asset';
      const url = assetUrl(file?.url ?? null);
      const inner = renderPhrasingNodes(node.content ?? [], `${k}-a`);

      if (url) {
        return (
          <a
            key={k}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-selected-text underline underline-offset-2 hover:opacity-80"
            title={typeof title === 'string' ? title : undefined}
          >
            {inner}
          </a>
        );
      }
      return <span key={k}>{inner}</span>;
    }

    return null;
  });

const headingConfig = (level: 1 | 2 | 3 | 4 | 5 | 6) => {
  const map: Record<
    number,
    {
      size: 'xxl' | 'xl' | 'l' | 'm' | 's';
      heading: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
      className?: string;
    }
  > = {
    1: { size: 'xxl', heading: 'h1' },
    2: { size: 'xl', heading: 'h2' },
    3: { size: 'l', heading: 'h3' },
    4: { size: 'm', heading: 'h4' },
    5: { size: 's', heading: 'h5' },
    6: {
      size: 's',
      heading: 'h6',
      className: 'text-[0.95rem]! md:text-[1.05rem]!',
    },
  };
  return map[level];
};

const renderRichText = (node?: RichTextNode, key?: string): React.ReactNode => {
  if (!node) return null;

  const children = node.content ?? [];

  switch (node.nodeType) {
    case 'document':
      return (
        <div className="space-y-6">
          {children.map((child, index) =>
            renderRichText(child, `${key ?? 'doc'}-${index}`)
          )}
        </div>
      );

    case 'paragraph':
      return (
        <Text
          key={key}
          type="body"
          size="m"
          className="text-primary-text leading-relaxed"
        >
          {renderPhrasingNodes(children, key ?? 'p')}
        </Text>
      );

    case 'heading-1':
    case 'heading-2':
    case 'heading-3':
    case 'heading-4':
    case 'heading-5':
    case 'heading-6': {
      const match = node.nodeType?.match(/^heading-(\d)$/);
      const parsed = match ? Number(match[1]) : 1;
      const level = (parsed >= 1 && parsed <= 6 ? parsed : 1) as
        | 1
        | 2
        | 3
        | 4
        | 5
        | 6;
      const cfg = headingConfig(level);
      return (
        <Text
          key={key}
          type="title"
          size={cfg.size}
          heading={cfg.heading}
          weight="bold"
          className={['text-selected-text', cfg.className ?? '']
            .filter(Boolean)
            .join(' ')}
        >
          {renderPhrasingNodes(children, key ?? `h${level}`)}
        </Text>
      );
    }

    case 'blockquote':
      return (
        <blockquote
          key={key}
          className="border-l-4 border-indigo-100 pl-4 py-1 my-2 text-primary-text"
        >
          <div className="space-y-3">
            {children.map((child, index) =>
              renderRichText(child, `${key ?? 'quote'}-${index}`)
            )}
          </div>
        </blockquote>
      );

    case 'hr':
      return (
        <hr
          key={key}
          className="my-8 border-0 border-t border-indigo-100"
          aria-hidden
        />
      );

    case 'unordered-list':
      return (
        <ul
          key={key}
          className="list-disc space-y-2 pl-6 marker:text-primary-text"
        >
          {children.map((child, index) =>
            renderRichText(child, `${key ?? 'ul'}-${index}`)
          )}
        </ul>
      );

    case 'ordered-list':
      return (
        <ol
          key={key}
          className="list-decimal space-y-2 pl-6 marker:text-primary-text"
        >
          {children.map((child, index) =>
            renderRichText(child, `${key ?? 'ol'}-${index}`)
          )}
        </ol>
      );

    case 'list-item':
      return (
        <li key={key} className="text-primary-text leading-relaxed pl-1">
          {children.map((child, index) =>
            renderRichText(child, `${key ?? 'li'}-${index}`)
          )}
        </li>
      );

    case 'table':
      return (
        <div key={key} className="my-6 w-full overflow-x-auto">
          <table className="w-full min-w-[280px] border-collapse border border-[#21516B] text-left text-[#569CC3]">
            <tbody>
              {children.map((child, index) =>
                renderRichText(child, `${key ?? 'tbl'}-${index}`)
              )}
            </tbody>
          </table>
        </div>
      );

    case 'table-row':
      return (
        <tr key={key}>
          {children.map((child, index) =>
            renderRichText(child, `${key ?? 'tr'}-${index}`)
          )}
        </tr>
      );

    case 'table-cell':
      return (
        <td
          key={key}
          className="border border-[#21516B] px-3 py-2 align-top text-body-mobile-M text-[#569CC3] md:text-body-tablet-M xl:text-body-desk-M"
        >
          {children.map((child, index) =>
            renderRichText(child, `${key ?? 'td'}-${index}`)
          )}
        </td>
      );

    case 'table-header-cell':
      return (
        <th
          key={key}
          scope="col"
          className="border border-[#21516B] bg-[#21516B] px-3 py-2 text-left font-semibold text-[#569CC3]"
        >
          {children.map((child, index) =>
            renderRichText(child, `${key ?? 'th'}-${index}`)
          )}
        </th>
      );

    case 'embedded-asset-block': {
      const target = node.data?.target as
        | { fields?: Record<string, unknown> }
        | undefined;

      const fields = target?.fields ?? {};
      const title = (fields.title as string | undefined) ?? 'Image';
      const file = fields.file as { url?: string } | undefined;

      const url = assetUrl(file?.url ?? null);

      if (!url) return null;

      return (
        <div key={key} className="my-6">
          <Image
            src={url}
            alt={title}
            width={1200}
            height={800}
            className="w-full h-auto rounded-lg shadow-lg"
          />
        </div>
      );
    }

    case 'embedded-entry-block': {
      const target = node.data?.target as
        | { fields?: Record<string, unknown> }
        | undefined;
      const fields = target?.fields ?? {};
      const title =
        (typeof fields.title === 'string' && fields.title) ||
        (typeof fields.name === 'string' && fields.name) ||
        'Referenced content';
      const desc =
        typeof fields.description === 'string' ? fields.description : '';
      const file = fields.file as { url?: string } | undefined;
      const imageField = fields.image as
        | { fields?: { file?: { url?: string }; title?: string } }
        | undefined;
      const nestedFile = imageField?.fields?.file;
      const imgUrl = assetUrl(file?.url ?? nestedFile?.url ?? null);
      const imgAlt =
        (typeof imageField?.fields?.title === 'string' &&
          imageField.fields.title) ||
        title;

      if (imgUrl) {
        return (
          <div
            key={key}
            className="my-6 overflow-hidden rounded-lg border border-indigo-100 bg-white shadow-sm"
          >
            <Image
              src={imgUrl}
              alt={imgAlt}
              width={1200}
              height={800}
              className="h-auto w-full"
            />
            <div className="border-t border-indigo-100 px-3 py-2">
              <Text
                type="body"
                size="s"
                weight="semiBold"
                className="text-selected-text"
              >
                {title}
              </Text>
              {desc ? (
                <Text type="body" size="s" className="mt-1 text-secondary-text">
                  {desc}
                </Text>
              ) : null}
            </div>
          </div>
        );
      }

      return (
        <div
          key={key}
          className="my-6 rounded-lg border border-indigo-100 bg-indigo-50/40 px-4 py-3"
        >
          <Text
            type="body"
            size="m"
            weight="semiBold"
            className="text-selected-text"
          >
            {title}
          </Text>
          {desc ? (
            <Text type="body" size="s" className="mt-2 text-primary-text">
              {desc}
            </Text>
          ) : null}
        </div>
      );
    }

    default:
      return null;
  }
};

export const Information = ({ subItem }: InformationProps) => {
  const pathname = usePathname();
  const t = useTranslation();

  if (!subItem) {
    return (
      <div className="w-full flex justify-center px-[16px] md:px-[40px] pt-[16px] md:pt-[40px]">
        <div className="w-full max-w-2xl mx-auto content-list">
          <Empty content={t.noProcess} />
        </div>
      </div>
    );
  }

  const makingOf = subItem?.makingOf as RichTextNode | undefined;
  const tools = subItem?.tools ?? [];

  const hasTools = Array.isArray(tools) && tools.length > 0;
  const hasProcess = hasMakingOfRichTextContent(makingOf);

  const readingTime = subItem?.readingTime;

  const readingTimeText = readingTime
    ? `${readingTime} ${readingTime === 1 ? t.minuteRead : t.minutesRead}`
    : undefined;

  return (
    <div className="w-full flex justify-center px-[16px] md:px-[40px] pt-[16px] md:pt-[40px] pb-[72px]">
      <div className="content-list w-full max-w-2xl mx-auto">
        {/* HEADER + PROCESS */}
        {hasProcess ? (
          <>
            <div className="w-full">
              <div className="h-[48px] w-full border-y border-indigo-100 flex items-center justify-between">
                {readingTimeText && <Text>{readingTimeText}</Text>}
                <ShareButton
                  pathname={pathname}
                  title={subItem.name}
                  ariaLabel={`Share ${subItem.name}`}
                />
              </div>
            </div>

            {/* Techs Badges — entre header y rich text */}
            {hasTools && (
              <div className="w-full flex flex-wrap gap-2 mt-4">
                {tools.map((tool: string, index: number) => (
                  <Badge key={`${tool}-${index}`} size="s">
                    {tool}
                  </Badge>
                ))}
              </div>
            )}

            {/* Making Of Content */}
            {makingOf && <div className="mt-8">{renderRichText(makingOf)}</div>}
          </>
        ) : (
          <Empty content={t.noProcess} />
        )}
      </div>
    </div>
  );
};
