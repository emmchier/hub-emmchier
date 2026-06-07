/**
 * ATS-format CV PDF generator.
 *
 * Generates a single-column, white-background PDF using jsPDF.
 * No photos, no graphics, no colors beyond black/dark-grey — optimised
 * for Applicant Tracking Systems that parse plain text.
 *
 * Call `generateAtsPdf(json)` from a button click handler in the browser.
 * The file downloads automatically.
 */

import type { ResumeJson } from '@/interfaces';

// ─── Layout constants ─────────────────────────────────────────────────────────

const PAGE_W = 210; // A4 mm
const PAGE_H = 297;
const MARGIN_X = 20;
const MARGIN_Y = 22;
const CONTENT_W = PAGE_W - MARGIN_X * 2;

const FONT = {
  REGULAR: 'helvetica' as const,
  BOLD: 'helvetica' as const,
};

const SIZE = {
  NAME: 20,
  ROLES: 10,
  SECTION_TITLE: 11,
  ITEM_TITLE: 10,
  BODY: 9.5,
  SMALL: 8.5,
};

const COLOR = {
  BLACK: [0, 0, 0] as [number, number, number],
  DARK: [30, 30, 30] as [number, number, number],
  MID: [90, 90, 90] as [number, number, number],
  LIGHT: [140, 140, 140] as [number, number, number],
};

const LINE_H = {
  NAME: 8,
  SECTION: 5.5,
  BODY: 5,
  SMALL: 4.5,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

type JsPDF = import('jspdf').jsPDF;

function addPage(doc: JsPDF): number {
  doc.addPage();
  return MARGIN_Y;
}

function checkY(doc: JsPDF, y: number, needed: number): number {
  if (y + needed > PAGE_H - MARGIN_Y) return addPage(doc);
  return y;
}

/** Wrap text to fit within maxWidth, return array of lines. */
function wrapText(doc: JsPDF, text: string, maxWidth: number): string[] {
  return doc.splitTextToSize(text, maxWidth) as string[];
}

/** Draw a full-width horizontal rule. */
function drawHr(doc: JsPDF, y: number): void {
  doc.setDrawColor(...COLOR.LIGHT);
  doc.setLineWidth(0.2);
  doc.line(MARGIN_X, y, PAGE_W - MARGIN_X, y);
}

// ─── Main generator ───────────────────────────────────────────────────────────

export async function generateAtsPdf(
  json: ResumeJson,
  language: 'en' | 'es' = 'en'
): Promise<void> {
  // Dynamic import — jsPDF is large; only load when the user actually clicks Download.
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

  let y = MARGIN_Y;

  // ── Name ────────────────────────────────────────────────────────────────────
  doc.setFont(FONT.BOLD, 'bold');
  doc.setFontSize(SIZE.NAME);
  doc.setTextColor(...COLOR.BLACK);
  doc.text(json.name, MARGIN_X, y);
  y += LINE_H.NAME + 3;

  // ── Roles ────────────────────────────────────────────────────────────────────
  if (json.roles.length > 0) {
    doc.setFont(FONT.REGULAR, 'normal');
    doc.setFontSize(SIZE.ROLES);
    doc.setTextColor(...COLOR.MID);
    doc.text(json.roles.join('  ·  '), MARGIN_X, y);
    y += LINE_H.BODY + 2;
  }

  drawHr(doc, y);
  y += 5;

  // ── Contact line (static — name never changes) ───────────────────────────────
  doc.setFont(FONT.REGULAR, 'normal');
  doc.setFontSize(SIZE.SMALL);
  doc.setTextColor(...COLOR.MID);
  doc.text(
    'art.emmchier.com  ·  design.emmchier.com  ·  @emmchier',
    MARGIN_X,
    y
  );
  y += LINE_H.SMALL + 4;

  drawHr(doc, y);
  y += 6;

  // ── Sections ──────────────────────────────────────────────────────────────────
  for (const section of json.sections) {
    y = checkY(doc, y, 14);

    // Section title
    doc.setFont(FONT.BOLD, 'bold');
    doc.setFontSize(SIZE.SECTION_TITLE);
    doc.setTextColor(...COLOR.BLACK);
    doc.text(section.name.toUpperCase(), MARGIN_X, y);
    y += LINE_H.SECTION + 1;

    drawHr(doc, y);
    y += 5;

    for (const item of section.items) {
      y = checkY(doc, y, 10);

      // Role / title
      doc.setFont(FONT.BOLD, 'bold');
      doc.setFontSize(SIZE.ITEM_TITLE);
      doc.setTextColor(...COLOR.DARK);
      doc.text(item.role, MARGIN_X, y);

      // Date — right-aligned
      if (item.dateFrom || item.dateTo) {
        const dateStr =
          item.dateFrom === item.dateTo
            ? (item.dateFrom ?? '')
            : `${item.dateFrom ?? ''}${item.dateTo ? ' – ' + item.dateTo : ''}`;
        doc.setFont(FONT.REGULAR, 'normal');
        doc.setFontSize(SIZE.SMALL);
        doc.setTextColor(...COLOR.LIGHT);
        const dateW = doc.getTextWidth(dateStr);
        doc.text(dateStr, PAGE_W - MARGIN_X - dateW, y);
      }
      y += LINE_H.BODY;

      // Company
      if (item.company) {
        doc.setFont(FONT.REGULAR, 'italic');
        doc.setFontSize(SIZE.BODY);
        doc.setTextColor(...COLOR.MID);
        doc.text(item.company, MARGIN_X, y);
        y += LINE_H.BODY;
      }

      // Description
      if (item.description) {
        y = checkY(doc, y, LINE_H.BODY * 2);
        doc.setFont(FONT.REGULAR, 'normal');
        doc.setFontSize(SIZE.BODY);
        doc.setTextColor(...COLOR.DARK);
        const lines = wrapText(doc, item.description, CONTENT_W);
        for (const line of lines) {
          y = checkY(doc, y, LINE_H.BODY);
          doc.text(line, MARGIN_X, y);
          y += LINE_H.BODY;
        }
      }

      // Techs
      if (item.techs && item.techs.length > 0) {
        y = checkY(doc, y, LINE_H.SMALL);
        doc.setFont(FONT.REGULAR, 'normal');
        doc.setFontSize(SIZE.SMALL);
        doc.setTextColor(...COLOR.LIGHT);
        const techStr = item.techs.join('  ·  ');
        const techLines = wrapText(doc, techStr, CONTENT_W);
        for (const line of techLines) {
          y = checkY(doc, y, LINE_H.SMALL);
          doc.text(line, MARGIN_X, y);
          y += LINE_H.SMALL;
        }
      }

      y += 4; // spacing between items
    }

    y += 6; // spacing between sections
  }

  // ── Download ──────────────────────────────────────────────────────────────────
  const langSuffix = language === 'es' ? 'spanish' : 'english';
  const filename = `cv-emmanuel-chierchie-${langSuffix}.pdf`;
  doc.save(filename);
}

/**
 * Same as `generateAtsPdf` but returns the PDF as a Blob + filename
 * instead of triggering a download. Use this for Web Share API.
 */
export async function generateAtsPdfBlob(
  json: ResumeJson,
  language: 'en' | 'es' = 'en'
): Promise<{ blob: Blob; filename: string }> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

  let y = MARGIN_Y;

  doc.setFont(FONT.BOLD, 'bold');
  doc.setFontSize(SIZE.NAME);
  doc.setTextColor(...COLOR.BLACK);
  doc.text(json.name, MARGIN_X, y);
  y += LINE_H.NAME + 3;

  if (json.roles.length > 0) {
    doc.setFont(FONT.REGULAR, 'normal');
    doc.setFontSize(SIZE.ROLES);
    doc.setTextColor(...COLOR.MID);
    doc.text(json.roles.join('  ·  '), MARGIN_X, y);
    y += LINE_H.BODY + 2;
  }

  drawHr(doc, y);
  y += 5;

  doc.setFont(FONT.REGULAR, 'normal');
  doc.setFontSize(SIZE.SMALL);
  doc.setTextColor(...COLOR.MID);
  doc.text(
    'art.emmchier.com  ·  design.emmchier.com  ·  @emmchier',
    MARGIN_X,
    y
  );
  y += LINE_H.SMALL + 4;

  drawHr(doc, y);
  y += 6;

  for (const section of json.sections) {
    y = checkY(doc, y, 14);
    doc.setFont(FONT.BOLD, 'bold');
    doc.setFontSize(SIZE.SECTION_TITLE);
    doc.setTextColor(...COLOR.BLACK);
    doc.text(section.name.toUpperCase(), MARGIN_X, y);
    y += LINE_H.SECTION + 1;
    drawHr(doc, y);
    y += 5;

    for (const item of section.items) {
      y = checkY(doc, y, 10);
      doc.setFont(FONT.BOLD, 'bold');
      doc.setFontSize(SIZE.ITEM_TITLE);
      doc.setTextColor(...COLOR.DARK);
      doc.text(item.role, MARGIN_X, y);

      if (item.dateFrom || item.dateTo) {
        const dateStr =
          item.dateFrom === item.dateTo
            ? (item.dateFrom ?? '')
            : `${item.dateFrom ?? ''}${item.dateTo ? ' – ' + item.dateTo : ''}`;
        doc.setFont(FONT.REGULAR, 'normal');
        doc.setFontSize(SIZE.SMALL);
        doc.setTextColor(...COLOR.LIGHT);
        const dateW = doc.getTextWidth(dateStr);
        doc.text(dateStr, PAGE_W - MARGIN_X - dateW, y);
      }
      y += LINE_H.BODY;

      if (item.company) {
        doc.setFont(FONT.REGULAR, 'italic');
        doc.setFontSize(SIZE.BODY);
        doc.setTextColor(...COLOR.MID);
        doc.text(item.company, MARGIN_X, y);
        y += LINE_H.BODY;
      }

      if (item.description) {
        y = checkY(doc, y, LINE_H.BODY * 2);
        doc.setFont(FONT.REGULAR, 'normal');
        doc.setFontSize(SIZE.BODY);
        doc.setTextColor(...COLOR.DARK);
        const lines = wrapText(doc, item.description, CONTENT_W);
        for (const line of lines) {
          y = checkY(doc, y, LINE_H.BODY);
          doc.text(line, MARGIN_X, y);
          y += LINE_H.BODY;
        }
      }

      if (item.techs && item.techs.length > 0) {
        y = checkY(doc, y, LINE_H.SMALL);
        doc.setFont(FONT.REGULAR, 'normal');
        doc.setFontSize(SIZE.SMALL);
        doc.setTextColor(...COLOR.LIGHT);
        const techStr = item.techs.join('  ·  ');
        const techLines = wrapText(doc, techStr, CONTENT_W);
        for (const line of techLines) {
          y = checkY(doc, y, LINE_H.SMALL);
          doc.text(line, MARGIN_X, y);
          y += LINE_H.SMALL;
        }
      }
      y += 4;
    }
    y += 6;
  }

  const langSuffix = language === 'es' ? 'spanish' : 'english';
  const filename = `cv-emmanuel-chierchie-${langSuffix}.pdf`;
  const blob = doc.output('blob');
  return { blob, filename };
}
