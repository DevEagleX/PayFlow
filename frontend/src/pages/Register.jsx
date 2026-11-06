import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import AuthLayout from "../components/AuthLayout.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { errMsg } from "../lib/format.js";

const Field = ({ id, label, error, children }) => (
  <div>
    <label htmlFor={id} className="label">{label}</label>
    {children}
    {error && <p className="mt-1 text-xs text-coral-dark">{error.message}</p>}
  </div>
);

export default function Register() {
  const { register: signUp, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const { register, handleSubmit, formState: { errors } } = useForm();

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const onSubmit = async (v) => {
    setError("");
    try {
      await signUp(v.fullName, v.email, v.phoneNumber, v.password);
      toast.success("Account created!");
      navigate("/dashboard", { replace: true });
    } catch (e) {
      setError(errMsg(e, "Registration failed"));
    }
  };

  return (
    <AuthLayout title="Create your account" subtitle="Your wallet is ready in under a minute." footer={<>Already have an account? <Link to="/login" className="font-semibold text-brand">Log in</Link></>}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {error && <div role="alert" className="rounded-xl bg-coral-soft px-4 py-3 text-sm font-medium text-coral-dark">{error}</div>}
        <Field id="fullName" label="Full name" error={errors.fullName}>
          <input id="fullName" className="input" autoComplete="name" {...register("fullName", { required: "Name is required" })} />
        </Field>
        <Field id="email" label="Email" error={errors.email}>
          <input id="email" type="email" className="input" autoComplete="email" {...register("email", { required: "Email is required" })} />
        </Field>
        <Field id="phone" label="Phone number" error={errors.phoneNumber}>
          <input id="phone" type="tel" className="input" autoComplete="tel" placeholder="9876543210" {...register("phoneNumber", { required: "Phone is required", pattern: { value: /^\+?\d{10,15}$/, message: "Enter 10–15 digits" } })} />
        </Field>
        <Field id="password" label="Password" error={errors.password}>
          <input id="password" type="password" className="input" autoComplete="new-password" {...register("password", { required: "Password is required", minLength: { value: 8, message: "At least 8 characters" } })} />
        </Field>
        <button className="btn-primary w-full py-3" disabled={loading}>{loading ? "Creating…" : "Create account"}</button>
      </form>
    </AuthLayout>
  );
}
