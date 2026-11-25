// ============================================================
// Layar loading: hitung mundur 0-100%, lalu panel terbelah terbuka.
// Durasi minimum diatur di MIN_TIME (milidetik).
// ============================================================
(function () {
  const root = document.documentElement;
  const loader = document.querySelector(".preloader");
  if (!loader) return;

  // Tidak aktif kalau pengguna memilih animasi dikurangi.
  if (!root.classList.contains("is-loading")) {
    loader.remove();
    return;
  }

  const MIN_TIME = 1400;   // lama minimum loading
  const MAX_TIME = 7000;   // batas tunggu kalau halaman lambat dimuat
  const bar = loader.querySelector(".preloader__bar i");
  const count = loader.querySelector(".preloader__count");
  const start = performance.now();
  let pageLoaded = document.readyState === "complete";
  let finished = false;

  window.addEventListener("load", function () { pageLoaded = true; });

  function finish() {
    if (finished) return;
    finished = true;
    loader.classList.add("is-done");
    // Animasi hero mulai saat panel mulai terbuka.
    setTimeout(function () { root.classList.remove("is-loading"); }, 450);
    setTimeout(function () { loader.remove(); }, 1800);
  }

  function tick(now) {
    const t = now - start;
    let p = Math.min(t / MIN_TIME, 1);
    p = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    // Tahan di 92% sampai semua gambar dan font selesai dimuat.
    if (!pageLoaded && t < MAX_TIME) p = Math.min(p, 0.92);

    bar.style.setProperty("--p", p.toFixed(3));
    count.textContent = String(Math.round(p * 100)).padStart(3, "0");

    if (p >= 1) {
      finish();
    } else {
      requestAnimationFrame(tick);
    }
  }

  requestAnimationFrame(tick);
})();

// Tombol ganti tema (mode malam / mode siang).
const themeButton = document.querySelector(".theme-toggle");

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  themeButton.setAttribute(
    "aria-label",
    theme === "light" ? "Ganti ke mode malam" : "Ganti ke mode siang"
  );
}

applyTheme(document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark");

themeButton.addEventListener("click", function () {
  const next = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
  applyTheme(next);
  try { localStorage.setItem("theme", next); } catch (e) {}
});

// Mengatur menu navigasi di layar kecil.
const menuButton = document.querySelector(".menu-toggle");
const siteNavigation = document.querySelector(".site-nav");

function closeMenu() {
  menuButton.setAttribute("aria-expanded", "false");
  siteNavigation.classList.remove("is-open");
}

menuButton.addEventListener("click", function () {
  const menuIsOpen = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!menuIsOpen));
  siteNavigation.classList.toggle("is-open", !menuIsOpen);
});

siteNavigation.querySelectorAll("a").forEach(function (link) {
  link.addEventListener("click", closeMenu);
});

document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    closeMenu();
  }
});

// Menu juga tertutup saat pengguna menyentuh/klik area di luar menu.
document.addEventListener("pointerdown", function (event) {
  const menuIsOpen = menuButton.getAttribute("aria-expanded") === "true";
  if (!menuIsOpen) return;

  const clickedInsideMenu = siteNavigation.contains(event.target);
  const clickedMenuButton = menuButton.contains(event.target);
  if (!clickedInsideMenu && !clickedMenuButton) {
    closeMenu();
  }
});

// Menandai menu dan indikator samping sesuai bagian yang sedang dilihat.
const spyLinks = document.querySelectorAll("[data-spy]");
const spySections = document.querySelectorAll("main section[id]");

function setActiveSection(id) {
  spyLinks.forEach(function (link) {
    link.classList.toggle("is-active", link.dataset.spy === id);
  });
}

if ("IntersectionObserver" in window) {
  const spyObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    },
    { rootMargin: "-40% 0px -55% 0px" }
  );

  spySections.forEach(function (section) {
    spyObserver.observe(section);
  });
}

setActiveSection("home");

// Mengirim formulir ke email melalui layanan FormSubmit.
const contactForm = document.querySelector(".contact-form");
const formStatus = document.querySelector(".form-status");
const submitButton = contactForm.querySelector('button[type="submit"]');

contactForm.addEventListener("submit", async function (event) {
  event.preventDefault();
  formStatus.textContent = "Mengirim pesan...";
  formStatus.dataset.state = "";
  submitButton.disabled = true;

  try {
    const response = await fetch(contactForm.action, {
      method: "POST",
      body: new FormData(contactForm),
      headers: {
        Accept: "application/json"
      }
    });

    const result = await response.json();

    if (!response.ok || result.success === false || result.success === "false") {
      throw new Error(result.message || "Pesan belum berhasil dikirim.");
    }

    formStatus.textContent = "Pesan terkirim. Terima kasih sudah menghubungi saya!";
    formStatus.dataset.state = "success";
    contactForm.reset();
  } catch (error) {
    formStatus.textContent = "Pesan belum terkirim. Coba lagi atau kirim email langsung.";
    formStatus.dataset.state = "error";
  } finally {
    submitButton.disabled = false;
  }
});

// ============================================================
// Animasi paralaks dan micro interaction
// ============================================================
(function () {
  const root = document.documentElement;
  root.classList.add("js");

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const all = (selector) => Array.from(document.querySelectorAll(selector));

  // ---------- Bar progres gulir + header pintar ----------
  const progress = document.createElement("div");
  progress.className = "scroll-progress";
  progress.setAttribute("aria-hidden", "true");
  document.body.append(progress);

  const header = document.querySelector(".site-header");

  function updateScrollUi() {
    const y = window.scrollY;
    const max = root.scrollHeight - window.innerHeight;
    progress.style.setProperty("--p", max > 0 ? y / max : 0);
    // Setelah digulir sedikit, navbar berubah jadi kapsul dan tetap menempel.
    header.classList.toggle("is-scrolled", y > 40);
  }

  // ---------- Muncul saat digulir (reveal) ----------
  const revealSelector = ".chapter__head, .chapter__body, .site-footer";
  const revealTargets = all(revealSelector);

  revealTargets.forEach(function (el) {
    el.classList.add("reveal");
    const siblings = Array.from(el.parentElement.children).filter(function (n) {
      return n.matches(revealSelector);
    });
    el.style.setProperty("--d", siblings.indexOf(el) * 120 + "ms");
  });

  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -6% 0px" }
    );
    revealTargets.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add("is-visible"); });
  }

  // ---------- Paralaks (gulir + gerak mouse) ----------
  const hero = document.querySelector(".hero");
  const heroContent = document.querySelector(".hero__content");
  // [selector, kecepatan gulir, kedalaman mouse]
  const heroLayers = [
    [".hero__sky", 0.06, 8],
    [".hero__moon", 0.16, 26],
    [".hero__torii", 0.2, 14],
    [".hero__birds", 0.36, 40],
    [".hero__ridge--left", 0.26, 18],
    [".hero__ridge--right", 0.3, 22],
    [".hero__content", 0.12, -8],
    [".hero__graffiti", 0, -16]
  ].map(function (item) { return [document.querySelector(item[0]), item[1], item[2]]; })
   .filter(function (item) { return item[0]; });

  // [selector, kecepatan] — bergeser pelan mengikuti posisi di layar
  const flowLayers = [].map(function (item) { return [all(item[0]), item[1]]; });

  let targetX = 0, targetY = 0, currentX = 0, currentY = 0;
  let heroVisible = true;
  let frameRequested = false;

  function requestFrame() {
    if (!frameRequested) {
      frameRequested = true;
      requestAnimationFrame(frame);
    }
  }

  function frame() {
    frameRequested = false;
    currentX += (targetX - currentX) * 0.08;
    currentY += (targetY - currentY) * 0.08;

    if (heroVisible) {
      const y = Math.min(window.scrollY, window.innerHeight * 1.5);
      heroLayers.forEach(function (layer) {
        const x = -currentX * layer[2];
        const yy = y * layer[1] - currentY * layer[2];
        layer[0].style.translate = x.toFixed(2) + "px " + yy.toFixed(2) + "px";
      });
      heroContent.style.opacity = clamp(1 - y / (window.innerHeight * 0.85), 0, 1).toFixed(3);
    }

    flowLayers.forEach(function (group) {
      group[0].forEach(function (el) {
        const rect = el.getBoundingClientRect();
        if (rect.bottom < -200 || rect.top > window.innerHeight + 200) return;
        const offset = (rect.top + rect.height / 2 - window.innerHeight / 2) * group[1];
        el.style.translate = "0 " + offset.toFixed(2) + "px";
      });
    });

    if (Math.abs(targetX - currentX) > 0.001 || Math.abs(targetY - currentY) > 0.001) {
      requestFrame();
    }
  }

  window.addEventListener("scroll", function () {
    updateScrollUi();
    if (!reduce) requestFrame();
  }, { passive: true });
  window.addEventListener("resize", function () {
    updateScrollUi();
    if (!reduce) requestFrame();
  });
  updateScrollUi();

  if (!reduce) {
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        heroVisible = entries[0].isIntersecting;
      }).observe(hero);
    }

    if (fine) {
      hero.addEventListener("pointermove", function (event) {
        targetX = event.clientX / window.innerWidth - 0.5;
        targetY = event.clientY / window.innerHeight - 0.5;
        requestFrame();
      });
      hero.addEventListener("pointerleave", function () {
        targetX = 0;
        targetY = 0;
        requestFrame();
      });
    }
    requestFrame();
  }

  if (reduce || !fine) return;

  // ---------- Kursor: cahaya + cincin yang mengikuti ----------
  const glow = document.createElement("div");
  glow.className = "cursor-glow";
  const ring = document.createElement("div");
  ring.className = "cursor-ring";
  [glow, ring].forEach(function (el) {
    el.setAttribute("aria-hidden", "true");
    document.body.append(el);
  });

  let px = -100, py = -100, gx = -100, gy = -100, rx = -100, ry = -100;

  document.addEventListener("pointermove", function (event) {
    px = event.clientX;
    py = event.clientY;
    glow.style.opacity = "1";
    ring.style.opacity = "1";
    ring.classList.toggle("is-link", !!event.target.closest("a, button, input, textarea, label, .about .ch, .about__stage, .about__seal, .about .facts div, .about__text strong, .about__intro span, .about__ticker"));
  });
  document.documentElement.addEventListener("pointerleave", function () {
    glow.style.opacity = "0";
    ring.style.opacity = "0";
  });
  document.addEventListener("pointerdown", function () { ring.classList.add("is-down"); });
  document.addEventListener("pointerup", function () { ring.classList.remove("is-down"); });

  (function followCursor() {
    gx += (px - gx) * 0.08;
    gy += (py - gy) * 0.08;
    rx += (px - rx) * 0.22;
    ry += (py - ry) * 0.22;
    glow.style.translate = gx.toFixed(1) + "px " + gy.toFixed(1) + "px";
    ring.style.translate = rx.toFixed(1) + "px " + ry.toFixed(1) + "px";
    requestAnimationFrame(followCursor);
  })();

  // ---------- Tombol magnetis ----------
  all(".button, .play-button, .site-nav__contact, .site-footer__top, .brand__mark").forEach(function (el) {
    el.classList.add("magnetic");
    el.addEventListener("pointermove", function (event) {
      const rect = el.getBoundingClientRect();
      const dx = event.clientX - (rect.left + rect.width / 2);
      const dy = event.clientY - (rect.top + rect.height / 2);
      el.style.translate = dx * 0.22 + "px " + dy * 0.3 + "px";
    });
    el.addEventListener("pointerleave", function () { el.style.translate = ""; });
  });

  // ---------- Efek riak saat tombol diklik ----------
  all(".button, .site-nav__contact").forEach(function (el) {
    el.classList.add("ripple-host");
    el.addEventListener("click", function (event) {
      const rect = el.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 2;
      const ripple = document.createElement("span");
      ripple.className = "ripple";
      ripple.style.width = ripple.style.height = size + "px";
      const cx = event.detail === 0 ? rect.width / 2 : event.clientX - rect.left;
      const cy = event.detail === 0 ? rect.height / 2 : event.clientY - rect.top;
      ripple.style.left = cx - size / 2 + "px";
      ripple.style.top = cy - size / 2 + "px";
      el.append(ripple);
      setTimeout(function () { ripple.remove(); }, 700);
    });
  });

  // ---------- Foto "Tentang" miring 3D (variabel dibaca .about__stage) ----------
  const photo = document.querySelector(".about__photo");
  if (photo) {
    photo.addEventListener("pointermove", function (event) {
      const rect = photo.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      photo.style.setProperty("--rx", (-y * 9).toFixed(2) + "deg");
      photo.style.setProperty("--ry", (x * 11).toFixed(2) + "deg");
    });
    photo.addEventListener("pointerleave", function () {
      photo.style.setProperty("--rx", "0deg");
      photo.style.setProperty("--ry", "0deg");
    });
  }

  // ---------- Klik graffiti / logo: pantulan + percikan bintang ----------
  function burst(x, y) {
    for (let i = 0; i < 12; i++) {
      const spark = document.createElement("span");
      const angle = (Math.PI * 2 * i) / 12 + Math.random() * 0.4;
      const distance = 50 + Math.random() * 70;
      spark.className = "spark";
      spark.style.left = x + "px";
      spark.style.top = y + "px";
      spark.style.setProperty("--dx", Math.cos(angle) * distance + "px");
      spark.style.setProperty("--dy", Math.sin(angle) * distance + "px");
      document.body.append(spark);
      setTimeout(function () { spark.remove(); }, 800);
    }
  }

  const graffiti = document.querySelector(".hero__graffiti");
  if (graffiti) {
    graffiti.addEventListener("click", function (event) {
      graffiti.classList.remove("is-pop");
      void graffiti.offsetWidth;
      graffiti.classList.add("is-pop");
      burst(event.clientX, event.clientY);
    });
    // Lepas kelas is-pop setelah animasi selesai supaya hover normal lagi.
    graffiti.addEventListener("animationend", function (event) {
      if (event.animationName === "pop") {
        graffiti.classList.remove("is-pop");
      }
    });
  }
  document.querySelector(".brand__mark")?.addEventListener("click", function (event) {
    burst(event.clientX, event.clientY);
  });
  document.querySelector(".about__seal")?.addEventListener("click", function (event) {
    burst(event.clientX, event.clientY);
  });
})();

// ============================================================
// Skill: tab "editor kode" (klik atau tombol panah kiri/kanan).
// ============================================================
(function () {
  const tabs = Array.from(document.querySelectorAll('.editor [role="tab"]'));
  if (!tabs.length) return;

  function select(tab) {
    tabs.forEach(function (item) {
      const on = item === tab;
      item.setAttribute("aria-selected", String(on));
      item.tabIndex = on ? 0 : -1;
      document.getElementById(item.getAttribute("aria-controls")).hidden = !on;
    });
  }

  tabs.forEach(function (tab, i) {
    tab.addEventListener("click", function () { select(tab); });
    tab.addEventListener("keydown", function (event) {
      const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
      if (!step) return;
      const next = tabs[(i + step + tabs.length) % tabs.length];
      next.focus();
      select(next);
    });
  });
})();

// ============================================================
// Tentang: paralaks latar (bulan, burung, torii, kanji) mengikuti gulir.
// Hanya menulis satu variabel --py ke .about; CSS yang menggeser lapisannya.
// ============================================================
(function () {
  const about = document.querySelector(".about");
  if (!about) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  let queued = false;

  function update() {
    queued = false;
    const rect = about.getBoundingClientRect();
    if (rect.bottom < -200 || rect.top > window.innerHeight + 200) return;
    about.style.setProperty("--py", (rect.top + rect.height / 2 - window.innerHeight / 2).toFixed(1));
  }

  function request() {
    if (!queued) {
      queued = true;
      requestAnimationFrame(update);
    }
  }

  window.addEventListener("scroll", request, { passive: true });
  window.addEventListener("resize", request);
  update();
})();

// ============================================================
// Tentang: micro-interaction untuk desktop, tablet, dan HP.
// Mouse memakai hover, layar sentuh memakai ketuk, tekan, dan posisi gulir.
// ============================================================
(function () {
  const about = document.querySelector(".about");
  if (!about) return;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const touchy = window.matchMedia("(hover: none)").matches;
  const clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  const rand = function (a, b) { return a + Math.random() * (b - a); };
  const all = function (selector) { return Array.from(about.querySelectorAll(selector)); };
  const make = function (cls) {
    const el = document.createElement("span");
    el.className = cls;
    return el;
  };

  // Safari iOS hanya menjalankan :active kalau ada pendengar sentuhan.
  document.addEventListener("touchstart", function () {}, { passive: true });

  // Tandai saat bagian ini masuk layar (memicu dentuman kanji dan bulan).
  if ("IntersectionObserver" in window) {
    const seen = new IntersectionObserver(function (entries) {
      if (entries.some(function (e) { return e.isIntersecting; })) {
        about.classList.add("is-in");
        seen.disconnect();
      }
    }, { threshold: 0.2 });
    seen.observe(about);
  } else {
    about.classList.add("is-in");
  }

  if (reduce) {
    about.classList.add("is-in");
    return;
  }

  // ---------- Judul dipecah per huruf ----------
  let n = 0;
  all(".about__line, .about__brush").forEach(function (line) {
    const text = line.textContent.trim().replace(/\s+/g, " ");
    const label = make("visually-hidden");
    const chars = make("about__chars");
    label.textContent = text;
    chars.setAttribute("aria-hidden", "true");

    text.split(" ").forEach(function (word, wi, words) {
      const w = make("w");
      Array.from(word).forEach(function (c) {
        const ch = make("ch");
        ch.textContent = c;
        ch.style.setProperty("--i", n++);
        ch.style.setProperty("--r", rand(-7, 7).toFixed(1) + "deg");
        w.append(ch);
      });
      chars.append(w);
      if (wi < words.length - 1) {
        chars.append(document.createTextNode(" "));
        n++;
      }
    });

    line.textContent = "";
    line.append(label, chars);
    line.classList.add("is-split");
  });

  // ---------- Cat semprot: cipratan + tetesan ----------
  const palette = ["var(--color-red)", "var(--color-red-soft)", "var(--color-red-soft)", "var(--color-text)"];
  const pick = function () { return palette[Math.floor(Math.random() * palette.length)]; };

  function place(el, x, y, color) {
    el.style.left = x + "px";
    el.style.top = y + "px";
    el.style.setProperty("--c", color);
    document.body.append(el);
    return el;
  }

  function splat(x, y, power) {
    const p = power || 1;
    const color = pick();
    const nodes = [];

    const main = place(make("splat splat--main"), x, y, color);
    main.style.setProperty("--s", rand(30, 48) * p + "px");
    main.style.setProperty("--rot", rand(-40, 40).toFixed(0) + "deg");
    nodes.push(main);

    for (let i = 0; i < 9; i++) {
      const angle = rand(0, Math.PI * 2);
      const dist = rand(28, 105) * p;
      const drop = place(make("splat"), x, y, color);
      drop.style.setProperty("--s", rand(4, 12) * (0.6 + p * 0.4) + "px");
      drop.style.setProperty("--dx", Math.cos(angle) * dist + "px");
      drop.style.setProperty("--dy", Math.sin(angle) * dist + "px");
      nodes.push(drop);
    }

    const drips = p > 1 ? 3 : 2;
    for (let i = 0; i < drips; i++) {
      const drip = place(make("drip"), x + rand(-16, 16) * p, y + rand(2, 12), color);
      drip.style.setProperty("--w", rand(3, 5.5).toFixed(1) + "px");
      drip.style.setProperty("--h", rand(36, 100) * p + "px");
      nodes.push(drip);
    }

    setTimeout(function () { nodes.forEach(function (node) { node.remove(); }); }, 1800);
    if (navigator.vibrate && !fine) navigator.vibrate(10);
  }

  // ---------- Foto: ketuk = cipratan, sentuh = miring ke arah jari ----------
  const photo = about.querySelector(".about__photo");
  const stage = about.querySelector(".about__stage");

  if (photo && stage) {
    stage.addEventListener("pointerdown", function (event) {
      if (event.target.closest(".about__seal")) return;
      splat(event.clientX, event.clientY, 1);
      if (event.pointerType === "mouse") return;
      const rect = stage.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      photo.style.setProperty("--rx", (-y * 14).toFixed(2) + "deg");
      photo.style.setProperty("--ry", (x * 16).toFixed(2) + "deg");
    });

    ["pointerup", "pointercancel", "pointerleave"].forEach(function (type) {
      stage.addEventListener(type, function (event) {
        if (event.pointerType === "mouse") return;
        photo.style.setProperty("--rx", "0deg");
        photo.style.setProperty("--ry", "0deg");
      });
    });
  }

  // ---------- Stempel: dicap, cincin menyebar, cipratan besar ----------
  const seal = about.querySelector(".about__seal");
  if (seal) {
    seal.addEventListener("click", function (event) {
      const rect = seal.getBoundingClientRect();
      const x = event.detail === 0 ? rect.left + rect.width / 2 : event.clientX;
      const y = event.detail === 0 ? rect.top + rect.height / 2 : event.clientY;
      seal.classList.remove("is-stamped");
      void seal.offsetWidth;
      seal.classList.add("is-stamped");
      splat(x, y, 1.5);
      setTimeout(function () { seal.classList.remove("is-stamped"); }, 750);
    });
  }

  // ---------- Huruf judul: ketuk = melompat + cipratan kecil ----------
  all(".ch").forEach(function (ch) {
    ch.addEventListener("pointerdown", function (event) {
      ch.classList.remove("is-hop");
      void ch.offsetWidth;
      ch.classList.add("is-hop");
      setTimeout(function () { ch.classList.remove("is-hop"); }, 650);
      splat(event.clientX, event.clientY, 0.5);
    });
  });

  // ---------- Nama: ketuk = bergetar ----------
  const name = about.querySelector(".about__intro span");
  if (name) {
    name.addEventListener("pointerdown", function () {
      name.classList.remove("is-glitch");
      void name.offsetWidth;
      name.classList.add("is-glitch");
      setTimeout(function () { name.classList.remove("is-glitch"); }, 650);
    });
  }

  // ---------- Fakta: ketuk = cipratan kecil ----------
  all(".facts div").forEach(function (row) {
    row.addEventListener("pointerdown", function (event) {
      splat(event.clientX, event.clientY, 0.45);
    });
  });

  // ---------- Layar sentuh: baris fakta dan foto menyala di tengah layar ----------
  if (touchy && "IntersectionObserver" in window) {
    const lit = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        entry.target.classList.toggle("is-lit", entry.isIntersecting);
      });
    }, { rootMargin: "-42% 0px -42% 0px" });
    all(".facts div").concat(all(".about__stage")).forEach(function (el) { lit.observe(el); });
  }

  // ---------- Jejak kabut semprot di atas judul, foto, dan pita (mouse saja) ----------
  if (fine) {
    let lastMist = 0;
    about.addEventListener("pointermove", function (event) {
      if (event.pointerType !== "mouse") return;
      const now = performance.now();
      if (now - lastMist < 45) return;
      if (!event.target.closest(".chapter__head, .about__photo, .about__ticker")) return;
      lastMist = now;
      const dot = make("mist");
      dot.style.left = event.clientX + rand(-6, 6) + "px";
      dot.style.top = event.clientY + rand(-6, 6) + "px";
      dot.style.setProperty("--s", rand(3, 8).toFixed(1) + "px");
      dot.style.setProperty("--dx", rand(-18, 18).toFixed(0) + "px");
      dot.style.setProperty("--dy", rand(6, 28).toFixed(0) + "px");
      document.body.append(dot);
      setTimeout(function () { dot.remove(); }, 900);
    });
  }

  // ---------- Pita teks: jalan sendiri, ngebut saat digulir, berbalik saat diketuk ----------
  const ticker = about.querySelector(".about__ticker");
  const track = ticker && ticker.querySelector(".about__ticker-track");

  if (track) {
    track.classList.add("is-js");
    let x = 0;
    let dir = -1;
    let mult = 1;
    let vel = 0;
    let lastY = window.scrollY;
    let lastSkew = 0;
    let last = performance.now();
    let half = track.scrollWidth / 2;
    let running = false;
    let moved = 0;

    function measure() { half = track.scrollWidth / 2; }

    function loop(now) {
      if (!running) return;
      const dt = Math.min(now - last, 50) / 16.67;
      last = now;

      const raw = window.scrollY - lastY;
      lastY = window.scrollY;
      vel += (raw - vel) * 0.15;

      x += dir * mult * 1.1 * dt - vel * 0.8;
      if (x <= -half) x += half;
      if (x > 0) x -= half;
      track.style.translate = x.toFixed(2) + "px 0";

      const skew = clamp(vel * -0.35, -7, 7);
      if (Math.abs(skew - lastSkew) > 0.05) {
        lastSkew = skew;
        about.style.setProperty("--sk", skew.toFixed(2) + "deg");
      }
      requestAnimationFrame(loop);
    }

    function start() {
      if (running || document.hidden) return;
      running = true;
      last = performance.now();
      lastY = window.scrollY;
      requestAnimationFrame(loop);
    }

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) start();
        else running = false;
      }).observe(about);
    } else {
      start();
    }

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) running = false;
      else start();
    });
    window.addEventListener("resize", measure);
    window.addEventListener("load", measure);

    ticker.addEventListener("pointerenter", function (event) {
      if (event.pointerType === "mouse") mult = 0.2;
    });
    ticker.addEventListener("pointerleave", function () { mult = 1; });
    let lastPX = 0;
    let pressed = false;

    ticker.addEventListener("pointerdown", function (event) {
      pressed = true;
      mult = 0;
      moved = 0;
      lastPX = event.clientX;
      if (event.pointerType !== "mouse") ticker.setPointerCapture(event.pointerId);
    });
    ticker.addEventListener("pointermove", function (event) {
      // Menyeret pita dengan jari atau mouse yang ditekan.
      if (!pressed) return;
      const dx = event.clientX - lastPX;
      lastPX = event.clientX;
      x += dx;
      moved += Math.abs(dx);
    });
    ["pointerup", "pointercancel"].forEach(function (type) {
      ticker.addEventListener(type, function (event) {
        pressed = false;
        mult = event.pointerType === "mouse" ? 0.2 : 1;
      });
    });
    ticker.addEventListener("click", function () {
      if (moved < 6) dir *= -1;
    });
  }
})();
// ============================================================
// Bagian 3-6 + footer: muncul berurutan, garis waktu tergambar,
// paralaks ringan, miring 3D (mouse), menyala di tengah layar (sentuh).
// Semua memakai IntersectionObserver + satu rAF, dan berhenti saat di luar layar.
// ============================================================
(function () {
  "use strict";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const all = (s) => Array.from(document.querySelectorAll(s));
  const secs = all(".chapter--ink");
  if (!secs.length || !("IntersectionObserver" in window)) return;

  // Muncul berurutan
  if (!reduce) {
    const items = all(".trail__item, .work__info > div, .work__tags li, .form-field, .contact-form__footer");
    const io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.15 });
    items.forEach(function (el) {
      const i = Array.prototype.indexOf.call(el.parentNode.children, el);
      el.style.setProperty("--d", Math.min(i, 6) * 90 + "ms");
      el.classList.add("st");
      io.observe(el);
    });
  }

  // Bagian yang sedang terlihat: paralaks + progres garis waktu
  const live = new Set();
  let ticking = false;
  const vis = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      e.target.classList.toggle("in-view", e.isIntersecting);
      e.isIntersecting ? live.add(e.target) : live.delete(e.target);
    });
    update();
  }, { rootMargin: "15% 0px" });
  secs.forEach(function (s) { vis.observe(s); });

  function update() {
    ticking = false;
    const vh = window.innerHeight;
    live.forEach(function (s) {
      const r = s.getBoundingClientRect();
      if (!reduce) s.style.setProperty("--sp", Math.max(-1, Math.min(1, (r.top + r.height / 2 - vh / 2) / vh)).toFixed(3));
      const trail = s.querySelector(".trail");
      if (trail) {
        const t = trail.getBoundingClientRect();
        trail.style.setProperty("--tp", reduce ? 1 : Math.max(0.02, Math.min(1, (vh * 0.62 - t.top) / t.height)).toFixed(3));
        trail.querySelectorAll(".trail__item").forEach(function (it) {
          it.classList.toggle("done", it.getBoundingClientRect().top < vh * 0.62);
        });
      }
    });
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  window.addEventListener("resize", update, { passive: true });

  // Layar sentuh: elemen yang pas di tengah layar "menyala" (pengganti hover)
  if (!fine) {
    const lit = new IntersectionObserver(function (es) {
      es.forEach(function (e) { e.target.classList.toggle("is-lit", e.isIntersecting); });
    }, { rootMargin: "-42% 0px -42% 0px" });
    all(".trail__item, .work__frame").forEach(function (el) { lit.observe(el); });
  }

  // Mouse: panel skill dan jendela proyek miring mengikuti kursor
  if (fine && !reduce) {
    all(".editor, .work__frame").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--ry", ((e.clientX - r.left) / r.width - 0.5) * 6 + "deg");
        el.style.setProperty("--rx", (0.5 - (e.clientY - r.top) / r.height) * 5 + "deg");
      }, { passive: true });
      el.addEventListener("pointerleave", function () {
        el.style.setProperty("--rx", "0deg");
        el.style.setProperty("--ry", "0deg");
      });
    });
  }
})();

// Tahun di footer ikut tahun sekarang.
(function () {
  var el = document.getElementById("tahun");
  if (el) el.textContent = new Date().getFullYear();
})();
