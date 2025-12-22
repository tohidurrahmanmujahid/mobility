import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Badge, QrCode } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import heroOcean from "@/assets/pictureocean.jpg";
import pictureWood from "@/assets/picturewoods.jpg";
import pictureCar from "@/assets/picture4.jpg";
import carAutumn from "@/assets/picturecars.jpg";
import carRoad from "@/assets/car-road.jpg";
import GjensidigeHero from "@/components/Gjensidigehero";
import ocean from "@/assets/picocean2.jpg";
import gjensidigehero  from "@/assets/gjensidige-dark.png";

const Home = () => {
  const partners = [
    { name: "Samrander", image: carRoad },
    { name: "Blacket", image: carRoad },
    { name: "Gjensidige", image: carAutumn },
  ];

  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero Section */}
      <section className="relative min-h-[600px] flex items-center overflow-hidden bg-slate-900">
        {/* Background Image Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroOcean})` }}
        >
          <div className="absolute inset-0 bg-primary/40"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 w-full">
          <div className="max-w-2xl">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Välkommen till
              din mobilitetspartner
            </h1>

            <p className="text-lg text-gray-200 mb-12 leading-relaxed">
              Vi skapar smarta, hållbara och flexibla lösningar för framtidens resor.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-8">
              {/* For Job Seekers */}
              <div className="space-y-3">
                <Button
                  size="lg"
                  variant="outline"

                  className="bg-[#d2cbb8] text-slate-900 hover:bg-primary font-semibold px-8 rounded-full"
                >
                  <Link to="/produkter">VÅRA GARANTIER</Link>

                </Button>
              </div>

              {/* For Businesses */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    size="lg"
                    variant="outline"
                    className="bg-[#d2cbb8] text-slate-900 hover:bg-primary font-semibold px-8 rounded-full"
                  >
                    <Link to="/Skadeanmalan">SKADEANMÄLAN</Link>
                  </Button>

                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Safety Message */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Köp begagnat med samma trygghet som nytt!</h2>
          <p className="text-muted-foreground max-w-3xl mx-auto">
            Med våra garantier slipper du oron för oväntade kostnader – vi täcker plötsligt och oförutsedda
            fel på både elektriska och mekaniska komponenter. Kör vidare med full kontroll, trygghet och
            frihet på vägen.
          </p>
        </div>
      </section>
      <section className="relative min-h-[500px] bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="grid lg:grid-cols-1 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">

              <div className="space-y-4">
                <h1 className="text-5xl md:text-6xl font-bold text-slate-900 leading-tight">
                  Mobilitypartner
                </h1>

                <p className="text-lg text-gray-600 leading-relaxed w-full">
                  Vi erbjuder bilägare ett tryggare och mer bekymmersfritt bilköp. Hos utvalda fordons­handlare kan du idag få en omfattande begagnatgaranti som skyddar dig mot oväntade kostnader om något skulle hända med bilen efter köpet.

                  En garanti ger dig extra trygghet och visar att bilen är noggrant kontrollerad och i gott skick vid leverans. Skulle något mot förmodan gå fel, slipper du oroa dig för dyra reparationer, garantin täcker många av de viktigaste komponenterna i bilen.

                  Att köpa en begagnad bil med garanti är därför inte bara en säkerhetsåtgärd, utan också en kvalitetsstämpel som gör ditt bilägande enklare, tryggare och mer förutsägbart.</p>
              </div>

              {/* <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 rounded-lg group"
                >
                  What's new with Dash
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white font-semibold px-8 rounded-lg"
                >
                  Try Dropbox free →
                </Button>
              </div> */}
            </div>

            {/* Right Product Mockup */}
            {/* <div className="relative lg:block hidden">
              <Card className="p-8 flex items-center justify-center bg-card">
                <div className="text-center">
                  <div className="w-32 h-32 mx-auto mb-4 bg-primary rounded-3xl flex items-center justify-center">
                    <QrCode size={80} className="text-primary-foreground" />
                  </div>
                  <p className="text-sm font-semibold">SE ALLMÄNNA VILLKOR</p>
                </div>
              </Card>
            </div> */}
          </div>
        </div>
      </section>

      {/* Partners */}
      {/* <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Våra partners</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {partners.map((partner) => (
              <Card key={partner.name} className="overflow-hidden group cursor-pointer">
                <div className="relative h-64 bg-cover bg-center" style={{ backgroundImage: `url(${partner.image})` }}>
                  <div className="absolute inset-0 bg-primary/30 group-hover:bg-primary/50 transition-colors flex items-center justify-center">
                    <h3 className="text-2xl font-bold text-primary-foreground">{partner.name}</h3>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section> */}

      {/* Become Partner CTA */}
      <section className="bg-primary">
        <div className="grid md:grid-cols-2">
          <div
            className="min-h-[400px] bg-cover bg-center"
            style={{ backgroundImage: `url(${carAutumn})` }}
          ></div>
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-primary-foreground mb-8">
                Bli vår partner<br />idag!
              </h2>
              <Button asChild size="lg" variant="secondary" className="rounded-full">
                <Link to="/aterforssaljare">Ansök här</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Gjensidige Partnership */}
      <section className="py-16 bg-muted bg-cover bg-center" style={{ backgroundImage: `url(${pictureWood})` }}>
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <Card className="p-8 bg-card">
              <h2 className="text-2xl font-bold mb-4">Välkommen till oss!</h2>
              <p className="text-muted-foreground">
                Har du köpt en begagnatgaranti via MobilityPartner? Då har du redan tagit ett smart steg mot ett tryggare bilägande. Här kan du läsa mer om Mobilitypartner, vad din garanti omfattar och hur du enkelt går tillväga om något skulle inträffa din bil. Vårt mål är att du ska känna dig trygg och nöjd.
              </p>
              <div className="flex flex-col sm:flex-row gap-8 mt-5">
                {/* For Businesses */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      size="lg"
                      variant="outline"
                      className="bg-[#d2cbb8] text-slate-900 hover:bg-primary font-semibold px-8 rounded-full"
                    >
                      <Link to="/Skadeanmalan">SKADEANMÄLAN</Link>
                    </Button>

                  </div>
                </div>
                {/* For Job Seekers */}
                <div className="space-y-3">
                  <Button
                    size="lg"
                    variant="outline"

                    className="bg-[#d2cbb8] text-slate-900 hover:bg-primary font-semibold px-8 rounded-full"
                  >
                    <Link to="/om-oss">OM OSS</Link>

                  </Button>
                </div>
              </div>
            </Card>
            <div
              className="h-80 bg-cover bg-center rounded-lg"
              style={{ backgroundImage: `url(${pictureCar})` }}
            ></div>
          </div>
        </div>
      </section>


      <GjensidigeHero
        backgroundImage={ocean}
        logoImage={gjensidigehero}
        title="Gjensidige"
        description="Tillsammans med ett av nordens största försäkringsbolag hjälper vi nu svenska folket att köra tryggare - med en helt ny begagnatgaranti."
      />

      <Footer />
    </div>
  );
};

export default Home;
