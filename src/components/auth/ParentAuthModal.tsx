import React, { useState, useEffect, useRef } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck, X } from 'lucide-react';
import { hasParentPassword, saveParentPassword, verifyParentPassword } from '../../services/auth';

interface ParentAuthModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  onClose: () => void;
}

export const ParentAuthModal: React.FC<ParentAuthModalProps> = ({
  isOpen,
  onSuccess,
  onClose,
}) => {
  const isSetupMode = !hasParentPassword();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setConfirmPassword('');
      setErrorMsg(null);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!password.trim()) {
      setErrorMsg('Bitte gib ein Passwort ein.');
      return;
    }

    setLoading(true);

    if (isSetupMode) {
      // First time password setup
      if (password.length < 3) {
        setErrorMsg('Das Passwort sollte mindestens 3 Zeichen lang sein.');
        setLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Die Passwörter stimmen nicht überein.');
        setLoading(false);
        return;
      }

      await saveParentPassword(password);
      setLoading(false);
      onSuccess();
    } else {
      // Verification mode
      const isValid = await verifyParentPassword(password);
      setLoading(false);

      if (isValid) {
        onSuccess();
      } else {
        setErrorMsg('Falsches Passwort. Bitte erneut versuchen.');
        setPassword('');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 sm:p-8 space-y-5 animate-pop">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon & Title */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
            {isSetupMode ? <ShieldCheck className="w-7 h-7" /> : <Lock className="w-7 h-7" />}
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800">
            {isSetupMode ? 'Eltern-Passwort festlegen' : 'Eltern-Bereich geschützt'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xs mx-auto">
            {isSetupMode
              ? 'Lege ein Passwort oder eine PIN fest, damit dein Sohn die Vokabeln nicht versehentlich verändert.'
              : 'Bitte gib dein Passwort ein, um die Vokabeln und Einstellungen zu öffnen.'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              {isSetupMode ? 'Neues Passwort / PIN' : 'Passwort / PIN'}
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder={isSetupMode ? 'z.B. 1234 oder ein Wort' : 'Dein Passwort eingeben'}
                className="w-full py-3 pl-4 pr-11 bg-slate-50 border border-slate-300 focus:border-indigo-600 focus:bg-white rounded-2xl text-base font-medium outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {isSetupMode && (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Passwort wiederholen
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => {
                  setConfirmPassword(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="Passwort zur Bestätigung wiederholen"
                className="w-full py-3 px-4 bg-slate-50 border border-slate-300 focus:border-indigo-600 focus:bg-white rounded-2xl text-base font-medium outline-none transition-all"
              />
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl text-center animate-shake">
              {errorMsg}
            </div>
          )}

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-sm transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl text-sm shadow-md shadow-indigo-200 transition-all disabled:opacity-50"
            >
              {loading ? 'Prüfe...' : isSetupMode ? 'Speichern & Öffnen' : 'Entsperren'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
