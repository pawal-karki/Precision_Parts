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


export default function AdminProfile() {
  const { user } = useAuth();
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getMe()
      .then(setProfile)
      .catch(() => toast("Could not load authority metrics", "error"))
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
      toast("Industrial authority profile synchronized", "success");
    } catch (err) {
      toast(err.message || "Synchronization failure", "error");
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
      <div className="max-w-5xl mx-auto space-y-10">
        <motion.div variants={fadeInUp} initial="initial" animate="animate" className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="px-2 py-0.5 bg-error text-[10px] font-black text-white uppercase tracking-[0.2em] rounded">Secure Terminal</div>
              <div className="px-2 py-0.5 bg-surface-container-high dark:bg-neutral-800 text-[10px] font-black uppercase tracking-[0.2em] rounded">ID: {profile?.id?.slice(0, 8) || "88C-X99"}</div>
            </div>
            <h1 className="text-4xl font-black font-headline text-on-surface dark:text-neutral-100 tracking-tight italic">
              System Authority Control
            </h1>
            <p className="text-on-surface-variant dark:text-neutral-500 mt-2 max-w-xl">
              Precision management of administrative identity, cryptographic credentials, and regional operational clearance levels.
            </p>
          </div>
          <Button variant="secondary" onClick={handleSave} disabled={saving} className="shadow-lg shadow-secondary/10">
            <Icon name={saving ? "progress_activity" : "verified_user"} className={saving ? "animate-spin" : ""} />
            {saving ? "Synchronizing..." : "Apply Operational Updates"}
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Identity Matrix */}
          <div className="lg:col-span-4 space-y-8">
            <Card className="dark:bg-[#1C1C1C] dark:border-neutral-800 overflow-hidden relative border-none shadow-2xl">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Icon name="security" className="text-9xl" />
              </div>
              <CardContent className="pt-10 flex flex-col items-center">
              <ImageDropzone 
                  value={profile?.imageUrl} 
                  onChange={(url) => setProfile({...profile, imageUrl: url})}
                  aspect="avatar"
                  className="w-32 h-32 mx-auto rotate-3 hover:rotate-0 transition-transform duration-500 shadow-2xl"
                  fallback={
                    <div className="w-full h-full rounded-full bg-secondary flex items-center justify-center text-3xl font-bold text-white">
                      <span>{user?.fullName?.charAt(0) || "A"}</span>
                    </div>
                  }
                />
                
                <h3 className="text-xl font-black dark:text-white mt-6 font-headline tracking-tight">{profile?.fullName || "Admin"}</h3>
                <p className="text-[10px] font-black text-secondary uppercase tracking-[0.3em] mt-1 bg-secondary/5 px-3 py-1 rounded-full">Root Authority</p>
                
                <div className="w-full mt-10 space-y-4">
                  {[
                    { label: "Security Clearance", value: "Level 4 (Executive)", icon: "verified" },
                    { label: "System Priority", value: "Priority A (Real-time)", icon: "bolt" },
                    { label: "Operational Region", value: profile?.region || "Global Hub", icon: "public" },
                  ].map((item) => (
                    <div key={item.label} className="p-4 bg-surface-container-low dark:bg-neutral-900/50 rounded-xl border border-surface-container dark:border-neutral-800 group hover:border-secondary/40 transition-colors">
                      <div className="flex items-center gap-3">
                        <Icon name={item.icon} className="text-secondary text-base" />
                        <div>
                          <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">{item.label}</p>
                          <p className="text-sm font-bold dark:text-neutral-300 group-hover:text-white transition-colors">{item.value}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="p-6 bg-surface-container-low dark:bg-neutral-900 rounded-2xl border-2 border-dashed border-surface-container dark:border-neutral-800 flex flex-col items-center text-center">
              <Icon name="lan" className="text-3xl text-on-surface-variant/30 mb-2" />
              <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Network Status</p>
              <p className="text-xs font-bold text-emerald-500 mt-1">Encrypted Connection Active</p>
            </div>
          </div>

          {/* Configuration Matrix */}
          <div className="lg:col-span-8">
            <Card className="dark:bg-[#1C1C1C] dark:border-neutral-800 border-none shadow-xl">
              <CardHeader className="border-b border-surface-container dark:border-neutral-800">
                <CardTitle className="text-xl font-headline font-black italic tracking-tight">Authority Parameters</CardTitle>
              </CardHeader>
              <CardContent className="pt-8 space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Identity Display Name</label>
                    <Input 
                      className="bg-surface-container-lowest dark:bg-neutral-900 border-none focus:ring-2 focus:ring-secondary/50 rounded-xl h-12 text-lg font-bold"
                      value={profile?.fullName || ""} 
                      onChange={e => setProfile({...profile, fullName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Encrypted Contact Address</label>
                    <Input 
                      className="bg-neutral-100 dark:bg-neutral-900/30 opacity-60 rounded-xl h-12 border-none font-mono text-sm"
                      value={profile?.email || ""} 
                      disabled
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Mobile Response Node</label>
                    <Input 
                      className="bg-surface-container-lowest dark:bg-neutral-900 border-none focus:ring-2 focus:ring-secondary/50 rounded-xl h-12 text-lg font-bold"
                      value={profile?.phone || ""} 
                      onChange={e => setProfile({...profile, phone: e.target.value})}
                      placeholder="+977..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Assigned Operational Sector</label>
                    <Input 
                      className="bg-surface-container-lowest dark:bg-neutral-900 border-none focus:ring-2 focus:ring-secondary/50 rounded-xl h-12 text-lg font-bold"
                      value={profile?.region || "Kathmandu Headquarters"} 
                      onChange={e => setProfile({...profile, region: e.target.value})}
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-surface-container dark:border-neutral-800">
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-on-surface-variant mb-6">Security & Authentication</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="group p-4 bg-surface-container-low dark:bg-neutral-900/50 rounded-2xl border border-surface-container dark:border-neutral-800 flex items-center justify-between hover:bg-secondary/5 transition-colors cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                          <Icon name="key" className="text-secondary" />
                        </div>
                        <div>
                          <p className="text-sm font-black dark:text-white">Credentials Matrix</p>
                          <p className="text-[10px] text-neutral-500 uppercase font-bold">Update security key</p>
                        </div>
                      </div>
                      <Icon name="chevron_right" className="text-on-surface-variant group-hover:translate-x-1 transition-transform" />
                    </div>

                    <div className="group p-4 bg-surface-container-low dark:bg-neutral-900/50 rounded-2xl border border-surface-container dark:border-neutral-800 flex items-center justify-between hover:bg-secondary/5 transition-colors cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                          <Icon name="lock" className="text-secondary" />
                        </div>
                        <div>
                          <p className="text-sm font-black dark:text-white">Two-Factor ID</p>
                          <p className="text-[10px] text-emerald-500 uppercase font-bold">Currently Active</p>
                        </div>
                      </div>
                      <Icon name="settings" className="text-on-surface-variant group-hover:rotate-45 transition-transform" />
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
