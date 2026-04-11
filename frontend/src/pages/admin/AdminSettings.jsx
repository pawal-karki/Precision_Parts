import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PageTransition, motion, fadeInUp } from "@/components/ui/motion";
import { useToast } from "@/components/ui/toast";
import { getThemePreference, setThemePreference } from "@/lib/theme";

const DIGEST_KEY = "precision-parts-email-digest";
const COMPACT_KEY = "precision-parts-compact-tables";

export default function AdminSettings() {
  const toast = useToast();
  const [theme, setTheme] = useState(() => getThemePreference());
  const [digest, setDigest] = useState(() => localStorage.getItem(DIGEST_KEY) === "1");
  const [stockAlerts, setStockAlerts] = useState(() => localStorage.getItem("precision-parts-stock-alerts") !== "0");
  const [compact, setCompact] = useState(() => localStorage.getItem(COMPACT_KEY) === "1");

  useEffect(() => {
    setTheme(getThemePreference());
  }, []);

  const applyThemeChoice = (mode) => {
    setTheme(mode);
    setThemePreference(mode);
  };

  const save = () => {
    localStorage.setItem(DIGEST_KEY, digest ? "1" : "0");
    localStorage.setItem("precision-parts-stock-alerts", stockAlerts ? "1" : "0");
    localStorage.setItem(COMPACT_KEY, compact ? "1" : "0");
    toast("Settings saved", "success");
  };

  const apiBase = import.meta.env.VITE_API_URL?.trim() || "(default) http://localhost:5147/api";

  return (
    <PageTransition>
      <motion.div variants={fadeInUp} initial="initial" animate="animate">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold font-headline text-on-surface dark:text-neutral-100 tracking-tight">
              Settings
            </h1>
            <p className="text-on-surface-variant dark:text-neutral-400 mt-1 max-w-xl">
              Appearance, notifications, and workspace preferences for the admin console.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/admin">
              <Icon name="arrow_back" className="text-sm" />
              Back to dashboard
            </Link>
          </Button>
        </div>
      </motion.div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2 max-w-5xl">
        <motion.div variants={fadeInUp} initial="initial" animate="animate" transition={{ delay: 0.05 }}>
          <Card className="dark:bg-[#1C1C1C] dark:border-neutral-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Icon name="contrast" className="text-secondary" />
                Appearance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-on-surface-variant">Theme is stored in this browser and applies to admin, staff, and customer portals.</p>
              <div className="flex flex-wrap gap-2">
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
                        : "border-surface-container-highest dark:border-neutral-700 text-on-surface-variant hover:bg-surface-container-low dark:hover:bg-neutral-800"
                    }`}
                  >
                    <Icon name={opt.icon} className="text-base" />
                    {opt.label}
                  </button>
                ))}
              </div>
              <label className="flex items-center justify-between gap-4 rounded-lg border border-surface-container-low dark:border-neutral-800 px-4 py-3 cursor-pointer">
                <span className="text-sm font-medium text-on-surface dark:text-neutral-200">Compact data tables</span>
                <input type="checkbox" className="h-4 w-4 accent-secondary" checked={compact} onChange={(e) => setCompact(e.target.checked)} />
              </label>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeInUp} initial="initial" animate="animate" transition={{ delay: 0.1 }}>
          <Card className="dark:bg-[#1C1C1C] dark:border-neutral-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Icon name="notifications" className="text-secondary" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <label className="flex items-center justify-between gap-4 rounded-lg border border-surface-container-low dark:border-neutral-800 px-4 py-3 cursor-pointer">
                <span className="text-sm font-medium text-on-surface dark:text-neutral-200">Weekly email digest</span>
                <input type="checkbox" className="h-4 w-4 accent-secondary" checked={digest} onChange={(e) => setDigest(e.target.checked)} />
              </label>
              <label className="flex items-center justify-between gap-4 rounded-lg border border-surface-container-low dark:border-neutral-800 px-4 py-3 cursor-pointer">
                <span className="text-sm font-medium text-on-surface dark:text-neutral-200">Low stock &amp; reorder alerts</span>
                <input type="checkbox" className="h-4 w-4 accent-secondary" checked={stockAlerts} onChange={(e) => setStockAlerts(e.target.checked)} />
              </label>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeInUp} initial="initial" animate="animate" transition={{ delay: 0.12 }} className="lg:col-span-2">
          <Card className="dark:bg-[#1C1C1C] dark:border-neutral-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Icon name="code" className="text-secondary" />
                Developer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs font-mono break-all text-on-surface-variant bg-surface-container-low dark:bg-neutral-900 rounded-lg p-3 border border-surface-container-low dark:border-neutral-800">
                VITE_API_URL: {apiBase}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div className="mt-8 max-w-5xl" variants={fadeInUp} initial="initial" animate="animate" transition={{ delay: 0.15 }}>
        <Button onClick={save}>
          <Icon name="save" className="text-sm" />
          Save preferences
        </Button>
      </motion.div>
    </PageTransition>
  );
}
         