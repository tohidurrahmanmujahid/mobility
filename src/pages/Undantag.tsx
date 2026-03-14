import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface SectionProps {
  title: string;
  description?: string;
  color: string;
  bgColor: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, description, color, bgColor, children }) => (
  <section className="mb-8">
    <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
      {title}
    </h2>
    {description && (
      <p className="text-gray-700 leading-relaxed mb-4">{description}</p>
    )}
    <div className={`p-5 ${bgColor} rounded-lg border-l-4 ${color}`}>
      <div className="text-gray-700 leading-relaxed space-y-4">{children}</div>
    </div>
  </section>
);

interface BrandListProps {
  title: string;
  brands: string[];
}

const BrandList: React.FC<BrandListProps> = ({ title, brands }) => (
  <div>
    <h4 className="font-semibold text-gray-800 mb-2">{title}</h4>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
      {brands.map((brand, i) => (
        <div key={i} className="flex items-center gap-2 bg-white/60 rounded-md px-3 py-1.5 text-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
          {brand}
        </div>
      ))}
    </div>
  </div>
);

interface SpecificModelProps {
  models: string[];
}

const SpecificModels: React.FC<SpecificModelProps> = ({ models }) => (
  <div>
    <h4 className="font-semibold text-gray-800 mb-2">Specifika modeller som undantas:</h4>
    <div className="grid md:grid-cols-2 gap-2">
      {models.map((model, i) => (
        <div key={i} className="flex items-center gap-2 bg-white/60 rounded-md px-3 py-1.5 text-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
          {model}
        </div>
      ))}
    </div>
  </div>
);

const OvrigaUndantag: React.FC = () => (
  <div>
    <h4 className="font-semibold text-gray-800 mb-2">Övriga undantag:</h4>
    <div className="flex items-center gap-2 bg-white/60 rounded-md px-3 py-1.5 text-sm w-fit">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
      Amerikanska bilar med över 400 hk
    </div>
  </div>
);

const Disclaimer: React.FC = () => (
  <p className="mt-4 p-3 bg-white/50 rounded-lg text-sm text-gray-600 italic border border-gray-200">
    Mobilitypartner förbehåller sig rätten att neka tecknande av garanti för enskilda fordon efter individuell bedömning.
  </p>
);

const fullBrandList = [
  "Alpina",
  "Aston Martin",
  "Bentley",
  "Corvette",
  "Ferrari",
  "Jaguar",
  "Lamborghini",
  "Land Rover & Range Rover",
  "Maserati",
  "Porsche",
  "Rolls Royce",
];

const shortBrandList = [
  "Aston Martin",
  "Bentley",
  "Ferrari",
  "Lamborghini",
  "Maserati",
  "Rolls Royce",
  "Land Rover & Range Rover",
];

const fullSpecificModels = [
  "Alfa Romeo – Q- och 4C-modeller",
  "Audi – V12-, S-, R- och RS-modeller",
  "BMW – M- och V12-modeller",
  "Ford – Focus RS",
  "Lexus – LFA",
  "Mercedes – AMG- och V12-modeller",
  "Mitsubishi – EVO-modeller",
  "Nissan – GT-R",
  "Opel – OPC",
  "Seat – Cupra",
  "Subaru – WRX STI",
  "Volkswagen – W12, Phaeton, GTR och R-modeller",
];

const sportSpecificModels = [
  "Mitsubishi – EVO-modeller",
  "Nissan GTR",
  "Audi R8",
];

const platinaSpecificModels = [
  "Alfa Romeo – Q- och 4C-modeller",
  "Alpina",
  "Audi – V12-, S-, R- och RS-modeller",
  "BMW – M- och V12-modeller",
  "Corvette",
  "Cupra bensinmodeller",
  "Ford – Focus RS",
  "Lotus",
  "Mercedes – AMG- och V12-modeller",
  "Mitsubishi – EVO-modeller",
  "Opel – OPC",
  "Subaru – WRX STI",
  "Volkswagen – W12, Phaeton, GTR och R-modeller",
  "Nissan GTR",
  "Lexus – LFA",
  "Seat – Cupra",
];

const Undantag: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Header */}
      <header className="bg-white shadow-sm mt-20">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            Undantag
          </h1>
          <p className="text-lg text-gray-600 mt-2">Mobilitypartner Norden AB</p>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="bg-white rounded-xl shadow-sm p-6 md:p-10">
          {/* Introduction */}
          <div className="mb-10 p-6 bg-teal-50 rounded-lg border-l-4 border-teal-500">
            <p className="text-gray-700 leading-relaxed">
              Nedan listas de märken och modeller som undantas från respektive garantinivå.
              Undantagen varierar beroende på vilken garantinivå som tecknas. Vänligen
              kontrollera villkoren för den aktuella garantinivån innan tecknande.
            </p>
            <p className="text-gray-700 leading-relaxed mt-3 font-medium">
              Mobilitypartner förbehåller sig rätten att neka tecknande av garanti
              för enskilda fordon efter individuell bedömning.
            </p>
          </div>

          {/* Brons */}
          <Section
            title="Brons"
            description="Kan tecknas på diesel-, bensin- och hybridbilar från samtliga vanligt förekommande bilmärken, med undantag för nedanstående märken och modeller."
            color="border-amber-600"
            bgColor="bg-amber-50"
          >
            <BrandList title="Samtliga modeller undantas för följande märken:" brands={fullBrandList} />
            <SpecificModels models={fullSpecificModels} />
            <OvrigaUndantag />
            <Disclaimer />
          </Section>

          {/* Silver */}
          <Section
            title="Silver"
            color="border-gray-400"
            bgColor="bg-gray-50"
          >
            <BrandList title="Samtliga modeller undantas för följande märken:" brands={fullBrandList} />
            <SpecificModels models={fullSpecificModels} />
            <OvrigaUndantag />
            <Disclaimer />
          </Section>

          {/* Guld */}
          <Section
            title="Guld"
            description="Kan tecknas på diesel-, bensin- och hybridbilar från samtliga vanligt förekommande bilmärken, med undantag för nedanstående märken och modeller."
            color="border-yellow-500"
            bgColor="bg-yellow-50"
          >
            <BrandList title="Samtliga modeller undantas för följande märken:" brands={fullBrandList} />
            <SpecificModels models={fullSpecificModels} />
            <OvrigaUndantag />
            <Disclaimer />
          </Section>

          {/* Sport */}
          <Section
            title="Sport"
            description="Kan tecknas på diesel-, bensin- och hybridbilar från samtliga vanligt förekommande bilmärken, med undantag för nedanstående märken och modeller:"
            color="border-red-500"
            bgColor="bg-red-50"
          >
            <BrandList title="Samtliga modeller undantas för följande märken:" brands={shortBrandList} />
            <SpecificModels models={sportSpecificModels} />
            <Disclaimer />
          </Section>

          {/* Platina */}
          <Section
            title="Platina"
            description="Kan tecknas på diesel-, bensin- och hybridbilar från samtliga vanligt förekommande bilmärken, med undantag för nedanstående märken och modeller:"
            color="border-blue-500"
            bgColor="bg-blue-50"
          >
            <BrandList title="Samtliga modeller undantas för följande märken:" brands={shortBrandList} />
            <SpecificModels models={platinaSpecificModels} />
            <OvrigaUndantag />
            <Disclaimer />
          </Section>

          {/* Electric */}
          <Section
            title="Electric"
            description="Kan tecknas på elbilar, med undantag för nedanstående märken och modeller:"
            color="border-green-500"
            bgColor="bg-green-50"
          >
            <BrandList title="Samtliga modeller undantas för följande märken:" brands={[
              "Aston Martin",
              "Bentley",
              "Ferrari",
              "Lamborghini",
              "Maserati",
              "Rolls Royce",
            ]} />
            <SpecificModels models={sportSpecificModels} />
            <Disclaimer />
          </Section>

          {/* Footer note */}
          <div className="mt-10 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
            <p>
              Denna information kan komma att uppdateras. Den senaste
              versionen finns alltid tillgänglig via våra digitala kanaler.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Undantag;
