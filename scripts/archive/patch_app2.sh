sed -i '/{currentView === .profile. && (/,/)}/d' src/App.tsx
sed -i '/<CommandPalette/i \      <UserProfileModal\n        isOpen={isProfileModalOpen}\n        onClose={() => setIsProfileModalOpen(false)}\n        user={user}\n      />' src/App.tsx
