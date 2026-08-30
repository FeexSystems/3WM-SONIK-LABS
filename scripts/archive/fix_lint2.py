with open('src/components/common/CommandPalette.tsx', 'r') as f:
    text = f.read()

text = text.replace("themeManager.setMode(theme.id)", "themeManager.setMode(theme.id as any)")

with open('src/components/common/CommandPalette.tsx', 'w') as f:
    f.write(text)
