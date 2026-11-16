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
  testimonials: []
};
