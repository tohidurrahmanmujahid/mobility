import React from "react";

interface PrivacyPolicySectionProps {
  title: string;
  children: React.ReactNode;
}

const Section: React.FC<PrivacyPolicySectionProps> = ({ title, children }) => (
  <section className="mb-8">
    <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
      {title}
    </h2>
    <div className="text-gray-700 leading-relaxed space-y-3">{children}</div>
  </section>
);

interface SubSectionProps {
  title: string;
  children: React.ReactNode;
}

const SubSection: React.FC<SubSectionProps> = ({ title, children }) => (
  <div className="mb-4">
    <h3 className="text-lg font-medium text-gray-800 mb-2">{title}</h3>
    <div className="text-gray-700 leading-relaxed">{children}</div>
  </div>
);

interface PrivacyPolicyProps {
  companyName?: string;
  email?: string;
  orgNumber?: string;
}

const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({
  companyName = "Mobilitypartner Norden AB",
  email = "support@mobilitypartner.se",
  orgNumber = "559541-2312",
}) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            Integritetspolicy
          </h1>
          <p className="text-lg text-gray-600 mt-2">{companyName}</p>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="bg-white rounded-xl shadow-sm p-6 md:p-10">
          {/* Introduction */}
          <div className="mb-10 p-6 bg-blue-50 rounded-lg border-l-4 border-blue-500">
            <p className="text-gray-700 leading-relaxed">
              {companyName} värnar om din personliga integritet och strävar efter
              en hög nivå av dataskydd. Vi behandlar personuppgifter i enlighet
              med gällande dataskyddslagstiftning, inklusive EU:s
              dataskyddsförordning (GDPR) som trädde i kraft den 25 maj 2018 samt
              kompletterande svensk lagstiftning.
            </p>
            <p className="text-gray-700 leading-relaxed mt-3">
              Denna integritetspolicy beskriver hur {companyName} samlar in,
              använder, delar och skyddar personuppgifter inom ramen för vår
              verksamhet avseende bilgarantier, tilläggsgarantier, serviceavtal
              och närliggande försäkrings- och trygghetslösningar på den svenska
              marknaden.
            </p>
            <p className="text-gray-700 leading-relaxed mt-3 font-medium">
              För att använda våra tjänster behöver du ta del av och godkänna
              denna integritetspolicy.
            </p>
          </div>

          {/* Section: Inhämtning och utlämnande */}
          <Section title="Inhämtning och utlämnande av personuppgifter">
            <SubSection title="Hur vi samlar in personuppgifter">
              <p>
                Nödvändiga personuppgifter om dig inhämtas vanligtvis direkt från
                dig, exempelvis i samband med:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Köp eller tecknande av bilgaranti, försäkring eller serviceavtal</li>
                <li>Skade- och garantiärende</li>
                <li>Kontakt med kundtjänst eller support</li>
              </ul>
              <p className="mt-3">
                Personuppgifter kan även erhållas via tredje part, såsom:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Återförsäljare, bilhandlare och verkstäder</li>
                <li>Samarbetspartners och administratörer av garanti- och försäkringslösningar</li>
                <li>
                  Myndigheter och externa register (t.ex. Transportstyrelsen,
                  finansbolag eller försäkringsgivare)
                </li>
              </ul>
            </SubSection>

            <SubSection title="Automatiskt insamlade uppgifter">
              <p>
                När du använder {companyName}:s digitala tjänster kan viss
                information samlas in automatiskt, exempelvis:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Beteende på webbplatsen (t.ex. besökta sidor och klick)</li>
                <li>
                  Teknisk information såsom IP-adress, webbläsartyp, språk,
                  operativsystem och enhetsidentifierare
                </li>
                <li>Hänvisande URL till vår webbplats</li>
              </ul>
            </SubSection>

            <SubSection title="Utlämnande och delning av personuppgifter">
              <p>
                Personuppgifter används i första hand inom {companyName} men kan
                delas med samarbetspartners när det är nödvändigt för att:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Administrera och fullgöra garanti- och försäkringsavtal</li>
                <li>Hantera skade-, reklamations- och garantiärenden</li>
                <li>Genomföra reparationer och tekniska bedömningar via verkstäder</li>
                <li>Uppfylla rättsliga skyldigheter</li>
              </ul>
              <p className="mt-3 p-3 bg-gray-50 rounded-lg text-sm">
                <strong>OBS:</strong> Som huvudregel behandlas personuppgifter inom
                EU/EES. Om personuppgifter i undantagsfall överförs till land
                utanför EU/EES säkerställer vi att detta sker i enlighet med GDPR,
                exempelvis genom standardavtalsklausuler.
              </p>
            </SubSection>
          </Section>

          {/* Section: Kategorier */}
          <Section title="Kategorier av personuppgifter som behandlas">
            <p>
              Beroende på ärende och avtal kan vi behandla följande kategorier av
              personuppgifter:
            </p>
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              {[
                { title: "Identitetsuppgifter", desc: "Namn, personnummer, födelsedatum" },
                { title: "Kontaktuppgifter", desc: "Adress, telefonnummer, e-postadress" },
                { title: "Fordonsuppgifter", desc: "Registreringsnummer, VIN/chassinummer, mätarställning, servicehistorik" },
                { title: "Avtals- och försäkringsuppgifter", desc: "Avtalstid, villkor, garantiomfattning" },
                { title: "Skade- och ärendeuppgifter", desc: "Felbeskrivningar, verkstadsutlåtanden, kostnadsunderlag" },
                { title: "Betalningsuppgifter", desc: "Betalnings- och fakturauppgifter" },
              ].map((item, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-800">{item.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* Section: Ändamål och laglig grund */}
          <Section title="Ändamål och laglig grund">
            <p className="mb-4">
              {companyName} behandlar personuppgifter endast när det finns en
              laglig grund enligt GDPR. Behandling sker för följande ändamål:
            </p>

            <div className="space-y-4">
              <div className="p-4 border-l-4 border-blue-500 bg-blue-50 rounded-r-lg">
                <h4 className="font-semibold text-gray-800">Avtal</h4>
                <ul className="mt-2 space-y-1 text-gray-700 text-sm">
                  <li>• För att ingå, administrera och fullgöra avtal om bilgaranti, försäkring eller serviceavtal</li>
                  <li>• För att hantera garanti- och skadeärenden</li>
                  <li>• För identifiering av kund, i vissa fall med personnummer när det är nödvändigt</li>
                </ul>
              </div>

              <div className="p-4 border-l-4 border-green-500 bg-green-50 rounded-r-lg">
                <h4 className="font-semibold text-gray-800">Rättslig förpliktelse</h4>
                <ul className="mt-2 space-y-1 text-gray-700 text-sm">
                  <li>• För att uppfylla krav enligt lag (bokförings-, konsument- och försäkringsrättslig lagstiftning)</li>
                  <li>• För rapportering till myndigheter vid behov</li>
                </ul>
              </div>

              <div className="p-4 border-l-4 border-yellow-500 bg-yellow-50 rounded-r-lg">
                <h4 className="font-semibold text-gray-800">Intresseavvägning</h4>
                <ul className="mt-2 space-y-1 text-gray-700 text-sm">
                  <li>• För kundservice, kommunikation och ärendehantering</li>
                  <li>• För kvalitetsarbete, statistik och verksamhetsutveckling</li>
                  <li>• För marknadsföring av våra produkter och tjänster</li>
                  <li>• För kundundersökningar och inbjudningar till event</li>
                </ul>
              </div>

              <div className="p-4 border-l-4 border-purple-500 bg-purple-50 rounded-r-lg">
                <h4 className="font-semibold text-gray-800">Samtycke</h4>
                <ul className="mt-2 space-y-1 text-gray-700 text-sm">
                  <li>• Vid viss digital marknadsföring, nyhetsbrev och elektronisk kommunikation</li>
                  <li>• För användning av vissa cookies och liknande tekniker</li>
                </ul>
              </div>
            </div>
          </Section>

          {/* Section: Lagring */}
          <Section title="Lagring av personuppgifter">
            <p>
              Personuppgifter lagras endast så länge det är nödvändigt för att
              uppfylla ändamålen med behandlingen eller så länge som krävs enligt
              lag eller avtal. Lagringstiden baseras på:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>Avtalets giltighetstid</li>
              <li>Tiden för eventuella garanti- eller försäkringsanspråk</li>
              <li>Lagstadgade arkiverings- och preskriptionskrav</li>
            </ul>
            <p className="mt-3">
              När personuppgifter inte längre behövs raderas eller anonymiseras de
              på ett säkert sätt.
            </p>
          </Section>

          {/* Section: Dina rättigheter */}
          <Section title="Dina rättigheter">
            <p className="mb-4">
              Du har rättigheter enligt GDPR och kan när som helst kontakta oss
              för att utöva dem.
            </p>

            <div className="space-y-4">
              {[
                {
                  title: "Rätt att återkalla samtycke och invända",
                  content: "Du har rätt att när som helst återkalla lämnat samtycke. Du har även rätt att invända mot behandling av personuppgifter som sker för direktmarknadsföring eller som baseras på intresseavvägning.",
                  icon: "🔄",
                },
                {
                  title: "Rätt till tillgång",
                  content: "Du har rätt att få information om vilka personuppgifter vi behandlar om dig samt begära ett registerutdrag.",
                  icon: "👁️",
                },
                {
                  title: "Rätt till rättelse",
                  content: "Du har rätt att få felaktiga eller ofullständiga personuppgifter rättade utan onödigt dröjsmål.",
                  icon: "✏️",
                },
                {
                  title: "Rätt till radering och begränsning",
                  content: "Du har rätt att begära radering av dina personuppgifter eller begränsning av behandlingen, i den utsträckning som tillåts enligt lag.",
                  icon: "🗑️",
                },
                {
                  title: "Rätt till dataportabilitet",
                  content: "Om behandlingen baseras på samtycke eller avtal har du rätt att få ut de personuppgifter du själv lämnat i ett strukturerat, allmänt använt och maskinläsbart format.",
                  icon: "📤",
                },
                {
                  title: "Rätt att inge klagomål",
                  content: "Om du anser att vi behandlar dina personuppgifter i strid med gällande lagstiftning har du rätt att lämna klagomål till Integritetsskyddsmyndigheten (IMY), www.imy.se.",
                  icon: "⚖️",
                },
              ].map((right, index) => (
                <div
                  key={index}
                  className="flex gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span className="text-2xl">{right.icon}</span>
                  <div>
                    <h4 className="font-medium text-gray-800">{right.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{right.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Section: Kontakt */}
          <Section title="Personuppgiftsansvarig och kontaktuppgifter">
            <div className="p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl">
              <p className="text-gray-700 mb-4">
                Personuppgiftsansvarig är <strong>{companyName}</strong>, org.nr{" "}
                <strong>{orgNumber}</strong>, som du har ingått avtal med, lämnat
                personuppgifter till eller som har erhållit dina personuppgifter
                från tredje part.
              </p>
              <p className="text-gray-700 mb-4">
                Vid frågor om vår behandling av personuppgifter eller om du vill
                utöva dina rättigheter, vänligen kontakta oss:
              </p>
              <a
                href={`mailto:${email}`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                {email}
              </a>
            </div>
          </Section>

          {/* Footer note */}
          <div className="mt-10 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
            <p>
              Denna integritetspolicy kan komma att uppdateras. Den senaste
              versionen finns alltid tillgänglig via våra digitala kanaler.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPolicy;