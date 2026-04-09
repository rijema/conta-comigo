"use client";

import { useState } from "react";
import { useSensoryProfile } from "@/hooks/use-sensory-profile";

export function SensoryControls() {
  const [isOpen, setIsOpen] = useState(false);
  const { profile, updateProfile } = useSensoryProfile();

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors 
                   focus:ring-2 focus:ring-blue-300"
        aria-label="Configurações de acessibilidade"
        aria-expanded={isOpen}
      >
        ⚙️
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-10 bg-white rounded-xl shadow-xl border p-4 w-72 z-50"
          role="dialog"
          aria-label="Configurações sensoriais"
        >
          <h3 className="font-semibold text-gray-800 mb-4">
            Personalização Visual
          </h3>

          {/* Low Stimulation Mode */}
          <div className="flex items-center justify-between mb-4">
            <label className="text-sm text-gray-600">
              Modo baixa estimulação
            </label>
            <button
              onClick={() =>
                updateProfile({
                  lowStimulationMode: !profile.lowStimulationMode,
                })
              }
              className={`w-12 h-6 rounded-full transition-colors ${
                profile.lowStimulationMode ? "bg-blue-500" : "bg-gray-300"
              }`}
              role="switch"
              aria-checked={profile.lowStimulationMode}
            >
              <span
                className={`block w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${
                  profile.lowStimulationMode ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Font size */}
          <div className="mb-4">
            <label className="text-sm text-gray-600 block mb-2">
              Tamanho do texto
            </label>
            <div className="flex gap-2">
              {(["small", "medium", "large"] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => updateProfile({ fontSize: size })}
                  className={`flex-1 py-1 rounded border text-xs ${
                    profile.fontSize === size
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 text-gray-600"
                  }`}
                  aria-pressed={profile.fontSize === size}
                >
                  {size === "small" ? "A" : size === "medium" ? "A+" : "A++"}
                </button>
              ))}
            </div>
          </div>

          {/* High contrast */}
          <div className="flex items-center justify-between mb-4">
            <label className="text-sm text-gray-600">Alto contraste</label>
            <button
              onClick={() =>
                updateProfile({ highContrast: !profile.highContrast })
              }
              className={`w-12 h-6 rounded-full transition-colors ${
                profile.highContrast ? "bg-blue-500" : "bg-gray-300"
              }`}
              role="switch"
              aria-checked={profile.highContrast}
            >
              <span
                className={`block w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${
                  profile.highContrast ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Background color */}
          <div>
            <label className="text-sm text-gray-600 block mb-2">
              Cor de fundo
            </label>
            <div className="flex gap-2">
              {["#ffffff", "#fef9c3", "#dbeafe", "#f0fdf4"].map((color) => (
                <button
                  key={color}
                  onClick={() => updateProfile({ backgroundColor: color })}
                  className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                    profile.backgroundColor === color
                      ? "border-blue-500 scale-110"
                      : "border-gray-200"
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={`Cor de fundo ${color}`}
                  aria-pressed={profile.backgroundColor === color}
                />
              ))}
            </div>
          </div>

          <button
            onClick={() => setIsOpen(false)}
            className="w-full mt-4 py-2 text-sm text-gray-500 hover:text-gray-700"
          >
            Fechar
          </button>
        </div>
      )}
    </div>
  );
}