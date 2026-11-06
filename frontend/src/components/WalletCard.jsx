export default function WalletCard({ balance, currency, loading }) {
  return (
    <div className="bg-ink rounded-2xl p-6 text-white shadow-sm">
      <p className="text-sm text-white/70 mb-1">Wallet balance</p>
      {loading ? (
        <div className="h-9 w-32 bg-white/10 rounded animate-pulse" />
      ) : (
        <p className="font-display font-bold text-3xl">
          {currency === "INR" ? "₹" : currency}{" "}
          {Number(balance).toFixed(2)}
        </p>
      )}
      <div className="mt-4 h-px bg-white/10" />
      <p className="mt-4 text-xs text-white/50">PayFlow Wallet</p>
    </div>
  );
}
