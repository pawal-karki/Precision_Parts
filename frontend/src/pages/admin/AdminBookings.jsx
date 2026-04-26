import { PageTransition } from "@/components/ui/motion";
import BookingsManagement from "@/components/shared/BookingsManagement";

export default function AdminBookings() {
  return (
    <PageTransition>
      <BookingsManagement role="Admin" />
    </PageTransition>
  );
}
