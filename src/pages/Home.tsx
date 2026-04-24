import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
import gjensidigehero from "@/assets/gjensidige-dark.png";
import carfix from "@/assets/carfix.jpg";
import EditableText from "@/components/EditableText";
import { useAdmin } from "@/context/AdminContext";

const Home = () => {
  const { pageContent } = useAdmin();

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
            <EditableText
              fieldKey="page.home.hero.title"
              defaultValue="Välkommen till din mobilitetspartner"
              tag="h1"
              multiline={false}
              className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight"
            />

            <EditableText
              fieldKey="page.home.hero.subtitle"
              defaultValue="Vi skapar smarta, hållbara och flexibla lösningar för framtidens resor."
              tag="p"
              multiline={false}
              className="text-lg text-gray-200 mb-12 leading-relaxed"
            />

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
          <EditableText
            fieldKey="page.home.safety.title"
            defaultValue="Köp begagnat med samma trygghet som nytt!"
            tag="h2"
            multiline={false}
            className="text-3xl font-bold mb-6"
          />
          <EditableText
            fieldKey="page.home.safety.body"
            defaultValue="Med våra garantier slipper du oron för oväntade kostnader, vi täcker plötsligt och oförutsedda fel på både elektriska och mekaniska komponenter. Kör vidare med full kontroll, trygghet och frihet på vägen."
            tag="p"
            className="text-muted-foreground max-w-3xl mx-auto"
          />
        </div>
      </section>

      <section className="relative min-h-[500px] bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="grid lg:grid-cols-1 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <EditableText
                  fieldKey="page.home.about.title"
                  defaultValue="Mobilitypartner"
                  tag="h1"
                  multiline={false}
                  className="text-5xl md:text-6xl font-bold text-slate-900 leading-tight"
                />
                <EditableText
                  fieldKey="page.home.about.body"
                  defaultValue="Vi erbjuder bilägare ett tryggare och mer bekymmersfritt bilköp. Hos utvalda fordons­handlare kan du idag få en omfattande begagnatgaranti som skyddar dig mot oväntade kostnader om något skulle hända med bilen efter köpet.

En garanti ger dig extra trygghet och visar att bilen är noggrant kontrollerad och i gott skick vid leverans. Skulle något mot förmodan gå fel, slipper du oroa dig för dyra reparationer, garantin täcker många av de viktigaste komponenterna i bilen.

Att köpa en begagnad bil med garanti är därför inte bara en säkerhetsåtgärd, utan också en kvalitetsstämpel som gör ditt bilägande enklare, tryggare och mer förutsägbart."
                  tag="p"
                  className="text-lg text-gray-600 leading-relaxed w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

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
            <div className="p-8 bg-card rounded-lg">
              <EditableText
                fieldKey="page.home.welcome.title"
                defaultValue="Välkommen till oss!"
                tag="h2"
                multiline={false}
                className="text-2xl font-bold mb-4"
              />
              <EditableText
                fieldKey="page.home.welcome.body"
                defaultValue="Har du köpt en begagnatgaranti via MobilityPartner? Då har du redan tagit ett smart steg mot ett tryggare bilägande. Här kan du läsa mer om Mobilitypartner, vad din garanti omfattar och hur du enkelt går tillväga om något skulle inträffa din bil. Vårt mål är att du ska känna dig trygg och nöjd."
                tag="p"
                className="text-muted-foreground"
              />
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
            </div>
            <div
              className="h-80 bg-cover bg-center rounded-lg"
              style={{ backgroundImage: `url(${pictureCar})` }}
            ></div>
          </div>
        </div>
      </section>

      <GjensidigeHero
        backgroundImage={ocean}
        logoImage={carfix}
        title={pageContent["page.home.gjensidige.title"] ?? "För ett tryggare bilägande"}
        description={pageContent["page.home.gjensidige.desc"] ?? "På Mobilitypartner gör vi det enklare och tryggare att köpa begagnad bil. Tillsammans med etablerade partners erbjuder vi garantilösningar som skyddar mot oväntade kostnader och ger extra trygghet efter köpet. Med enkel administration, tydliga villkor och produkter framtagna med kunden i fokus hjälper vi både bilhandlare och bilköpare till en smidigare och tryggare bilaffär."}
        editKeys={{ title: "page.home.gjensidige.title", description: "page.home.gjensidige.desc" }}
      />

      <Footer />
    </div>
  );
};

export default Home;
