import { redirect } from "@/i18n/navigation";
import { getUser } from "@/lib/auth/session";

// The marketing home page comes in a later step; for now "/" opens the app.
export default async function Home({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  const user = await getUser();
  redirect({ href: user ? "/dashboard" : "/login", locale });
}
