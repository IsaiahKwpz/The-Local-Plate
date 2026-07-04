import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getOpenReports,
  getAllRestaurantsForMerge,
  getPendingEdits,
  getPendingTags,
} from "@/lib/admin/queries";
import { ReportRow } from "@/components/admin/report-row";
import { MergeForm } from "@/components/admin/merge-form";
import { PendingEditRow } from "@/components/admin/pending-edit-row";
import { PendingTagRow } from "@/components/admin/pending-tag-row";

export default async function AdminReportsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-12">
        <p className="text-gray-600">Sign in as an admin to view this page.</p>
      </main>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-12">
        <p className="text-gray-600">You don&apos;t have access to this page.</p>
      </main>
    );
  }

  const admin = createAdminClient();
  const [reports, restaurants, pendingEdits, pendingTags] = await Promise.all([
    getOpenReports(admin),
    getAllRestaurantsForMerge(admin),
    getPendingEdits(admin),
    getPendingTags(admin),
  ]);

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-semibold">Reports</h1>
      {reports.length === 0 ? (
        <p className="mt-4 text-gray-500">No open reports.</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-4">
          {reports.map((report) => (
            <ReportRow key={report.id} report={report} />
          ))}
        </ul>
      )}

      <h2 className="mt-12 text-xl font-semibold">Pending edits</h2>
      {pendingEdits.length === 0 ? (
        <p className="mt-4 text-gray-500">No pending edits.</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-4">
          {pendingEdits.map((edit) => (
            <PendingEditRow key={edit.id} edit={edit} />
          ))}
        </ul>
      )}

      <h2 className="mt-12 text-xl font-semibold">Pending tags</h2>
      {pendingTags.length === 0 ? (
        <p className="mt-4 text-gray-500">No pending tags.</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-4">
          {pendingTags.map((tag) => (
            <PendingTagRow key={tag.id} tag={tag} />
          ))}
        </ul>
      )}

      <h2 className="mt-12 text-xl font-semibold">Merge duplicate restaurants</h2>
      <p className="mt-1 text-sm text-gray-500">
        For when the ingestion-time dedup check misses a match. Menu items and cuisine tags move to
        the kept restaurant; the other is deleted.
      </p>
      <div className="mt-4">
        <MergeForm restaurants={restaurants} />
      </div>
    </main>
  );
}
