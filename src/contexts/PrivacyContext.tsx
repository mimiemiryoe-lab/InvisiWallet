import { createContext, useContext, useMemo, useState } from "react";

interface PrivacyContextType {
  privacyEnabled: boolean;
  togglePrivacy: () => void;
}

const PrivacyContext = createContext<PrivacyContextType | undefined>(undefined);

export const PrivacyProvider = ({ children }: { children: React.ReactNode }) => {
  const [privacyEnabled, setPrivacyEnabled] = useState<boolean>(false);

  const togglePrivacy = () => setPrivacyEnabled((v) => !v);

  const value = useMemo(() => ({ privacyEnabled, togglePrivacy }), [privacyEnabled]);
  return <PrivacyContext.Provider value={value}>{children}</PrivacyContext.Provider>;
};

export const usePrivacy = () => {
  const ctx = useContext(PrivacyContext);
  if (!ctx) throw new Error("usePrivacy must be used within a PrivacyProvider");
  return ctx;
};


