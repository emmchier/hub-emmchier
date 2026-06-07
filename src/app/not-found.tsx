import Link from 'next/link';
import { cookies } from 'next/headers';

export default async function NotFound() {
  const lang = (await cookies()).get('language')?.value === 'es' ? 'es' : 'en';

  const texts = {
    en: {
      subtitle: 'Page not found.',
      back: 'Back to home',
    },
    es: {
      subtitle: 'Upss, ocurrió un error.',
      back: 'Volver a Home',
    },
  };

  const t = texts[lang];

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center gap-8"
      style={{ backgroundColor: '#112f40', zIndex: 9999 }}
      data-no-inverted-cursor
    >
      {/* 404 */}
      <span
        className="select-none leading-none tracking-tight text-transparent"
        style={{
          fontFamily: 'Chakra Petch, sans-serif',
          fontWeight: 900,
          fontSize: 'clamp(120px, 22vw, 240px)',
          WebkitTextStroke: '4px #13384D',
        }}
      >
        404
      </span>

      {/* Subtitle */}
      <p
        style={{
          fontFamily: 'Chakra Petch, sans-serif',
          fontWeight: 600,
          fontSize: 'clamp(1.125rem, 2.5vw, 1.75rem)',
          color: '#e5e5e5',
          marginTop: '-16px',
        }}
      >
        {t.subtitle}
      </p>

      {/* Back to home */}
      <Link
        href="/"
        style={{
          fontFamily: 'Chakra Petch, sans-serif',
          fontSize: '0.9rem',
          fontWeight: 500,
          color: '#f6d4c2',
          border: '1px solid #1C4C67',
          padding: '12px 28px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'border-color 0.3s, background 0.3s',
        }}
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 14 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M8.5 2.5L3.5 7L8.5 11.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {t.back}
      </Link>
    </div>
  );
}
