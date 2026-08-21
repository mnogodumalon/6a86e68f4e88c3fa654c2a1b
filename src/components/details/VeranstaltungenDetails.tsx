import type { Veranstaltungen, Raeume } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';

export interface VeranstaltungenDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Veranstaltungen;
  /** N:1-Ziel „Raeume": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  raeumeList: Raeume[];
  /** Klick auf die Raeume-Relation → overlay.push auf dessen Detail. */
  onOpenRaeume?: (record: Raeume) => void;
}

export function VeranstaltungenDetails({
  record,
  raeumeList,
  onOpenRaeume,
}: VeranstaltungenDetailsProps) {
  const raumTarget = raeumeList.find(r => r.record_id === extractRecordId(record.fields.raum));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('veranstaltungen', 'titel')} value={record.fields.titel} format="text" />
        <RecordField label={fieldLabel('veranstaltungen', 'datum')} value={record.fields.datum} format="datetime" />
        <RecordField label={fieldLabel('veranstaltungen', 'beschreibung')} value={record.fields.beschreibung} format="longtext" className="md:col-span-2" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={1}>
        <RecordRelation
          label={fieldLabel('veranstaltungen', 'raum')}
          name={raumTarget?.fields.raumname ?? '—'}
          meta={[raumTarget?.fields.kapazitaet, raumTarget?.fields.stockwerk].filter(Boolean).join(' · ') || undefined}
          onClick={raumTarget && onOpenRaeume ? () => onOpenRaeume!(raumTarget!) : undefined}
        />
      </RecordSection>

      <RecordAttachments appId={APP_IDS.VERANSTALTUNGEN} recordId={record.record_id} />
    </>
  );
}
