import { RequestHistoryView } from "@/components/shared/RequestHistoryView";

export default function DoctorRequestsPage() {
  // a prescriber sees the decisions they signed, and can overturn their own
  return <RequestHistoryView onlyDoctor="Dr. Eleanor Hart" actor="Dr. Eleanor Hart" />;
}
