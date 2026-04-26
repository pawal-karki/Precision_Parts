import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/lib/auth";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { to: "/admin", icon: "dashboard", label: "Dashboard", end: true },
  { to: "/admin/audit-log", icon: "fact_check", label: "Audit Log" },
  { to: "/admin/inventory", icon: "inventory_2", label: "Inventory" },
  { to: "/admin/purchase-invoices", icon: "local_shipping", label: "Purchases" },
  { to: "/admin/sales", icon: "point_of_sale", label: "Sales / POS" },
  { to: "/admin/staff", icon: "badge", label: "Staff" },
  { to: "/admin/customers", icon: "group", label: "Customers" },
  { to: "/admin/reports", icon: "analytics", label: "Reports" },
  { to: "/admin/vendors", icon: "storefront", label: "Vendors" },
];

export default function AdminLayout() {
  const { dark, toggle } = useTheme();
  const { logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const SidebarContent = ({ isMobile = false }) => (
    <>
      <div className="px-6 mb-8 flex items-center gap-3">
        <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center text-white">
          <Icon name="precision_manufacturing" filled />
        </div>
        <div>
          <h2 className="font-manrope font-extrabold text-lg text-neutral-800 dark:text-neutral-100 leading-none">
            Precision Parts
          </h2>
          <span className="text-[10px] text-slate-500 uppercase tracking-widest">
            Industrial Inventory
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => isMobile && setIsSidebarOpen(false)}
            className={({ isActive }) =>
              cn(
                "flex items-center px-6 py-2.5 transition-colors duration-200 rounded-xl mx-2 my-1",
                isActive
                  ? "bg-secondary text-white font-bold shadow-lg shadow-secondary/20"
                  : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-100 hover:bg-neutral-200/50 dark:hover:bg-neutral-800/30"
              )
            }
          >
            <Icon name={item.icon} className="mr-3" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-6 mt-auto space-y-1 pt-4">
        <Button className="w-full mb-6" variant="default">
          <Icon name="add" className="text-sm" />
          New Entry
        </Button>
        <NavLink
          to="/admin/settings"
          onClick={() => isMobile && setIsSidebarOpen(false)}
          className={({ isActive }) =>
            cn(
              "flex items-center py-2 transition-colors",
              isActive
                ? "text-neutral-900 dark:text-white font-semibold"
                : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-100"
            )
          }
        >
          <Icon name="settings" className="mr-3" />
          Settings
        </NavLink>
        <button
          onClick={logout}
          className="w-full flex items-center py-2 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-100 transition-colors"
        >
          <Icon name="logout" className="mr-3" />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-white dark:bg-neutral-950">
      {/* Mobile Drawer */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-neutral-950/50 backdrop-blur-sm z-[50] lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 h-screen w-72 bg-neutral-100 dark:bg-neutral-900 z-[60] flex flex-col py-6 lg:hidden"
            >
              <SidebarContent isMobile />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex h-screen sticky left-0 top-0 w-64 bg-neutral-100 dark:bg-neutral-900 flex-col py-6 font-manrope tracking-tight text-sm border-r border-surface-container dark:border-neutral-800 shrink-0">
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Nav */}
        <header className="sticky top-0 w-full z-40 bg-white/85 dark:bg-neutral-950/85 backdrop-blur-xl flex justify-between items-center h-16 px-4 md:px-8 shadow-sm dark:shadow-none font-manrope text-sm transition-all duration-300">
          <div className="flex items-center gap-2 md:gap-4 flex-1 mr-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50 rounded-lg transition-colors"
            >
              <Icon name="menu" />
            </button>
            <div className="flex items-center bg-surface-container dark:bg-neutral-900 rounded-lg px-3 py-1.5 w-full max-w-sm">
              <Icon name="search" className="text-slate-400 mr-2" />
              <input
                className="bg-transparent border-none focus:ring-0 text-sm w-full text-on-surface-variant dark:text-neutral-300 placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
                placeholder="Search inventory..."
                type="text"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            <button type="button" className="hidden sm:block text-slate-600 dark:text-slate-300 hover:text-slate-800 transition-all relative">
              <Icon name="notifications" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-error rounded-full" />
            </button>
            <button
              type="button"
              onClick={toggle}
              className="text-slate-600 dark:text-slate-300 hover:text-slate-800 transition-all"
            >
              <Icon name={dark ? "light_mode" : "dark_mode"} />
            </button>
            <div className="flex items-center gap-3 pl-3 md:pl-4 border-l border-surface-container-highest dark:border-neutral-800">
              <div className="hidden sm:block text-right leading-tight">
                <p className="font-bold text-slate-900 dark:text-neutral-200">
                  Adrian Vance
                </p>
                <p className="text-[10px] text-slate-500 uppercase tracking-tighter">
                  Chief Engineer
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-white text-xs font-bold">
                AV
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-8 space-y-8 dark:bg-neutral-950 flex-1">
          <Outlet />
        </div>

        <footer className="mt-auto py-4 px-4 md:px-8 text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-slate-400 border-t border-surface-container-low dark:border-neutral-800 flex flex-col md:flex-row justify-between gap-2 text-center md:text-left dark:bg-neutral-950">
          <span>Precision Parts System v4.2.0</span>
          <span>All systems operational &bull; Secure encrypted layer</span>
        </footer>
      </main>
    </div>
  );
}
    