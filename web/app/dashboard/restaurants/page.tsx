"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { Store, MapPin, Edit3, Trash2, ArrowLeft, AlertTriangle } from "lucide-react";
import { useAuth, Restaurant } from "@/components/auth/AuthProvider";
import { Toast } from "@/components/ui/Toast";
import { getApiErrorMessage } from "@/lib/api";

export default function ManageRestaurantsPage() {
  const router = useRouter();
  const { user, loading: authLoading, updateUser } = useAuth();
  
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  // Toast state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const fetchRestaurants = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get("/v1/restaurants?restaurant_info=false&sales_info=false");
      if (response.data && response.data.success) {
        setRestaurants(response.data.data || []);
      } else {
        setError("Failed to fetch restaurants");
      }
    } catch (err: unknown) {
      console.error(err);
      setError(getApiErrorMessage(err, "Failed to load restaurants. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/");
      return;
    }
    fetchRestaurants();
  }, [authLoading, user, router]);

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;

    setDeleting(true);
    try {
      const response = await axios.delete(`/v1/restaurants/${deleteId}`);
      if (response.data && response.data.success) {
        // 1. Remove from local list
        setRestaurants((prev) => prev.filter((r) => r.id !== deleteId));

        // 2. Update Auth context
        if (user && user.restaurants) {
          const updatedAuthRests = user.restaurants.filter((r) => r.id !== deleteId);
          updateUser({ restaurants: updatedAuthRests });
        }

        // 3. Update localStorage selected restaurant if it is the deleted one
        const storedRest = localStorage.getItem("selected_restaurant");
        if (storedRest) {
          try {
            const parsed = JSON.parse(storedRest);
            if (parsed.id === deleteId) {
              if (user && user.restaurants) {
                const remaining = user.restaurants.filter((r) => r.id !== deleteId);
                if (remaining.length > 0) {
                  localStorage.setItem("selected_restaurant", JSON.stringify(remaining[0]));
                } else {
                  localStorage.removeItem("selected_restaurant");
                }
              } else {
                localStorage.removeItem("selected_restaurant");
              }
            }
          } catch (e) {
            console.error("Local storage sync error during delete", e);
          }
        }

        setToast({ message: "Restaurant deleted successfully", type: "success" });
        setDeleteId(null);
      } else {
        throw new Error(response.data?.message || "Failed to delete restaurant");
      }
    } catch (err: unknown) {
      console.error(err);
      setToast({ message: getApiErrorMessage(err, "Failed to delete restaurant. Please try again."), type: "error" });
    } finally {
      setDeleting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-[100svh] items-center justify-center bg-bd-bg">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-bd-border border-t-bd-teal" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bd-bg">
      <header className="sticky top-0 z-40 bd-glass border-b border-white/10">
        <div className="w-full flex items-center justify-between px-6 lg:px-8 py-3">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center">
              <img src="/assets/White@4x.png" alt="BizzDeck Logo" className="h-8 object-contain" />
            </Link>
            <span className="text-white/20 text-sm">|</span>
            <span className="text-white text-xs font-bold uppercase tracking-wider">Manage Restaurants</span>
          </div>
          <Link
            href="/dashboard"
            className="btn-outline-light inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold"
          >
            <ArrowLeft size={13} /> Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="w-full max-w-7xl mx-auto px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between border-b border-bd-border pb-4">
          <div>
            <h1 className="font-display text-2xl font-black text-bd-tealDeep">All Restaurants</h1>
            <p className="text-xs text-bd-inkSoft mt-1">View, edit, or remove restaurants connected to your account.</p>
          </div>
          <Link
            href="/dashboard/add-restaurant"
            className="btn-teal inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold shadow-sm"
          >
            Add Restaurant
          </Link>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-bd-border border-t-bd-teal" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50/50 p-8 text-center max-w-md mx-auto space-y-4">
            <p className="text-sm font-semibold text-red-700">{error}</p>
            <button
              onClick={fetchRestaurants}
              className="btn-teal rounded-xl px-5 py-2.5 text-xs font-bold"
            >
              Retry Loading
            </button>
          </div>
        ) : restaurants.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-bd-border bg-bd-section p-12 text-center max-w-xl mx-auto">
            <Store className="mx-auto text-bd-inkSoft/40 mb-4" size={48} />
            <h3 className="font-display text-lg font-bold text-bd-tealDeep">No Restaurants Found</h3>
            <p className="text-xs text-bd-inkSoft mt-1 mb-6">You haven&apos;t connected any restaurants yet.</p>
            <Link
              href="/dashboard/add-restaurant"
              className="btn-teal rounded-full px-6 py-3 text-xs font-bold shadow-md"
            >
              Connect Your First Restaurant
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {restaurants.map((rest) => {
              const planName = rest.plan || "free";
              return (
                <div
                  key={rest.id}
                  className="bg-bd-section border border-bd-border p-5 rounded-3xl shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-bd-mintMuted flex items-center justify-center text-bd-tealDeep shrink-0">
                          <Store size={18} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-display text-sm font-black text-bd-tealDeep truncate">{rest.name}</h3>
                          <div className="flex items-center gap-1 text-[10px] text-bd-inkSoft mt-0.5">
                            <MapPin size={11} className="shrink-0" />
                            <span className="truncate">{rest.location || "No Location Specified"}</span>
                          </div>
                        </div>
                      </div>
                      <span
                        className={`text-[9px] font-bold uppercase px-2.5 py-1 rounded-full border ${
                          planName === "pro"
                            ? "bg-bd-mint/20 text-bd-tealDeep border-bd-mint/40"
                            : planName === "plus"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : planName === "lite"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-neutral-100 text-neutral-600 border-neutral-200"
                        }`}
                      >
                        {planName}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-6 pt-4 border-t border-neutral-100/60">
                    <Link
                      href={`/dashboard/add-restaurant?id=${rest.id}`}
                      className="flex-1 btn-outline inline-flex items-center justify-center gap-1.5 rounded-full py-2 text-xs font-bold"
                    >
                      <Edit3 size={13} />
                      <span>Edit</span>
                    </Link>
                    <button
                      onClick={() => setDeleteId(rest.id)}
                      className="flex-1 border border-red-200 text-red-600 bg-red-50/40 hover:bg-red-50 hover:border-red-300 transition duration-200 inline-flex items-center justify-center gap-1.5 rounded-full py-2 text-xs font-bold"
                    >
                      <Trash2 size={13} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl border border-neutral-200/80 bg-white p-6 shadow-2xl text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-bd-tealDeep">Delete Restaurant</h3>
              <p className="mt-1.5 text-xs text-bd-inkSoft leading-relaxed">
                Are you sure you want to remove this restaurant? This action is permanent and cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                disabled={deleting}
                onClick={() => setDeleteId(null)}
                className="flex-1 rounded-full border border-neutral-200 py-2.5 text-xs font-bold text-neutral-700 hover:bg-neutral-50 transition"
              >
                Cancel
              </button>
              <button
                disabled={deleting}
                onClick={handleDeleteConfirm}
                className="flex-1 rounded-full bg-red-600 hover:bg-red-700 py-2.5 text-xs font-bold text-white shadow-sm transition"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
