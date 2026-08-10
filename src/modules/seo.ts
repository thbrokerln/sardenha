import { CONFIG } from "../config";
import { CRONOGRAMA, TIPOLOGIAS } from "../precos.ts";

/* ===========================================================================
   Dados estruturados (JSON-LD).

   Serve a dois publicos ao mesmo tempo:
   - Google: habilita resultado rico (FAQ, preco, localizacao)
   - Sistemas de IA: e daqui que eles extraem fato, nao do texto corrido.
     Por isso os numeros vem de `precos.ts`, a mesma fonte da pagina — se o
     INCC reajustar, o dado estruturado acompanha sozinho.

   O script e injetado no <head> em tempo de execucao. Rastreador do Google
   executa JS; para os que nao executam, o conteudo textual da pagina ja esta
   inteiro no HTML.
   =========================================================================== */

const ENDERECO = {
  "@type": "PostalAddress",
  streetAddress: "Rua Antônio de Lucca — Garden Mar",
  addressLocality: "Caraguatatuba",
  addressRegion: "SP",
  postalCode: "11667-000",
  addressCountry: "BR",
} as const;

const INCORPORADORA = {
  "@type": "Organization",
  name: "Lollo Ganassali Construtora e Incorporadora",
} as const;

/** Perguntas do FAQ, na ordem em que aparecem na pagina. */
function coletarFaq(): unknown[] {
  return [...document.querySelectorAll(".faq__item")].flatMap((item) => {
    const p = item.querySelector("summary span")?.textContent?.trim();
    const r = item.querySelector(".faq__a p")?.textContent?.trim();
    return p && r
      ? [{ "@type": "Question", name: p, acceptedAnswer: { "@type": "Answer", text: r } }]
      : [];
  });
}

function ofertas() {
  return Object.values(TIPOLOGIAS).map((t) => ({
    "@type": "Offer",
    name: `${t.rotulo} — ${t.descricao}`,
    price: t.total,
    priceCurrency: "BRL",
    availability: "https://schema.org/PreOrder",
    priceValidUntil: `${CRONOGRAMA.entrega}-01`,
    seller: INCORPORADORA,
    description:
      `Entrada diluída em ${CRONOGRAMA.parcelasEntrada}x, ` +
      `${CRONOGRAMA.totalMensais} parcelas mensais de obra e ` +
      `${CRONOGRAMA.anosAnuais.length} anuais. Sem financiamento bancário: ` +
      `as parcelas quitam 100% do imóvel.`,
  }));
}

export function initDadosEstruturados(): void {
  const url = CONFIG.siteUrl;

  const grafo: unknown[] = [
    {
      "@type": "ApartmentComplex",
      "@id": `${url}/#empreendimento`,
      name: "Residencial Sardenha",
      description:
        "Condomínio de uso misto a 250 metros da Praia do Massaguaçu, em Caraguatatuba. " +
        "Quatro torres de nove pavimentos, com studios de 43,87m² e apartamentos de 61,42m², " +
        "todos com varanda gourmet, vaga de garagem e hobby box. Obra a preço de custo, " +
        "negociada direto com a incorporadora.",
      url,
      address: ENDERECO,
      geo: { "@type": "GeoCoordinates", latitude: -23.6155, longitude: -45.3672 },
      numberOfAccommodationUnits: 216,
      numberOfAvailableAccommodationUnits: 102,
      petsAllowed: true,
      amenityFeature: [
        "Piscina", "Cinema", "Academia", "Coworking", "Ofurô e sauna",
        "Salão de festas", "Beauty care", "Brinquedoteca", "Salão de jogos",
        "Lounge", "Sala de reuniões", "Lavanderia", "Oficina",
        "Pista de caminhada", "Mercado no térreo", "Hobby box",
      ].map((n) => ({ "@type": "LocationFeatureSpecification", name: n, value: true })),
      containsPlace: Object.values(TIPOLOGIAS).map((t) => ({
        "@type": "Apartment",
        name: t.rotulo,
        floorSize: { "@type": "QuantitativeValue", value: t.area, unitCode: "MTK" },
        numberOfRooms: t.id === "studio" ? 1 : 2,
        numberOfBathroomsTotal: t.id === "studio" ? 1 : 3,
        amenityFeature: [
          { "@type": "LocationFeatureSpecification", name: "Varanda gourmet com churrasqueira a carvão", value: true },
          { "@type": "LocationFeatureSpecification", name: "Vaga de garagem", value: true },
          { "@type": "LocationFeatureSpecification", name: "Hobby box", value: true },
        ],
      })),
      makesOffer: ofertas(),
    },
    {
      "@type": "WebSite",
      "@id": `${url}/#site`,
      url,
      name: "Residencial Sardenha",
      inLanguage: "pt-BR",
      publisher: INCORPORADORA,
    },
  ];

  const faq = coletarFaq();
  if (faq.length) {
    grafo.push({ "@type": "FAQPage", "@id": `${url}/#faq`, mainEntity: faq });
  }

  const el = document.createElement("script");
  el.type = "application/ld+json";
  el.textContent = JSON.stringify({ "@context": "https://schema.org", "@graph": grafo });
  document.head.appendChild(el);
}
