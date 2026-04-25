import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, Download, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import heroOcean from "@/assets/pictureocean.jpg";
import cars from "@/assets/picturecars.jpg";
import carAutumn from "@/assets/picture4.jpg";
import EditableText from "@/components/EditableText";

import carRoad from "@/assets/picutrecars.jpg";

interface Product {
  id: string;
  name: string;
  durationMonths: number;
  premium: number;
  vehicleType: string;
  maxAge: number;
  maxKm: number;
  maxHk: number;
  pdfUrl: string;
  description?: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  count: number;
  products: Product[];
}

const defaultFaqItems = [
  {
    number: 1,
    titleKey: 'page.faq.1.question',
    descKey: 'page.faq.1.answer',
    defaultTitle: 'Vilka är Mobilitypartner och vad erbjuder ni?',
    defaultDesc: 'Mobilitypartner är experter på bilgarantier och skadehantering, med fokus på snabb, personlig service där kunden alltid står i centrum. Vi gör bilägandet tryggt genom att hantera skador smidigt och effektivt, från anmälan till färdig reparation. Vårt mål är att du som kund ska känna dig säker och omhändertagen i varje steg av processen.',
  },
  {
    number: 2,
    titleKey: 'page.faq.2.question',
    descKey: 'page.faq.2.answer',
    defaultTitle: 'Vilka typer av fordon omfattas av era tjänster?',
    defaultDesc: 'Våra garantier täcker både nya och begagnade personbilar oavsett märke eller modell.Vi erbjuder flexibla lösningar som passar både privatkunder och bilhandlare, alltid med samma höga krav på kvalitet och trygghet.',
  },
  {
    number: 3,
    titleKey: 'page.faq.3.question',
    descKey: 'page.faq.3.answer',
    defaultTitle: 'Hur fungerar skadeanmälan och reparation?',
    defaultDesc: 'När en skada uppstår fyller verkstaden i vårt skadeformulär, där ansvarig handläggare anges. Verkstaden genomför sedan en diagnos och uppskattar skadans omfattning. Vi granskar informationen och meddelar om vi godkänner reparationen. Därefter kan verkstaden påbörja arbetet, och vi följer upp tills ärendet är avslutat.',
  },
  {
    number: 4,
    titleKey: 'page.faq.4.question',
    descKey: 'page.faq.4.answer',
    defaultTitle: 'Vilka verkstäder samarbetar ni med?',
    defaultDesc: 'Vi samarbetar med ett nätverk av certifierade verkstäder som uppfyller våra höga kvalitetskrav. Alla verkstäder är noggrant utvalda för att säkerställa professionell service, korrekt hantering av skador och hög kundnöjdhet.',
  },
  {
    number: 5,
    titleKey: 'page.faq.5.question',
    descKey: 'page.faq.5.answer',
    defaultTitle: 'Hur lång tid tar handläggningen av ett ärende?',
    defaultDesc: 'Handläggningstiden varierar beroende på skadans omfattning och dokumentationens fullständighet.Vårt mål är alltid att ge snabba och tydliga besked för att minimera väntetiden för våra kunder.',
  },
  {
    number: 6,
    titleKey: 'page.faq.6.question',
    descKey: 'page.faq.6.answer',
    defaultTitle: 'Vad ingår i garantin?',
    defaultDesc: 'Våra garantipaket omfattar bland annat mekaniska fel, elektroniska system och vissa skador som kan uppstå under normal användning. Detaljerna i garantin varierar beroende på fordonstyp och val av garantitid. Våra kunder får alltid tydlig information om vad som ingår och vilka begränsningar som gäller. Vid frågor är det bara att kontakta kundtjänst.',
  },
  {
    number: 7,
    titleKey: 'page.faq.7.question',
    descKey: 'page.faq.7.answer',
    defaultTitle: 'Hur går processen till från skada till godkänd reparation?',
    defaultDesc: 'Efter att verkstaden gjort en fullständig diagnos och kostnadsuppskattning skickas informationen till oss. Vi granskar ärendet, bedömer om reparationen omfattas av garantin och ger besked direkt. När reparationen godkänns kan verkstaden påbörja arbetet, och vi följer upp tills bilen är reparerad och ärendet avslutat.',
  },
  {
    number: 8,
    titleKey: 'page.faq.8.question',
    descKey: 'page.faq.8.answer',
    defaultTitle: 'Vad händer om en skada inte omfattas av garantin?',
    defaultDesc: 'Om skadan inte täcks av garantin informerar vi tydligt om detta och ger råd om alternativa lösningar.Vi hjälper alltid kunden att hitta den mest kostnadseffektiva och trygga vägen framåt.',
  },
  {
    number: 9,
    titleKey: 'page.faq.9.question',
    descKey: 'page.faq.9.answer',
    defaultTitle: 'Hur kontaktar jag er kundsupport vid frågor eller ärenden?',
    defaultDesc: 'Vår kundsupport nås via telefon, e-post eller vårt onlineformulär. Vi erbjuder personlig service för både kunder och samarbetspartners och säkerställer att varje fråga besvaras snabbt och korrekt. Kontaktuppgifter finns alltid tydligt tillgängliga på vår hemsida.',
  },
  {
    number: 10,
    titleKey: 'page.faq.10.question',
    descKey: 'page.faq.10.answer',
    defaultTitle: 'Varför ska jag välja MobilityPartner?',
    defaultDesc: 'Vi kombinerar djup branschkunskap med snabb och personlig service, alltid med kundens trygghet i fokus. Våra garantier och effektiva skadehantering gör bilägandet enkelt och problemfritt, så att du kan känna dig säker i varje steg av processen.',
  },
];

const Produkter = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  useEffect(() => {
    const fetchWarranties = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${apiBaseUrl}/api/v1/products`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: ApiResponse = await response.json();

        if (data.success && data.products) {
          setProducts(data.products);
          setError(null);
        } else {
          throw new Error('Invalid API response');
        }
      } catch (error) {
        console.error('Error fetching warranties:', error);
        setError('Kunde inte ladda garantier. Vänligen försök igen senare.');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchWarranties();
  }, []);

  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero */}
      <section
        className="relative min-h-[600px] flex items-center justify-center bg-cover bg-center pt-20"
        style={{ backgroundImage: `url(${heroOcean})` }}
      >
        <div className="absolute inset-0 bg-primary/40"></div>
        <div className="relative z-10 container  px-4">
          <EditableText
            fieldKey="page.produkter.hero.title"
            defaultValue="Våra garantier"
            tag="h1"
            multiline={false}
            className="text-4xl md:text-6xl font-bold text-primary-foreground mb-4"
          />
          <EditableText
            fieldKey="page.produkter.hero.subtitle"
            defaultValue="Trygghet även när bilen är begagnad"
            tag="h2"
            multiline={false}
            className="text-2xl text-primary-foreground max-w-3xl"
          />
          <EditableText
            fieldKey="page.produkter.hero.description"
            defaultValue="Vid köp av en begagnad bil kan oväntade kostnader för reparationer ställa till med problem. Med en begagnatgaranti säkerställer du att du och kund tillsammans kan vara trygga av kostnaderna och försäkringsskydd. Garantin omfattar plötsliga och oförutsedda fel på både mekaniska och elektriska komponenter och bidrar därmed till att minimera kostnaden för oförutsedda reparationer."
            tag="p"
            className="text-lg text-primary-foreground max-w-3xl mt-6"
          />
        </div>
      </section>
      <section className="bg-secondary  min-h-[600px]">
        <div className="grid md:grid-cols-2">
          <div
            className="min-h-[600px] bg-cover bg-center"
            style={{ backgroundImage: `url(${carAutumn})` }}
          ></div>
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <EditableText
                fieldKey="page.produkter.investment.title"
                defaultValue="En begagnatgaranti är en investering i både trygghet och långsiktig hållbarhet, för ett bilägande som är lika bekymmersfritt som ansvarsfullt."
                tag="h2"
                className="text-3xl font-bold text-forest-foreground mb-8"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Warranty Tiers */}
      <section className="py-16 bg-primary">
        <div className="container mx-auto px-4">
          <EditableText
            fieldKey="page.produkter.products.title"
            defaultValue="Garantier för personbilar"
            tag="h2"
            multiline={false}
            className="text-3xl font-bold text-center text-primary-foreground mb-4"
          />
          <EditableText
            fieldKey="page.produkter.products.description"
            defaultValue="Hos oss kan du teckna garantier på bilar upp till 20 år gamla eller med en mätarställning på upp till 30 000km. Läs mer om våra produkter nedan, du kan även ladda ner produktinformationen för respektive garanti."
            tag="p"
            className="text-center text-primary-foreground mb-12 text-2xl"
          />

          {error && (
            <div className="max-w-6xl mx-auto mb-6">
              <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded">
                {error}
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center min-h-[400px]">
              <div className="text-primary-foreground text-lg">
                Laddar garantier...
              </div>
            </div>
          ) : products.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {products.map((product) => (
                <Card key={product.id} className="p-5 bg-card w-full max-w-[500px] mx-auto flex flex-col h-full">
                  <h3 className="text-2xl font-bold mb-2">{product.name}</h3>
                  <p className="text-sm mb-2">{product.description}</p>
                  <div className="flex flex-grow">
                    <ul className="space-y-2 mb-6 ml-2 mr-5 text-sm list-disc list-inside">
                      <li> {product.durationMonths} månader</li>
                      {/* <li> SEK {product.premium.toLocaleString('sv-SE')}</li> */}
                      <li> {product.vehicleType}</li>
                      <li> {product.maxAge} år</li>

                    </ul>
                    <ul className="space-y-2 mb-6 ml-10 text-sm list-disc list-inside">
                      <li> {product.maxKm.toLocaleString('sv-SE')} km</li>
                      {product.maxHk > 0 && <li>{product.maxHk} hk</li>}
                    </ul>
                  </div>

                  {product.pdfUrl ? (
                    <div className="mt-auto flex flex-col items-end justify-end">
                      <div
                        className="w-fit rounded-md p-2 bg-[#4ab7a7] text-white text-center hover:bg-[#4ab7a7]-600 cursor-pointer"
                        onClick={() => window.open(apiBaseUrl + product.pdfUrl, '_blank')}
                      >
                        <div className="text-center text-black font-bold text-lg">
                          {/* <Download className="mr-2" size={16} /> */}
                          PDF
                        </div>

                        <span className="text-xs ml-1 text-black font-bold">För fullständiga villkor</span>
                      </div>
                    </div>

                  ) : (
                    <Button
                      variant="secondary"
                      className="w-full rounded-full bg-[#4ab7a7] mt-auto"
                      disabled
                    >
                      <Download className="mr-2" size={16} />
                      PDF ej tillgänglig
                    </Button>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex justify-center items-center min-h-[400px]">
              <div className="text-primary-foreground text-lg">
                Inga garantier tillgängliga för närvarande.
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Undantag (Exceptions) */}
      <section className="py-12 bg-secondary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-forest-foreground mb-4">Undantag</h2>
          <Link
            to="/undantag"
            className="inline-flex items-center gap-2 text-lg text-[#4ab7a7] hover:text-[#3a9a8d] underline underline-offset-4 font-medium transition-colors"
          >
            Klicka här för att se alla undantag
            <ExternalLink size={18} />
          </Link>
        </div>
      </section>

      <section id="damage-process-section" className="py-16 bg-muted bg-cover bg-center min-h-[800px]" style={{ backgroundImage: `url(${cars})` }}>
        <div className="relative overflow-hidden from-teal-700 to-teal-900 text-white">


          <div className="relative max-w-6xl mx-auto px-6 py-16">
            <h1 className="text-4xl font-bold mb-4">FAQ</h1>

            <div className="space-y-6">
              {defaultFaqItems.map((step) => (
                <Card key={step.number} className="bg-teal-800/90 border-teal-700 text-white backdrop-blur-sm hover:bg-teal-800 transition-colors"
                  onClick={() => setExpandedStep(expandedStep === step.number ? null : step.number)}
                >
                  <CardContent className="p-6">
                    <div
                      className="flex items-start gap-4 cursor-pointer"
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center font-bold text-sm">
                        {step.number}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <EditableText
                            fieldKey={step.titleKey}
                            defaultValue={step.defaultTitle}
                            tag="h3"
                            multiline={false}
                            className="text-xl font-semibold"
                          />
                          <ChevronDown
                            className={`w-6 h-6 transition-transform duration-300 ${expandedStep === step.number ? 'rotate-180' : ''
                              }`}
                          />
                        </div>
                        <div
                          className="grid transition-all duration-300 ease-in-out"
                          style={{
                            gridTemplateRows: expandedStep === step.number ? '1fr' : '0fr',
                          }}
                        >
                          <div className="overflow-hidden">
                            <EditableText
                              fieldKey={step.descKey}
                              defaultValue={step.defaultDesc}
                              tag="p"
                              className="text-teal-100 text-sm leading-relaxed mt-2"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>
      {/* Activation Notice */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto flex gap-8 items-start">
            <div
              className="w-48 h-48 bg-cover bg-center rounded-lg flex-shrink-0"
              style={{ backgroundImage: `url(${carRoad})` }}
            ></div>
            <div>
              <EditableText
                fieldKey="page.produkter.purchase.text1"
                defaultValue="Tecknande av garanti görs hos bilhandlaren vid köp av fordon. Garantibeviset skickas till dig vid köpet. Därför är det viktigt att bilhandlaren har rätt kontaktuppgifter till dig."
                tag="p"
                className="mb-4"
              />
              <EditableText
                fieldKey="page.produkter.purchase.text2"
                defaultValue="Har du frågor är det bara att höra av dig till antingen bilhandlaren eller oss."
                tag="p"
              />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Produkter;
