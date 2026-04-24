import { Card } from "@/components/ui/card";
import { Phone, Mail, MapPin } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import heroOcean from "@/assets/picbuilding.jpg";
import carDetail from "@/assets/picture2.jpg";
import mountainRoad from "@/assets/mountain-road.jpg";
import gjensidigehero from "@/assets/gjensidige-dark.png";
import EditableText from "@/components/EditableText";

const OmOss = () => {
  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero */}
      <section
        className="relative min-h-[400px] flex items-center justify-center bg-cover bg-center pt-20"
        style={{ backgroundImage: `url(${heroOcean})` }}
      >
        <div className="absolute inset-0 bg-primary/40"></div>
        <div className="relative z-10 container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-primary-foreground mb-4">
            ABOUT US
          </h1>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 items-start max-w-6xl mx-auto">
            <div
              className="h-96 bg-cover bg-center rounded-lg"
              style={{ backgroundImage: `url(${carDetail})` }}
            ></div>
            <Card className="p-8 bg-primary text-primary-foreground">
              <EditableText
                fieldKey="page.omoss.contact.title"
                defaultValue="Kontakta oss"
                tag="h2"
                multiline={false}
                className="text-3xl font-bold mb-8"
              />
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <Phone className="flex-shrink-0 mt-1" size={20} />
                  <div>
                    <EditableText
                      fieldKey="page.omoss.contact.phone"
                      defaultValue="010 - 189 89 99"
                      tag="p"
                      multiline={false}
                      className="font-semibold"
                    />
                    <EditableText
                      fieldKey="page.omoss.contact.hours"
                      defaultValue="Mån - tre 10.00 -16.00"
                      tag="p"
                      multiline={false}
                      className="text-sm opacity-90"
                    />
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <MapPin className="flex-shrink-0 mt-1" size={20} />
                  <div>
                    <EditableText
                      fieldKey="page.omoss.contact.address1"
                      defaultValue="Trollhättevägen 20 "
                      tag="p"
                      multiline={false}
                    />
                    <EditableText
                      fieldKey="page.omoss.contact.address2"
                      defaultValue="442 34 Kungälv"
                      tag="p"
                      multiline={false}
                    />
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Mail className="flex-shrink-0 mt-1" size={20} />
                  <EditableText
                    fieldKey="page.omoss.contact.email"
                    defaultValue="support@mobilitypartner.se"
                    tag="p"
                    multiline={false}
                  />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Försäkringsförmedling */}
      <section className="py-16 bg-primary">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-[#f5e9d0]">
            <EditableText
              fieldKey="page.omoss.insurance.title"
              defaultValue="Försäkringsförmedling"
              tag="h2"
              multiline={false}
              className="text-4xl md:text-5xl font-bold mb-6"
            />
            <div className="space-y-4 text-base md:text-lg leading-relaxed">
              <EditableText
                fieldKey="page.omoss.insurance.text1"
                defaultValue='MobilityPartner Norden AB ("MobilityPartner") är registrerat hos Bolagsverket som en anknuten sidoverksam försäkringsförmedlare till Gjensidige Forsikring ASA ("Gjensidige"). Det innebär att MobilityPartner förmedlar försäkringar enbart för Gjensidiges räkning och inga andra försäkringsgivare.'
                tag="p"
              />
              <EditableText
                fieldKey="page.omoss.insurance.text2"
                defaultValue="MobilityPartner står under tillsyn av Finansinspektionen, och registrering kan kontrolleras hos: Bolagsverket, 851 81 Sundsvall, telefon 060-18 40 00, e-post: bolagsverket@bolagsverket.se, www.bolagsverket.se."
                tag="p"
              />
              <EditableText
                fieldKey="page.omoss.insurance.text3"
                defaultValue="Registreringen avser skadeförsäkringsklass 16. Annan förmögenhetsskada; − annan ekonomisk förlust."
                tag="p"
              />
            </div>
          </div>
        </div>
      </section>

      {/* About Us Content */}
      <section className="py-16 bg-muted">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-start max-w-6xl mx-auto">
            <Card className="p-8 bg-primary text-primary-foreground">
              <EditableText
                fieldKey="page.omoss.about.title"
                defaultValue="Om Oss"
                tag="h2"
                multiline={false}
                className="text-3xl font-bold mb-6"
              />
              <div className="space-y-4 text-sm">
                <EditableText
                  fieldKey="page.omoss.about.text1"
                  defaultValue="Mobilitypartner Norden AB erbjuder moderna och flexibla bilgarantier och försäkringslösningar till dig som privatperson. Med ett digitalt ekosystem och djup branschkunskap möjliggör vi tryggare bilköp för dig som kund. Vi är din trygga partner, vi gör det enkelt att köpa, äga och köra bil med fullständig trygghet. Vi vet att många känner en viss osäkerhet inför att investera i en begagnad bil. Därför har vi valt att specialisera oss på att erbjuda marknadens mest omfattande begagnatgarantier, så att du alltid kan känna dig säker bakom ratten."
                  tag="p"
                />
                <EditableText
                  fieldKey="page.omoss.about.text2"
                  defaultValue="Vår filosofi är enkel: en bilaffär ska präglas av förtroende, transparens och långsiktighet. Därför arbetar vi nära våra kunder för att säkerställa detta. Våra garantilösningar är utformade för att täcka det som verkligen betyder något, från oväntade reparationskostnader till extra trygghet på vägen."
                  tag="p"
                />
                <EditableText
                  fieldKey="page.omoss.about.text3"
                  defaultValue="Vi möter marknadens behov av transparens, snabbhet och trygghet  med innovation som motor.  Med många års erfarenhet i branschen och ett nätverk av pålitliga partners kan vi nu erbjuda flexibla garantier."
                  tag="p"
                />
                <EditableText
                  fieldKey="page.omoss.about.text4"
                  defaultValue="Vi brinner för att förändra synen på begagnatköp. Där många ser risker ser vi möjligheter, med rätt garantier och rätt service kan en begagnad bil kännas lika trygg som en ny. Vårt mål är att ge våra kunder samma känsla av frihet och säkerhet, oavsett om bilen är ny eller några år gammal."
                  tag="p"
                />
                <EditableText
                  fieldKey="page.omoss.about.text5"
                  defaultValue="På MobilityPartner bygger vi relationer för framtiden. Vårt engagemang för kvalitet, service och trygghet genomsyrar allt vi gör. Därför kan du alltid räkna med att vi står vid din sida, även efter att affären är avslutad. Det är så vi skapar långsiktigt värde för våra kunder, varje dag."
                  tag="p"
                />
              </div>
            </Card>
            <div
              className="h-full min-h-[500px] bg-cover bg-center rounded-lg"
              style={{ backgroundImage: `url(${heroOcean})` }}
            ></div>
          </div>
        </div>
      </section>

      {/* Gjensidige Partnership */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <EditableText
              fieldKey="page.omoss.gjensidige.title"
              defaultValue="I samarbete med Gjensidige Försäkring."
              tag="h2"
              multiline={false}
              className="text-3xl font-bold mb-6 text-accent"
            />
            <EditableText
              fieldKey="page.omoss.gjensidige.description"
              defaultValue="Vi på MobilityPartner är måna om att du som köper en garanti ska få den hjälp du har rätt till, oavsett vilken återförsäljare du köpt din garanti från. Återförsäljare som samarbetar med MobilityPartner är därför alltid försäkrade i de fall du har rätt till ersättning från garantin. Återförsäljarens försäkring levereras av Gjensidige Försäkring, Nordens tredje största försäkringsbolag."
              tag="p"
              className="text-muted-foreground mb-8"
            />
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="hidden md:flex items-center justify-center">
                <div className="bg-white rounded-lg p-4 shadow-md">
                  <img
                    src={gjensidigehero}
                    alt="Gjensidige Försäkring"
                    className="h-20 md:h-24 w-auto object-contain"
                  />
                </div>
              </div>
              <div
                className="h-64 bg-cover bg-center rounded-lg"
                style={{ backgroundImage: `url(${mountainRoad})` }}
              ></div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default OmOss;
