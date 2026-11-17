/* =====================================================================
   FX — camada de efeitos de scroll e mouse
   GSAP + ScrollTrigger + Lenis. Melhoria progressiva: se as bibliotecas
   não carregarem, ou se a pessoa pediu "reduzir movimento", o site
   continua completo e funcional sem esta camada.
   ===================================================================== */
(() => {
  "use strict";
  if (matchMedia("(prefers-reduced-motion: reduce)").matches && !document.documentElement.classList.contains("force-fx")) return;

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const root = document.documentElement;
  const fine = matchMedia("(pointer: fine)").matches;
  const G = window.gsap, ST = window.ScrollTrigger;
  const hasGsap = !!(G && ST);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ---------------------------------------------------------------
     1. SCROLL SUAVE COM INÉRCIA (Lenis) — só com mouse/trackpad
     --------------------------------------------------------------- */
  let lenis = null;
  if (window.Lenis && fine) {
    lenis = new window.Lenis({ duration: 1.15, smoothWheel: true, wheelMultiplier: 1 });
    window.__lenis = lenis;
    if (hasGsap) {
      lenis.on("scroll", ST.update);
      G.ticker.add((t) => lenis.raf(t * 1000));
      G.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
    // âncoras internas com o mesmo scroll suave
    document.addEventListener("click", (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a || a.hasAttribute("data-wa")) return;
      const id = a.getAttribute("href");
      const target = id.length > 1 && document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      setTimeout(() => lenis.scrollTo(target, { offset: -70, duration: 1.5, force: true }), 0);
    });
  }

  /* velocidade do scroll (funciona com ou sem Lenis, inclusive no toque) */
  let lastY = scrollY, vel = 0;
  (function velLoop() {
    const y = scrollY;
    vel = lerp(vel, y - lastY, 0.18);
    lastY = y;
    window.__scrollVel = vel;
    requestAnimationFrame(velLoop);
  })();

  /* ---------------------------------------------------------------
     util: quebra texto em palavras preservando <em>, <b>, <span>...
     --------------------------------------------------------------- */
  function splitWords(el, outerCls, innerCls) {
    const out = [];
    const walk = (node) => {
      [...node.childNodes].forEach((ch) => {
        if (ch.nodeType === 3) {
          const frag = document.createDocumentFragment();
          ch.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            const o = document.createElement("span"); o.className = outerCls;
            if (innerCls) { const i = document.createElement("span"); i.className = innerCls; i.textContent = part; o.appendChild(i); out.push(i); }
            else { o.textContent = part; out.push(o); }
            frag.appendChild(o);
          });
          ch.replaceWith(frag);
        } else if (ch.nodeType === 1 && !ch.matches("svg, br")) walk(ch);
      });
    };
    walk(el);
    return out;
  }

  /* ---------------------------------------------------------------
     2. PÉTALAS EM EXPLOSÃO NO CLIQUE
     --------------------------------------------------------------- */
  const NS = "http://www.w3.org/2000/svg";
  const petalColors = ["#F3BFC8", "#D97A8C", "#C9A05C", "#F9DBDE", "#B45366"];
  function burst(x, y, n = 12) {
    for (let i = 0; i < n; i++) {
      const s = document.createElementNS(NS, "svg");
      s.setAttribute("class", "burst");
      s.innerHTML = '<use href="#blossom"/>';
      s.style.left = x + "px"; s.style.top = y + "px";
      s.style.fill = petalColors[i % petalColors.length];
      document.body.appendChild(s);
      const ang = (Math.PI * 2 * i) / n + Math.random() * 0.6;
      const dist = 70 + Math.random() * 110, sc = 0.6 + Math.random() * 0.9;
      s.animate([
        { transform: "translate(-50%,-50%) scale(.2) rotate(0deg)", opacity: 1 },
        { transform: `translate(calc(-50% + ${Math.cos(ang) * dist}px), calc(-50% + ${Math.sin(ang) * dist + 60}px)) scale(${sc}) rotate(${Math.random() * 540 - 270}deg)`, opacity: 0 },
      ], { duration: 1000 + Math.random() * 600, easing: "cubic-bezier(.15,.7,.3,1)" }).onfinish = () => s.remove();
    }
  }
  window.__burst = burst;
  // clique em área "vazia" do hero, ou no frasco, solta pétalas
  $(".hero")?.addEventListener("click", (e) => {
    if (e.target.closest("a, button, input, label")) return;
    burst(e.clientX, e.clientY, e.target.closest(".hero-visual") ? 16 : 10);
  });
  // checklist completo = comemoração
  const ckDone = $("#ck-done");
  if (ckDone) new MutationObserver(() => {
    if (!ckDone.hidden) { const r = $(".ck-ring").getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2, 18); }
  }).observe(ckDone, { attributes: true, attributeFilter: ["hidden"] });

  /* ---------------------------------------------------------------
     3. CURSOR PERSONALIZADO (só mouse)
     --------------------------------------------------------------- */
  if (fine) {
    // rótulos contextuais e áreas escuras
    $$(".flip").forEach((el) => (el.dataset.cursor = "Virar"));
    $$(".read").forEach((el) => (el.dataset.cursor = "Ler"));
    $(".ritual-scene") && ($(".ritual-scene").dataset.cursor = "Ritual");
    $$(".trust, .section--night, .mid-cta, .final, .footer, .vmarquee--dark").forEach((el) => el.setAttribute("data-dark", ""));

    const c = document.createElement("div");
    c.className = "cursor is-hidden"; c.setAttribute("aria-hidden", "true");
    c.innerHTML = '<span class="c-ring"><em class="c-label"></em></span><span class="c-dot"></span>';
    document.body.appendChild(c);
    root.classList.add("has-cursor");
    const ring = $(".c-ring", c), dot = $(".c-dot", c), label = $(".c-label", c);
    let mx = -100, my = -100, rx = -100, ry = -100;
    addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      mx = e.clientX; my = e.clientY;
      dot.style.translate = `${mx}px ${my}px`;
      c.classList.remove("is-hidden");
    }, { passive: true });
    root.addEventListener("mouseleave", () => c.classList.add("is-hidden"));
    addEventListener("mousedown", () => c.classList.add("is-down"));
    addEventListener("mouseup", () => c.classList.remove("is-down"));
    (function loop() {
      rx = lerp(rx, mx, 0.2); ry = lerp(ry, my, 0.2);
      ring.style.translate = `${rx}px ${ry}px`;
      requestAnimationFrame(loop);
    })();
    document.addEventListener("mouseover", (e) => {
      const t = e.target;
      const lab = t.closest("[data-cursor]");
      const btn = t.closest("a, button, summary, label, [role=tab]");
      c.classList.toggle("is-label", !!lab && !btn?.matches("[data-wa], .quiz-card"));
      label.textContent = lab ? lab.dataset.cursor : "";
      c.classList.toggle("is-hover", !!btn && !lab);
      c.classList.toggle("is-wa", !!t.closest("[data-wa], .wa-float"));
      c.classList.toggle("is-light", !!t.closest("[data-dark]") || !!t.closest(".flip[aria-pressed='true']"));
      c.classList.toggle("is-text", !!t.closest("input[type=search], input[type=text]"));
    });
  }

  /* ---------------------------------------------------------------
     4. SPOTLIGHT — brilho que segue o mouse dentro dos cards
     --------------------------------------------------------------- */
  if (fine) {
    $$(".flip-front, .kit, .cmp-card, .step, .tl-step, .checklist, .label-note, .bars, .faq-item, .read, .quiz-card, .mid-cta")
      .forEach((el) => el.classList.add("spot"));
    document.addEventListener("pointermove", (e) => {
      const el = e.target.closest?.(".spot");
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
    }, { passive: true });
  }

  /* ---------------------------------------------------------------
     5. HERO — camadas com profundidade seguindo o mouse
     --------------------------------------------------------------- */
  const hero = $(".hero");
  if (fine && hero) {
    const layers = [[".moon", -34], [".branch--hero", 26], [".hero-pagoda", -16], [".jp-vertical", 14], [".hero-copy", 8]]
      .map(([s, f]) => [$(s), f]).filter(([el]) => el);
    let tx = 0, ty = 0, cx = 0, cy = 0, active = true;
    hero.addEventListener("mousemove", (e) => { tx = e.clientX / innerWidth - 0.5; ty = e.clientY / innerHeight - 0.5; });
    hero.addEventListener("mouseleave", () => { tx = ty = 0; });
    new IntersectionObserver(([en]) => (active = en.isIntersecting)).observe(hero);
    (function loop() {
      if (active) {
        cx = lerp(cx, tx, 0.06); cy = lerp(cy, ty, 0.06);
        layers.forEach(([el, f]) => (el.style.translate = `${(cx * f).toFixed(2)}px ${(cy * f).toFixed(2)}px`));
      }
      requestAnimationFrame(loop);
    })();
  }

  /* ---------------------------------------------------------------
     6. FAIXA QUE ACELERA E INCLINA COM A VELOCIDADE DO SCROLL
     --------------------------------------------------------------- */
  (function vmarquee() {
    const box = $(".vmarquee"), track = $(".vm-track");
    if (!box || !track) return;
    track.innerHTML += track.innerHTML;
    track.style.animation = "none";
    let x = 0, dir = 1, on = false, skew = 0;
    new IntersectionObserver(([en]) => (on = en.isIntersecting)).observe(box);
    (function loop() {
      if (on) {
        const v = window.__scrollVel || 0;
        if (Math.abs(v) > 0.6) dir = v > 0 ? 1 : -1;
        x -= (0.7 + Math.min(Math.abs(v) * 0.45, 22)) * dir;
        const w = track.scrollWidth / 2;
        if (x <= -w) x += w; if (x > 0) x -= w;
        skew = lerp(skew, clamp(-v * 0.35, -10, 10), 0.15);
        track.style.transform = `translate3d(${x}px,0,0) skewX(${skew.toFixed(2)}deg)`;
      }
      requestAnimationFrame(loop);
    })();
  })();

  /* ---------------------------------------------------------------
     7. NAVEGAÇÃO POR PONTOS (lateral, desktop largo)
     --------------------------------------------------------------- */
  (function dots() {
    const secs = [["topo", "Início"], ["manifesto", "Manifesto"], ["ativos", "Composição"], ["ritual", "Ritual"], ["cronograma", "Cronograma"],
      ["comparativo", "A conta"], ["kits", "Kits"], ["entrega", "Entrega"], ["sobre", "Quem atende"], ["faq", "Dúvidas"], ["contato", "Conversar"]]
      .filter(([id]) => document.getElementById(id));
    const nav = document.createElement("nav");
    nav.className = "dots"; nav.setAttribute("aria-label", "Navegar pelas seções");
    nav.innerHTML = secs.map(([id, l]) => `<a href="#${id}" aria-label="${l}"><span>${l}</span></a>`).join("");
    document.body.appendChild(nav);
    const links = $$("a", nav), dark = new Set(["ritual", "contato"]);
    const io = new IntersectionObserver((ens) => ens.forEach((en) => {
      if (!en.isIntersecting) return;
      links.forEach((a) => a.classList.toggle("is-on", a.getAttribute("href") === "#" + en.target.id));
      nav.classList.toggle("on-dark", dark.has(en.target.id));
    }), { rootMargin: "-50% 0px -50% 0px" });
    secs.forEach(([id]) => io.observe(document.getElementById(id)));
  })();

  /* ---------------------------------------------------------------
     A partir daqui: tudo que depende do GSAP / ScrollTrigger
     --------------------------------------------------------------- */
  if (!hasGsap) return;
  G.registerPlugin(ST);
  root.classList.add("has-gsap");

  /* 8. BOTÕES MAGNÉTICOS */
  if (fine) {
    $$(".btn-wa:not(.btn-wa--block), .quiz-card, .seg button, .view-toggle button, .logo-mark, .nav a, #ritual-play").forEach((el) => {
      const k = el.matches(".nav a, .seg button, .view-toggle button") ? 0.22 : 0.38;
      el.classList.add("is-mag");
      const xTo = G.quickTo(el, "x", { duration: 0.6, ease: "power3.out" });
      const yTo = G.quickTo(el, "y", { duration: 0.6, ease: "power3.out" });
      const inner = el.querySelectorAll(":scope > svg, :scope > span");
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - r.left - r.width / 2, dy = e.clientY - r.top - r.height / 2;
        xTo(dx * k); yTo(dy * k);
        if (inner.length) G.to(inner, { x: dx * k * 0.35, y: dy * k * 0.35, duration: 0.6, ease: "power3.out", overwrite: "auto" });
      });
      el.addEventListener("mouseleave", () => {
        G.to(el, { x: 0, y: 0, duration: 1, ease: "elastic.out(1,0.35)" });
        if (inner.length) G.to(inner, { x: 0, y: 0, duration: 1, ease: "elastic.out(1,0.35)" });
      });
    });
  }

  /* 9. TÍTULOS QUE SOBEM DE DENTRO DE UMA MÁSCARA */
  $$(".sec-head h2, .mid-cta h3, .final h2, .checklist h3").forEach((h) => {
    const words = splitWords(h, "m", "mi");
    G.from(words, {
      yPercent: 115, rotate: 4, duration: 1.15, ease: "expo.out", stagger: 0.045,
      scrollTrigger: { trigger: h, start: "top 88%", once: true },
    });
  });

  /* 10. MANIFESTO — palavras acendem com o scroll */
  const mWords = $(".manifesto-text") ? splitWords($(".manifesto-text"), "sw") : [];

  const mm = G.matchMedia();
  mm.add({ desk: "(min-width: 960px)", mob: "(max-width: 959px)" }, (ctx) => {
    const { desk } = ctx.conditions;
    const cleanups = [];

    if (mWords.length) {
      G.fromTo(mWords, { opacity: 0.12 }, {
        opacity: 1, stagger: 0.1, ease: "none",
        scrollTrigger: desk
          ? { trigger: "#manifesto", start: "top top", end: "+=120%", pin: true, scrub: 0.6 }
          : { trigger: ".manifesto-text", start: "top 85%", end: "bottom 45%", scrub: 0.6 },
      });
      G.fromTo(".manifesto-sign", { opacity: 0, y: 20 }, {
        opacity: 1, y: 0, ease: "none",
        scrollTrigger: desk ? { trigger: "#manifesto", start: "top+=60% top", end: "top+=100% top", scrub: true }
          : { trigger: ".manifesto-sign", start: "top 95%", end: "top 75%", scrub: true },
      });
    }

    /* 11. KITS — frascos entram em leque */
    G.from(".kit-bottles", {
      y: 50, opacity: 0, scale: 0.7, rotate: (i) => (i - 1) * 6, duration: 1.1, ease: "back.out(1.6)", stagger: 0.12,
      scrollTrigger: { trigger: ".kits-grid", start: "top 80%", once: true },
    });

    /* 12. Foto do "Sobre" revelada de baixo para cima + monograma em parallax */
    G.fromTo(".photo-frame", { clipPath: "inset(100% 0% 0% 0%)" }, {
      clipPath: "inset(0% 0% 0% 0%)", duration: 1.4, ease: "expo.inOut", clearProps: "clipPath",
      scrollTrigger: { trigger: ".about", start: "top 75%", once: true },
    });
    G.fromTo(".monogram", { yPercent: 25 }, { yPercent: -25, ease: "none", scrollTrigger: { trigger: ".about", start: "top bottom", end: "bottom top", scrub: true } });

    /* 13. CTA final — pagoda cresce com o scroll */
    G.set(".final-pagoda", { xPercent: -50, x: 0 });
    G.fromTo(".final-pagoda", { scale: 0.75, yPercent: 18, opacity: 0.02 }, {
      scale: 1.15, yPercent: 0, opacity: 0.07, ease: "none",
      scrollTrigger: { trigger: ".final", start: "top bottom", end: "bottom bottom", scrub: true },
    });

    if (desk) {
      /* 14. HERO — frasco cresce e gira ao sair, texto se afasta */
      G.to(".hero-visual", { yPercent: -8, scale: 1.12, rotate: -6, ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
      G.to(".hero-copy", { y: -70, opacity: 0.15, ease: "none",
        scrollTrigger: { trigger: ".hero", start: "35% top", end: "bottom top", scrub: true } });

      /* 15. COMPOSIÇÃO — seção fixa, órbita gira com o scroll e destaca cada ativo */
      const orbit = $(".orbit"), items = $$("#ativos-list li"), nodes = $$(".o-node");
      if (orbit && items.length === 5) {
        root.classList.add("fx-orbit");
        const names = items.map((li) => li.textContent.trim());
        const box = document.createElement("div");
        box.className = "ativo-now";
        box.innerHTML = '<span class="an-idx">01</span><span class="an-tot">/ 05</span><strong class="an-name"></strong><span class="an-bar"><i></i></span>';
        $("#ativos-list").before(box);
        const idxEl = $(".an-idx", box), nameEl = $(".an-name", box), barEl = $(".an-bar i", box);
        let cur = -1;
        const setActive = (i) => {
          if (i === cur) return; cur = i;
          items.forEach((el) => el.classList.toggle("is-hl", +el.dataset.i === i));
          nodes.forEach((el) => el.classList.toggle("is-hl", +el.dataset.i === i));
          idxEl.textContent = String(i + 1).padStart(2, "0");
          nameEl.textContent = names[i];
          G.fromTo([idxEl, nameEl], { yPercent: 70, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.55, ease: "power3.out", stagger: 0.05, overwrite: true });
        };
        setActive(0);
        ST.create({
          trigger: "#ativos", start: "top top", end: "+=170%", pin: true, scrub: 0.6,
          onUpdate: (self) => {
            const p = self.progress;
            orbit.style.setProperty("--spin", `${(-288 * p).toFixed(2)}deg`);
            barEl.style.transform = `scaleX(${p})`;
            setActive(clamp(Math.round(p * 4), 0, 4));
          },
        });
        cleanups.push(() => { root.classList.remove("fx-orbit"); box.remove(); orbit.style.removeProperty("--spin"); });
      }

      /* 16. ENTREGA — caminho se desenha e o pacote viaja com o scroll */
      const steps = $("#steps"), pkg = $("#pkg"), draw = $("#steps-draw");
      if (steps && pkg && draw && "offsetPath" in pkg.style) {
        root.classList.add("fx-steps");
        const cards = $$(".step", steps);
        const len = draw.getTotalLength();
        draw.style.strokeDasharray = len; draw.style.strokeDashoffset = len;
        const setPath = () => {
          const s = steps.offsetWidth / 1000;
          pkg.style.offsetPath = `path("M${80 * s} 60 C${260 * s} 0 ${340 * s} 120 ${500 * s} 60 S${740 * s} 0 ${920 * s} 60")`;
        };
        setPath(); addEventListener("resize", setPath);
        G.set(pkg, { opacity: 1 });
        ST.create({
          trigger: steps, start: "top 72%", end: "bottom 62%", scrub: 0.7,
          onUpdate: (self) => {
            const p = self.progress;
            draw.style.strokeDashoffset = len * (1 - p);
            pkg.style.offsetDistance = `${(p * 100).toFixed(2)}%`;
            cards.forEach((c, i) => c.classList.toggle("is-lit", p >= i * 0.5 - 0.03));
          },
        });
        cleanups.push(() => { root.classList.remove("fx-steps"); removeEventListener("resize", setPath); });
      }

      /* 17. RITUAL — lua e estrelas em parallax */
      G.to(".stars", { yPercent: -18, ease: "none", scrollTrigger: { trigger: "#ritual", start: "top bottom", end: "bottom top", scrub: true } });
      G.fromTo(".ritual-scene > svg", { y: 60 }, { y: -40, ease: "none", scrollTrigger: { trigger: "#ritual", start: "top bottom", end: "bottom top", scrub: true } });

      /* 18. Cards de comparação e passos entram com leve 3D */
      G.from(".cmp-card", { rotateX: -25, y: 40, opacity: 0, transformPerspective: 900, transformOrigin: "50% 100%", duration: 1, ease: "power3.out", stagger: 0.1,
        scrollTrigger: { trigger: "#cmp", start: "top 82%", once: true } });
    }

    return () => cleanups.forEach((f) => f());
  });

  // recalcula posições quando fontes carregam e após o layout assentar
  document.fonts?.ready.then(() => ST.refresh());
  addEventListener("load", () => ST.refresh());
})();
