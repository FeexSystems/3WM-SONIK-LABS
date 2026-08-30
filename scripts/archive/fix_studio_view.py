import re

with open('src/components/views/StudioView.tsx', 'r') as f:
    text = f.read()

# Add import if needed
if "transportBridge" not in text:
    text = text.replace("import { soundEngine", "import { transportBridge } from '../../audio/transportBridge';\nimport { soundEngine")

# Remove from interface
text = text.replace("  currentStep: number;\n", "")

# Remove from props
text = text.replace("  currentStep,\n", "")

# Add local state inside component
local_state = """  const [currentStep, setCurrentStep] = useState(0);
  useEffect(() => {
    return transportBridge.subscribe("STEP_TICK", (state) => {
      setCurrentStep(state.currentStep);
    });
  }, []);
"""

text = text.replace("  const [selectedStemId, setSelectedStemId]", local_state + "  const [selectedStemId, setSelectedStemId]")

with open('src/components/views/StudioView.tsx', 'w') as f:
    f.write(text)

