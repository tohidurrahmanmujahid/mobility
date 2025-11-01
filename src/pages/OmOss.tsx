import { Card } from "@/components/ui/card";
import { Phone, Mail, MapPin } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import heroOcean from "@/assets/picbuilding.jpg";
import carDetail from "@/assets/picture2.jpg";
import mountainRoad from "@/assets/mountain-road.jpg";

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
                    <p className="font-semibold">010 - 00 00 00</p>
                    <p className="text-sm opacity-90">Mån - fre 09.00 - 16.00</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <MapPin className="flex-shrink-0 mt-1" size={20} />
                  <div>
                    <p>Adress1</p>
                    <p>Adress 2 Göteborg</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Mail className="flex-shrink-0 mt-1" size={20} />
                  <p>Support@mobilitypartner.se</p>
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
              <h2 className="text-3xl font-bold mb-6">Om oss</h2>
              <div className="space-y-4 text-sm">
                <p>
                  Mobilitypartner Norden AB är ett ung, modernt och flexibelt bilgarantier och 
                  försäkringsbolag som till det som finansiärer. Med vår djupa kännedom om 
                  djup branschkunskap möjliggör vi trygga bilköp för dig som kund.
                </p>
                <p>
                  Vi är din bästa partner, ur ett års perspektiv där du väljer till er som leverantör. 
                  Med fokus på att följa upp era behov vivet ett nära samband med våra kunder i vad vi betraktar 
                  som många nyckelrelationer. Vi lever för att erbjuda ett brett utbud av service.
                </p>
                <p>
                  Vår filosofi är enkel: och brutfor dina problem med förnörenste, transparentes och 
                  längdligheter. Genom anhets och bäst vält käll tryktar i kur och växella nät i kur över 
                  vår bränningel känsligheter sitt även sket målerära i tjänster med vår tjänster. Vi möjligheter 
                  kan troutnisale uppstrukendtrudeför i form och tryggat garantier.
                </p>
                <p>
                  Vi möter marknadens behov av transparens, snabbhet och trygghet med 
                  innovation som motor. Med många är erfarenhet inom mobilitetssektorer 
                  nätverk av pålitliga partners kan vi erbjuda flexibla garantier.
                </p>
                <p>
                  Vi erbjuder bred branschkunskap, kostnad som passar både nybörjare och erfarna inom mobilitet. 
                  Hör gärna av dig för att utforska hur vi kan hjälpa din och andra i samarbeta med oss. 
                  På MobilityPartner bygger vi relationer för framtiden. Vårt erbjudande är lika 
                  kvalitet, service och trygghet garanterar att vi är partner kan vi alltid räkna 
                  med som en pålitlig partite för vårt framtida roll.
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
              Gjensidge Försäkringår.
            </h2>
            <p className="text-muted-foreground mb-8">
              Gjensidige försäkringar har funnits i över 200 år och är ett av 
              Nordens mest erfarna och största försäkringsbolag. Med Gjensidige som försäkringsgivare får du alltid en 
              objektiv bedömning i skadehänderlngen.
            </p>
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <Card className="p-8 bg-card">
                <div className="bg-background p-6 rounded-lg inline-block">
                  <h3 className="text-2xl font-bold">Gjensidige</h3>
                  <p className="text-accent">Försäkring</p>
                </div>
              </Card>
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
