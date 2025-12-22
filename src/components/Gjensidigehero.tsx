import React from "react";
import ocean from "@/assets/picocean2.jpg";
import gjensidigehero  from "@/assets/gjensidige-dark.png";

interface GjensidigeHeroProps {
  backgroundImage?: string;
  logoImage?: string;
  title?: string;
  description?: string;
}

const GjensidigeHero: React.FC<GjensidigeHeroProps> = ({
  backgroundImage = ocean,
  logoImage = gjensidigehero,
  title = "Gjensidige",
  description = "Tillsammans med ett av nordens största försäkringsbolag hjälper vi nu svenska folket att köra tryggare - med en helt ny begagnatgaranti.",
}) => {
  return (
    <section className="relative w-full min-h-[400px] md:min-h-[500px] overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        {/* Fallback gradient if no image */}
        <div className="absolute inset-0 bg-primary/40" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 flex items-center justify-evenly h-full min-h-[400px] md:min-h-[500px] px-6 md:px-12 lg:px-20 py-12">
        {/* Left Card */}
        <div className="bg-[#C9C4B5]/90 backdrop-blur-sm rounded-2xl p-6 md:p-8 max-w-lg shadow-lg">
          <h2 className="text-2xl md:text-3xl font-semibold text-white mb-4">
            {title}
          </h2>
          <p className="text-base md:text-lg text-white leading-relaxed">
            {description}
          </p>
        </div>

        {/* Right Logo/Image */}
        <div className="hidden md:flex items-center justify-center">
          <div className="bg-white rounded-lg p-4 shadow-md">
            <img
              src={logoImage}
              alt="Gjensidige Försäkring"
              className="h-20 md:h-24 w-auto object-contain"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default GjensidigeHero;