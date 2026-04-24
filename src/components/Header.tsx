import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, ShieldCheck, LogOut } from "lucide-react";
import { useState } from "react";
import logo from "@/assets/logo.png";
import { useAdmin } from "@/context/AdminContext";

const Header = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAdminMode, logout } = useAdmin();

  const navItems = [
    { label: "SKADEANMÄLAN", path: "/skadeanmalan" },
    { label: "PRODUKTER", path: "/produkter" },
    { label: "KUNDSERVICE", path: "/kundservice" },
    { label: "OM OSS", path: "/om-oss" },
    { label: "ÅTERFÖRSÄLJARE", path: "/aterforssaljare" },
  ];

  return (
    <>
      {/* Admin Mode Banner */}
      {isAdminMode && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-blue-600 text-white flex items-center justify-between px-4 py-2 text-sm shadow-lg">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} />
            <span className="font-semibold">Admin Edit Mode Active</span>
            <span className="text-blue-200 hidden sm:inline">— hover over any text to edit it</span>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 transition-colors px-3 py-1 rounded-full text-xs font-semibold"
          >
            <LogOut size={13} />
            Exit Admin
          </button>
        </div>
      )}

      <header
        className={`fixed left-0 right-0 z-50 bg-primary/95 backdrop-blur-sm transition-all ${
          isAdminMode ? "top-[36px]" : "top-0"
        }`}
      >
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
    </>
  );
};

export default Header;
