const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export function normalizePhone(raw: string): string {
  const digits = raw.replace(/[\s\-\(\)\.]/g, "");
  if (digits.startsWith("+91")) return digits.slice(3);
  if (digits.startsWith("91") && digits.length === 12) return digits.slice(2);
  if (digits.startsWith("0") && digits.length === 11) return digits.slice(1);
  return digits;
}

export function isValidIndianMobile(raw: string): boolean {
  const digits = normalizePhone(raw);
  return /^[6-9]\d{9}$/.test(digits);
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// Initial seeded demo categories
const DEFAULT_CATEGORIES = [
  { id: "cat-1", code: "PAPER", name: "Paper", is_hazardous: false, rate_per_kg: 14.0, currency: "INR", safety_guidance: "Keep dry and bundled." },
  { id: "cat-2", code: "CARDBOARD", name: "Cardboard", is_hazardous: false, rate_per_kg: 12.0, currency: "INR", safety_guidance: "Flatten boxes before pickup." },
  { id: "cat-3", code: "PET_PLASTIC", name: "PET plastic", is_hazardous: false, rate_per_kg: 18.0, currency: "INR", safety_guidance: "Empty and rinse bottles." },
  { id: "cat-4", code: "OTHER_PLASTIC", name: "Other plastic", is_hazardous: false, rate_per_kg: 10.0, currency: "INR", safety_guidance: "Separate hard and soft plastics." },
  { id: "cat-5", code: "METAL", name: "Metal", is_hazardous: false, rate_per_kg: 32.0, currency: "INR", safety_guidance: "Avoid sharp unshielded edges." },
  { id: "cat-6", code: "GLASS", name: "Glass", is_hazardous: false, rate_per_kg: 4.0, currency: "INR", safety_guidance: "Pack broken glass in rigid cardboard." },
  { id: "cat-7", code: "EWASTE_GENERAL", name: "Electronic waste", is_hazardous: true, rate_per_kg: 25.0, currency: "INR", safety_guidance: "Do not dismantle sealed appliances." },
  { id: "cat-8", code: "MOBILE_PHONES", name: "Mobile phones", is_hazardous: true, rate_per_kg: 150.0, currency: "INR", safety_guidance: "Factory-reset device and remove SIM/SD cards." },
  { id: "cat-9", code: "COMPUTERS_LAPTOPS", name: "Computers and laptops", is_hazardous: true, rate_per_kg: 220.0, currency: "INR", safety_guidance: "Wipe storage media; keep battery intact." },
  { id: "cat-10", code: "PCB", name: "Printed circuit boards", is_hazardous: true, rate_per_kg: 180.0, currency: "INR", safety_guidance: "Handle by edges; never burn or acid-leach." },
  { id: "cat-11", code: "CABLES_WIRES", name: "Cables and wires", is_hazardous: false, rate_per_kg: 65.0, currency: "INR", safety_guidance: "Do not open-burn PVC insulation." },
  { id: "cat-12", code: "BATTERIES", name: "Batteries", is_hazardous: true, rate_per_kg: 55.0, currency: "INR", safety_guidance: "HAZARD: Tape terminals of lithium/lead-acid batteries; store away from heat." },
  { id: "cat-13", code: "CRT_LCD_DISPLAYS", name: "CRT/LCD displays", is_hazardous: true, rate_per_kg: 40.0, currency: "INR", safety_guidance: "HAZARD: Do not break CRT glass (contains lead/mercury phosphor)." },
  { id: "cat-14", code: "MOTORS_COMPONENTS", name: "Motors and electronic components", is_hazardous: false, rate_per_kg: 48.0, currency: "INR", safety_guidance: "Drain any residual lubricants." },
  { id: "cat-15", code: "OTHER_SCRAP", name: "Other scrap", is_hazardous: false, rate_per_kg: 8.0, currency: "INR", safety_guidance: "General mixed recyclable material." },
];

const DEFAULT_USERS = [
  { id: "usr-1", full_name: "Aarav Sharma (Citizen)", email: "citizen@econect.in", phone: "9876543210", role: "CITIZEN", verification_status: "VERIFIED", econect_badge_id: null, address: "Indiranagar, Bengaluru", service_area: null },
  { id: "usr-2", full_name: "Ramesh Kumar (Kabadiwala)", email: "collector@econect.in", phone: "9876543211", role: "COLLECTOR", verification_status: "VERIFIED", econect_badge_id: "ECO-COL-2026-001", address: "Indiranagar & Domlur", service_area: "East Zone" },
  { id: "usr-3", full_name: "GreenHub Collection Centre", email: "centre@econect.in", phone: "9876543212", role: "CENTRE", verification_status: "VERIFIED", econect_badge_id: "ECO-CTR-2026-010", address: "Peenya Industrial Area", service_area: "Industrial Corridor" },
  { id: "usr-4", full_name: "EcoCycle Authorized Recycler", email: "recycler@econect.in", phone: "9876543213", role: "RECYCLER", verification_status: "VERIFIED", econect_badge_id: "ECO-REC-2026-099", address: "Dobbaspet E-Waste Park", service_area: "State Recycling Grid" },
  { id: "usr-5", full_name: "SIH Platform Admin", email: "admin@econect.in", phone: "9876543214", role: "ADMIN", verification_status: "VERIFIED", econect_badge_id: "ECO-ADM-001", address: "Bengaluru HQ", service_area: "Pan-India" },
];

function getStoredState() {
  try {
    const rawUsers = localStorage.getItem("econect_mock_users");
    const rawPickups = localStorage.getItem("econect_mock_pickups");
    const rawJourneys = localStorage.getItem("econect_mock_journeys");
    const rawInventory = localStorage.getItem("econect_mock_inventory");

    const users = rawUsers ? JSON.parse(rawUsers) : DEFAULT_USERS;
    const pickups = rawPickups ? JSON.parse(rawPickups) : [
      {
        id: "p-init-1",
        tracking_code: "ECO-WASTE-2026-001001",
        waste_record_id: "w-1",
        category_code: "BATTERIES",
        category_name: "Batteries",
        is_hazardous: true,
        safety_guidance: "HAZARD: Tape terminals of lithium/lead-acid batteries; store away from heat.",
        pickup_address: "12th Main, Indiranagar, Bengaluru",
        estimated_weight_kg: 5.0,
        actual_weight_kg: 5.2,
        locked_rate_per_kg: 55.0,
        estimated_value_inr: 275.0,
        final_value_inr: 286.0,
        status: "COMPLETED",
        citizen_name: "Aarav Sharma (Citizen)",
        collector_name: "Ramesh Kumar (Kabadiwala)",
        collector_badge: "ECO-COL-2026-001",
        created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
      }
    ];

    const journeys = rawJourneys ? JSON.parse(rawJourneys) : {
      "ECO-WASTE-2026-001001": {
        tracking_code: "ECO-WASTE-2026-001001",
        category_name: "Batteries",
        estimated_weight_kg: 5.0,
        actual_weight_kg: 5.2,
        events: [
          { id: "ev-1", event_type: "CREATED", location_note: "12th Main, Indiranagar, Bengaluru", quantity_kg: 5.0, notes: "Citizen logged Batteries (~5.0 kg)", timestamp: new Date(Date.now() - 3600000 * 4).toISOString() },
          { id: "ev-2", event_type: "WEIGHED", location_note: "12th Main, Indiranagar, Bengaluru", quantity_kg: 5.2, notes: "Verified weight: 5.2 kg @ INR 55.0/kg", timestamp: new Date(Date.now() - 3600000 * 2).toISOString() },
          { id: "ev-3", event_type: "COLLECTED", location_note: "12th Main, Indiranagar, Bengaluru", quantity_kg: 5.2, notes: "Pickup completed. Final receipt value: INR 286.0", timestamp: new Date(Date.now() - 3600000 * 1).toISOString() },
        ]
      }
    };

    const inventory = rawInventory ? JSON.parse(rawInventory) : [
      { category_code: "BATTERIES", category_name: "Batteries", available_weight_kg: 18.5 },
      { category_code: "COMPUTERS_LAPTOPS", category_name: "Computers and laptops", available_weight_kg: 42.0 },
      { category_code: "PAPER", category_name: "Paper", available_weight_kg: 110.0 },
    ];

    return { users, pickups, journeys, inventory };
  } catch {
    return { users: DEFAULT_USERS, pickups: [], journeys: {}, inventory: [] };
  }
}

function saveStoredState(state: { users?: any[]; pickups?: any[]; journeys?: any; inventory?: any[] }) {
  try {
    if (state.users) localStorage.setItem("econect_mock_users", JSON.stringify(state.users));
    if (state.pickups) localStorage.setItem("econect_mock_pickups", JSON.stringify(state.pickups));
    if (state.journeys) localStorage.setItem("econect_mock_journeys", JSON.stringify(state.journeys));
    if (state.inventory) localStorage.setItem("econect_mock_inventory", JSON.stringify(state.inventory));
  } catch {
    // Ignore storage errors
  }
}

// In-memory OTP storage for client-side demo fallback
const CLIENT_OTP_STORE: Record<string, { otp: string; time: number }> = {};

function handleMockRequest(path: string, options: RequestInit = {}, token?: string | null): any {
  const method = (options.method || "GET").toUpperCase();
  const body = options.body ? (typeof options.body === "string" ? JSON.parse(options.body) : {}) : {};
  const state = getStoredState();

  // /prices
  if (path === "/prices" && method === "GET") {
    return DEFAULT_CATEGORIES;
  }

  // /auth/login
  if (path === "/auth/login" && method === "POST") {
    const { email } = body;
    const user = state.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      throw new Error("Invalid email or password");
    }
    const fakeToken = `mock-jwt-${user.id}-${Date.now()}`;
    return { access_token: fakeToken, user };
  }

  // /auth/me
  if (path === "/auth/me" && method === "GET") {
    if (!token) throw new Error("Not authenticated");
    const userId = token.split("-")[2] || "usr-1";
    const user = state.users.find((u) => u.id === userId) || state.users[0];
    return user;
  }

  // /auth/validate-user (Email and Mobile Number Validation)
  if (path === "/auth/validate-user" && method === "POST") {
    const { email, phone } = body;
    if (!email || !isValidEmail(email)) {
      throw new Error("Please enter a valid email address.");
    }
    const norm = normalizePhone(phone || "");
    if (!isValidIndianMobile(phone || "")) {
      throw new Error("Invalid mobile number format. Please enter a 10-digit Indian mobile number (e.g., 9876543210 or +91 9876543210).");
    }

    const matchedUser = state.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!matchedUser) {
      return {
        is_valid: false,
        exists: false,
        message: `No account registered with email '${email}'. Please register or check the spelling.`,
        user: null,
        normalized_phone: norm,
        verification_status: null,
        econect_badge_id: null,
        can_login: false,
      };
    }

    const userNormPhone = normalizePhone(matchedUser.phone);
    if (userNormPhone !== norm) {
      return {
        is_valid: false,
        exists: true,
        message: "Mobile number does not match registered profile for this email address.",
        user: null,
        normalized_phone: norm,
        verification_status: matchedUser.verification_status,
        econect_badge_id: null,
        can_login: false,
      };
    }

    return {
      is_valid: true,
      exists: true,
      message: `User identity verified for ${matchedUser.full_name} (${matchedUser.role}).`,
      user: matchedUser,
      normalized_phone: norm,
      verification_status: matchedUser.verification_status || "VERIFIED",
      econect_badge_id: matchedUser.econect_badge_id,
      can_login: true,
    };
  }

  // /auth/send-otp
  if (path === "/auth/send-otp" && method === "POST") {
    const { email, phone } = body;
    const norm = normalizePhone(phone || "");
    if (!isValidIndianMobile(phone || "")) {
      throw new Error("Invalid mobile number format. Please provide a valid 10-digit number.");
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const key = `${email.toLowerCase()}:${norm}`;
    CLIENT_OTP_STORE[key] = { otp: code, time: Date.now() };

    return {
      message: `Verification OTP sent successfully to mobile +91-${norm} and ${email}.`,
      email,
      phone: norm,
      demo_otp: code,
    };
  }

  // /auth/verify-otp
  if (path === "/auth/verify-otp" && method === "POST") {
    const { email, phone, otp } = body;
    const norm = normalizePhone(phone || "");
    const key = `${email.toLowerCase()}:${norm}`;
    const stored = CLIENT_OTP_STORE[key];

    if (otp !== "123456" && (!stored || stored.otp !== otp)) {
      throw new Error("Invalid OTP code. Please enter the correct 6-digit OTP (or use demo OTP 123456).");
    }

    const userIndex = state.users.findIndex((u) => u.email.toLowerCase() === email.toLowerCase());
    let updatedUser = null;
    if (userIndex !== -1) {
      state.users[userIndex].verification_status = "VERIFIED";
      if (!state.users[userIndex].econect_badge_id && state.users[userIndex].role !== "CITIZEN") {
        state.users[userIndex].econect_badge_id = `ECO-${state.users[userIndex].role.slice(0, 3)}-2026-${Math.floor(100 + Math.random() * 900)}`;
      }
      updatedUser = state.users[userIndex];
      saveStoredState({ users: state.users });
    }

    return {
      verified: true,
      message: updatedUser
        ? `Mobile & Email verified successfully! ${updatedUser.full_name} is now VERIFIED.`
        : "Email and mobile number verified successfully.",
      user: updatedUser,
      econect_badge_id: updatedUser?.econect_badge_id || null,
    };
  }

  // /citizen/pickups
  if (path === "/citizen/pickups" && method === "GET") {
    return state.pickups;
  }

  // /collector/pickups
  if (path === "/collector/pickups" && method === "GET") {
    return state.pickups;
  }

  // /pickups (create pickup)
  if (path === "/pickups" && method === "POST") {
    const { category_code, estimated_weight_kg, pickup_address } = body;
    const cat = DEFAULT_CATEGORIES.find((c) => c.code === category_code) || DEFAULT_CATEGORIES[0];
    const rate = cat.rate_per_kg;
    const count = state.pickups.length + 1002;
    const trackingCode = `ECO-WASTE-2026-${String(count).padStart(6, "0")}`;
    const estVal = Number((estimated_weight_kg * rate).toFixed(2));

    const newPickup = {
      id: `p-${Date.now()}`,
      tracking_code: trackingCode,
      waste_record_id: `wr-${Date.now()}`,
      category_code: cat.code,
      category_name: cat.name,
      is_hazardous: cat.is_hazardous,
      safety_guidance: cat.safety_guidance,
      pickup_address,
      estimated_weight_kg,
      actual_weight_kg: null,
      locked_rate_per_kg: rate,
      estimated_value_inr: estVal,
      final_value_inr: null,
      status: "REQUESTED",
      citizen_name: "Aarav Sharma (Citizen)",
      collector_name: null,
      collector_badge: null,
      created_at: new Date().toISOString(),
    };

    state.pickups.unshift(newPickup);
    state.journeys[trackingCode] = {
      tracking_code: trackingCode,
      category_name: cat.name,
      estimated_weight_kg,
      actual_weight_kg: null,
      events: [
        {
          id: `ev-${Date.now()}`,
          event_type: "CREATED",
          location_note: pickup_address,
          quantity_kg: estimated_weight_kg,
          notes: `Citizen booked ${cat.name} (~${estimated_weight_kg} kg)`,
          timestamp: new Date().toISOString(),
        },
      ],
    };
    saveStoredState({ pickups: state.pickups, journeys: state.journeys });

    return {
      pickup_id: newPickup.id,
      tracking_code: trackingCode,
      status: "REQUESTED",
      locked_rate_per_kg: rate,
      estimated_value_inr: estVal,
    };
  }

  // Collector actions
  const acceptMatch = path.match(/^\/pickups\/([^/]+)\/accept$/);
  if (acceptMatch && method === "POST") {
    const pickupId = acceptMatch[1];
    const p = state.pickups.find((x) => x.id === pickupId);
    if (!p) throw new Error("Pickup not found");
    p.status = "ACCEPTED";
    p.collector_name = "Ramesh Kumar (Kabadiwala)";
    p.collector_badge = "ECO-COL-2026-001";
    saveStoredState({ pickups: state.pickups });
    return p;
  }

  const arriveMatch = path.match(/^\/pickups\/([^/]+)\/arrive$/);
  if (arriveMatch && method === "POST") {
    const pickupId = arriveMatch[1];
    const p = state.pickups.find((x) => x.id === pickupId);
    if (!p) throw new Error("Pickup not found");
    p.status = "ARRIVED";
    saveStoredState({ pickups: state.pickups });
    return p;
  }

  const weighMatch = path.match(/^\/pickups\/([^/]+)\/weigh$/);
  if (weighMatch && method === "POST") {
    const pickupId = weighMatch[1];
    const p = state.pickups.find((x) => x.id === pickupId);
    if (!p) throw new Error("Pickup not found");
    const weight = parseFloat(body.actual_weight_kg || "5");
    p.actual_weight_kg = weight;
    p.final_value_inr = Number((weight * p.locked_rate_per_kg).toFixed(2));
    p.status = "WEIGHED";

    if (state.journeys[p.tracking_code]) {
      state.journeys[p.tracking_code].actual_weight_kg = weight;
      state.journeys[p.tracking_code].events.push({
        id: `ev-${Date.now()}`,
        event_type: "WEIGHED",
        location_note: p.pickup_address,
        quantity_kg: weight,
        notes: `Verified weight: ${weight} kg @ INR ${p.locked_rate_per_kg}/kg`,
        timestamp: new Date().toISOString(),
      });
    }
    saveStoredState({ pickups: state.pickups, journeys: state.journeys });
    return p;
  }

  const completeMatch = path.match(/^\/pickups\/([^/]+)\/complete$/);
  if (completeMatch && method === "POST") {
    const pickupId = completeMatch[1];
    const p = state.pickups.find((x) => x.id === pickupId);
    if (!p) throw new Error("Pickup not found");
    p.status = "COMPLETED";

    if (state.journeys[p.tracking_code]) {
      state.journeys[p.tracking_code].events.push({
        id: `ev-${Date.now()}`,
        event_type: "COLLECTED",
        location_note: p.pickup_address,
        quantity_kg: p.actual_weight_kg,
        notes: `Pickup completed. Final receipt value: INR ${p.final_value_inr}`,
        timestamp: new Date().toISOString(),
      });
    }
    saveStoredState({ pickups: state.pickups, journeys: state.journeys });
    return p;
  }

  // /centres/inventory
  if (path === "/centres/inventory" && method === "GET") {
    return state.inventory;
  }

  // /centres/receive/:code
  const receiveMatch = path.match(/^\/centres\/receive\/([^/]+)$/);
  if (receiveMatch && method === "POST") {
    const code = receiveMatch[1];
    const p = state.pickups.find((x) => x.tracking_code === code);
    const weight = p?.actual_weight_kg || p?.estimated_weight_kg || 10.0;
    const catCode = p?.category_code || "BATTERIES";

    let item = state.inventory.find((i) => i.category_code === catCode);
    if (!item) {
      item = { category_code: catCode, category_name: p?.category_name || "Scrap Material", available_weight_kg: 0 };
      state.inventory.push(item);
    }
    item.available_weight_kg = Number((item.available_weight_kg + weight).toFixed(2));

    if (state.journeys[code]) {
      state.journeys[code].events.push({
        id: `ev-${Date.now()}`,
        event_type: "RECEIVED_AT_CENTRE",
        location_note: "GreenHub Collection Centre, Peenya",
        quantity_kg: weight,
        notes: `Received and sorted at GreenHub Collection Centre`,
        timestamp: new Date().toISOString(),
      });
    }
    saveStoredState({ inventory: state.inventory, journeys: state.journeys });
    return { message: `Material ${code} received into Centre Inventory (+${weight} kg).`, tracking_code: code };
  }

  // /recyclers/confirm/:code
  const confirmMatch = path.match(/^\/recyclers\/confirm\/([^/]+)$/);
  if (confirmMatch && method === "POST") {
    const code = confirmMatch[1];
    const p = state.pickups.find((x) => x.tracking_code === code);
    const weight = p?.actual_weight_kg || p?.estimated_weight_kg || 10.0;

    if (state.journeys[code]) {
      state.journeys[code].events.push(
        {
          id: `ev-rec-${Date.now()}`,
          event_type: "RECEIVED_BY_RECYCLER",
          location_note: "EcoCycle Authorized Recycler, Dobbaspet",
          quantity_kg: weight,
          notes: "Consignment received at EcoCycle Authorized Recycler",
          timestamp: new Date().toISOString(),
        },
        {
          id: `ev-proc-${Date.now()}`,
          event_type: "PROCESSING_CONFIRMED",
          location_note: "EcoCycle Authorized Recycler, Dobbaspet",
          quantity_kg: weight,
          notes: "Formal material recovery & safe recycling confirmed",
          timestamp: new Date().toISOString(),
        }
      );
    }
    saveStoredState({ journeys: state.journeys });
    return { message: `Formal recycling and material processing confirmed for ${code}.`, tracking_code: code };
  }

  // /waste/:code/journey
  const journeyMatch = path.match(/^\/waste\/([^/]+)\/journey$/);
  if (journeyMatch && method === "GET") {
    const code = journeyMatch[1];
    if (state.journeys[code]) {
      return state.journeys[code];
    }
    throw new Error(`Waste tracking ID '${code}' not found in registry.`);
  }

  // /admin/analytics
  if (path === "/admin/analytics" && method === "GET") {
    const completed = state.pickups.filter((p) => p.status === "COMPLETED");
    const totalKg = completed.reduce((acc, p) => acc + (p.actual_weight_kg || 0), 0);
    const totalInr = completed.reduce((acc, p) => acc + (p.final_value_inr || 0), 0);
    return {
      total_users: state.users.length,
      total_pickups: state.pickups.length,
      completed_pickups: completed.length,
      total_verified_weight_kg: Number(totalKg.toFixed(2)),
      total_transaction_value_inr: Number(totalInr.toFixed(2)),
      users: state.users,
    };
  }

  // /waste/classify
  if (path === "/waste/classify" && method === "POST") {
    return {
      predicted_category_code: "BATTERIES",
      predicted_category_name: "Batteries",
      confidence: 0.94,
      alternatives: [
        { code: "EWASTE_GENERAL", name: "Electronic waste", score: 0.81 },
        { code: "CABLES_WIRES", name: "Cables and wires", score: 0.65 },
      ],
      model_name: "Safe Image AI Assistant (SIH 2026)",
      is_demo_fallback: true,
      notice: "Image analysis identified Batteries. Indicative rate: ₹55/kg. Please observe hazardous terminal taping rules.",
    };
  }

  // /ai/chat
  if (path === "/ai/chat" && method === "POST") {
    const msg = (body.message || "").toLowerCase().trim();
    const actions = [];

    if (msg.includes("book") || msg.includes("pickup") || msg.includes("sell") || msg.includes("request")) {
      actions.push({ target: "pickup_form", label: "👉 Go to Book Pickup", description: "Opens pickup request form" });
      return {
        reply: "To book a scrap pickup: 1) Select or AI-scan your waste category. 2) Enter estimated weight. 3) Provide your pickup address. Click the action button below to jump straight to the booking form!",
        navigation_actions: actions,
        suggested_prompts: ["How does collector weighing work?", "Validate user by email and phone", "Track waste journey", "What are indicative scrap rates?"],
      };
    }

    if (msg.includes("weigh") || msg.includes("collector") || msg.includes("kabadiwala") || msg.includes("arrive")) {
      actions.push({ target: "collector_queue", label: "👉 Go to Collector Queue", description: "View collector pickup tasks" });
      actions.push({ target: "switch_collector", label: "🔄 Switch to Kabadiwala Demo", description: "Log in as Kabadiwala" });
      return {
        reply: "Collectors use digital weighing on-site to lock verified weights and calculate exact payouts using protected rate snapshots. Use the navigation buttons below to view the Collector Queue!",
        navigation_actions: actions,
        suggested_prompts: ["Book a scrap pickup", "Validate user by email and phone", "Track waste journey"],
      };
    }

    if (msg.includes("validate") || msg.includes("verify") || msg.includes("phone") || msg.includes("mobile") || msg.includes("otp") || msg.includes("identity")) {
      actions.push({ target: "validate_user", label: "📱 Open User Validation", description: "Validate account by email and 10-digit phone" });
      return {
        reply: "You can validate any citizen or collector account instantly using their registered Email and 10-digit Indian Mobile number (+91). You can also request a 6-digit OTP code to verify accounts on the spot!",
        navigation_actions: actions,
        suggested_prompts: ["How do I book a pickup?", "Track waste journey", "What are scrap rates?"],
      };
    }

    if (msg.includes("track") || msg.includes("trace") || msg.includes("journey") || msg.includes("custody") || msg.includes("code")) {
      actions.push({ target: "traceability", label: "🔍 Go to Traceability Tracker", description: "Track waste chain of custody" });
      return {
        reply: "Every waste transaction is chronologically recorded on ECONECT: Citizen → Kabadiwala → Collection Centre → Recycler. Click below to inspect any waste tracking code!",
        navigation_actions: actions,
        suggested_prompts: ["Book a pickup", "Validate user by email & mobile", "View indicative rates"],
      };
    }

    if (msg.includes("rate") || msg.includes("price") || msg.includes("cost") || msg.includes("inr")) {
      actions.push({ target: "prices", label: "💰 View Category Rates", description: "Check transparent scrap rates" });
      return {
        reply: "Indicative rates on ECONECT: Computers ₹220/kg, Batteries ₹55/kg, Cables ₹65/kg, Metal ₹32/kg, Paper ₹14/kg. These locked snapshots protect informal collectors against price volatility.",
        navigation_actions: actions,
        suggested_prompts: ["Book a scrap pickup", "Validate user", "How does weighing work?"],
      };
    }

    // Default response
    actions.push({ target: "pickup_form", label: "📦 Book Scrap Pickup", description: "Request waste pickup" });
    actions.push({ target: "validate_user", label: "📱 Validate User Identity", description: "Validate mobile and email" });
    actions.push({ target: "traceability", label: "🔍 Trace Waste Journey", description: "Inspect custody ledger" });

    return {
      reply: "Hello! I am your ECONECT AI Guide. I can navigate you anywhere across the app, explain the digital weighing workflow, help you validate user identities by email & mobile number, or check scrap rates.",
      navigation_actions: actions,
      suggested_prompts: [
        "How do I book a scrap pickup?",
        "How does collector digital weighing work?",
        "Validate user by email and mobile",
        "Track waste chain of custody",
        "What are indicative scrap rates?",
      ],
    };
  }

  return {};
}

export async function apiRequest(path: string, options: RequestInit = {}, token?: string | null) {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.detail || `API Error (${res.status})`);
    }
    return data;
  } catch (err: any) {
    // If backend is unreachable (Failed to fetch, network error, or connection refused), fallback to client-side engine!
    const isNetworkError =
      err instanceof TypeError &&
      (err.message.includes("fetch") || err.message.includes("network") || err.message.includes("Failed"));

    if (isNetworkError) {
      try {
        return handleMockRequest(path, options, token);
      } catch (mockErr: any) {
        throw mockErr;
      }
    }
    throw err;
  }
}
