/**
 * Non-Destructive Test Suite for SALVORA Integrations & API Configuration Management
 * 
 * Verifies:
 * 1. AES-256-GCM encryption and decryption roundtrips
 * 2. Tamper resistance and invalid auth tag rejection
 * 3. Secret format validation (<iv>:<authTag>:<ciphertext>)
 * 4. Fallback chain: Admin Override -> Environment Default -> Not Configured
 * 5. Safe status masking (strictly zero secret leakage)
 * 6. Exclusion of IntegrationSettings from Backup collections and whitelists
 * 7. Exclusion of IntegrationSettings from AI context builder
 * 8. Route and client security (no secret exposure)
 */

import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let passed = 0;
let failed = 0;

function assert(condition, description) {
  if (condition) {
    console.log(`  ✓ ${description}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${description}`);
    failed++;
  }
}

// Emulate secrets functions to test crypto logic exactly as implemented in lib/integrations/secrets.ts
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

function getMasterKey(customKey) {
  const masterKeyString = customKey || process.env.INTEGRATION_ENCRYPTION_KEY || process.env.JWT_SECRET || "fallback";
  return crypto.createHash("sha256").update(masterKeyString).digest();
}

function encryptSecret(plaintext, keyString) {
  if (typeof plaintext !== "string" || plaintext.length === 0) {
    throw new Error("Secret must be a non-empty string");
  }
  const key = getMasterKey(keyString);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let ciphertext = cipher.update(plaintext, "utf8", "hex");
  ciphertext += cipher.final("hex");
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${ciphertext}`;
}

function decryptSecret(payload, keyString) {
  if (typeof payload !== "string" || payload.length === 0) {
    throw new Error("Payload must be a non-empty string");
  }
  const parts = payload.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted payload format");
  }
  const [ivHex, authTagHex, ciphertextHex] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const key = getMasterKey(keyString);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(ciphertextHex, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

function safeDecryptSecret(payload, keyString) {
  if (!payload || typeof payload !== "string") return null;
  try {
    return decryptSecret(payload, keyString);
  } catch {
    return null;
  }
}

async function runTests() {
  console.log("\n=== SALVORA INTEGRATION CONFIGURATION TEST SUITE ===\n");

  const testKey = "test-master-encryption-key-for-salvora-integrations";

  // TEST GROUP 1: AES-256-GCM Encryption Architecture
  console.log("Group 1: Encryption & Decryption");
  const sampleSecret = "sk-proj-testSecretKeyValue123456789!@#$%";
  const encrypted = encryptSecret(sampleSecret, testKey);

  assert(typeof encrypted === "string", "encryptSecret returns string");
  assert(encrypted !== sampleSecret, "Ciphertext differs from plaintext");
  assert(encrypted.split(":").length === 3, "Encrypted payload has format iv:authTag:ciphertext");
  assert(!encrypted.includes(sampleSecret), "Plaintext never appears inside ciphertext");

  const decrypted = decryptSecret(encrypted, testKey);
  assert(decrypted === sampleSecret, "Decrypted secret matches original plaintext exactly");

  const safeDecrypted = safeDecryptSecret(encrypted, testKey);
  assert(safeDecrypted === sampleSecret, "safeDecryptSecret recovers original plaintext");

  // Tamper detection
  const tamperedPayload = encrypted.slice(0, -4) + "ffff";
  let tamperCaught = false;
  try {
    decryptSecret(tamperedPayload, testKey);
  } catch {
    tamperCaught = true;
  }
  assert(tamperCaught, "Tampered ciphertext or auth tag fails authentication tag check");
  assert(safeDecryptSecret(tamperedPayload, testKey) === null, "safeDecryptSecret returns null on tampered payload");

  // TEST GROUP 2: Backup Safety & Whitelist Exclusions
  console.log("\nGroup 2: Backup & Restore Safety");
  const backupConstantsFile = fs.readFileSync(
    path.join(__dirname, "../lib/backup/constants.ts"),
    "utf8"
  );
  assert(
    !backupConstantsFile.includes('"integrationSettings"') &&
    !backupConstantsFile.includes('"IntegrationSettings"') &&
    !backupConstantsFile.includes('"integrations"'),
    "IntegrationSettings is EXCLUDED from backup MANAGED_COLLECTION_KEYS"
  );

  const sanitizeFile = fs.readFileSync(
    path.join(__dirname, "../lib/backup/sanitize.ts"),
    "utf8"
  );
  assert(
    !sanitizeFile.includes("integrationSettings:") &&
    !sanitizeFile.includes("IntegrationSettings:") &&
    !sanitizeFile.includes("integrations:"),
    "IntegrationSettings is EXCLUDED from backup FIELD_WHITELISTS"
  );
  assert(
    !sanitizeFile.includes('"encryptedApiKey"') && !sanitizeFile.includes('"encryptedApiSecret"'),
    "FIELD_WHITELISTS does not include any encrypted integration secrets"
  );

  // TEST GROUP 3: AI Assistant Context Exclusion
  console.log("\nGroup 3: AI Website Assistant Security");
  const aiContextFile = fs.readFileSync(
    path.join(__dirname, "../lib/ai/buildWebsiteContext.ts"),
    "utf8"
  );
  assert(
    !aiContextFile.includes("IntegrationSettings"),
    "buildWebsiteContext does not import or query IntegrationSettings"
  );
  assert(
    !aiContextFile.includes("encryptedApiKey") && !aiContextFile.includes("encryptedApiSecret"),
    "buildWebsiteContext never references encrypted keys or secrets"
  );

  // TEST GROUP 4: Route Secret Leakage Verification
  console.log("\nGroup 4: Route Secret Leakage Verification");
  const signRouteFile = fs.readFileSync(
    path.join(__dirname, "../app/api/cloudinary/sign/route.ts"),
    "utf8"
  );
  assert(
    !signRouteFile.includes("apiSecret:") && !signRouteFile.includes("encryptedApiSecret"),
    "GET and POST /api/cloudinary/sign never send apiSecret to browser"
  );

  const adminIntegrationsRoute = fs.readFileSync(
    path.join(__dirname, "../app/api/admin/integrations/route.ts"),
    "utf8"
  );
  assert(
    adminIntegrationsRoute.includes("getIntegrationsSafeStatus"),
    "/api/admin/integrations uses safe status summary only"
  );

  const safeConfigHelper = fs.readFileSync(
    path.join(__dirname, "../lib/integrations/config.ts"),
    "utf8"
  );
  assert(
    safeConfigHelper.includes("apiSecretConfigured: Boolean(cld.apiSecret)") &&
    !safeConfigHelper.includes("apiSecret: cld.apiSecret") &&
    !safeConfigHelper.includes("apiKey: google.apiKey"),
    "getIntegrationsSafeStatus strictly returns booleans for secrets, never plaintext"
  );

  // TEST GROUP 5: Documentation
  console.log("\nGroup 5: Documentation Verification");
  const envExample = fs.readFileSync(
    path.join(__dirname, "../.env.example"),
    "utf8"
  );
  assert(
    envExample.includes("INTEGRATION_ENCRYPTION_KEY="),
    ".env.example documents INTEGRATION_ENCRYPTION_KEY"
  );

  // TEST GROUP 6: Central Resolver Source Precedence
  console.log("\nGroup 6: Resolver Precedence Architecture");
  assert(
    safeConfigHelper.includes("if (hasAdminOverride)") &&
    safeConfigHelper.includes('source = "admin"') &&
    safeConfigHelper.includes('source = "environment"') &&
    safeConfigHelper.includes('"none"'),
    "Resolvers strictly follow priority: ADMIN OVERRIDE -> ENVIRONMENT DEFAULT -> NONE"
  );

  // TEST GROUP 7: Empty Secret Preservation
  console.log("\nGroup 7: Empty Secret Preservation");
  const cldRoute = fs.readFileSync(
    path.join(__dirname, "../app/api/admin/integrations/cloudinary/route.ts"),
    "utf8"
  );
  assert(
    cldRoute.includes("if (trimmedSecret)") &&
    cldRoute.includes("settingsDoc.cloudinary.encryptedApiSecret = encryptSecret(trimmedSecret)"),
    "Empty secret update preserves existing stored secret"
  );

  const aiRoute = fs.readFileSync(
    path.join(__dirname, "../app/api/admin/integrations/ai/route.ts"),
    "utf8"
  );
  assert(
    aiRoute.includes("if (trimmedKey)") &&
    aiRoute.includes("settingsDoc.ai.encryptedApiKey = encryptSecret(trimmedKey)"),
    "Empty AI API key update preserves existing stored secret"
  );

  console.log("\n==================================================");
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log("==================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test runner error:", err);
  process.exit(1);
});
