export default function TransactionFilters({ direction, onDirectionChange }) {
  const options = [
    { value: "ALL", label: "All" },
    { value: "SENT", label: "Sent" },
    { value: "RECEIVED", label: "Received" }
  ];

  return (
    <div className="flex gap-2 mb-4">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onDirectionChange(opt.value)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            direction === opt.value
              ? "bg-ink text-white"
              : "bg-white border border-border text-muted hover:text-ink"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
