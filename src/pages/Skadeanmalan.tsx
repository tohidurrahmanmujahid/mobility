import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, Wrench, ChevronDown } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import heroOcean from "@/assets/pictureocean.jpg";
import heroAotumn from "@/assets/picture4.jpg";
import pictureCars from "@/assets/picturecars.jpg";
import { toast } from "sonner";
import { Checkbox } from "@radix-ui/react-checkbox";
import VerkstadSection from "@/components/VerkstadSection";
import VehicleDamageForm from "@/components/VehicleDamageForm";

const Skadeanmalan = () => {
  const [activeForm, setActiveForm] = useState<"damaged" | "workshop">("damaged");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    registrationNumber: "",
    mileage: "",
    firstname: "",
    lastname: "",
    phone: "",
    email: "",
    personnummer: "",
    address: "",
    postnummer: "",
    ort: "",
    skadedatum: "",
    damageDescription: "",
    meterReadingImage: null as File | null,
    descriptionFiles: [] as File[],
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
      description: 'Innan fordonet lämnas in på verkstad ska du först kontakta oss och registrera din skada. Det är viktigt att du inväntar vårt besked innan verkstadsbesöket påbörjas.',
    },
    {
      number: 2,
      title: 'Bilen lämnas på verkstad',
      description: 'Mobilitypartner hänvisar fordonsägaren till en verkstad. Där du bokar in din bil för felsökning.',
    },
    {
      number: 3,
      title: 'Verkstaden gör skadeanmälan till oss',
      description: 'När verkstaden har identifierat skadan och dess orsak, skickar de in en skadeanmälan till Mobilitypartner. Därefter görs bedömningen av Gjensidige Försäkringar och reparationen kan påbörjas när skadan eller felet godkänts. Detta är alltid en snabb process. Vid godkännande av reperation ersätter vi även kostnaden för felsökning.',
    },
    {
      number: 4,
      title: 'Reparationen kan påbörjas',
      description: 'När skadeanmälan har godkänts kan reparationen av ditt fordon påbörjas. Verkstaden återkopplar när arbetet är genomfört.',
    },
  ];




  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all required fields
    const missingFields: string[] = [];

    if (!formData.personnummer.trim()) missingFields.push("Personnummer");
    if (!formData.firstname.trim()) missingFields.push("Förnamn");
    if (!formData.lastname.trim()) missingFields.push("Efternamn");
    if (!formData.phone.trim()) missingFields.push("Telefonnummer");
    if (!formData.email.trim()) missingFields.push("E-post");
    if (!formData.registrationNumber.trim()) missingFields.push("Registreringsnummer");
    if (!formData.skadedatum.trim()) missingFields.push("Skadedatum");
    if (!formData.address.trim()) missingFields.push("Adress");
    if (!formData.postnummer.trim()) missingFields.push("Postnummer");
    if (!formData.ort.trim()) missingFields.push("Ort");
    if (!formData.damageDescription.trim()) missingFields.push("Beskrivning av skadan");
    if (!formData.meterReadingImage) missingFields.push("Mätarställning (bild)");
    if (formData.descriptionFiles.length === 0) missingFields.push("Skadebeskrivning (fil)");

    if (missingFields.length > 0) {
      toast.error(`Vänligen fyll i följande fält: ${missingFields.join(", ")}`);
      return;
    }

    setIsSubmitting(true);

    try {
      // Create FormData for multipart/form-data
      const formDataToSend = new FormData();

      // Append all text fields
      formDataToSend.append('registrationNumber', formData.registrationNumber);
      formDataToSend.append('mileage', formData.mileage);
      formDataToSend.append('firstname', formData.firstname);
      formDataToSend.append('lastname', formData.lastname);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('personnummer', formData.personnummer);
      formDataToSend.append('address', formData.address);
      formDataToSend.append('postnummer', formData.postnummer);
      formDataToSend.append('ort', formData.ort);
      formDataToSend.append('skadedatum', formData.skadedatum);
      formDataToSend.append('damageDescription', formData.damageDescription);
      formDataToSend.append('submittedAt', new Date().toISOString());

      // Append required meter reading image
      if (formData.meterReadingImage) {
        formDataToSend.append('meterReadingImage', formData.meterReadingImage);
      }

      // Append optional description files
      if (formData.descriptionFiles.length > 0) {
        formData.descriptionFiles.forEach((file, index) => {
          formDataToSend.append(`descriptionFiles`, file);
        });
      }

      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const response = await fetch(`${apiBaseUrl}/api/warranties/submit-claim`, {
        method: 'POST',
        body: formDataToSend,
        // Note: Don't set Content-Type header - browser will set it automatically with boundary
      });

      const result = await response.json();

      if (!response.ok) {
        // Display error message from API response
        const errorMessage = result.message || result.error || `HTTP error! status: ${response.status}`;
        toast.error(errorMessage);
        console.error('API error:', result);
        return;
      }

      toast.success("Din skadeanmälan har skickats!");
      console.log('Submission successful:', result);

      // Reset form
      setFormData({
        registrationNumber: "",
        mileage: "",
        firstname: "",
        lastname: "",
        phone: "",
        email: "",
        personnummer: "",
        address: "",
        postnummer: "",
        ort: "",
        skadedatum: "",
        damageDescription: "",
        meterReadingImage: null,
        descriptionFiles: [],
      });

      // Reset file inputs
      const meterReadingInput = document.getElementById('meterReadingImage') as HTMLInputElement;
      const descriptionFilesInput = document.getElementById('descriptionFiles') as HTMLInputElement;
      if (meterReadingInput) meterReadingInput.value = '';
      if (descriptionFilesInput) descriptionFilesInput.value = '';

    } catch (error: any) {
      console.error('Error submitting claim:', error);
      const errorMessage = error?.message || "Ett fel uppstod vid skickning av skadeanmälan. Vänligen försök igen.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWorkshopSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Verkstadsanmälan har skickats!");
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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
              {/* For Workshop */}
              <div className="space-y-3">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => scrollToSection('verkstad-section')}
                  className="bg-white text-slate-900 hover:bg-primary font-semibold px-8 rounded-full"
                >
                  För verkstad
                </Button>
              </div>

              {/* For Car Owner */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => scrollToSection('damage-process-section')}
                    className="bg-white text-slate-900 hover:bg-primary font-semibold px-8 rounded-full"
                  >
                    För bilägare
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

      <section id="damage-process-section" className="py-16 bg-muted bg-cover bg-center min-h-[800px]" style={{ backgroundImage: `url(${pictureCars})` }}>
        <div className="relative overflow-hidden from-teal-700 to-teal-900 text-white">


          <div className="relative max-w-6xl mx-auto px-6 py-16">
            <h1 className="text-4xl font-bold mb-4">Såhär går skadeprocessen till</h1>
            <p className="text-teal-100 mb-12 max-w-2xl">
              Vi förstår att när skadan är framme så uppstår ett flertal frågetecken, nedan beskriver vi processen kring skadehanteringen hos oss.
            </p>

            <div className="space-y-6">
              {processSteps.map((step) => (
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
                          <h3 className="text-xl font-semibold">{step.title}</h3>
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
                            <p className="text-teal-100 text-sm leading-relaxed mt-2">{step.description}</p>
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
      {/* Report Damage Form */}

      <section className="py-16 bg-primary">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-primary-foreground mb-12">Anmäl skadan</h2>

          <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
            <Card className="p-8 bg-card">
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="personnummer">Personnummer</Label>
                    <Input
                      id="personnummer"
                      value={formData.personnummer}
                      onChange={(e) => setFormData({ ...formData, personnummer: e.target.value })}
                      className="rounded-full"
                      placeholder="ÅÅÅÅMMDD-XXXX"
                    />
                  </div>
                  {/* <div>
                    <Label htmlFor="mileage">Miltal</Label>
                    <Input
                      id="mileage"
                      value={formData.mileage}
                      onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                      className="rounded-full"
                    />
                  </div> */}
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
                    <Label htmlFor="skadedatum">Skadedatum</Label>
                    <Input
                      id="skadedatum"
                      type="date"
                      value={formData.skadedatum}
                      onChange={(e) => setFormData({ ...formData, skadedatum: e.target.value })}
                      className="rounded-full"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">Adress</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="rounded-full"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="postnummer">Postnummer</Label>
                    <Input
                      id="postnummer"
                      value={formData.postnummer}
                      onChange={(e) => setFormData({ ...formData, postnummer: e.target.value })}
                      className="rounded-full"
                      placeholder="123 45"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ort">Ort</Label>
                    <Input
                      id="ort"
                      value={formData.ort}
                      onChange={(e) => setFormData({ ...formData, ort: e.target.value })}
                      className="rounded-full"
                    />
                  </div>
                </div>

                {/* <div>
                  <Label htmlFor="damageDescription">Skadebeskrivning</Label>
                  <Textarea
                    id="damageDescription"
                    value={formData.damageDescription}
                    onChange={(e) => setFormData({ ...formData, damageDescription: e.target.value })}
                    rows={6}
                    className="rounded-2xl"
                  />
                </div> */}

                <div>
                  <Label htmlFor="meterReadingImage" className="text-base font-semibold">
                    Mätarställning vid skadedatum
                  </Label>
                  <p className="text-sm text-muted-foreground mb-2">Bifogad bild krävs</p>
                  <Input
                    id="meterReadingImage"
                    type="file"
                    accept="image/*"
                    required
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setFormData({ ...formData, meterReadingImage: file });
                    }}
                    className="rounded-full"
                  />
                  {formData.meterReadingImage && (
                    <p className="text-sm text-green-600 mt-2">
                      Vald fil: {formData.meterReadingImage.name}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="descriptionFiles" className="text-base font-semibold">
                    Beskrivning av skadan
                  </Label>
                  <Textarea
                    id="damageDescription"
                    value={formData.damageDescription}
                    onChange={(e) => setFormData({ ...formData, damageDescription: e.target.value })}
                    rows={4}
                    placeholder="Beskriv skadan i detalj..."
                    className="rounded-2xl mb-4"
                  />
                  <p className="text-sm text-muted-foreground mb-2">Du kan bifoga flera filer (minst en fil krävs)</p>
                  <Input
                    id="descriptionFiles"
                    type="file"
                    accept="image/*,application/pdf,.doc,.docx"
                    multiple
                    onChange={(e) => {
                      const files = e.target.files ? Array.from(e.target.files) : [];
                      setFormData({ ...formData, descriptionFiles: [...formData.descriptionFiles, ...files] });
                      // Reset the input so the same file can be added again if needed
                      e.target.value = '';
                    }}
                    className="rounded-full"
                  />
                  {formData.descriptionFiles.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm text-green-600 font-semibold">
                        {formData.descriptionFiles.length} fil(er) valda:
                      </p>
                      <ul className="text-sm text-muted-foreground space-y-1 mt-1">
                        {formData.descriptionFiles.map((file, index) => (
                          <li key={index} className="flex items-center justify-between bg-gray-100 px-3 py-1 rounded-full">
                            <span className="truncate mr-2">{file.name}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const newFiles = formData.descriptionFiles.filter((_, i) => i !== index);
                                setFormData({ ...formData, descriptionFiles: newFiles });
                              }}
                              className="text-red-500 hover:text-red-700 font-bold text-sm px-2"
                            >
                              ✕
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {formData.descriptionFiles.length === 0 && (
                    <p className="text-sm text-red-500 mt-1">Minst en fil krävs</p>
                  )}
                </div>

                <Button
                  type="submit"
                  size="lg"
                  variant="secondary"
                  className="bg-primary text-white w-half rounded-full hover:bg-[#4ab7a7] mx-auto block"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'SKICKAR...' : 'SKICKA IN'}
                </Button>
              </div>
            </Card>
          </form>
        </div>
      </section>





      {/* Workshop Section */}
      <div id="verkstad-section">
        <VerkstadSection />
      </div>
      {/* Workshop Form */}

      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
        {/* Process Steps Section */}


        {/* Damage Report Form Section */}

        <VehicleDamageForm />
      </div>
      <Footer />
    </div>
  );
};

export default Skadeanmalan;
