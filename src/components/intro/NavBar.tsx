import { Link } from "@tanstack/react-router";

export function NavBar() {
  return (
    <header className="sticky top-0 z-50 border-b border-taupe bg-ivory/[.86] backdrop-blur-md">
      <div className="mx-auto flex max-w-[1120px] items-center justify-between px-7 py-[18px]">
        <Link to="/intro" className="flex items-center gap-2 font-display text-2xl font-semibold italic">
          <span className="inline-block h-[7px] w-[7px] rounded-full bg-haldi" />
          ShadiPlan
        </Link>
        <nav className="hidden items-center gap-9 text-sm font-semibold md:flex">
          <a href="#features" className="opacity-70 hover:opacity-100">
            Features
          </a>
          <a href="#how" className="opacity-70 hover:opacity-100">
            How it works
          </a>
        </nav>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="rounded-full border border-taupe2 px-4 py-[9px] text-sm font-bold hover:border-ink"
          >
            Log in
          </Link>
          <Link
            to="/login"
            className="rounded-full bg-ink px-4 py-[9px] text-sm font-bold text-ivory transition-colors hover:bg-shaadi"
          >
            Start planning
          </Link>
        </div>
      </div>
    </header>
  );
}
