import { notFound } from "next/navigation";
import { SimpleRepeatReview } from "@/components/doctor/SimpleRepeatReview";
import { SIMPLE_REPEATS, simpleRepeatByRef } from "@/lib/doctor/data";

export function generateStaticParams() {
  return SIMPLE_REPEATS.map((r) => ({ ref: r.ref }));
}

export default async function SimpleRepeatPage({
  params,
}: {
  params: Promise<{ ref: string }>;
}) {
  const { ref } = await params;
  const repeat = simpleRepeatByRef(ref);
  if (!repeat) notFound();
  return <SimpleRepeatReview repeat={repeat} />;
}
