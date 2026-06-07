type RichTextNode = {
  nodeType?: string;
  value?: string;
  content?: RichTextNode[];
  data?: Record<string, unknown>;
};

const phrasingHasNonWhitespaceText = (nodes: RichTextNode[]): boolean =>
  nodes.some((n) => {
    if (n.nodeType === 'text') return Boolean((n.value ?? '').trim());
    return phrasingHasNonWhitespaceText(n.content ?? []);
  });

const meaningfulBlock = (n: RichTextNode): boolean => {
  const type = n.nodeType;
  const children = n.content ?? [];

  switch (type) {
    case 'paragraph':
    case 'heading-1':
    case 'heading-2':
    case 'heading-3':
    case 'heading-4':
    case 'heading-5':
    case 'heading-6':
      return phrasingHasNonWhitespaceText(children);
    case 'blockquote':
      return children.some(meaningfulBlock);
    case 'hr':
      return true;
    case 'unordered-list':
    case 'ordered-list':
      return children.some(meaningfulBlock);
    case 'list-item':
      return children.some(meaningfulBlock);
    case 'table':
    case 'table-row':
      return children.some(meaningfulBlock);
    case 'table-cell':
    case 'table-header-cell':
      return children.some(meaningfulBlock);
    case 'embedded-asset-block': {
      const target = n.data?.target as
        | { fields?: { file?: { url?: string } } }
        | undefined;
      return Boolean(target?.fields?.file?.url);
    }
    case 'embedded-entry-block': {
      const target = n.data?.target as
        | { fields?: Record<string, unknown> }
        | undefined;
      const f = target?.fields ?? {};
      const title = typeof f.title === 'string' && f.title.trim();
      const name = typeof f.name === 'string' && f.name.trim();
      const desc =
        typeof f.description === 'string' && f.description.trim().length > 0;
      const file = f.file as { url?: string } | undefined;
      const imageField = f.image as
        | { fields?: { file?: { url?: string } } }
        | undefined;
      return Boolean(
        title || name || desc || file?.url || imageField?.fields?.file?.url
      );
    }
    default:
      return children.some(meaningfulBlock);
  }
};

export function hasMakingOfRichTextContent(makingOf: unknown): boolean {
  if (!makingOf || typeof makingOf !== 'object') return false;
  const doc = makingOf as RichTextNode;
  if (doc.nodeType !== 'document') return true;
  const blocks = doc.content ?? [];
  if (blocks.length === 0) return false;
  return blocks.some(meaningfulBlock);
}
