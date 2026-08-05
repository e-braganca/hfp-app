import { redirect } from "next/navigation";

/** The unified patient record is an admin surface now — a prescriber works
 *  from the queue and sees a patient through the case they claimed. */
export default function DoctorPatientsRedirect() {
  redirect("/doctor/queue");
}
