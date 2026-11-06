const base = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };
const make = (d) => function Icon({ size = 20, ...p }) {
  return <svg {...base} width={size} height={size} {...p}>{d}</svg>;
};

export const IconHome = make(<><path d="M3 11.5 12 4l9 7.5" /><path d="M5 10v10h14V10" /></>);
export const IconSend = make(<><path d="M21 3 10 14" /><path d="m21 3-7 18-4-7-7-4z" /></>);
export const IconList = make(<><path d="M8 6h13M8 12h13M8 18h13" /><circle cx="3.5" cy="6" r=".8" /><circle cx="3.5" cy="12" r=".8" /><circle cx="3.5" cy="18" r=".8" /></>);
export const IconUser = make(<><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></>);
export const IconLogout = make(<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5M21 12H9" /></>);
export const IconArrowDown = make(<><path d="M12 5v14" /><path d="m19 12-7 7-7-7" /></>);
export const IconArrowUp = make(<><path d="M12 19V5" /><path d="m5 12 7-7 7 7" /></>);
export const IconSearch = make(<><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>);
export const IconCheck = make(<path d="m5 12.5 4.5 4.5L19 7.5" />);
export const IconWallet = make(<><path d="M20 7H5a2 2 0 0 1 0-4h13v4" /><path d="M3 5v14a2 2 0 0 0 2 2h15V7" /><circle cx="16.5" cy="14" r="1.2" /></>);
export const IconChevronRight = make(<path d="m9 6 6 6-6 6" />);
export const IconClose = make(<path d="M6 6l12 12M18 6 6 18" />);
export const IconTable = make(<><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 10h18M9 4v16" /></>);
export const IconChart = make(<><path d="M3 3v18h18" /><path d="m7 15 4-5 3 3 5-7" /></>);
export const IconEye = make(<><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>);
export const IconEyeOff = make(<><path d="M3 3l18 18" /><path d="M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.2M6.6 6.6C3.8 8.4 2 12 2 12s3.5 7 10 7c1.6 0 3-.4 4.3-1" /></>);

export function Logo({ size = 36 }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className="grid place-items-center rounded-xl bg-gradient-to-br from-[#6C63FF] to-[#3A33C0] text-white shadow-card" style={{ width: size, height: size }}>
        <IconWallet size={size * 0.55} />
      </span>
      <span className="text-lg font-extrabold tracking-tight text-ink">PayFlow</span>
    </span>
  );
}
