import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme";

const sidebarItems = [
  { to: "/customer", icon: "dashboard", label: "Overview", end: true },
  { to: "/customer/booking", icon: "calendar_today", label: "Calendar" },
  { to: "/customer/parts", icon: "precision_manufacturing", label: "Inventory" },
  { to: "/customer/orders", icon: "history", label: "History" },
  { to: "/customer/payments", icon: "payments", label: "Payments" },
  { to: "/customer/profile", icon: "directions_car", label: "Garage" },
];

const topLinks = [
  { to: "/customer", label: "Dashboard" },
  { to: "/customer/booking", label: "Services" },
  { to: "/customer/orders", label: "Orders" },
  { to: "/customer/parts", label: "Parts" },
];

const bottomNav = [
  { to: "/customer", icon: "dashboard", label: "Overview", end: true },
  { to: "/customer/parts", icon: "precision_manufacturing", label: "Parts" },
  { to: "/customer/orders", icon: "history", label: "History" },
  { to: "/customer/profile", icon: "person", label: "Profile" },
];

export default function CustomerLayout() {
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();

  const handleSignOut = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen">
      {/* Top Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/85 dark:bg-[#1C1C1C]/85 backdrop-blur-md shadow-sm dark:shadow-black/20">
        <div className="flex justify-between items-center w-full px-6 py-3 max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-8">
            <NavLink to="/customer" className="text-xl font-bold tracking-tighter text-neutral-800 dark:text-neutral-100 font-headline">
              Precision Parts
            </NavLink>
            <div className="hidden md:flex items-center gap-6">
              {topLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === "/customer"}
                  className={({ isActive }) =>
                    cn(
                      "font-headline tracking-tight font-semibold transition-all duration-200",
                      isActive
                        ? "text-neutral-900 dark:text-white border-b-2 border-stone-400 dark:border-neutral-500 pb-1"
                        : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200"
                    )
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <NavLink
              to="/customer/notifications"
              className="p-2 rounded-full hover:bg-stone-100/50 dark:hover:bg-neutral-800/50 transition-all relative"
            >
              <Icon name="notifications" className="text-neutral-700 dark:text-neutral-300" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full" />
            </NavLink>
            <button
              type="button"
              onClick={toggle}
              title={dark ? "Light mode" : "Dark mode"}
              className="p-2 rounded-full hover:bg-stone-100/50 dark:hover:bg-neutral-800/50 transition-all"
            >
              <Icon name={dark ? "light_mode" : "dark_mode"} className="text-neutral-700 dark:text-neutral-300" />
            </button>
            <NavLink to="/customer/profile">
              <div className="w-8 h-8 rounded-full bg-surface-container dark:bg-neutral-700 overflow-hidden ring-2 ring-surface-container dark:ring-neutral-700">
                <div className="w-full h-full bg-secondary flex items-center justify-center text-white text-xs font-bold">
                  AT
                </div>
              </div>
            </NavLink>
          </div>
        </div>
      </nav>

      {/* Side Navigation (Desktop) */}
      <aside className="hidden lg:flex flex-col h-screen w-64 fixed left-0 top-0 pt-20 bg-stone-50 dark:bg-[#0A0A0A] z-40 border-r border-stone-200/50 dark:border-neutral-800/50">
        <div className="px-6 py-4">
          <div className="flex items-center gap-3 mb-0">
            <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center text-white shadow-sm">
              <Icon name="precision_manufacturing" filled />
            </div>
            <div>
              <h2 className="font-headline font-extrabold text-stone-800 dark:text-neutral-200 leading-none">
                Service Portal
              </h2>
              <p className="text-[10px] uppercase tracking-widest text-stone-500 font-medium mt-1">
                Industrial Precision
              </p>
            </div>
          </div>
        </div>
        <nav className="flex-1 mt-4 space-y-1">
          {sidebarItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 py-3 transition-colors text-sm font-medium",
                  isActive
                    ? "text-neutral-900 dark:text-white border-l-4 border-stone-500 dark:border-neutral-400 pl-5 bg-stone-100/50 dark:bg-neutral-800/50"
                    : "text-stone-500 dark:text-neutral-500 hover:text-stone-800 dark:hover:text-neutral-300 hover:bg-stone-200/50 dark:hover:bg-neutral-800/30 pl-6"
                )
              }
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="px-6 py-6 border-t border-stone-200/50 dark:border-neutral-800/50 space-y-1">
          <NavLink
            to="/customer/reviews"
            className="flex items-center gap-3 py-2 text-stone-500 hover:text-stone-800 dark:hover:text-neutral-300 transition-colors text-sm"
          >
            <Icon name="rate_review" />
            <span>Reviews</span>
          </NavLink>
          <a
            href="#"
            className="flex items-center gap-3 py-2 text-stone-500 hover:text-stone-800 dark:hover:text-neutral-300 transition-colors text-sm"
          >
            <Icon name="help" />
            <span>Support</span>
          </a>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 py-2 text-stone-500 hover:text-stone-800 dark:hover:text-neutral-300 transition-colors text-sm w-full"
          >
            <Icon name="logout" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 pt-24 px-6 pb-20 md:pb-12 max-w-screen-2xl mx-auto dark:bg-[#0A0A0A] min-h-screen">
        <Outlet />
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white/95 dark:bg-[#1C1C1C]/95 backdrop-blur-lg shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50">
        <div className="flex justify-around items-center h-16 px-4">
          {bottomNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center gap-1",
                  isActive
                    ? "text-neutral-900 dark:text-white"
                    : "text-stone-500"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon name={item.icon} filled={isActive} />
                  <span className="text-[10px] font-bold">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
