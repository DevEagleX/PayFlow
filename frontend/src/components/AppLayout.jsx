import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import Avatar from "./Avatar.jsx";
import { IconHome, IconSend, IconList, IconUser, IconLogout, Logo } from "./Icons.jsx";

const NAV = [
  { to: "/dashboard", label: "Dashboard", Icon: IconHome },
  { to: "/transfer", label: "Send money", Icon: IconSend },
  { to: "/history", label: "Transactions", Icon: IconList },
  { to: "/profile", label: "Profile", Icon: IconUser }
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate("/login", { replace: true }); };

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen flex-col bg-[#EEECFA] px-5 py-7 lg:flex">
        <div className="px-2"><Logo /></div>
        <nav className="mt-10 flex flex-col gap-1.5" aria-label="Main">
          {NAV.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-[#6C63FF] to-[#3A33C0] text-white shadow-[0_10px_24px_-10px_rgba(58,51,192,0.7)]"
                    : "text-muted hover:bg-white/70 hover:text-ink"
                }`
              }
            >
              <Icon size={20} /> {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto rounded-2xl bg-white/70 p-3">
          <div className="flex items-center gap-3">
            <Avatar name={user?.fullName} size={38} />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{user?.fullName}</p>
              <p className="truncate text-xs text-muted">{user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-2 text-sm font-semibold text-muted transition-colors hover:bg-canvas hover:text-ink">
            <IconLogout size={16} /> Log out
          </button>
        </div>
      </aside>

      <div className="min-w-0">
        {/* Mobile top bar */}
        <header className="flex items-center justify-between px-4 pt-4 lg:hidden">
          <Logo size={32} />
          <button onClick={handleLogout} aria-label="Log out" className="grid h-10 w-10 place-items-center rounded-full bg-white text-muted shadow-card">
            <IconLogout size={18} />
          </button>
        </header>

        <main className="mx-auto w-full max-w-[1180px] px-4 pb-28 pt-5 sm:px-6 lg:px-10 lg:pb-12 lg:pt-9">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-3 bottom-3 z-30 flex justify-around rounded-3xl bg-white/95 p-1.5 shadow-pop backdrop-blur lg:hidden" aria-label="Main">
        {NAV.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-2 text-[11px] font-semibold ${isActive ? "bg-brand-soft text-brand" : "text-muted"}`
            }
          >
            <Icon size={20} /> {label.split(" ")[0]}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
