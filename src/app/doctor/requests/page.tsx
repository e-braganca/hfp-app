import { RequestHistoryView } from "@/components/shared/RequestHistoryView";

export default function DoctorRequestsPage() {
  // a prescriber sees the decisions they signed
  return <RequestHistoryView onlyDoctor="Dr. Eleanor Hart" />;
}
