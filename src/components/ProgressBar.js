'use client';

export default function ProgressBar({ progress = 0, label = '', className = '' }) {
  return (
    <div className={`flex w-full flex-col items-start gap-2 ${className}`}>
      <div className="flex w-full items-center justify-between">
        <span className="text-[11px] font-bold tracking-neo-wide uppercase">
          {label}
        </span>
        <span className="text-[11px] font-semibold opacity-50">
          {Math.round(progress)}%
        </span>
      </div>
      <div className="flex h-3 w-full items-center rounded-full neo-border bg-white relative">
        <div
          className="flex items-start self-stretch rounded-l-full bg-accent-blue transition-all duration-500 ease-out"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
        <div
          className="flex h-5 w-5 items-center justify-center rounded-full neo-border bg-accent-blue neo-shadow-sm absolute transition-all duration-500 ease-out"
          style={{ left: `calc(${Math.min(progress, 100)}% - 10px)` }}
        />
      </div>
    </div>
  );
}
