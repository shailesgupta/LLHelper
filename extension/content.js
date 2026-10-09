(() => {
  "use strict";
  // Scaffold only. Live IGR field mapping and typeahead are not enabled yet.
  // Never submit forms or automate CAPTCHA, OTP, eKYC, biometrics, payment,
  // or Save/Add/final-submit actions.
  const marker = "data-llhelper-mounted";
  if (document.documentElement.hasAttribute(marker)) return;
  document.documentElement.setAttribute(marker, "true");
  const root = document.createElement("div");
  root.id = "llhelper-status";
  root.setAttribute("role", "status");
  root.style.cssText = "position:fixed;right:16px;bottom:16px;z-index:2147483647;background:#fff;color:#172033;border:1px solid #cbd5e1;border-radius:10px;padding:10px 14px;font:13px/1.4 system-ui,sans-serif;box-shadow:0 4px 18px rgba(0,0,0,.12);max-width:280px";
  root.textContent = "LLHelper loaded — autofill is not enabled yet.";
  document.documentElement.appendChild(root);
})();