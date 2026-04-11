'use client';

const BADGE_STYLES = {
  mine: 'bg-accent-green',
  hot: 'bg-accent-pink',
  new: 'bg-accent-yellow',
  tag: 'bg-white',
};

const BADGE_SIZES = {
  sm: 'px-1.5 py-0.5 text-[8px] leading-[12px]',
  md: 'px-2.5 py-1 text-[10px] leading-[14px]',
};

export default function Badge({ type = 'tag', label, size = 'sm', className = '' }) {
  const bgClass = BADGE_STYLES[type] || BADGE_STYLES.tag;
  const sizeClass = BADGE_SIZES[size] || BADGE_SIZES.sm;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-[6px] neo-border font-bold tracking-neo-wide ${bgClass} ${sizeClass} ${className}`}
    >
      {label}
    </span>
  );
}
