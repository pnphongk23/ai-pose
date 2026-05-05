'use client';

import Link from 'next/link';
import { Shield, Users, ChevronLeft } from 'lucide-react';
import NavButton from '@/components/NavButton';

const ADMIN_SECTIONS = [
  {
    href: '/admin/keys',
    icon: Shield,
    title: 'API Keys',
    description: 'Manage Gemini API keys for pose extraction',
    bg: 'bg-accent-yellow',
  },
  {
    href: '/admin/community',
    icon: Users,
    title: 'Community Poses',
    description: 'Upload and manage community pose library',
    bg: 'bg-accent-green',
  },
];

export default function AdminHomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-bg px-4 py-6">
      <div className="flex items-center gap-3 mb-8">
        <NavButton href="/" icon={ChevronLeft} label="Back" />
        <h1 className="text-xl font-extrabold tracking-neo">ADMIN</h1>
      </div>

      <div className="flex flex-col gap-4">
        {ADMIN_SECTIONS.map(({ href, icon: Icon, title, description, bg }) => (
          <Link key={href} href={href}>
            <div className={`rounded-2xl neo-border ${bg} p-4 neo-shadow-md neo-press cursor-pointer`}>
              <div className="flex items-center gap-3">
                <div className="rounded-xl neo-border bg-white p-2">
                  <Icon size={20} />
                </div>
                <div>
                  <div className="text-[15px] font-extrabold tracking-neo">{title}</div>
                  <div className="text-[11px] font-bold opacity-70">{description}</div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
