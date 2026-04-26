import { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useList, store } from "@/lib/store";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { formatCurrency, VAT_RATE, LOYALTY_THRESHOLD, LOYALTY_DISCOUNT_RATE } from "@/lib/currency";
import {
  motion,
  AnimatePresence,
  PageTransition,
  fadeInUp,
  staggerContainer,
} from "@/components/ui/motion";
import { cn } from "@/lib/utils";

export default function SalesPOS() {
  const { list: products } = useList("posProducts");
  const { list: customers } = useList("customers");
  const { add: addSale } = useList("completedSales");
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState({
    userId: null,
    name: "Walk-in Customer",
    loyaltyTier: "None",
    email: "",
  });
  const [customerPickerOpen, setCustomerPickerOpen] = useState(false);

  useEffect(() => {
    Promise.all([api.getPosProducts(), api.getCustomers()])
      .then(([prods, cust]) => {
        store.set("posProducts", Array.isArray(prods) ? prods : []);
        const list = Array.isArray(cust) ? cust : [];
        store.set("customers", list);
        const preferred =
          list.find((c) => c.name === "Horizon Motorsport") || list[0];
        if (preferred) setSelectedCustomer(preferred);
      })
      .catch(() => toast("Could not load POS catalog", "error"));
  }, []);

  const filtered = useMemo(
    () =>
      products.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.sku.toLowerCase().includes(search.toLowerCase())
      ),
    [products, search]
  );

  function addToCart(product) {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === product.id);
      if (existing) {
        return prev.map((c) => (c.id === product.id ? { ...c, qty: c.qty + 1 } : c));
      }
      return [...prev, { ...product, qty: 1 }];
    });
    toast(`${product.name} added to cart`, "info");
  }

  function updateQty(id, qty) {
    if (qty <= 0) {
      setCart((prev) => prev.filter((c) => c.id !== id));
    } else {
      setCart((prev) => prev.map((c) => (c.id === id ? { ...c, qty } : c)));
    }
  }

  function removeItem(id) {
    setCart((prev) => prev.filter((c) => c.id !== id));
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const loyaltyApplied = subtotal > LOYALTY_THRESHOLD;
  const loyaltyDiscount = loyaltyApplied ? subtotal * LOYALTY_DISCOUNT_RATE : 0;
  const tax = (subtotal - loyaltyDiscount) * VAT_RATE;
  const total = subtotal - loyaltyDiscount + tax;

  async function completeSale() {
    if (cart.length === 0) {
      toast("Cart is empty", "error");
      return;
    }

    try {
      const dto = {
        customerId: selectedCustomer.userId || null,
        subtotal,
        tax,
        discount: loyaltyDiscount,
        total,
        items: cart.map(item => ({
          sku: item.sku,
          quantity: item.qty,
          unitPrice: item.price
        }))
      };

      const response = await api.createPosSale(dto);
      const invoiceId = response.invoiceId;

      const now = new Date();
      const dateStr = now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
      const dueDate = new Date(now.getTime() + 30 * 86400000).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });

      const invoice = {
        id: invoiceId,
        date: dateStr,
        dueDate,
        customer: {
          name: selectedCustomer.name,
          address: selectedCustomer.email ? `Customer File\n${selectedCustomer.email}` : "Walk-in Customer",
          email: selectedCustomer.email || "",
        },
        company: {
          name: "Precision Parts",
          address: "Kathmandu, Nepal",
          email: "accounts@precision-parts.com.np",
        },
        items: cart.map((item) => ({
          name: item.name,
          sku: item.sku,
          qty: item.qty,
          unitPrice: item.price,
          total: item.price * item.qty,
        })),
        subtotal,
        loyaltyDiscount,
        tax,
        total,
        loyaltyApplied,
      };

      addSale({ ...invoice, timestamp: now.toISOString() });
      store.set("lastInvoice", invoice);

      toast("Sale completed and saved to database!", "success");
      setCart([]);
      const basePath = location.pathname.startsWith("/admin") ? "/admin" : "/staff";
      navigate(`${basePath}/invoice`);
    } catch (err) {
      toast("Failed to process sale. Check inventory levels.", "error");
    }
  }

  return (
    <PageTransition>
      <div className="grid grid-cols-12 gap-8 -mt-4">
        {/* Products */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <section className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-extrabold text-on-surface dark:text-white tracking-tight font-headline">
                Point of Sale
              </h1>
              <p className="text-on-surface-variant dark:text-zinc-500 mt-1">
                Search parts, add to cart, apply discounts.
              </p>
            </div>
          </section>

          {/* Search */}
          <div className="relative">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
              placeholder="Search parts by name or SKU..."
            />
          </div>

          {/* Product Grid */}
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="grid grid-cols-2 md:grid-cols-3 gap-4"
          >
            {filtered.map((product) => (
              <motion.div
                key={product.id}
                variants={fadeInUp}
                onClick={() => addToCart(product)}
                className="bg-surface-container-lowest dark:bg-[#1C1C1C] rounded-xl p-4 border border-surface-container-low dark:border-neutral-800/50 cursor-pointer hover:border-secondary hover:shadow-glass transition-all group"
              >
                <div className="h-24 bg-surface-container-low dark:bg-neutral-800 rounded-lg mb-3 flex items-center justify-center group-hover:bg-secondary/10 transition-colors">
                  <Icon
                    name="settings_input_component"
                    className="text-3xl text-on-surface-variant/30 dark:text-neutral-600"
                  />
                </div>
                <h4 className="font-semibold text-sm truncate">{product.name}</h4>
                <p className="text-[10px] font-mono text-on-surface-variant dark:text-neutral-500 mt-0.5">
                  {product.sku}
                </p>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-lg font-extrabold">{formatCurrency(product.price)}</span>
                  <Badge variant={product.stock > 50 ? "success" : "warning"}>
                    {product.stock} in stock
                  </Badge>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Cart / Checkout */}
        <div className="col-span-12 lg:col-span-4">
          <div className="sticky top-24 bg-surface-container-lowest dark:bg-[#1C1C1C] rounded-xl border border-surface-container-low dark:border-neutral-800/50 overflow-hidden">
            <div className="p-6 border-b border-surface-container dark:border-neutral-800">
              <h3 className="text-lg font-bold font-headline">Current Sale</h3>
              <button
                onClick={() => setCustomerPickerOpen(!customerPickerOpen)}
                className="flex items-center gap-2 mt-2 w-full text-left hover:bg-surface-container-low dark:hover:bg-neutral-800 rounded-lg p-1.5 -m-1.5 transition-colors"
              >
                <Icon name="person" className="text-sm text-secondary" />
                <span className="text-sm font-medium flex-1 truncate">{selectedCustomer.name}</span>
                <Badge variant="info" className="ml-auto shrink-0">
                  {selectedCustomer.loyaltyTier || "None"}
                </Badge>
                <Icon name="expand_more" className="text-sm text-on-surface-variant" />
              </button>
              <AnimatePresence>
                {customerPickerOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-2 max-h-40 overflow-y-auto space-y-1">
                      {customers.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => {
                            setSelectedCustomer(c);
                            setCustomerPickerOpen(false);
                          }}
                          className={cn(
                            "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                            selectedCustomer.id === c.id
                              ? "bg-secondary/10 text-secondary font-medium"
                              : "hover:bg-surface-container-low dark:hover:bg-neutral-800 text-on-surface-variant"
                          )}
                        >
                          {c.name}
                          <span className="text-[10px] ml-2 opacity-60">{c.loyaltyTier}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="p-6 max-h-80 overflow-y-auto">
              {cart.length === 0 ? (
                <div className="text-center py-8 text-on-surface-variant">
                  <Icon name="shopping_cart" className="text-4xl opacity-30" />
                  <p className="text-sm mt-2">Cart is empty</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence mode="popLayout">
                    {cart.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -30, transition: { duration: 0.15 } }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        className="flex items-center gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{item.name}</p>
                          <p className="text-xs text-on-surface-variant">{formatCurrency(item.price)} each</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQty(item.id, item.qty - 1)}
                            className="w-6 h-6 rounded bg-surface-container-low dark:bg-neutral-800 flex items-center justify-center text-xs hover:bg-surface-container dark:hover:bg-neutral-700"
                          >
                            −
                          </button>
                          <span className="text-sm font-bold w-6 text-center">{item.qty}</span>
                          <button
                            onClick={() => updateQty(item.id, item.qty + 1)}
                            className="w-6 h-6 rounded bg-surface-container-low dark:bg-neutral-800 flex items-center justify-center text-xs hover:bg-surface-container dark:hover:bg-neutral-700"
                          >
                            +
                          </button>
                        </div>
                        <span className="text-sm font-bold w-24 text-right">
                          {formatCurrency(item.price * item.qty)}
                        </span>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="w-6 h-6 rounded flex items-center justify-center text-on-surface-variant hover:text-error transition-colors"
                        >
                          <Icon name="close" className="text-sm" />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-surface-container dark:border-neutral-800 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">Subtotal</span>
                <span className="font-semibold">{formatCurrency(subtotal)}</span>
              </div>
              <AnimatePresence>
                {loyaltyApplied && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex justify-between text-sm overflow-hidden"
                  >
                    <span className="text-emerald-600 flex items-center gap-1">
                      <Icon name="loyalty" className="text-sm" /> Loyalty 10%
                    </span>
                    <span className="font-semibold text-emerald-600">
                      -{formatCurrency(loyaltyDiscount)}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">VAT (13%)</span>
                <span className="font-semibold">{formatCurrency(tax)}</span>
              </div>
              <div className="flex justify-between text-lg font-extrabold pt-2 border-t border-surface-container dark:border-neutral-800">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>

              <Button
                variant="secondary"
                className="w-full mt-4"
                disabled={cart.length === 0}
                onClick={completeSale}
              >
                <Icon name="receipt" className="text-sm" />
                Complete Sale & Generate Invoice
              </Button>

              {cart.length > 0 && (
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setCart([]);
                    toast("Cart cleared", "warning");
                  }}
                >
                  Clear Cart
                </Button>
              )}
            </div>

            <AnimatePresence>
              {loyaltyApplied && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="px-6 pb-4"
                >
                  <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-lg p-3 flex items-center gap-2">
                    <Icon name="celebration" className="text-emerald-600 text-sm" />
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                      Loyalty discount applied! 10% off for orders over Rs. {LOYALTY_THRESHOLD.toLocaleString()}.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
   