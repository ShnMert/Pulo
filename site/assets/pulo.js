(() => {
  // ================= Konfiguration =================
  // BORAN: Links eintragen. Der Download-Dialog leitet je nach Auswahl
  // (System → Free/Pro → Zahlweise) auf den passenden Link weiter.
  // Leer = im Dialog erscheint ein Hinweis, dass der Link bald folgt.
  const LINKS = {
    mac:     { free: "", monthly: "", yearly: "", lifetime: "" },
    windows: { free: "", monthly: "", yearly: "", lifetime: "" }
  };

  // Texte, die per JS gesetzt werden – Sprache folgt <html lang>.
  const I18N = {
    de: {
      soonWindows: "Die Windows-Version ist bald verfügbar – trag dich unten in der Roadmap in die Warteliste ein.",
      soonLink: "Der Link folgt in Kürze.",
      status: {
        ok:   "Alles bestens. Dein Server antwortet.",
        warn: "Hm, dein Server antwortet – aber er lässt sich Zeit.",
        bad:  "Dein Server ist nicht erreichbar. Pulo ist traurig."
      },
      theme: { system: "Design: wie System", light: "Design: Hell", dark: "Design: Dunkel" },
      waitlistOk: "Danke! Wir melden uns, sobald Pulo für Windows da ist.",
      waitlistErr: "Das hat nicht geklappt. Bitte versuch es später noch einmal."
    },
    en: {
      soonWindows: "The Windows version is coming soon – join the waitlist in the roadmap below.",
      soonLink: "The link is coming soon.",
      status: {
        ok:   "All good. Your server is responding.",
        warn: "Hmm, your server responds – but it's taking its time.",
        bad:  "Your server can't be reached. Pulo is sad."
      },
      theme: { system: "Theme: match system", light: "Theme: light", dark: "Theme: dark" },
      waitlistOk: "Thanks! We'll let you know as soon as Pulo is available for Windows.",
      waitlistErr: "That didn't work. Please try again later."
    }
  };
  const t = I18N[document.documentElement.lang] || I18N.de;

  document.documentElement.classList.add("js");
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const canHover = matchMedia("(hover: hover) and (pointer: fine)");
  const root = document.documentElement;
  document.getElementById("year").textContent = new Date().getFullYear();

  // ================= Hell / Dunkel =================
  // "system" folgt prefers-color-scheme; "light"/"dark" überschreibt es.
  // Das Inline-Skript im <head> setzt data-theme schon vor dem ersten Rendern.
  const THEMES = ["system", "light", "dark"];
  const themeBtn = document.getElementById("theme-toggle");
  const themeMetas = [...document.querySelectorAll('meta[name="theme-color"]')];
  themeMetas.forEach(m => m.dataset.orig = m.content);
  function applyTheme(mode) {
    if (mode === "system") delete root.dataset.theme; else root.dataset.theme = mode;
    // Browser-Leiste passend einfärben
    themeMetas.forEach(m => m.content = mode === "system" ? m.dataset.orig
      : themeMetas.find(o => o.media.includes(mode)).dataset.orig);
    themeBtn.dataset.mode = mode;
    themeBtn.setAttribute("aria-label", t.theme[mode]);
    themeBtn.title = t.theme[mode];
  }
  let theme = "system";
  try { theme = localStorage.getItem("pulo-theme") || "system"; } catch {}
  applyTheme(THEMES.includes(theme) ? theme : "system");
  themeBtn.addEventListener("click", () => {
    const next = THEMES[(THEMES.indexOf(themeBtn.dataset.mode) + 1) % THEMES.length];
    applyTheme(next);
    try { next === "system" ? localStorage.removeItem("pulo-theme") : localStorage.setItem("pulo-theme", next); } catch {}
  });

  // ================= Download-Dialog =================
  const dlg = document.getElementById("dl-dialog");
  const dlForm = document.getElementById("dl-form");
  const dlPlan = document.getElementById("dl-plan");
  const dlMsg = document.getElementById("dl-msg");
  const syncPlan = () => { dlPlan.hidden = dlForm.edition.value !== "pro"; dlMsg.textContent = ""; };
  dlForm.addEventListener("change", syncPlan);
  function openDownload(edition) {
    if (typeof dlg.showModal !== "function") return false;
    dlForm.edition.value = edition;
    if (/Win/i.test(navigator.userAgent) && !/Mac/i.test(navigator.userAgent)) dlForm.os.value = "windows";
    syncPlan();
    dlg.showModal();
    return true;
  }
  document.querySelectorAll("[data-download], [data-pro]").forEach(a => a.addEventListener("click", e => {
    if (openDownload(a.hasAttribute("data-pro") ? "pro" : "free")) e.preventDefault();
  }));
  dlg.querySelector("[data-dl-close]").addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", e => { if (e.target === dlg) dlg.close(); });
  dlForm.addEventListener("submit", e => {
    e.preventDefault();
    const os = dlForm.os.value, edition = dlForm.edition.value;
    const url = LINKS[os][edition === "pro" ? dlForm.plan.value : "free"];
    if (url) { location.href = url; return; }
    dlMsg.textContent = os === "windows" ? t.soonWindows : t.soonLink;
  });

  // ================= Buddy =================
  const MOUTHS = {
    happy:   "M122 199 Q144 212 166 199",
    worried: "M124 204 Q134 198 144 204 Q154 210 164 204",
    sad:     "M124 208 Q144 194 164 208",
    wow:     "M134 204 Q144 190 154 204 Q144 218 134 204"
  };
  const LAMP = { ok: "var(--ok)", warn: "var(--warn)", bad: "var(--bad)" };
  const tpl = document.getElementById("buddy-tpl");
  const buddies = [...document.querySelectorAll("[data-buddy]")].map(el => {
    el.appendChild(tpl.content.cloneNode(true));
    const b = { el, svg: el.querySelector("svg"), pupils: [...el.querySelectorAll(".pupil")],
                mouth: el.querySelector(".mouth"), lamp: el.querySelector(".lamp"), mood: el.dataset.mood };
    el.addEventListener("click", () => boop(b));
    return b;
  });

  function setMood(b, mood) {
    b.mood = mood; b.el.dataset.mood = mood;
    b.mouth.setAttribute("d", MOUTHS[mood]);
  }
  function boop(b) {
    b.el.classList.remove("boop"); void b.el.offsetWidth; b.el.classList.add("boop");
    b.mouth.setAttribute("d", MOUTHS.wow);
    clearTimeout(b.boopT);
    b.boopT = setTimeout(() => { b.el.classList.remove("boop"); b.mouth.setAttribute("d", MOUTHS[b.mood]); }, 650);
    blink(b);
  }
  function blink(b) {
    b.el.classList.add("blink");
    setTimeout(() => b.el.classList.remove("blink"), 130);
  }
  buddies.forEach(b => {
    const loop = () => {
      blink(b);
      if (Math.random() < .2) setTimeout(() => blink(b), 260); // gelegentlich Doppel-Blinzeln
      b.blinkT = setTimeout(loop, 2600 + Math.random() * 3200);
    };
    b.blinkT = setTimeout(loop, 1200 + Math.random() * 2000);
  });

  // Augen folgen dem Zeiger
  function lookAt(b, x, y) {
    const r = b.svg.getBoundingClientRect();
    const s = r.width / 347; // viewBox "-29 0 347 347"
    b.pupils.forEach((p, i) => {
      const ex = r.left + ((i ? 184 : 104) + 29) * s, ey = r.top + 162 * s;
      const dx = x - ex, dy = y - ey, d = Math.hypot(dx, dy) || 1;
      const m = Math.min(8, d / 25);
      p.style.transform = `translate(${(dx / d) * m}px, ${(dy / d) * m * .9}px)`;
    });
  }
  let px = 0, py = 0, raf = 0;
  addEventListener("pointermove", e => {
    if (e.pointerType !== "mouse") return;
    px = e.clientX; py = e.clientY;
    if (!raf) raf = requestAnimationFrame(() => { raf = 0; buddies.forEach(b => lookAt(b, px, py)); });
  }, { passive: true });

  // Touch / kein Hover: sanfte Idle-Animation, Augen schweifen umher
  function setupIdle() {
    const idle = !canHover.matches && !reduceMotion.matches;
    buddies.forEach(b => b.el.classList.toggle("idle", idle));
    clearInterval(setupIdle.t);
    if (!canHover.matches) {
      const wander = () => buddies.forEach(b => {
        const r = b.svg.getBoundingClientRect();
        lookAt(b, r.left + r.width * Math.random(), r.top + r.height * (.2 + Math.random() * .7));
      });
      wander();
      setupIdle.t = setInterval(wander, 3200);
    }
  }
  setupIdle();
  canHover.addEventListener("change", setupIdle);
  reduceMotion.addEventListener("change", setupIdle);

  // ================= Farbwähler =================
  function setColor(c) {
    root.style.setProperty("--buddy", c);
    try { localStorage.setItem("pulo-color", c); } catch {}
  }
  const swatches = document.getElementById("swatches");
  const custom = document.getElementById("custom-color");
  swatches.addEventListener("change", e => {
    if (e.target.name === "color") { setColor(e.target.value); custom.value = e.target.value; }
  });
  custom.addEventListener("input", () => {
    swatches.querySelectorAll("input[name=color]").forEach(i => i.checked = false);
    setColor(custom.value);
  });
  try {
    const saved = localStorage.getItem("pulo-color");
    if (saved) {
      setColor(saved); custom.value = saved;
      const match = swatches.querySelector(`input[value="${saved}"]`);
      swatches.querySelectorAll("input[name=color]").forEach(i => i.checked = i === match);
    }
  } catch {}

  // ================= Serverstatus-Demo =================
  const STATUS = {
    ok:   { mood: "happy",   text: t.status.ok },
    warn: { mood: "worried", text: t.status.warn },
    bad:  { mood: "sad",     text: t.status.bad }
  };
  const demo = buddies.find(b => b.el.id === "demo-buddy");
  const line = document.getElementById("status-line");
  document.querySelectorAll("[data-status]").forEach(btn => btn.addEventListener("click", () => {
    const key = btn.dataset.status, s = STATUS[key];
    document.querySelectorAll("[data-status]").forEach(o => o.setAttribute("aria-pressed", o === btn));
    setMood(demo, s.mood);
    demo.lamp.style.fill = LAMP[key];
    line.innerHTML = `<span class="dot ${key === "ok" ? "" : key}"></span><span>${s.text}</span>`;
  }));

  // ================= Video =================
  const video = document.getElementById("promo");
  const playBtn = document.getElementById("play-btn");
  const placeholder = document.getElementById("video-placeholder");
  const source = video.querySelector("source");
  const showPlaceholder = () => { placeholder.hidden = false; playBtn.hidden = true; video.hidden = true; };
  source.addEventListener("error", showPlaceholder);
  if (!source.getAttribute("src")) showPlaceholder();
  playBtn.addEventListener("click", () => { video.play().catch(() => {}); video.focus(); });
  video.addEventListener("play", () => playBtn.hidden = true);
  video.addEventListener("ended", () => playBtn.hidden = false);

  document.querySelectorAll("[data-watch]").forEach(a => a.addEventListener("click", e => {
    e.preventDefault();
    document.getElementById("video").scrollIntoView({ behavior: reduceMotion.matches ? "auto" : "smooth" });
    if (!video.hidden) video.play().catch(() => {});
    (video.hidden ? placeholder : video).setAttribute("tabindex", "-1");
    (video.hidden ? placeholder : video).focus({ preventScroll: true });
  }));

  // ================= Windows-Warteliste (Netlify Forms) =================
  const wl = document.getElementById("waitlist");
  const wlMsg = document.getElementById("waitlist-msg");
  wl.addEventListener("submit", e => {
    e.preventDefault();
    const btn = wl.querySelector("button");
    btn.disabled = true;
    fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(new FormData(wl)).toString()
    })
      .then(r => { if (!r.ok) throw new Error(r.status); wl.reset(); wlMsg.textContent = t.waitlistOk; })
      .catch(() => { wlMsg.textContent = t.waitlistErr; })
      .finally(() => { btn.disabled = false; });
  });

  // ================= Scroll-Reveal & Parallax =================
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
  }), { rootMargin: "0px 0px -8% 0px", threshold: .08 });
  document.querySelectorAll(".reveal").forEach(el => io.observe(el));

  const par = [...document.querySelectorAll("[data-parallax]")];
  let ticking = false;
  addEventListener("scroll", () => {
    if (reduceMotion.matches || ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      par.forEach(el => el.style.transform = `translate3d(0, ${scrollY * el.dataset.parallax}px, 0)`);
      ticking = false;
    });
  }, { passive: true });
})();
