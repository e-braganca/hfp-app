import { RequestHistoryView } from "@/components/shared/RequestHistoryView";

export default function AdminRequestsPage() {
  // the admin sees the whole panel's decisions and can overturn any of them
  return <RequestHistoryView actor="Dr. Eleanor Hart (Admin)" />;
}
