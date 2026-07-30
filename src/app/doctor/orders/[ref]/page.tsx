import { notFound } from "next/navigation";
import { OrderReview } from "@/components/doctor/OrderReview";
import { NEW_ORDERS, newOrderByRef } from "@/lib/doctor/data";

export function generateStaticParams() {
  return NEW_ORDERS.map((o) => ({ ref: o.ref }));
}

export default async function OrderPage({
  params,
}: {
  params: Promise<{ ref: string }>;
}) {
  const { ref } = await params;
  const order = newOrderByRef(ref);
  if (!order) notFound();
  return <OrderReview order={order} />;
}
