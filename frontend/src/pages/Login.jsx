import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import AuthLayout from "../components/AuthLayout.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { errMsg } from "../lib/format.js";

export default function Login() {
  const { login, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState("");
  const { register, handleSubmit, formState: { errors } } = useForm();

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const onSubmit = async ({ email, password }) => {
    setError("");
    try {
      await login(email, password);
      toast.success("Welcome back!");
      navigate(location.state?.from?.pathname || "/dashboard", { replace: true });
    } catch (e) {
      setError(e?.response?.status === 401 ? "Incorrect email or password" : errMsg(e, "Login failed"));
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to manage your wallet." footer={<>New to PayTab? <Link to="/register" className="font-semibold text-brand">Create an account</Link></>}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {error && <div role="alert" className="rounded-xl bg-coral-soft px-4 py-3 text-sm font-medium text-coral-dark">{error}</div>}
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input id="email" type="email" autoComplete="email" className="input" placeholder="you@example.com" {...register("email", { required: "Email is required" })} />
          {errors.email && <p className="mt-1 text-xs text-coral-dark">{errors.email.message}</p>}
        </div>
        <div>
          <label htmlFor="password" className="label">Password</label>
          <input id="password" type="password" autoComplete="current-password" className="input" placeholder="••••••••" {...register("password", { required: "Password is required" })} />
          {errors.password && <p className="mt-1 text-xs text-coral-dark">{errors.password.message}</p>}
        </div>
        <button className="btn-primary w-full py-3" disabled={loading}>{loading ? "Logging in…" : "Log in"}</button>
      </form>
    </AuthLayout>
  );
}
