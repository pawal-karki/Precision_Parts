import { PageTransition } from "@/components/ui/motion";
import BookingsManagement from "@/components/shared/BookingsManagement";

export default function StaffBookings() {
  return (
    <PageTransition>
      <BookingsManagement role="Staff" />
    </PageTransition>
  );
}
