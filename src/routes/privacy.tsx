import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileFrame } from "@/components/mobile-frame";
import { DATA_DELETION_DAYS, LEGAL_CONTACT_EMAIL, LEGAL_LAST_UPDATED } from "@/data/legal";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [{ title: "Privacy Policy — ShadiPlan" }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <MobileFrame>
      <article className="px-6 py-8 pb-12">
        <Link to="/login" className="text-sm font-medium text-primary hover:underline">
          ← Back to login
        </Link>

        <h1 className="mt-4 font-serif text-2xl text-foreground">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: {LEGAL_LAST_UPDATED}</p>

        <div className="mt-6 space-y-6 text-sm leading-relaxed text-foreground">
          <p>
            ShadiPlan (&quot;we&quot;, &quot;us&quot;) is operated by Red Evolve Technologies Private
            Limited (GSTIN: 07AANCR2428R1ZN). This policy explains what data we collect through the
            ShadiPlan app and how we use it.
          </p>

          <section className="space-y-2">
            <h2 className="font-serif text-lg text-foreground">What we collect</h2>
            <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
              <li>
                <strong className="text-foreground">Account data</strong>: your email address (used
                for login via OTP).
              </li>
              <li>
                <strong className="text-foreground">Wedding planning data you enter</strong>:
                couple names, wedding date(s), location, vendor details, budget figures, and
                event/timeline information.
              </li>
              <li>
                <strong className="text-foreground">Guest data you enter about other people</strong>
                : names, phone numbers, email addresses, meal preferences, accommodation and
                transport needs. This data is provided by you, the account holder, on behalf of your
                guests for the purpose of planning your event.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-lg text-foreground">How we use it</h2>
            <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
              <li>
                To provide the core functionality of the app (tracking your wedding planning,
                generating invites, sending reminders).
              </li>
              <li>We do not sell your data or your guests&apos; data to third parties.</li>
              <li>We do not use your data for advertising.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-lg text-foreground">Third parties we use</h2>
            <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
              <li>
                <strong className="text-foreground">Supabase</strong> (database and authentication
                hosting)
              </li>
              <li>
                <strong className="text-foreground">Resend</strong> (email delivery for login
                verification codes, via custom SMTP configured in Supabase)
              </li>
            </ul>
            <p className="text-muted-foreground">
              Both process data only as needed to provide these services, not for their own
              independent purposes.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-lg text-foreground">Your rights</h2>
            <p className="text-muted-foreground">
              You can request deletion of your account and associated data at any time by contacting{" "}
              <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} className="text-primary hover:underline">
                {LEGAL_CONTACT_EMAIL}
              </a>
              . Guest data you&apos;ve entered is deleted along with your account.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-lg text-foreground">Data retention</h2>
            <p className="text-muted-foreground">
              Your data is retained as long as your account is active. If you delete your account,
              associated data is removed within {DATA_DELETION_DAYS} days.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-lg text-foreground">Contact</h2>
            <p className="text-muted-foreground">
              Questions about this policy:{" "}
              <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} className="text-primary hover:underline">
                {LEGAL_CONTACT_EMAIL}
              </a>
            </p>
          </section>
        </div>
      </article>
    </MobileFrame>
  );
}
