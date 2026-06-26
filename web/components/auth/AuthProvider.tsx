"use client";

import * as React from "react";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from "axios";
import { getApiErrorMessage } from "@/lib/api";
import { AuthModal } from "./AuthModal";

declare global {
  interface Window {
    initSendOTP?: (configuration: Msg91Config) => void;
    sendOtp?: (identifier: string, success: (data: unknown) => void, failure: (error: unknown) => void) => void;
    verifyOtp?: (otp: string, success: (data: unknown) => void, failure: (error: unknown) => void) => void;
    __bizzdeckMsg91ErrorHandlersInstalled?: boolean;
  }
}

const runtimeState = globalThis as typeof globalThis & {
  __bizzdeckAxiosInterceptors?: {
    request: number;
    response: number;
  };
};

// Suppress unhandled third-party script rejections (e.g. MSG91 OTP Axios errors) from crashing the dev layout
if (typeof window !== "undefined" && !window.__bizzdeckMsg91ErrorHandlersInstalled) {
  window.__bizzdeckMsg91ErrorHandlersInstalled = true;
  const isMsg91Error = (error: unknown): boolean => {
    if (!error || typeof error !== "object") return false;
    const err = error as {
      message?: string;
      stack?: string;
      name?: string;
      config?: { url?: string };
    };
    const msg = err.message || "";
    const stack = err.stack || "";
    const name = err.name || "";
    const url = err.config?.url || "";
    return (
      url.includes("msg91.com") ||
      url.includes("phone91.com") ||
      msg.includes("msg91.com") ||
      msg.includes("phone91.com") ||
      stack.includes("msg91.com") ||
      stack.includes("phone91.com") ||
      stack.includes("otp-provider.js") ||
      (name === "AxiosError" && (url.includes("verify") || stack.includes("otp-provider")))
    );
  };

  window.addEventListener("unhandledrejection", (event) => {
    if (isMsg91Error(event.reason)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      console.warn("Suppressed external MSG91 unhandled Axios rejection:", event.reason);
    }
  }, { capture: true });

  window.addEventListener("error", (event) => {
    if (
      (event.filename && (event.filename.includes("msg91.com") || event.filename.includes("phone91.com"))) ||
      (event.message && (event.message.includes("msg91.com") || event.message.includes("phone91.com"))) ||
      isMsg91Error(event.error)
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
      console.warn("Suppressed external MSG91 script error:", event.message);
    }
  }, { capture: true });
}

if (!runtimeState.__bizzdeckAxiosInterceptors) {
  // Interceptor to automatically attach Bearer token to /v1/ requests.
  const request = axios.interceptors.request.use(
    (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (token && config.url?.startsWith("/v1/") && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error: AxiosError): Promise<never> => {
      return Promise.reject(error);
    }
  );

  // Interceptor to handle expired access tokens.
  const response = axios.interceptors.response.use(
    (res: AxiosResponse): AxiosResponse => res,
    async (error: AxiosError): Promise<unknown> => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

      if (
        error.response?.status === 401 &&
        originalRequest &&
        !originalRequest._retry &&
        !originalRequest.url?.includes("/v1/users/refresh")
      ) {
        originalRequest._retry = true;

        const refreshToken = typeof window !== "undefined" ? localStorage.getItem("refreshToken") : null;
        if (refreshToken) {
          try {
            const refreshResponse = await axios.post("/v1/users/refresh", { refreshToken }, {
              timeout: 6000,
              headers: {
                "Content-Type": "application/json",
              },
            });

            if (refreshResponse.data && refreshResponse.data.success && refreshResponse.data.data) {
              const newToken = refreshResponse.data.data.token;
              const newRefreshToken = refreshResponse.data.data.refreshToken;

              if (typeof window !== "undefined") {
                localStorage.setItem("token", newToken);
                localStorage.setItem("refreshToken", newRefreshToken);
                logApiToken(newToken, "refresh");
              }

              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return axios(originalRequest);
            }
          } catch (refreshError) {
            console.error("Token refresh failed:", getApiErrorMessage(refreshError, "Token refresh failed."));
            if (typeof window !== "undefined") {
              localStorage.removeItem("token");
              localStorage.removeItem("refreshToken");
              localStorage.removeItem("user");
              window.location.assign("/");
            }
          }
        }
      }

      return Promise.reject(error);
    }
  );

  runtimeState.__bizzdeckAxiosInterceptors = { request, response };
}

interface Msg91Config {
  widgetId: string;
  tokenAuth: string;
  exposeMethods?: boolean;
  identifier?: string;
  success?: (data: unknown) => void;
  failure?: (error: unknown) => void;
}

function logApiToken(token: string | null | undefined, source: string) {
  if (!token) return;
  console.log(`[BizzDeck API Token][${source}]`, token);
}

const AUTH_REQUEST_TIMEOUT_MS = 6000;
const OTP_SEND_TIMEOUT_MS = 8000;
const OTP_VERIFY_TIMEOUT_MS = 8000;

export type Restaurant = {
  id: number;
  name: string;
  location?: string;
  address?: string;
  phone?: string;
  buildingAddress?: string;
  pincode?: string;
  state?: string;
  locality?: string;
  zone?: string;
  zoneId?: number;
  localityId?: number;
  zomatoId?: string;
  swiggyId?: string;
  fssaiLicense?: string;
  fssaiExpiry?: string;
  gstNumber?: string;
  dineInMargin?: number;
  swiggyHike?: number;
  zomatoHike?: number;
  swiggyAds?: number;
  zomatoAds?: number;
  swiggyDiscounts?: number;
  zomatoDiscounts?: number;
  swiggyCommission?: number;
  zomatoCommission?: number;
  plan?: string;
  meetingLink?: string;
};

export interface ApiRestaurant {
  id: number;
  name: string;
  location?: string;
  phoneNumber?: string;
  phone?: string;
  address?: string;
  pincode?: string;
  locality?: {
    id: number;
    name: string;
    pincode: string;
    districtId?: number;
    state?: string;
    createdAt?: string;
  };
  zone?: {
    id: number;
    name: string;
    city?: string;
    districtId?: number;
    state?: string;
    createdAt?: string;
  };
  zoneId?: number;
  localityId?: number;
  zomatoId?: string;
  swiggyId?: string;
  fssaiLicense?: string;
  fssaiExpiryDate?: string;
  averageMarginPercentage?: number;
  priceHikePercentageSwiggy?: number;
  priceHikePercentageZomato?: number;
  adsPercentageSwiggy?: number;
  adsPercentageZomato?: number;
  discountPercentageSwiggy?: number;
  discountPercentageZomato?: number;
  expectedCommissionPercentageSwiggy?: number;
  expectedCommissionPercentageZomato?: number;
  gstNumber?: string;
  plan?: string;
  meetingLink?: string;
}

function mapResponseToRestaurant(apiData: ApiRestaurant): Restaurant {
  if (!apiData) return {} as Restaurant;
  return {
    id: apiData.id,
    name: apiData.name,
    location: apiData.location || apiData.locality?.name || "",
    address: apiData.address || "",
    phone: apiData.phone || apiData.phoneNumber || "",
    buildingAddress: apiData.address?.split(",")?.[0] || "",
    pincode: apiData.pincode || "",
    state: apiData.locality?.state || apiData.zone?.state || "",
    locality: apiData.locality?.name || "",
    zone: apiData.zone?.name || "",
    zoneId: apiData.zoneId,
    localityId: apiData.localityId,
    zomatoId: apiData.zomatoId || undefined,
    swiggyId: apiData.swiggyId || undefined,
    fssaiLicense: apiData.fssaiLicense || undefined,
    fssaiExpiry: apiData.fssaiExpiryDate || undefined,
    gstNumber: apiData.gstNumber || undefined,
    dineInMargin: apiData.averageMarginPercentage,
    swiggyHike: apiData.priceHikePercentageSwiggy,
    zomatoHike: apiData.priceHikePercentageZomato,
    swiggyAds: apiData.adsPercentageSwiggy,
    zomatoAds: apiData.adsPercentageZomato,
    swiggyDiscounts: apiData.discountPercentageSwiggy,
    zomatoDiscounts: apiData.discountPercentageZomato,
    swiggyCommission: apiData.expectedCommissionPercentageSwiggy,
    zomatoCommission: apiData.expectedCommissionPercentageZomato,
    plan: apiData.plan,
    meetingLink: apiData.meetingLink,
  };
}


export type User = {
  id: string;
  email: string;
  name: string;
  role: "customer";
  plan: "lite" | "plus" | "pro";
  restaurants?: Restaurant[];
  phone?: string;
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
  addRestaurant: (restData: Omit<Restaurant, "id">) => Promise<Restaurant>;
  updateUser: (updatedFields: Partial<User>) => void;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register">("login");

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

  const logout = useCallback(async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
    }
    delete axios.defaults.headers.common["Authorization"];
    setUser(null);
  }, []);

  const fetchMe = useCallback(async () => {
    if (typeof window === "undefined") {
      setLoading(false);
      return;
    }

    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token || !storedUser) {
      setLoading(false);
      return;
    }

    let localUser: User;
    try {
      localUser = JSON.parse(storedUser) as User;
    } catch (err) {
      console.warn("Failed to parse stored user session:", err);
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      setUser(null);
      setLoading(false);
      return;
    }

    logApiToken(token, "localStorage");
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    setUser(localUser);
    setLoading(false);

    try {
      let profileData = null;
      if (localUser.id !== "demo-id") {
        try {
          const profileRes = await axios.request({
            method: "GET",
            url: `/v1/users/${localUser.id}`,
            timeout: AUTH_REQUEST_TIMEOUT_MS,
            params: {
              restaurant_info: "false",
              sales_info: "false",
            },
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (profileRes.data && profileRes.data.success) {
            profileData = profileRes.data.data;
          }
        } catch (profileErr) {
          console.warn("Profile restore skipped:", getApiErrorMessage(profileErr, "Profile request timed out."));
        }
      }

      let localRests: Restaurant[] = [];
      try {
        const stored = localStorage.getItem(`local_restaurants_${localUser.id}`);
        if (stored) {
          localRests = JSON.parse(stored);
        }
      } catch {
        // ignore
      }
      const apiRests = profileData?.restaurants || localUser.restaurants || [];
      const normalizedApiRests = apiRests.map((r: ApiRestaurant) => mapResponseToRestaurant(r));
      const mergedRests = [...normalizedApiRests];
      localRests.forEach((lr) => {
        if (!mergedRests.some((r) => r.id === lr.id)) {
          mergedRests.push(lr);
        }
      });

      const updatedUser: User = {
        ...localUser,
        ...profileData,
        restaurants: mergedRests,
        phone: profileData?.phone || profileData?.phoneNumber || localUser.phone,
      };

      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
    } catch (err) {
      console.warn("Failed to restore current user session:", getApiErrorMessage(err, "Session restore failed."));
      const errorObj = err as { response?: { status?: number } } | null;
      if (errorObj?.response?.status === 401 || errorObj?.response?.status === 403 || errorObj?.response?.status === 404) {
        logout();
      }
    }
  }, [logout]);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const login = async (email: string, password: string) => {
    void email;
    void password;
    throw new Error("Email login is not available. Please use phone OTP login.");
  };

  const register = async (name: string, email: string, password: string) => {
    void name;
    void email;
    void password;
    throw new Error("Email registration is not available. Please use phone OTP login.");
  };

  const sendOtp = (phone: string): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      if (typeof window === "undefined") {
        reject(new Error("Window is undefined"));
        return;
      }
      if (typeof window.sendOtp !== "function") {
        console.warn("MSG91 window.sendOtp is not available, falling back to mock mode.");
        resolve();
        return;
      }

      // MSG91 expects the number in international format without leading +
      // The modal enforces 10-digit Indian numbers, so we prepend '91'
      const formattedPhone = `91${phone}`;
      let settled = false;
      const finish = (callback: () => void) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeoutId);
        callback();
      };
      const timeoutId = window.setTimeout(() => {
        finish(() => reject(new Error("OTP service is taking too long. Please try again.")));
      }, OTP_SEND_TIMEOUT_MS);

      window.sendOtp(
        formattedPhone,
        (data: unknown) => {
          console.log("MSG91 sendOtp success:", data);
          finish(() => resolve());
        },
        (error: unknown) => {
          console.error("MSG91 sendOtp failure:", error);
          const errorObj = error as { message?: string } | null;
          finish(() => reject(new Error(errorObj?.message || "Failed to send OTP via MSG91. Please check the number and try again.")));
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
            role: "customer",
            plan: "pro",
            restaurants: [],
            phone: `+91 ${phone}`,
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

      let settled = false;
      const finish = (callback: () => void) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeoutId);
        callback();
      };
      const timeoutId = window.setTimeout(() => {
        finish(() => reject(new Error("OTP verification is taking too long. Please try again.")));
      }, OTP_VERIFY_TIMEOUT_MS);

      window.verifyOtp(
        otp,
        async (data: unknown) => {
          // Log MSG91 status without logging the actual raw verification token
          console.log("MSG91 verifyOtp status: success");
          try {
            const dataObj = data as { message?: string } | null;
            const verifiedToken = dataObj?.message || data;

            // Make the sign-in request to the backend with the MSG91 verified token
            const options = {
              method: "POST",
              url: "/v1/users/signin",
              timeout: OTP_VERIFY_TIMEOUT_MS,
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
                logApiToken(token, "signin");
                if (refreshToken) {
                  localStorage.setItem("refreshToken", refreshToken);
                }
              }

              // Set default Authorization header for api client
              axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

              let localRests: Restaurant[] = [];
              if (typeof window !== "undefined") {
                try {
                  const stored = localStorage.getItem(`local_restaurants_${uData.id}`);
                  if (stored) {
                    localRests = JSON.parse(stored);
                  }
                } catch {
                  // ignore
                }
              }
              const apiRests = uData.restaurants || [];
              const normalizedApiRests = apiRests.map((r: ApiRestaurant) => mapResponseToRestaurant(r));
              const mergedRests = [...normalizedApiRests];
              localRests.forEach((lr) => {
                if (!mergedRests.some((r) => r.id === lr.id)) {
                  mergedRests.push(lr);
                }
              });

              // Map API user object to local User type expected by Next.js application
              const loggedUser: User = {
                id: String(uData.id),
                email: uData.email || `${uData.name || "user"}`.toLowerCase().replace(/\s+/g, "") + "@bizzdeck.com",
                name: uData.name || "Restaurant Partner",
                role: uData.role || "customer",
                plan: uData.plan || "pro",
                restaurants: mergedRests,
                phone: uData.phone || uData.phoneNumber || `+91 ${phone}`,
              };

              if (typeof window !== "undefined") {
                localStorage.setItem("user", JSON.stringify(loggedUser));
              }

              setUser(loggedUser);
              finish(() => resolve(loggedUser));

              if (uData.id !== "demo-id") {
                axios.request({
                  method: "GET",
                  url: `/v1/users/${uData.id}`,
                  timeout: 6000,
                  params: {
                    restaurant_info: "false",
                    sales_info: "false",
                  },
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }).then((profileRes) => {
                  if (!profileRes.data?.success || !profileRes.data?.data) return;
                  const profileData = profileRes.data.data;
                  const profileRests = (profileData.restaurants || []).map((r: ApiRestaurant) => mapResponseToRestaurant(r));
                  const nextUser: User = {
                    ...loggedUser,
                    ...profileData,
                    id: String(profileData.id || loggedUser.id),
                    role: profileData.role || loggedUser.role,
                    plan: profileData.plan || loggedUser.plan,
                    restaurants: profileRests.length > 0 ? profileRests : loggedUser.restaurants,
                    phone: profileData.phone || profileData.phoneNumber || loggedUser.phone,
                  };
                  setUser(nextUser);
                  localStorage.setItem("user", JSON.stringify(nextUser));
                }).catch((profileErr) => {
                  console.warn("Profile refresh after login skipped:", getApiErrorMessage(profileErr, "Profile request timed out."));
                });
              }
            } else {
              finish(() => reject(new Error("Sign-in failed. Please try again.")));
            }
          } catch (err: unknown) {
            console.error("Sign-in API call failed:", getApiErrorMessage(err, "Sign-in failed. Please try again."));
            finish(() => reject(new Error(getApiErrorMessage(err, "Sign-in failed. Please try again."))));
          }
        },
        (error: unknown) => {
          console.error("MSG91 verifyOtp failure:", error);
          const errorObj = error as { message?: string } | null;
          finish(() => reject(new Error(errorObj?.message || "Incorrect OTP. Please try again.")));
        }
      );
    });
  };

  const addRestaurant = useCallback(async (restData: Omit<Restaurant, "id">) => {
    if (!user) throw new Error("No logged in user");

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      // Mock fallback if user is in guest/demo mode
      const newRest: Restaurant = {
        id: Date.now(),
        ...restData,
      };
      let localRests: Restaurant[] = [];
      if (typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem(`local_restaurants_${user.id}`);
          if (stored) {
            localRests = JSON.parse(stored);
          }
        } catch (e) {
          console.error("Failed to parse local restaurants:", e);
        }
        localRests.push(newRest);
        localStorage.setItem(`local_restaurants_${user.id}`, JSON.stringify(localRests));
      }
      const updatedUser: User = {
        ...user,
        restaurants: [...(user.restaurants || []), newRest],
      };
      setUser(updatedUser);
      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }
      return newRest;
    }

    // Convert restData fields to backend API specifications, including only the available keys
    const payload: Record<string, string | number> = {
      userId: parseInt(user.id) || 1,
      name: restData.name,
      location: restData.locality || restData.location || "",
    };

    if (restData.phone) {
      payload.phoneNumber = restData.phone.startsWith("+") ? restData.phone : `+91${restData.phone}`;
    }
    if (restData.address) {
      payload.address = restData.address;
    }
    if (restData.pincode) {
      payload.pincode = restData.pincode;
    }
    if (restData.zoneId !== undefined && restData.zoneId !== null) {
      payload.zoneId = restData.zoneId;
    }
    if (restData.localityId !== undefined && restData.localityId !== null) {
      payload.localityId = restData.localityId;
    }
    if (restData.zomatoId?.trim()) {
      payload.zomatoId = restData.zomatoId.trim();
    }
    if (restData.swiggyId?.trim()) {
      payload.swiggyId = restData.swiggyId.trim();
    }
    if (restData.fssaiLicense?.trim()) {
      payload.fssaiLicense = restData.fssaiLicense.trim();
    }
    if (restData.fssaiExpiry?.trim()) {
      payload.fssaiExpiryDate = restData.fssaiExpiry.trim();
    }
    if (restData.gstNumber?.trim()) {
      payload.gstNumber = restData.gstNumber.trim().toUpperCase();
    }
    if (restData.dineInMargin !== undefined && restData.dineInMargin !== null && String(restData.dineInMargin) !== "") {
      payload.averageMarginPercentage = parseFloat(String(restData.dineInMargin));
    }
    if (restData.swiggyHike !== undefined && restData.swiggyHike !== null && String(restData.swiggyHike) !== "") {
      payload.priceHikePercentageSwiggy = parseFloat(String(restData.swiggyHike));
    }
    if (restData.zomatoHike !== undefined && restData.zomatoHike !== null && String(restData.zomatoHike) !== "") {
      payload.priceHikePercentageZomato = parseFloat(String(restData.zomatoHike));
    }
    if (restData.swiggyAds !== undefined && restData.swiggyAds !== null && String(restData.swiggyAds) !== "") {
      payload.adsPercentageSwiggy = parseFloat(String(restData.swiggyAds));
    }
    if (restData.zomatoAds !== undefined && restData.zomatoAds !== null && String(restData.zomatoAds) !== "") {
      payload.adsPercentageZomato = parseFloat(String(restData.zomatoAds));
    }
    if (restData.swiggyDiscounts !== undefined && restData.swiggyDiscounts !== null && String(restData.swiggyDiscounts) !== "") {
      payload.discountPercentageSwiggy = parseFloat(String(restData.swiggyDiscounts));
    }
    if (restData.zomatoDiscounts !== undefined && restData.zomatoDiscounts !== null && String(restData.zomatoDiscounts) !== "") {
      payload.discountPercentageZomato = parseFloat(String(restData.zomatoDiscounts));
    }
    if (restData.swiggyCommission !== undefined && restData.swiggyCommission !== null && String(restData.swiggyCommission) !== "") {
      payload.expectedCommissionPercentageSwiggy = parseFloat(String(restData.swiggyCommission));
    }
    if (restData.zomatoCommission !== undefined && restData.zomatoCommission !== null && String(restData.zomatoCommission) !== "") {
      payload.expectedCommissionPercentageZomato = parseFloat(String(restData.zomatoCommission));
    }

    try {
      const response = await axios.post("/v1/restaurants", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.data && response.data.success && response.data.data) {
        const createdRest = mapResponseToRestaurant(response.data.data);

        const updatedUser: User = {
          ...user,
          restaurants: [...(user.restaurants || []), createdRest],
        };
        setUser(updatedUser);
        if (typeof window !== "undefined") {
          localStorage.setItem("user", JSON.stringify(updatedUser));
        }
        return createdRest;
      } else {
        throw new Error(response.data?.message || "Failed to create restaurant");
      }
    } catch (err: unknown) {
      const message = getApiErrorMessage(err, "Failed to create restaurant");
      console.error("Failed to create restaurant:", message);
      throw new Error(message);
    }
  }, [user]);

  const updateUser = useCallback((updatedFields: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const nextUser = { ...prev, ...updatedFields };
      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(nextUser));
      }
      return nextUser;
    });
  }, []);

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
        addRestaurant,
        updateUser,
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
