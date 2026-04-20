(() => {
  function keepOnlyDigits(value) {
    return String(value ?? "").replace(/\D+/g, "");
  }

  function enforceDigitsOnly(input) {
    if (!input) return;

    input.addEventListener("beforeinput", (e) => {
      if (e.inputType !== "insertText" && e.inputType !== "insertFromPaste") return;
      const data = e.data ?? "";
      if (!data) return;
      if (!/^\d+$/.test(data)) e.preventDefault();
    });

    input.addEventListener("input", () => {
      const start = input.selectionStart ?? input.value.length;
      const before = input.value;
      const digits = keepOnlyDigits(before);
      if (before === digits) return;
      input.value = digits;
      const delta = before.length - digits.length;
      const nextPos = Math.max(0, start - delta);
      input.setSelectionRange(nextPos, nextPos);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      enforceDigitsOnly(document.querySelector("#docNumber"));
    });
  } else {
    enforceDigitsOnly(document.querySelector("#docNumber"));
  }
})();

