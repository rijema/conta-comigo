import { useTranslations } from "next-intl";
import { useAccessibilityStore } from "@/store/accessibility.store";
import { Settings } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Switch from "@radix-ui/react-switch";

interface ToggleRowProps {
  label: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  id: string;
}

function ToggleRow({ label, checked, onCheckedChange, id }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-calm-200 last:border-0">
      <label
        htmlFor={id}
        className="text-sm font-medium text-calm-700 cursor-pointer"
      >
        {label}
      </label>
      <Switch.Root
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full transition-colors
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500
          ${checked ? "bg-primary-500" : "bg-calm-300"}
        `}
        aria-label={label}
      >
        <Switch.Thumb
          className={`
            pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0
            transition-transform duration-200
            ${checked ? "translate-x-5" : "translate-x-0.5"}
          `}
        />
      </Switch.Root>
    </div>
  );
}

export function AccessibilityPanel() {
  const t = useTranslations("accessibility");
  const store = useAccessibilityStore();

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button
          className="
            p-2 rounded-full hover:bg-calm-100 transition-colors
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500
            min-w-[44px] min-h-[44px] flex items-center justify-center
          "
          aria-label="Accessibility settings"
        >
          <Settings className="w-5 h-5 text-calm-600" aria-hidden="true" />
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40 animate-fade-in" />
        <Dialog.Content
          className="
            fixed right-4 top-16 z-50 w-80 bg-white rounded-2xl shadow-xl
            p-6 animate-slide-up focus:outline-none
          "
          aria-describedby="accessibility-desc"
        >
          <Dialog.Title className="text-lg font-display font-bold text-calm-900 mb-1">
            Acessibilidade
          </Dialog.Title>
          <Dialog.Description id="accessibility-desc" className="text-sm text-calm-500 mb-4">
            Personalize sua experiência
          </Dialog.Description>

          <div className="space-y-0">
            <ToggleRow
              id="high-contrast"
              label={t("highContrast")}
              checked={store.highContrast}
              onCheckedChange={store.setHighContrast}
            />
            <ToggleRow
              id="large-text"
              label={t("largeText")}
              checked={store.largeText}
              onCheckedChange={store.setLargeText}
            />
            <ToggleRow
              id="reduced-motion"
              label={t("reducedMotion")}
              checked={store.reducedMotion}
              onCheckedChange={store.setReducedMotion}
            />
            <ToggleRow
              id="sound-effects"
              label={t("soundEffects")}
              checked={store.soundEffects}
              onCheckedChange={store.setSoundEffects}
            />
            <ToggleRow
              id="dark-mode"
              label={t("darkMode")}
              checked={store.darkMode}
              onCheckedChange={store.setDarkMode}
            />
            <ToggleRow
              id="low-stimulation"
              label={t("lowStimulation")}
              checked={store.lowStimulation}
              onCheckedChange={store.setLowStimulation}
            />
          </div>

          <button
            onClick={store.resetToDefault}
            className="
              mt-4 w-full text-sm text-calm-500 hover:text-calm-700
              underline underline-offset-2 transition-colors
              min-h-[44px]
            "
          >
            Restaurar padrões
          </button>

          <Dialog.Close asChild>
            <button
              className="
                absolute top-4 right-4 p-1 rounded-full hover:bg-calm-100
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500
                min-w-[44px] min-h-[44px] flex items-center justify-center
              "
              aria-label="Close"
            >
              ✕
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}