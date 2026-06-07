import { ReactNode } from 'react';

export enum CollectionType {
  DRAWINGS = 'drawings',
  BOOKS = 'books',
  SKETCHS = 'sketchs',
  PAINTINGS = 'paintings',
  CHARACTERS = 'characters',
}

export interface Navlinks {
  name: string;
}

export interface WorkItem {
  name: string;
  slug: string;
  category?: string;
  isSubItem?: boolean;
  isExpandable?: boolean;
  isLinkable?: boolean;
  subItems?: WorkItem[]; // Mantiene la jerarquía de subitems
  description?: string;
  tools?: string[];
  year?: string;
  images?: GalleryImage[];
  makingOf?: unknown;
  order?: number;
  process?: ReactNode;
  createdAt?: string;
  readingTime?: number; // Tiempo de lectura en minutos
}

export interface WorkData {
  name: string;
  slug: string;
  items: WorkItem[];
}

export interface ProcessedItem {
  name: string;
  slug: string; // slug es opcional ya que no siempre se incluye
  isExpandable?: boolean;
  subItems?: {
    // Subitems solo estarán presentes si el item es expandible y tiene subitems
    name: string;
    slug: string;
    isExpandable?: boolean;
  }[];
}

export interface Illustration {
  image: string;
  altText: string;
  title: string;
  slug: string;
  createdAt: string;
}

export interface GalleryImage {
  id?: string;
  url: string;
  width: number;
  height: number;
  alt: string;
  /** Shareable URL: "/{category}/image/{id}?item=...". Set when the list is ready. */
  urlToShare?: string;
}

// Contentful types
export interface ContentfulCategory {
  fields?: {
    slug?: string;
    title?: string;
    name?: string;
    projectsTree?: unknown[];
    items?: unknown[];
    gallery?: unknown[];
    images?: GalleryImage[];
    [key: string]: unknown;
  };
  slug?: string;
  title?: string;
  name?: string;
  projectsTree?: unknown[];
  items?: unknown[];
  [key: string]: unknown;
}

// ─── Resume (emmchier Contentful space) ──────────────────────────────────────

export type ResumeSectionSlug =
  | 'work-experience'
  | 'courses'
  | 'studies'
  | 'languages';

export interface ResumeWorkItem {
  id: string;
  name: string; // job title / role
  company: string;
  description?: string;
  startDate?: string; // ISO date string — extract year for display
  endDate?: string; // ISO date string — undefined = ongoing ("Act.")
  techs: string[];
}

export interface ResumeCourseItem {
  id: string;
  name: string;
  company: string;
  description?: string;
  startDate?: string;
  endDate?: string;
}

export interface ResumeStudyItem {
  id: string;
  name: string;
  company: string;
  startDate?: string;
  endDate?: string;
}

export interface ResumeLanguageItem {
  id: string;
  name: string;
  description: string; // e.g. "Native", "Fluent"
}

export type ResumeAnyItem =
  | ResumeWorkItem
  | ResumeCourseItem
  | ResumeStudyItem
  | ResumeLanguageItem;

export interface ResumeSection {
  slug: ResumeSectionSlug;
  name: string; // localised — from Contentful Section.name
  comment?: string; // e.g. "// what I've been up to" — from Contentful Section.comment
  items: ResumeAnyItem[];
}

export interface ResumeData {
  roles: string[]; // max 3 — drives RotatingRoleLine
  image?: string; // fully-qualified URL of the avatar image from Contentful
  sections: ResumeSection[]; // only non-empty sections; canonical order: work-experience, courses, studies, languages
}

// ─── ATS JSON model ───────────────────────────────────────────────────────────

export interface ResumeJsonItem {
  company?: string;
  role: string;
  dateFrom?: string;
  dateTo?: string;
  description?: string;
  techs?: string[];
}

export interface ResumeJsonSection {
  name: string;
  comment?: string;
  items: ResumeJsonItem[];
}

export interface ResumeJson {
  name: string; // always "Emmanuel Chierchié"
  roles: string[];
  sections: ResumeJsonSection[];
}
