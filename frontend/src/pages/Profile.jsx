import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getProfile, updateProfile } from "../api/walletApi.js";
import Avatar from "../components/Avatar.jsx";
import { errMsg } from "../lib/format.js";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getProfile().then((p) => { setProfile(p); setName(p.fullName); }).catch((e) => toast.error(errMsg(e, "Could not load profile")));
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const p = await updateProfile(name.trim());
      setProfile(p);
      const stored = JSON.parse(localStorage.getItem("paytab_user") || "{}");
      localStorage.setItem("paytab_user", JSON.stringify({ ...stored, fullName: p.fullName }));
      toast.success("Profile updated");
    } catch (err) { toast.error(errMsg(err, "Update failed")); }
    finally { setSaving(false); }
  };

  if (!profile) return <div className="skeleton mx-auto h-72 max-w-xl" />;

  return (
    <div className="mx-auto max-w-xl animate-rise">
      <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Profile</h1>
      <div className="card mt-6 p-6 sm:p-7">
        <div className="flex items-center gap-4">
          <Avatar name={profile.fullName} size={64} />
          <div className="min-w-0">
            <p className="truncate text-lg font-bold">{profile.fullName}</p>
            <p className="truncate text-sm text-muted">{profile.email}</p>
          </div>
        </div>
        <form onSubmit={save} className="mt-7 space-y-4">
          <div><label htmlFor="name" className="label">Full name</label><input id="name" className="input" value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><label className="label">Email</label><input className="input opacity-70" value={profile.email} disabled /></div>
          {profile.phoneNumber && <div><label className="label">Phone</label><input className="input opacity-70" value={profile.phoneNumber} disabled /></div>}
          <button className="btn-primary" disabled={saving || !name.trim() || name.trim() === profile.fullName}>{saving ? "Saving…" : "Save changes"}</button>
        </form>
      </div>
    </div>
  );
}
