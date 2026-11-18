"use client";

import { useActionState } from "react";
import { grantJournalRoleAction, revokeJournalRoleAction } from "./actions";
import { initialActionState } from "./action-state";

interface JournalScope {
  organizationId: string;
  journalId: string;
}

export function GrantJournalRoleForm({ organizationId, journalId }: JournalScope) {
  const [state, action, pending] = useActionState(grantJournalRoleAction, initialActionState);

  return (
    <form action={action} className="rounded-xl border border-line bg-white p-5 sm:p-6">
      <h2 className="font-display text-2xl text-ink">Add a team member</h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        The person must have signed in once. Assign one journal role at a time.
      </p>
      <input name="organizationId" type="hidden" value={organizationId} />
      <input name="journalId" type="hidden" value={journalId} />
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-semibold text-ink" htmlFor="staff-email">Account email</label>
          <input
            autoComplete="email"
            className="mt-2 min-h-11 w-full rounded-lg border border-line bg-paper px-3 text-base text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
            id="staff-email"
            maxLength={254}
            name="email"
            required
            type="email"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-ink" htmlFor="staff-role">Journal role</label>
          <select
            className="mt-2 min-h-11 w-full rounded-lg border border-line bg-paper px-3 text-base text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
            defaultValue=""
            id="staff-role"
            name="role"
            required
          >
            <option disabled value="">Select a role</option>
            <option value="editor_in_chief">Editor in chief</option>
            <option value="managing_editor">Managing editor</option>
            <option value="editor">Editor</option>
            <option value="reviewer">Reviewer</option>
            <option value="production_editor">Production editor</option>
          </select>
        </div>
      </div>
      <div className="mt-4">
        <label className="block text-sm font-semibold text-ink" htmlFor="grant-reason">Reason for access</label>
        <textarea
          className="mt-2 w-full rounded-lg border border-line bg-paper px-3 py-2 text-base text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
          id="grant-reason"
          maxLength={500}
          minLength={10}
          name="reason"
          required
          rows={3}
        />
      </div>
      <button
        className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-forest px-5 text-sm font-semibold text-white hover:bg-forest-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Granting access..." : "Grant journal role"}
      </button>
      <p aria-live="polite" className={`mt-3 text-sm ${state.status === "error" ? "text-red-700" : "text-forest"}`} role="status">
        {state.message}
      </p>
    </form>
  );
}

export function RevokeJournalRoleForm({
  organizationId,
  journalId,
  membershipId,
}: JournalScope & { membershipId: string }) {
  const [state, action, pending] = useActionState(revokeJournalRoleAction, initialActionState);
  const reasonId = `revoke-reason-${membershipId}`;

  return (
    <form action={action} className="mt-4 border-t border-line pt-4">
      <input name="organizationId" type="hidden" value={organizationId} />
      <input name="journalId" type="hidden" value={journalId} />
      <input name="membershipId" type="hidden" value={membershipId} />
      <label className="block text-sm font-semibold text-ink" htmlFor={reasonId}>Reason for removing access</label>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-start">
        <input
          className="min-h-11 min-w-0 flex-1 rounded-lg border border-line bg-paper px-3 text-base text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
          id={reasonId}
          maxLength={500}
          minLength={10}
          name="reason"
          required
        />
        <button
          className="min-h-11 rounded-lg border border-red-700 px-4 text-sm font-semibold text-red-700 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 disabled:opacity-60"
          disabled={pending}
          type="submit"
        >
          {pending ? "Removing..." : "Revoke role"}
        </button>
      </div>
      <label className="mt-3 flex min-h-11 items-center gap-3 text-sm text-ink">
        <input className="size-4 accent-forest" name="confirm" required type="checkbox" value="confirm" />
        I confirm this role should be removed.
      </label>
      <p aria-live="polite" className={`mt-2 text-sm ${state.status === "error" ? "text-red-700" : "text-forest"}`} role="status">
        {state.message}
      </p>
    </form>
  );
}
