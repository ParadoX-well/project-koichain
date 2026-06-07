'use client';

import { useState, useEffect } from 'react';
import { X, ZoomIn } from 'lucide-react';
import Image from 'next/image';

interface ImageLightboxProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  fill?: boolean;
}

export default function ImageLightbox({ src, alt, className = '', width, height, fill = false }: ImageLightboxProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Mencegah scroll saat lightbox terbuka
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      {/* Thumbnail Container */}
      <div 
        className={`group relative cursor-zoom-in overflow-hidden ${fill ? 'w-full h-full' : ''} ${className}`}
        onClick={() => setIsOpen(true)}
      >
        {fill ? (
            <Image src={src} alt={alt} fill unoptimized={true} className="object-cover group-hover:scale-105 transition duration-500" />
        ) : (
            <Image src={src} alt={alt} width={width || 500} height={height || 500} unoptimized={true} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
        )}
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
            <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transform scale-50 group-hover:scale-100 transition-all duration-300 drop-shadow-md" size={32} />
        </div>
      </div>

      {/* Lightbox Modal */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 md:p-12 animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        >
          {/* Tombol Close */}
          <button 
            className="absolute top-6 right-6 text-white/70 hover:text-white bg-black/50 hover:bg-black p-2 rounded-full transition z-[1000]"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
            }}
          >
            <X size={28} />
          </button>

          {/* Gambar Besar */}
          <div className="relative w-full h-full max-w-5xl max-h-[90vh] flex items-center justify-center">
             {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={src} 
              alt={alt} 
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300"
              onClick={(e) => e.stopPropagation()} // Mencegah lightbox tertutup jika gambar di-klik
            />
          </div>
        </div>
      )}
    </>
  );
}
