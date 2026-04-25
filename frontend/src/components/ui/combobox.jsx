import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "./icon";
import { motion, AnimatePresence } from "framer-motion";

export function Combobox({ options, value, onChange, placeholder = "Select option...", className }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef(null);

  const selectedOption = options.find((o) => o.value === value);

  const filteredOptions = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      <div
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) setSearch("");
        }}
        className={cn(
          "flex h-12 w-full cursor-pointer items-center justify-between rounded-xl border border-outline-variant/60 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 px-4 py-3 text-base text-on-surface dark:text-neutral-200 focus-within:ring-2 focus-within:ring-secondary/20 dark:focus-within:ring-secondary/10 focus-within:border-secondary dark:focus-within:border-neutral-700 transition-all shadow-sm shadow-black/5",
          isOpen && "ring-2 ring-secondary/20 border-secondary"
        )}
      >
        <span className={cn("truncate", !selectedOption && "text-on-surface-variant/70 dark:text-neutral-500")}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <Icon name="expand_more" className={cn("text-xl transition-transform", isOpen && "rotate-180")} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-[100] mt-2 w-full rounded-xl border border-outline-variant/60 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xl overflow-hidden"
          >
            <div className="p-2 border-b border-outline-variant/30 dark:border-neutral-800/50">
              <div className="relative">
                <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm" />
                <input
                  autoFocus
                  className="w-full bg-surface-container-low dark:bg-neutral-800 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
            <div className="max-h-60 overflow-y-auto p-1 custom-scrollbar">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => (
                  <div
                    key={opt.value}
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                      setSearch("");
                    }}
                    className={cn(
                      "flex items-center justify-between px-3 py-2.5 rounded-lg text-sm cursor-pointer hover:bg-secondary/10 dark:hover:bg-neutral-800 transition-colors",
                      value === opt.value ? "bg-secondary text-white" : "text-on-surface dark:text-neutral-300"
                    )}
                  >
                    <span>{opt.label}</span>
                    {value === opt.value && <Icon name="check" className="text-sm" />}
                  </div>
                ))
              ) : (
                <div className="px-3 py-4 text-center text-sm text-on-surface-variant dark:text-neutral-500">
                  No results found
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
