export default function LoadingSpinner({ className = "" }) {
  return (
    <span role="status" aria-label="Loading" className={`inline-block h-5 w-5 animate-spin rounded-full border-2 border-brand/20 border-t-brand ${className}`} />
  );
}
