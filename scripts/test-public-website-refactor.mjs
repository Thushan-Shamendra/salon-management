import fs from "fs";
import path from "path";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

// Read .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
let adminEmail = process.env.ADMIN_EMAIL || "admin@salon.com";
let adminPassword = process.env.ADMIN_INITIAL_PASSWORD || "TemporaryPass123!";

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [k, ...v] = trimmed.split("=");
      const val = v.join("=").trim().replace(/^['"]|['"]$/g, "");
      if (k === "ADMIN_EMAIL") adminEmail = val;
      if (k === "ADMIN_INITIAL_PASSWORD") adminPassword = val;
    }
  }
}

async function runRefactorVerificationSuite() {
  console.log("==================================================");
  console.log("STARTING PUBLIC WEBSITE REFACTOR VERIFICATION SUITE");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  function report(name, condition, detail = "") {
    if (condition) {
      console.log(`✅ [PASS] ${name} ${detail ? `- ${detail}` : ""}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name} ${detail ? `- ${detail}` : ""}`);
      failed++;
    }
  }

  // 1. Verify Public Pages return 200 OK
  const publicRoutes = ["/", "/about", "/services", "/gallery", "/reviews", "/contact"];
  for (const route of publicRoutes) {
    try {
      const res = await fetch(`${BASE_URL}${route}`);
      report(`Public Route: ${route} is reachable`, res.status === 200, `Status: ${res.status}`);
    } catch (err) {
      report(`Public Route: ${route} is reachable`, false, err.message);
    }
  }

  // 2. Verify Removed Routes Return 404 Not Found
  const removedRoutes = [
    "/login",
    "/register",
    "/account",
    "/account/profile",
    "/account/appointments",
    "/appointments",
    "/community",
    "/admin/appointments",
    "/admin/customers",
    "/admin/community",
  ];
  for (const route of removedRoutes) {
    try {
      const res = await fetch(`${BASE_URL}${route}`);
      report(`Removed Route: ${route} returns 404`, res.status === 404, `Status: ${res.status}`);
    } catch (err) {
      report(`Removed Route: ${route} returns 404`, false, err.message);
    }
  }

  // 3. Verify Removed APIs Return 404 Not Found
  const removedApis = [
    { path: "/api/auth/register", method: "POST" },
    { path: "/api/appointments", method: "GET" },
    { path: "/api/account/profile", method: "GET" },
    { path: "/api/admin/appointments", method: "GET" },
    { path: "/api/admin/customers", method: "GET" },
    { path: "/api/reviews", method: "POST" },
  ];
  for (const api of removedApis) {
    try {
      const res = await fetch(`${BASE_URL}${api.path}`, { method: api.method });
      report(`Removed API: ${api.method} ${api.path} returns 404`, res.status === 404, `Status: ${res.status}`);
    } catch (err) {
      report(`Removed API: ${api.method} ${api.path} returns 404`, false, err.message);
    }
  }

  // 4. Verify Admin Login Page & Route Protection
  try {
    const res = await fetch(`${BASE_URL}/admin/login`);
    report("Admin Login: /admin/login is accessible", res.status === 200, `Status: ${res.status}`);
  } catch (err) {
    report("Admin Login: /admin/login is accessible", false, err.message);
  }

  try {
    const res = await fetch(`${BASE_URL}/admin`, { redirect: "manual" });
    const location = res.headers.get("location");
    report(
      "Admin Protection: Unauthenticated /admin redirects to /admin/login",
      (res.status === 307 || res.status === 302 || res.status === 308) && location?.includes("/admin/login"),
      `Status: ${res.status}, Location: ${location}`
    );
  } catch (err) {
    report("Admin Protection: Unauthenticated /admin redirects to /admin/login", false, err.message);
  }

  // 5. Test Admin Login and Settings Configuration
  let adminCookie = null;
  try {
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: adminEmail, password: adminPassword }),
    });
    const setCookie = loginRes.headers.get("set-cookie");
    if (setCookie) adminCookie = setCookie.split(";")[0];
    const loginData = await loginRes.json();
    report(
      "Admin Login API: Successfully authenticated admin",
      loginRes.status === 200 && loginData.success,
      `Status: ${loginRes.status}, Role: ${loginData.user?.role}`
    );
  } catch (err) {
    report("Admin Login API: Successfully authenticated admin", false, err.message);
  }

  // 6. Test Settings External System Persistence
  if (adminCookie) {
    try {
      const updateRes = await fetch(`${BASE_URL}/api/admin/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Cookie: adminCookie,
        },
        body: JSON.stringify({
          externalSystem: {
            loginUrl: "https://management.example.com/login",
            registerUrl: "https://management.example.com/register",
            bookingUrl: "https://management.example.com/appointments",
          },
        }),
      });
      const updateData = await updateRes.json();
      report(
        "Admin Settings: Configured externalSystem links",
        updateRes.status === 200 &&
          updateData.settings?.externalSystem?.bookingUrl === "https://management.example.com/appointments",
        `BookingUrl: ${updateData.settings?.externalSystem?.bookingUrl}`
      );

      // Verify public /api/settings exposes externalSystem
      const publicSettingsRes = await fetch(`${BASE_URL}/api/settings`);
      const publicSettingsData = await publicSettingsRes.json();
      report(
        "Public Settings API: Exposes externalSystem URLs",
        publicSettingsRes.status === 200 &&
          publicSettingsData.settings?.externalSystem?.bookingUrl === "https://management.example.com/appointments",
        `Public bookingUrl: ${publicSettingsData.settings?.externalSystem?.bookingUrl}`
      );
    } catch (err) {
      report("Admin Settings: Configure and read externalSystem links", false, err.message);
    }
  }

  console.log(`\n==================================================`);
  console.log(`REFACTOR VERIFICATION: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} TOTAL`);
  console.log(`==================================================\n`);

  if (failed > 0) process.exit(1);
}

runRefactorVerificationSuite().catch((err) => {
  console.error("Suite execution failed:", err);
  process.exit(1);
});
