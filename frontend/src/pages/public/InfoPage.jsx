import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

const PAGE_CONTENT = {
  "about": {
    title: "About Precision Parts",
    body: "Precision Parts helps vehicle workshops book, track, and manage inventory and service appointments from one integrated hub.",
  },
  "blog": {
    title: "Blog",
    body: "Product updates, industry trends, and workshop growth guides will be published here.",
  },
  "careers": {
    title: "Careers",
    body: "We are building tools for modern automotive operations. Reach out to join our team.",
  },
  "contact": {
    title: "Contact",
    body: "For sales, support, or partnerships, contact us at support@precision-parts.com.",
  },
  "privacy": {
    title: "Privacy Policy",
    body: "We protect customer data with strict privacy controls, encrypted storage, and role-based access management.",
  },
  "terms": {
    title: "Terms of Service",
    body: "These terms govern the use of Precision Parts products and services by platform users.",
  },
  "security": {
    title: "Security",
    body: "Precision Parts uses secure authentication and operational safeguards to protect your account, inventory, and records.",
  },
  "documentation": {
    title: "Documentation",
    body: "Setup, onboarding, and workflow documentation for Admin, Staff, and Customer modules lives here.",
  },
  "api-reference": {
    title: "API Reference",
    body: "API endpoint details for integrations and automation will be listed here.",
  },
  "guides": {
    title: "Guides",
    body: "Step-by-step guides for account setup, booking flow, appointment tracking, and service history management.",
  },
  "status": {
    title: "System Status",
    body: "Live service health and uptime metrics are available on this status page.",
  },
  "integrations": {
    title: "Integrations",
    body: "Connect with service partners and notification channels to keep your bookings and updates in sync.",
  },
};

export default function InfoPage() {
  const { slug } = useParams();
  const page = PAGE_CONTENT[slug];

  if (!page) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="max-w-xl text-center">
          <h1 className="text-3xl font-headline font-extrabold mb-3">Page not found</h1>
          <p className="text-on-surface-variant mb-8">The page you are looking for does not exist.</p>
          <Link to="/">
            <Button variant="secondary">Go to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-6 py-20">
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-on-surface-variant hover:text-on-surface mb-8">
          <Icon name="arrow_back" className="text-base" />
          Back to Home
        </Link>
        <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-8 md:p-10">
          <h1 className="text-4xl font-headline font-extrabold tracking-tight mb-4">{page.title}</h1>
          <p className="text-on-surface-variant text-lg leading-relaxed">{page.body}</p>
        </div>
      </div>
    </div>
  );
}
