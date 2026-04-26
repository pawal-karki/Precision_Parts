import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1;
}

export function Calendar({ 
  selected, 
  onSelect, 
  className,
  ...props 
}) {
  const now = new Date();
  const [viewDate, setViewDate] = React.useState(selected || now);
  
  const month = viewDate.getMonth();
  const year = viewDate.getFullYear();
  
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const prevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };
  
  const nextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const isToday = (day) => {
    const today = new Date();
    return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  };

  const isSelected = (day) => {
    if (!selected) return false;
    return day === selected.getDate() && month === selected.getMonth() && year === selected.getFullYear();
  };

  return (
    <div className={cn("p-6 bg-white dark:bg-[#1A1A1A] rounded-[32px] border border-outline-variant shadow-[0_20px_50px_rgba(0,0,0,0.15)] animate-in fade-in zoom-in-95 duration-300 w-80", className)} {...props}>
      <div className="flex items-center justify-between mb-8 px-2">
        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-on-surface dark:text-neutral-200">
          {monthNames[month]} <span className="text-secondary ml-1">{year}</span>
        </h3>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8 rounded-full border-outline-variant hover:bg-secondary/10 hover:text-secondary hover:border-secondary/30 transition-all duration-300" 
            onClick={prevMonth}
          >
            <Icon name="chevron_left" className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8 rounded-full border-outline-variant hover:bg-secondary/10 hover:text-secondary hover:border-secondary/30 transition-all duration-300" 
            onClick={nextMonth}
          >
            <Icon name="chevron_right" className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-1 text-center mb-4">
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map(d => (
          <span key={d} className="text-[9px] font-black text-on-surface-variant/40 dark:text-neutral-500 uppercase tracking-widest h-9 w-9 flex items-center justify-center">
            {d}
          </span>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1 text-center">
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="h-9 w-9" />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const d = i + 1;
          const active = isSelected(d);
          const today = isToday(d);
          
          return (
            <button
              key={d}
              onClick={() => onSelect(new Date(year, month, d))}
              className={cn(
                "h-9 w-9 text-xs p-0 font-bold transition-all duration-300 rounded-full flex items-center justify-center relative group",
                active 
                  ? "bg-secondary text-on-secondary shadow-xl shadow-secondary/40 scale-110 z-10" 
                  : "hover:bg-secondary/10 hover:text-secondary text-on-surface dark:text-neutral-300",
                today && !active && "text-secondary ring-1 ring-secondary/20"
              )}
            >
              <span className="relative z-10">{d}</span>
              {today && (
                <span className={cn(
                  "absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full",
                  active ? "bg-white" : "bg-secondary"
                )} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
