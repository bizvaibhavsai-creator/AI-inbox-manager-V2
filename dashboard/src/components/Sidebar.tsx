"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Target, MessageSquare, Inbox } from "lucide-react";

const navItems = [
  { href: "/", label: "Overview", icon: BarChart3 },
  { href: "/campaigns", label: "Campaigns", icon: Target },
  { href: "/replies", label: "Replies", icon: MessageSquare },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-card border-r border-border flex flex-col z-50">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-border">
        <Inbox className="w-6 h-6 text-accent" />
        <span className="text-[15px] font-semibold text-text-primary tracking-tight">
          Inbox Manager
        </span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
                isActive
                  ? "bg-accent-light text-accent"
                  : "text-text-secondary hover:text-text-primary hover:bg-gray-50"
              }`}
            >
              <Icon className="w-[18px] h-[18px]" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-5 py-4 border-t border-border">
        <p className="text-[11px] text-text-muted">AI Inbox Manager v1.0</p>
      </div>
    </aside>
  );
}
