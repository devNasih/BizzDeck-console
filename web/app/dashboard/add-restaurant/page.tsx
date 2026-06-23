"use client";

/* eslint-disable @next/next/no-img-element */

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { ArrowLeft, Store, Shield, Receipt } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { Toast } from "@/components/ui/Toast";

function AddRestaurantForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  const isEditMode = !!editId;

  const { user, updateUser, addRestaurant } = useAuth();

  // Basic Info
  const [name, setName] = useState("");
  const [buildingAddress, setBuildingAddress] = useState("");
  const [pincode, setPincode] = useState("");
  const [state, setState] = useState("");
  const [locality, setLocality] = useState("");
  const [zone, setZone] = useState("");
  const [phone, setPhone] = useState("");
  const [editPlan, setEditPlan] = useState("free");

  const [localitiesList, setLocalitiesList] = useState<{ id: number; name: string }[]>([]);
  const [zonesList, setZonesList] = useState<{ id: number; name: string }[]>([]);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [fetchingDetails, setFetchingDetails] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const fetchLocation = async (pin: string) => {
    setLoadingLocation(true);
    setToast(null);
    try {
      const response = await axios.get(`/v1/locations/pincode/${pin}`);
      const resData = response.data;
      if (resData.success && resData.data) {
        const { localities, zones } = resData.data;
        setLocalitiesList(localities || []);
        setZonesList(zones || []);
        
        if (localities && localities.length > 0) {
          const rawState = localities[0].state || "";
          const formattedState = rawState.charAt(0).toUpperCase() + rawState.slice(1).toLowerCase();
          setState(formattedState);
        } else {
          setState("");
        }
      } else {
        throw new Error("Failed to fetch location data");
      }
    } catch (err: unknown) {
      console.error(err);
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      const errMsg = errorObj.response?.data?.message || errorObj.message || "Failed to fetch locations for this pincode";
      setToast({ message: errMsg, type: "error" });
      setLocalitiesList([]);
      setZonesList([]);
      setState("");
    } finally {
      setLoadingLocation(false);
    }
  };

  useEffect(() => {
    const pin = pincode.trim();
    if (pin.length === 6 && /^\d{6}$/.test(pin)) {
      fetchLocation(pin);
    } else {
      setLocalitiesList([]);
      setZonesList([]);
      setState("");
      setLocality("");
      setZone("");
    }
  }, [pincode]);

  // Load details in edit mode
  useEffect(() => {
    if (!editId) return;

    const loadDetails = async () => {
      setFetchingDetails(true);
      try {
        const res = await axios.get(`/v1/restaurants/${editId}`);
        if (res.data && res.data.success && res.data.data) {
          const d = res.data.data;
          setName(d.name || "");
          
          const phoneClean = d.phoneNumber ? d.phoneNumber.replace(/^\+91/, "") : (d.phone ? d.phone.replace(/^\+91/, "") : "");
          setPhone(phoneClean);
          setPincode(d.pincode || "");
          
          const building = d.address ? d.address.split(",")[0] : "";
          setBuildingAddress(building);
          
          const loadedLocality = d.locality?.name || d.location || "";
          const loadedZone = d.zone?.name || "";
          if (loadedLocality) {
            setLocalitiesList([{ id: d.localityId || 0, name: loadedLocality }]);
            setLocality(loadedLocality);
          }
          if (loadedZone) {
            setZonesList([{ id: d.zoneId || 0, name: loadedZone }]);
            setZone(loadedZone);
          }
          
          setEditPlan(d.plan || "free");
          
          // Platform & Compliance
          setZomatoId(d.zomatoId || "");
          setSwiggyId(d.swiggyId || "");
          setFssaiLicense(d.fssaiLicense || "");
          setFssaiExpiry(d.fssaiExpiryDate || d.fssaiExpiry || "");
          setGstNumber(d.gstNumber || "");
          
          // Financial Metrics
          setDineInMargin(d.averageMarginPercentage?.toString() || "");
          setSwiggyHike(d.priceHikePercentageSwiggy?.toString() || "");
          setZomatoHike(d.priceHikePercentageZomato?.toString() || "");
          setSwiggyAds(d.adsPercentageSwiggy?.toString() || "");
          setZomatoAds(d.adsPercentageZomato?.toString() || "");
          setSwiggyDiscounts(d.discountPercentageSwiggy?.toString() || "");
          setZomatoDiscounts(d.discountPercentageZomato?.toString() || "");
          setSwiggyCommission(d.expectedCommissionPercentageSwiggy?.toString() || "");
          setZomatoCommission(d.expectedCommissionPercentageZomato?.toString() || "");
        }
      } catch (err) {
        console.error("Error loading restaurant details:", err);
        setToast({ message: "Failed to load restaurant details.", type: "error" });
      } finally {
        setFetchingDetails(false);
      }
    };

    loadDetails();
  }, [editId]);

  // Platform & Compliance
  const [zomatoId, setZomatoId] = useState("");
  const [swiggyId, setSwiggyId] = useState("");
  const [fssaiLicense, setFssaiLicense] = useState("");
  const [fssaiExpiry, setFssaiExpiry] = useState("");
  const [gstNumber, setGstNumber] = useState("");

  // Financial Metrics
  const [dineInMargin, setDineInMargin] = useState("");
  const [swiggyHike, setSwiggyHike] = useState("");
  const [zomatoHike, setZomatoHike] = useState("");
  const [swiggyAds, setSwiggyAds] = useState("");
  const [zomatoAds, setZomatoAds] = useState("");
  const [swiggyDiscounts, setSwiggyDiscounts] = useState("");
  const [zomatoDiscounts, setZomatoDiscounts] = useState("");
  const [swiggyCommission, setSwiggyCommission] = useState("");
  const [zomatoCommission, setZomatoCommission] = useState("");

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    // Basic Info mandatory checks
    if (!name.trim()) newErrors.name = "Restaurant Name is required";
    if (!buildingAddress.trim()) newErrors.buildingAddress = "Building No/street address is required";
    if (!pincode.trim()) {
      newErrors.pincode = "Pincode is required";
    } else if (!/^\d{6}$/.test(pincode.trim())) {
      newErrors.pincode = "Pincode must be exactly 6 digits";
    }
    if (!locality) newErrors.locality = "Locality is required";
    if (!zone) newErrors.zone = "Zone is required";
    if (!phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(phone.trim())) {
      newErrors.phone = "Phone number must be exactly 10 digits";
    }

    // Platform & Compliance checks
    if (fssaiLicense.trim() && !/^\d{14}$/.test(fssaiLicense.trim())) {
      newErrors.fssaiLicense = "FSSAI License must be exactly 14 digits";
    }

    if (fssaiExpiry.trim()) {
      const dateRegex = /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;
      const match = fssaiExpiry.trim().match(dateRegex);
      if (!match) {
        newErrors.fssaiExpiry = "Date must be selected";
      } else {
        const year = parseInt(match[1]);
        const month = parseInt(match[2]) - 1;
        const day = parseInt(match[3]);
        const parsedDate = new Date(year, month, day);
        if (
          parsedDate.getDate() !== day ||
          parsedDate.getMonth() !== month ||
          parsedDate.getFullYear() !== year
        ) {
          newErrors.fssaiExpiry = "Invalid calendar date";
        }
      }
    }

    if (gstNumber.trim() && !/^[a-zA-Z0-9]{15}$/.test(gstNumber.trim())) {
      newErrors.gstNumber = "GST Number must be exactly 15 alphanumeric characters";
    }

    // Financial Metrics numeric bounds validation
    const checkNumeric = (val: string, fieldName: string) => {
      if (val.trim()) {
        const num = Number(val);
        if (isNaN(num) || num < 0 || num > 100) {
          newErrors[fieldName] = "Must be a percentage between 0 and 100";
        }
      }
    };
    checkNumeric(dineInMargin, "dineInMargin");
    checkNumeric(swiggyHike, "swiggyHike");
    checkNumeric(zomatoHike, "zomatoHike");
    checkNumeric(swiggyAds, "swiggyAds");
    checkNumeric(zomatoAds, "zomatoAds");
    checkNumeric(swiggyDiscounts, "swiggyDiscounts");
    checkNumeric(zomatoDiscounts, "zomatoDiscounts");
    checkNumeric(swiggyCommission, "swiggyCommission");
    checkNumeric(zomatoCommission, "zomatoCommission");

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || submitting) return;

    setSubmitting(true);
    const selectedLocalityObj = localitiesList.find((loc) => loc.name === locality);
    const selectedZoneObj = zonesList.find((z) => z.name === zone);

    const payload = {
      name: name.trim(),
      location: locality,
      address: `${buildingAddress.trim()}, ${locality}, ${zone}, State: ${state}, Pincode: ${pincode}`,
      phone: phone.trim(),
      buildingAddress: buildingAddress.trim(),
      pincode: pincode.trim(),
      state: state.trim(),
      locality: locality,
      zone: zone,
      localityId: selectedLocalityObj?.id,
      zoneId: selectedZoneObj?.id,
      zomatoId: zomatoId.trim() || undefined,
      swiggyId: swiggyId.trim() || undefined,
      fssaiLicense: fssaiLicense.trim() || undefined,
      fssaiExpiryDate: fssaiExpiry.trim() || undefined,
      fssaiExpiry: fssaiExpiry.trim() || undefined,
      gstNumber: gstNumber.trim().toUpperCase() || undefined,
      dineInMargin: dineInMargin ? parseFloat(dineInMargin) : undefined,
      swiggyHike: swiggyHike ? parseFloat(swiggyHike) : undefined,
      zomatoHike: zomatoHike ? parseFloat(zomatoHike) : undefined,
      swiggyAds: swiggyAds ? parseFloat(swiggyAds) : undefined,
      zomatoAds: zomatoAds ? parseFloat(zomatoAds) : undefined,
      swiggyDiscounts: swiggyDiscounts ? parseFloat(swiggyDiscounts) : undefined,
      zomatoDiscounts: zomatoDiscounts ? parseFloat(zomatoDiscounts) : undefined,
      swiggyCommission: swiggyCommission ? parseFloat(swiggyCommission) : undefined,
      zomatoCommission: zomatoCommission ? parseFloat(zomatoCommission) : undefined,
      plan: editPlan,
    };

    try {
      if (isEditMode) {
        const response = await axios.put(`/v1/restaurants/${editId}`, payload);
        if (response.data && response.data.success) {
          // Sync with Auth Context
          if (user && user.restaurants) {
            const updatedAuthRests = user.restaurants.map((r) =>
              r.id === Number(editId) ? { ...r, ...payload, id: Number(editId) } : r
            );
            updateUser({ restaurants: updatedAuthRests });
          }
          
          // Sync localStorage selected restaurant
          const storedRest = localStorage.getItem("selected_restaurant");
          if (storedRest) {
            try {
              const parsed = JSON.parse(storedRest);
              if (parsed.id === Number(editId)) {
                localStorage.setItem("selected_restaurant", JSON.stringify({ ...parsed, ...payload, id: Number(editId) }));
              }
            } catch (e) {
              console.error("Local storage update error", e);
            }
          }
          router.push("/dashboard/restaurants");
        } else {
          throw new Error(response.data?.message || "Failed to update restaurant");
        }
      } else {
        const newRest = await addRestaurant({
          ...payload,
        });

        // Select newly added restaurant in local session
        localStorage.setItem("selected_restaurant", JSON.stringify(newRest));

        // Route back to dashboard
        router.push("/dashboard");
      }
    } catch (err) {
      console.error(err);
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      const errMsg = errorObj.response?.data?.message || errorObj.message || (isEditMode ? "Failed to update restaurant" : "Failed to create restaurant");
      setToast({ message: errMsg, type: "error" });
      setSubmitting(false);
    }
  };

  if (fetchingDetails) {
    return (
      <div className="flex min-h-[100svh] items-center justify-center bg-bd-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-bd-border border-t-bd-teal" />
          <p className="text-xs text-bd-inkSoft font-medium">Loading restaurant details...</p>
        </div>
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
            <span className="text-white text-xs font-bold uppercase tracking-wider">
              {isEditMode ? "Edit Restaurant" : "Add Restaurant"}
            </span>
          </div>
          <Link
            href={isEditMode ? "/dashboard/restaurants" : "/dashboard"}
            className="btn-outline-light inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold"
          >
            <ArrowLeft size={13} /> {isEditMode ? "Back to Restaurants" : "Back to Dashboard"}
          </Link>
        </div>
      </header>

      <div className="w-full px-6 lg:px-8 py-5 space-y-5">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
          {/* Column 1: Basic Info & Financial Metrics */}
          <div className="space-y-5">
            {/* Section 1: Basic Info */}
            <div className="space-y-3 text-bd-tealDeep">
              <div className="flex items-center gap-2 pb-2 border-b border-bd-border">
                <Store size={18} className="text-bd-teal" />
                <h2 className="font-display text-lg font-extrabold text-bd-tealDeep">Basic Info</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <TextField
                    label="Restaurant Name"
                    name="name"
                    placeholder="e.g. Kozhikode Biryani Center"
                    required
                    value={name}
                    disabled={submitting}
                    onChange={(val) => {
                      setName(val);
                      if (errors.name) setErrors(prev => ({ ...prev, name: "" }));
                    }}
                    error={errors.name}
                  />
                </div>
                <div className="md:col-span-2">
                  <TextField
                    label="Building No/street address"
                    name="buildingAddress"
                    placeholder="e.g. 4B, Oasis Mall, Mavoor Road"
                    required
                    value={buildingAddress}
                    disabled={submitting}
                    onChange={(val) => {
                      setBuildingAddress(val);
                      if (errors.buildingAddress) setErrors(prev => ({ ...prev, buildingAddress: "" }));
                    }}
                    error={errors.buildingAddress}
                  />
                </div>
                <div className="md:col-span-2">
                  <TextField
                    label="Restaurant Phone Number"
                    name="phone"
                    placeholder="e.g. 9876543210"
                    required
                    value={phone}
                    disabled={submitting}
                    onChange={(val) => {
                      setPhone(val);
                      if (errors.phone) setErrors(prev => ({ ...prev, phone: "" }));
                    }}
                    error={errors.phone}
                  />
                </div>
                <div className="col-span-1">
                  <TextField
                    label="Pincode"
                    name="pincode"
                    placeholder="e.g. 673001"
                    required
                    value={pincode}
                    disabled={submitting}
                    onChange={(val) => {
                      setPincode(val);
                      if (errors.pincode) setErrors(prev => ({ ...prev, pincode: "" }));
                    }}
                    error={errors.pincode}
                  />
                </div>
                <div className="col-span-1">
                  <TextField
                    label="State"
                    name="state"
                    value={state}
                    disabled
                    readOnly
                    onChange={() => {}}
                    className="bg-neutral-50 cursor-not-allowed opacity-70"
                  />
                </div>
                <div className="col-span-1">
                  <div className="space-y-1.5 w-full">
                    <label className="text-[11px] text-bd-inkSoft tracking-wide block font-bold select-none">
                      Locality <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={locality}
                      disabled={submitting}
                      onChange={(e) => {
                        setLocality(e.target.value);
                        if (errors.locality) setErrors(prev => ({ ...prev, locality: "" }));
                      }}
                      className="w-full bg-white rounded-xl border border-bd-border px-3.5 py-3 text-xs outline-none focus:border-bd-teal transition duration-200 text-bd-tealDeep shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="" disabled>{pincode.length === 6 ? "Select Locality" : "Type pincode first"}</option>
                      {localitiesList.map((loc, index) => (
                        <option key={index} value={loc.name}>{loc.name}</option>
                      ))}
                    </select>
                    {errors.locality && <p className="text-[10px] text-red-500 font-medium">{errors.locality}</p>}
                  </div>
                </div>
                <div className="col-span-1">
                  <div className="space-y-1.5 w-full">
                    <label className="text-[11px] text-bd-inkSoft tracking-wide block font-bold select-none">
                      Zone <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={zone}
                      disabled={submitting}
                      onChange={(e) => {
                        setZone(e.target.value);
                        if (errors.zone) setErrors(prev => ({ ...prev, zone: "" }));
                      }}
                      className="w-full bg-white rounded-xl border border-bd-border px-3.5 py-3 text-xs outline-none focus:border-bd-teal transition duration-200 text-bd-tealDeep shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="" disabled>{pincode.length === 6 ? "Select Zone" : "Type pincode first"}</option>
                      {zonesList.map((z, index) => (
                        <option key={index} value={z.name}>{z.name}</option>
                      ))}
                    </select>
                    {errors.zone && <p className="text-[10px] text-red-500 font-medium">{errors.zone}</p>}
                  </div>
                </div>


              </div>
            </div>

            {/* Section 3: Financial Metrics */}
            <div className="space-y-3 text-bd-tealDeep">
              <div className="flex items-center gap-2 pb-2 border-b border-bd-border">
                <Receipt size={18} className="text-bd-teal" />
                <h2 className="font-display text-lg font-extrabold text-bd-tealDeep">Financial Metrics</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <TextField
                    label="Dine-in Average Margin (%)"
                    name="dineInMargin"
                    placeholder="e.g. 60"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={dineInMargin}
                    disabled={submitting}
                    onChange={(val) => {
                      setDineInMargin(val);
                      if (errors.dineInMargin) setErrors(prev => ({ ...prev, dineInMargin: "" }));
                    }}
                    error={errors.dineInMargin}
                  />
                </div>
                
                <div>
                  <TextField
                    label="Swiggy Price Hike (%)"
                    name="swiggyHike"
                    placeholder="e.g. 20"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={swiggyHike}
                    disabled={submitting}
                    onChange={(val) => {
                      setSwiggyHike(val);
                      if (errors.swiggyHike) setErrors(prev => ({ ...prev, swiggyHike: "" }));
                    }}
                    error={errors.swiggyHike}
                  />
                </div>
                <div>
                  <TextField
                    label="Zomato Price Hike (%)"
                    name="zomatoHike"
                    placeholder="e.g. 20"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={zomatoHike}
                    disabled={submitting}
                    onChange={(val) => {
                      setZomatoHike(val);
                      if (errors.zomatoHike) setErrors(prev => ({ ...prev, zomatoHike: "" }));
                    }}
                    error={errors.zomatoHike}
                  />
                </div>

                <div>
                  <TextField
                    label="Swiggy Ads (%)"
                    name="swiggyAds"
                    placeholder="e.g. 10"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={swiggyAds}
                    disabled={submitting}
                    onChange={(val) => {
                      setSwiggyAds(val);
                      if (errors.swiggyAds) setErrors(prev => ({ ...prev, swiggyAds: "" }));
                    }}
                    error={errors.swiggyAds}
                  />
                </div>
                <div>
                  <TextField
                    label="Zomato Ads (%)"
                    name="zomatoAds"
                    placeholder="e.g. 10"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={zomatoAds}
                    disabled={submitting}
                    onChange={(val) => {
                      setZomatoAds(val);
                      if (errors.zomatoAds) setErrors(prev => ({ ...prev, zomatoAds: "" }));
                    }}
                    error={errors.zomatoAds}
                  />
                </div>

                <div>
                  <TextField
                    label="Swiggy Discount (%)"
                    name="swiggyDiscounts"
                    placeholder="e.g. 15"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={swiggyDiscounts}
                    disabled={submitting}
                    onChange={(val) => {
                      setSwiggyDiscounts(val);
                      if (errors.swiggyDiscounts) setErrors(prev => ({ ...prev, swiggyDiscounts: "" }));
                    }}
                    error={errors.swiggyDiscounts}
                  />
                </div>
                <div>
                  <TextField
                    label="Zomato Discount (%)"
                    name="zomatoDiscounts"
                    placeholder="e.g. 15"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={zomatoDiscounts}
                    disabled={submitting}
                    onChange={(val) => {
                      setZomatoDiscounts(val);
                      if (errors.zomatoDiscounts) setErrors(prev => ({ ...prev, zomatoDiscounts: "" }));
                    }}
                    error={errors.zomatoDiscounts}
                  />
                </div>

                <div>
                  <TextField
                    label="Swiggy Commission (%)"
                    name="swiggyCommission"
                    placeholder="e.g. 22"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={swiggyCommission}
                    disabled={submitting}
                    onChange={(val) => {
                      setSwiggyCommission(val);
                      if (errors.swiggyCommission) setErrors(prev => ({ ...prev, swiggyCommission: "" }));
                    }}
                    error={errors.swiggyCommission}
                  />
                </div>
                <div>
                  <TextField
                    label="Zomato Commission (%)"
                    name="zomatoCommission"
                    placeholder="e.g. 22"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={zomatoCommission}
                    disabled={submitting}
                    onChange={(val) => {
                      setZomatoCommission(val);
                      if (errors.zomatoCommission) setErrors(prev => ({ ...prev, zomatoCommission: "" }));
                    }}
                    error={errors.zomatoCommission}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Platform & Compliance */}
          <div className="space-y-3 text-bd-tealDeep">
            <div className="flex items-center gap-2 pb-2 border-b border-bd-border">
              <Shield size={18} className="text-bd-teal" />
              <h2 className="font-display text-lg font-extrabold text-bd-tealDeep">Platform & Compliance</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <TextField
                  label="Zomato Restaurant ID"
                  name="zomatoId"
                  placeholder="e.g. 18239023"
                  value={zomatoId}
                  disabled={submitting}
                  onChange={setZomatoId}
                />
              </div>
              <div>
                <TextField
                  label="Swiggy Restaurant ID"
                  name="swiggyId"
                  placeholder="e.g. 439021"
                  value={swiggyId}
                  disabled={submitting}
                  onChange={setSwiggyId}
                />
              </div>
              <div className="md:col-span-2">
                <TextField
                  label="FSSAI License"
                  name="fssaiLicense"
                  placeholder="14-digit FSSAI License Number"
                  value={fssaiLicense}
                  disabled={submitting}
                  onChange={(val) => {
                    setFssaiLicense(val);
                    if (errors.fssaiLicense) setErrors(prev => ({ ...prev, fssaiLicense: "" }));
                  }}
                  error={errors.fssaiLicense}
                />
              </div>
              <div className="md:col-span-2">
                <TextField
                  label="FSSAI License Expiry Date"
                  name="fssaiExpiry"
                  type="date"
                  value={fssaiExpiry}
                  disabled={submitting}
                  onChange={(val) => {
                    setFssaiExpiry(val);
                    if (errors.fssaiExpiry) setErrors(prev => ({ ...prev, fssaiExpiry: "" }));
                  }}
                  error={errors.fssaiExpiry}
                />
              </div>
              <div className="md:col-span-2">
                <TextField
                  label="GST Number"
                  name="gstNumber"
                  placeholder="15-character GSTIN Alphanumeric Code"
                  value={gstNumber}
                  disabled={submitting}
                  onChange={(val) => {
                    setGstNumber(val);
                    if (errors.gstNumber) setErrors(prev => ({ ...prev, gstNumber: "" }));
                  }}
                  error={errors.gstNumber}
                />
              </div>
            </div>
          </div>

          {/* Action buttons spanning full width */}
          <div className="lg:col-span-2 flex gap-4 items-center justify-end pt-4 border-t border-bd-border">
            <Button variant="outline" href={isEditMode ? "/dashboard/restaurants" : "/dashboard"} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="teal" disabled={submitting}>
              {submitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                  {isEditMode ? "Saving Changes..." : "Add Restaurant..."}
                </>
              ) : (
                isEditMode ? "Save Changes" : "Add Restaurant"
              )}
            </Button>
          </div>
        </form>
      </div>

      {loadingLocation && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-bd-bg/25 backdrop-blur-[2px]">
          <div className="relative flex items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-2 border-bd-border border-t-bd-teal" />
          </div>
          <p className="mt-4 text-xs font-semibold tracking-wider text-bd-teal uppercase">
            Fetching location...
          </p>
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

// Wrapper with Suspense boundary required for next.config static generation when using useSearchParams
export default function AddRestaurantPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[100svh] items-center justify-center bg-bd-bg">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-bd-border border-t-bd-teal" />
      </div>
    }>
      <AddRestaurantForm />
    </Suspense>
  );
}
