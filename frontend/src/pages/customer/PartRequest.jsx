import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { motion, PageTransition, fadeInUp } from "@/components/ui/motion";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";

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
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ ...empty });
  const toast = useToast();

  const fetchRequests = async () => {
    try {
      const data = await api.getPartRequests();
      setRequests(Array.isArray(data) ? data : []);
    } catch {
      toast("Failed to load part requests", "error");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

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
      await fetchRequests();
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
        <motion.header
          className="flex flex-col md:flex-row md:items-center justify-between gap-4"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
        >
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-on-surface dark:text-white font-headline">
              Sourcing &amp; Part Requests
            </h1>
            <p className="text-on-surface-variant font-medium mt-1">
              Request rare components or track availability for your vehicles.
            </p>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all duration-300 ${
              showForm
                ? "bg-surface-container text-on-surface border border-outline-variant/30"
                : "bg-primary text-on-primary hover:shadow-xl hover:shadow-primary/20"
            }`}
          >
            <Icon name={showForm ? "close" : "add_circle"} filled={!showForm} />
            {showForm ? "Cancel" : "New Part Request"}
          </Button>
        </motion.header>

        {/* Form */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            className="bg-surface-container-lowest dark:bg-[#1C1C1C] rounded-2xl p-6 sm:p-8 border border-surface-container dark:border-neutral-800/50 shadow-xl"
          >
            <h2 className="text-xl font-bold font-headline text-on-surface dark:text-white mb-6">
              Submit Part Request
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2 block">
                    Part Name <span className="text-error">*</span>
                  </label>
                  <input
                    required
                    className="w-full bg-surface-container-low dark:bg-neutral-800 border border-outline-variant/20 dark:border-neutral-700/50 rounded-xl p-4 text-on-surface dark:text-white focus:ring-2 focus:ring-secondary outline-none transition-all placeholder:text-on-surface-variant/50"
                    placeholder="e.g. Carbon Fiber Intake Manifold"
                    value={formData.partName}
                    onChange={setField("partName")}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2 block">
                    Part Number (optional)
                  </label>
                  <input
                    className="w-full bg-surface-container-low dark:bg-neutral-800 border border-outline-variant/20 dark:border-neutral-700/50 rounded-xl p-4 text-on-surface dark:text-white focus:ring-2 focus:ring-secondary outline-none transition-all placeholder:text-on-surface-variant/50"
                    placeholder="e.g. CF-9921-X"
                    value={formData.partNumber}
                    onChange={setField("partNumber")}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2 block">
                    Vehicle Model (optional)
                  </label>
                  <input
                    className="w-full bg-surface-container-low dark:bg-neutral-800 border border-outline-variant/20 dark:border-neutral-700/50 rounded-xl p-4 text-on-surface dark:text-white focus:ring-2 focus:ring-secondary outline-none transition-all placeholder:text-on-surface-variant/50"
                    placeholder="e.g. Toyota Land Cruiser 200"
                    value={formData.vehicleModel}
                    onChange={setField("vehicleModel")}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2 block">Urgency</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["Normal", "Urgent", "Critical"].map((level) => {
                      const cfg = URGENCY_CONFIG[level];
                      return (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, urgency: level }))}
                          className={`py-3 rounded-xl font-bold text-sm transition-all ${
                            formData.urgency === level
                              ? `${cfg.color} shadow-lg`
                              : "bg-surface-container-high dark:bg-neutral-800 text-on-surface hover:bg-surface-container-highest dark:hover:bg-neutral-700"
                          }`}
                        >
                          {level}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2 block">
                  Description / Notes (optional)
                </label>
                <textarea
                  rows={4}
                  className="w-full bg-surface-container-low dark:bg-neutral-800 border border-outline-variant/20 dark:border-neutral-700/50 rounded-xl p-4 text-on-surface dark:text-white focus:ring-2 focus:ring-secondary outline-none transition-all resize-none placeholder:text-on-surface-variant/50"
                  placeholder="Describe your requirement, usage context, or any specifications..."
                  value={formData.description}
                  onChange={setField("description")}
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-surface-container dark:border-neutral-800/50">
                <Button
                  type="button"
                  variant="ghost"
                  className="sm:w-auto"
                  onClick={() => { setShowForm(false); setFormData({ ...empty }); }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="flex-1 sm:flex-none bg-primary text-on-primary">
                  {submitting ? (
                    <><Icon name="progress_activity" className="text-sm animate-spin" /> Submitting…</>
                  ) : (
                    <><Icon name="send" className="text-sm" /> Submit Request</>
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Requests List */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold font-headline text-on-surface dark:text-white">
              My Requests
              {requests.length > 0 && (
                <span className="ml-2 text-sm font-normal text-on-surface-variant">({requests.length})</span>
              )}
            </h2>
          </div>

          {loading ? (
            <div className="flex justify-center py-16 text-secondary">
              <Icon name="progress_activity" className="text-4xl animate-spin" />
            </div>
          ) : requests.length === 0 ? (
            <motion.div
              className="flex flex-col items-center justify-center py-16 text-on-surface-variant bg-surface-container-low dark:bg-[#1C1C1C] rounded-2xl border border-dashed border-outline-variant/20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Icon name="search" className="text-6xl mb-3" />
              <h3 className="text-xl font-bold font-headline text-on-surface dark:text-white mb-1">No Part Requests Yet</h3>
              <p className="text-sm mb-6 max-w-sm text-center">
                Submit a sourcing request for rare components or hard-to-find parts.
              </p>
              <Button onClick={() => setShowForm(true)}>
                <Icon name="add_circle" className="text-sm" /> Create Your First Request
              </Button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {requests.map((req, idx) => {
                const urgCfg = URGENCY_CONFIG[req.urgency] || URGENCY_CONFIG.Normal;
                const stsCfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.Pending;
                return (
                  <motion.div
                    key={req.id || idx}
                    className="bg-surface-container-lowest dark:bg-[#1C1C1C] rounded-xl p-6 border border-surface-container dark:border-neutral-800/50 hover:shadow-md transition-all"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.06 }}
                  >
                    <div className="flex justify-between items-start gap-4 mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold font-headline text-on-surface dark:text-white truncate">{req.partName}</h3>
                        {req.partNumber && (
                          <p className="text-xs font-mono text-on-surface-variant mt-0.5">PN: {req.partNumber}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${stsCfg.color}`}>
                          {stsCfg.label}
                        </span>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${urgCfg.color}`}>
                          {req.urgency}
                        </span>
                      </div>
                    </div>

                    {req.vehicleModel && (
                      <div className="flex items-center gap-2 text-sm text-on-surface-variant mb-3">
                        <Icon name="directions_car" className="text-sm" />
                        {req.vehicleModel}
                      </div>
                    )}

                    {req.description && (
                      <p className="text-sm text-on-surface-variant line-clamp-2 mb-4">{req.description}</p>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-on-surface-variant uppercase tracking-wider">
                        {req.createdAtUtc
                          ? new Date(req.createdAtUtc).toLocaleDateString("en-NP", { day: "numeric", month: "short", year: "numeric" })
                          : "—"
                        }
                      </span>
                      <div className={`w-2 h-2 rounded-full ${urgCfg.bar}`} />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
