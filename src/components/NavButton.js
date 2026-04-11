'use client';

import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function NavButton({ icon: Icon = ChevronLeft, onClick, href, className = '', bg = 'bg-bg-primary' }) {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`flex h-8 w-8 items-center justify-center rounded-[10px] neo-border ${bg} neo-shadow-sm neo-press ${className}`}
    >
      <Icon size={14} strokeWidth={2} />
    </button>
  );
}
