import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="card max-w-sm p-8 text-center">
        <p className="text-6xl font-extrabold text-brand">404</p>
        <p className="mt-2 text-sm text-muted">That page doesn't exist.</p>
        <Link to="/dashboard" className="btn-primary mt-6">Go to dashboard</Link>
      </div>
    </div>
  );
}
