import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";

/** The reservation page is the contract page. */
export default async function ReservationRedirect({ params, searchParams }: PageProps<"/[locale]/reservations/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const action = typeof sp.do === "string" ? `?do=${encodeURIComponent(sp.do)}` : "";
  redirect({ href: `/contracts/${id}${action}`, locale: await getLocale() });
}
