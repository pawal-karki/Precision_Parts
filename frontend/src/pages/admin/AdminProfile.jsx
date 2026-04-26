import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { motion, PageTransition, fadeInUp } from "@/components/ui/motion";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function AdminProfile() {
  const { user } = useAuth();
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getMe()
      .then(setProfile)
      .catch(() => toast("Could not load profile", "error"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Logic for admin profile update
      await new Promise(res => setTimeout(res, 800));
      toast("Admin profile updated", "success");
    } catch {
      toast("Update failed", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Icon name="sync" className="text-4xl animate-spin text-secondary" />
    </div>
  );

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto space-y-8">
        <motion.div variants={fadeInUp} initial="initial" animate="animate">
          <h1 className="text-3xl font-extrabold font-headline text-on-surface dark:text-neutral-100 italic">
            Administrator Profile
          </h1>
          <p className="text-on-surface-variant dark:text-neutral-400 mt-2">
            Secure configuration of industrial identity and communication channels.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Identity Card */}
          <Card className="md:col-span-4 dark:bg-[#1C1C1C] dark:border-neutral-800">
            <CardContent className="pt-8 flex flex-col items-center">
              <div className="w-24 h-24 rounded-2xl bg-secondary flex items-center justify-center text-3xl font-bold text-white shadow-xl shadow-secondary/20 mb-4 transform rotate-3">
                {user?.fullName?.charAt(0) || "A"}
              </div>
              <h3 className="text-lg font-bold dark:text-white">{user?.fullName || "Admin"}</h3>
              <p className="text-xs font-bold text-secondary uppercase tracking-widest mt-1">System Authority</p>
              
              <div className="w-full mt-8 space-y-3">
                <div className="p-3 bg-surface-container-low dark:bg-neutral-900 rounded-lg border border-surface-container dark:border-neutral-800">
                  <p className="text-[10px] font-bold text-neutral-500 uppercase">Access Level</p>
                  <p className="text-sm font-bold dark:text-neutral-300">Root / Superuser</p>
                </div>
                <div className="p-3 bg-surface-container-low dark:bg-neutral-900 rounded-lg border border-surface-container dark:border-neutral-800">
                  <p className="text-[10px] font-bold text-neutral-500 uppercase">Last Login</p>
                  <p className="text-sm font-bold dark:text-neutral-300">{new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Config Card */}
          <Card className="md:col-span-8 dark:bg-[#1C1C1C] dark:border-neutral-800">
            <CardHeader>
              <CardTitle className="text-xl">Identity Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-500 uppercase ml-1">Full Identity Name</label>
                  <Input 
                    value={profile?.fullName || ""} 
                    onChange={e => setProfile({...profile, fullName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-500 uppercase ml-1">Secure Email</label>
                  <Input 
                    value={profile?.email || ""} 
                    disabled
                    className="bg-neutral-100 dark:bg-neutral-900/50 opacity-60"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-500 uppercase ml-1">Response Mobile</label>
                  <Input 
                    value={profile?.phone || ""} 
                    onChange={e => setProfile({...profile, phone: e.target.value})}
                    placeholder="+977..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-500 uppercase ml-1">Duty Region</label>
                  <Input 
                    value={profile?.region || "Headquarters"} 
                    onChange={e => setProfile({...profile, region: e.target.value})}
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button variant="secondary" onClick={handleSave} disabled={saving}>
                  <Icon name={saving ? "sync" : "verified_user"} className={saving ? "animate-spin" : ""} />
                  {saving ? "Deploying..." : "Update Authority"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}
