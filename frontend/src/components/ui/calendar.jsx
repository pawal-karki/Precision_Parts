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
    <div className={cn("p-4 bg-white dark:bg-neutral-900 rounded-2xl border border-outline-variant shadow-2xl animate-in fade-in zoom-in-95 duration-200", className)} {...props}>
      <div className="flex items-center justify-between mb-5 px-1">
        <span className="text-xs font-black uppercase tracking-widest text-on-surface dark:text-neutral-100">
          {monthNames[month]} <span className="text-secondary">{year}</span>
        </span>
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-outline-variant hover:bg-secondary/10 hover:text-secondary transition-all" onClick={prevMonth}>
            <Icon name="chevron_left" className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-outline-variant hover:bg-secondary/10 hover:text-secondary transition-all" onClick={nextMonth}>
            <Icon name="chevron_right" className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black text-outline-variant uppercase mb-3">
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map(d => (
          <span key={d} className="w-9 h-9 flex items-center justify-center">{d}</span>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1 text-center font-sans">
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
                "h-9 w-9 text-xs p-0 font-bold transition-all rounded-xl flex items-center justify-center relative group",
                active 
                  ? "bg-secondary text-on-secondary shadow-lg shadow-secondary/30 scale-110 z-10" 
                  : "hover:bg-secondary/10 hover:text-secondary text-on-surface dark:text-neutral-300",
                today && !active && "border border-secondary/30 text-secondary"
              )}
            >
              {d}
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
