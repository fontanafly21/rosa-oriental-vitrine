/* =====================================================================
   Rosa Oriental × Dr. Riccardo Nikkei — interações do site vitrine
   Regras seguidas: Guia do Site v1.0, caps. 4, 6, 7, 8 e 9
   ===================================================================== */
(() => {
  "use strict";
  const C = window.SITE_CONFIG || {};
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches && !document.documentElement.classList.contains("force-fx");
  const isDesktop = () => matchMedia("(min-width: 960px)").matches;
  const fine = matchMedia("(pointer: fine)").matches;

  /* ---------- armazenamento seguro ---------- */
  const store = {
    get(k, s = localStorage) { try { return s.getItem(k); } catch { return null; } },
    set(k, v, s = localStorage) { try { s.setItem(k, v); } catch {} },
  };
  const sess = {
    get: (k) => store.get(k, sessionStorage),
    set: (k, v) => store.set(k, v, sessionStorage),
  };
  const isNewSession = !sess.get("ro_session");
  sess.set("ro_session", "1");

  /* ---------- formatação ---------- */
  const brl = (n) => "R$ " + (Number.isInteger(n) ? n.toLocaleString("pt-BR") :
    n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));

  /* ---------- métricas (cap. 9.1) ---------- */
  window.dataLayer = window.dataLayer || [];
  function track(name, params = {}) {
    window.dataLayer.push({ event: name, ...params });
    if (typeof window.fbq === "function") {
      const std = ["PageView", "Contact"];
      window.fbq(std.includes(name) ? "track" : "trackCustom", name, params);
    }
  }

  /* ---------- config → página ---------- */
  const firstName = C.firstName || "Riccardo";
  $$("[data-brand-name]").forEach((el) => { if (C.brandName) el.textContent = C.brandName; });
  $$("[data-first-name]").forEach((el) => (el.textContent = firstName));
  if (C.brandName) document.title = `${C.brandName} | Rosa Oriental`;
  $("#year").textContent = new Date().getFullYear();
  if (C.photo) {
    const img = new Image();
    img.src = C.photo; img.alt = `Foto de ${firstName}`; img.loading = "lazy";
    const frame = $("#photo-frame"); frame.innerHTML = ""; frame.appendChild(img);
  }

  /* ---------- UTMs preservadas (cap. 9.2) ---------- */
  const qs = new URLSearchParams(location.search);
  ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].forEach((k) => {
    if (qs.get(k)) sess.set(k, qs.get(k));
  });
  const utmRef = () => {
    const parts = ["utm_campaign", "utm_content", "utm_term"].map((k) => sess.get(k)).filter(Boolean);
    return parts.length ? `\n\n(ref: ${parts.join("-")})` : "";
  };

  /* ---------- links de WhatsApp com pré-mensagem ---------- */
  const hi = `Oi, ${firstName}! Vim pelo site`;
  const MSG = {
    default: `${hi} e queria saber mais sobre o Rosa Oriental.`,
    rotulo: `${hi} e queria ver a foto do rótulo do Rosa Oriental (tabela nutricional).`,
    tabela: `${hi} e queria a tabela completa de custo mensal dos kits.`,
    "kit-3+1": `${hi} e queria conversar sobre o Kit 3+1 (4 frascos).`,
    "kit-5+1": `${hi} e queria conversar sobre o Kit 5+1 (6 frascos).`,
    "kit-1": `${hi} e queria conversar sobre o Kit 1 mês.`,
    "kit-9": `${hi} e queria conversar sobre o Kit 9 meses.`,
    "kit-12": `${hi} e queria conversar sobre o Kit 12 meses + brinde.`,
    "kit-16": `${hi} e queria saber do Kit 16 meses + brinde.`,
    checklist: `${hi} e queria conferir CNPJ, rastreio e garantia antes de comprar.`,
    faq: `${hi} e tenho uma dúvida que não encontrei lá:`,
    exit: `${hi}. Pode me mandar a tabela completa de custo mensal e a foto do rótulo?`,
    lembrete: `${hi} de novo e fiquei com uma dúvida sobre os kits.`,
    welcome: `${hi} e queria falar direto com você.`,
    foto: `${hi}. Recebi meu Rosa Oriental e quero mandar minha foto (autorizo usar no site).`,
  };
  const waHref = (key) => {
    const text = (MSG[key] || MSG.default) + utmRef();
    return `https://wa.me/${(C.whatsapp || "").replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
  };
  function bindWa(root = document) {
    $$("[data-wa]", root).forEach((a) => { a.href = waHref(a.dataset.wa); });
  }
  bindWa();
  document.addEventListener("click", (e) => {
    const a = e.target.closest("[data-wa]");
    if (!a) return;
    // upsell: ao escolher um kit, mostra o kit seguinte com a conta na mesa (1x por kit por sessão)
    if (!a.closest(".modal") && UPSELL[a.dataset.wa] && sess.get("ro_up_" + a.dataset.wa) !== "1") {
      e.preventDefault();
      openUpsell(a.dataset.wa);
      return;
    }
    a.href = waHref(a.dataset.wa); // garante UTM atual
    store.set("ro_wa_clicked", "1");
    track("Contact", { placement: a.dataset.wa });
    if (a.closest(".modal")) track("PopupConvert", { popup: modal.current || "?" });
  });

  /* ---------- janela de atendimento real (cap. 6.1) ---------- */
  function spNow() {
    const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Sao_Paulo", weekday: "short", hour: "numeric", minute: "numeric", hour12: false,
    }).formatToParts(new Date()).map((x) => [x.type, x.value]));
    const days = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return { day: days[p.weekday], h: +p.hour % 24, m: +p.minute };
  }
  function updateStatus() {
    const H = C.hours || { open: 9, close: 18, days: [1, 2, 3, 4, 5] };
    const { day, h } = spNow();
    const workday = H.days.includes(day);
    let open = false, text;
    if (workday && h >= H.open && h < H.close) {
      open = true;
      text = `Online agora · atendo hoje até as ${H.close}h — respostas em minutos.`;
    } else if (workday && h < H.open) {
      text = `Atendimento abre hoje às ${H.open}h — deixe sua mensagem e eu respondo.`;
    } else {
      let next = (day + 1) % 7, n = 1;
      while (!H.days.includes(next) && n < 7) { next = (next + 1) % 7; n++; }
      const names = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
      const when = n === 1 ? "amanhã" : names[next];
      text = `Fora do horário agora — deixe sua mensagem, respondo ${when} a partir das ${H.open}h.`;
    }
    $$("[data-status]").forEach((el) => {
      el.dataset.open = open ? "1" : "0";
      $(".status-text", el).textContent = text;
    });
  }
  updateStatus();
  setInterval(updateStatus, 60000);

  /* ---------- 0 · barra de promoção com data real ---------- */
  (function promo() {
    const P = C.promo || {};
    if (!P.enabled || !P.endDate || store.get("ro_promo_closed") === P.endDate) return;
    const end = new Date(P.endDate + "T23:59:59-03:00");
    if (isNaN(end) || Date.now() > end) return;
    $("#promo-text").textContent = P.text;
    $("#promo-date").textContent = `— válida até ${end.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}`;
    $("#promo").hidden = false;
    $("#promo-close").onclick = () => { $("#promo").hidden = true; store.set("ro_promo_closed", P.endDate); };
  })();

  /* ---------- scroll: header, progresso, flutuante, profundidade ---------- */
  const header = $("#header"), bar = $("#progress-bar"), float = $("#wa-float");
  let lastY = scrollY, ticking = false, depth = { 50: false, 75: false }, maxPct = 0;
  function onScroll() {
    const y = scrollY, h = document.documentElement.scrollHeight - innerHeight;
    const pct = h > 0 ? y / h : 0;
    maxPct = Math.max(maxPct, pct);
    bar.style.transform = `scaleX(${pct})`;
    header.classList.toggle("is-scrolled", y > 10);
    header.classList.toggle("is-hidden", pct > 0.1 && y > lastY + 4 && !modal.isOpen());
    if (y < lastY - 4 || pct <= 0.1) header.classList.remove("is-hidden");
    float.classList.toggle("is-on", pct > 0.25);
    [50, 75].forEach((d) => { if (!depth[d] && pct * 100 >= d) { depth[d] = true; track("ScrollDepth", { percent: d }); } });
    parallax(y);
    popups.onScroll(pct);
    lastY = y; ticking = false;
  }
  addEventListener("scroll", () => { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });

  /* ---------- parallax + tilt do hero ---------- */
  const px = $$("[data-parallax]");
  function parallax(y) {
    if (reduced || y > innerHeight * 1.2) return;
    px.forEach((el) => (el.style.transform = `translate3d(0, ${y * parseFloat(el.dataset.parallax)}px, 0)`));
  }
  const tilt = $("#tilt");
  if (tilt && fine && !reduced) {
    const hero = $(".hero");
    hero.addEventListener("mousemove", (e) => {
      const r = hero.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      tilt.style.transform = `perspective(900px) rotateY(${x * 14}deg) rotateX(${-y * 10}deg)`;
    });
    hero.addEventListener("mouseleave", () => (tilt.style.transform = ""));
  }

  /* ---------- título palavra por palavra ---------- */
  $$("[data-split]").forEach((el) => {
    const words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map((w, i) => `<span class="w" style="--i:${i}">${w}</span>`).join(" ");
    requestAnimationFrame(() => setTimeout(() => el.classList.add("is-in"), 120));
  });

  /* ---------- reveal ao rolar ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const el = en.target;
      const sibs = $$(".reveal", el.parentElement).filter((s) => !s.classList.contains("is-in"));
      const idx = Math.max(0, sibs.indexOf(el));
      el.style.transitionDelay = `${Math.min(idx, 4) * 90}ms`;
      el.classList.add("is-in");
      io.unobserve(el);
    });
  }, { threshold: 0.14, rootMargin: "0px 0px -6% 0px" });
  $$(".reveal").forEach((el) => io.observe(el));

  /* ---------- 3 · marquee de selos ---------- */
  const tl = $(".trust-list");
  if (tl) { const c = tl.cloneNode(true); c.setAttribute("aria-hidden", "true"); tl.parentElement.appendChild(c); }

  /* ---------- 4 · cartões que viram ---------- */
  $$(".flip").forEach((f) => f.addEventListener("click", () => {
    f.setAttribute("aria-pressed", f.getAttribute("aria-pressed") === "true" ? "false" : "true");
  }));

  /* ---------- 5 · ativos: destaque sincronizado ---------- */
  (function ativos() {
    const items = $$("#ativos-list li"), nodes = $$(".o-node");
    let i = 0, timer = null, paused = false;
    const hl = (n) => {
      items.forEach((el) => el.classList.toggle("is-hl", +el.dataset.i === n));
      nodes.forEach((el) => el.classList.toggle("is-hl", +el.dataset.i === n));
    };
    // no desktop com efeitos, o fx.js controla a órbita pelo scroll
    const loop = () => { if (document.documentElement.classList.contains("fx-orbit")) return; if (!paused) { hl(i); i = (i + 1) % 5; } };
    items.forEach((el) => {
      el.addEventListener("mouseenter", () => { paused = true; hl(+el.dataset.i); });
      el.addEventListener("mouseleave", () => { paused = false; });
    });
    new IntersectionObserver(([en]) => {
      clearInterval(timer);
      if (en.isIntersecting) { loop(); timer = setInterval(loop, 2000); }
    }, { threshold: 0.3 }).observe($("#ativos"));
  })();

  /* ---------- 6 · ritual de 1 minuto ---------- */
  (function ritual() {
    const scene = $("#ritual-scene"), steps = $$("#ritual-steps li"), sec = $("#ritual-sec");
    let running = false;
    function play() {
      if (running) return; running = true;
      scene.classList.remove("play"); void scene.offsetWidth; scene.classList.add("play");
      steps.forEach((s) => s.classList.remove("is-on"));
      [0, 1600, 3400].forEach((t, k) => setTimeout(() => {
        steps.forEach((s) => s.classList.remove("is-on")); steps[k].classList.add("is-on");
      }, t));
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min(1, (now - start) / 6000);
        sec.textContent = `${Math.round(60 - p * 60)}s`;
        if (p < 1) requestAnimationFrame(tick);
        else { sec.textContent = "✓"; running = false; }
      };
      requestAnimationFrame(tick);
    }
    $("#ritual-play").addEventListener("click", play);
    if (!reduced) {
      const ob = new IntersectionObserver(([en]) => { if (en.isIntersecting) { play(); ob.disconnect(); } }, { threshold: 0.5 });
      ob.observe(scene);
    }
  })();

  /* ---------- 7 · linha do tempo acompanha o scroll ---------- */
  (function timeline() {
    const wrap = $("#timeline"), fill = $("#tl-fill"), steps = $$(".tl-step", wrap);
    function upd() {
      const r = wrap.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, (innerHeight * 0.75 - r.top) / (r.height + innerHeight * 0.25)));
      const horizontal = isDesktop();
      fill.style.transform = horizontal ? `scaleX(${p})` : `scaleY(${p})`;
      steps.forEach((s, i) => s.classList.toggle("is-on", p >= i * 0.38 + 0.02));
    }
    addEventListener("scroll", () => requestAnimationFrame(upd), { passive: true });
    addEventListener("resize", upd); upd();
  })();

  /* ---------- 8 · comparativo cápsula x pó ---------- */
  (function compare() {
    const tabs = $$("[data-cmp]"), pill = $("#seg-pill"), cmp = $("#cmp");
    function set(mode, btn) {
      tabs.forEach((t) => t.setAttribute("aria-selected", t === btn ? "true" : "false"));
      pill.style.width = btn.offsetWidth + "px";
      pill.style.transform = `translateX(${btn.offsetLeft - 5}px)`;
      cmp.dataset.mode = mode;
      $$("[data-caps]", cmp).forEach((el) => {
        el.textContent = el.dataset[mode === "po" ? "po" : "caps"];
        el.classList.remove("swap"); void el.offsetWidth; el.classList.add("swap");
      });
    }
    tabs.forEach((t) => t.addEventListener("click", () => set(t.dataset.cmp, t)));
    const init = () => { const on = tabs.find((t) => t.getAttribute("aria-selected") === "true"); pill.style.width = on.offsetWidth + "px"; pill.style.transform = `translateX(${on.offsetLeft - 5}px)`; };
    addEventListener("resize", init); document.fonts?.ready.then(init); init();
  })();

  /* ---------- 9 · kits: frascos, alternância e contagem ---------- */
  $$(".kit-bottles").forEach((box) => {
    const n = +box.dataset.count, bonus = +box.dataset.bonus;
    let html = "";
    for (let i = 0; i < n; i++) {
      const isBonus = bonus && i === n - 1;
      html += `<img class="${isBonus ? "is-bonus" : ""}" src="assets/img/frasco-sm.webp" width="147" height="280" alt="" style="z-index:${Math.round(n - Math.abs(i - (n - 1) / 2))}">`;
    }
    if (bonus) html += `<span class="bonus-tag">+1 brinde</span>`;
    box.innerHTML = html;
  });
  function countTo(el, to, dur = 900) {
    if (reduced) { el.textContent = brl(to); return; }
    const from = parseFloat(el.dataset.cur || 0), start = performance.now();
    const dec = !Number.isInteger(to);
    const step = (now) => {
      const p = Math.min(1, (now - start) / dur), e = 1 - Math.pow(1 - p, 3);
      const v = from + (to - from) * e;
      el.textContent = brl(p < 1 ? (dec ? Math.round(v * 100) / 100 : Math.round(v)) : to);
      if (p < 1) requestAnimationFrame(step); else el.dataset.cur = to;
    };
    requestAnimationFrame(step);
  }
  let view = "mes";
  $$("[data-view]").forEach((b) => b.addEventListener("click", () => {
    view = b.dataset.view;
    $$("[data-view]").forEach((x) => x.classList.toggle("is-on", x === b));
    $$(".kit-big").forEach((el) => countTo(el, parseFloat(el.dataset[view])));
    $$(".kit-unit").forEach((el) => (el.textContent = el.dataset[view]));
  }));
  const kitsOb = new IntersectionObserver(([en]) => {
    if (!en.isIntersecting) return;
    $$(".kit-big").forEach((el) => { el.dataset.cur = 0; countTo(el, parseFloat(el.dataset[view]), 1300); });
    store.set("ro_saw_kits", String(Date.now()));
    kitsOb.disconnect();
  }, { threshold: 0.35 });
  kitsOb.observe($(".kits-grid"));
  // tilt suave nos cards (desktop)
  if (fine && !reduced) $$(".kit").forEach((k) => {
    k.addEventListener("mousemove", (e) => {
      const r = k.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      k.style.transform = `perspective(1000px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) translateY(-6px)`;
    });
    k.addEventListener("mouseleave", () => (k.style.transform = ""));
  });

  /* ---------- 10 · pacote percorrendo o caminho ---------- */
  (function pkg() {
    const p = $("#pkg");
    if (!p || reduced || !("offsetPath" in p.style)) return;
    new IntersectionObserver(([en], ob) => {
      if (!en.isIntersecting || !isDesktop()) return;
      ob.disconnect();
      if (document.documentElement.classList.contains("fx-steps")) return; // fx.js anima pelo scroll
      // ajusta o caminho à largura real
      const w = $("#steps").offsetWidth, s = w / 1000;
      p.style.offsetPath = `path("M${80 * s} 60 C${260 * s} 0 ${340 * s} 120 ${500 * s} 60 S${740 * s} 0 ${920 * s} 60")`;
      p.animate([{ offsetDistance: "0%", opacity: 0 }, { opacity: 1, offset: 0.08 }, { offsetDistance: "100%", opacity: 1 }],
        { duration: 3600, easing: "cubic-bezier(.45,.05,.35,1)", fill: "forwards" });
    }, { threshold: 0.5 }).observe($("#steps"));
  })();

  /* ---------- checklist de compra segura ---------- */
  (function checklist() {
    const boxes = $$("#checklist input"), fill = $("#ck-fill"), count = $("#ck-count"), done = $("#ck-done");
    const C2 = 169.6;
    boxes.forEach((b) => b.addEventListener("change", () => {
      const n = boxes.filter((x) => x.checked).length;
      fill.style.strokeDashoffset = C2 - (C2 * n) / boxes.length;
      count.textContent = `${n}/${boxes.length}`;
      done.hidden = n !== boxes.length;
      if (n === boxes.length) track("ChecklistComplete");
    }));
  })();

  /* ---------- 12 · depoimentos (só autorizados) ---------- */
  if (Array.isArray(C.testimonials) && C.testimonials.length) {
    const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
    $("#testi-grid").innerHTML = C.testimonials.map((t) =>
      `<blockquote class="testi reveal"><p>${esc(t.text)}</p><footer>${esc(t.name)}${t.city ? `<span>${esc(t.city)}</span>` : ""}</footer></blockquote>`).join("");
    $("#depoimentos").hidden = false;
    $$("#testi-grid .reveal").forEach((el) => io.observe(el));
  }

  /* ---------- 13 · FAQ (cap. 5.5) + schema ---------- */
  const FAQ = [
    ["O Rosa Oriental é aprovado pela Anvisa?", "Suplemento alimentar é dispensado de registro pela RDC 240/18. O que se verifica é a autorização de funcionamento do fabricante — o número está no rodapé do site oficial (350750601-109-000050-1-0). Te envio o passo a passo para você conferir no portal da Anvisa."],
    ["Qual a dose de cada ingrediente?", "A tabela nutricional completa está no rótulo do frasco — envio a foto pelo WhatsApp antes de qualquer compra."],
    ["Em quanto tempo vejo resultado?", "A marca informa 2-4 semanas para primeiros sinais e 6-8 semanas para efeitos maiores, com uso contínuo. Resultados variam de pessoa para pessoa — não prometemos data."],
    ["Quanto custa por mês?", "Do kit 5+1: R$ 74,50/mês. Do 3+1: R$ 86,75/mês. Do frasco único: R$ 207/mês (a pior conta — dizemos isso para você decidir bem)."],
    ["Entrega mesmo? E se não chegar?", "Rastreio em até 72h pelos Correios. Se atrasar, eu acompanho o caso com a plataforma até resolver — entrega, reposição ou reembolso conforme os termos."],
    ["É igual a Botox?", "Não — são categorias diferentes. Suplemento é parte de rotina e age de dentro para fora; procedimento é intervenção médica. Um não substitui o outro."],
    ["Funciona mesmo? Tem depoimento?", "Publicamos apenas depoimentos autorizados por escrito, do jeito que a cliente escreveu. E a regra vale sempre: resultados variam de pessoa para pessoa."],
    ["E se não funcionar? Reembolsa?", "A garantia que vale é a escrita no checkout — enviamos o print da tela de compra antes de você pagar. Não prometemos além do que está lá."],
    ["Posso tomar com remédio?", "Essa resposta é do seu médico ou nutricionista. Enviamos a foto do rótulo completo para você levar à consulta — não orientamos uso por conta própria."],
    ["Achei mais barato no Mercado Livre", "Podem existir anúncios lá — o que é verificável é isto: garantia, brinde e suporte valem na compra pelo canal oficial. Se preferir comparar, enviamos as condições lado a lado."],
  ];
  const faqList = $("#faq-list");
  if (!faqList.children.length) faqList.innerHTML = FAQ.map(([q, a], i) => `
    <div class="faq-item reveal" data-q="${i}">
      <h3><button class="faq-q" aria-expanded="false" aria-controls="fa-${i}" id="fq-${i}"><span class="faq-qt">${q}</span><span class="faq-ico" aria-hidden="true"></span></button></h3>
      <div class="faq-a" id="fa-${i}" role="region" aria-labelledby="fq-${i}"><div><p class="faq-at">${a}</p></div></div>
    </div>`).join("");
  $$(".faq-item", faqList).forEach((el) => io.observe(el));
  faqList.addEventListener("click", (e) => {
    const b = e.target.closest(".faq-q"); if (!b) return;
    const item = b.closest(".faq-item"), open = !item.classList.contains("is-open");
    item.classList.toggle("is-open", open); b.setAttribute("aria-expanded", open);
    if (open) track("FaqOpen", { question: $(".faq-qt", item).textContent });
  });
  if (!$("#faq-schema").textContent.trim()) $("#faq-schema").textContent = JSON.stringify({
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
  });
  const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  $("#faq-search").addEventListener("input", (e) => {
    const term = norm(e.target.value.trim());
    let shown = 0;
    $$(".faq-item", faqList).forEach((item) => {
      const [q, a] = FAQ[+item.dataset.q];
      const hit = !term || norm(q + " " + a).includes(term);
      item.hidden = !hit; if (hit) shown++;
      const mark = (txt) => {
        if (!term) return txt;
        const n = norm(txt), idx = n.indexOf(term);
        return idx < 0 ? txt : txt.slice(0, idx) + "<mark>" + txt.slice(idx, idx + term.length) + "</mark>" + txt.slice(idx + term.length);
      };
      $(".faq-qt", item).innerHTML = mark(q);
      $(".faq-at", item).innerHTML = mark(a);
      item.classList.add("is-in");
      if (term && hit) { item.classList.add("is-open"); $(".faq-q", item).setAttribute("aria-expanded", "true"); }
    });
    $("#faq-empty").hidden = shown > 0;
  });

  /* =====================================================================
     MODAL ÚNICO — pop-ups nunca empilham (cap. 7.1)
     ===================================================================== */
  const modal = (() => {
    const el = $("#modal"), body = $("#modal-body"), box = $("#modal-box");
    let lastFocus = null;
    const api = {
      current: null,
      isOpen: () => !el.hidden,
      open(id, html, wide = false) {
        if (!el.hidden) return false;
        lastFocus = document.activeElement;
        api.current = id;
        body.innerHTML = html;
        box.classList.toggle("modal-box--wide", wide);
        el.hidden = false;
        document.body.style.overflow = "hidden";
        window.__lenis?.stop();
        bindWa(body);
        setTimeout(() => (body.querySelector("button, a, [tabindex]") || $(".modal-x")).focus(), 60);
        return true;
      },
      close() {
        if (el.hidden) return;
        if (api.current && api.current.startsWith("popup:")) track("PopupClose", { popup: api.current });
        el.hidden = true; document.body.style.overflow = ""; api.current = null;
        window.__lenis?.start();
        lastFocus?.focus?.();
      },
    };
    el.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) api.close(); });
    addEventListener("keydown", (e) => {
      if (el.hidden) return;
      if (e.key === "Escape") api.close();
      if (e.key === "Tab") { // prende o foco no modal
        const f = $$("button, a[href], input, [tabindex]:not([tabindex='-1'])", box).filter((x) => !x.hidden && x.offsetParent);
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    });
    return api;
  })();

  /* ---------- pop-ups com frequência controlada (cap. 7) ---------- */
  const popups = (() => {
    const H = 3600e3;
    const since = (k) => Date.now() - (+store.get(k) || 0);
    const sessionUsed = () => sess.get("ro_popup_session") === "1";
    const markSession = () => sess.set("ro_popup_session", "1");
    let welcomeArmed = false, reminderArmed = false;

    function show(id, html) {
      if (sessionUsed() || modal.isOpen()) return false;
      if (!modal.open("popup:" + id, html)) return false;
      markSession();
      track("PopupView", { popup: id });
      return true;
    }
    const blossom = `<svg class="modal-blossom" aria-hidden="true"><use href="#blossom"/></svg>`;

    function welcome() {
      if (since("ro_pop_welcome") < 24 * H) return;
      if (show("welcome", `${blossom}
        <h3 id="modal-title">Oi! Aqui você encontra:</h3>
        <p>a conta por mês de cada kit, como funciona a entrega e o atendimento direto comigo. Quer ir direto ao que interessa?</p>
        <div class="modal-actions">
          <a class="modal-link" href="#kits" data-close>Ver custo mensal</a>
          <a class="modal-link" href="#entrega" data-close>Como funciona a entrega</a>
          <a class="btn-wa btn-wa--block" data-wa="welcome" href="#" target="_blank" rel="noopener"><svg><use href="#i-wa"/></svg><span>Falar no WhatsApp</span></a>
        </div>`)) store.set("ro_pop_welcome", String(Date.now()));
    }
    function exit() {
      if (since("ro_pop_exit") < 48 * H) return;
      if (show("exit", `${blossom}
        <h3 id="modal-title">Antes de ir…</h3>
        <p>Te mando a tabela completa de custo mensal e a foto do rótulo — sem compromisso?</p>
        <div class="modal-actions">
          <a class="btn-wa btn-wa--block btn-wa--lg" data-wa="exit" href="#" target="_blank" rel="noopener"><svg><use href="#i-wa"/></svg><span>Receber no WhatsApp</span></a>
          <button class="modal-dismiss" data-close type="button">Não, obrigada</button>
        </div>`)) store.set("ro_pop_exit", String(Date.now()));
    }
    function reminder() {
      if (show("lembrete", `${blossom}
        <h3 id="modal-title">Que bom te ver de novo</h3>
        <p>Fiquei com sua dúvida pela metade — se ainda fizer sentido, me chama e a gente conversa sem pressa.</p>
        <div class="modal-actions">
          <a class="btn-wa btn-wa--block" data-wa="lembrete" href="#" target="_blank" rel="noopener"><svg><use href="#i-wa"/></svg><span>Continuar a conversa</span></a>
          <button class="modal-dismiss" data-close type="button">Agora não</button>
        </div>`)) store.set("ro_pop_reminder", String(Date.now()));
    }

    // Lembrete: viu os kits numa visita anterior, não clicou, volta em outra sessão (1x/semana)
    const sawKitsBefore = !!store.get("ro_saw_kits");
    const wantsReminder = isNewSession && sawKitsBefore && !store.get("ro_wa_clicked") && since("ro_pop_reminder") > 7 * 24 * H;

    // Boas-vindas: 6-8 s OU 15% de scroll (desktop); mobile só após 35% de scroll
    if (isDesktop()) {
      setTimeout(() => { if (wantsReminder) reminder(); else welcome(); }, 7000);
      // Exit-intent só no desktop (mouse saindo pela barra de endereço), sem sequestrar o "voltar"
      document.addEventListener("mouseout", (e) => { if (!e.relatedTarget && e.clientY <= 0) exit(); });
    }

    return {
      onScroll(pct) {
        if (isDesktop()) { if (pct > 0.15 && !welcomeArmed) { welcomeArmed = true; wantsReminder ? reminder() : welcome(); } return; }
        if (pct > 0.35 && !reminderArmed) { reminderArmed = true; wantsReminder ? reminder() : welcome(); }
      },
    };
  })();

  /* ---------- quiz "Qual kit é pra você?" (cap. 8.1) ---------- */
  const QUIZ = [
    { q: "Hoje, sua rotina de pele é…", k: "rotina", o: [["simples", "Simples, de 1 ou 2 passos"], ["cheia", "Cheia de produtos"], ["nada", "Praticamente inexistente"]] },
    { q: "Você prefere…", k: "pratica", o: [["pratica", "Coisa prática, sem preparo"], ["po", "Não ligo de preparar pó"], ["naosei", "Ainda não sei"]] },
    { q: "Para investimento, faz mais sentido pensar…", k: "orcamento", o: [["mes", "Por mês"], ["completo", "No tratamento completo de uma vez"], ["pequeno", "Começar pequeno"]] },
  ];
  const KITS = {
    "3+1": { name: "Kit 3+1", sub: "4 frascos · 4 meses", month: "R$ 86,75 por mês", wa: "kit-3+1",
      why: "Você pensa por mês — e o 3+1 é a melhor história de valor nessa lógica: R$ 347 divididos em 4 meses, cobrindo o ciclo de 6-8 semanas informado pela marca." },
    "5+1": { name: "Kit 5+1", sub: "6 frascos · 6 meses", month: "R$ 74,50 por mês", wa: "kit-5+1",
      why: "Se faz sentido resolver de uma vez, o 5+1 tem o menor custo mensal entre os três (menos de R$ 2,50 por dia) — sem precisar ir para um kit de 12 meses na primeira compra." },
    "1": { name: "Kit 1 mês", sub: "1 frasco", month: "R$ 207 por mês", wa: "kit-1",
      why: "Começar pequeno é uma escolha válida. Só com transparência: é a pior conta por mês, e um frasco não cobre o ciclo de 6-8 semanas informado pela marca. Para comparar, o 3+1 sai R$ 86,75/mês." },
  };
  const ROT = {
    simples: "Como sua rotina já é enxuta, a cápsula encaixa sem acrescentar passos.",
    cheia: "Se sua prateleira já está cheia, a ideia aqui é simplificar — não somar mais um pote.",
    nada: "Se você está começando agora, 1 minuto por dia é um bom primeiro hábito.",
  };
  function openQuiz() {
    const ans = {};
    const render = (step) => {
      const body = $("#modal-body");
      const prog = `<div class="quiz-progress">${QUIZ.map((_, i) => `<span class="${i <= step ? "is-on" : ""}"></span>`).join("")}</div>`;
      if (step < QUIZ.length) {
        const Q = QUIZ[step];
        body.innerHTML = `${prog}<div class="quiz-step">
          <p class="quiz-q">Pergunta ${step + 1} de ${QUIZ.length}</p>
          <h3 id="modal-title">${Q.q}</h3>
          <div class="quiz-opts">${Q.o.map(([v, t]) => `<button class="quiz-opt" type="button" data-v="${v}">${t}</button>`).join("")}</div>
        </div>`;
        $$(".quiz-opt", body).forEach((b) => b.addEventListener("click", () => {
          b.classList.add("is-picked"); ans[Q.k] = b.dataset.v;
          setTimeout(() => render(step + 1), 280);
        }));
        $(".quiz-opt", body).focus();
        return;
      }
      const key = ans.orcamento === "completo" ? "5+1" : ans.orcamento === "pequeno" ? "1" : "3+1";
      const K = KITS[key];
      const poNote = ans.pratica === "po" ? `<p><b>Sendo honesto:</b> se preparar pó não te incomoda, vale comparar com os pós de farmácia (R$ 79 a R$ 235/mês). Sem vencedor pronto — eu te mando a tabela lado a lado.</p>` : "";
      body.innerHTML = `<div class="confetti" id="confetti"></div><div class="quiz-result">
        <p class="quiz-q">Minha sugestão honesta</p>
        <span class="quiz-kit" id="modal-title">${K.name}</span>
        <p class="kit-sub">${K.sub}</p>
        <p class="quiz-month">${K.month}</p>
        <div class="quiz-why"><p>${ROT[ans.rotina] || ""} ${K.why}</p>${poNote}</div>
        <p class="quiz-qual">Resultados variam de pessoa para pessoa. Suplemento não substitui alimentação equilibrada nem acompanhamento profissional.</p>
        <p style="margin:16px 0 10px"><b>Quer conversar sobre esse kit?</b></p>
        <a class="btn-wa btn-wa--block btn-wa--lg" data-wa="${K.wa}" href="#" target="_blank" rel="noopener"><svg><use href="#i-wa"/></svg><span>Conversar no WhatsApp</span></a>
        <button class="quiz-redo" type="button" id="quiz-redo">Refazer o quiz</button>
      </div>`;
      bindWa(body);
      $("#quiz-redo").onclick = () => render(0);
      track("QuizComplete", { kit: key, ...ans });
      if (!reduced) {
        const cf = $("#confetti");
        for (let i = 0; i < 22; i++) {
          const p = document.createElement("i");
          p.style.left = Math.random() * 100 + "%";
          p.style.setProperty("--dx", (Math.random() * 120 - 60) + "px");
          p.style.animationDelay = Math.random() * 0.6 + "s";
          p.innerHTML = `<svg style="fill:${["#F3BFC8", "#D97A8C", "#C9A05C", "#F9DBDE"][i % 4]}"><use href="#blossom"/></svg>`;
          cf.appendChild(p);
        }
      }
    };
    if (modal.open("quiz", "")) { track("PopupView", { popup: "quiz" }); render(0); }
  }
  $$("[data-open-quiz]").forEach((b) => b.addEventListener("click", openQuiz));

  /* ---------- UPSELL: oferta do kit seguinte, sem pressão e com a conta completa ----------
     Valores: tabela de kits do Dossiê (13/11/2026). Regra do Guia respeitada: do 5+1 não se
     oferece kit de 12+ meses (primeira compra); kits grandes só aparecem a partir do 9 meses. */
  const KIT_INFO = {
    "kit-1":   { name: "Kit 1 mês",           frascos: 1,  price: 207,  month: 207,   img: "assets/img/kit-1.webp" },
    "kit-3+1": { name: "Kit 3+1",             frascos: 4,  price: 347,  month: 86.75, img: null },
    "kit-5+1": { name: "Kit 5+1",             frascos: 6,  price: 447,  month: 74.5,  img: "assets/img/kit-6.webp" },
    "kit-9":   { name: "Kit 9 meses",         frascos: 9,  price: 697,  month: 77.44, img: "assets/img/kit-9.webp" },
    "kit-12":  { name: "Kit 12 meses + brinde", frascos: 12, price: 897, month: 74.75, img: "assets/img/kit-12.webp", gift: true },
    "kit-16":  { name: "Kit 16 meses + brinde", frascos: 16, price: 1097, month: 68.56, img: null, gift: true },
  };
  const UPSELL = {
    "kit-1":   { to: "kit-3+1", why: "Um frasco dura 1 mês, e a marca informa o ciclo de 6-8 semanas. Com o 3+1 você cobre o ciclo inteiro e o custo por mês cai mais da metade." },
    "kit-3+1": { to: "kit-5+1", why: "Com mais 2 frascos você chega a 6 meses de rotina e o 5+1 passa a ter o menor custo por mês entre os kits de entrada." },
    "kit-9":   { to: "kit-12",  why: "Com mais 3 frascos você fecha 1 ano de rotina e ainda escolhe um brinde no checkout: creme ou massageador." },
    "kit-12":  { to: "kit-16",  why: "Com mais 4 frascos o custo por mês chega ao menor valor de todos os kits — R$ 68,56." },
  };
  function kitVisual(k) {
    const K = KIT_INFO[k];
    if (K.img) return `<img src="${K.img}" alt="${K.name}" loading="lazy">`;
    const n = Math.min(K.frascos, 6);
    let b = "";
    for (let i = 0; i < n; i++) b += `<img class="up-mini" src="assets/img/frasco-sm.webp" alt="">`;
    return `<div class="up-stack">${b}${K.frascos > 6 ? `<span>${K.frascos}</span>` : ""}</div>`;
  }
  /* ---------- galeria de fotos reais: foto ampliada com navegação ---------- */
  (function gallery() {
    const seen = new Set();
    const photos = $$(".gal-item[data-full]").filter((el) => !seen.has(el.dataset.full) && seen.add(el.dataset.full))
      .map((el) => ({ src: el.dataset.full, alt: $("img", el).alt }));
    if (!photos.length) return;
    let cur = 0;
    function show(i) {
      const n = photos.length;
      cur = ((i % n) + n) % n;
      const p = photos[cur];
      const html = `<div class="lb"><h3 id="modal-title" class="sr">Foto ${cur + 1} de ${n}</h3>
        <img src="${p.src}" alt="${p.alt}">
        <div class="lb-bar"><button class="lb-nav" type="button" data-lb="-1" aria-label="Foto anterior">←</button>
        <span>${cur + 1} / ${n}</span>
        <button class="lb-nav" type="button" data-lb="1" aria-label="Próxima foto">→</button></div></div>`;
      if (modal.current === "galeria") $("#modal-body").innerHTML = html;
      else if (!modal.open("galeria", html, true)) return;
      $$("[data-lb]", $("#modal-body")).forEach((b) => (b.onclick = () => show(cur + Number(b.dataset.lb))));
    }
    document.addEventListener("click", (e) => {
      const it = e.target.closest(".gal-item");
      if (!it) return;
      const idx = photos.findIndex((p) => p.src === it.dataset.full);
      show(idx);
      track("GalleryOpen", { photo: idx + 1 });
    });
    addEventListener("keydown", (e) => {
      if (modal.current !== "galeria") return;
      if (e.key === "ArrowRight") show(cur + 1);
      if (e.key === "ArrowLeft") show(cur - 1);
    });
  })();

  function openUpsell(from) {
    const U = UPSELL[from], A = KIT_INFO[from], B = KIT_INFO[U.to];
    const diff = B.price - A.price, extra = B.frascos - A.frascos;
    const perExtra = diff / extra;
    const html = `
      <div class="upm">
        <p class="quiz-q">Antes de fechar o ${A.name}</p>
        <h3 id="modal-title">Quer ver uma conta melhor?</h3>
        <div class="upm-cols">
          <div class="upm-col">
            <div class="upm-img">${kitVisual(from)}</div>
            <b>${A.name}</b>
            <span class="upm-month">${brl(A.month)}<small>/mês</small></span>
            <span class="upm-total">${brl(A.price)} · ${A.frascos} ${A.frascos > 1 ? "frascos" : "frasco"}</span>
          </div>
          <div class="upm-arrow" aria-hidden="true">→</div>
          <div class="upm-col upm-col--up">
            <span class="upm-tag">Upgrade</span>
            <div class="upm-img">${kitVisual(U.to)}</div>
            <b>${B.name}</b>
            <span class="upm-month">${brl(B.month)}<small>/mês</small></span>
            <span class="upm-total">${brl(B.price)} · ${B.frascos} frascos${B.gift ? " + brinde" : ""}</span>
          </div>
        </div>
        <p class="upm-math">São <b>+${brl(diff)}</b> por <b>${extra} ${extra > 1 ? "frascos a mais" : "frasco a mais"}</b>${B.gift && !A.gift ? " e o brinde" : ""} — ${brl(Math.round(perExtra * 100) / 100)} por frasco extra.</p>
        <p class="upm-why">${U.why}</p>
        <div class="modal-actions">
          <a class="btn-wa btn-wa--block btn-wa--lg" data-wa="${U.to}" data-upsell="accept" href="#" target="_blank" rel="noopener"><svg><use href="#i-wa"/></svg><span>Quero o ${B.name}</span></a>
          <a class="modal-link" data-wa="${from}" data-upsell="keep" href="#" target="_blank" rel="noopener">Continuar com o ${A.name}</a>
        </div>
        <p class="quiz-qual">Condição vigente conforme o checkout oficial. Resultados variam de pessoa para pessoa.</p>
      </div>`;
    if (!modal.open("upsell:" + from, html)) return;
    sess.set("ro_up_" + from, "1");
    track("UpsellView", { from, to: U.to });
    $$("[data-upsell]", $("#modal-body")).forEach((el) => el.addEventListener("click", () => {
      track(el.dataset.upsell === "accept" ? "UpsellAccept" : "UpsellKeep", { from, to: U.to });
      setTimeout(() => modal.close(), 150);
    }));
  }

  /* ---------- leituras (cap. 8.3) ---------- */
  const ARTICLES = {
    "capsula-po": `<article class="article"><span class="read-tag">Comparativo</span>
      <h3 id="modal-title">Colágeno em cápsula ou em pó: o que comparar antes de pagar</h3>
      <p>Cápsula e pó não são rivais — são formas diferentes de encaixar o mesmo hábito na rotina. Em vez de perguntar “qual é melhor?”, compare três coisas:</p>
      <h4>1. Dose publicada</h4>
      <p>Os pós costumam publicar a dose na própria página — 2,5 g por porção é o padrão observado na categoria. No Rosa Oriental, a tabela nutricional completa está no rótulo do frasco. Ponto para o pó em transparência de página; por isso eu envio a foto do rótulo antes de qualquer compra.</p>
      <h4>2. Rotina</h4>
      <p>Pó pede medir, misturar e beber todos os dias. Cápsula é uma por dia, sem preparo e sem gosto. A pergunta certa é: qual dos dois você vai conseguir manter por 2 meses seguidos?</p>
      <h4>3. Custo por mês</h4>
      <p>Compare sempre o custo mensal, não o preço da embalagem. Os pós observados em 13/11/2026 ficam entre R$ 79 e R$ 235 por mês; os kits de 4 a 6 frascos do Rosa Oriental saem entre R$ 74,50 e R$ 86,75 por mês.</p>
      <h4>Antes de pagar, em qualquer marca</h4>
      <ul><li>Consigo ver a composição e a dose (na página ou no rótulo)?</li><li>Quem vende tem CNPJ visível?</li><li>A garantia está escrita no checkout?</li><li>Existe rastreio com prazo informado?</li></ul>
      <p class="quiz-qual">Resultados variam de pessoa para pessoa. Suplemento não substitui alimentação equilibrada nem acompanhamento profissional.</p>
      <a class="btn-wa btn-wa--block" data-wa="tabela" href="#" target="_blank" rel="noopener"><svg><use href="#i-wa"/></svg><span>Receber a tabela completa</span></a></article>`,
    conta: `<article class="article"><span class="read-tag">A conta</span>
      <h3 id="modal-title">Fiz a conta: quanto custa 1 mês de cada opção de colágeno</h3>
      <p>Preço de kit engana. O número que importa é quanto sai <b>por mês</b> — e quanto você paga a mais se parcelar.</p>
      <table><thead><tr><th>Opção</th><th>Preço</th><th>Por mês</th></tr></thead><tbody>
        <tr><td>Rosa Oriental 5+1 (6 frascos)</td><td>R$ 447</td><td>R$ 74,50</td></tr>
        <tr><td>Rosa Oriental 3+1 (4 frascos)</td><td>R$ 347</td><td>R$ 86,75</td></tr>
        <tr><td>Rosa Oriental 3 meses</td><td>R$ 347</td><td>R$ 115,67</td></tr>
        <tr><td>Rosa Oriental 1 frasco</td><td>R$ 207</td><td>R$ 207,00</td></tr>
        <tr><td>Pós de farmácia (3 marcas)</td><td>—</td><td>R$ 79 a R$ 235</td></tr>
      </tbody></table>
      <p class="micro">Pós: preços observados em 13/11/2026. Kits: condição vigente conforme o checkout oficial.</p>
      <h4>E o parcelamento?</h4>
      <p>No 3+1, 12 × R$ 36,74 = R$ 440,88 — cerca de 27% acima dos R$ 347 à vista. No 5+1, 12 × R$ 47,33 = R$ 567,96, contra R$ 447 à vista. Parcelar pode fazer sentido; só vale saber o total antes.</p>
      <h4>O kit grande sempre compensa?</h4>
      <p>Não na primeira compra. Eu não recomendo kit de 12+ meses de cara: comece com o ciclo completo e decida depois, com a sua experiência.</p>
      <button class="quiz-card" type="button" data-open-quiz-inner><span class="quiz-card-ico">?</span><span><b>Qual kit é pra você?</b><small>3 perguntas · resposta honesta</small></span><svg><use href="#i-arrow"/></svg></button></article>`,
    japones: `<article class="article"><span class="read-tag">Sem mito</span>
      <h3 id="modal-title">Colágeno “japonês”: estética ou tecnologia?</h3>
      <p>O Rosa Oriental tem uma identidade visual japonesa — sakura, pagode, a grafia オリエンタルローズ no frasco. É bonito, e é parte da marca.</p>
      <h4>O que é discurso e o que é verificável</h4>
      <p>A marca descreve o colágeno como “de origem japonesa”. Isso é como a marca apresenta o produto — e eu repito com essa ressalva. O que dá para verificar de fato está no <b>rótulo</b>: composição, fabricante e número de autorização.</p>
      <h4>Então como escolher?</h4>
      <p>Não compre nenhum suplemento pela palavra “japonês”, “importado” ou “premium”. Compre pelo que dá para conferir: rótulo, CNPJ, rastreio e garantia escrita no checkout. Estética é um bônus; conferência é o que protege seu dinheiro.</p>
      <a class="btn-wa btn-wa--block" data-wa="rotulo" href="#" target="_blank" rel="noopener"><svg><use href="#i-wa"/></svg><span>Pedir a foto do rótulo</span></a></article>`,
    estudos: `<article class="article"><span class="read-tag">Em preparação</span>
      <h3 id="modal-title">O que os estudos sobre colágeno oral realmente mostram</h3>
      <p>Este texto está sendo escrito com as fontes na mão — porque um assunto desses não merece resumo apressado nem promessa.</p>
      <p>Enquanto isso, a regra continua a mesma: resultados variam de pessoa para pessoa, e quem garante resultado não está sendo honesto com você.</p>
      <a class="btn-wa btn-wa--block" data-wa="default" href="#" target="_blank" rel="noopener"><svg><use href="#i-wa"/></svg><span>Me avise quando sair</span></a></article>`,
  };
  $$("[data-article]").forEach((b) => b.addEventListener("click", () => {
    const id = b.dataset.article;
    if (modal.open("artigo:" + id, ARTICLES[id], true)) {
      track("ArticleOpen", { article: id });
      const inner = $("[data-open-quiz-inner]");
      if (inner) inner.onclick = () => { modal.close(); setTimeout(openQuiz, 80); };
    }
  }));

  /* ---------- nav ativa ---------- */
  const navLinks = $$(".nav a");
  const navOb = new IntersectionObserver((ens) => ens.forEach((en) => {
    if (en.isIntersecting) navLinks.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === "#" + en.target.id));
  }), { rootMargin: "-45% 0px -50% 0px" });
  navLinks.forEach((a) => { const s = $(a.getAttribute("href")); if (s) navOb.observe(s); });

  /* ---------- pétalas de sakura (canvas leve) ---------- */
  (function petals() {
    const cv = $("#petals");
    if (!cv || reduced) return;
    const ctx = cv.getContext("2d");
    let W, H, dpr, list = [], run = true;
    const colors = ["243,191,200", "217,122,140", "249,219,222", "201,160,92"];
    function size() {
      dpr = Math.min(devicePixelRatio || 1, 2);
      W = cv.width = innerWidth * dpr; H = cv.height = innerHeight * dpr;
      const n = innerWidth < 760 ? 9 : 20;
      while (list.length < n) list.push(make(true));
      list.length = n;
    }
    function make(initial) {
      return { x: Math.random() * W, y: initial ? Math.random() * H : -20 * dpr, s: (6 + Math.random() * 8) * dpr,
        vy: (0.35 + Math.random() * 0.6) * dpr, vx: (0.15 + Math.random() * 0.45) * dpr, r: Math.random() * 6.28,
        vr: (Math.random() - 0.5) * 0.03, sw: Math.random() * 6.28, c: colors[Math.random() < 0.08 ? 3 : Math.floor(Math.random() * 3)],
        a: 0.35 + Math.random() * 0.45, ox: 0, oy: 0, depth: 0.08 + Math.random() * 0.35 };
    }
    // mouse empurra as pétalas; o scroll cria profundidade e "vento"
    let mx = -9999, my = -9999, lastS = scrollY;
    addEventListener("pointermove", (e) => { if (e.pointerType === "mouse") { mx = e.clientX * dpr; my = e.clientY * dpr; } }, { passive: true });
    document.documentElement.addEventListener("mouseleave", () => { mx = my = -9999; });
    function draw(p) {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.scale(1, Math.abs(Math.cos(p.sw)) * 0.6 + 0.4);
      ctx.fillStyle = `rgba(${p.c},${p.a})`;
      ctx.beginPath(); ctx.moveTo(0, -p.s);
      ctx.bezierCurveTo(p.s * 0.9, -p.s * 0.6, p.s * 0.7, p.s * 0.6, 0, p.s);
      ctx.bezierCurveTo(-p.s * 0.7, p.s * 0.6, -p.s * 0.9, -p.s * 0.6, -p.s * 0.15, -p.s * 0.8);
      ctx.lineTo(0, -p.s * 0.55); ctx.closePath(); ctx.fill(); ctx.restore();
    }
    function frame() {
      if (!run) return;
      ctx.clearRect(0, 0, W, H);
      const sd = Math.max(-80, Math.min(80, scrollY - lastS)); lastS = scrollY;
      const R = 130 * dpr;
      for (const p of list) {
        const dx = p.x - mx, dy = p.y - my, d = Math.hypot(dx, dy);
        if (d < R && d > 0.1) { const f = (1 - d / R) * 2.2 * dpr; p.ox += (dx / d) * f; p.oy += (dy / d) * f; p.vr += (Math.random() - 0.5) * 0.02; }
        p.ox *= 0.93; p.oy *= 0.93; p.vr *= 0.995;
        p.sw += 0.02 + Math.abs(sd) * 0.002;
        p.y += p.vy + p.oy - sd * dpr * p.depth;
        p.x += p.vx + p.ox + Math.sin(p.sw) * 0.4 * dpr + Math.abs(sd) * 0.03 * dpr;
        p.r += p.vr;
        if (p.y < -40 * dpr) { p.y = H + 10 * dpr; }
        if (p.y > H + 20 * dpr || p.x > W + 20 * dpr) Object.assign(p, make(false), { x: Math.random() * W * 0.9 - W * 0.1 });
        draw(p);
      }
      requestAnimationFrame(frame);
    }
    size(); addEventListener("resize", size);
    document.addEventListener("visibilitychange", () => { run = !document.hidden; if (run) requestAnimationFrame(frame); });
    requestAnimationFrame(frame);
  })();

  /* ---------- consentimento + Meta Pixel (LGPD) ---------- */
  (function pixel() {
    if (!C.pixelId) return;
    const load = () => {
      /* eslint-disable */
      !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
      /* eslint-enable */
      window.fbq("init", C.pixelId); track("PageView");
    };
    const c = store.get("ro_consent");
    if (c === "yes") return load();
    if (c === "no") return;
    const box = $("#consent"); box.hidden = false;
    $("#consent-yes").onclick = () => { store.set("ro_consent", "yes"); box.hidden = true; load(); };
    $("#consent-no").onclick = () => { store.set("ro_consent", "no"); box.hidden = true; };
  })();
  if (!C.pixelId) track("PageView", { utm_campaign: sess.get("utm_campaign") || "" });

  onScroll();
})();
