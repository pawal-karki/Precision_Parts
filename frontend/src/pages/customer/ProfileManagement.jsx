import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { Modal } from "@/components/ui/modal";
import { motion, AnimatePresence, PageTransition, fadeInUp } from "@/components/ui/motion";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const defaultProfile = {
  firstName: "Adrian",
  lastName: "Thorne",
  email: "a.thorne@precision-atelier.com",
  phone: "+49 30 555 0156",
  region: "Pacific Northwest",
};

const defaultVehicles = [
  {
    id: 1,
    name: "1974 Carrera RS",
    vin: "9114600XXX",
    badge: "Primary Drive",
    mileage: "24,500 mi",
    status: "All Good",
    statusIcon: "check_circle",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuB6cMTs1PPSCYKTA6AS-Nc_GAay9K3npVFM-eTwfYuOPtcT7UbZkkurrWx5XmtkYErx0RSiR3LLGsxRaDLLWChPo13S_-JdlFbsdfmmKPzbSkY8j95inntK8HYY0iyVZTPQpsn2Xct1qtZbD26lJI0tE6ncj9wRAgKk4MRcUi4blVIB_hU9CoG9eyBKWi8VsQyE30Dq_MvBlBYKFmT8UNJTsfpTkKJ4fY0rbVrvnHU7roLtPcq8SWz5o71E1hTypP5g3HoevgyRTg",
  },
  {
    id: 2,
    name: "2023 EV-T Prototype",
    vin: "PRECI-9901",
    badge: "Weekend Tech",
    mileage: "92% Charge",
    status: "Service Due",
    statusIcon: "build",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuANBhDA3itFqwDD-dvMfvcjdUzb0y3gjRQvZ14vhlDzrRo8VC3CpJjZ73dbnYFhfvGTHXcX6XJ60UhG7Q9fGE_ujnW7uRT8ZaOK3_0mBvJ-G6zp-aXeCR-iPvC2sDQqV-dJDAsgkz59uwf5ykiPm2vU5RBxa1wKQkh2bEAReHTTt1WMfjDTZ-MRnvHMXIaxGaESZQMGHpjfems0h0BW2AE1vdXT2gZVfVHs2-GA44VoED15HR7v7DlpeaEr02LAMbVbkJAcHaljEg",
  },
];

const emptyVehicle = { nickname: "", mileageKm: "" };

export default function ProfileManagement() {
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [vehicleModal, setVehicleModal] = useState(false);
  const [vehicleForm, setVehicleForm] = useState({ ...emptyVehicle });
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    api.getMe().then((me) => {
      if (me) setProfile(me);
    }).catch(() => {});
    api.getVehicles().then((v) => {
      setVehicles(Array.isArray(v) ? v : []);
    }).catch(() => {});
  }, []);

  const handleProfileChange = (field) => (e) => {
    setProfile((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSaveProfile = () => {
    toast("Profile updated successfully!", "success");
  };

  const handleVehicleField = (field) => (e) => {
    setVehicleForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const openAddVehicle = () => {
    setVehicleForm({ ...emptyVehicle });
    setVehicleModal(true);
  };

  const handleSaveVehicle = async () => {
    if (!vehicleForm.nickname.trim()) {
      toast("Vehicle nickname is required", "error");
      return;
    }
    try {
      const created = await api.addVehicle({
        nickname: vehicleForm.nickname.trim(),
        mileageKm: parseInt(vehicleForm.mileageKm) || 0,
      });
      setVehicles((prev) => [...prev, created]);
      toast("Vehicle added to your garage!", "success");
      setVehicleModal(false);
    } catch (err) {
      toast(err.message || "Could not add vehicle", "error");
    }
  };

  const handleDeleteVehicle = (id) => {
    setVehicles((prev) => prev.filter((v) => v.id !== id));
    setDeleteConfirm(null);
    toast("Vehicle removed from garage", "info");
  };

  return (
    <PageTransition>
      <div className="space-y-10">
        {/* Header */}
        <motion.header variants={fadeInUp} initial="initial" animate="animate">
          <h1 className="text-4xl font-bold tracking-tight font-headline text-on-surface dark:text-white mb-2">
            Profile &amp; Garage
          </h1>
          <p className="text-on-surface-variant dark:text-stone-400 max-w-2xl">
            Manage your architectural-grade vehicle collection and precision contact details from one central atelier.
          </p>
        </motion.header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Personal Info */}
          <motion.section
            className="lg:col-span-4 bg-surface-container-low dark:bg-stone-900 rounded-xl p-8 h-fit"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-bold font-headline text-xl dark:text-white">Personal Info</h3>
              <Icon name="edit_note" className="text-secondary" />
            </div>
            <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleSaveProfile(); }}>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">Full Name</label>
                <input
                  className="w-full bg-surface-container-lowest dark:bg-stone-800 border-none rounded-lg p-3 text-on-surface dark:text-white focus:ring-2 focus:ring-secondary-fixed-dim transition-all"
                  type="text"
                  value={profile?.fullName || profile?.name || ""}
                  onChange={(e) =>
                    setProfile((prev) => ({ ...prev, fullName: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">Email Address</label>
                <input
                  className="w-full bg-surface-container-lowest dark:bg-stone-800 border-none rounded-lg p-3 text-on-surface dark:text-white focus:ring-2 focus:ring-secondary-fixed-dim transition-all"
                  type="email"
                  value={profile?.email || ""}
                  onChange={handleProfileChange("email")}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">Service Region</label>
                <div className="relative">
                  <select
                    className="w-full bg-surface-container-lowest dark:bg-stone-800 border-none rounded-lg p-3 text-on-surface dark:text-white focus:ring-2 focus:ring-secondary-fixed-dim appearance-none"
                    value={profile?.region || "Kathmandu"}
                    onChange={handleProfileChange("region")}
                  >
                    <option>Pacific Northwest</option>
                    <option>Mountain West</option>
                    <option>Northeast Corridor</option>
                  </select>
                  <Icon name="expand_more" className="absolute right-3 top-3 pointer-events-none text-on-surface-variant" />
                </div>
              </div>
              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full py-3 bg-primary dark:bg-stone-700 text-on-primary dark:text-white rounded-lg font-semibold hover:bg-primary-dim transition-colors shadow-sm"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>

            {/* Profile Stats */}
            <div className="mt-10 pt-10 border-t border-outline-variant/20 dark:border-stone-700 flex justify-between">
              <div>
                <p className="text-2xl font-bold font-headline dark:text-white">12</p>
                <p className="text-xs font-bold uppercase text-on-surface-variant">Total Services</p>
              </div>
              <div>
                <p className="text-2xl font-bold font-headline dark:text-white">{String(vehicles.length).padStart(2, "0")}</p>
                <p className="text-xs font-bold uppercase text-on-surface-variant">Vehicles</p>
              </div>
              <div>
                <p className="text-2xl font-bold font-headline dark:text-white">Platinum</p>
                <p className="text-xs font-bold uppercase text-on-surface-variant">Status</p>
              </div>
            </div>
          </motion.section>

          {/* My Garage */}
          <motion.section
            className="lg:col-span-8 space-y-8"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold font-headline text-xl dark:text-white">My Garage</h3>
              <button
                onClick={openAddVehicle}
                className="flex items-center gap-2 bg-secondary-container text-on-secondary-container px-4 py-2 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                <Icon name="add" className="text-sm" /> Add New Vehicle
              </button>
            </div>

            {/* Vehicle Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AnimatePresence mode="popLayout">
                {vehicles.map((vehicle) => (
                  <motion.div
                    key={vehicle.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                    className="bg-surface-container-lowest dark:bg-stone-900 rounded-xl overflow-hidden group"
                  >
                    <div className="h-48 relative overflow-hidden bg-surface-container-low dark:bg-stone-800">
                      {vehicle.image ? (
                        <img
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          src={vehicle.image}
                          alt={vehicle.name}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Icon name="directions_car" className="text-5xl text-on-surface-variant/20" />
                        </div>
                      )}
                      <div className="absolute top-4 left-4 bg-secondary/80 backdrop-blur-sm text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        {vehicle.badge || "Vehicle"}
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-bold font-headline text-lg leading-tight dark:text-white">{vehicle.nickname || vehicle.name}</h4>
                          <p className="text-sm text-on-surface-variant">Health Score: {vehicle.healthScore ?? "—"}/100</p>
                        </div>
                        <button onClick={() => setDeleteConfirm(vehicle.id)}>
                          <Icon name="more_vert" className="text-on-surface-variant cursor-pointer" />
                        </button>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-medium text-on-secondary-container bg-secondary-fixed/30 dark:bg-stone-800 p-2 rounded-lg">
                        <span className="flex items-center gap-1">
                          <Icon name="speed" className="text-sm" /> {vehicle.mileageKm ?? vehicle.mileage ?? "—"} km
                        </span>
                        <span className="flex items-center gap-1">
                          <Icon name="check_circle" className="text-sm" /> {vehicle.healthScore >= 90 ? "Optimal" : vehicle.healthScore >= 70 ? "Good" : "Service Due"}
                        </span>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button variant="outline" size="sm" className="flex-1" onClick={openAddVehicle}>
                          <Icon name="edit" className="text-sm" /> Edit
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(vehicle.id)}>
                          <Icon name="delete" className="text-sm text-error" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Project Spotlight */}
            <div className="relative h-80 rounded-2xl overflow-hidden shadow-sm group">
              <img
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCOBQ8-zjMqLSYyXiVmsVNeC9c3NI_gJmPFBBCRUUtu_S75qGugxwPzvBX4v0Ax-6jrzfjKV8YIziOMOJS8VnmZKcE_VYPepru9Mr2XzEQ0trLkG_aph4YE5TlqAGuDaELhEQtvbJea7_DjLiZhH1I8J5BVb7EBzYpesg796fKLVns7EF0Ttml9Q5lVM3Hqw2422Et87m2ReSJU8XAPWQ9ybkHf247D4lzRUAZXC-UOr0meHhvhK0BEJmYUT57wHP9HLBL0YnxJBA"
                alt="Classic Restoration"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-stone-900/90 via-stone-900/40 to-transparent" />
              <div className="absolute inset-0 p-10 flex flex-col justify-center max-w-lg">
                <span className="text-tertiary-fixed-dim text-xs font-bold uppercase tracking-[0.3em] mb-3">Project Spotlight</span>
                <h3 className="font-headline text-3xl font-extrabold text-white mb-4 leading-tight">
                  Classic Restoration: The &apos;63 Interceptor
                </h3>
                <p className="text-stone-300 text-sm mb-6 leading-relaxed">
                  A zero-compromise, nut-and-bolt revival of our most heritage-heavy asset. Currently at 85% completion.
                </p>
                <div className="flex gap-4">
                  <button className="bg-white text-stone-900 px-6 py-2 rounded-full font-bold text-sm hover:bg-tertiary-fixed transition-colors">
                    Track Progress
                  </button>
                  <button className="text-white border border-white/30 px-6 py-2 rounded-full font-bold text-sm hover:bg-white/10 transition-colors backdrop-blur-md">
                    View Specs
                  </button>
                </div>
              </div>
              <div className="absolute bottom-8 right-8 bg-black/40 backdrop-blur-lg px-4 py-3 rounded-xl border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full border-2 border-tertiary flex items-center justify-center">
                    <Icon name="history" className="text-tertiary text-sm" filled />
                  </div>
                  <div>
                    <p className="text-xs text-white/60 font-bold uppercase tracking-tighter">Current Phase</p>
                    <p className="text-sm text-white font-bold font-headline">Structural Alignment</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
        </div>

        {/* Add/Edit Vehicle Modal */}
        <Modal open={vehicleModal} onClose={() => setVehicleModal(false)} title={editingVehicle ? "Edit Vehicle" : "Add Vehicle"}>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold mb-2 block">Vehicle Name *</label>
              <Input value={vehicleForm.name} onChange={handleVehicleField("name")} placeholder="e.g., 2024 BMW M3" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold mb-2 block">VIN</label>
              <Input value={vehicleForm.vin} onChange={handleVehicleField("vin")} placeholder="e.g., WBA12345678901234" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold mb-2 block">License Plate</label>
                <Input value={vehicleForm.plate} onChange={handleVehicleField("plate")} placeholder="e.g., B-AB 1234" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold mb-2 block">Mileage</label>
                <Input value={vehicleForm.mileage} onChange={handleVehicleField("mileage")} placeholder="e.g., 15,000 km" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setVehicleModal(false)}>Cancel</Button>
              <Button variant="secondary" onClick={handleSaveVehicle}>
                <Icon name={editingVehicle ? "save" : "add"} className="text-sm" />
                {editingVehicle ? "Save Changes" : "Add Vehicle"}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal open={deleteConfirm !== null} onClose={() => setDeleteConfirm(null)} title="Remove Vehicle" size="sm">
          <div className="space-y-4">
            <p className="text-sm text-on-surface-variant">
              Are you sure you want to remove this vehicle? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
              <Button variant="destructive" onClick={() => handleDeleteVehicle(deleteConfirm)}>
                <Icon name="delete" className="text-sm" /> Remove
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </PageTransition>
  );
}
        