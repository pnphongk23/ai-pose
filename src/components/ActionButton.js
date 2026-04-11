'use client';

export default function ActionButton({ 
  children, 
  onClick, 
  icon: Icon, 
  bg = 'bg-accent-pink', 
  className = '',
  disabled = false,
  fullWidth = true,
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center gap-2 rounded-xl neo-border ${bg} px-5 py-3 neo-shadow-lg neo-press
        font-bold text-[13px] tracking-neo text-text-primary
        disabled:opacity-50 disabled:cursor-not-allowed
        ${fullWidth ? 'w-full' : ''}
        ${className}`}
    >
      {Icon && <Icon size={14} strokeWidth={2} />}
      {children}
    </button>
  );
}
