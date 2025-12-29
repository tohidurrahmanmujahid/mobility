import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import logo from "@/assets/logo.png";

const Header = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: "SKADEANMÄLAN", path: "/skadeanmalan" },
    { label: "PRODUKTER", path: "/produkter" },
    { label: "KUNDSERVICE", path: "/kundservice" },
    { label: "OM OSS", path: "/om-oss" },
    { label: "ÅTERFÖRSÄLJARE", path: "/aterforssaljare" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-primary/95 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center overflow-hidden p-1">
            <img src={logo} alt="MP" className="w-full h-full object-cover" />
          </div>
          <span className="text-primary-foreground font-bold text-lg">MobilityPartner</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-2 text-white">
          {navItems.map((item) => (
            <Button
              key={item.path}
              asChild
              variant={location.pathname === item.path ? "secondary" : "ghost"}
              className="text-sm"
            >
              <Link to={item.path}>{item.label}</Link>
            </Button>
          ))}
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-primary-foreground"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <nav className="md:hidden bg-primary border-t border-primary-foreground/10">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-2 text-white">
            {navItems.map((item) => (
              <Button
                key={item.path}
                asChild
                variant={location.pathname === item.path ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Link to={item.path}>{item.label}</Link>
              </Button>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
};

export default Header;
