import re

with open("src/components/views/SettingsView.tsx", "r") as f:
    content = f.read()

# Add import
if "MidiControllerMappingModal" not in content:
    content = content.replace(
        "import { projectStore } from '../../services/projectStore';",
        "import { projectStore } from '../../services/projectStore';\nimport { MidiControllerMappingModal } from '../audio/MidiControllerMappingModal';"
    )

# Add state
if "const [isMidiModalOpen, setIsMidiModalOpen] = useState(false);" not in content:
    content = content.replace(
        "const [vaultMessage, setVaultMessage] = useState<string | null>(null);",
        "const [vaultMessage, setVaultMessage] = useState<string | null>(null);\n  const [isMidiModalOpen, setIsMidiModalOpen] = useState(false);"
    )

# Add section
section = """
      {/* -------------------------------------------------------------
          5. GLOBAL MIDI CONTROLLER MAPPING
         ------------------------------------------------------------- */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <h3 className="text-sm font-bold text-neutral-100 uppercase tracking-wider flex items-center gap-2">
          <Sliders className="w-4 h-4 text-amber-400" />
          Global MIDI Controller Mappings
        </h3>
        <p className="text-xs text-neutral-400">
          Map your physical MIDI keyboard or controller knobs to global transport controls (Play, Stop, Record) or master effect parameters.
        </p>
        <button
          onClick={() => setIsMidiModalOpen(true)}
          className="px-4 py-2 bg-neutral-950 border border-neutral-800 hover:border-amber-500/50 hover:bg-neutral-800 text-neutral-200 text-xs font-bold rounded-xl transition flex items-center gap-2"
        >
          <Sliders className="w-3.5 h-3.5 text-amber-500" />
          Configure MIDI Mappings
        </button>
      </div>
"""

if "GLOBAL MIDI CONTROLLER MAPPING" not in content:
    # insert before the final closing div
    # Need to be careful. Let's find the end of the return statement
    # The return statement ends with:
    #     </div>
    #   );
    # };
    content = re.sub(
        r"(      </div>\n    </div>\n  \);\n\})",
        lambda m: section + "\n" + m.group(1),
        content
    )

# Add Modal
modal = """
      {/* MIDI Mapping Modal */}
      <MidiControllerMappingModal
        isOpen={isMidiModalOpen}
        onClose={() => setIsMidiModalOpen(false)}
      />
"""

if "<MidiControllerMappingModal" not in content:
    content = re.sub(
        r"(    </div>\n  \);\n\})",
        lambda m: modal + "\n" + m.group(1),
        content
    )

with open("src/components/views/SettingsView.tsx", "w") as f:
    f.write(content)
