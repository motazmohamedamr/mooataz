// client-type.model.ts
export interface ClientTypeOption {
  name: string;
  displayName: {
    ar: string;
    en: string;
  };
  value: number;
}

export const ClientTypesValues: ClientTypeOption[] = [
  {
    name: 'Governmental',
    displayName: {
      ar: 'حكومي',
      en: 'Governmental',
    },
    value: 0,
  },
  {
    name: 'SemiGovernmental',
    displayName: {
      ar: 'شبه حكومي',
      en: 'Semi Governmental',
    },
    value: 1,
  },
  {
    name: 'PrivateCompany',
    displayName: {
      ar: 'خاص - شركات',
      en: 'Private - Company',
    },
    value: 2,
  },
  {
    name: 'PrivateIndividual',
    displayName: {
      ar: 'خاص - أفراد',
      en: 'Private - Individual',
    },
    value: 3,
  },
];
