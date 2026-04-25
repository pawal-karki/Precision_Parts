import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { motion, PageTransition } from "@/components/ui/motion";

export default function PartRequest() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const toast = useToast();

  const [formData, setFormData] = useState({
    partName: "",
    partNumber: "",
    vehicleModel: "",
    description: "",
    urgency: "Normal",
  });

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const data = await api.getPartRequests();
      setRequests(data || []);
    } catch (err) {
      toast("Failed to load requests", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createPartRequest(formData);
      toast("Part request submitted successfully", "success");
      setFormData({
        partName: "",
        partNumber: "",
        vehicleModel: "",
        description: "",
        urgency: "Normal",
      });
      setShowForm(false);
      fetchRequests();
    } catch (err) {
      toast(err.message || "Failed to submit request", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "pending": return "bg-amber-100 text-amber-700 border-amber-200";
      case "sourcing": return "bg-blue-100 text-blue-700 border-blue-200";
      case "available": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "cancelled": return "bg-slate-100 text-slate-700 border-slate-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getUrgencyIcon = (urgency) => {
    switch (urgency?.toLowerCase()) {
      case "critical": return <Icon name="error" className="text-error" />;
      case "urgent": return <Icon name="warning" className="text-amber-500" />;
      default: return <Icon name="schedule" className="text-secondary" />;
    }
  };

  return (
    <PageTransition>
      <div className="max-w-6xl mx-auto space-y-8 pb-20">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-on-surface font-headline">
              Sourcing & Part Requests
            </h1>
            <p className="text-on-surface-variant font-medium mt-1">
              Request rare components or track availability for your vehicles.
            </p>
          </div>
          <Button 
            onClick={() => setShowForm(!showForm)}
            className="group relative overflow-hidden bg-primary text-on-primary px-6 py-6 rounded-2xl flex items-center gap-3 transition-all duration-500 hover:shadow-xl hover:shadow-primary/20 active:scale-95"
          >
            <Icon name={showForm ? "close" : "add_circle"} filled={!showForm} className="text-2xl" />
            <span className="font-bold text-lg">{showForm ? "Cancel Request" : "New Part Request"}</span>
          </Button>
        </header>

        {showForm && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-surface-container-lowest rounded-3xl p-8 border border-surface-container shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
            
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-on-surface-variant ml-1 uppercase tracking-wider">Part Name *</label>
                  <input
                    required
                    className="w-full bg-surface-container-low border-none rounded-2xl p-4 focus:ring-2 focus:ring-primary transition-all"
                    placeholder="e.g. Carbon Fiber Intake Manifold"
                    value={formData.partName}
                    onChange={e => setFormData({...formData, partName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-on-surface-variant ml-1 uppercase tracking-wider">Part Number (if known)</label>
                  <input
                    className="w-full bg-surface-container-low border-none rounded-2xl p-4 focus:ring-2 focus:ring-primary transition-all"
                    placeholder="e.g. CF-9921-X"
                    value={formData.partNumber}
                    onChange={e => setFormData({...formData, partNumber: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-on-surface-variant ml-1 uppercase tracking-wider">Urgency</label>
                  <div className="grid grid-cols-3 gap-3">
                    {["Normal", "Urgent", "Critical"].map(level => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setFormData({...formData, urgency: level})}
                        className={`py-3 rounded-xl font-bold text-sm transition-all ${
                          formData.urgency === level 
                            ? "bg-primary text-on-primary shadow-lg shadow-primary/30" 
                            : "bg-surface-container-high text-on-surface hover:bg-surface-container-highest"
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-on-surface-variant ml-1 uppercase tracking-wider">Vehicle Model</label>
                  <input
                    className="w-full bg-surface-container-low border-none rounded-2xl p-4 focus:ring-2 focus:ring-primary transition-all"
                    placeholder="e.g. 2023 BMW M4 Competition"
                    value={formData.vehicleModel}
                    onChange={e => setFormData({...formData, vehicleModel: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-on-surface-variant ml-1 uppercase tracking-wider">Detailed Description</label>
                  <textarea
                    rows={5}
                    className="w-full bg-surface-container-low border-none rounded-2xl p-4 focus:ring-2 focus:ring-primary transition-all resize-none"
                    placeholder="Tell our specialists exactly what you need..."
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                  />
                </div>
                <Button 
                  disabled={submitting}
                  className="w-full h-14 bg-secondary text-on-secondary rounded-2xl font-extrabold text-lg flex items-center justify-center gap-2 hover:bg-secondary-variant transition-all shadow-lg"
                >
                  {submitting ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                      <Icon name="sync" />
                    </motion.div>
                  ) : (
                    <>Submit Sourcing Request <Icon name="send" /></>
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        )}

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-headline font-bold text-2xl">Active & Past Requests</h3>
            <div className="flex items-center gap-2 text-on-surface-variant text-sm font-medium">
              <Icon name="filter_list" className="text-lg" />
              <span>Filter: All Requests</span>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-64 bg-surface-container-low animate-pulse rounded-3xl" />
              ))}
            </div>
          ) : requests.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-surface-container-low rounded-3xl p-20 text-center flex flex-col items-center border-2 border-dashed border-surface-container-high"
            >
              <div className="w-20 h-20 bg-surface-container-highest rounded-full flex items-center justify-center mb-6">
                <Icon name="search_off" className="text-4xl text-on-surface-variant" />
              </div>
              <h4 className="text-xl font-bold text-on-surface mb-2">No part requests found</h4>
              <p className="text-on-surface-variant max-w-sm">
                Need something specific for your high-precision machine? Submit a request and our team will source it globally.
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {requests.map((req, idx) => (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-surface-container-lowest border border-surface-container rounded-3xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="flex justify-between items-start mb-6">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(req.status)}`}>
                      {req.status}
                    </span>
                    {getUrgencyIcon(req.urgency)}
                  </div>

                  <h4 className="text-xl font-extrabold font-headline mb-2 leading-tight">{req.partName}</h4>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-on-surface-variant">
                      <Icon name="directions_car" className="text-lg opacity-50" />
                      <span className="text-sm font-bold">{req.vehicleModel || "Universal / Not Specified"}</span>
                    </div>
                    
                    {req.partNumber && (
                      <div className="flex items-center gap-3 text-on-surface-variant">
                        <Icon name="tag" className="text-lg opacity-50" />
                        <span className="text-sm font-mono bg-surface-container-low px-2 py-0.5 rounded">{req.partNumber}</span>
                      </div>
                    )}

                    <div className="pt-4 border-t border-surface-container-high">
                      <p className="text-xs text-on-surface-variant italic line-clamp-3">
                        "{req.description || "No additional details provided."}"
                      </p>
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter">
                        Requested: {new Date(req.createdAt || Date.now()).toLocaleDateString()}
                      </span>
                      <Button variant="ghost" className="h-8 w-8 rounded-full">
                        <Icon name="more_vert" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-gradient-to-br from-secondary/10 to-primary/10 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-8 border border-white/20">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg shrink-0">
            <Icon name="auto_awesome" className="text-3xl text-secondary" />
          </div>
          <div className="flex-1">
            <h4 className="text-xl font-bold mb-1">Global Sourcing Network</h4>
            <p className="text-sm text-on-surface-variant font-medium">
              We leverage our partnerships across Germany, Japan, and the USA to find genuine OEM and high-performance aftermarket parts that aren't available in local markets.
            </p>
          </div>
          <Link to="/info/sourcing" className="font-bold text-secondary hover:underline shrink-0">Learn how it works →</Link>
        </div>
      </div>
    </PageTransition>
  );
}
