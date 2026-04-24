import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Skadeanmalan from "./pages/Skadeanmalan";
import Produkter from "./pages/Produkter";
import Kundservice from "./pages/Kundservice";
import OmOss from "./pages/OmOss";
import Aterforssaljare from "./pages/Aterforssaljare";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Undantag from "./pages/Undantag";
import AdminLogin from "./pages/AdminLogin";
import { AdminProvider } from "./context/AdminContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AdminProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/skadeanmalan" element={<Skadeanmalan />} />
            <Route path="/produkter" element={<Produkter />} />
            <Route path="/kundservice" element={<Kundservice />} />
            <Route path="/om-oss" element={<OmOss />} />
            <Route path="/aterforssaljare" element={<Aterforssaljare />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/undantag" element={<Undantag />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AdminProvider>
  </QueryClientProvider>
);

export default App;
