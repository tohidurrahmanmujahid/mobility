import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import heroOcean from "@/assets/pictureocean.jpg";
import carAutumn from "@/assets/car-autumn.jpg";
import carRoad from "@/assets/car-road.jpg";

interface Product {
  id: string;
  name: string;
  durationMonths: number;
  premium: number;
  vehicleType: string;
  maxAge: number;
  maxKm: number;
  maxHk: number;
  pdfUrl: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  count: number;
  products: Product[];
}

const Produkter = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';

  useEffect(() => {
    const fetchWarranties = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${apiBaseUrl}/api/v1/products`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: ApiResponse = await response.json();

        if (data.success && data.products) {
          setProducts(data.products);
          setError(null);
        } else {
          throw new Error('Invalid API response');
        }
      } catch (error) {
        console.error('Error fetching warranties:', error);
        setError('Kunde inte ladda garantier. Vänligen försök igen senare.');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchWarranties();
  }, []);

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
            Våra garantier
          </h1>
          <p className="text-lg text-primary-foreground max-w-3xl mx-auto">
            Trygghet även när bilen är begagnad
          </p>
        </div>
      </section>

      {/* Guarantee Explanation */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <p className="text-center max-w-4xl mx-auto text-muted-foreground mb-12">
            Vid köp av en begagnad bil kan oväntade kostnader för reparationer ställa till med problem. Med en 
            begagnatgaranti säkerställer du att du och kund tillsammans kan vara trygga av kostnaderna och försäkringsskydd. Garantin omfattar 
            plötsliga och oförutsedda fel på både mekaniska och elektriska komponenter och bidrar därmed till att minimera 
            kostnaden för oförutsedda reparationer.
          </p>
        </div>
      </section>

      {/* Investment Message with Image */}
      <section className="py-16 bg-muted">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 items-center max-w-6xl mx-auto">
            <div 
              className="h-96 bg-cover bg-center rounded-lg"
              style={{ backgroundImage: `url(${carAutumn})` }}
            ></div>
            <Card className="p-8 bg-card">
              <p className="text-lg">
                <strong>En begagnatgaranti är en investering i både tryggheten och långsiktig hållbarhet,</strong> för ett 
                bilägande som är lika bekymmersfritt som ansvarsfullt.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Warranty Tiers */}
      <section className="py-16 bg-primary">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-primary-foreground mb-4">
            Garantier för personbilar
          </h2>
          <p className="text-center text-primary-foreground mb-12">
            Hos oss kan du teckna garantier på bilar upp till 20 år gamla eller med en mätarställning på upp till 30 000km.
            Läs mer om våra produkter nedan, du kan även ladda ner produktinformationen för respektive garanti.
          </p>

          {error && (
            <div className="max-w-6xl mx-auto mb-6">
              <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded">
                {error}
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center min-h-[400px]">
              <div className="text-primary-foreground text-lg">
                Laddar garantier...
              </div>
            </div>
          ) : products.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {products.map((product) => (
                <Card key={product.id} className="p-6 bg-card">
                  <h3 className="text-2xl font-bold mb-4">{product.name}</h3>
                  <ul className="space-y-2 mb-6 text-sm">
                    <li>Varaktighet: {product.durationMonths} månader</li>
                    <li>Premie: SEK {product.premium.toLocaleString('sv-SE')}</li>
                    <li>Fordonstyp: {product.vehicleType}</li>
                    <li>Max ålder: {product.maxAge} år</li>
                    <li>Max km: {product.maxKm.toLocaleString('sv-SE')} km</li>
                    {product.maxHk > 0 && <li>Max hästkrafter: {product.maxHk} hk</li>}
                  </ul>
                  {product.pdfUrl ? (
                    <Button
                      variant="secondary"
                      className="w-full rounded-full"
                      onClick={() => window.open(apiBaseUrl + product.pdfUrl, '_blank')}
                    >
                      <Download className="mr-2" size={16} />
                      PDF
                      <span className="text-xs ml-1">Ladda ner produktblad</span>
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      className="w-full rounded-full"
                      disabled
                    >
                      <Download className="mr-2" size={16} />
                      PDF ej tillgänglig
                    </Button>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex justify-center items-center min-h-[400px]">
              <div className="text-primary-foreground text-lg">
                Inga garantier tillgängliga för närvarande.
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Activation Notice */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto flex gap-8 items-start">
            <div 
              className="w-48 h-48 bg-cover bg-center rounded-lg flex-shrink-0"
              style={{ backgroundImage: `url(${carRoad})` }}
            ></div>
            <div>
              <p className="mb-4">
                <strong>Tecknande av garanti görs hos bilhandlaren vid köp av fordon.</strong> Garantibeviset skickas till dig vid köpet. 
                Därför är det viktigt att bilhandlaren har rätt kontaktuppgifter till dig.
              </p>
              <p>
                Har du frågor är det bara att höra av dig till antingen bilhandlaren eller oss.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Produkter;
