import type { Mitgliedsbeitraege, Veranstaltungen } from './app';

export type EnrichedMitgliedsbeitraege = Mitgliedsbeitraege & {
  mitgliederName: string;
};

export type EnrichedVeranstaltungen = Veranstaltungen & {
  raumName: string;
};
