import { Link } from "@tanstack/react-router";
import { LEGAL_CONTACT_EMAIL } from "@/data/legal";

export function Footer() {
  return (
    <footer className="px-7 pb-12">
      <div className="mx-auto flex max-w-[1120px] flex-wrap items-end justify-between gap-5 border-t border-taupe pt-7">
        <div>
          <Link
            to="/intro"
            className="flex items-center gap-2 font-display text-[19px] font-semibold italic"
          >
            <span className="inline-block h-[7px] w-[7px] rounded-full bg-haldi" />
            ShadiPlan
          </Link>
          <p className="mt-2 text-[13px] text-[#6b5a60]">
            Plan your wedding, your way.
            <br />A Red Evolve Technologies product.
          </p>
        </div>
        <div className="flex gap-5 text-[13px]">
          <a href="#features" className="opacity-70 hover:opacity-100">
            Features
          </a>
          <Link to="/privacy" className="opacity-70 hover:opacity-100">
            Privacy
          </Link>
          <Link to="/terms" className="opacity-70 hover:opacity-100">
            Terms
          </Link>
          <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} className="opacity-70 hover:opacity-100">
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}
