with open('src/services/themeManager.ts', 'r') as f:
    text = f.read()

text = text.replace("public setMode(mode: string)", "public setMode(mode: StudioThemeMode)")

with open('src/services/themeManager.ts', 'w') as f:
    f.write(text)

with open('src/components/common/ThemeSelector.tsx', 'r') as f:
    text = f.read()
text = text.replace("themeManager.setMode(e.target.value);", "themeManager.setMode(e.target.value as StudioThemeMode);")
with open('src/components/common/ThemeSelector.tsx', 'w') as f:
    f.write(text)

with open('src/components/common/CommandPalette.tsx', 'r') as f:
    text = f.read()
text = text.replace("themeManager.setMode(cmd.id)", "themeManager.setMode(cmd.id as StudioThemeMode)")
with open('src/components/common/CommandPalette.tsx', 'w') as f:
    f.write(text)

