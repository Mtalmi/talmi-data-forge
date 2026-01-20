import { createContext, useContext, useState, ReactNode } from 'react';

interface PreviewRoleContextType {
  previewRole: string | null;
  setPreviewRole: (role: string | null) => void;
}

const PreviewRoleContext = createContext<PreviewRoleContextType>({
  previewRole: null,
  setPreviewRole: () => {},
});

export function PreviewRoleProvider({ children }: { children: ReactNode }) {
  const [previewRole, setPreviewRole] = useState<string | null>(null);

  return (
    <PreviewRoleContext.Provider value={{ previewRole, setPreviewRole }}>
      {children}
    </PreviewRoleContext.Provider>
  );
}

export const usePreviewRole = () => useContext(PreviewRoleContext);
