"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { X, ArrowRight, Smartphone } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { formatApiError } from "@/lib/api";
import { Toast } from "@/components/ui/Toast";

export function AuthModal() {
  const router = useRouter();
  const {
    user,
    isAuthModalOpen,
    closeAuthModal,
    sendOtp,
    loginWithPhone,
  } = useAuth();

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", ""]);
  const [busy, setBusy] = useState(false);

  // Unified toast states
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("error");

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Reset modal state when opened/closed
  useEffect(() => {
    if (isAuthModalOpen) {
      setStep("phone");
      setPhone("");
      setOtpDigits(["", "", "", ""]);
      setToastMessage("");
      setToastType("error");
    }
  }, [isAuthModalOpen]);

  // Handle auto-close and redirect on login
  useEffect(() => {
    if (user && isAuthModalOpen) {
      closeAuthModal();
      router.push("/dashboard");
    }
  }, [user, isAuthModalOpen, closeAuthModal, router]);

  // Auto focus first OTP input when transitioning to OTP step
  useEffect(() => {
    if (step === "otp" && isAuthModalOpen) {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 50);
    }
  }, [step, isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const showToast = (message: string, type: "success" | "error" = "error") => {
    setToastType(type);
    setToastMessage(message);
  };

  const handlePhoneChange = (val: string) => {
    // Only allow numbers, max 10 digits
    const cleaned = val.replace(/\D/g, "");
    if (cleaned.length <= 10) {
      setPhone(cleaned);
    }
  };

  const handleDigitChange = (value: string, index: number) => {
    const cleanValue = value.replace(/\D/g, "");
    const newDigits = [...otpDigits];
    
    newDigits[index] = cleanValue.substring(cleanValue.length - 1);
    setOtpDigits(newDigits);

    // If filled, move focus to the next input box
    if (newDigits[index] !== "" && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      if (otpDigits[index] === "" && index > 0) {
        const newDigits = [...otpDigits];
        newDigits[index - 1] = "";
        setOtpDigits(newDigits);
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (pastedText.length > 0) {
      const newDigits = [...otpDigits];
      for (let i = 0; i < 4; i++) {
        newDigits[i] = pastedText[i] || "";
      }
      setOtpDigits(newDigits);

      const targetIndex = Math.min(pastedText.length - 1, 3);
      inputRefs.current[targetIndex]?.focus();
    }
  };

  const submitPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    const isIndianMobile = /^[6-9]\d{9}$/.test(phone);
    if (!isIndianMobile) {
      showToast("Please enter a valid 10-digit Indian phone number.", "error");
      return;
    }

    setBusy(true);
    setToastMessage("");
    try {
      await sendOtp(phone);
      setStep("otp");
      showToast("OTP sent successfully!", "success");
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { detail?: unknown } };
        message?: string;
      } | null;
      const errMsg =
        (error?.response?.data?.detail ? formatApiError(error.response.data.detail) : null) ||
        error?.message ||
        "Failed to send OTP. Please try again.";
      showToast(errMsg, "error");
    } finally {
      setBusy(false);
    }
  };

  const submitOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otp = otpDigits.join("");
    if (otp.length !== 4) {
      showToast("Please enter a complete 4-digit OTP.", "error");
      return;
    }

    setBusy(true);
    setToastMessage("");
    try {
      await loginWithPhone(phone, otp);
      showToast("Logged in successfully!", "success");
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { detail?: unknown } };
        message?: string;
      } | null;
      const errMsg =
        (error?.response?.data?.detail ? formatApiError(error.response.data.detail) : null) ||
        error?.message ||
        "Incorrect OTP. Please try again.";
      showToast(errMsg, "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage("")} />
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 backdrop-blur-md transition-opacity duration-300"
        data-testid="auth-modal"
        onClick={closeAuthModal}
      >
        <div
          className="bd-glass relative w-full max-w-md overflow-hidden rounded-3xl p-8 sm:p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] text-white"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={closeAuthModal}
            data-testid="auth-close-btn"
            aria-label="Close modal"
            className="absolute right-5 top-5 text-white/50 hover:text-white transition duration-200 hover:scale-110"
          >
            <X size={18} />
          </button>

          <div>
            {/* Header */}
            <h2 className="font-display text-2xl font-black tracking-tight text-white sm:text-3xl">
              {step === "phone" ? "Verify your Phone" : "Verify OTP"}
            </h2>
            <p className="mt-2 text-sm text-white/70">
              {step === "phone"
                ? "Enter your 10-digit Indian mobile number to receive an OTP."
                : `Enter the 4-digit code sent to +91 ${phone.slice(0, 5)} ${phone.slice(5)}`}
            </p>

            {step === "phone" ? (
              /* PHONE STEP */
              <form onSubmit={submitPhone} className="mt-6 space-y-4">
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-sm font-semibold text-white/50 select-none">
                    +91
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="Enter Mobile Number"
                    required
                    autoFocus
                    data-testid="auth-phone-input"
                    className="w-full rounded-xl border border-white/10 bg-white/5 pl-14 pr-10 py-3.5 text-sm text-white outline-none placeholder-white/35 transition duration-200 focus:border-bd-mint focus:bg-white/[0.08]"
                  />
                  <Smartphone size={16} className="absolute right-4 text-white/40" />
                </div>

                <button
                  type="submit"
                  disabled={busy || phone.length !== 10}
                  data-testid="auth-phone-submit"
                  className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold bg-bd-mint text-bd-tealDeep transition duration-200 hover:bg-bd-mint disabled:opacity-40"
                >
                  {busy ? "Sending…" : "Get OTP"}
                  <ArrowRight size={15} aria-hidden />
                </button>
              </form>
            ) : (
              /* OTP STEP */
              <form onSubmit={submitOtp} className="mt-6 space-y-5">
                <div className="flex justify-center gap-3" onPaste={handlePaste}>
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        inputRefs.current[idx] = el;
                      }}
                      type="text"
                      pattern="\d*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(e.target.value, idx)}
                      onKeyDown={(e) => handleKeyDown(e, idx)}
                      required
                      autoFocus={idx === 0}
                      data-testid={`auth-otp-input-${idx}`}
                      className="w-14 h-14 rounded-2xl border border-white/10 bg-white/5 text-center font-display font-extrabold text-2xl text-white outline-none transition duration-200 focus:border-bd-mint focus:bg-white/[0.08]"
                    />
                  ))}
                </div>

                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("phone");
                      setOtpDigits(["", "", "", ""]);
                      setToastMessage("");
                    }}
                    className="text-xs font-semibold text-bd-mint hover:underline transition"
                  >
                    Change Phone Number
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={busy || otpDigits.some((d) => d === "")}
                  data-testid="auth-otp-submit"
                  className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold bg-bd-mint text-bd-tealDeep transition duration-200 hover:bg-bd-mint disabled:opacity-40"
                >
                  {busy ? "Verifying…" : "Verify OTP"}
                  <ArrowRight size={15} aria-hidden />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
