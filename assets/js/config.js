/* =====================================================================
   CONFIGURAÇÃO DO SITE — edite SÓ este arquivo para dados da operação.
   Regra do Guia (princípio 6): nada do que a página mostra pode ser
   falso. Só preencha o que a operação cumpre de verdade.
   ===================================================================== */
window.SITE_CONFIG = {
  // Número do WhatsApp com DDI + DDD, só dígitos. Ex.: "5531999998888"
  // >>> PENDENTE: troque pelo número real antes de publicar <<<
  whatsapp: "5500000000000",

  // Nome da marca de revenda. Pendência do Dossiê 8.3: se não houver
  // registro profissional que sustente o "Dr.", troque para
  // "Riccardo Nikkei" — o site inteiro acompanha.
  brandName: "Dr. Riccardo Nikkei",
  firstName: "Riccardo",

  // Foto real do atendente (WebP, quadrada). Vazio = monograma.
  photo: "",

  // Horário real de atendimento (fuso de São Paulo)
  hours: { open: 9, close: 18, days: [1, 2, 3, 4, 5] }, // 1 = segunda

  // Barra de promoção (seção 0). Só ative com data final VERDADEIRA.
  // Formato "AAAA-MM-DD". A barra some sozinha depois dessa data.
  promo: {
    enabled: false,
    endDate: "",
    text: "Frete grátis nos kits — condição vigente no checkout"
  },

  // Meta Pixel (opcional). Vazio = não carrega. Com ID, a página pede
  // consentimento (LGPD) antes de carregar.
  pixelId: "",

  // Depoimentos: SÓ com autorização por escrito (P8), do jeito que a
  // cliente escreveu, primeiro nome + inicial. Vazio = seção oculta.
  // Ex.: { name: "Ana P.", city: "Belo Horizonte/MG", text: "..." }
  testimonials: [],

  // Links de compra de cada kit. "provider" escolhe qual lista os botões
  // usam: "braip" (links de afiliado, doc "LINKS DE AFILIADO") ou "payt"
  // (checkouts com pixel, doc "CHECKOUTS - ROSA ORIENTAL (COM PIXEL)").
  // Kit sem link no provider escolhido usa o link da outra lista.
  checkout: {
    provider: "payt",
    braip: {
      m1:   "https://ev.braip.com/ref?pl=plawe080&ck=cheze5we&af=afi659z0j3", // 1 mês
      m2:   "https://ev.braip.com/ref?pl=pla1l198&ck=cheze5we&af=afi659z0j3", // 2 meses
      m3:   "https://ev.braip.com/ref?pl=pla6kpko&ck=cheze5we&af=afi659z0j3", // 3 meses
      m5:   "https://ev.braip.com/ref?pl=plal2n1k&ck=cheze5we&af=afi659z0j3", // 5 meses
      m7:   "https://ev.braip.com/ref?pl=pla9d4n6&ck=cheze5we&af=afi659z0j3", // 7 meses
      m9:   "https://ev.braip.com/ref?pl=plamxnxy&ck=cheze5we&af=afi659z0j3", // 9 meses
      k4:   "https://ev.braip.com/ref?pl=plalegjy&ck=cheze5we&af=afi659z0j3", // Compre 3 leve 4
      k6:   "https://ev.braip.com/ref?pl=plap1z1m&ck=cheze5we&af=afi659z0j3", // Compre 5 leve 6
      c12:  "https://ev.braip.com/ref?pl=pla8n9nr&ck=cheze5we&af=afi659z0j3", // 12 meses + Creme
      c16:  "https://ev.braip.com/ref?pl=plae12yx&ck=cheze5we&af=afi659z0j3", // 16 meses + Creme
      ms12: "https://ev.braip.com/ref?pl=plalj4lv&ck=cheze5we&af=afi659z0j3", // 12 meses + Massageador
      ms16: "https://ev.braip.com/ref?pl=plav4mq0&ck=cheze5we&af=afi659z0j3", // 16 meses + Massageador
      t12:  "https://ev.braip.com/ref?pl=play4jej&ck=cheze5we&af=afi659z0j3", // Turbo 12 meses
      t16:  "https://ev.braip.com/ref?pl=plaw0vp1&ck=cheze5we&af=afi659z0j3", // Turbo 16 meses
      t20:  "https://ev.braip.com/ref?pl=plav4v6r&ck=cheze5we&af=afi659z0j3"  // Turbo 20 meses
    },
    payt: {
      m1:   "https://seguro.payt.com.br/a/g0ey0pPXIP3YMoYn",
      m2:   "https://seguro.payt.com.br/a/PJe810PqcGXzrW7X",
      m3:   "https://seguro.payt.com.br/a/qGW918mXcpMEkWRk",
      m5:   "https://seguro.payt.com.br/a/Pko6pXzpsn7A3Wn0",
      m7:   "https://seguro.payt.com.br/a/8zo0pLjqI1XJqoyV",
      m9:   "https://seguro.payt.com.br/a/nVoQbDk4FZkLMebq",
      c12:  "https://seguro.payt.com.br/a/zVWRZKAaimGPXWxR",
      c16:  "https://seguro.payt.com.br/a/r0oZYdqYHbqdBv6P",
      ms12: "https://seguro.payt.com.br/a/bVozr0Vau0mQaoPy",
      ms16: "https://seguro.payt.com.br/a/M2o5M71VH8Ddao4G",
      t12:  "https://seguro.payt.com.br/a/5qoOV5rzFamAEvGz",
      t16:  "https://seguro.payt.com.br/a/R8emDb6LHd0XYo7X",
      t20:  "https://seguro.payt.com.br/a/0pvpRK67fX4R1e5k"
    }
  }
};
