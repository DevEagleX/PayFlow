import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { searchRecipient, sendTransfer } from "../api/transferApi.js";
import { getBalance } from "../api/walletApi.js";
import Avatar from "../components/Avatar.jsx";
import ConfirmTransferDialog from "../components/ConfirmTransferDialog.jsx";
import { IconSearch, IconCheck } from "../components/Icons.jsx";
import { errMsg, formatINR } from "../lib/format.js";

export default function Transfer() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [identifier, setIdentifier] = useState(params.get("to") || "");
  const [amount, setAmount] = useState(params.get("amount") || "");
  const [note, setNote] = useState("");
  const [recipient, setRecipient] = useState(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [balance, setBalance] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const search = useCallback(async (value) => {
    const q = value.trim();
    if (!q) return;
    setSearching(true); setSearchError(""); setRecipient(null);
    try { setRecipient(await searchRecipient(q)); }
    catch (e) { setSearchError(e?.response?.status === 404 ? "No user found with that email or phone" : errMsg(e, "Search failed")); }
    finally { setSearching(false); }
  }, []);

  useEffect(() => {
    getBalance().then(setBalance).catch(() => {});
    if (params.get("to")) search(params.get("to"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = Number(amount);
  const amountError = amount && (!(value > 0) ? "Enter an amount greater than 0" : balance && value > Number(balance.balance) ? "Amount exceeds your balance" : "");
  const canContinue = recipient && value > 0 && !amountError;

  const confirm = async () => {
    setSubmitting(true);
    try {
      const result = await sendTransfer(identifier.trim(), value, note.trim() || undefined);
      navigate("/transfer/success", { replace: true, state: { result } });
    } catch (e) {
      setConfirming(false);
      toast.error(e?.response?.status === 422 || /insufficient/i.test(e?.response?.data?.message || "") ? "Insufficient balance" : errMsg(e, "Transfer failed"));
    } finally { setSubmitting(false); }
  };

  return (
    <div className="mx-auto max-w-xl animate-rise">
      <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Send money</h1>
      <p className="mt-1 text-sm text-muted">Available balance: <b className="text-ink">{balance ? formatINR(balance.balance) : "…"}</b></p>

      <div className="card mt-6 space-y-5 p-5 sm:p-7">
        <div>
          <label htmlFor="to" className="label">Recipient</label>
          <form onSubmit={(e) => { e.preventDefault(); search(identifier); }} className="flex gap-2">
            <input id="to" className="input" placeholder="Email or phone number" value={identifier} onChange={(e) => { setIdentifier(e.target.value); setRecipient(null); setSearchError(""); }} />
            <button className="btn-soft shrink-0" disabled={searching || !identifier.trim()}><IconSearch size={16} />{searching ? "…" : "Find"}</button>
          </form>
          {searchError && <p role="alert" className="mt-2 text-sm text-coral-dark">{searchError}</p>}
          {recipient && (
            <div className="mt-3 flex items-center gap-3 rounded-2xl bg-brand-soft p-3">
              <Avatar name={recipient.fullName} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{recipient.fullName}</p>
                <p className="truncate text-xs text-muted">{recipient.maskedIdentifier}</p>
              </div>
              <span className="grid h-6 w-6 place-items-center rounded-full bg-brand text-white"><IconCheck size={14} /></span>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="amount" className="label">Amount</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-muted">₹</span>
            <input id="amount" inputMode="decimal" className="input pl-9 text-lg font-bold" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))} />
          </div>
          {amountError && <p className="mt-1 text-xs text-coral-dark">{amountError}</p>}
        </div>

        <div>
          <label htmlFor="note" className="label">Note (optional)</label>
          <input id="note" className="input" maxLength={100} placeholder="Dinner, rent, thanks…" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>

        <button className="btn-primary w-full py-3" disabled={!canContinue} onClick={() => setConfirming(true)}>Review transfer</button>
      </div>

      {confirming && <ConfirmTransferDialog recipient={recipient} amount={value} note={note.trim()} submitting={submitting} onConfirm={confirm} onCancel={() => setConfirming(false)} />}
    </div>
  );
}
