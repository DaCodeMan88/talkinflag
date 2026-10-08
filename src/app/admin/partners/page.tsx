import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/admin";
import { createAdminClient } from "@/lib/eval/admin-client";
import type { Partner } from "@/lib/partners";
import { PartnersEditor } from "./PartnersEditor";

export const metadata = { title: "Partners | Admin" };

export default async function AdminPartnersPage() {
  if (!(await getAdminUser())) redirect("/");

  const { data, error } = await createAdminClient()
    .from("partners")
    .select("id, name, url, position, is_live")
    .order("position")
    .order("name");
  const partners = (data ?? []) as Required<Partner>[];

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="border-l-4 border-[#FDDD58] pl-6 mb-10">
        <h1 className="font-display text-4xl uppercase text-white leading-none">Partners</h1>
        <p className="text-white/40 mt-2 text-sm">
          The &ldquo;Our Partners&rdquo; strip on the homepage. {partners.filter((p) => p.is_live).length} showing.
        </p>
      </div>
      {error ? (
        <p className="text-red-400 text-sm">Could not load partners: {error.message}</p>
      ) : (
        <PartnersEditor partners={partners} />
      )}
    </div>
  );
}
