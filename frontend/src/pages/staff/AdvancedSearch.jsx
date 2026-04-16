import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useList, store } from "@/lib/store";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { Modal } from "@/components/ui/modal";
import { formatCurrency } from "@/lib/currency";
import {
  motion,
  AnimatePresence,
  PageTransition,
  StaggerList,
  FadeInItem,
  fadeInUp,
  staggerContainer,
} from "@/components/ui/motion";

function statusVariant(status) {
  return {
    "In Stock": "success",
    "Low Stock": "warning",
    Critical: "error",
    Refilling: "neutral",
  }[status] || "neutral";
}

export default function AdvancedSearch() {
  const { list: parts } = useList("partsInventory");
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    api
      .getParts()
      .then((rows) => store.set("partsInventory", Array.isArray(rows) ? rows : []))
      .catch(() => toast("Could not load parts from API", "error"));
  }, []);

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ category: "", status: "", priceRange: "" });
  const [sortBy, setSortBy] = useState("relevance");
  const [detailPart, setDetailPart] = useState(null);

  const categories = useMemo(() => [...new Set(parts.map((p) => p.category))], [parts]);

  const filtered = useMemo(() => {
    let result = parts.filter((p) => {
      const matchesSearch =
        search === "" ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !filters.category || p.category === filters.category;
      const matchesStatus = !filters.status || p.status === filters.status;

      let matchesPrice = true;
      if (filters.priceRange === "low") matchesPrice = p.price < 2000;
      else if (filters.priceRange === "mid") matchesPrice = p.price >= 2000 && p.price <= 15000;
      else if (filters.priceRange === "high") matchesPrice = p.price > 15000;

      return matchesSearch && matchesCategory && matchesStatus && matchesPrice;
    });

    if (sortBy === "price-asc") result = [...result].sort((a, b) => a.price - b.price);
    else if (sortBy === "price-desc") result = [...result].sort((a, b) => b.price - a.price);
    else if (sortBy === "stock") result = [...result].sort((a, b) => a.stock - b.stock);
    else if (sortBy === "name") result = [...result].sort((a, b) => a.name.localeCompare(b.name));

    return result;
  }, [parts, search, filters, sortBy]);

  function handleAddToCart(part) {
    toast(`${part.name} added to cart`, "success");
  }

  function clearFilters() {
    setFilters({ category: "", status: "", priceRange: "" });
    setSortBy("relevance");
    setSearch("");
  }

  const hasFilters = filters.category || filters.status || filters.priceRange || search;

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Hero Search */}
        <section className="bg-gradient-to-br from-secondary/5 to-surface-container-low dark:from-secondary/10 dark:to-neutral-900 rounded-2xl p-8 md:p-12">
          <h1 className="text-4xl font-extrabold text-on-surface dark:text-white tracking-tight font-headline mb-2">
            Advanced Search
          </h1>
          <p className="text-on-surface-variant dark:text-neutral-400 mb-8">
            Search across the entire parts catalog with advanced filters.
          </p>
          <div className="relative max-w-2xl">
            <Icon
              name="search"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-14 bg-white dark:bg-neutral-800 border-none rounded-xl pl-12 pr-36 text-lg font-medium text-on-surface dark:text-white placeholder:text-on-surface-variant/50 focus:ring-2 focus:ring-secondary shadow-glass"
              placeholder="Search by part name, SKU, or category..."
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-28 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <Icon name="close" className="text-lg" />
              </button>
            )}
            <Button variant="secondary" className="absolute right-2 top-1/2 -translate-y-1/2">
              Search
            </Button>
          </div>
        </section>

        {/* Filters */}
        <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold mb-1 block">
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="w-full appearance-none bg-surface-container-lowest dark:bg-neutral-800 border border-outline-variant dark:border-neutral-700 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-secondary"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold mb-1 block">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full appearance-none bg-surface-container-lowest dark:bg-neutral-800 border border-outline-variant dark:border-neutral-700 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-secondary"
            >
              <option value="">All Statuses</option>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Critical">Critical</option>
              <option value="Refilling">Refilling</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold mb-1 block">
              Price Range
            </label>
            <select
              value={filters.priceRange}
              onChange={(e) => setFilters({ ...filters, priceRange: e.target.value })}
              className="w-full appearance-none bg-surface-container-lowest dark:bg-neutral-800 border border-outline-variant dark:border-neutral-700 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-secondary"
            >
              <option value="">Any Price</option>
              <option value="low">Under Rs. 2,000</option>
              <option value="mid">Rs. 2,000 – Rs. 15,000</option>
              <option value="high">Over Rs. 15,000</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold mb-1 block">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full appearance-none bg-surface-container-lowest dark:bg-neutral-800 border border-outline-variant dark:border-neutral-700 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-secondary"
            >
              <option value="relevance">Relevance</option>
              <option value="name">Name A–Z</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="stock">Stock Level</option>
            </select>
          </div>
          <div className="flex items-end">
            {hasFilters && (
              <Button variant="ghost" onClick={clearFilters} className="w-full">
                <Icon name="filter_list_off" className="text-sm" />
                Clear Filters
              </Button>
            )}
          </div>
        </section>

        {/* Results */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-on-surface-variant">
              <span className="font-bold text-on-surface dark:text-zinc-200">{filtered.length}</span>{" "}
              results found
            </p>
          </div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            key={`${filters.category}-${filters.status}-${filters.priceRange}-${sortBy}-${search}`}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          >
            <AnimatePresence mode="popLayout">
              {filtered.map((part) => (
                <motion.div
                  key={part.id}
                  variants={fadeInUp}
                  layout
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-surface-container-lowest dark:bg-[#1C1C1C] rounded-xl overflow-hidden border border-surface-container-low dark:border-neutral-800/50 group hover:shadow-glass transition-all"
                >
                  <div className="h-36 bg-surface-container-low dark:bg-neutral-800 relative overflow-hidden">
                    <div className="flex items-center justify-center h-full">
                      <Icon
                        name="settings_input_component"
                        className="text-4xl text-on-surface-variant/20 dark:text-neutral-700"
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-all flex items-end p-4">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setDetailPart(part)}
                        >
                          <Icon name="visibility" className="text-sm" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                          onClick={() => handleAddToCart(part)}
                        >
                          <Icon name="add_shopping_cart" className="text-sm" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <h4 className="font-semibold text-sm truncate">{part.name}</h4>
                    <p className="text-[10px] font-mono text-on-surface-variant dark:text-neutral-500 mt-0.5">
                      {part.sku} • {part.category}
                    </p>
                    <div className="flex justify-between items-center mt-3">
                      <span className="text-lg font-extrabold">{formatCurrency(part.price)}</span>
                      <Badge variant={statusVariant(part.status)}>
                        {part.stock} {part.unit}
                      </Badge>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {filtered.length === 0 && (
            <div className="text-center py-16 text-on-surface-variant">
              <Icon name="search_off" className="text-5xl opacity-30" />
              <p className="text-lg font-semibold mt-4">No parts found</p>
              <p className="text-sm mt-1">Try adjusting your search or filter criteria.</p>
              <Button variant="outline" className="mt-4" onClick={clearFilters}>
                Clear All Filters
              </Button>
            </div>
          )}
        </section>

        {/* Part Detail Modal */}
        <Modal
          open={!!detailPart}
          onClose={() => setDetailPart(null)}
          title={detailPart?.name || "Part Details"}
          size="md"
        >
          {detailPart && (
            <div className="space-y-4">
              <div className="h-40 bg-surface-container-low dark:bg-neutral-800 rounded-lg flex items-center justify-center">
                <Icon
                  name="settings_input_component"
                  className="text-5xl text-on-surface-variant/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">
                    SKU
                  </p>
                  <p className="font-mono text-sm font-semibold mt-0.5">{detailPart.sku}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">
                    Category
                  </p>
                  <p className="text-sm font-semibold mt-0.5">{detailPart.category}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">
                    Price
                  </p>
                  <p className="text-lg font-extrabold mt-0.5">{formatCurrency(detailPart.price)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">
                    Stock
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm font-semibold">
                      {detailPart.stock} {detailPart.unit}
                    </span>
                    <Badge variant={statusVariant(detailPart.status)}>{detailPart.status}</Badge>
                  </div>
                </div>
                {detailPart.vendor && (
                  <div className="col-span-2">
                    <p className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">
                      Vendor
                    </p>
                    <p className="text-sm font-semibold mt-0.5">{detailPart.vendor}</p>
                  </div>
                )}
                {detailPart.location && (
                  <div className="col-span-2">
                    <p className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">
                      Location
                    </p>
                    <p className="text-sm text-on-surface-variant mt-0.5">{detailPart.location}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-surface-container dark:border-neutral-800">
                <Button variant="ghost" onClick={() => setDetailPart(null)}>
                  Close
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    handleAddToCart(detailPart);
                    setDetailPart(null);
                  }}
                >
                  <Icon name="add_shopping_cart" className="text-sm" />
                  Add to Cart
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </PageTransition>
  );
}
      