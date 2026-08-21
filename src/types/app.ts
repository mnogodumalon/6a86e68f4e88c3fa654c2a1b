import { lookupLabel } from '@/i18n';

// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
export type GeoLocation = { lat: number; long: number; info?: string };

export type AttachmentType = 'file' | 'note' | 'url' | 'json';
export interface Attachment {
  id: string;
  type: AttachmentType;
  label: string | null;
  value: string | null;
  active: boolean;
  createdat?: string | null;
  updatedat?: string | null;
}

export interface AttachmentInput {
  type: AttachmentType;
  label?: string;
  value: string;
  active?: boolean;
}

export interface Mitgliedsbeitraege {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    betrag?: number;
    zahlungsdatum?: string; // Format: YYYY-MM-DD oder ISO String
    mitglieder?: string[];
    zahlungsstatus?: LookupValue;
  };
}

export interface Mitglieder {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    vorname?: string;
    nachname?: string;
    email?: string;
    beitrittsdatum?: string; // Format: YYYY-MM-DD oder ISO String
    mitgliedsstatus?: LookupValue;
    telefonnummer?: string;
  };
}

export interface Geraeteverwaltung {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    geraetename?: string;
    anschaffungsdatum?: string; // Format: YYYY-MM-DD oder ISO String
    zustand?: LookupValue;
  };
}

export interface Raeume {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    raumname?: string;
    kapazitaet?: string;
    ausstattung?: string;
    stockwerk?: string;
  };
}

export interface Veranstaltungen {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    titel?: string;
    datum?: string; // Format: YYYY-MM-DD oder ISO String
    beschreibung?: string;
    raum?: string; // applookup -> URL zu 'Raeume' Record
  };
}

export const APP_IDS = {
  MITGLIEDSBEITRAEGE: '6a86ec6d242eab27294ee804',
  MITGLIEDER: '6a86e67954b55a30ffb358d9',
  GERAETEVERWALTUNG: '6a8886bdddfea3db5575086a',
  RAEUME: '6a86e67c8c67641c7cc5d89b',
  VERANSTALTUNGEN: '6a86e67db691a61c8d73778d',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {
  'mitgliedsbeitraege': {
    zahlungsstatus: [{ key: "offen", get label() { return lookupLabel('mitgliedsbeitraege', 'zahlungsstatus', "offen") ?? "Offen"; } }, { key: "bezahlt", get label() { return lookupLabel('mitgliedsbeitraege', 'zahlungsstatus', "bezahlt") ?? "Bezahlt"; } }, { key: "erlassen", get label() { return lookupLabel('mitgliedsbeitraege', 'zahlungsstatus', "erlassen") ?? "Erlassen"; } }],
  },
  'mitglieder': {
    mitgliedsstatus: [{ key: "aktiv", get label() { return lookupLabel('mitglieder', 'mitgliedsstatus', "aktiv") ?? "Aktiv"; } }, { key: "passiv", get label() { return lookupLabel('mitglieder', 'mitgliedsstatus', "passiv") ?? "Passiv"; } }, { key: "ehrenmitglied", get label() { return lookupLabel('mitglieder', 'mitgliedsstatus', "ehrenmitglied") ?? "Ehrenmitglied"; } }, { key: "ausgetreten", get label() { return lookupLabel('mitglieder', 'mitgliedsstatus', "ausgetreten") ?? "Ausgetreten"; } }],
  },
  'geraeteverwaltung': {
    zustand: [{ key: "neu", get label() { return lookupLabel('geraeteverwaltung', 'zustand', "neu") ?? "Neu"; } }, { key: "gut", get label() { return lookupLabel('geraeteverwaltung', 'zustand', "gut") ?? "Gut"; } }, { key: "reparaturbeduerftig", get label() { return lookupLabel('geraeteverwaltung', 'zustand', "reparaturbeduerftig") ?? "Reparaturbedürftig"; } }],
  },
};

// Optimistic LookupValue writes: never re-type a label — resolve the schema
// option instead (its label is a locale-aware getter; falls back to the key).
// WRONG: status: { key: 'offen', label: 'Offen' }   (frozen in one language)
// RIGHT: status: lookupOption('<appKey>', 'status', 'offen')
export function lookupOption(app: string, field: string, key: string): LookupValue {
  return LOOKUP_OPTIONS[app]?.[field]?.find(o => o.key === key) ?? { key, label: key };
}

export const FIELD_TYPES: Record<string, Record<string, string>> = {
  'mitgliedsbeitraege': {
    'betrag': 'number',
    'zahlungsdatum': 'date/date',
    'mitglieder': 'multipleapplookup/select',
    'zahlungsstatus': 'lookup/select',
  },
  'mitglieder': {
    'vorname': 'string/text',
    'nachname': 'string/text',
    'email': 'string/email',
    'beitrittsdatum': 'date/date',
    'mitgliedsstatus': 'lookup/select',
    'telefonnummer': 'string/tel',
  },
  'geraeteverwaltung': {
    'geraetename': 'string/text',
    'anschaffungsdatum': 'date/date',
    'zustand': 'lookup/select',
  },
  'raeume': {
    'raumname': 'string/text',
    'kapazitaet': 'string/text',
    'ausstattung': 'string/textarea',
    'stockwerk': 'string/text',
  },
  'veranstaltungen': {
    'titel': 'string/text',
    'datum': 'date/datetimeminute',
    'beschreibung': 'string/textarea',
    'raum': 'applookup/select',
  },
};

export const HUB_TOPOLOGY: Record<string, { field: string; entity: string }[]> = {
};

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | LookupValue | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | LookupValue[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreateMitgliedsbeitraege = StripLookup<Mitgliedsbeitraege['fields']>;
export type CreateMitglieder = StripLookup<Mitglieder['fields']>;
export type CreateGeraeteverwaltung = StripLookup<Geraeteverwaltung['fields']>;
export type CreateRaeume = StripLookup<Raeume['fields']>;
export type CreateVeranstaltungen = StripLookup<Veranstaltungen['fields']>;