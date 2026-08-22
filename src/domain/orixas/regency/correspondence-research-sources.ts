import { z } from "zod";

export const correspondenceResearchSourceSchema = z
  .object({
    id: z.string().regex(/^source:[a-z0-9-:]+$/),
    title: z.string().trim().min(1).max(300),
    url: z.url(),
    publisherType: z.enum([
      "practitioner_or_community",
      "museum_or_cultural_institute",
      "scholarly_publication",
      "reference_discovery",
    ]),
    evidenceUse: z.enum(["attribute_evidence", "discovery_only"]),
    traditionIds: z.array(z.string().min(1).max(120)).min(1).max(12),
  })
  .strict();

export const correspondenceResearchSources = [
  source(
    "source:scielo:geodiversity",
    "Simbolismo da geodiversidade nas religiões afro-brasileiras",
    "https://www.scielo.br/j/mercator/a/R5CsWttHSF35qGfkCjyKYqk/?lang=pt",
    "scholarly_publication",
    ["afro-brazilian-comparative"],
  ),
  source(
    "source:scielo:contemporary-orixas",
    "Deuses africanos no Brasil contemporâneo",
    "https://www.scielo.br/j/ha/a/m3M9vpDWHDNvZzSsyMnWWNK/?lang=pt",
    "scholarly_publication",
    ["candomble-brazil"],
  ),
  source(
    "source:puc-campinas:cantigas-ketu",
    "As representações sociais dos orixás para a comunidade do Candomblé Ketu",
    "https://periodicos.puc-campinas.edu.br/reflexao/article/view/8580",
    "scholarly_publication",
    ["candomble-ketu"],
  ),
  source(
    "source:nico:aje-wealth",
    "Understanding Wealth Creation (Aje) Through the Concept of Yoruba Traditional Religion",
    "https://nico.gov.ng/understanding-wealth-creation-aje-through-the-concept-of-yoruba-traditional-religion/",
    "museum_or_cultural_institute",
    ["yoruba-nigeria"],
  ),
  source(
    "source:ijssass:orisa-oko",
    "Òrìṣà-Oko: The Spiritual Ointment for Farmer’s Breakthrough in Igbeti",
    "https://ijssass.com/journal/orisa-oko-the-spiritual-ointment-for-farmers-breakthrough-in-igbeti-oyo-nigeria/",
    "scholarly_publication",
    ["yoruba-igbeti"],
  ),
  source(
    "source:scielo:orunmila-divination",
    "Tocar é Saber: ancestralização e a sabedoria dos tambores no candomblé",
    "https://www.scielo.br/j/opus/a/Kqdt9ch8LGnYwSgnYBBTHmN/",
    "scholarly_publication",
    ["candomble-brazil", "ifa"],
  ),
  source(
    "source:scielo:oduduwa-creation",
    "Mujeres y artes: fuerza espiritual y sabiduría ancestral africana",
    "https://www.scielo.br/j/bgoeldi/a/qqJDnSRGWGCNHy6NZTPQKCy/?format=html",
    "scholarly_publication",
    ["yoruba-comparative"],
  ),
  source(
    "source:worldhistory:orisha",
    "Orisha",
    "https://www.worldhistory.org/Orisha/",
    "reference_discovery",
    ["yoruba-comparative"],
    "discovery_only",
  ),
  source(
    "source:yoruba-library:aje",
    "Orisha Ajé",
    "https://www.yorubalibrary.com/culture/oriki_yoruba/oriki_for_orisha/orisha_aje.html",
    "practitioner_or_community",
    ["yoruba-nigeria"],
  ),
  source(
    "source:sacred-texts:orisa-oko",
    "The Yoruba-Speaking Peoples of the Slave Coast — Minor Gods",
    "https://sacred-texts.com/afr/yor/yor04.htm",
    "reference_discovery",
    ["yoruba-historical-record"],
    "discovery_only",
  ),
].map((item) => correspondenceResearchSourceSchema.parse(item));

export const correspondenceResearchSourceIds = new Set(
  correspondenceResearchSources.map(({ id }) => id),
);

function source(
  id: string,
  title: string,
  url: string,
  publisherType: z.infer<typeof correspondenceResearchSourceSchema>["publisherType"],
  traditionIds: string[],
  evidenceUse: z.infer<
    typeof correspondenceResearchSourceSchema
  >["evidenceUse"] = "attribute_evidence",
) {
  return { id, title, url, publisherType, evidenceUse, traditionIds };
}
