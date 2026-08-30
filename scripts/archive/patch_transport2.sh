sed -i 's/  currentStep: number;//' src/components/navigation/TransportBar.tsx
sed -i 's/  currentStep,/ /' src/components/navigation/TransportBar.tsx
sed -i '/const \[masterVolume/a \  const [localStep, setLocalStep] = useState(0);\n\n  useEffect(() => {\n    return transportBridge.subscribe("STEP_TICK", (state) => {\n      setLocalStep(state.currentStep);\n    });\n  }, []);' src/components/navigation/TransportBar.tsx
sed -i 's/const bar = Math.floor(currentStep \/ 16) + 1;/const bar = Math.floor(localStep \/ 16) + 1;/' src/components/navigation/TransportBar.tsx
sed -i 's/const beat = (Math.floor(currentStep \/ 4) % 4) + 1;/const beat = (Math.floor(localStep \/ 4) % 4) + 1;/' src/components/navigation/TransportBar.tsx
sed -i 's/const sub = (currentStep % 4) + 1;/const sub = (localStep % 4) + 1;/' src/components/navigation/TransportBar.tsx
