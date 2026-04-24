import { Phone, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import EditableText from "@/components/EditableText";

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
            <div className="space-y-1 text-sm text-muted-foreground">
              <EditableText
                fieldKey="page.footer.contact.company"
                defaultValue="Mobilitypartner Norden AB"
                tag="p"
                multiline={false}
                className="text-sm text-muted-foreground"
              />
              <EditableText
                fieldKey="page.footer.contact.address1"
                defaultValue="Trollhättevägen 20"
                tag="p"
                multiline={false}
                className="text-sm text-muted-foreground"
              />
              <EditableText
                fieldKey="page.footer.contact.address2"
                defaultValue="442 34 Kungälv"
                tag="p"
                multiline={false}
                className="text-sm text-muted-foreground"
              />
            </div>
          </div>

          {/* Org Number & Contact */}
          <div>
            <h3 className="font-bold text-foreground mb-4">ORG.NUMMER</h3>
            <EditableText
              fieldKey="page.footer.org.number"
              defaultValue="559541-2312"
              tag="p"
              multiline={false}
              className="text-sm text-muted-foreground mb-4"
            />

            <div className="flex items-center gap-2 text-sm text-foreground mb-2">
              <Phone size={16} />
              <EditableText
                fieldKey="page.footer.org.phone"
                defaultValue="010-189 89 99"
                tag="span"
                multiline={false}
                className="font-semibold"
              />
            </div>
            <EditableText
              fieldKey="page.footer.org.hours"
              defaultValue="Mån - tre 10.00 -16.00"
              tag="p"
              multiline={false}
              className="text-xs text-muted-foreground mb-4"
            />

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
