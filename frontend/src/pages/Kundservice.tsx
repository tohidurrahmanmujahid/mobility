import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Phone, QrCode } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import heroOcean from "@/assets/pictureocean.jpg";
import EditableText from "@/components/EditableText";

const Kundservice = () => {
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
            FRÅGOR?
          </h1>
          <Button size="lg" variant="secondary" className="rounded-full text-2xl py-8 px-12">
            010 - 189 89 99
          </Button>
        </div>
      </section>

      {/* App Download Section */}
      <section className="py-16 bg-accent">
        <div className="container mx-auto px-4">
          <Card className="max-w-4xl mx-auto p-12 bg-card">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <EditableText
                  fieldKey="page.kundservice.app.title"
                  defaultValue="Ladda ner vår app"
                  tag="h2"
                  multiline={false}
                  className="text-3xl font-bold mb-4"
                />
                <EditableText
                  fieldKey="page.kundservice.app.description"
                  defaultValue="Få tillgång till ditt bilägande i vår applikation"
                  tag="p"
                  multiline={false}
                  className="text-lg mb-4"
                />
                <EditableText
                  fieldKey="page.kundservice.app.subtitle"
                  defaultValue="Tillgänglig både till iOS och Android"
                  tag="p"
                  multiline={false}
                  className="text-muted-foreground"
                />
              </div>
              <div className="flex justify-center">
                <div className="w-48 h-48 bg-primary rounded-3xl flex items-center justify-center">
                  <QrCode size={120} className="text-primary-foreground" />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Kundservice;
