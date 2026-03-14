import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import heroOcean from "@/assets/pictureocean.jpg";

import carGarage from "@/assets/picutrecars.jpg";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const Aterforssaljare = () => {
  const [formData, setFormData] = useState({
    companyName: "",
    orgNumber: "",
    phone: "",
    email: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!formData.companyName || !formData.orgNumber || !formData.phone || !formData.email) {
      toast.error("Vänligen fyll i alla fält");
      return;
    }

    setIsSubmitting(true);

    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const response = await fetch(`${apiBaseUrl}/api/v1/partnership/request`, {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      toast.success("Din ansökan har skickats!");
      console.log('Partnership application successful:', result);

      // Reset form
      setFormData({
        companyName: "",
        orgNumber: "",
        phone: "",
        email: "",
      });
    } catch (error) {
      console.error('Error submitting partnership application:', error);
      toast.error("Ett fel uppstod. Vänligen försök igen.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <div className="space-y-6 max-w-md mx-auto">
            <Link to="https://dealer.mobilitypartner.se" className="flex items-center gap-2">
              <Button size="lg" variant="secondary" className="w-full rounded-full text-xl py-6">
                LOGGA IN
              </Button>
            </Link>

            <Button size="lg"
              onClick={() => scrollToSection('kontakt-form')}
              variant="secondary" className="w-full rounded-full text-xl py-6">
              BLI PARTNER
            </Button>
          </div>
        </div>
      </section>

      {/* Contact Process */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Kontakta oss</h2>

          <div className="max-w-3xl mx-auto mb-12">
            <h3 className="text-2xl font-bold mb-6">Så blir du en av oss</h3>
            <p className="text-muted-foreground mb-8">
              Vill du bli en del av vårt nätverk och erbjuda dina kunder trygghet?
              Så här enkelt är det:
            </p>

            <Card className="p-8 bg-card mb-8">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <Check className="text-primary-foreground" size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold mb-2">Kontakta oss</h4>
                    <p className="text-sm text-muted-foreground">
                      Ring eller fyll i formuläret nedan så hör vi av oss.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <Check className="text-primary-foreground" size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold mb-2">Vi kontaktar dig</h4>
                    <p className="text-sm text-muted-foreground">
                      För genomgång av vilka produkter som passar ert företag.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <Check className="text-primary-foreground" size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold mb-2">Du är snabbt igång</h4>
                    <p className="text-sm text-muted-foreground">
                      Vi finns alltid här för dig, när du behöver hjälp eller har frågor.
                      Du erbjuds även kostnadsfri utbildning samt kontinuerlig support med personlig kontakt.
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <div className="text-center p-8 bg-secondary rounded-lg">
              <p className="text-2xl font-bold mb-2">010 - 189 89 99</p>
            </div>
          </div>
        </div>
      </section>

      {/* Partnership Application Form */}
      <section className="py-16 bg-primary" id="kontakt-form">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div
              className="h-[600px] bg-cover bg-center rounded-lg"
              style={{ backgroundImage: `url(${carGarage})` }}
            ></div>

            <div>
              <h2 className="text-3xl font-bold text-primary-foreground mb-8">
                Ansök om partnerskap
              </h2>

              <form onSubmit={handleSubmit}>
                <Card className="p-8 bg-card">
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="companyName">Företagsnamn</Label>
                      <Input
                        id="companyName"
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        className="rounded-full"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="orgNumber">Organisationsnummer</Label>
                      <Input
                        id="orgNumber"
                        value={formData.orgNumber}
                        onChange={(e) => setFormData({ ...formData, orgNumber: e.target.value })}
                        className="rounded-full"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone">Telefonnummer</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="rounded-full"
                        required
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
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      variant="outline"
                      className="w-full rounded-full bg-primary text-white"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'SKICKAR...' : 'SKICKA ANSÖKAN'}
                    </Button>
                  </div>
                </Card>
              </form>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Aterforssaljare;
