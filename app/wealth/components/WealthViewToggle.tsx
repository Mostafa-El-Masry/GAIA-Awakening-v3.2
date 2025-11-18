import { useState } from 'react';

interface WealthViewToggleProps {
  onViewChange: (view: 'levels' | 'plans') => void;
}

export function WealthViewToggle({ onViewChange }: WealthViewToggleProps) {
  const [activeView, setActiveView] = useState<'levels' | 'plans'>('levels');

  const handleViewChange = (view: 'levels' | 'plans') => {
    setActiveView(view);
    onViewChange(view);
  };

  return (
    <div className="flex p-1 bg-muted rounded-lg w-fit">
      <button
        onClick={() => handleViewChange('levels')}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-all
          ${activeView === 'levels' 
            ? 'bg-background text-foreground shadow-sm' 
            : 'text-muted-foreground hover:text-foreground'
          }`}
      >
        Levels
      </button>
      <button
        onClick={() => handleViewChange('plans')}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-all
          ${activeView === 'plans' 
            ? 'bg-background text-foreground shadow-sm' 
            : 'text-muted-foreground hover:text-foreground'
          }`}
      >
        Plans
      </button>
    </div>
  );
}