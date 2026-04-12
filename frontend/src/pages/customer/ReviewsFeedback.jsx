import { useState } from "react";
import { useToast } from "@/components/ui/toast";
import { motion, PageTransition, fadeInUp } from "@/components/ui/motion";
import { Icon } from "@/components/ui/icon";

const awaitingFeedback = [
  { id: 1, icon: "precision_manufacturing", title: "Titanium Turbine Valve", ref: "Order #PA-99281", sub: "Delivered 2d ago" },
  { id: 2, icon: "build_circle", title: "Annual Calibration Service", ref: "Service #SR-4402", sub: "Completed yesterday" },
  { id: 3, icon: "settings_input_component", title: "Heptane Filtration Unit", ref: "Order #PA-98553", sub: "Delivered 4d ago" },
];

const previousReviews = [
  {
    id: 1,
    title: "Pneumatic Actuator",
    date: "Oct 12, 2023",
    rating: 5.0,
    text: '"The tolerances on the new series-B actuators are exceptional. Integration into our existing manifold was seamless. Zero pressure drop recorded during high-frequency cycles."',
    reviewer: "Chief Engineer, Sector 7",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuB8Bj_9nFJwp1oABzR1si4_NZ-S0Fg7_K_3dh-Fw7sSedzoYarMshBfzrjlTcLqdWCwxB9snUaJbLyzKzZqDR5Jj4aKJNzZGT5YBSNcebfc9csmqFQ6ig8I4P3CriAIMf3GH22FHPmawOAg7M_MjI7hqvDU4dv0mZkWaku-i5bmf7YO8xjPpVkqPSlXUSKkcW1cdlxHnZ6VWNM7rUeYpRG7_7fVbdHCtMC1ygJ4pdPsu11Kc-HPLRuuPJKMmCf6tFnHwweo31wDLA",
  },
  {
    id: 2,
    title: "Structural Integrity Test",
    date: "Sep 28, 2023",
    rating: 4.8,
    text: '"Service team was punctual and professional. The ultrasonic reporting was comprehensive, though the turnaround for the final PDF took slightly longer than expected."',
    reviewer: "Operations Lead, Aris Corp",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuBH-bdbUWFiHR-06W9wt2xSubD-8EjCDh86NgDKTKG8yAA4xFvPRZBT4VHLYuQx5KQjiGLl82MrY8dnByqiatVSdlRWWdxhjqbN7N2cXeeXoGu78WY0zDWISYPqLTIuOjfEMgQi9GKtdhhyu_zMsDp7okASH35Yt516PNIYVWM875-AFnf9p3Cn6u2l0ajSomSnWBByzO6BodVTfistZliHg9VBegvJ8AzUBkD5Yz-S3ezhwMe6yAIgm5f_wO7xKE4g88DH-MhFRQ",
  },
  {
    id: 3,
    title: "Custom Alloy Casting",
    date: "Aug 15, 2023",
    rating: 5.0,
    text: '"The metallurgical grain structure on these custom casts is the best we\'ve seen this year. Heat dissipation metrics are exactly as promised in the blueprint stages."',
    reviewer: "Lab Director, Neo-Dynamics",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuD2dSeB6IMPv1pqnMpNszBT48Q3bGlNoS3ni1qg1UQM2Fc2CyIXQUBqNz-sb9CO3J2HYMgYet80ZqArwfamKxyLyybl4DCwYrUMIBHVmPZUR5b8YY6dxfUw0xMhIld0_Py7nCdDM4KjoPJxf0rzypqm4P1LGHNRy_0zzR7iX2g1rf5RWOwPkGIc35Yn5ouots3f2OgHQH_9pIwfgBTrXDE6HfJN2ViVOl7fw39KHiwQs0OjMzUAPudPea1ACsY1f3dBK_tkEM2sZw",
  },
];

export default function ReviewsFeedback() {
  const toast = useToast();
  const [rating, setRating] = useState(4);
  const [selectedAsset, setSelectedAsset] = useState(awaitingFeedback[0]?.ref || "");
  const [feedback, setFeedback] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!feedback.trim()) {
      toast("Please provide your detailed feedback", "error");
      return;
    }
    toast("Review posted successfully! Thank you for your feedback.", "success");
    setFeedback("");
    setRating(4);
  };

  return (
    <PageTransition>
      <div className="space-y-12">
        {/* Header */}
        <motion.header
          className="flex flex-col gap-2 max-w-2xl"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
        >
          <h1 className="text-4xl font-extrabold tracking-tighter font-headline text-on-surface dark:text-white">
            Experience Review
          </h1>
          <p className="text-on-surface-variant dark:text-stone-400 leading-relaxed">
            Help us maintain the standard of industrial excellence. Share your feedback on recent acquisitions and maintenance cycles.
          </p>
        </motion.header>

        {/* Awaiting & Submit Form Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Awaiting Feedback */}
          <motion.section
            className="lg:col-span-5 flex flex-col gap-6"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-headline font-bold text-xl tracking-tight dark:text-white">Awaiting Feedback</h2>
              <span className="bg-secondary-container text-on-secondary-container text-xs font-bold px-3 py-1 rounded-full">
                {awaitingFeedback.length} PENDING
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {awaitingFeedback.map((item) => (
                <motion.div
                  key={item.id}
                  whileHover={{ x: 4 }}
                  className="bg-surface-container-low dark:bg-stone-900 p-4 rounded-xl flex items-center gap-4 transition-all hover:bg-surface-container-high dark:hover:bg-stone-800 cursor-pointer"
                  onClick={() => setSelectedAsset(item.ref)}
                >
                  <div className="w-16 h-16 bg-surface-container-lowest dark:bg-stone-800 rounded-lg flex items-center justify-center shrink-0">
                    <Icon name={item.icon} className="text-secondary text-3xl" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-headline font-bold text-on-surface dark:text-white">{item.title}</h3>
                    <p className="text-xs text-on-surface-variant">{item.ref} &bull; {item.sub}</p>
                  </div>
                  <Icon name="chevron_right" className="text-outline-variant" />
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Right: Submit Feedback */}
          <motion.section
            className="lg:col-span-7 bg-surface-container-lowest dark:bg-stone-900 rounded-2xl p-8 shadow-sm"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.2 }}
          >
            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-1">
                <h2 className="font-headline font-bold text-2xl tracking-tight dark:text-white">Submit Feedback</h2>
                <p className="text-sm text-on-surface-variant">Your technical insights drive our engineering precision.</p>
              </div>
              <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
                {/* Asset Selection */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-on-surface-variant tracking-wider uppercase">
                    Select Asset or Service
                  </label>
                  <select
                    className="w-full bg-surface-container-low dark:bg-stone-800 border-none rounded-lg p-3 text-on-surface dark:text-white focus:ring-2 focus:ring-secondary-fixed-dim transition-all appearance-none"
                    value={selectedAsset}
                    onChange={(e) => setSelectedAsset(e.target.value)}
                  >
                    {awaitingFeedback.map((item) => (
                      <option key={item.id} value={item.ref}>
                        {item.title} - {item.ref}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Star Rating */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-on-surface-variant tracking-wider uppercase">
                    Performance Rating
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={`text-3xl transition-transform hover:scale-110 ${
                          star <= rating ? "text-secondary" : "text-outline-variant"
                        }`}
                      >
                        <Icon
                          name="star"
                          filled={star <= rating}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Detailed Report */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-on-surface-variant tracking-wider uppercase">
                    Detailed Technical Report
                  </label>
                  <textarea
                    className="w-full bg-surface-container-low dark:bg-stone-800 border-none rounded-xl p-4 text-on-surface dark:text-white focus:ring-2 focus:ring-secondary-fixed-dim transition-all placeholder:text-outline resize-none"
                    placeholder="Describe the installation process, operational efficiency, and any variance from specifications..."
                    rows={5}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="bg-primary dark:bg-stone-700 hover:bg-primary-dim text-on-primary dark:text-white font-headline font-bold py-3 px-10 rounded-lg transition-all active:scale-[0.98] shadow-sm"
                  >
                    Post Review
                  </button>
                </div>
              </form>
            </div>
          </motion.section>
        </div>

        {/* Previous Reviews */}
        <section className="flex flex-col gap-8">
          <div className="flex items-center gap-4">
            <h2 className="font-headline font-extrabold text-2xl tracking-tighter dark:text-white">Previous Reviews</h2>
            <div className="h-[1px] flex-1 bg-surface-container-highest dark:bg-stone-700" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {previousReviews.map((review, i) => (
              <motion.div
                key={review.id}
                className="bg-surface-container-low dark:bg-stone-900 p-6 rounded-2xl flex flex-col gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <h4 className="font-headline font-bold text-on-surface dark:text-white">{review.title}</h4>
                    <span className="text-xs text-on-surface-variant">Reviewed {review.date}</span>
                  </div>
                  <div className="flex items-center bg-tertiary-container px-2 py-0.5 rounded">
                    <Icon name="star" className="text-xs text-on-tertiary-container" filled />
                    <span className="text-xs font-bold text-on-tertiary-container ml-1">{review.rating}</span>
                  </div>
                </div>
                <p className="text-sm text-on-surface-variant italic leading-relaxed">{review.text}</p>
                <div className="flex items-center gap-2 mt-auto">
                  <div className="w-6 h-6 rounded-full bg-secondary-fixed overflow-hidden">
                    <img alt="User" className="w-full h-full object-cover" src={review.avatar} />
                  </div>
                  <span className="text-xs font-semibold text-on-surface dark:text-white">{review.reviewer}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
          