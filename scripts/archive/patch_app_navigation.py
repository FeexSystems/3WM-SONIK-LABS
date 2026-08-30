import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# Add import
if "import { SampleVaultView } from './components/views/SampleVaultView';" not in content:
    content = content.replace("import { RecordingView } from './components/views/RecordingView';", "import { RecordingView } from './components/views/RecordingView';\nimport { SampleVaultView } from './components/views/SampleVaultView';")

# Add view
if "case 'vault':" not in content:
    content = content.replace("default:", """case 'vault':
          return <SampleVaultView />;
        default:""")

# Add Navigation Item (find the nav tag and add to it)
nav_item = """          <button 
            onClick={() => setActiveView('vault')} 
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${activeView === 'vault' ? 'bg-[#f5a800] text-black shadow-lg shadow-[#f5a800]/20' : 'text-neutral-500 hover:text-white hover:bg-neutral-800'}`}
            title="Sample Vault & Generators"
          >
            <Database className="w-5 h-5" />
          </button>"""

if "<Database " not in content:
    content = content.replace("<Mic className=\"w-5 h-5\" />\n          </button>", "<Mic className=\"w-5 h-5\" />\n          </button>\n" + nav_item)
    
if "Database," not in content:
    content = content.replace("Settings,", "Settings, Database,")

with open("src/App.tsx", "w") as f:
    f.write(content)
