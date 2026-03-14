import { Phone, Mail } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-background border-t border-border py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">MP</span>
              </div>
              <span className="text-foreground font-bold">MobilityPartner</span>
            </div>
          </div>

          {/* Connect With Us */}
          <div>
            <h3 className="font-bold text-foreground mb-4">FÖLJ OSS</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Instagram</li>
              <li>TikTok</li>
              <li>LinkedIn</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-foreground mb-4">KONTAKT</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Mobilitypartner Norden AB</p>
              <p>Trollhättevägen 20</p>
              <p>442 34 Kungälv</p>
              <p>Göteborg</p>
            </div>
          </div>

          {/* Org Number & Contact */}
          <div>
            <h3 className="font-bold text-foreground mb-4">ORG.NUMMER</h3>
            <p className="text-sm text-muted-foreground mb-4">559541-2312</p>
            
            <div className="flex items-center gap-2 text-sm text-foreground mb-2">
              <Phone size={16} />
              <span className="font-semibold">010-189 89 99</span>
            </div>
            <p className="text-xs text-muted-foreground mb-4">Mån - tre 10.00 -16.00</p>
            
            <div className="flex items-center gap-2 text-sm text-foreground">
              <Mail size={16} />
              <span>support@mobilitypartner.se</span>
            </div>

            <Link to="/privacy-policy" className="text-sm text-muted-foreground hover:text-foreground mt-4 block">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
