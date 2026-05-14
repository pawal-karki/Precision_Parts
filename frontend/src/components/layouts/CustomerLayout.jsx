import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { api, getImageUrl } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency } from "@/lib/currency";
import { NotificationBell } from "@/components/shared/NotificationBell";

const sidebarItems = [
  { to: "/customer", icon: "dashboard", label: "Overview", end: true },
  { to: "/customer/booking", icon: "calendar_today", label: "Calendar" },
  { to: "/customer/parts", icon: "precision_manufacturing", label: "Inventory" },
  { to: "/customer/orders", icon: "history", label: "History" },
  { to: "/customer/payments", icon: "payments", label: "Payments" },
  { to: "/customer/loyalty", icon: "workspace_premium", label: "Loyalty" },
  { to: "/customer/profile", icon: "directions_car", label: "Garage" },
];

const topLinks = [
  { to: "/customer", label: "Dashboard" },
  { to: "/customer/booking", label: "Services" },
  { to: "/customer/orders", label: "Orders" },
  { to: "/customer/parts", label: "Parts" },
  { to: "/customer/loyalty", label: "Loyalty" },
];

const bottomNav = [
  { to: "/customer", icon: "dashboard", label: "Overview", end: true },
  { to: "/customer/parts", icon: "precision_manufacturing", label: "Parts" },
  { to: "/customer/loyalty", icon: "workspace_premium", label: "Loyalty" },
  { to: "/customer/orders", icon: "history", label: "History" },
  { to: "/customer/profile", icon: "person", label: "Profile" },
];

export default function CustomerLayout() {
  const { dark, toggle } = useTheme();
  const { user, logout } = useAuth();
  const { items, count, subtotal, removeFromCart, updateQuantity, clearCart } = useCart();
  const navigate = useNavigate();
  const toast = useToast();
  const [showCart, setShowCart] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  const handleSignOut = async () => {
    await logout();
    navigate("/");
  };

  const handleCheckout = async () => {
    if (items.length === 0) return;
    setCheckingOut(true);
    try {
      const dto = {
        items: items.map(i => ({ sku: i.sku, quantity: i.quantity }))
      };
      const res = await api.createCustomerOrder(dto);
      toast(`Order placed successfully! #${res.invoiceNumber}`, "success");
      clearCart();
      setShowCart(false);
      navigate("/customer/orders");
    } catch (err) {
      toast(err.message || "Checkout failed", "error");
    } finally {
      setCheckingOut(false);
    }
  };

  const isWebView = new URLSearchParams(window.location.search).get("webview") === "true";

  return (
    <div className="min-h-screen">
      {/* Top Navigation */}
      {!isWebView && (
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
              <button
                onClick={() => setShowCart(true)}
                className="p-2 rounded-full hover:bg-stone-100/50 dark:hover:bg-neutral-800/50 transition-all relative"
              >
                <Icon name="shopping_cart" className="text-neutral-700 dark:text-neutral-300" />
                {count > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-secondary text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                    {count}
                  </span>
                )}
              </button>
              <NotificationBell to="/customer/notifications" />
              <button
                type="button"
                onClick={toggle}
                title={dark ? "Light mode" : "Dark mode"}
                className="p-2 rounded-full hover:bg-stone-100/50 dark:hover:bg-neutral-800/50 transition-all"
              >
                <Icon name={dark ? "light_mode" : "dark_mode"} className="text-neutral-700 dark:text-neutral-300" />
              </button>
              <NavLink to="/customer/profile" className="group">
                <div className="w-8 h-8 rounded-full bg-surface-container dark:bg-neutral-700 overflow-hidden ring-2 ring-surface-container dark:ring-neutral-700 shadow-sm group-hover:scale-105 transition-transform">
                  {user?.imageUrl ? (
                    <img src={user.imageUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-secondary flex items-center justify-center text-white text-xs font-bold uppercase">
                      {(user?.fullName || user?.name || "C").charAt(0)}
                    </div>
                  )}
                </div>
              </NavLink>
            </div>
          </div>
        </nav>
      )}

      {/* Side Navigation (Desktop) */}
      <aside className={cn(
        "hidden lg:flex flex-col h-screen w-64 fixed left-0 top-0 bg-stone-50 dark:bg-[#0A0A0A] z-40 border-r border-stone-200/50 dark:border-neutral-800/50",
        !isWebView ? "pt-20" : "pt-6"
      )}>
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
            href="mailto:support@precisionparts.com"
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
      <main className={cn(
        "lg:ml-64 px-6 pb-20 md:pb-12 max-w-screen-2xl mx-auto dark:bg-[#0A0A0A] min-h-screen",
        !isWebView ? "pt-24" : "pt-8"
      )}>
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

      {/* Cart Drawer */}
      <AnimatePresence>
        {showCart && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCart(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-[#1C1C1C] shadow-2xl z-[70] flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-outline-variant/20">
                <h2 className="text-xl font-bold font-headline flex items-center gap-2 text-on-surface dark:text-white">
                  <Icon name="shopping_cart" className="text-secondary" /> My Cart
                </h2>
                <button onClick={() => setShowCart(false)} className="p-2 hover:bg-surface-container rounded-full text-on-surface-variant transition-all">
                  <Icon name="close" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {items.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-on-surface-variant opacity-50">
                    <Icon name="shopping_cart_checkout" className="text-6xl mb-4" />
                    <p className="font-bold">Your cart is empty</p>
                  </div>
                ) : (
                  items.map((item) => (
                    <div key={item.id} className="flex gap-4 items-center p-3 bg-surface-container-low dark:bg-neutral-800/40 rounded-xl border border-outline-variant/10">
                      <div className="w-16 h-16 bg-surface-container dark:bg-neutral-800 rounded-lg overflow-hidden shrink-0">
                        {item.imageUrl ? (
                          <img src={getImageUrl(item.imageUrl)} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-on-surface-variant/20"><Icon name="precision_manufacturing" /></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-on-surface dark:text-white truncate">{item.name}</p>
                        <p className="text-xs text-secondary font-bold">{formatCurrency(item.price)}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-6 h-6 rounded-md border border-outline-variant/30 flex items-center justify-center text-on-surface-variant hover:bg-surface-container"><Icon name="remove" className="text-xs" /></button>
                          <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-6 h-6 rounded-md border border-outline-variant/30 flex items-center justify-center text-on-surface-variant hover:bg-surface-container"><Icon name="add" className="text-xs" /></button>
                        </div>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="text-error hover:bg-error/10 p-2 rounded-full transition-all">
                        <Icon name="delete" className="text-sm" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="p-6 bg-surface-container-low dark:bg-neutral-900/50 border-t border-outline-variant/20">
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-on-surface-variant">Subtotal</span>
                    <span className="font-bold">{formatCurrency(subtotal)}</span>
                  </div>
                  {subtotal >= 5000 && (
                    <div className="flex justify-between text-sm text-emerald-600 dark:text-emerald-400 font-bold">
                      <span className="flex items-center gap-1"><Icon name="verified" className="text-xs" /> 10% Discount</span>
                      <span>-{formatCurrency(subtotal * 0.1)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold border-t border-outline-variant/20 pt-2 text-on-surface dark:text-white">
                    <span>Total</span>
                    <span>{formatCurrency(subtotal >= 5000 ? subtotal * 0.9 : subtotal)}</span>
                  </div>
                  {subtotal >= 5000 && (
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-500 font-medium italic">
                      * 10% Discount applied on orders over Rs. 5,000
                    </p>
                  )}
                </div>
                <Button 
                  onClick={handleCheckout} 
                  disabled={items.length === 0 || checkingOut} 
                  className="w-full py-4 rounded-xl text-lg font-bold bg-secondary text-on-secondary shadow-lg shadow-secondary/20 transition-all hover:scale-[1.02] active:scale-95"
                >
                  {checkingOut ? <Icon name="sync" className="animate-spin" /> : "Complete Purchase"}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
