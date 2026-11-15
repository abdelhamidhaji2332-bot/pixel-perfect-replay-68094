import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const lessonStages = [
  { title: "Étendue de mesure", distance: 3, description: "Repérer la zone morte et les limites de mesure du capteur.", note: "Sous 5 cm, l’écho émis se confond avec l’écho reçu : la mesure n’est plus exploitable." },
  { title: "Plage linéaire", distance: 42, description: "Relier le mesurande à la tension de sortie conditionnée.", note: "Dans la plage utile, la pente de la caractéristique traduit la sensibilité locale du capteur." },
  { title: "Saturation", distance: 91, description: "Observer la compression de la caractéristique en sortie.", note: "Au-delà de 75 cm, la non-linéarité réduit le gain avant l’écrêtage de la sortie." },
  { title: "Fidélité & justesse", distance: 55, description: "Comparer dispersion de mesure, biais thermique et hystérésis.", note: "La répétabilité décrit la dispersion ; la justesse dépend du biais et de la direction du déplacement." },
];

type PresentationGuideProps = { active: number; onChange: (step: number) => void };

export function PresentationGuide({ active, onChange }: PresentationGuideProps) {
  return (
    <nav className="lesson-nav" aria-label="Étapes de l’exposé">
      <div className="lesson-heading"><span className="eyebrow">PARCOURS GUIDÉ</span><span>ÉTAPES DE L’EXPOSÉ</span></div>
      <div className="lesson-steps">
        {lessonStages.map((stage, index) => (
          <button key={stage.title} className={`lesson-step ${active === index ? "is-active" : ""}`} onClick={() => onChange(index)} aria-current={active === index ? "step" : undefined}>
            <span className="step-index">0{index + 1}</span><span className="step-title">{stage.title}</span>
            {active === index && <motion.span className="step-indicator" layoutId="lesson-indicator" transition={{ type: "spring", stiffness: 280, damping: 26 }} />}
          </button>
        ))}
      </div>
      <div className="lesson-arrows">
        <Button variant="ghost" size="icon" aria-label="Étape précédente" onClick={() => onChange((active + lessonStages.length - 1) % lessonStages.length)}><ArrowLeft /></Button>
        <span className="step-count">{String(active + 1).padStart(2, "0")} / 04</span>
        <Button variant="ghost" size="icon" aria-label="Étape suivante" onClick={() => onChange((active + 1) % lessonStages.length)}><ArrowRight /></Button>
      </div>
    </nav>
  );
}