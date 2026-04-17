import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PageTransition, motion, fadeInUp } from "@/components/ui/motion";
import { useToast } from "@/components/ui/toast";
import { getThemePreference, setThemePreference } from "@/lib/theme";

export default function StaffSettings() {
  const toast = useToast();
  const [theme, setThemeState] = useState(() => getThemePreference());

  useEffect(() => {
    setThemeState(getThemePreference());
  }, []);

  const applyThemeChoice = (mode) => {
    if (mode === theme) return;
    setThemeState(mode);
    setThemePreference(mode);
    toast("Theme updated", "success");
  };

  return (
    <PageTransition>
      <motion.div variants={fadeInUp} initial="initial" animate="animate" className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold font-headline text-on-surface dark:text-neutral-100 tracking-tight">Settings</h1>
          <p className="text-on-surface-variant dark:text-neutral-400 mt-1">Staff portal appearance (shared with other portals).</p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/staff">
            <Icon name="arrow_back" className="text-sm" />
            Dashboard
          </Link>
        </Button>
      </motion.div>

      <motion.div className="mt-8 max-w-xl" variants={fadeInUp} initial="initial" animate="animate" transition={{ delay: 0.05 }}>
        <Card className="dark:bg-zinc-900 dark:border-zinc-800 border border-surface-container-low">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="contrast" className="text-secondary" />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {[
              { id: "light", label: "Light", icon: "light_mode" },
              { id: "dark", label: "Dark", icon: "dark_mode" },
              { id: "system", label: "System", icon: "brightness_auto" },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => applyThemeChoice(opt.id)}
                className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
                  theme === opt.id
                    ? "border-secondary bg-secondary-container/40 text-on-surface dark:text-neutral-100"
                    : "border-surface-container-highest dark:border-zinc-700 text-on-surface-variant hover:bg-surface-container-low dark:hover:bg-zinc-800"
                }`}
              >
                <Icon name={opt.icon} className="text-base" />
                {opt.label}
              </button>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    </PageTransition>
  );
}
         