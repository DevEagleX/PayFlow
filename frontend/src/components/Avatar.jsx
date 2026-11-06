import { initials } from "../lib/format.js";

const TINTS = [
  "bg-[#ECEBFB] text-[#2B2597]",
  "bg-[#FFF0EA] text-[#B9461A]",
  "bg-[#E4F4EE] text-[#17684A]",
  "bg-[#FDEBF3] text-[#A1285F]",
  "bg-[#E7F0FB] text-[#1D5AA8]"
];
const tintFor = (name = "") => TINTS[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % TINTS.length];

export default function Avatar({ name, size = 40, className = "" }) {
  return (
    <span
      className={`inline-grid shrink-0 place-items-center rounded-full font-bold ${tintFor(name)} ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}
