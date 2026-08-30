import re
import os

with open('src/types.ts', 'r') as f:
    text = f.read()

# Change StudioThemeMode to include light and studio-night
text = text.replace("export type StudioThemeMode = 'dark' | 'midnight' | 'studio-light';", "export type StudioThemeMode = 'dark' | 'midnight' | 'studio-light' | 'light' | 'studio-night';")

with open('src/types.ts', 'w') as f:
    f.write(text)

with open('src/components/common/ThemeSelector.tsx', 'r') as f:
    text = f.read()
text = text.replace("themeManager.setThemeById", "themeManager.setMode")
with open('src/components/common/ThemeSelector.tsx', 'w') as f:
    f.write(text)

with open('src/components/common/CommandPalette.tsx', 'r') as f:
    text = f.read()
text = text.replace("themeManager.setThemeById", "themeManager.setMode")
with open('src/components/common/CommandPalette.tsx', 'w') as f:
    f.write(text)

