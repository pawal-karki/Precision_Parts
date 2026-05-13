import { useState, useEffect, useMemo } from "react";
import { api, getImageUrl } from "@/lib/api";
import { useCart } from "@/lib/cart";
import { useToast } from "@/components/ui/toast";
import { motion, PageTransition, AnimatePresence } from "@/components/ui/motion";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/currency";

const URGENCY_CONFIG = {
  Normal: { color: "bg-secondary-container text-on-secondary-container", icon: "schedule", bar: "bg-secondary" },
  Urgent: { color: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300", icon: "warning", bar: "bg-amber-500" },
  Critical: { color: "bg-error-container/30 text-error", icon: "error", bar: "bg-error" },
};

const STATUS_CONFIG = {
  Pending: { color: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/20", label: "Pending" },
  Sourcing: { color: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/20", label: "Sourcing" },
  Available: { color: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/20", label: "Available" },
  Cancelled: { color: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700/50", label: "Cancelled" },
};

const empty = { partName: "", partNumber: "", vehicleModel: "", description: "", urgency: "Normal" };

export default function PartRequest() {
  const [activeTab, setActiveTab] = useState("inventory"); // "inventory" or "requests"
  const [parts, setParts] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ ...empty });
  const [search, setSearch] = useState("");
  const { addToCart } = useCart();
  const toast = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [partsData, requestsData] = await Promise.all([
        api.getParts(),
        api.getPartRequests(),
      ]);
      setParts(Array.isArray(partsData) ? partsData : []);
      setRequests(Array.isArray(requestsData) ? requestsData : []);
    } catch (err) {
      toast("Failed to load inventory data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredParts = useMemo(() => {
    return parts.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) || 
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
    );
  }, [parts, search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.partName.trim()) {
      toast("Part name is required", "error");
      return;
    }
    setSubmitting(true);
    try {
      await api.createPartRequest({
        partName: formData.partName.trim(),
        partNumber: formData.partNumber.trim() || null,
        vehicleModel: formData.vehicleModel.trim() || null,
        description: formData.description.trim() || null,
        urgency: formData.urgency,
      });
      toast("Part request submitted successfully!", "success");
      setFormData({ ...empty });
      setShowForm(false);
      setActiveTab("requests");
      fetchData();
    } catch (err) {
      toast(err.message || "Failed to submit request", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const setField = (field) => (e) => setFormData(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <PageTransition>
      <div className="space-y-8 pb-20">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-on-surface dark:text-white font-headline">
              Inventory &amp; Sourcing
            </h1>
            <p className="text-on-surface-variant font-medium mt-1">
              Browse available parts or request custom components.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={activeTab === "inventory" ? "default" : "outline"}
              onClick={() => setActiveTab("inventory")}
              className="rounded-xl font-bold"
            >
              <Icon name="inventory_2" className="text-sm" /> Browse Parts
            </Button>
            <Button
              variant={activeTab === "requests" ? "default" : "outline"}
              onClick={() => setActiveTab("requests")}
              className="rounded-xl font-bold"
            >
              <Icon name="assignment" className="text-sm" /> My Requests
            </Button>
          </div>
        </header>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === "inventory" ? (
            <motion.div
              key="inventory"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-6"
            >
              {/* Search & Filter */}
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                  <input
                    type="text"
                    placeholder="Search by name, SKU or category..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-surface-container-low dark:bg-neutral-800 border border-outline-variant/20 rounded-2xl focus:ring-2 focus:ring-secondary outline-none transition-all"
                  />
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center py-20"><Icon name="progress_activity" className="text-4xl animate-spin text-secondary" /></div>
              ) : filteredParts.length === 0 ? (
                <div className="text-center py-20 bg-surface-container-low dark:bg-neutral-800/50 rounded-2xl border border-dashed border-outline-variant/30">
                  <Icon name="inventory" className="text-6xl text-on-surface-variant/30 mb-4" />
                  <p className="text-on-surface-variant font-medium">No parts found matching your search.</p>
                  <Button variant="ghost" onClick={() => setActiveTab("requests")} className="mt-4">
                    Request a specific part instead?
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredParts.map((part) => (
                    <motion.div
                      key={part.id}
                      layoutId={part.id}
                      className="group bg-surface-container-lowest dark:bg-[#1C1C1C] rounded-2xl border border-surface-container dark:border-neutral-800/50 overflow-hidden hover:shadow-xl hover:shadow-secondary/5 transition-all duration-300"
                    >
                      <div className="aspect-[4/3] bg-surface-container dark:bg-neutral-800 relative overflow-hidden">
                        {part.imageUrl ? (
                          <img
                            src={getImageUrl(part.imageUrl)}
                            alt={part.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-on-surface-variant/20">
                            <Icon name="precision_manufacturing" className="text-6xl" />
                          </div>
                        )}
                        <div className="absolute top-3 right-3">
                          <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm ${
                            part.stock > 0 ? "bg-emerald-500 text-white" : "bg-error text-white"
                          }`}>
                            {part.stock > 0 ? `${part.stock} In Stock` : "Out of Stock"}
                          </span>
                        </div>
                      </div>
                      <div className="p-5">
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-secondary">{part.category}</p>
                          <p className="text-[10px] font-mono text-on-surface-variant">{part.sku}</p>
                        </div>
                        <h3 className="font-bold font-headline text-on-surface dark:text-white line-clamp-1 mb-3">{part.name}</h3>
                        <div className="flex items-center justify-between">
                          <p className="text-lg font-extrabold font-headline text-on-surface dark:text-white">
                            {formatCurrency(part.price)}
                          </p>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="rounded-lg h-9" 
                            disabled={part.stock === 0}
                            onClick={() => {
                              addToCart(part);
                              toast(`Added ${part.name} to cart`, "success");
                            }}
                          >
                            <Icon name="add_shopping_cart" className="text-xs" /> Add to Cart
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="requests"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-8"
            >
              {/* Form Trigger */}
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold font-headline text-on-surface dark:text-white">
                  My Sourcing Requests
                </h2>
                <Button onClick={() => setShowForm(!showForm)} className="rounded-xl font-bold">
                  <Icon name={showForm ? "close" : "add_circle"} />
                  {showForm ? "Cancel" : "New Request"}
                </Button>
              </div>

              {/* Form */}
              <AnimatePresence>
                {showForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-surface-container-lowest dark:bg-[#1C1C1C] rounded-2xl p-6 sm:p-8 border border-surface-container dark:border-neutral-800/50 shadow-xl mb-8">
                      <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2 block">
                              Part Name <span className="text-error">*</span>
                            </label>
                            <input
                              required
                              className="w-full bg-surface-container-low dark:bg-neutral-800 border border-outline-variant/20 rounded-xl p-4 text-on-surface dark:text-white outline-none focus:ring-2 focus:ring-secondary transition-all"
                              placeholder="e.g. Carbon Fiber Intake Manifold"
                              value={formData.partName}
                              onChange={setField("partName")}
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2 block">Part Number</label>
                            <input
                              className="w-full bg-surface-container-low dark:bg-neutral-800 border border-outline-variant/20 rounded-xl p-4 text-on-surface dark:text-white outline-none focus:ring-2 focus:ring-secondary transition-all"
                              placeholder="e.g. CF-9921-X"
                              value={formData.partNumber}
                              onChange={setField("partNumber")}
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2 block">Vehicle Model</label>
                            <input
                              className="w-full bg-surface-container-low dark:bg-neutral-800 border border-outline-variant/20 rounded-xl p-4 text-on-surface dark:text-white outline-none focus:ring-2 focus:ring-secondary transition-all"
                              placeholder="e.g. Toyota Land Cruiser 200"
                              value={formData.vehicleModel}
                              onChange={setField("vehicleModel")}
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2 block">Urgency</label>
                            <div className="grid grid-cols-3 gap-2">
                              {["Normal", "Urgent", "Critical"].map((level) => (
                                <button
                                  key={level}
                                  type="button"
                                  onClick={() => setFormData(prev => ({ ...prev, urgency: level }))}
                                  className={`py-3 rounded-xl font-bold text-sm transition-all ${
                                    formData.urgency === level
                                      ? `${URGENCY_CONFIG[level].color} shadow-lg`
                                      : "bg-surface-container-high dark:bg-neutral-800 text-on-surface"
                                  }`}
                                >
                                  {level}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2 block">Notes</label>
                          <textarea
                            rows={3}
                            className="w-full bg-surface-container-low dark:bg-neutral-800 border border-outline-variant/20 rounded-xl p-4 text-on-surface dark:text-white outline-none focus:ring-2 focus:ring-secondary transition-all resize-none"
                            placeholder="Specifications, fitment details, etc."
                            value={formData.description}
                            onChange={setField("description")}
                          />
                        </div>
                        <div className="flex gap-3 pt-4 border-t border-surface-container dark:border-neutral-800/50">
                          <Button type="submit" disabled={submitting} className="bg-primary text-on-primary">
                            {submitting ? "Submitting..." : "Submit Request"}
                          </Button>
                        </div>
                      </form>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* List */}
              {loading ? (
                <div className="flex justify-center py-20"><Icon name="progress_activity" className="text-4xl animate-spin text-secondary" /></div>
              ) : requests.length === 0 ? (
                <div className="text-center py-20 bg-surface-container-low dark:bg-neutral-800/50 rounded-2xl border border-dashed border-outline-variant/30">
                  <Icon name="search" className="text-6xl text-on-surface-variant/30 mb-4" />
                  <p className="text-on-surface-variant font-medium">You haven't submitted any sourcing requests yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {requests.map((req, idx) => (
                    <motion.div
                      key={req.id || idx}
                      className="bg-surface-container-lowest dark:bg-[#1C1C1C] rounded-xl p-6 border border-surface-container dark:border-neutral-800/50"
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold font-headline text-on-surface dark:text-white truncate">{req.partName}</h3>
                          <p className="text-xs text-on-surface-variant mt-1">{req.vehicleModel || "General"}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${STATUS_CONFIG[req.status]?.color || STATUS_CONFIG.Pending.color}`}>
                            {req.status}
                          </span>
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${URGENCY_CONFIG[req.urgency]?.color || URGENCY_CONFIG.Normal.color}`}>
                            {req.urgency}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-on-surface-variant line-clamp-2 mb-4">{req.description || "No additional notes."}</p>
                      <div className="flex justify-between items-center text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">
                        <span>{new Date(req.createdAtUtc).toLocaleDateString("en-NP")}</span>
                        <Icon name="more_horiz" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
