(() => {
  "use strict";

  const DATA = window.SITE;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const hasGsap = typeof window.gsap !== "undefined";
  const hasST = typeof window.ScrollTrigger !== "undefined";
  const animate = hasGsap && hasST && !reduced;
  const DESKTOP = "(min-width: 761px)";
  const WHEEL_ARC = 120; // the toolkit pie is one third of a circle
  const WHEEL_STEP = 13; // degrees between tools on that pie's edge

  const esc = (v) => String(v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const safeUrl = (u) => (/^(https?:|mailto:|tel:)/i.test(u) ? u : "#");
  const safeImg = (u) => (u && /^[\w./-]+$|^https:\/\/[^\s'"()]+$/.test(u) ? u : "");
  const pad = (n) => String(n).padStart(2, "0");
  const ext = (href) => (href.startsWith("http") ? ' target="_blank" rel="noopener"' : "");
  const bg = (u) => (safeImg(u) ? `background-image:url('${esc(safeImg(u))}')` : "");

  if (animate) {
    document.documentElement.classList.add("fx");
    gsap.registerPlugin(ScrollTrigger);
  }

  /* ---------------- Rendering ---------------- */

  function renderHero() {
    const [first, second] = DATA.name;
    const [given, ...rest] = second.split(" ");
    $("#heroTitle").innerHTML =
      `<span class="line"><span>${esc(first)}</span></span>` +
      `<span class="line"><span><em>${esc(given)}</em> ${esc(rest.join(" "))}</span></span>`;
    $("#role").textContent = DATA.role;
    $("#loc").textContent = DATA.location;
  }

  function renderAbout() {
    $("#intro").textContent = DATA.intro;
    const items = DATA.disciplines.flatMap((d) => d.items.map((item) => [item, d.title]));
    $("#focusList").innerHTML = items.map(([item, group]) =>
      `<li><b>${esc(item)}</b><small class="mono">${esc(group)}</small></li>`).join("");
  }

  function renderShowcase() {
    const works = DATA.works;
    // Each word sits in its own mask so it can slide in and out on project switch.
    const word = (t, k) => `<span class="w"><span class="w__in">${k ? `<em>${esc(t)}</em>` : esc(t)}</span></span>`;
    $("#scTitles").innerHTML = works.map((w) =>
      `<h3 class="sc-title" aria-label="${esc(w.title)}"><span aria-hidden="true">${w.title.split(" ").map(word).join(" ")}</span></h3>`).join("");
    $("#scNum").innerHTML = works.map((_, i) =>
      `<span>${pad(i + 1).split("").map((d) => `<i>${d}</i>`).join("")}</span>`).join("");
    $("#scFrame").innerHTML = works.map((w) =>
      `<div class="sc-img"><div class="sc-img__pic" style="${bg(w.image)}"></div></div>`).join("");
    $("#scMetas").innerHTML = works.map((w) =>
      `<div class="sc-meta"><span class="mono">${esc(w.year)}</span><p>${esc(w.kind)}</p></div>`).join("");
    $("#scRail").innerHTML = works.map((w, i) =>
      `<li><button type="button" style="${bg(w.image)}" aria-label="Show project ${i + 1}: ${esc(w.title)}"></button></li>`).join("");
  }

  function renderWorks() {
    $("#workCount").textContent = `${pad(DATA.works.length)} projects`;
    $("#works").innerHTML = DATA.works.map((w) => {
      const title = esc(w.title);
      return `
        <article class="work" data-cursor="View">
          <div class="work__media"><div class="work__zoom"><div class="work__img" style="${bg(w.image)}"></div></div></div>
          <div class="work__meta">
            <h3><span class="roll"><span>${title}</span><span aria-hidden="true">${title}</span></span></h3>
            <p class="mono">${esc(w.kind)} · ${esc(w.year)}</p>
          </div>
        </article>`;
    }).join("");
  }

  function renderRecord() {
    const imgs = DATA.works.map((w) => w.image);
    $("#recordList").innerHTML = DATA.record.map((r, i) => {
      const num = /^\d+$/.test(r.year) ? `<span class="count__num" data-count="${esc(r.year)}">${esc(r.year)}</span>` : `<span class="count__num">${esc(r.year)}</span>`;
      const link = r.href ? `<a class="mono" href="${esc(safeUrl(r.href))}"${ext(r.href)}>Source ↗</a>` : "";
      const img = imgs[i % imgs.length];
      return `
        <article class="count">
          ${num}
          <div class="count__body"><h3>${esc(r.title)}</h3><p>${esc(r.meta)}</p>${link}</div>
          ${img ? `<div class="count__float" style="${bg(img)}" aria-hidden="true"></div>` : ""}
        </article>`;
    }).join("");
  }

  function renderWheel() {
    $("#wheel").innerHTML = DATA.toolkit.map((t, i) =>
      `<span class="wheel__item" style="--a:${i * WHEEL_STEP}deg"><span class="mono">${pad(i + 1)}</span><b>${esc(t)}</b></span>`).join("");
  }

  const socialLinks = () => DATA.links.map(([label, href]) => `<a href="${esc(safeUrl(href))}"${ext(href)}>${esc(label)} ↗</a>`);

  // Bits every page has: menu footer links, mail button, footer year.
  function renderShared() {
    $("#ctaMail").href = `mailto:${DATA.email}`;
    $("#menuLinks").innerHTML = [`<a href="mailto:${esc(DATA.email)}">${esc(DATA.email)}</a>`, ...socialLinks()].join("");
    $("#year").textContent = new Date().getFullYear();
  }

  function renderContact() {
    const mail = $("#mail");
    mail.textContent = DATA.email;
    mail.href = `mailto:${DATA.email}`;
    $("#links").innerHTML = socialLinks().map((l) => `<li>${l}</li>`).join("");
    if (DATA.contactWords?.length) $("#cycle").textContent = DATA.contactWords[0];
  }

  function renderAwards() {
    const awards = DATA.awards || [];
    $("#awardCount").textContent = `${pad(awards.length)} total`;
    $("#awardList").innerHTML = awards.map((a, i) => {
      const inner = `
        <span class="mono award__num">${pad(i + 1)}</span>
        <span class="award__title">${esc(a.title)}</span>
        <span class="award__by">${esc(a.by)}</span>
        <span class="mono award__year">${esc(a.year)}</span>`;
      const attrs = `class="award__row" data-img="${esc(safeImg(a.image))}"`;
      return `<li>${a.href ? `<a ${attrs} href="${esc(safeUrl(a.href))}"${ext(a.href)}>${inner}</a>` : `<div ${attrs}>${inner}</div>`}</li>`;
    }).join("");
  }

  function renderPosters() {
    const posters = DATA.posters || [];
    $("#posterCount").textContent = `${pad(posters.length)} posters`;
    $("#posterGrid").innerHTML = posters.map((p, i) => `
      <figure class="poster" data-cursor="View">
        <div class="poster__media"><div class="poster__img" style="${bg(p.image)}" role="img" aria-label="${esc(p.title)}"></div></div>
        <figcaption class="mono"><span>${pad(i + 1)} — ${esc(p.title)}</span><span>${esc(p.year)}</span></figcaption>
      </figure>`).join("");
  }

  function renderIndex() {
    $("#index").innerHTML = $$("main > section[data-label]").map((s) => {
      const href = s.id ? `#${s.id}` : "#top";
      return `<a href="${href}" data-for="${esc(href)}"><i></i><span>${esc(s.dataset.label)}</span></a>`;
    }).join("");
  }

  /* ---------------- Smooth scroll ---------------- */

  let lenis = null;

  function initSmooth() {
    if (!animate || typeof window.Lenis === "undefined") return;
    lenis = new Lenis({ lerp: 0.09 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();

    document.addEventListener("click", (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const hash = a.getAttribute("href");
      const target = hash === "#top" ? 0 : $(hash);
      if (target === null) return;
      e.preventDefault();
      lenis.scrollTo(target, { duration: 1.6, force: true });
    });
  }

  const scrollToY = (y) => (lenis ? lenis.scrollTo(y, { duration: 1.2, force: true }) : scrollTo({ top: y, behavior: "smooth" }));

  /* ---------------- Section colours + side index ---------------- */

  // The page colour fades to each section's palette as it reaches the middle of the screen.
  function initColors() {
    const root = document.documentElement;
    const links = $$("#index a");
    const apply = (s) => {
      const vars = { "--bg": s.dataset.bg, "--ink": s.dataset.fg };
      if (animate) gsap.to(root, { ...vars, duration: 0.9, ease: "power2.out", overwrite: true });
      else Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
      const href = s.id ? `#${s.id}` : "#top";
      links.forEach((a) => a.classList.toggle("is-active", a.dataset.for === href));
    };
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) apply(e.target); });
    }, { rootMargin: "-50% 0px -50% 0px" });
    $$("main > section[data-bg], .foot[data-bg]").forEach((s) => io.observe(s));
  }

  /* ---------------- Menu ---------------- */

  // Wraps each letter of a link's label in two stacked copies (for the open stagger and hover roll).
  function splitLetters(a) {
    const text = [...a.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
    if (!text) return;
    const label = text.textContent.trim();
    const word = document.createElement("span");
    word.className = "menu__word";
    word.setAttribute("aria-hidden", "true");
    [...label].forEach((c, i) => {
      const ch = document.createElement("span"), inner = document.createElement("span");
      ch.className = "ch"; inner.className = "ch__in";
      ch.style.setProperty("--i", i);
      const glyph = c === " " ? " " : c;
      [0, 1].forEach(() => { const s = document.createElement("span"); s.textContent = glyph; inner.append(s); });
      ch.append(inner);
      word.append(ch);
    });
    a.setAttribute("aria-label", label);
    text.replaceWith(word);
  }

  // Accent panel wipes in, ink panel follows, then every letter rises with a stagger.
  function buildMenuTimeline(menu, layer) {
    const hide = () => { menu.hidden = true; layer.hidden = true; };
    const rows = $$(".menu__list li", menu);
    const tl = gsap.timeline({ paused: true, onReverseComplete: hide })
      .fromTo(layer, { clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)", duration: 0.8, ease: "expo.inOut" })
      .fromTo(menu, { clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)", duration: 0.9, ease: "expo.inOut" }, 0.12);
    rows.forEach((li, r) => {
      tl.fromTo($$(".ch__in", li), { yPercent: 110 }, { yPercent: 0, duration: 1.1, stagger: 0.025, ease: "expo.out" }, 0.55 + r * 0.06);
      tl.fromTo($(".mono", li), { opacity: 0 }, { opacity: 1, duration: 0.6 }, 0.7 + r * 0.06);
    });
    return tl.fromTo(".menu__foot", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, ease: "expo.out" }, 0.9);
  }

  // Floating work image: opens with a clip reveal, follows the cursor and tilts with its speed.
  function initMenuPreview(menu, links) {
    if (!animate || !finePointer) return;
    const imgs = DATA.works.map((w) => safeImg(w.image)).filter(Boolean);
    if (!imgs.length) return;
    const preview = $("#menuPreview"), img = $("#menuPreviewImg");
    gsap.set(preview, { xPercent: -50, yPercent: -50 });
    const xTo = gsap.quickTo(preview, "x", { duration: 0.7, ease: "power3" });
    const yTo = gsap.quickTo(preview, "y", { duration: 0.7, ease: "power3" });
    const rotTo = gsap.quickTo(preview, "rotate", { duration: 0.8, ease: "power3" });
    let lastX = 0, vel = 0;
    menu.addEventListener("pointermove", (e) => {
      vel = gsap.utils.clamp(-14, 14, (e.clientX - lastX) * 0.6);
      lastX = e.clientX;
      xTo(e.clientX); yTo(e.clientY);
    });
    gsap.ticker.add(() => { vel *= 0.88; rotTo(vel); });

    let shown = false;
    links.forEach((a, i) => {
      a.addEventListener("pointerenter", () => {
        img.style.backgroundImage = `url("${imgs[i % imgs.length]}")`;
        gsap.fromTo(img, { scale: shown ? 1.15 : 1.4 }, { scale: 1, duration: 1, ease: "expo.out", overwrite: true });
        if (!shown) gsap.to(preview, { clipPath: "inset(0% 0% 0% 0% round 4px)", duration: 0.8, ease: "expo.out", overwrite: "auto" });
        shown = true;
      });
    });
    $(".menu__list", menu).addEventListener("pointerleave", () => {
      shown = false;
      gsap.to(preview, { clipPath: "inset(50% 50% 50% 50% round 4px)", duration: 0.5, ease: "expo.in", overwrite: "auto" });
    });
  }

  function initMenu() {
    const btn = $("#menuBtn"), menu = $("#menu"), layer = $("#menuLayer"), label = $(".bar__menu-label");
    const links = $$(".menu__list a", menu);
    links.forEach(splitLetters);
    const tl = animate ? buildMenuTimeline(menu, layer) : null;
    let open = false;

    const set = (next) => {
      if (open === next) return;
      open = next;
      btn.setAttribute("aria-expanded", String(open));
      label.textContent = open ? label.dataset.close : label.dataset.open;
      document.body.classList.toggle("menu-open", open);
      if (open) lenis?.stop(); else lenis?.start();

      if (!tl) {
        menu.hidden = !open;
        menu.style.clipPath = open ? "none" : "";
        if (open) links[0].focus();
        return;
      }
      if (open) {
        menu.hidden = false; layer.hidden = false;
        tl.timeScale(1).play();
        links[0].focus({ preventScroll: true });
      } else {
        tl.timeScale(1.6).reverse();
      }
    };

    initMenuPreview(menu, links);
    btn.addEventListener("click", () => set(!open));
    menu.addEventListener("click", (e) => { if (e.target.closest("a")) set(false); });
    addEventListener("keydown", (e) => {
      if (e.key === "Escape" && open) { set(false); btn.focus(); }
    });
  }

  /* ---------------- Ambient background ---------------- */

  // Each blob wanders to a new random spot forever; every colour field leans toward the pointer.
  function initAmbient() {
    if (!animate) return;
    const wander = (el) => gsap.to(el, {
      xPercent: gsap.utils.random(-45, 45), yPercent: gsap.utils.random(-35, 35),
      scale: gsap.utils.random(0.8, 1.25), duration: gsap.utils.random(7, 12),
      ease: "sine.inOut", onComplete: () => wander(el),
    });
    $$(".blob").forEach(wander);
    $$(".ambient__mark").forEach((m) => gsap.to(m, { rotate: 12, xPercent: 8, duration: 14, ease: "sine.inOut", yoyo: true, repeat: -1 }));

    if (finePointer) {
      const fields = $$(".ambient__field");
      const xTo = gsap.quickTo(fields, "x", { duration: 2.4, ease: "power3" });
      const yTo = gsap.quickTo(fields, "y", { duration: 2.4, ease: "power3" });
      addEventListener("pointermove", (e) => {
        xTo((e.clientX / innerWidth - 0.5) * 120);
        yTo((e.clientY / innerHeight - 0.5) * 80);
      }, { passive: true });
    }

    gsap.to(".ambient--hero", {
      yPercent: 25, opacity: 0, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
    });
  }

  /* ---------------- About: blur-focus list ---------------- */

  // The line closest to the screen's middle is sharp; the further away, the blurrier.
  function initFocusList() {
    const items = $$("#focusList li");
    // Hover focus per line: 0 = normal, 1 = fully sharp no matter where it sits on screen.
    const hover = items.map(() => ({ v: 0 }));
    // All positions are read first, then all styles written, so the browser lays out only once per frame.
    const update = () => {
      const mid = innerHeight / 2;
      const dists = items.map((li) => {
        const r = li.getBoundingClientRect();
        return Math.min(1, Math.abs(r.top + r.height / 2 - mid) / (innerHeight * 0.42));
      });
      items.forEach((li, i) => {
        const d = dists[i] * (1 - hover[i].v);
        li.style.filter = d > 0.02 ? `blur(${(d * 9).toFixed(1)}px)` : "";
        li.style.opacity = (1 - d * 0.75).toFixed(2);
      });
    };
    if (!animate) return;
    ScrollTrigger.create({ trigger: "#about", start: "top bottom", end: "bottom top", onUpdate: update });
    update();

    // Hovering a line brings it into focus; leaving lets it drift back to its scroll blur.
    if (!finePointer) return;
    items.forEach((li, i) => {
      const to = (v, duration) => gsap.to(hover[i], { v, duration, ease: "power3.out", overwrite: true, onUpdate: update });
      li.addEventListener("pointerenter", () => to(1, 0.5));
      li.addEventListener("pointerleave", () => to(0, 0.9));
    });
  }

  /* ---------------- Work: pinned showcase ---------------- */

  function initShowcase() {
    if (!animate) return;
    gsap.matchMedia().add(DESKTOP, () => {
      const titles = $$(".sc-title"), frames = $$(".sc-img"), metas = $$(".sc-meta"), thumbs = $$("#scRail li"), nums = $$("#scNum span");
      const n = titles.length;
      let current = -1, z = 1;

      // Old project's words, number and meta slide out one way; the new ones slide in from the other.
      const swapText = (out, inn, dir) => {
        if (out) {
          gsap.to($$(".w__in", out.title), { yPercent: -110 * dir, duration: 0.6, stagger: 0.04, ease: "expo.in", overwrite: true,
            onComplete: () => gsap.set(out.title, { opacity: 0 }) });
          gsap.to($$("i", out.num), { yPercent: -110 * dir, rotationX: 75 * dir, opacity: 0, filter: "blur(10px)",
            duration: 0.6, stagger: 0.07, ease: "expo.in", overwrite: true, onComplete: () => gsap.set(out.num, { opacity: 0 }) });
          gsap.to(out.meta, { opacity: 0, y: -16 * dir, filter: "blur(6px)", duration: 0.4, overwrite: true });
        }
        gsap.set(inn.title, { opacity: 1 });
        gsap.fromTo($$(".w__in", inn.title), { yPercent: 110 * dir }, { yPercent: 0, duration: 1.1, stagger: 0.06, delay: out ? 0.35 : 0, ease: "expo.out", overwrite: true });
        // Number: each digit flips in on its own, oversized and blurred, then snaps into place.
        gsap.set(inn.num, { opacity: 1 });
        gsap.fromTo($$("i", inn.num),
          { yPercent: 110 * dir, rotationX: -75 * dir, scale: 1.25, opacity: 0, filter: "blur(10px)" },
          { yPercent: 0, rotationX: 0, scale: 1, opacity: 1, filter: "blur(0px)", duration: 1.2, stagger: 0.09,
            delay: out ? 0.3 : 0, ease: "back.out(1.6)", overwrite: true });
        gsap.fromTo(inn.meta, { opacity: 0, y: 16 * dir, filter: "blur(6px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.8, delay: 0.4, ease: "expo.out", overwrite: true });
      };

      // Puts a frame back to hidden and untouched, stopping any animation on it.
      const resetFrame = (f) => {
        gsap.killTweensOf([f, f.firstElementChild]);
        gsap.set(f, { clipPath: "inset(100% 0 0 0)", scale: 1, filter: "none" });
        gsap.set(f.firstElementChild, { scale: 1, yPercent: 0 });
      };

      // New image wipes over the old one while the old one sinks back and darkens.
      // When scrolling fast, every other frame is cleared and the new one simply fades in full-size,
      // so no half-wiped or shrunken image is ever left showing.
      const swapImage = (prev, i, dir, fast) => {
        const f = frames[i], pic = f.firstElementChild;
        frames.forEach((other, k) => { if (k !== i && (fast || k !== prev)) resetFrame(other); });
        gsap.killTweensOf([f, pic]);
        gsap.set(f, { zIndex: ++z, scale: 1, filter: "none" });
        if (fast || prev < 0) {
          gsap.set(f, { clipPath: "inset(0% 0 0% 0)" });
          gsap.fromTo(f, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: "power2.out" });
          gsap.fromTo(pic, { scale: 1.12, yPercent: 0 }, { scale: 1, duration: 0.8, ease: "expo.out" });
          return;
        }
        gsap.to(frames[prev], { scale: 0.88, filter: "brightness(.55)", duration: 1.1, ease: "expo.inOut" });
        gsap.fromTo(f, { opacity: 1, clipPath: dir > 0 ? "inset(100% 0 0 0)" : "inset(0 0 100% 0)" }, {
          clipPath: "inset(0% 0 0% 0)", duration: 1.1, ease: "expo.inOut",
          onComplete: () => { if (current === i) resetFrame(frames[prev]); },
        });
        gsap.fromTo(pic, { scale: 1.4, yPercent: 12 * dir }, { scale: 1, yPercent: 0, duration: 1.6, ease: "expo.out" });
      };

      // Instantly clears a project's text (stops any half-finished animation on it).
      const hide = (k) => {
        const words = $$(".w__in", titles[k]);
        gsap.killTweensOf([titles[k], ...words, metas[k], nums[k], ...$$("i", nums[k])]);
        gsap.set(titles[k], { opacity: 0 });
        gsap.set(words, { yPercent: 110 });
        gsap.set([metas[k], nums[k]], { opacity: 0 });
      };

      let lastSwitch = 0;
      const show = (i) => {
        if (i === current) return;
        const prev = current, dir = i > current ? 1 : -1;
        current = i;
        // Scrolling fast flips projects quicker than the animation takes; then the old
        // text is cleared at once so only the newest project animates in.
        const now = performance.now(), fast = now - lastSwitch < 1100;
        lastSwitch = now;
        titles.forEach((_, k) => { if (k !== i && (k !== prev || fast)) hide(k); });
        const item = (k) => ({ title: titles[k], meta: metas[k], num: nums[k] });
        swapText(prev >= 0 && !fast ? item(prev) : null, item(i), dir);
        swapImage(prev, i, dir, fast);
        thumbs.forEach((t, k) => t.classList.toggle("is-active", k === i));
        $("#scCount").textContent = `${pad(i + 1)} / ${pad(n)}`;
      };

      const st = ScrollTrigger.create({
        trigger: "#showcase", start: "top top", end: () => `+=${n * innerHeight * 0.7}`, pin: true,
        onUpdate: (self) => show(Math.min(n - 1, Math.floor(self.progress * n))),
      });
      show(0);

      thumbs.forEach((t, k) => $("button", t).addEventListener("click", () => {
        scrollToY(st.start + (st.end - st.start) * ((k + 0.5) / n));
      }));
      return () => { current = -1; };
    });
  }

  /* ---------------- Grid fallback scroll + hover ---------------- */

  // The showcase frame leans a little toward the cursor while the picture inside drifts the other way.
  function initFrameHover() {
    const frame = $("#scFrame");
    if (!frame || !animate || !finePointer) return;
    const xTo = gsap.quickTo(frame, "x", { duration: 1, ease: "power3" });
    const yTo = gsap.quickTo(frame, "y", { duration: 1, ease: "power3" });
    const rTo = gsap.quickTo(frame, "rotate", { duration: 1, ease: "power3" });
    frame.addEventListener("pointermove", (e) => {
      const r = frame.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
      frame.style.setProperty("--px", px.toFixed(3));
      frame.style.setProperty("--py", py.toFixed(3));
      xTo(px * 28); yTo(py * 28); rTo(px * 3);
    });
    frame.addEventListener("pointerleave", () => {
      frame.style.setProperty("--px", "0");
      frame.style.setProperty("--py", "0");
      xTo(0); yTo(0); rTo(0);
    });
  }

  function initWorkGrid() {
    initFrameHover();
    if (finePointer && !reduced) {
      $$(".work").forEach((w) => {
        w.addEventListener("pointermove", (e) => {
          const r = w.getBoundingClientRect();
          w.style.setProperty("--px", ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
          w.style.setProperty("--py", ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
        });
        w.addEventListener("pointerleave", () => { w.style.setProperty("--px", "0"); w.style.setProperty("--py", "0"); });
      });
    }
    if (!animate) return;
    $$(".work").forEach((w) => {
      const media = $(".work__media", w), img = $(".work__img", w);
      gsap.timeline({ scrollTrigger: { trigger: w, start: "top 88%" } })
        .fromTo(media, { clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0% 0 0 0)", duration: 1.4, ease: "expo.out" })
        .fromTo(img, { scale: 1.35 }, { scale: 1, duration: 1.8, ease: "expo.out" }, 0);
      gsap.fromTo(img, { yPercent: -7 }, { yPercent: 7, ease: "none", scrollTrigger: { trigger: w, start: "top bottom", end: "bottom top", scrub: true } });
    });
  }

  /* ---------------- Record: counting numbers ---------------- */

  function initCounts() {
    if (!animate) return;
    $$("[data-count]").forEach((el) => {
      const to = Number(el.dataset.count), o = { v: 0 };
      gsap.to(o, {
        v: to, duration: 2.2, ease: "expo.out",
        scrollTrigger: { trigger: el, start: "top 85%" },
        onUpdate: () => { el.textContent = Math.round(o.v); },
      });
    });
    $$(".count").forEach((c) => {
      gsap.from($(".count__body", c), { y: 40, opacity: 0, filter: "blur(10px)", duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: c, start: "top 75%" } });
      const float = $(".count__float", c);
      if (float) gsap.fromTo(float, { yPercent: 40 }, { yPercent: -40, ease: "none", scrollTrigger: { trigger: c, start: "top bottom", end: "bottom top", scrub: true } });
    });
  }

  /* ---------------- Toolkit: wheel ---------------- */

  // Tools ride the edge of a one-third pie; scrolling turns it so each one passes the marker.
  // Opacity only (no blur) keeps it smooth: tools fade toward the pie's edges and vanish past them.
  function initWheel() {
    const ring = $("#wheel"), items = $$(".wheel__item", ring);
    const half = WHEEL_ARC / 2;
    const paint = (rot) => {
      ring.style.transform = `rotate(${rot}deg)`;
      items.forEach((el, i) => {
        const a = Math.abs(i * WHEEL_STEP + rot);
        const o = a <= half ? 1 - (a / half) * 0.8 : Math.max(0, 0.2 * (1 - (a - half) / 10));
        el.style.opacity = o.toFixed(3);
        el.classList.toggle("is-active", a < WHEEL_STEP / 2);
      });
    };
    paint(0);
    if (!animate) return;
    gsap.matchMedia().add({ desk: DESKTOP, mob: "(max-width: 760px)" }, (ctx) => {
      const { desk } = ctx.conditions;
      // The wheel turns 1:1 with the (already smooth) page scroll, so it moves at the same pace.
      // It starts with the first tool level and ends with the last tool level.
      const s = { r: 0 };
      const stepPx = desk ? innerHeight * 0.22 : innerHeight * 0.18;
      gsap.to(s, {
        r: -(items.length - 1) * WHEEL_STEP, ease: "none", onUpdate: () => paint(s.r),
        scrollTrigger: {
          trigger: "#toolkit",
          start: desk ? "top top" : "top 60%",
          end: () => `+=${stepPx * items.length}`,
          pin: desk, scrub: true,
        },
      });
    });
  }

  /* ---------------- Contact: cycling word ---------------- */

  function initCycle() {
    const words = DATA.contactWords || [];
    if (!animate || words.length < 2) return;
    const el = $("#cycle");
    let i = 0;
    setInterval(() => {
      i = (i + 1) % words.length;
      gsap.timeline()
        .to(el, { opacity: 0, filter: "blur(12px)", yPercent: -20, duration: 0.45, ease: "power2.in" })
        .add(() => { el.textContent = words[i]; })
        .fromTo(el, { yPercent: 20 }, { opacity: 1, filter: "blur(0px)", yPercent: 0, duration: 0.7, ease: "expo.out" });
    }, 2600);
  }

  /* ---------------- Awards: hover list ---------------- */

  // Hovering a row fills it with ink; a preview image trails the cursor and tilts with its speed.
  function initAwards() {
    const rows = $$(".award__row");
    if (animate) {
      gsap.fromTo(rows, { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1.1, stagger: 0.07, ease: "expo.out", scrollTrigger: { trigger: "#awardList", start: "top 80%" } });
    }
    if (!animate || !finePointer) return;
    const preview = $("#awardPreview"), img = $("#awardPreviewImg");
    gsap.set(preview, { xPercent: -50, yPercent: -50 });
    const xTo = gsap.quickTo(preview, "x", { duration: 0.8, ease: "power3" });
    const yTo = gsap.quickTo(preview, "y", { duration: 0.8, ease: "power3" });
    const rotTo = gsap.quickTo(preview, "rotate", { duration: 0.9, ease: "power3" });
    let lastX = 0, vel = 0;
    $("#awardList").addEventListener("pointermove", (e) => {
      vel = gsap.utils.clamp(-12, 12, (e.clientX - lastX) * 0.5);
      lastX = e.clientX;
      xTo(e.clientX); yTo(e.clientY);
    });
    gsap.ticker.add(() => { vel *= 0.88; rotTo(vel); });
    rows.forEach((row) => row.addEventListener("pointerenter", () => {
      if (row.dataset.img) img.style.backgroundImage = `url("${row.dataset.img}")`;
      gsap.fromTo(img, { scale: 1.25 }, { scale: 1, duration: 0.9, ease: "expo.out", overwrite: true });
      gsap.to(preview, { clipPath: "inset(0% 0% 0% 0% round 4px)", duration: 0.7, ease: "expo.out", overwrite: "auto" });
    }));
    $("#awardList").addEventListener("pointerleave", () =>
      gsap.to(preview, { clipPath: "inset(50% 50% 50% 50% round 4px)", duration: 0.45, ease: "expo.in", overwrite: "auto" }));
  }

  /* ---------------- Posters ---------------- */

  // Each poster wipes up into view; columns drift at different speeds while scrolling.
  function initPosters() {
    if (finePointer && !reduced) {
      $$(".poster").forEach((p) => {
        p.addEventListener("pointermove", (e) => {
          const r = p.getBoundingClientRect();
          p.style.setProperty("--px", ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
          p.style.setProperty("--py", ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
        });
        p.addEventListener("pointerleave", () => { p.style.setProperty("--px", "0"); p.style.setProperty("--py", "0"); });
      });
    }
    if (!animate) return;
    $$(".poster").forEach((p, i) => {
      gsap.timeline({ scrollTrigger: { trigger: p, start: "top 90%" } })
        .fromTo($(".poster__media", p), { clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0% 0 0 0)", duration: 1.4, ease: "expo.out", delay: (i % 4) * 0.08 })
        .fromTo($(".poster__img", p), { scale: 1.35 }, { scale: 1, duration: 1.8, ease: "expo.out" }, "<");
    });
    gsap.matchMedia().add(DESKTOP, () => {
      $$(".poster:nth-child(4n + 2), .poster:nth-child(4n + 4)").forEach((p) =>
        gsap.fromTo(p, { y: 80 }, { y: -80, ease: "none", scrollTrigger: { trigger: p, start: "top bottom", end: "bottom top", scrub: 1 } }));
    });
  }

  /* ---------------- Generic reveals ---------------- */

  function initReveals() {
    if (!animate) return;
    // clearProps drops the blur once done, so finished elements don't keep an expensive filter layer.
    $$(".section__head, .focus__side, .wheel__side, .contact__grid").forEach((el) => {
      gsap.from(el, { y: 40, opacity: 0, filter: "blur(8px)", duration: 1.2, ease: "expo.out", clearProps: "filter",
        scrollTrigger: { trigger: el, start: "top 88%" } });
    });
    initHeadingReveals();
  }

  // Wraps every word of a heading in a mask, keeping <br> and inline tags. An inline tag with
  // an id (the cycling contact word) is masked whole, so its own animation keeps working.
  function splitWords(el) {
    const mask = (node) => {
      const w = document.createElement("span"), inner = document.createElement("span");
      w.className = "w"; inner.className = "w__in";
      inner.append(node);
      w.append(inner);
      return w;
    };
    [...el.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const parts = n.textContent.split(/(\s+)/).filter(Boolean)
          .map((p) => (/^\s+$/.test(p) ? document.createTextNode(" ") : mask(document.createTextNode(p))));
        n.replaceWith(...parts);
      } else if (n.nodeType === 1 && n.tagName !== "BR") {
        if (n.id) {
          // Move the element itself (not a copy), so code holding a reference to it keeps working.
          const spot = document.createComment("");
          n.replaceWith(spot);
          spot.replaceWith(mask(n));
          return;
        }
        const words = n.textContent.trim().split(/\s+/);
        const parts = words.flatMap((t, i) => {
          const copy = n.cloneNode(false);
          copy.textContent = t;
          return i ? [document.createTextNode(" "), mask(copy)] : [mask(copy)];
        });
        n.replaceWith(...parts);
      }
    });
  }

  // Big headings rise word by word out of their masks with a slight tilt.
  function initHeadingReveals() {
    $$(".awards__title, .posters__title, .contact__title").forEach((h) => {
      h.setAttribute("aria-label", h.textContent.replace(/\s+/g, " ").trim());
      splitWords(h);
      gsap.fromTo($$(".w__in", h), { yPercent: 115, rotate: 6 }, {
        yPercent: 0, rotate: 0, duration: 1.4, stagger: 0.07, ease: "expo.out",
        scrollTrigger: { trigger: h, start: "top 85%" },
        // Masks open up afterwards so the cycling word's blur isn't clipped.
        onComplete: () => h.classList.add("is-revealed"),
      });
    });
  }

  // The hero title drifts up and fades as the page scrolls past it. (Only the title block moves —
  // the eyebrow and foot are already animated by the intro.)
  function initHeroScroll() {
    if (!animate) return;
    gsap.to(".hero__title", {
      yPercent: -22, opacity: 0.15, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
    });
  }

  // Grids lean slightly with scroll speed and settle back when scrolling stops.
  function initVelocitySkew() {
    if (!animate) return;
    const grids = $$(".posters__grid, .works");
    if (!grids.length) return;
    const setSkew = gsap.quickSetter(grids, "skewY", "deg");
    const proxy = { skew: 0 };
    ScrollTrigger.create({
      onUpdate: (self) => {
        const skew = gsap.utils.clamp(-4, 4, self.getVelocity() / -500);
        if (Math.abs(skew) <= Math.abs(proxy.skew)) return;
        proxy.skew = skew;
        gsap.to(proxy, { skew: 0, duration: 0.9, ease: "power3", overwrite: true, onUpdate: () => setSkew(proxy.skew) });
      },
    });
    gsap.set(grids, { transformOrigin: "center center", force3D: true });
  }

  // Buttons and links lean toward the cursor when it comes close, and spring back on leave.
  function initMagnetic() {
    if (!animate || !finePointer) return;
    $$(".btn--pill, .bar__menu, .hero__scroll, .contact__links a").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * 0.3, y: (e.clientY - r.top - r.height / 2) * 0.4,
          duration: 0.6, ease: "power3", overwrite: "auto" });
      });
      el.addEventListener("pointerleave", () =>
        gsap.to(el, { x: 0, y: 0, duration: 1.1, ease: "elastic.out(1, 0.4)", overwrite: "auto" }));
    });
  }

  /* ---------------- Cursor ---------------- */

  function initCursor() {
    if (!finePointer) return;
    const cursor = $(".cursor"), label = $("#cursorLabel");
    let x = 0, y = 0, cx = 0, cy = 0;
    addEventListener("pointermove", (e) => { x = e.clientX; y = e.clientY; }, { passive: true });
    // Same feel on 60 Hz and 120 Hz screens: the follow amount scales with the frame time,
    // and nothing is written once the cursor has caught up.
    gsap.ticker.add((_, dt) => {
      if (Math.abs(x - cx) < 0.1 && Math.abs(y - cy) < 0.1) return;
      const k = 1 - Math.pow(0.8, dt / 16.67);
      cx += (x - cx) * k; cy += (y - cy) * k;
      cursor.style.translate = `${cx}px ${cy}px`;
    });
    document.addEventListener("pointerover", (e) => {
      const t = e.target.closest("[data-cursor]");
      cursor.classList.toggle("is-on", !!t);
      if (t) label.textContent = t.dataset.cursor;
    });
  }

  /* ---------------- Clock ---------------- */

  function initClock() {
    const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Makassar", hour: "2-digit", minute: "2-digit", hour12: false });
    const tick = () => { $("#clock").textContent = fmt.format(new Date()); };
    tick();
    setInterval(tick, 15000);
  }

  /* ---------------- Intro ---------------- */

  function playIntro() {
    const loader = $("#loader");
    const finish = () => { loader.remove(); document.body.classList.remove("is-loading"); };
    if (!animate) { finish(); return; }

    const counter = { v: 0 };
    gsap.timeline({ onComplete: () => { document.body.classList.remove("is-loading"); lenis?.start(); ScrollTrigger.refresh(); } })
      .to(counter, { v: 100, duration: 1.1, ease: "power2.inOut", onUpdate: () => { $("#loaderCount").textContent = Math.round(counter.v); } })
      .to(loader, { clipPath: "inset(0 0 100% 0)", duration: 0.9, ease: "expo.inOut", onComplete: () => loader.remove() })
      .from(".hero__title .line > span", { yPercent: 105, duration: 1.2, stagger: 0.1, ease: "expo.out" }, "-=0.45")
      .from(".hero__eyebrow, .hero__foot, .bar, .index", { opacity: 0, y: 16, duration: 0.8, stagger: 0.08, ease: "expo.out" }, "<0.3");
  }

  /* ---------------- Boot ---------------- */

  renderShared();
  renderHero();
  renderAbout();
  renderShowcase();
  renderWorks();
  renderPosters();
  renderRecord();
  renderWheel();
  renderAwards();
  renderContact();
  renderIndex();
  initSmooth();
  initColors();
  initMenu();
  initAmbient();
  initFocusList();
  initShowcase();
  initWorkGrid();
  initPosters();
  initCounts();
  initWheel();
  initAwards();
  initCycle();
  initReveals();
  initHeroScroll();
  initVelocitySkew();
  initMagnetic();
  initCursor();
  initClock();
  playIntro();
})();
