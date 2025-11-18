export type EleuEntry = {
  id: string;
  title: string;
  username?: string;
  password?: string;
  url?: string;
  notes?: string;
  updatedAt: number;
};

export type EleuVault = {
  entries: EleuEntry[];
  updatedAt: number;
};
