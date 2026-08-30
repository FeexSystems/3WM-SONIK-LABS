import re

with open("src/components/navigation/Sidebar.tsx", "r") as f:
    content = f.read()

# Add HelpCircle to imports
if "HelpCircle" not in content:
    content = content.replace("LayoutDashboard,", "LayoutDashboard, HelpCircle,")

# Add onOpenGuide to props type
if "onOpenGuide?: () => void;" not in content:
    content = content.replace("isAgentPanelOpen?: boolean;\n}", "isAgentPanelOpen?: boolean;\n  onOpenGuide?: () => void;\n}")

# Add onOpenGuide to component props
if "onOpenGuide," not in content:
    content = content.replace("isAgentPanelOpen,\n})", "isAgentPanelOpen,\n  onOpenGuide,\n})")

# Add Help button in bottom user profile section
help_btn = """        <button 
          onClick={onOpenGuide}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-neutral-900/60 border border-neutral-800 text-neutral-400 hover:text-amber-400 hover:border-amber-500/30 transition-colors ml-2"
          title="App Guide"
        >
          <HelpCircle className="w-5 h-5" />
        </button>"""

if "onOpenGuide" not in content.split("Bottom User Profile Section")[1]:
    old_bottom = """        <div className="flex items-center justify-between p-2 rounded-xl bg-neutral-900/60 border border-neutral-800">
          <div className="flex items-center gap-2.5">"""
    new_bottom = """        <div className="flex items-center justify-between p-2 rounded-xl bg-neutral-900/60 border border-neutral-800">
          <div className="flex items-center gap-2.5">"""
          
    # Actually, let's put it next to the online status indicator
    old_status = """<span className="w-2 h-2 rounded-full bg-emerald-400 ring-4 ring-emerald-400/20" title="Online" />
        </div>"""
    new_status = """<span className="w-2 h-2 rounded-full bg-emerald-400 ring-4 ring-emerald-400/20" title="Online" />
        </div>
        """ + help_btn

    content = content.replace(old_status, new_status)

with open("src/components/navigation/Sidebar.tsx", "w") as f:
    f.write(content)
