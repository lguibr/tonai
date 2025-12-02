import React from 'react';
import { Settings, Music } from 'lucide-react';

interface NavbarProps {
  onSettingsClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onSettingsClick }) => {
  return (
    <div className="h-14 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between px-6 shrink-0 z-50">
      <div className="flex items-center gap-3">
        <img src="/logo.png" alt="TonAI" className="h-8 w-auto" />
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={onSettingsClick}
          className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors"
          title="Settings"
        >
          <Settings size={20} />
        </button>
      </div>
    </div>
  );
};

export default Navbar;
