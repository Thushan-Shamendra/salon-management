"use client";

import React, { createContext, useContext, useState } from "react";

export interface BranchContextType {
  selectedBranchId?: string;
  setSelectedBranchId: (id?: string) => void;
  selectedBranchWhatsapp?: string;
  setSelectedBranchWhatsapp: (num?: string) => void;
}

const BranchContext = createContext<BranchContextType>({
  selectedBranchId: undefined,
  setSelectedBranchId: () => {},
  selectedBranchWhatsapp: undefined,
  setSelectedBranchWhatsapp: () => {},
});

export function BranchProvider({ children }: { children: React.ReactNode }) {
  const [selectedBranchId, setSelectedBranchId] = useState<string | undefined>(undefined);
  const [selectedBranchWhatsapp, setSelectedBranchWhatsapp] = useState<string | undefined>(undefined);

  return (
    <BranchContext.Provider
      value={{
        selectedBranchId,
        setSelectedBranchId,
        selectedBranchWhatsapp,
        setSelectedBranchWhatsapp,
      }}
    >
      {children}
    </BranchContext.Provider>
  );
}

export function useBranchContext() {
  return useContext(BranchContext);
}
