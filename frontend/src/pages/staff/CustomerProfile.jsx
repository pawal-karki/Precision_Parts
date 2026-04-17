import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";

const tabs = ["Overview", "Orders", "Vehicles", "Notes"];

export default function CustomerProfile() {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [activeTab, setActiveTab] = useState("Overview");

  useEffect(() => {
    api.getCustomers().then((customers) => {
      const found = customers.find(
        (c) => c.id === Number(id) || String(c.id) === String(id)
      );
      setCustomer(found);
    });
  }, [id]);

  if (!customer) return <div className="animate-pulse text-on-surface-variant">Loading...</div>;

  return (
    <>
      <Link
        to="/staff/customers"
        className="flex items-center gap-1 text-sm text-secondary hover:text-secondary-dim transition-colors"
      >
        <Icon name="arrow_back" className="text-sm" />
        Back to Customers
      </Link>

      <div className="grid grid-cols-12 gap-8">
        {/* Left Column - Profile Card */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-surface-container-lowest dark:bg-[#1C1C1C] rounded-3xl p-8 border border-surface-container-low dark:border-neutral-800/50 text-center">
            <div className="w-20 h-20 rounded-full bg-secondary/10 mx-auto flex items-center justify-center mb-4">
              <span className="text-3xl font-extrabold text-secondary">
                {customer.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </span>
            </div>
            <h2 className="text-2xl font-extrabold font-headline">{customer.name}</h2>
            <Badge variant={customer.status === "Active" ? "success" : "error"} className="mt-2">
              {customer.status}
            </Badge>

            <div className="mt-6 space-y-3 text-left">
              <div className="flex items-center gap-3 text-sm">
                <Icon name="mail" className="text-on-surface-variant" />
                <span className="text-on-surface-variant">{customer.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Icon name="phone" className="text-on-surface-variant" />
                <span className="text-on-surface-variant">{customer.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Icon name="loyalty" className="text-on-surface-variant" />
                <span className={`font-bold ${
                  customer.loyaltyTier === "Platinum" ? "text-violet-500" :
                  customer.loyaltyTier === "Gold" ? "text-amber-500" :
                  "text-slate-400"
                }`}>
                  {customer.loyaltyTier} Member
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-6">
              <div className="bg-surface-container-low dark:bg-neutral-800 rounded-lg p-3">
                <p className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">Spent</p>
                <p className="text-lg font-extrabold mt-1">{customer.totalSpent}</p>
              </div>
              <div className="bg-surface-container-low dark:bg-neutral-800 rounded-lg p-3">
                <p className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">Credit</p>
                <p className={`text-lg font-extrabold mt-1 ${customer.credit > 0 ? "text-error" : "text-emerald-600"}`}>
                  ${customer.credit.toLocaleString()}
                </p>
              </div>
            </div>

            <Button variant="secondary" className="w-full mt-6">
              <Icon name="edit" className="text-sm" /> Edit Profile
            </Button>
          </div>
        </div>

        {/* Right Column - Tabs + Content */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* Tabs */}
          <div className="flex gap-1 border-b border-surface-container dark:border-neutral-800">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === tab
                    ? "border-secondary text-on-surface dark:text-white"
                    : "border-transparent text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === "Overview" && (
            <>
              {/* Timeline */}
              <div className="bg-surface-container-lowest dark:bg-[#1C1C1C] rounded-xl p-6 border border-surface-container-low dark:border-neutral-800/50">
                <h3 className="text-lg font-bold font-headline mb-6">Activity Timeline</h3>
                <div className="space-y-6 relative">
                  <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-surface-container-highest dark:bg-neutral-800" />
                  {[
                    { date: "Mar 12", event: "Placed order ORD-4521", detail: "Carbon Ceramic Rotors x4 — $756.00" },
                    { date: "Feb 15", event: "Service completed", detail: "Full brake inspection — $120.00" },
                    { date: "Feb 01", event: "Placed order ORD-4456", detail: "Synthetic Lube 5L x2 — $120.00" },
                    { date: "Jan 18", event: "Placed order ORD-4412", detail: "Transmission Cooler + Hose Kit — $234.00" },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4 pl-1 relative">
                      <div className="w-[10px] h-[10px] rounded-full bg-secondary mt-1.5 z-10 ring-4 ring-surface-container-lowest dark:ring-[#1C1C1C]" />
                      <div>
                        <p className="text-[10px] text-on-surface-variant uppercase font-bold">{item.date}</p>
                        <p className="text-sm font-semibold mt-0.5">{item.event}</p>
                        <p className="text-xs text-on-surface-variant mt-0.5">{item.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === "Vehicles" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {customer.vehicles.length === 0 ? (
                <p className="text-on-surface-variant col-span-2 text-center py-8">No vehicles registered.</p>
              ) : (
                customer.vehicles.map((vehicle, i) => (
                  <div
                    key={i}
                    className="bg-surface-container-lowest dark:bg-[#1C1C1C] rounded-xl p-6 border border-surface-container-low dark:border-neutral-800/50"
                  >
                    <div className="h-32 bg-surface-container-low dark:bg-neutral-800 rounded-lg mb-4 flex items-center justify-center">
                      <Icon name="directions_car" className="text-4xl text-on-surface-variant/30" />
                    </div>
                    <h4 className="font-bold">{vehicle}</h4>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="info">Linked</Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "Orders" && (
            <div className="bg-surface-container-lowest dark:bg-[#1C1C1C] rounded-xl p-6 border border-surface-container-low dark:border-neutral-800/50">
              <h3 className="text-lg font-bold font-headline mb-4">Order History</h3>
              <p className="text-on-surface-variant text-sm">Order history will be loaded from the API.</p>
            </div>
          )}

          {activeTab === "Notes" && (
            <div className="bg-surface-container-lowest dark:bg-[#1C1C1C] rounded-xl p-6 border border-surface-container-low dark:border-neutral-800/50">
              <h3 className="text-lg font-bold font-headline mb-4">Notes</h3>
              <textarea
                className="w-full h-32 bg-surface-container-low dark:bg-neutral-800 border-none rounded-lg p-3 text-sm resize-none focus:ring-2 focus:ring-secondary"
                placeholder="Add notes about this customer..."
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
