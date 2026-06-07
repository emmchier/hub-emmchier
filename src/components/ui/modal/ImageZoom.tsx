'use client';

import Image from 'next/image';
import React, { useEffect, useRef, useState } from 'react';

type ImageZoomProps = {
  src: string;
  alt: string;
  isZoomed?: boolean;
  fade?: boolean;
};

export default function ImageZoom({
  src,
  alt,
  isZoomed,
  fade,
}: ImageZoomProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [startDrag, setStartDrag] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastTap, setLastTap] = useState(0);
  const [initialDistance, setInitialDistance] = useState<number | null>(null);

  useEffect(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, [src]);

  useEffect(() => {
    const preventScroll = (e: TouchEvent) => {
      if (scale > 1) e.preventDefault();
    };
    document.body.addEventListener('touchmove', preventScroll, {
      passive: false,
    });
    return () => {
      document.body.removeEventListener('touchmove', preventScroll);
    };
  }, [scale]);

  const getDistance = (touches: React.TouchList | TouchList) => {
    const [touch1, touch2] = Array.from(touches);
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      setInitialDistance(getDistance(e.touches));
    } else if (e.touches.length === 1 && scale > 1) {
      setStartDrag({
        x: e.touches[0].clientX - offset.x,
        y: e.touches[0].clientY - offset.y,
      });
      setIsDragging(true);
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialDistance) {
      const currentDistance = getDistance(e.touches);
      const newScale = Math.max(
        1,
        Math.min(3, (currentDistance / initialDistance) * scale)
      );
      setScale(newScale);
    } else if (e.touches.length === 1 && isDragging) {
      setOffset({
        x: e.touches[0].clientX - startDrag.x,
        y: e.touches[0].clientY - startDrag.y,
      });
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (e.changedTouches.length === 1 && e.touches.length < 2) {
      const now = Date.now();
      if (now - lastTap < 300) {
        if (scale > 1) {
          setScale(1);
          setOffset({ x: 0, y: 0 });
        } else {
          setScale(2);
        }
      }
      setLastTap(now);
    }
    setIsDragging(false);
    setInitialDistance(null);
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setStartDrag({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    }
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setOffset({
        x: e.clientX - startDrag.x,
        y: e.clientY - startDrag.y,
      });
    }
  };

  const onMouseUp = () => setIsDragging(false);

  const onMouseLeave = () => setIsDragging(false);

  const onDoubleClick = () => {
    if (scale === 1) {
      setScale(2);
    } else {
      setScale(1);
      setOffset({ x: 0, y: 0 });
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full select-none ${
        isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'
      } ${fade ? 'opacity-0' : 'opacity-100'} transition-all duration-500 ease-in-out`}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      onDoubleClick={onDoubleClick}
    >
      <Image
        ref={imgRef}
        src={src}
        alt={alt}
        fill
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          transformOrigin: 'center center',
        }}
        className={`max-w-none transition-transform duration-300 ease-in-out select-none object-contain ${isZoomed ? 'pointer-events-none' : ''}`}
        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 80vw, 60vw"
        draggable={false}
      />
    </div>
  );
}
