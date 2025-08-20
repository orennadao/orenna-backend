'use client';

import { cn } from '@/lib/utils';

interface ProfileTab {
  id: string;
  label: string;
  component: React.ComponentType<any>;
}

interface ProfileTabsProps {
  tabs: ProfileTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function ProfileTabs({ tabs, activeTab, onTabChange }: ProfileTabsProps) {
  return (
    <div className="border-b border-gray-200 bg-white rounded-lg overflow-hidden">
      {/* Desktop Tabs */}
      <div className="hidden md:block">
        <nav className="flex space-x-6 lg:space-x-8 px-4 lg:px-6 overflow-x-auto" aria-label="Profile sections">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "py-3 lg:py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap flex-shrink-0",
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Mobile Select */}
      <div className="md:hidden p-3 lg:p-4">
        <label htmlFor="tab-select" className="sr-only">
          Select profile section
        </label>
        <select
          id="tab-select"
          value={activeTab}
          onChange={(e) => onTabChange(e.target.value)}
          className="block w-full rounded-md border-gray-300 py-2.5 pl-3 pr-10 text-sm lg:text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 bg-white"
        >
          {tabs.map((tab) => (
            <option key={tab.id} value={tab.id}>
              {tab.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}