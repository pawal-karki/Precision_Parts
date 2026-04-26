import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { motion, PageTransition, fadeInUp } from "@/components/ui/motion";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

import { ImageDropzone } from "@/components/shared/ImageDropzone";


export default function StaffProfile() {
  const { user } = useAuth();
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getMe()
      .then(setProfile)
      .catch(() => toast("Could not load staff profile", "error"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateProfile({
        fullName: profile.fullName,
        phone: profile.phone,
        region: profile.region,
        imageUrl: profile.imageUrl
      });
      toast("Staff profile synchronized successfully", "success");
    } catch (err) {
      toast(err.message || "Synchronization failed", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Icon name="progress_activity" className="text-4xl animate-spin text-secondary" />
    </div>
  );

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto space-y-8">
        <motion.div variants={fadeInUp} initial="initial" animate="animate" className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <div className="px-2 py-0.5 bg-secondary/10 text-secondary text-[10px] font-black uppercase tracking-[0.2em] rounded w-fit mb-2">Staff Hub</div>
            <h1 className="text-3xl font-extrabold font-headline text-on-surface dark:text-neutral-100 tracking-tight">
              Personal Credentials
            </h1>
            <p className="text-on-surface-variant dark:text-neutral-400 mt-1 max-w-xl">
              Manage your professional technician identity, availability, and contact details.
            </p>
          </div>
          <Button variant="secondary" onClick={handleSave} disabled={saving}>
            <Icon name={saving ? "progress_activity" : "save"} className={saving ? "animate-spin" : ""} />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Identity Card */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="dark:bg-[#1C1C1C] dark:border-neutral-800 shadow-xl overflow-hidden">
              <CardContent className="pt-10 flex flex-col items-center">
                <ImageDropzone 
                  value={profile?.imageUrl} 
                  onChange={(url) => setProfile({...profile, imageUrl: url})}
                  aspect="avatar"
                  className="w-32 h-32 mx-auto"
                  fallback={
                    <div className="w-full h-full rounded-full bg-secondary flex items-center justify-center text-3xl font-bold text-white">
                      <span>{user?.fullName?.charAt(0) || "S"}</span>
                    </div>
                  }
                />
                
                <h3 className="text-xl font-bold dark:text-white mt-6 font-headline">{profile?.fullName || "Staff Member"}</h3>
                <p className="text-xs font-semibold text-secondary uppercase tracking-widest mt-1">Senior Technician</p>
                
                <div className="w-full mt-8 space-y-2">
                  <div className="flex items-center justify-between p-3 bg-surface-container-low dark:bg-neutral-900 rounded-lg text-sm">
                    <span className="text-on-surface-variant dark:text-neutral-500 font-medium font-headline uppercase text-[10px] tracking-wider">Status</span>
                    <span className="text-emerald-500 font-bold flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Active
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-surface-container-low dark:bg-neutral-900 rounded-lg text-sm">
                    <span className="text-on-surface-variant dark:text-neutral-500 font-medium font-headline uppercase text-[10px] tracking-wider">Certifications</span>
                    <span className="font-bold dark:text-neutral-300">Level 3 ASE</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="p-5 bg-surface-container-low dark:bg-neutral-900 rounded-2xl border border-surface-container dark:border-neutral-800">
               <h4 className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-4">Availability Schedule</h4>
               <div className="space-y-2">
                  {['Mon - Fri', 'Sat'].map((day) => (
                    <div key={day} className="flex justify-between text-xs">
                      <span className="text-on-surface-variant dark:text-neutral-500">{day}</span>
                      <span className="font-bold dark:text-neutral-300">09:00 - 18:00</span>
                    </div>
                  ))}
               </div>
            </div>
          </div>

          {/* Details Card */}
          <div className="lg:col-span-8">
            <Card className="dark:bg-[#1C1C1C] dark:border-neutral-800 shadow-xl">
              <CardHeader className="border-b border-surface-container dark:border-neutral-800">
                <CardTitle className="text-lg font-headline font-bold">Technician Profile Details</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Full Professional Name</label>
                    <Input 
                      className="bg-surface-container-lowest dark:bg-neutral-900 border-surface-container dark:border-neutral-800 focus:ring-secondary/40 rounded-xl"
                      value={profile?.fullName || ""} 
                      onChange={e => setProfile({...profile, fullName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Email Address</label>
                    <Input 
                      className="bg-neutral-100 dark:bg-neutral-900/30 dark:text-neutral-400 dark:border-neutral-800 rounded-xl"
                      value={profile?.email || ""} 
                      disabled
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Phone Node</label>
                    <Input 
                      className="bg-surface-container-lowest dark:bg-neutral-900 border-surface-container dark:border-neutral-800 focus:ring-secondary/40 rounded-xl"
                      value={profile?.phone || ""} 
                      onChange={e => setProfile({...profile, phone: e.target.value})}
                      placeholder="+977..."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Operational Region</label>
                    <Input 
                      className="bg-surface-container-lowest dark:bg-neutral-900 border-surface-container dark:border-neutral-800 focus:ring-secondary/40 rounded-xl"
                      value={profile?.region || "Lalitpur Hub"} 
                      onChange={e => setProfile({...profile, region: e.target.value})}
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-surface-container dark:border-neutral-800">
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-on-surface-variant mb-6 italic">Secure Workspaces</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-surface-container-low dark:bg-neutral-900 rounded-xl border border-surface-container dark:border-neutral-800 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                          <Icon name="vpn_key" className="text-secondary" />
                        </div>
                        <div>
                          <p className="text-sm font-bold dark:text-white">Credentials Matrix</p>
                          <p className="text-[10px] text-neutral-500 uppercase font-bold">Rotate cryptographic key</p>
                        </div>
                    </div>

                    <div className="p-4 bg-surface-container-low dark:bg-neutral-900 rounded-xl border border-surface-container dark:border-neutral-800 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                          <Icon name="history" className="text-secondary" />
                        </div>
                        <div>
                          <p className="text-sm font-bold dark:text-white">Audit History</p>
                          <p className="text-[10px] text-neutral-500 uppercase font-bold">24 logged interactions</p>
                        </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
