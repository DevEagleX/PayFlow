import { Logo, IconCheck } from "./Icons.jsx";

const POINTS = ["Instant wallet-to-wallet transfers", "Every rupee tracked in your history", "Bank-grade password hashing and JWT sessions"];

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-gradient-to-br from-[#5B53F0] via-[#3A33C0] to-[#241E85] p-14 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/10" />
        <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-white/5" />
        <span className="relative inline-flex items-center gap-2.5 text-lg font-extrabold">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/20">₹</span> PayFlow
        </span>
        <div className="relative">
          <h2 className="max-w-md text-4xl font-extrabold leading-tight">Move money at the speed of a message.</h2>
          <ul className="mt-8 space-y-3">
            {POINTS.map((p) => (
              <li key={p} className="flex items-center gap-3 text-white/90">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-white/20"><IconCheck size={14} /></span> {p}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-white/60">© PayFlow</p>
      </section>

      <section className="grid place-items-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md animate-rise">
          <div className="mb-8 lg:hidden"><Logo /></div>
          <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm text-muted">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <div className="mt-6 text-center text-sm text-muted">{footer}</div>
        </div>
      </section>
    </div>
  );
}
