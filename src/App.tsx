import React, { useState, useEffect, useRef } from "react";
import { TRANSLATIONS, LangCode } from "./i18n";
import { apiRequest, normalizePhone, isValidIndianMobile, isValidEmail } from "./services/api";
import {
  Recycle, ShieldCheck, Scale, Truck, Search, AlertTriangle,
  Upload, CheckCircle2, LogOut, UserCheck, Factory, Warehouse,
  Bot, Sparkles, Send, X, Phone, Mail, ArrowRight, CornerDownLeft,
  Check, RefreshCw, AlertCircle
} from "lucide-react";

interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  actions?: Array<{ target: string; label: string; description?: string }>;
}

export default function App() {
  const [lang, setLang] = useState<LangCode>("en");
  const t = TRANSLATIONS[lang];

  const [token, setToken] = useState<string | null>(localStorage.getItem("econect_token"));
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Authentication & Validation tabs
  const [authMode, setAuthMode] = useState<"login" | "validate">("login");
  const [email, setEmail] = useState("citizen@econect.in");
  const [password, setPassword] = useState("demo123");

  // User Validation (Email & Mobile) state
  const [valEmail, setValEmail] = useState("citizen@econect.in");
  const [valPhone, setValPhone] = useState("9876543210");
  const [valLoading, setValLoading] = useState(false);
  const [valResult, setValResult] = useState<any>(null);
  const [showOtpBox, setShowOtpBox] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [otpNotice, setOtpNotice] = useState<string | null>(null);

  // Core application state
  const [categories, setCategories] = useState<any[]>([]);
  const [pickups, setPickups] = useState<any[]>([]);
  const [selectedCat, setSelectedCat] = useState("BATTERIES");
  const [estWeight, setEstWeight] = useState("5");
  const [address, setAddress] = useState("12th Main, Indiranagar, Bengaluru");
  const [aiResult, setAiResult] = useState<any>(null);
  const [weighInputs, setWeighInputs] = useState<Record<string, string>>({});

  const [trackingInput, setTrackingInput] = useState("");
  const [journeyData, setJourneyData] = useState<any>(null);
  const [centreInventory, setCentreInventory] = useState<any[]>([]);
  const [adminStats, setAdminStats] = useState<any>(null);

  // AI Chat Bot state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "msg-welcome",
      sender: "bot",
      text: "👋 Welcome to ECONECT AI Navigator! I can guide you through every part of the platform, explain digital weighing, help you validate user identities by email & mobile, or jump directly to any feature.",
      actions: [
        { target: "pickup_form", label: "📦 Book Scrap Pickup" },
        { target: "validate_user", label: "📱 Validate User Identity" },
        { target: "traceability", label: "🔍 Track Waste Journey" },
        { target: "switch_collector", label: "🚚 Switch to Kabadiwala Demo" },
      ],
    },
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const [highlightTarget, setHighlightTarget] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadCategories();
    if (token) {
      fetchProfile(token);
    }
  }, [token]);

  useEffect(() => {
    if (isChatOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, isChatOpen]);

  async function loadCategories() {
    try {
      const data = await apiRequest("/prices");
      setCategories(data);
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function fetchProfile(jwt: string) {
    try {
      const me = await apiRequest("/auth/me", {}, jwt);
      setUser(me);
      refreshRoleData(me.role, jwt);
    } catch {
      handleLogout();
    }
  }

  async function refreshRoleData(role: string, jwt: string) {
    try {
      if (role === "CITIZEN") {
        setPickups(await apiRequest("/citizen/pickups", {}, jwt));
      } else if (role === "COLLECTOR") {
        setPickups(await apiRequest("/collector/pickups", {}, jwt));
      } else if (role === "CENTRE") {
        setCentreInventory(await apiRequest("/centres/inventory", {}, jwt));
      } else if (role === "ADMIN") {
        setAdminStats(await apiRequest("/admin/analytics", {}, jwt));
      }
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem("econect_token", res.access_token);
      setToken(res.access_token);
      setUser(res.user);
      refreshRoleData(res.user.role, res.access_token);
      setNotice(`Welcome back, ${res.user.full_name}!`);
    } catch (err: any) {
      setError(err.message);
    }
  }

  function handleLogout() {
    localStorage.removeItem("econect_token");
    setToken(null);
    setUser(null);
    setPickups([]);
    setNotice("Logged out successfully.");
  }

  function quickDemoSwitch(demoEmail: string, demoPass = "demo123", phone = "9876543210") {
    setEmail(demoEmail);
    setPassword(demoPass);
    setValEmail(demoEmail);
    setValPhone(phone);
  }

  // User Validation Handler
  async function handleValidateUser(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setError(null);
    setValResult(null);
    setShowOtpBox(false);
    setOtpNotice(null);

    if (!isValidEmail(valEmail)) {
      setError("Please provide a valid email address.");
      return;
    }
    if (!isValidIndianMobile(valPhone)) {
      setError("Please provide a valid 10-digit Indian mobile number (e.g. 9876543210 or +91 9876543210).");
      return;
    }

    setValLoading(true);
    try {
      const res = await apiRequest("/auth/validate-user", {
        method: "POST",
        body: JSON.stringify({ email: valEmail.trim(), phone: valPhone.trim() }),
      });
      setValResult(res);
      if (res.is_valid) {
        setNotice(res.message);
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setValLoading(false);
    }
  }

  async function handleSendOtp() {
    setError(null);
    try {
      const res = await apiRequest("/auth/send-otp", {
        method: "POST",
        body: JSON.stringify({ email: valEmail.trim(), phone: valPhone.trim() }),
      });
      setShowOtpBox(true);
      setOtpInput(res.demo_otp || "123456");
      setOtpNotice(`OTP sent to +91-${normalizePhone(valPhone)}. Demo OTP: ${res.demo_otp || "123456"}`);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleVerifyOtp() {
    setError(null);
    try {
      const res = await apiRequest("/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({
          email: valEmail.trim(),
          phone: valPhone.trim(),
          otp: otpInput.trim(),
        }),
      });
      setOtpNotice(res.message);
      setShowOtpBox(false);
      // Re-validate to show updated verified state
      handleValidateUser();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleImageClassify(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.[0] || !token) return;
    setError(null);
    const formData = new FormData();
    formData.append("file", e.target.files[0]);
    try {
      const res = await apiRequest("/waste/classify", { method: "POST", body: formData }, token);
      setAiResult(res);
      setSelectedCat(res.predicted_category_code);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleCreatePickup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = await apiRequest(
        "/pickups",
        {
          method: "POST",
          body: JSON.stringify({
            category_code: selectedCat,
            estimated_weight_kg: parseFloat(estWeight),
            pickup_address: address,
          }),
        },
        token
      );
      setNotice(`Pickup Created! Tracking ID: ${res.tracking_code}`);
      setTrackingInput(res.tracking_code);
      refreshRoleData("CITIZEN", token!);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function collectorAction(pickupId: string, action: "accept" | "arrive" | "weigh" | "complete") {
    setError(null);
    try {
      const body =
        action === "weigh"
          ? JSON.stringify({ actual_weight_kg: parseFloat(weighInputs[pickupId] || "5") })
          : undefined;
      await apiRequest(`/pickups/${pickupId}/${action}`, { method: "POST", body }, token);
      refreshRoleData("COLLECTOR", token!);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleTraceLookup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const data = await apiRequest(`/waste/${trackingInput.trim()}/journey`);
      setJourneyData(data);
    } catch (err: any) {
      setError(err.message);
    }
  }

  // AI Navigation Action Handler
  function handleNavigation(target: string) {
    if (target === "switch_citizen") {
      quickDemoSwitch("citizen@econect.in", "demo123", "9876543210");
      setAuthMode("login");
      triggerHighlight("auth_card");
      return;
    }
    if (target === "switch_collector") {
      quickDemoSwitch("collector@econect.in", "demo123", "9876543211");
      setAuthMode("login");
      triggerHighlight("auth_card");
      return;
    }
    if (target === "switch_centre") {
      quickDemoSwitch("centre@econect.in", "demo123", "9876543212");
      setAuthMode("login");
      triggerHighlight("auth_card");
      return;
    }
    if (target === "switch_recycler") {
      quickDemoSwitch("recycler@econect.in", "demo123", "9876543213");
      setAuthMode("login");
      triggerHighlight("auth_card");
      return;
    }
    if (target === "switch_admin") {
      quickDemoSwitch("admin@econect.in", "admin123", "9876543214");
      setAuthMode("login");
      triggerHighlight("auth_card");
      return;
    }

    if (target === "validate_user") {
      if (!user) {
        setAuthMode("validate");
        triggerHighlight("auth_card");
      } else {
        setNotice(`Your registered email (${user.email}) and mobile (+91-${user.phone}) are validated on ECONECT.`);
        triggerHighlight("user_profile_badge");
      }
      return;
    }

    // Scroll to section and highlight
    triggerHighlight(target);
  }

  function triggerHighlight(elementId: string) {
    const el = document.getElementById(elementId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightTarget(elementId);
      setTimeout(() => {
        setHighlightTarget(null);
      }, 2500);
    } else {
      setNotice(`Navigating to ${elementId.replace("_", " ")}...`);
    }
  }

  // AI Chat Assistant Send
  async function handleSendChatMessage(customText?: string) {
    const query = (customText || chatInput).trim();
    if (!query) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: "user",
      text: query,
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await apiRequest("/ai/chat", {
        method: "POST",
        body: JSON.stringify({
          message: query,
          current_role: user?.role || "GUEST",
          lang,
        }),
      });

      const botMsg: ChatMessage = {
        id: `msg-bot-${Date.now()}`,
        sender: "bot",
        text: res.reply || "I am here to help you navigate ECONECT.",
        actions: res.navigation_actions,
      };
      setChatMessages((prev) => [...prev, botMsg]);
    } catch {
      // Graceful fallback
      const botMsg: ChatMessage = {
        id: `msg-fallback-${Date.now()}`,
        sender: "bot",
        text: "I am ready to help you navigate ECONECT! Choose any action below:",
        actions: [
          { target: "pickup_form", label: "📦 Book Scrap Pickup" },
          { target: "validate_user", label: "📱 Validate Mobile & Email" },
          { target: "traceability", label: "🔍 Track Waste Journey" },
        ],
      };
      setChatMessages((prev) => [...prev, botMsg]);
    } finally {
      setChatLoading(false);
    }
  }

  const activeCategoryObj = categories.find((c) => c.code === selectedCat);
  const indicativeValue = activeCategoryObj
    ? (parseFloat(estWeight || "0") * activeCategoryObj.rate_per_kg).toFixed(2)
    : "0.00";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 relative pb-16">
      {/* Top Header */}
      <header className="bg-emerald-900 text-white shadow sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <Recycle className="w-8 h-8 text-emerald-300 shrink-0" />
            <div>
              <h1 className="text-xl font-bold tracking-tight">ECONECT</h1>
              <p className="text-xs text-emerald-200">{t.tagline}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              aria-label="Select Language"
              value={lang}
              onChange={(e) => setLang(e.target.value as LangCode)}
              className="bg-emerald-800 text-white text-sm rounded px-2 py-1.5 border border-emerald-600 focus:outline-none"
            >
              <option value="en">English</option>
              <option value="hi">हिन्दी (Hindi)</option>
              <option value="te">తెలుగు (Telugu)</option>
              <option value="ta">தமிழ் (Tamil)</option>
              <option value="mr">मराठी (Marathi)</option>
            </select>

            {user ? (
              <div
                id="user_profile_badge"
                className={`flex items-center gap-2 text-sm bg-emerald-800 px-3 py-1.5 rounded transition-all ${
                  highlightTarget === "user_profile_badge" ? "ring-4 ring-emerald-300" : ""
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-300" title="Email & Phone Validated" />
                  <span className="font-medium">{user.full_name}</span>
                </div>
                <span className="text-xs bg-emerald-600 px-2 py-0.5 rounded font-mono">
                  {user.role}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-emerald-200 hover:text-white ml-2 p-0.5"
                  title="Log out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setAuthMode("validate");
                  triggerHighlight("auth_card");
                }}
                className="text-xs bg-emerald-800 hover:bg-emerald-700 text-emerald-100 px-3 py-1.5 rounded border border-emerald-600 flex items-center gap-1.5 transition-colors"
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-300" />
                <span>{t.validateUser}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Alerts & Notifications */}
        {error && (
          <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded flex justify-between items-center text-sm shadow-sm">
            <span className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              {error}
            </span>
            <button onClick={() => setError(null)} className="font-bold text-lg leading-none ml-2">×</button>
          </div>
        )}
        {notice && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded flex justify-between items-center text-sm shadow-sm">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              {notice}
            </span>
            <button onClick={() => setNotice(null)} className="font-bold text-lg leading-none ml-2">×</button>
          </div>
        )}

        {/* Authentication & User Validation Area */}
        {!user ? (
          <div
            id="auth_card"
            className={`grid md:grid-cols-2 gap-6 bg-white p-6 rounded-xl shadow-sm border transition-all duration-300 ${
              highlightTarget === "auth_card" ? "ring-4 ring-emerald-500 ring-offset-2" : ""
            }`}
          >
            <div>
              {/* Tab Navigation: Sign In vs Validate User */}
              <div className="flex border-b border-slate-200 mb-4 gap-4">
                <button
                  type="button"
                  onClick={() => setAuthMode("login")}
                  className={`pb-2 text-sm font-semibold border-b-2 transition-colors ${
                    authMode === "login"
                      ? "border-emerald-700 text-emerald-900"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {t.signIn || "Sign In to ECONECT"}
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode("validate")}
                  className={`pb-2 text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                    authMode === "validate"
                      ? "border-emerald-700 text-emerald-900"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <UserCheck className="w-4 h-4 text-emerald-700" />
                  {t.validateUser || "Validate User (Email & Mobile)"}
                </button>
              </div>

              {authMode === "login" ? (
                <>
                  <p className="text-xs text-slate-600 mb-3">
                    Click any seeded SIH Demo Role below to auto-fill credentials:
                  </p>
                  <div className="flex flex-wrap gap-2 mb-5">
                    <button
                      type="button"
                      onClick={() => quickDemoSwitch("citizen@econect.in", "demo123", "9876543210")}
                      className="text-xs bg-slate-100 hover:bg-emerald-100 px-3 py-1.5 rounded border transition-colors"
                    >
                      Citizen Demo
                    </button>
                    <button
                      type="button"
                      onClick={() => quickDemoSwitch("collector@econect.in", "demo123", "9876543211")}
                      className="text-xs bg-slate-100 hover:bg-emerald-100 px-3 py-1.5 rounded border transition-colors"
                    >
                      Kabadiwala Demo
                    </button>
                    <button
                      type="button"
                      onClick={() => quickDemoSwitch("centre@econect.in", "demo123", "9876543212")}
                      className="text-xs bg-slate-100 hover:bg-emerald-100 px-3 py-1.5 rounded border transition-colors"
                    >
                      Collection Centre Demo
                    </button>
                    <button
                      type="button"
                      onClick={() => quickDemoSwitch("recycler@econect.in", "demo123", "9876543213")}
                      className="text-xs bg-slate-100 hover:bg-emerald-100 px-3 py-1.5 rounded border transition-colors"
                    >
                      Recycler Demo
                    </button>
                    <button
                      type="button"
                      onClick={() => quickDemoSwitch("admin@econect.in", "admin123", "9876543214")}
                      className="text-xs bg-slate-100 hover:bg-emerald-100 px-3 py-1.5 rounded border transition-colors"
                    >
                      Admin Demo
                    </button>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-500">Email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full border rounded px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-700"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-500">Password</label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full border rounded px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-700"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-2 rounded text-sm transition-colors shadow-sm"
                    >
                      Log In
                    </button>
                  </form>
                </>
              ) : (
                /* User Validation Based on Email and Mobile Number */
                <div className="space-y-3">
                  <p className="text-xs text-slate-600 mb-2">
                    Verify account status, phone binding, and badge validity by entering the user&apos;s registered Email and 10-digit Indian Mobile number:
                  </p>

                  <div className="flex flex-wrap gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => {
                        setValEmail("citizen@econect.in");
                        setValPhone("9876543210");
                      }}
                      className="text-xs bg-emerald-50 text-emerald-800 hover:bg-emerald-100 px-2.5 py-1 rounded border border-emerald-200"
                    >
                      Citizen (9876543210)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setValEmail("collector@econect.in");
                        setValPhone("9876543211");
                      }}
                      className="text-xs bg-emerald-50 text-emerald-800 hover:bg-emerald-100 px-2.5 py-1 rounded border border-emerald-200"
                    >
                      Kabadiwala (9876543211)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setValEmail("admin@econect.in");
                        setValPhone("9876543214");
                      }}
                      className="text-xs bg-emerald-50 text-emerald-800 hover:bg-emerald-100 px-2.5 py-1 rounded border border-emerald-200"
                    >
                      Admin (9876543214)
                    </button>
                  </div>

                  <form onSubmit={handleValidateUser} className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-500 flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-emerald-700" />
                        {t.emailAddress || "Email Address"}
                      </label>
                      <input
                        type="email"
                        placeholder="e.g., citizen@econect.in"
                        value={valEmail}
                        onChange={(e) => setValEmail(e.target.value)}
                        className="w-full border rounded px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-700"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-emerald-700" />
                          {t.mobileNumber || "Mobile Number (10 Digits)"}
                        </span>
                        <span className="text-[11px] text-slate-400 font-normal">India (+91)</span>
                      </label>
                      <input
                        type="tel"
                        placeholder="e.g., 9876543210 or +91 98765 43210"
                        value={valPhone}
                        onChange={(e) => setValPhone(e.target.value)}
                        className="w-full border rounded px-3 py-2 mt-1 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-emerald-700"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={valLoading}
                      className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-2 rounded text-sm transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                    >
                      {valLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Validating...</span>
                        </>
                      ) : (
                        <>
                          <UserCheck className="w-4 h-4" />
                          <span>{t.validateNow || "Validate User Identity"}</span>
                        </>
                      )}
                    </button>
                  </form>

                  {/* Validation Result Box */}
                  {valResult && (
                    <div
                      className={`p-3.5 rounded-lg border text-xs space-y-2 mt-3 ${
                        valResult.is_valid
                          ? "bg-emerald-50 border-emerald-300 text-emerald-950"
                          : "bg-amber-50 border-amber-300 text-amber-950"
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold">
                        {valResult.is_valid ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Identity Verified & Active</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-4 h-4 text-amber-600" />
                            <span>Validation Mismatch</span>
                          </>
                        )}
                      </div>

                      <p className="text-slate-700">{valResult.message}</p>

                      {valResult.user && (
                        <div className="bg-white p-2.5 rounded border border-emerald-200 space-y-1">
                          <div className="font-semibold text-slate-800">{valResult.user.full_name}</div>
                          <div className="text-slate-600 font-mono">
                            Role: <span className="font-bold text-emerald-800">{valResult.user.role}</span> | Status: {valResult.verification_status}
                          </div>
                          {valResult.econect_badge_id && (
                            <div className="text-emerald-700 font-mono text-[11px]">
                              Badge ID: {valResult.econect_badge_id}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="pt-2 flex flex-wrap gap-2">
                        {valResult.is_valid && (
                          <button
                            type="button"
                            onClick={() => {
                              setEmail(valResult.user.email);
                              setPassword("demo123");
                              setAuthMode("login");
                            }}
                            className="bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1 rounded text-xs font-semibold flex items-center gap-1"
                          >
                            <span>Quick Sign In as this User</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={handleSendOtp}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded text-xs border"
                        >
                          Request OTP Verification
                        </button>
                      </div>

                      {showOtpBox && (
                        <div className="pt-2 space-y-2 border-t border-emerald-200">
                          {otpNotice && <div className="text-emerald-800 font-medium">{otpNotice}</div>}
                          <div className="flex gap-2 items-center">
                            <input
                              type="text"
                              maxLength={6}
                              placeholder="6-digit OTP"
                              value={otpInput}
                              onChange={(e) => setOtpInput(e.target.value)}
                              className="border rounded px-2.5 py-1 text-xs w-28 font-mono tracking-widest bg-white"
                            />
                            <button
                              type="button"
                              onClick={handleVerifyOtp}
                              className="bg-emerald-800 hover:bg-emerald-900 text-white px-3 py-1 rounded text-xs font-semibold"
                            >
                              Verify OTP
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Why ECONECT Information Card */}
            <div className="bg-emerald-50 p-5 rounded-lg border border-emerald-200 space-y-3">
              <h3 className="font-bold text-emerald-950 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-700" />
                Why ECONECT?
              </h3>
              <ul className="text-sm text-emerald-900 space-y-2 list-disc pl-5">
                <li><strong>Fair Indicative Rates:</strong> Citizens &amp; Kabadiwalas see transparent scrap &amp; e-waste rates before pickup.</li>
                <li><strong>Verified Digital Weighing:</strong> Locked historical rate snapshots protect receipts from later price changes.</li>
                <li><strong>End-to-End Traceability:</strong> Track every kilogram from Citizen → Kabadiwala → Collection Centre → Authorized Recycler.</li>
                <li><strong>Dual-Factor Validation:</strong> Strict verification of Kabadiwalas &amp; Users using registered Email &amp; Mobile numbers.</li>
              </ul>
            </div>
          </div>
        ) : (
          <>
            {/* Citizen Portal */}
            {user.role === "CITIZEN" && (
              <div className="grid lg:grid-cols-2 gap-6">
                <div
                  id="pickup_form"
                  className={`bg-white p-6 rounded-xl shadow-sm border space-y-4 transition-all duration-300 ${
                    highlightTarget === "pickup_form" ? "ring-4 ring-emerald-500 ring-offset-2" : ""
                  }`}
                >
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <Upload className="w-5 h-5 text-emerald-700" />
                    {t.bookPickup}
                  </h2>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Step 1: Optional AI Waste Image Assist (JPEG/PNG/WEBP)
                    </label>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageClassify}
                      className="text-sm"
                    />
                    {aiResult && (
                      <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded text-xs space-y-1">
                        <div className="font-semibold text-amber-900">
                          Suggested Category: {aiResult.predicted_category_name} ({(aiResult.confidence * 100).toFixed(0)}%)
                        </div>
                        <div className="text-amber-800">{aiResult.notice}</div>
                      </div>
                    )}
                  </div>

                  <form onSubmit={handleCreatePickup} className="space-y-3">
                    <div id="prices">
                      <label className="block text-xs font-semibold text-slate-600">
                        Step 2: Confirm or Correct Waste Category
                      </label>
                      <select
                        value={selectedCat}
                        onChange={(e) => setSelectedCat(e.target.value)}
                        className="w-full border rounded px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-700"
                      >
                        {categories.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.name} — ₹{c.rate_per_kg}/kg {c.is_hazardous ? "⚠️ (Hazardous)" : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    {activeCategoryObj?.safety_guidance && (
                      <div className="p-3 bg-orange-50 border border-orange-200 rounded text-xs text-orange-900 flex gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-orange-600" />
                        <span><strong>{t.safetyTitle}:</strong> {activeCategoryObj.safety_guidance}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600">
                          Approx. Weight (kg)
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          min="0.5"
                          value={estWeight}
                          onChange={(e) => setEstWeight(e.target.value)}
                          className="w-full border rounded px-3 py-2 mt-1 text-sm"
                          required
                        />
                      </div>
                      <div className="bg-emerald-50 p-3 rounded border border-emerald-200">
                        <div className="text-xs text-emerald-800">Estimated Value</div>
                        <div className="text-lg font-bold text-emerald-950">₹{indicativeValue}</div>
                        <div className="text-[10px] text-emerald-700">{t.indicativeNote}</div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600">
                        Collection Address
                      </label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full border rounded px-3 py-2 mt-1 text-sm"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-2.5 rounded text-sm transition-colors shadow-sm"
                    >
                      Submit Pickup Request
                    </button>
                  </form>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
                  <h2 className="text-lg font-bold">My Pickup Requests &amp; Receipts</h2>
                  {pickups.length === 0 ? (
                    <p className="text-sm text-slate-500">No pickups requested yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {pickups.map((p) => (
                        <div key={p.id} className="p-3 border rounded-lg space-y-1 text-sm">
                          <div className="flex justify-between font-semibold">
                            <span>{p.category_name} ({p.tracking_code})</span>
                            <span className="px-2 py-0.5 text-xs rounded bg-slate-100 font-mono">
                              {p.status}
                            </span>
                          </div>
                          <div className="text-xs text-slate-600">
                            Locked Rate: ₹{p.locked_rate_per_kg}/kg | Est: {p.estimated_weight_kg} kg (₹{p.estimated_value_inr})
                          </div>
                          {p.actual_weight_kg && (
                            <div className="text-xs font-bold text-emerald-800">
                              Verified Weight: {p.actual_weight_kg} kg → Final Receipt: ₹{p.final_value_inr}
                            </div>
                          )}
                          {p.collector_name && (
                            <div className="text-xs text-slate-700">
                              Assigned Collector: {p.collector_name} ({p.collector_badge || "Pending Admin Verification"})
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Collector / Kabadiwala Portal */}
            {user.role === "COLLECTOR" && (
              <div
                id="collector_queue"
                className={`bg-white p-6 rounded-xl shadow-sm border space-y-4 transition-all duration-300 ${
                  highlightTarget === "collector_queue" ? "ring-4 ring-emerald-500 ring-offset-2" : ""
                }`}
              >
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <Truck className="w-5 h-5 text-emerald-700" />
                    Collector Pickup Queue &amp; Digital Weighing
                  </h2>
                  <span className="text-xs px-2.5 py-1 rounded bg-emerald-100 text-emerald-900 font-mono">
                    Badge: {user.econect_badge_id || "UNVERIFIED"}
                  </span>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {pickups.map((p) => (
                    <div key={p.id} className="p-4 border rounded-lg space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold">{p.category_name}</span>
                        <span className="text-xs bg-slate-100 px-2 py-1 rounded font-mono">{p.status}</span>
                      </div>
                      <div className="text-xs text-slate-600">
                        Tracking ID: <span className="font-mono">{p.tracking_code}</span>
                      </div>
                      <div className="text-xs text-slate-600">Address: {p.pickup_address}</div>
                      <div className="text-xs">
                        Est. Weight: {p.estimated_weight_kg} kg @ ₹{p.locked_rate_per_kg}/kg (₹{p.estimated_value_inr})
                      </div>

                      <div className="pt-2 flex flex-wrap gap-2 items-center">
                        {p.status === "REQUESTED" && (
                          <button
                            onClick={() => collectorAction(p.id, "accept")}
                            className="bg-emerald-700 text-white text-xs px-3 py-1.5 rounded hover:bg-emerald-800 transition-colors"
                          >
                            1. Accept Pickup
                          </button>
                        )}
                        {p.status === "ACCEPTED" && (
                          <button
                            onClick={() => collectorAction(p.id, "arrive")}
                            className="bg-blue-700 text-white text-xs px-3 py-1.5 rounded hover:bg-blue-800 transition-colors"
                          >
                            2. Mark Arrived
                          </button>
                        )}
                        {p.status === "ARRIVED" && (
                          <div className="flex gap-2 items-center">
                            <input
                              type="number"
                              step="0.1"
                              placeholder="Actual kg"
                              value={weighInputs[p.id] || ""}
                              onChange={(e) =>
                                setWeighInputs({ ...weighInputs, [p.id]: e.target.value })
                              }
                              className="border rounded px-2 py-1 text-xs w-28"
                            />
                            <button
                              onClick={() => collectorAction(p.id, "weigh")}
                              className="bg-amber-600 hover:bg-amber-700 text-white text-xs px-3 py-1.5 rounded flex items-center gap-1 transition-colors"
                            >
                              <Scale className="w-3.5 h-3.5" /> 3. Record Weight
                            </button>
                          </div>
                        )}
                        {p.status === "WEIGHED" && (
                          <button
                            onClick={() => collectorAction(p.id, "complete")}
                            className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs px-3 py-1.5 rounded flex items-center gap-1 transition-colors"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> 4. Complete &amp; Issue Receipt (₹{p.final_value_inr})
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Collection Centre Portal */}
            {user.role === "CENTRE" && (
              <div
                id="centre_inventory"
                className={`bg-white p-6 rounded-xl shadow-sm border space-y-4 transition-all duration-300 ${
                  highlightTarget === "centre_inventory" ? "ring-4 ring-emerald-500 ring-offset-2" : ""
                }`}
              >
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Warehouse className="w-5 h-5 text-emerald-700" />
                  Collection Centre Intake &amp; Sorted Inventory
                </h2>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter Tracking ID (e.g. ECO-WASTE-2026-001001)"
                    value={trackingInput}
                    onChange={(e) => setTrackingInput(e.target.value)}
                    className="border rounded px-3 py-2 text-sm flex-1"
                  />
                  <button
                    onClick={async () => {
                      try {
                        const r = await apiRequest(`/centres/receive/${trackingInput.trim()}`, { method: "POST" }, token);
                        setNotice(r.message);
                        refreshRoleData("CENTRE", token!);
                      } catch (e: any) {
                        setError(e.message);
                      }
                    }}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded text-sm font-semibold transition-colors"
                  >
                    Confirm Material Receipt at Centre
                  </button>
                </div>

                <div className="grid sm:grid-cols-3 gap-3 pt-2">
                  {centreInventory.map((item) => (
                    <div key={item.category_code} className="p-3 border rounded bg-slate-50">
                      <div className="text-xs text-slate-500">{item.category_code}</div>
                      <div className="font-bold">{item.category_name}</div>
                      <div className="text-emerald-800 font-semibold">{item.available_weight_kg} kg in stock</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Authorized Recycler Portal */}
            {user.role === "RECYCLER" && (
              <div
                id="recycler_portal"
                className={`bg-white p-6 rounded-xl shadow-sm border space-y-4 transition-all duration-300 ${
                  highlightTarget === "recycler_portal" ? "ring-4 ring-emerald-500 ring-offset-2" : ""
                }`}
              >
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Factory className="w-5 h-5 text-emerald-700" />
                  Authorized Recycler Consignment &amp; Recovery Confirmation
                </h2>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter Tracking ID (e.g. ECO-WASTE-2026-001001)"
                    value={trackingInput}
                    onChange={(e) => setTrackingInput(e.target.value)}
                    className="border rounded px-3 py-2 text-sm flex-1"
                  />
                  <button
                    onClick={async () => {
                      try {
                        const r = await apiRequest(`/recyclers/confirm/${trackingInput.trim()}`, { method: "POST" }, token);
                        setNotice(r.message);
                      } catch (e: any) {
                        setError(e.message);
                      }
                    }}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded text-sm font-semibold transition-colors"
                  >
                    Confirm Receipt &amp; Formal Processing
                  </button>
                </div>
              </div>
            )}

            {/* Admin Portal */}
            {user.role === "ADMIN" && adminStats && (
              <div
                id="admin_panel"
                className={`bg-white p-6 rounded-xl shadow-sm border space-y-4 transition-all duration-300 ${
                  highlightTarget === "admin_panel" ? "ring-4 ring-emerald-500 ring-offset-2" : ""
                }`}
              >
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-emerald-700" />
                  Platform Governance, Verification &amp; Analytics
                </h2>
                <div className="grid sm:grid-cols-4 gap-4">
                  <div className="p-4 bg-slate-50 border rounded">
                    <div className="text-xs text-slate-500">Total Users</div>
                    <div className="text-2xl font-bold">{adminStats.total_users}</div>
                  </div>
                  <div className="p-4 bg-slate-50 border rounded">
                    <div className="text-xs text-slate-500">Completed Pickups</div>
                    <div className="text-2xl font-bold">{adminStats.completed_pickups} / {adminStats.total_pickups}</div>
                  </div>
                  <div className="p-4 bg-slate-50 border rounded">
                    <div className="text-xs text-slate-500">Verified Weight Recovered</div>
                    <div className="text-2xl font-bold text-emerald-800">{adminStats.total_verified_weight_kg} kg</div>
                  </div>
                  <div className="p-4 bg-slate-50 border rounded">
                    <div className="text-xs text-slate-500">Recorded Transactions</div>
                    <div className="text-2xl font-bold text-emerald-800">₹{adminStats.total_transaction_value_inr}</div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Traceability Ledger Inspection */}
        <section
          id="traceability"
          className={`bg-white p-6 rounded-xl shadow-sm border space-y-4 transition-all duration-300 ${
            highlightTarget === "traceability" ? "ring-4 ring-emerald-500 ring-offset-2" : ""
          }`}
        >
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Search className="w-5 h-5 text-emerald-700" />
            {t.traceability}
          </h2>
          <form onSubmit={handleTraceLookup} className="flex gap-2">
            <input
              type="text"
              placeholder="Enter Waste ID (e.g., ECO-WASTE-2026-001001)"
              value={trackingInput}
              onChange={(e) => setTrackingInput(e.target.value)}
              className="border rounded px-3 py-2 text-sm flex-1"
              required
            />
            <button
              type="submit"
              className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded text-sm font-semibold transition-colors"
            >
              Inspect Chain of Custody
            </button>
          </form>

          {journeyData && (
            <div className="p-4 bg-slate-50 rounded-lg border space-y-3">
              <div className="text-sm font-bold">
                {journeyData.tracking_code} — {journeyData.category_name} (Verified: {journeyData.actual_weight_kg ?? journeyData.estimated_weight_kg} kg)
              </div>
              <ol className="relative border-l-2 border-emerald-600 ml-3 space-y-3 pl-4">
                {journeyData.events.map((ev: any) => (
                  <li key={ev.id} className="text-xs space-y-0.5">
                    <div className="font-bold text-emerald-900">{ev.event_type}</div>
                    <div className="text-slate-700">{ev.notes}</div>
                    <div className="text-slate-400">{new Date(ev.timestamp).toLocaleString()}</div>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </section>
      </main>

      {/* Floating AI Chat Bot Symbol */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {/* Chat Drawer Window */}
        {isChatOpen && (
          <div className="w-[360px] sm:w-[400px] h-[520px] bg-white rounded-2xl shadow-2xl border border-emerald-100 flex flex-col overflow-hidden mb-3 animate-in fade-in slide-in-from-bottom-5 duration-200">
            {/* Chat Header */}
            <div className="bg-emerald-900 text-white px-4 py-3.5 flex justify-between items-center shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-800 flex items-center justify-center border border-emerald-700">
                  <Bot className="w-4 h-4 text-emerald-300" />
                </div>
                <div>
                  <h3 className="font-bold text-sm flex items-center gap-1.5">
                    <span>ECONECT AI Navigator</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  </h3>
                  <p className="text-[11px] text-emerald-200">Smart App Navigation &amp; SIH Assistant</p>
                </div>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="text-emerald-300 hover:text-white p-1 rounded transition-colors"
                title="Close Chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50 text-xs">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 shadow-xs whitespace-pre-line leading-relaxed ${
                      msg.sender === "user"
                        ? "bg-emerald-700 text-white rounded-tr-xs"
                        : "bg-white text-slate-800 border border-slate-200 rounded-tl-xs"
                    }`}
                  >
                    {msg.text}
                  </div>

                  {/* Navigation Buttons attached to Bot message */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2 max-w-[90%]">
                      {msg.actions.map((act, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleNavigation(act.target)}
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-full px-2.5 py-1 text-[11px] font-medium flex items-center gap-1 transition-all shadow-xs"
                        >
                          <span>{act.label}</span>
                          <ArrowRight className="w-3 h-3 text-emerald-700" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {chatLoading && (
                <div className="flex items-center gap-2 text-slate-500 italic text-[11px] p-2 bg-white rounded-lg border border-slate-200 w-fit">
                  <RefreshCw className="w-3 h-3 animate-spin text-emerald-600" />
                  <span>Thinking...</span>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Quick Suggestion Chips */}
            <div className="px-3 py-2 bg-white border-t border-slate-100 flex gap-1.5 overflow-x-auto text-[11px] text-slate-600 scrollbar-none">
              <button
                onClick={() => handleSendChatMessage("How do I book a scrap pickup?")}
                className="whitespace-nowrap bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-full shrink-0"
              >
                📦 Book pickup
              </button>
              <button
                onClick={() => handleSendChatMessage("Validate user by email and mobile")}
                className="whitespace-nowrap bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-full shrink-0"
              >
                📱 Validate user
              </button>
              <button
                onClick={() => handleSendChatMessage("How does collector digital weighing work?")}
                className="whitespace-nowrap bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-full shrink-0"
              >
                ⚖️ Collector weighing
              </button>
              <button
                onClick={() => handleSendChatMessage("Track waste journey")}
                className="whitespace-nowrap bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-full shrink-0"
              >
                🔍 Traceability
              </button>
            </div>

            {/* Chat Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendChatMessage();
              }}
              className="p-3 bg-white border-t border-slate-200 flex gap-2 items-center"
            >
              <input
                type="text"
                placeholder="Ask for navigation or platform help..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-700 bg-slate-50"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || chatLoading}
                className="bg-emerald-700 hover:bg-emerald-800 text-white p-2 rounded-lg transition-colors disabled:opacity-40"
                title="Send"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* Circular Bot Symbol Button */}
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-full p-4 shadow-xl flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 relative group"
          title="ECONECT AI Assistant — Click for App Navigation & Help"
        >
          {isChatOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <>
              <Bot className="w-6 h-6" />
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white"></span>
              </span>
            </>
          )}

          {/* Hover Tooltip */}
          {!isChatOpen && (
            <span className="absolute right-16 bg-slate-900 text-white text-xs px-2.5 py-1.5 rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Need Help? Ask AI Navigator
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
