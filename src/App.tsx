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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/skadeanmalan" element={<Skadeanmalan />} />
          <Route path="/produkter" element={<Produkter />} />
          <Route path="/kundservice" element={<Kundservice />} />
          <Route path="/om-oss" element={<OmOss />} />
          <Route path="/aterforssaljare" element={<Aterforssaljare />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
