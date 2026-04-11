'use client';

export default function TabSwitcher({ tabs, activeTab, onTabChange }) {
  return (
    <div className="flex w-full items-center gap-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex-1 flex items-center justify-center rounded-xl neo-border px-4 py-2 neo-shadow-sm neo-press
            text-[11px] font-bold tracking-neo-wide
            transition-colors duration-150
            ${activeTab === tab.id ? 'bg-accent-blue' : 'bg-bg-primary'}`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
