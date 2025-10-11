import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, Wrench } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import heroOcean from "@/assets/pictureocean.jpg";
import heroAotumn from "@/assets/picture4.jpg";
import pictureCars from "@/assets/picturecars.jpg";
import { toast } from "sonner";
import { Checkbox } from "@radix-ui/react-checkbox";
import VerkstadSection from "@/components/VerkstadSection";
import { Link } from "react-router-dom";

const Skadeanmalan = () => {
  const [activeForm, setActiveForm] = useState<"damaged" | "workshop">("damaged");
  const [formData, setFormData] = useState({
    registrationNumber: "",
    mileage: "",
    firstname: "",
    lastname: "",
    phone: "",
    email: "",
    damageDescription: "",
  });

  const [workshopFormData, setWorkshopFormData] = useState({
    vehicleOwner: '',
    registrationNumber: '',
    brand: '',
    model: '',
    workshopName: '',
    organizationNumber: '',
    contactPerson: '',
    phone: '',
    email: '',
    diagnosis: '',
    paintworkNeeded: false,
    windscreenReplacement: false,
    drugsAlcohol: false,
  });

  const processSteps = [
    {
      number: 1,
      title: 'Mobilitypartner kontaktas av fordonsägaren',
      description: 'Fordonsägaren hänvisar till försäkringsbolaget och mobilitypartner ifall försäkringen är giltig. Tillsammans ser vi till att det anmäls en fordonsärende påbörjas.',
    },
    {
      number: 2,
      title: 'Bilen lämnas på verkstad',
      description: 'Mobilitypartnern tar emot bilen eller hämtar den. Vid behov tillhandahåller mobilitypartnern ersättningsfordon.',
    },
    {
      number: 3,
      title: 'Verkstaden gör skadeanmälan till oss',
      description: 'På föreliggande formulär gör verkstaden en skadeanmälan till oss med uppgift om handläggare. Därefter gör verkstaden en diagnos och gör uppskattning av skadan och frågar oss om rätten till reparation och vi meddelar besked direkt.',
    },
    {
      number: 4,
      title: 'Reparationen kan påbörjas',
      description: 'Efter att skadeanmälan är genomförd och godkänd kan verkstaden påbörja reparationen. Detta skapar en snabb process för fordonsägaren.',
    },
  ];




  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Din skadeanmälan har skickats!");
  };

  const handleWorkshopSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Verkstadsanmälan har skickats!");
  };

  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero */}
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
              SKADEANMÄLAN
            </h1>

            <p className="text-lg text-gray-200 mb-12 leading-relaxed">
              Anmäl enkelt din skada direkt till oss. Vi guidar dig genom hela processen – från rapportering till ersättning – så att du snabbt kan komma vidare.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-8">
              {/* For Job Seekers */}
              <div className="space-y-3">
                <Button
                  size="lg"
                  variant="outline"

                  className="bg-white text-slate-900 hover:bg-primary font-semibold px-8 rounded-full"
                >
                  <Link to="/produkter">För verkstad</Link>

                </Button>
              </div>

              {/* For Businesses */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    size="lg"
                    variant="outline"
                    className="bg-white text-slate-900 hover:bg-primary font-semibold px-8 rounded-full"
                  >
                    <Link to="/Skadeanmalan">För bilägare</Link>
                  </Button>

                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* <section
        className="relative min-h-[400px] flex items-center justify-center bg-cover bg-center pt-20"
        style={{ backgroundImage: `url(${heroOcean})` }}
      >
        <div className="absolute inset-0 bg-primary/40"></div>
        <div className="relative z-10">
          <Card className="bg-card p-8 max-w-md">
            <h2 className="text-2xl font-bold text-center mb-6">SKADEANMÄLAN</h2>
            <div className="space-y-4">
              <Button
                variant={activeForm === "damaged" ? "secondary" : "outline"}
                className="w-full rounded-full"
                size="lg"
                onClick={() => setActiveForm("damaged")}
              >
                För verkstad
              </Button>
              <Button
                variant={activeForm === "workshop" ? "secondary" : "outline"}
                className="w-full rounded-full"
                size="lg"
                onClick={() => setActiveForm("workshop")}
              >
                För bilägare
              </Button>
            </div>
          </Card>
        </div>
      </section> */}

      {/* Damaged Car or Workshop */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Har skadan uppstått?<br />Såhär gör du</h2>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
            <Card className="p-8 bg-accent text-accent-foreground">
              <Search className="w-12 h-12 mb-4 mx-auto" />
              <h3 className="text-xl font-bold text-center mb-4">FORDONÄGARE</h3>
            </Card>
            <Card className="p-8 bg-accent text-accent-foreground">
              <Wrench className="w-12 h-12 mb-4 mx-auto" />
              <h3 className="text-xl font-bold text-center mb-4">VERKSTAD</h3>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted bg-cover bg-center" style={{ backgroundImage: `url(${pictureCars})` }}>
        <div className="relative overflow-hidden from-teal-700 to-teal-900 text-white">


          <div className="relative max-w-6xl mx-auto px-6 py-16">
            <h1 className="text-4xl font-bold mb-4">Såhär går skadeprocessen till</h1>
            <p className="text-teal-100 mb-12 max-w-2xl">
              Vi försätter att när skadan är framme så uppstår ett flertal frågetecken, nedan beskriver vi processen kring skadehanteringen hos oss.
            </p>

            <div className="space-y-6">
              {processSteps.map((step) => (
                <Card key={step.number} className="bg-teal-800/90 border-teal-700 text-white backdrop-blur-sm hover:bg-teal-800 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center font-bold text-sm">
                        {step.number}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                        <p className="text-teal-100 text-sm leading-relaxed">{step.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>
      {/* Report Damage Form */}

      <section className="py-16 bg-primary">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-primary-foreground mb-12">Anmäl skadan</h2>

          <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
            <Card className="p-8 bg-card">
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="registrationNumber">Registreringsnummer</Label>
                    <Input
                      id="registrationNumber"
                      value={formData.registrationNumber}
                      onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                      className="rounded-full"
                    />
                  </div>
                  <div>
                    <Label htmlFor="mileage">Miltal</Label>
                    <Input
                      id="mileage"
                      value={formData.mileage}
                      onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                      className="rounded-full"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="firstname">Förnamn</Label>
                    <Input
                      id="firstname"
                      value={formData.firstname}
                      onChange={(e) => setFormData({ ...formData, firstname: e.target.value })}
                      className="rounded-full"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastname">Efternamn</Label>
                    <Input
                      id="lastname"
                      value={formData.lastname}
                      onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
                      className="rounded-full"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="phone">Telefonnummer</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="rounded-full"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">E-post</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="rounded-full"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="damageDescription">Skadebeskrivning</Label>
                  <Textarea
                    id="damageDescription"
                    value={formData.damageDescription}
                    onChange={(e) => setFormData({ ...formData, damageDescription: e.target.value })}
                    rows={6}
                    className="rounded-2xl"
                  />
                </div>

                <Button type="submit" size="lg" variant="secondary" className="w-full rounded-full">
                  SKICKA IN
                </Button>
              </div>
            </Card>
          </form>
        </div>
      </section>





      {/* Workshop Section */}
      <VerkstadSection />
      {/* Workshop Form */}

      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
        {/* Process Steps Section */}


        {/* Damage Report Form Section */}
        <div className="max-w-5xl mx-auto px-6 py-16">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-3xl font-bold text-teal-800 mb-8">Skadeanmälan</h2>

            <div className="space-y-8">
              {/* Vehicle/Damage Information */}
              <div>
                <h3 className="text-xl font-semibold text-teal-700 mb-4 pb-2 border-b-2 border-teal-600">
                  Fordons-/skadeuppgifter
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="vehicleOwner">Bilägare</Label>
                    <Input
                      id="vehicleOwner"
                      value={workshopFormData.vehicleOwner}
                      onChange={(e) => setWorkshopFormData({ ...workshopFormData, vehicleOwner: e.target.value })}
                      placeholder="Namn på bilägare"
                    />
                  </div>
                  <div>
                    <Label htmlFor="registrationNumber">Registreringsnummer</Label>
                    <Input
                      id="registrationNumber"
                      value={formData.registrationNumber}
                      onChange={(e) => setWorkshopFormData({ ...workshopFormData, registrationNumber: e.target.value })}
                      placeholder="ABC123"
                    />
                  </div>
                  <div>
                    <Label htmlFor="brand">Märke</Label>
                    <Input
                      id="brand"
                      value={workshopFormData.brand}
                      onChange={(e) => setWorkshopFormData({ ...workshopFormData, brand: e.target.value })}
                      placeholder="Bilmärke"
                    />
                  </div>
                  <div>
                    <Label htmlFor="model">Modell</Label>
                    <Input
                      id="model"
                      value={workshopFormData.model}
                      onChange={(e) => setWorkshopFormData({ ...workshopFormData, model: e.target.value })}
                      placeholder="Modell"
                    />
                  </div>
                </div>
              </div>

              {/* Workshop Information */}
              <div>
                <h3 className="text-xl font-semibold text-teal-700 mb-4 pb-2 border-b-2 border-teal-600">
                  Verkstadens uppgifter
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="workshopName">Verkstadsnamn</Label>
                    <Input
                      id="workshopName"
                      value={workshopFormData.workshopName}
                      onChange={(e) => setWorkshopFormData({ ...workshopFormData, workshopName: e.target.value })}
                      placeholder="Namn på verkstad"
                    />
                  </div>
                  <div>
                    <Label htmlFor="organizationNumber">Organisationsnummer</Label>
                    <Input
                      id="organizationNumber"
                      value={workshopFormData.organizationNumber}
                      onChange={(e) => setWorkshopFormData({ ...workshopFormData, organizationNumber: e.target.value })}
                      placeholder="XXXXXX-XXXX"
                    />
                  </div>
                </div>
              </div>

              {/* Workshop Contact Person */}
              <div>
                <h3 className="text-xl font-semibold text-teal-700 mb-4 pb-2 border-b-2 border-teal-600">
                  Verkstadens kontaktperson
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label htmlFor="contactPerson">Handläggare</Label>
                    <Input
                      id="contactPerson"
                      value={workshopFormData.contactPerson}
                      onChange={(e) => setWorkshopFormData({ ...workshopFormData, contactPerson: e.target.value })}
                      placeholder="Namn"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Telefon</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+46 XX XXX XX XX"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="exempel@email.se"
                    />
                  </div>
                </div>
              </div>

              {/* Workshop Diagnosis */}
              <div>
                <h3 className="text-xl font-semibold text-teal-700 mb-4 pb-2 border-b-2 border-teal-600">
                  Verkstadsdiagnos
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="diagnosis">Beskriv skadan</Label>
                    <Textarea
                      id="diagnosis"
                      value={workshopFormData.diagnosis}
                      onChange={(e) => setWorkshopFormData({ ...workshopFormData, diagnosis: e.target.value })}
                      placeholder="Beskriv skadan detaljerat..."
                      rows={4}
                      className="resize-none"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Bifoga gärna bilder och dokument till skadeanmälan (tumregel är minst 5 bilder).
                    </p>
                  </div>

                  <div className="space-y-3 pt-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="paintwork"
                        checked={workshopFormData.paintworkNeeded}
                        onCheckedChange={(checked) =>
                          setWorkshopFormData({ ...workshopFormData, paintworkNeeded: checked as boolean })
                        }
                      />
                      <label
                        htmlFor="paintwork"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Krävs lackarbete?
                      </label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="windscreen"
                        checked={workshopFormData.windscreenReplacement}
                        onCheckedChange={(checked) =>
                          setWorkshopFormData({ ...workshopFormData, windscreenReplacement: checked as boolean })
                        }
                      />
                      <label
                        htmlFor="windscreen"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Behövs rutbyte eller är detta redan utfört?
                      </label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="drugs"
                        checked={workshopFormData.drugsAlcohol}
                        onCheckedChange={(checked) =>
                          setWorkshopFormData({ ...workshopFormData, drugsAlcohol: checked as boolean })
                        }
                      />
                      <label
                        htmlFor="drugs"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Har förare, ert vetande, varit påverkad av alkohol/droger/läkemedel vid skadetillfället?
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4 pt-4">
                <Button onClick={handleSubmit} className="bg-teal-600 hover:bg-teal-700">
                  Skicka anmälan
                </Button>
                <Button type="button" variant="outline" className="border-teal-600 text-teal-600 hover:bg-teal-50">
                  Spara utkast
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Skadeanmalan;
