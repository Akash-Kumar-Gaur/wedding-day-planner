import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileFrame } from "@/components/mobile-frame";
import { LEGAL_CONTACT_EMAIL, LEGAL_LAST_UPDATED } from "@/data/legal";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [{ title: "Terms of Service — ShadiPlan" }],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <MobileFrame>
      <article className="px-6 py-8 pb-12">
        <Link to="/login" className="text-sm font-medium text-primary hover:underline">
          ← Back to login
        </Link>

        <h1 className="mt-4 font-serif text-2xl text-foreground">Terms of Service</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: {LEGAL_LAST_UPDATED}</p>

        <div className="mt-6 space-y-6 text-sm leading-relaxed text-foreground">
          <p>
            By using ShadiPlan, operated by Red Evolve Technologies Private Limited (GSTIN:
            07AANCR2428R1ZN), you agree to these terms.
          </p>

          <section className="space-y-2">
            <h2 className="font-serif text-lg text-foreground">The service</h2>
            <p className="text-muted-foreground">
              ShadiPlan is a wedding planning tool provided as-is, to help you organize vendors,
              guests, budgets, and event timelines. It is a planning aid, not a guarantee of vendor
              performance, delivery, or event outcomes — we are not a party to any agreements you
              make with vendors.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-lg text-foreground">Your responsibilities</h2>
            <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
              <li>
                You&apos;re responsible for the accuracy of information you enter, including guest
                contact details.
              </li>
              <li>
                You&apos;re responsible for having appropriate permission to enter another
                person&apos;s contact information (guests) into the app for planning purposes.
              </li>
              <li>Don&apos;t use the service for any unlawful purpose.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-lg text-foreground">Account security</h2>
            <p className="text-muted-foreground">
              Keep your email address secure. You&apos;re responsible for activity under your account.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-lg text-foreground">Limitation of liability</h2>
            <p className="text-muted-foreground">
              ShadiPlan is provided without warranties of any kind. Red Evolve Technologies Private
              Limited is not liable for indirect, incidental, or consequential damages arising from
              use of the service, including but not limited to vendor disputes, missed deadlines, or
              data loss, to the maximum extent permitted by law.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-lg text-foreground">Changes</h2>
            <p className="text-muted-foreground">
              We may update these terms; continued use after changes means you accept the updated
              terms.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-lg text-foreground">Governing law</h2>
            <p className="text-muted-foreground">These terms are governed by the laws of India.</p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-lg text-foreground">Contact</h2>
            <p className="text-muted-foreground">
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
