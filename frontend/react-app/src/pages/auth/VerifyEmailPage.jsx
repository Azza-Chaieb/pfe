import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { verifyOtp, resendOtp } from "../../services/authService";

const VerifyEmailPage = () => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(60);
  const navigate = useNavigate();
  const location = useLocation();
  const email = new URLSearchParams(location.search).get("email");

  useEffect(() => {
    if (!email) {
      navigate("/register");
    }

    let interval;
    if (timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [email, timer, navigate]);

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return false;

    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    // Focus next input
    if (element.nextSibling && element.value !== "") {
      element.nextSibling.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      if (otp[index] === "" && e.target.previousSibling) {
        e.target.previousSibling.focus();
      }
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      setError("Veuillez saisir le code complet à 6 chiffres.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await verifyOtp(email, otpCode);
      // Success! Auto-login
      localStorage.setItem("jwt", response.jwt);
      localStorage.setItem("user", JSON.stringify(response.user));
      setSuccess(true);

      const userType = (response.user?.user_type || "").toLowerCase();
      let targetPath = "/dashboard"; // default to student

      if (userType === "admin" || response.user?.username?.toLowerCase() === "admin") {
        targetPath = "/admin";
      } else if (userType === "formateur" || userType === "trainer") {
        targetPath = "/trainer/dashboard";
      } else if (userType === "professional" || userType === "pro") {
        targetPath = "/professional/dashboard";
      } else if (userType === "association") {
        targetPath = "/association/dashboard";
      } // else defaults to /dashboard for student

      setTimeout(() => {
        navigate(targetPath);
      }, 2000);
    } catch (err) {
      setError(
        err.response?.data?.error?.message || "Code invalide ou expiré.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await resendOtp(email);
      setTimer(60);
      setError("");
      alert("Un nouveau code a été envoyé !");
    } catch (err) {
      setError("Erreur lors du renvoi du code.");
    } finally {
      setResending(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-10 text-center border border-slate-100 transition-all">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8 text-3xl shadow-inner animate-in zoom-in duration-500">
            ✓
          </div>
          <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">
            Inscription Réussie !
          </h2>
          <p className="text-slate-500 font-medium leading-relaxed">
            Bienvenue chez SUNSPACE. Votre compte est maintenant activé. <br />
            Redirection vers votre tableau de bord...
          </p>
          <div className="mt-8 flex justify-center">
            <div className="w-8 h-8 border-4 border-green-600/20 border-t-green-600 rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-8 h-8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Vérifiez votre email
          </h1>
          <p className="text-slate-500">
            Nous avons envoyé un code de validation à <br />
            <span className="font-medium text-slate-900">{email}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="flex justify-between gap-2">
            {otp.map((data, index) => (
              <input
                key={index}
                type="text"
                maxLength="1"
                value={data}
                onChange={(e) => handleChange(e.target, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onFocus={(e) => e.target.select()}
                className="w-12 h-14 text-center text-2xl font-bold bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50 rounded-xl outline-none transition-all"
              />
            ))}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || otp.join("").length !== 6}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold py-4 rounded-2xl transition-all shadow-lg shadow-blue-200 active:scale-[0.98]"
          >
            {loading ? "Vérification..." : "Vérifier le compte"}
          </button>
        </form>

        <div className="mt-8 text-center pt-6 border-t border-slate-50">
          <p className="text-slate-500 text-sm mb-4">
            Vous n'avez pas reçu le code ?
          </p>
          <button
            onClick={handleResend}
            disabled={timer > 0 || resending}
            className="text-blue-600 font-semibold text-sm hover:text-blue-700 disabled:text-slate-400 transition-colors"
          >
            {resending
              ? "Envoi..."
              : timer > 0
                ? `Renvoyer le code dans ${timer}s`
                : "Renvoyer le code maintenant"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
