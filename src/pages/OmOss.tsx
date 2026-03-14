import { Card } from "@/components/ui/card";
import { Phone, Mail, MapPin } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import heroOcean from "@/assets/picbuilding.jpg";
import carDetail from "@/assets/picture2.jpg";
import mountainRoad from "@/assets/mountain-road.jpg";
import gjensidigehero from "@/assets/gjensidige-dark.png";

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
              <h2 className="text-3xl font-bold mb-8">Kontakta oss</h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <Phone className="flex-shrink-0 mt-1" size={20} />
                  <div>
                    <p className="font-semibold">010 - 189 89 99</p>
                    <p className="text-sm opacity-90">Mån - tre 10.00 -16.00</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <MapPin className="flex-shrink-0 mt-1" size={20} />
                  <div>
                    <p>Trollhättevägen 20 </p>
                    <p>442 34 Kungälv</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Mail className="flex-shrink-0 mt-1" size={20} />
                  <p>support@mobilitypartner.se</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* About Us Content */}
      <section className="py-16 bg-muted">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-start max-w-6xl mx-auto">
            <Card className="p-8 bg-primary text-primary-foreground">
              <h2 className="text-3xl font-bold mb-6">Om Oss</h2>
              <div className="space-y-4 text-sm">
                <p>
                  Mobilitypartner Norden AB erbjuder moderna och flexibla bilgarantier och försäkringslösningar till dig som privatperson. Med ett digitalt ekosystem och djup branschkunskap möjliggör vi tryggare bilköp för dig som kund.
                  Vi är din trygga partner, vi gör det enkelt att köpa, äga och köra bil med fullständig trygghet. Vi vet att många känner en viss osäkerhet inför att investera i en begagnad bil. Därför har vi valt att specialisera oss på att erbjuda marknadens mest omfattande begagnatgarantier, så att du alltid kan känna dig säker bakom ratten.
                </p>
                <p>
                  Vår filosofi är enkel: en bilaffär ska präglas av förtroende, transparens och långsiktighet. Därför arbetar vi nära våra kunder för att säkerställa detta. Våra garantilösningar är utformade för att täcka det som verkligen betyder något, från oväntade reparationskostnader till extra trygghet på vägen.
                </p>
                <p>
                  Vi möter marknadens behov av transparens, snabbhet och trygghet  med innovation som motor.  Med många års erfarenhet i branschen och ett nätverk av pålitliga partners kan vi nu erbjuda flexibla garantier.
                </p>
                <p>
                  Vi brinner för att förändra synen på begagnatköp. Där många ser risker ser vi möjligheter, med rätt garantier och rätt service kan en begagnad bil kännas lika trygg som en ny. Vårt mål är att ge våra kunder samma känsla av frihet och säkerhet, oavsett om bilen är ny eller några år gammal.
                </p>
                <p>
                  På MobilityPartner bygger vi relationer för framtiden. Vårt engagemang för kvalitet, service och trygghet genomsyrar allt vi gör. Därför kan du alltid räkna med att vi står vid din sida, även efter att affären är avslutad. Det är så vi skapar långsiktigt värde för våra kunder, varje dag.
                </p>
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
            <h2 className="text-3xl font-bold mb-6 text-accent">
              Garantiförsäkringen du<br />
              tecknar levereras av<br />
              Gjensidge Försäkringar.
            </h2>
            <p className="text-muted-foreground mb-8">
              Gjensidige försäkringar har funnits i över 200 år och är ett av Nordens mest erfarna och största försäkringsbolag. Med Gjensidige som försäkringsgivare får du alltid en objektiv bedömning i skadehanteringen.
            </p>
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
