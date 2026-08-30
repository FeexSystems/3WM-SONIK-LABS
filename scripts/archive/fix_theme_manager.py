with open('src/services/themeManager.ts', 'r') as f:
    text = f.read()

text = text.replace("public setMode(mode: StudioThemeMode)", "public setMode(mode: string)")

with open('src/services/themeManager.ts', 'w') as f:
    f.write(text)
