"use client";

import * as React from "react";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import axios from "axios";
import { api } from "@/lib/api";
import { AuthModal } from "./AuthModal";

interface Msg91Config {
  widgetId: string;
  tokenAuth: string;
  exposeMethods?: boolean;
  identifier?: string;
  success?: (data: unknown) => void;
  failure?: (error: unknown) => void;
}

declare global {
  interface Window {
    initSendOTP?: (configuration: Msg91Config) => void;
    sendOtp?: (identifier: string, success: (data: unknown) => void, failure: (error: unknown) => void) => void;
    verifyOtp?: (otp: string, success: (data: unknown) => void, failure: (error: unknown) => void) => void;
  }
}

export type Restaurant = {
  id: number;
  name: string;
  location?: string;
};

export type User = {
  id: string;
  email: string;
  name: string;
  role: "admin" | "member";
  plan: "lite" | "plus" | "pro";
  restaurants?: Restaurant[];
};

type AuthCtx = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  isAuthModalOpen: boolean;
  authModalMode: "login" | "register";
  openAuthModal: (mode?: "login" | "register") => void;
  closeAuthModal: () => void;
  sendOtp: (phone: string) => Promise<void>;
  loginWithPhone: (phone: string, otp: string) => Promise<User>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register">("login");

  // Mount effect to restore session from local storage on client load
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");
      if (storedToken && storedUser) {
        try {
          api.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
          setUser(JSON.parse(storedUser));
        } catch (e) {
          console.error("Failed to parse user from localStorage:", e);
        }
      }
    }
    setLoading(false);
  }, []);

  // Inject MSG91 widget configuration and scripts
  useEffect(() => {
    if (typeof window === "undefined") return;

    const configuration: Msg91Config = {
      widgetId: "36666f6f5468393436313733",
      tokenAuth: "478315TIhnk9u8D0695a611eP1",
      exposeMethods: true,
      success: (data: unknown) => {
        console.log("MSG91 success response:", data);
      },
      failure: (error: unknown) => {
        console.error("MSG91 failure reason:", error);
      },
    };

    if (typeof window.initSendOTP === "function") {
      window.initSendOTP(configuration);
      return;
    }

    const urls = [
      "https://verify.msg91.com/otp-provider.js",
      "https://verify.phone91.com/otp-provider.js",
    ];
    let i = 0;

    function attempt() {
      const s = document.createElement("script");
      s.src = urls[i];
      s.async = true;
      s.onload = () => {
        if (typeof window.initSendOTP === "function") {
          window.initSendOTP(configuration);
        }
      };
      s.onerror = () => {
        i++;
        if (i < urls.length) {
          attempt();
        }
      };
      document.head.appendChild(s);
    }
    attempt();
  }, []);

  const openAuthModal = useCallback((mode?: "login" | "register") => {
    if (mode) setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // ignore
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
    }
    delete api.defaults.headers.common["Authorization"];
    setUser(null);
  };

  const fetchMe = useCallback(async () => {
    if (typeof window !== "undefined" && !localStorage.getItem("token")) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get("/auth/me");
      if (!data || !data.user) {
        setUser(null);
        setLoading(false);
        return;
      }
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      let profileData = null;
      if (token && data.user.id !== "demo-id") {
        try {
          const profileRes = await axios.request({
            method: "GET",
            url: `/v1/users/${data.user.id}`,
            params: {
              restaurant_info: "false",
              sales_info: "false",
            },
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          console.log(profileRes.data);
          if (profileRes.data && profileRes.data.success) {
            profileData = profileRes.data.data;
          }
        } catch (profileErr) {
          console.warn("Failed to fetch user profile details:", profileErr);
        }
      }

      const updatedUser: User = {
        ...data.user,
        restaurants: profileData?.restaurants || data.user.restaurants || [],
      };

      setUser(updatedUser);
      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }
    } catch (err) {
      console.warn("Failed to fetch current user session:", err);
      const errorObj = err as { response?: { status?: number } } | null;
      if (errorObj?.response?.status === 401 || errorObj?.response?.status === 403) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const login = async (email: string, password: string) => {
    const { data } = await api.post("/auth/login", { email, password });
    setUser(data.user);
    return data.user as User;
  };

  const register = async (name: string, email: string, password: string) => {
    const { data } = await api.post("/auth/register", { name, email, password });
    setUser(data.user);
    return data.user as User;
  };

  const sendOtp = (phone: string): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      if (typeof window === "undefined") {
        reject(new Error("Window is undefined"));
        return;
      }
      if (typeof window.sendOtp !== "function") {
        console.warn("MSG91 window.sendOtp is not available, falling back to mock mode.");
        api.post("/auth/otp/send", { phone })
          .then(() => resolve())
          .catch((err: unknown) => {
            console.warn("Backend mock OTP send failed, allowing mock bypass:", err);
            resolve();
          });
        return;
      }

      // MSG91 expects the number in international format without leading +
      // The modal enforces 10-digit Indian numbers, so we prepend '91'
      const formattedPhone = `91${phone}`;
      window.sendOtp(
        formattedPhone,
        (data: unknown) => {
          console.log("MSG91 sendOtp success:", data);
          resolve();
        },
        (error: unknown) => {
          console.error("MSG91 sendOtp failure:", error);
          const errorObj = error as { message?: string } | null;
          reject(new Error(errorObj?.message || "Failed to send OTP via MSG91. Please check the number and try again."));
        }
      );
    });
  };

  const loginWithPhone = (phone: string, otp: string): Promise<User> => {
    return new Promise<User>((resolve, reject) => {
      if (typeof window === "undefined") {
        reject(new Error("Window is undefined"));
        return;
      }
      if (typeof window.verifyOtp !== "function") {
        console.warn("MSG91 window.verifyOtp is not available, falling back to local verification.");
        if (otp === "1234" || otp === "2026") {
          const mockUser: User = {
            id: "demo-id",
            email: "demo@bizzdeck.com",
            name: "Demo Restaurant",
            role: "admin",
            plan: "pro",
            restaurants: [],
          };
          setUser(mockUser);
          if (typeof window !== "undefined") {
            localStorage.setItem("user", JSON.stringify(mockUser));
            localStorage.setItem("token", "mock-token");
          }
          resolve(mockUser);
        } else {
          reject(new Error("Incorrect OTP. Please try again."));
        }
        return;
      }

      window.verifyOtp(
        otp,
        async (data: unknown) => {
          console.log("MSG91 verifyOtp success:", data);
          try {
            const dataObj = data as { message?: string } | null;
            const verifiedToken = dataObj?.message || data;

            // Make the sign-in request to the backend with the MSG91 verified token
            const options = {
              method: "POST",
              url: "/v1/users/signin",
              headers: {
                "Content-Type": "application/json",
              },
              data: {
                phoneNumber: `+91${phone}`,
                token: typeof verifiedToken === "string" ? verifiedToken : JSON.stringify(verifiedToken),
                supportsRefresh: true,
              },
            };

            const response = await axios.request(options);
            const resData = response.data;

            if (resData.success && resData.data) {
              const uData = resData.data;
              const token = uData.token;
              const refreshToken = uData.refreshToken;

              // Save response token to localStorage for persistent session
              if (typeof window !== "undefined") {
                localStorage.setItem("token", token);
                if (refreshToken) {
                  localStorage.setItem("refreshToken", refreshToken);
                }
              }

              // Set default Authorization header for api client
              api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

              // Fetch full user details (including restaurants list) from profile endpoint
              let profileData = null;
              if (uData.id !== "demo-id") {
                try {
                  const profileRes = await axios.request({
                    method: "GET",
                    url: `/v1/users/${uData.id}`,
                    params: {
                      restaurant_info: "false",
                      sales_info: "false",
                    },
                    headers: {
                      Authorization: `Bearer ${token}`,
                    },
                  });
                  console.log(profileRes.data);
                  if (profileRes.data && profileRes.data.success) {
                    profileData = profileRes.data.data;
                  }
                } catch (profileErr) {
                  console.warn("Failed to fetch user profile details:", profileErr);
                }
              }

              // Map API user object to local User type expected by Next.js application
              const loggedUser: User = {
                id: String(uData.id),
                email: profileData?.email || uData.email || `${profileData?.name || uData.name || "user"}`.toLowerCase().replace(/\s+/g, "") + "@bizzdeck.com",
                name: profileData?.name || uData.name || "Restaurant Partner",
                role: profileData?.role || uData.role || "admin",
                plan: profileData?.plan || uData.plan || "pro",
                restaurants: profileData?.restaurants || uData.restaurants || [],
              };

              if (typeof window !== "undefined") {
                localStorage.setItem("user", JSON.stringify(loggedUser));
              }

              setUser(loggedUser);
              resolve(loggedUser);
            } else {
              reject(new Error("Sign-in failed. Please try again."));
            }
          } catch (err: unknown) {
            console.error("Sign-in API call failed:", err);
            const errObj = err as { response?: { data?: { message?: string } }; message?: string } | null;
            const errMsg = errObj?.response?.data?.message || errObj?.message || "Sign-in failed. Please try again.";
            reject(new Error(errMsg));
          }
        },
        (error: unknown) => {
          console.error("MSG91 verifyOtp failure:", error);
          const errorObj = error as { message?: string } | null;
          reject(new Error(errorObj?.message || "Incorrect OTP. Please try again."));
        }
      );
    });
  };

  return (
    <Ctx.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        sendOtp,
        loginWithPhone,
      }}
    >
      {children}
      <AuthModal />
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used inside AuthProvider");
  return c;
}
