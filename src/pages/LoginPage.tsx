import React, { useState } from "react";
import { Flame, ArrowRight, ShieldCheck } from "lucide-react";

interface LoginPageProps {
  onLogin: (username: string) => void;
  id?: string;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLogin,
  id = "login-page-screen",
}) => {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError("Please enter your name or email to continue.");
      return;
    }
    setError("");
    onLogin(username.trim());
  };

  return (
    <div
      id={id}
      className="min-h-screen bg-slate-50 flex items-center justify-center p-4"
    >
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-slate-100 text-center space-y-6">
        {/* Logo & Welcome Header */}
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-3xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/20 mb-4">
            <Flame className="w-9 h-9 fill-emerald-100" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Calorify
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Personal Calorie & Macro Tracker
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Enter Name or Email
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (error) setError("");
              }}
              placeholder="e.g. Alex or alex@example.com"
              className={`w-full px-4 py-3 text-sm bg-slate-50 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                error ? "border-rose-400 bg-rose-50/20" : "border-slate-200"
              }`}
              autoFocus
            />
            {error && <p className="text-xs text-rose-600 mt-1.5">{error}</p>}
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3.5 px-6 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-2xl shadow-md shadow-emerald-600/10 transition-all active:scale-98"
          >
            <span>Continue to Calorify</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Private local session — No cloud login required</span>
        </div>
      </div>
    </div>
  );
};
