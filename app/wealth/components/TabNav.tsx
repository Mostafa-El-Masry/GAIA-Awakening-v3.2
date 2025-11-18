interface TabNavProps {
  tabKey: string;
  title: string;
  isSelected: boolean;
  isActive?: boolean;
  isComplete?: boolean;
  onClick: () => void;
}

export function TabNav({
  tabKey,
  title,
  isSelected,
  isActive,
  isComplete,
  onClick,
}: TabNavProps) {
  return (
    <button
      key={tabKey}
      onClick={onClick}
      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
        isSelected && isActive
          ? "bg-primary text-primary-foreground shadow-md scale-110 ring-2 ring-primary/30"
          : isSelected
          ? "bg-primary text-primary-foreground shadow-sm"
          : isComplete
          ? "bg-green-100 text-green-800 border border-green-300 shadow-sm"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
      }`}
    >
      {title}
    </button>
  );
}
