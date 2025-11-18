import Link from "next/link";

const QuickLinks = () => {
  const links = [
    {
      href: "/wealth-awakening/accounts",
      title: "Accounts & balances",
      body: "See each account, its currency, and how it fits in your Wealth map.",
    },
    {
      href: "/wealth-awakening/instruments",
      title: "Certificates & instruments",
      body: "Track your CDs and long-term deposits with their rules.",
    },
    {
      href: "/wealth-awakening/flows",
      title: "Monthly story & flows",
      body: "This month’s deposits, income, interest, expenses, and withdrawals.",
    },
    {
      href: "/wealth-awakening/levels",
      title: "Wealth levels",
      body: "Poor → Stable → Wealthy, defined using your real numbers.",
    },
    {
      href: "/wealth-awakening/projections",
      title: "Future projections",
      body: "Simple \"if you keep going like this\" views over months and years.",
    },
  ] as const;

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-100/90 p-4 shadow-lg shadow-primary/5 md:p-5">
      <header>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-base-content/80">
          Wall Street Drive Lanes
        </h2>
        <p className="mt-1 text-xs text-base-content/70">
          As v3.2 unfolds, these lanes become full views for your Wealth life.
        </p>
      </header>
      <ul className="mt-2 space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="group block rounded-xl border border-base-300/80 bg-base-200/60 px-3 py-2 text-xs transition hover:border-primary/60 hover:bg-base-100"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-base-content/90">
                  {link.title}
                </span>
                <span className="text-[11px] text-primary/80 group-hover:text-primary">
                  Open
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-base-content/70">
                {link.body}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default QuickLinks;
