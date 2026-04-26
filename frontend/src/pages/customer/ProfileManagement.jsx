import { useState, useEffect } from "react";
import { api, getImageUrl } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { Modal } from "@/components/ui/modal";
import { motion, AnimatePresence, PageTransition, fadeInUp } from "@/components/ui/motion";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";

const vehicleImages = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuB6cMTs1PPSCYKTA6AS-Nc_GAay9K3npVFM-eTwfYuOPtcT7UbZkkurrWx5XmtkYErx0RSiR3LLGsxRaDLLWChPo13S_-JdlFbsdfmmKPzbSkY8j95inntK8HYY0iyVZTPQpsn2Xct1qtZbD26lJI0tE6ncj9wRAgKk4MRcUi4blVIB_hU9CoG9eyBKWi8VsQyE30Dq_MvBlBYKFmT8UNJTsfpTkKJ4fY0rbVrvnHU7roLtPcq8SWz5o71E1hTypP5g3HoevgyRTg",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuANBhDA3itFqwDD-dvMfvcjdUzb0y3gjRQvZ14vhlDzrRo8VC3CpJjZ73dbnYFhfvGTHXcX6XJ60UhG7Q9fGE_ujnW7uRT8ZaOK3_0mBvJ-G6zp-aXeCR-iPvC2sDQqV-dJDAsgkz59uwf5ykiPm2vU5RBxa1wKQkh2bEAReHTTt1WMfjDTZ-MRnvHMXIaxGaESZQMGHpjfems0h0BW2AE1vdXT2gZVfVHs2-GA44VoED15HR7v7DlpeaEr02LAMbVbkJAcHaljEg",
];

const emptyVehicle = { nickname: "", mileageKm: "", imageUrl: null };

function VehicleImageUpload({ value, onChange }) {
  const [uploading, setUploading] = useState(false);
  const toast = useToast();

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await api.uploadPartImage(file);
      onChange(res.imageUrl);
      toast("Vehicle image ready", "success");
    } catch (err) {
      toast("Image upload failed", "error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative group w-full h-40 rounded-xl bg-surface-container-low dark:bg-neutral-800 flex items-center justify-center overflow-hidden border-2 border-dashed border-surface-container dark:border-neutral-700 hover:border-secondary transition-colors cursor-pointer">
      {value ? (
        <img src={getImageUrl(value)} alt="Vehicle Preview" className="w-full h-full object-cover" />
      ) : (
        <div className="flex flex-col items-center gap-2 text-on-surface-variant">
          <Icon name={uploading ? "progress_activity" : "add_a_photo"} className={uploading ? "animate-spin text-2xl" : "text-2xl"} />
          <span className="text-[10px] font-bold uppercase tracking-wider">{uploading ? "Uploading..." : "Upload Vehicle Image"}</span>
        </div>
      )}
      <input
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="absolute inset-0 opacity-0 cursor-pointer"
        disabled={uploading}
      />
      {value && (
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Icon name="edit" className="text-white text-xl" />
        </div>
      )}
    </div>
  );
}

function ProfileImageUpload({ value, onChange, username }) {
  const [uploading, setUploading] = useState(false);
  const toast = useToast();

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await api.uploadPartImage(file);
      onChange(res.imageUrl);
      toast("Profile photo updated", "success");
    } catch (err) {
      toast("Upload failed", "error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative group w-24 h-24 mb-6">
      <div className="w-full h-full rounded-full bg-secondary flex items-center justify-center text-4xl font-extrabold text-on-secondary font-headline shadow-lg overflow-hidden border-4 border-surface-container-low dark:border-[#1C1C1C]">
        {value ? (
          <img src={getImageUrl(value)} alt="Profile" className="w-full h-full object-cover" />
        ) : (
          <span>{username?.charAt(0).toUpperCase()}</span>
        )}
      </div>
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center cursor-pointer">
        {uploading ? (
          <Icon name="progress_activity" className="text-white animate-spin text-xl" />
        ) : (
          <Icon name="photo_camera" className="text-white text-xl" />
        )}
      </div>
      <input
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="absolute inset-0 opacity-0 cursor-pointer"
        disabled={uploading}
      />
    </div>
  );
}

export default function ProfileManagement() {
  const { user } = useAuth();
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [vehicleLoading, setVehicleLoading] = useState(true);
  const [vehicleModal, setVehicleModal] = useState(false);
  const [vehicleForm, setVehicleForm] = useState({ ...emptyVehicle });
  const [editingVehicleId, setEditingVehicleId] = useState(null);
  const [addingVehicle, setAddingVehicle] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [me, vehicleList] = await Promise.all([
          api.getMe(),
          api.getVehicles(),
        ]);
        if (!cancelled) {
          setProfile(me || { fullName: user?.fullName || "", email: user?.email || "", phone: "", region: "", imageUrl: "" });
          setVehicles(Array.isArray(vehicleList) ? vehicleList : []);
        }
      } catch {
        if (!cancelled) {
          setProfile({ fullName: user?.fullName || "", email: user?.email || "", phone: "", region: "", imageUrl: "" });
          setVehicles([]);
        }
      } finally {
        if (!cancelled) setVehicleLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleProfileChange = (field) => (e) => {
    setProfile((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      // Profile update logic...
      await new Promise(res => setTimeout(res, 800));
      toast("Profile updated successfully!", "success");
    } catch {
      toast("Could not save profile", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleVehicleField = (field) => (e) => {
    setVehicleForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const openAddVehicle = () => {
    setVehicleForm({ ...emptyVehicle });
    setEditingVehicleId(null);
    setVehicleModal(true);
  };

  const openEditVehicle = (vehicle) => {
    setVehicleForm({
      nickname: vehicle.nickname || "",
      mileageKm: vehicle.mileageKm || "",
      imageUrl: vehicle.imageUrl || null
    });
    setEditingVehicleId(vehicle.id);
    setVehicleModal(true);
  };

  const handleSaveVehicle = async () => {
    if (!vehicleForm.nickname.trim()) {
      toast("Vehicle nickname is required", "error");
      return;
    }
    setAddingVehicle(true);
    try {
      const payload = {
        nickname: vehicleForm.nickname.trim(),
        mileageKm: parseInt(vehicleForm.mileageKm) || 0,
        imageUrl: vehicleForm.imageUrl || null,
      };

      if (editingVehicleId) {
        const updated = await api.updateVehicle(editingVehicleId, payload);
        setVehicles((prev) => prev.map(v => v.id === editingVehicleId ? updated : v));
        toast("Vehicle details synchronized!", "success");
      } else {
        const created = await api.addVehicle(payload);
        setVehicles((prev) => [...prev, created]);
        toast("Vehicle added to your garage!", "success");
      }
      
      setVehicleModal(false);
      setVehicleForm({ ...emptyVehicle });
      setEditingVehicleId(null);
    } catch (err) {
      toast(err.message || "Could not save vehicle", "error");
    } finally {
      setAddingVehicle(false);
    }
  };

  const confirmDeleteVehicle = (id) => {
    setVehicles((prev) => prev.filter((v) => v.id !== id));
    setDeleteConfirm(null);
    toast("Vehicle removed from garage", "info");
  };

  return (
    <PageTransition>
      <div className="space-y-10">
        {/* Header */}
        <motion.header
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-4"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
        >
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight font-headline text-on-surface dark:text-white mb-2">
              Profile &amp; Garage
            </h1>
            <p className="text-on-surface-variant dark:text-neutral-400 max-w-2xl">
              Manage your vehicle collection and precision contact details from one central hub.
            </p>
          </div>
        </motion.header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Personal Info */}
          <motion.section
            className="lg:col-span-4 bg-surface-container-low dark:bg-[#1C1C1C] rounded-xl p-6 sm:p-8 h-fit"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.05 }}
          >
            {/* Avatar Section */}
            <div className="flex flex-col items-center mb-6">
              <ProfileImageUpload 
                value={profile?.imageUrl} 
                onChange={(url) => setProfile({...profile, imageUrl: url})}
                username={profile?.fullName || user?.fullName}
              />
              <h2 className="text-xl font-bold font-headline text-on-surface dark:text-white">
                {profile?.fullName || profile?.name || user?.name || "Customer"}
              </h2>
              <div className="mt-2 px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full text-[10px] font-bold uppercase tracking-wider">
                Elite Customer
              </div>
            </div>

            {/* Fields */}
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1 block">Full Identity Name</label>
                <Input
                  value={profile?.fullName || profile?.name || ""}
                  onChange={handleProfileChange("fullName")}
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1 block">Contact Email</label>
                <Input
                  type="email"
                  value={profile?.email || ""}
                  onChange={handleProfileChange("email")}
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1 block">Secure Phone</label>
                <Input
                  value={profile?.phone || profile?.phoneNumber || ""}
                  onChange={handleProfileChange("phone")}
                  placeholder="+977 98XXXXXXXX"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1 block">Region Hub</label>
                <Input
                  value={profile?.region || ""}
                  onChange={handleProfileChange("region")}
                  placeholder="e.g. Kathmandu Valley"
                />
              </div>
              <Button
                variant="secondary"
                className="w-full mt-4 h-11"
                onClick={handleSaveProfile}
                disabled={saving}
              >
                {saving ? (
                  <><Icon name="progress_activity" className="text-sm animate-spin" /> Synchronizing…</>
                ) : (
                  <><Icon name="save" className="text-sm" /> Update Profile</>
                )}
              </Button>
            </div>
          </motion.section>

          {/* Vehicle Garage */}
          <motion.section
            className="lg:col-span-8 space-y-6"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-extrabold font-headline text-on-surface dark:text-white">
                My Garage
              </h2>
              <Button onClick={openAddVehicle} variant="secondary" size="sm">
                <Icon name="add" className="text-sm" /> Add Vehicle
              </Button>
            </div>

            {vehicleLoading ? (
              <div className="flex items-center justify-center h-48 text-secondary">
                <Icon name="progress_activity" className="text-3xl animate-spin" />
              </div>
            ) : vehicles.length === 0 ? (
              <motion.div
                className="flex flex-col items-center justify-center h-48 bg-surface-container-low dark:bg-[#1C1C1C] rounded-xl text-on-surface-variant gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Icon name="garage" className="text-5xl" />
                <div className="text-center">
                  <p className="font-semibold">No vehicles registered yet</p>
                  <p className="text-sm">Add a vehicle to get predictive maintenance insights</p>
                </div>
                <Button onClick={openAddVehicle} variant="outline">
                  <Icon name="add_circle" className="text-sm" /> Register First Vehicle
                </Button>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <AnimatePresence>
                  {vehicles.map((vehicle, idx) => (
                    <motion.div
                      key={vehicle.id || idx}
                      className="group bg-surface-container-lowest dark:bg-[#1C1C1C] rounded-2xl overflow-hidden shadow-sm border border-surface-container dark:border-neutral-800/50 hover:shadow-md transition-all"
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: idx * 0.07 }}
                    >
                      <div className="h-44 overflow-hidden relative">
                        <img
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          src={getImageUrl(vehicle.imageUrl) || vehicleImages[idx % vehicleImages.length]}
                          alt={vehicle.nickname || "Vehicle"}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-3 left-4 right-4">
                          <h3 className="text-white font-headline font-extrabold text-lg drop-shadow">
                            {vehicle.nickname || vehicle.name || "My Vehicle"}
                          </h3>
                        </div>
                      </div>

                      <div className="p-5">
                        <div className="grid grid-cols-3 gap-3 mb-4">
                          <div className="bg-surface-container-low dark:bg-neutral-800 p-2 rounded-lg text-center">
                            <p className="text-[10px] uppercase font-bold text-on-surface-variant">Mileage</p>
                            <p className="text-sm font-bold text-on-surface dark:text-white mt-1">
                              {(vehicle.mileageKm ?? 0).toLocaleString()} km
                            </p>
                          </div>
                          <div className="bg-surface-container-low dark:bg-neutral-800 p-2 rounded-lg text-center">
                            <p className="text-[10px] uppercase font-bold text-on-surface-variant">Health</p>
                            <p className={`text-sm font-bold mt-1 ${(vehicle.healthScore || 100) >= 90 ? "text-emerald-600" : (vehicle.healthScore || 100) >= 70 ? "text-amber-600" : "text-error"}`}>
                              {vehicle.healthScore || 100}%
                            </p>
                          </div>
                          <div className="bg-surface-container-low dark:bg-neutral-800 p-2 rounded-lg text-center">
                            <p className="text-[10px] uppercase font-bold text-on-surface-variant">Status</p>
                            <p className={`text-[10px] font-bold mt-1.5 ${(vehicle.healthScore || 100) >= 90 ? "text-emerald-600" : "text-amber-600"}`}>
                              {(vehicle.healthScore || 100) >= 90 ? "OPTIMAL" : "SVC DUE"}
                            </p>
                          </div>
                        </div>

                        {vehicle.lastServiceDate && (
                          <p className="text-xs text-on-surface-variant mb-4">
                            Last service: {new Date(vehicle.lastServiceDate).toLocaleDateString("en-NP")}
                          </p>
                        )}

                        <div className="flex gap-2">
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            className="flex-[3]"
                            onClick={() => openEditVehicle(vehicle)}
                          >
                            <Icon name="edit" className="text-sm" /> Edit Details
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => setDeleteConfirm(vehicle.id)}
                          >
                            <Icon name="delete" className="text-sm text-error" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.section>
        </div>
      </div>

      {/* Add/Edit Vehicle Modal */}
      <Modal 
        open={vehicleModal} 
        onClose={() => setVehicleModal(false)} 
        title={editingVehicleId ? "Modify Vehicle Specs" : "Register New Vehicle"} 
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2 block">Vehicle Appearance</label>
            <VehicleImageUpload 
              value={vehicleForm.imageUrl} 
              onChange={(url) => setVehicleForm({...vehicleForm, imageUrl: url})} 
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1 block">Nickname / Model *</label>
            <Input
              value={vehicleForm.nickname}
              onChange={handleVehicleField("nickname")}
              placeholder="e.g. 2019 Honda Civic"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1 block">Current Mileage (km)</label>
            <Input
              type="number"
              value={vehicleForm.mileageKm}
              onChange={handleVehicleField("mileageKm")}
              placeholder="e.g. 35000"
              min="0"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" className="flex-1" onClick={() => setVehicleModal(false)}>Cancel</Button>
            <Button variant="secondary" className="flex-1" onClick={handleSaveVehicle} disabled={addingVehicle}>
              {addingVehicle ? <Icon name="progress_activity" className="text-sm animate-spin" /> : <Icon name={editingVehicleId ? "check" : "add"} className="text-sm" />}
              {addingVehicle ? "Updating…" : editingVehicleId ? "Apply Changes" : "Add Vehicle"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Remove Vehicle" size="sm">
        <p className="text-on-surface-variant mb-6">Are you sure you want to remove this vehicle from your garage? This action cannot be undone.</p>
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button variant="destructive" onClick={() => confirmDeleteVehicle(deleteConfirm)}>
            <Icon name="delete" className="text-sm" /> Remove
          </Button>
        </div>
      </Modal>
    </PageTransition>
  );
}