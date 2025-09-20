'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedBackgroundProps {
  variant?: 'gradient' | 'mesh' | 'particles' | 'waves';
  className?: string;
  children?: React.ReactNode;
}

export function AnimatedBackground({
  variant = 'gradient',
  className,
  children
}: AnimatedBackgroundProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={cn('min-h-screen bg-gradient-to-br from-slate-50 to-slate-100', className)}>
        {children}
      </div>
    );
  }

  switch (variant) {
    case 'mesh':
      return (
        <div className={cn('min-h-screen relative overflow-hidden', className)}>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
            <div className="absolute inset-0 opacity-30">
              <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="mesh" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" className="text-blue-200" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#mesh)" />
              </svg>
            </div>
          </div>
          <div className="relative z-10">
            {children}
          </div>
        </div>
      );

    case 'particles':
      return (
        <div className={cn('min-h-screen relative overflow-hidden', className)}>
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full opacity-60 animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${2 + Math.random() * 2}s`
                }}
              />
            ))}
          </div>
          <div className="relative z-10">
            {children}
          </div>
        </div>
      );

    case 'waves':
      return (
        <div className={cn('min-h-screen relative overflow-hidden', className)}>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500">
            <svg className="absolute bottom-0 w-full" viewBox="0 0 1200 120" preserveAspectRatio="none">
              <path
                d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z"
                opacity=".25"
                fill="rgba(255,255,255,0.1)"
                className="animate-pulse"
              />
              <path
                d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z"
                opacity=".5"
                fill="rgba(255,255,255,0.2)"
                className="animate-pulse"
                style={{ animationDelay: '1s' }}
              />
              <path
                d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z"
                fill="rgba(255,255,255,0.3)"
                className="animate-pulse"
                style={{ animationDelay: '2s' }}
              />
            </svg>
          </div>
          <div className="relative z-10">
            {children}
          </div>
        </div>
      );

    default: // gradient
      return (
        <div className={cn('min-h-screen relative overflow-hidden', className)}>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
            <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
            <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
          </div>
          <div className="relative z-10">
            {children}
          </div>
        </div>
      );
  }
}

// Add custom animations to global CSS
const customStyles = `
@keyframes blob {
  0% {
    transform: translate(0px, 0px) scale(1);
  }
  33% {
    transform: translate(30px, -50px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }
  100% {
    transform: translate(0px, 0px) scale(1);
  }
}

.animate-blob {
  animation: blob 7s infinite;
}

.animation-delay-2000 {
  animation-delay: 2s;
}

.animation-delay-4000 {
  animation-delay: 4s;
}
`;

// Inject styles if not already present
if (typeof document !== 'undefined' && !document.getElementById('animated-background-styles')) {
  const styleElement = document.createElement('style');
  styleElement.id = 'animated-background-styles';
  styleElement.textContent = customStyles;
  document.head.appendChild(styleElement);
}