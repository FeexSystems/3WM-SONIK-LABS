import re

with open("src/components/views/BeatLabView.tsx", "r") as f:
    content = f.read()

# 1. Add framer-motion import
if "framer-motion" not in content:
    content = content.replace(
        "import React, { useState, useEffect } from 'react';",
        "import React, { useState, useEffect } from 'react';\nimport { motion, AnimatePresence } from 'framer-motion';"
    )

# 2. Add Lightbulb to lucide-react
if "Lightbulb" not in content:
    content = content.replace(
        "  Disc,\n} from 'lucide-react';",
        "  Disc,\n  Lightbulb,\n} from 'lucide-react';"
    )

# 3. Add AiSuggestionBanner component definition
banner_code = """
const AiSuggestionBanner: React.FC<{ activeTab: string }> = ({ activeTab }) => {
  const getAiSuggestion = () => {
    switch (activeTab) {
      case 'step_seq':
        return {
          agent: 'Ricky',
          color: 'text-amber-400',
          bgColor: 'bg-amber-400/10',
          borderColor: 'border-amber-500/30',
          message: 'Ricky suggests: "Try shifting the shakers slightly off the grid for that authentic Lagos bounce. Or hit Mutate to generate a rhythmic variation."',
          icon: <Zap className="w-4 h-4" />
        };
      case 'piano_roll':
        return {
          agent: 'Kingpin',
          color: 'text-orange-400',
          bgColor: 'bg-orange-400/10',
          borderColor: 'border-orange-500/30',
          message: 'Kingpin suggests: "Your melody is solid, but the chord voicings could use some tension. Add a 7th or 9th for more Afrofusion flavor."',
          icon: <Wand2 className="w-4 h-4" />
        };
      case '808_lab':
        return {
          agent: 'Emar',
          color: 'text-emerald-400',
          bgColor: 'bg-emerald-400/10',
          borderColor: 'border-emerald-500/30',
          message: 'Emar suggests: "The 808 decay is a bit long for this BPM. I can tighten the envelope and add soft-clip saturation for extra punch."',
          icon: <Activity className="w-4 h-4" />
        };
      case 'drum_machine':
        return {
          agent: 'Ricky',
          color: 'text-rose-400',
          bgColor: 'bg-rose-400/10',
          borderColor: 'border-rose-500/30',
          message: 'Ricky suggests: "This drum pack goes hard. Remember to route the kick and 808 to a bus with sidechain compression to keep the low-end clean."',
          icon: <Layers className="w-4 h-4" />
        };
      default:
        return null;
    }
  };

  const suggestion = getAiSuggestion();
  if (!suggestion) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -5 }}
        transition={{ duration: 0.3 }}
        className={`flex items-center gap-3 p-3 rounded-xl border bg-neutral-900/60 ${suggestion.borderColor}`}
      >
        <div className={`p-2 rounded-lg ${suggestion.bgColor} ${suggestion.color}`}>
          {suggestion.icon}
        </div>
        <div className="flex flex-col">
          <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${suggestion.color}`}>
            {suggestion.agent} • AI Copilot
          </span>
          <span className="text-xs text-neutral-300">
            {suggestion.message}
          </span>
        </div>
        <div className="ml-auto">
          <button className={`p-1.5 rounded-md hover:bg-neutral-800 transition-colors ${suggestion.color}`} title="Apply Suggestion">
            <Lightbulb className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
"""

# I need to add Activity to lucide-react if it's not there. Let's make sure it's imported.
if "Activity," not in content:
    content = content.replace(
        "  Disc,\n",
        "  Disc,\n  Activity,\n"
    )

if "AiSuggestionBanner" not in content:
    content = content.replace(
        "export const TRAP_SOUND_PACKS =",
        banner_code + "\nexport const TRAP_SOUND_PACKS ="
    )

# 4. Inject it into the render method
insertion_point = "{/* Active Editor Panel */}"
if "<AiSuggestionBanner activeTab={activeTab} />" not in content:
    content = content.replace(
        insertion_point,
        "<AiSuggestionBanner activeTab={activeTab} />\n      " + insertion_point
    )

with open("src/components/views/BeatLabView.tsx", "w") as f:
    f.write(content)
