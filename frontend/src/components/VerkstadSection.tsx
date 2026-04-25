import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

const VerkstadSection = () => {
  const requirements = [
    'En utförlig beskrivning av hur skadan påverkar komponentens funktion.',
    'Uppgift om den konstaterade orsaken till skadan',
    'Relevanta underlag som styrker skadan, exempelvis bilder eller felkodsprotokoll.',
    'Specificerade delnummer, priser samt arbetstid enligt fabrikens anvisningar eller Autodata.',
  ];

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background with overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('data:image/svg+xml,%3Csvg width="1200" height="800" xmlns="http://www.w3.org/2000/svg"%3E%3Cdefs%3E%3ClinearGradient id="grad1" x1="0%25" y1="0%25" x2="0%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:rgb(210,180,160);stop-opacity:1" /%3E%3Cstop offset="50%25" style="stop-color:rgb(160,140,120);stop-opacity:1" /%3E%3Cstop offset="100%25" style="stop-color:rgb(40,80,90);stop-opacity:1" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="1200" height="800" fill="url(%23grad1)" /%3E%3C/svg%3E')`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-amber-100/30 via-teal-100/20 to-teal-900/40"></div>
      </div>

      {/* Content Container */}
      <div className="relative z-10 max-w-3xl mx-auto px-6 py-16">
        {/* Header */}
        <h1 className="text-5xl font-bold text-white text-center mb-12 drop-shadow-lg">
          Verkstad
        </h1>

        {/* Information Card */}
        <Card className="bg-teal-800/95 border-none shadow-2xl backdrop-blur-sm">
          <CardContent className="p-8 md:p-10">
            <h2 className="text-2xl font-bold text-white mb-6 leading-tight">
              Viktigt när ni som verkstad ska skicka in skadekalkyl!
            </h2>
            
            <p className="text-teal-50 mb-8 leading-relaxed text-base">
              För att vi ska kunna behandla och godkänna en skada behöver följande uppgifter alltid bifogas:
            </p>

            <ul className="space-y-4">
              {requirements.map((requirement, index) => (
                <li key={index} className="flex items-start gap-3 text-teal-50">
                  <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-teal-300 mt-2"></span>
                  <span className="leading-relaxed text-base">{requirement}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-teal-900/50 to-transparent pointer-events-none"></div>
    </div>
  );
};

export default VerkstadSection;