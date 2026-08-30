sed -i '/const \[isVersionDrawerOpen/a \  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);' src/App.tsx
sed -i '/const handleCreateTrack/i \  const handleNavigate = (view: string) => {\n    if (view === "profile") {\n      setIsProfileModalOpen(true);\n    } else {\n      setCurrentView(view);\n    }\n  };\n' src/App.tsx
sed -i 's/onNavigate={(view) => setCurrentView(view)}/onNavigate={handleNavigate}/g' src/App.tsx
sed -i 's/onNavigate={(v) => setCurrentView(v)}/onNavigate={handleNavigate}/g' src/App.tsx
sed -i 's/import { UserProfileView } from '\''\.\/components\/views\/UserProfileView'\'';/import { UserProfileModal } from '\''.\/components\/views\/UserProfileModal'\'';/g' src/App.tsx
