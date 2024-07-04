'use client';

import React from 'react';
import { Button } from '../ui/button';
import { ChevronLeft } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { getSettingsList } from '@/config/settings-list';
import { cn } from '@/lib/utils';
import SettingsMenuButton from './settings-menu-button';

export default function SettingsMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const setingsList = getSettingsList(pathname);
  return (
    <div className="space-y-3">
      <Button variant="ghost" onClick={() => router.push('/dashboard')}>
        <ChevronLeft className="mr-1 size-4" />
        Settings
      </Button>
      <nav className="h-full w-full">
        <ul className="flex flex-col items-start space-y-1">
          {setingsList.map(({ groupLabel, menus }, index) => (
            <li className={cn('w-full', groupLabel ? 'pt-1' : '')} key={index}>
              <p className="max-w-[248px] truncate px-4 pb-2 text-sm font-medium text-muted-foreground">
                {groupLabel}
              </p>
              {menus.map(({ href, label, active }, index) => (
                <div className="w-full" key={index}>
                  <SettingsMenuButton
                    active={active}
                    label={label}
                    href={href}
                  />
                </div>
              ))}
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
