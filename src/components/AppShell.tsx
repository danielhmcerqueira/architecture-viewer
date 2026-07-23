import { Link, Outlet } from "@tanstack/react-router";
import { PixelMark } from "@/components/iebt";

export function AppShell() {
  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--iebt-paper)", color: "var(--iebt-ink)" }}
    >
      <header
        className="border-b-2"
        style={{
          background: "var(--iebt-ink)",
          borderColor: "var(--iebt-ink)",
          color: "var(--iebt-paper)",
        }}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-3">
          <Link
            to="/"
            className="flex items-center gap-3"
            aria-label="iebt innovation — arquiteto"
          >
            <span
              className="flex h-8 w-8 items-center justify-center"
              style={{ background: "var(--iebt-orange)" }}
            >
              <PixelMark />
            </span>
            <span className="flex items-baseline gap-2 font-mono text-[11px] uppercase tracking-[0.28em]">
              <span className="opacity-80">iebt innovation</span>
              <span aria-hidden className="h-px w-6 bg-current opacity-40" />
              <span>arquiteto</span>
            </span>
          </Link>

          <nav className="flex items-center gap-1">
            <NavLink to="/">Novo</NavLink>
            <NavLink to="/history">Histórico</NavLink>
          </nav>
        </div>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
}

function NavLink({
  to,
  children,
}: {
  to: "/" | "/history";
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className="rounded-none px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.24em] opacity-70 transition-opacity hover:opacity-100"
      activeOptions={{ exact: true }}
      activeProps={{
        className:
          "opacity-100 border-b-2",
        style: { borderColor: "var(--iebt-orange)" },
      }}
    >
      {children}
    </Link>
  );
}
