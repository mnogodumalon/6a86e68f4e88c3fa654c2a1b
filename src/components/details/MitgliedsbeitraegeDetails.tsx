import type { Mitgliedsbeitraege, Mitglieder } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';

export interface MitgliedsbeitraegeDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Mitgliedsbeitraege;
  /** N:1-Ziel „Mitglieder": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  mitgliederList: Mitglieder[];
  /** Reserviert — Mitglieder ist hier nur über ein Mehrfach-Feld verknüpft (Text-Join, keine Einzel-Relation); Übergabe erlaubt, aber ohne Wirkung. */
  onOpenMitglieder?: (record: Mitglieder) => void;
}

export function MitgliedsbeitraegeDetails({
  record,
  mitgliederList,
}: MitgliedsbeitraegeDetailsProps) {
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('mitgliedsbeitraege', 'betrag')} value={record.fields.betrag} format="text" />
        <RecordField label={fieldLabel('mitgliedsbeitraege', 'zahlungsdatum')} value={record.fields.zahlungsdatum} format="date" />
        <RecordField label={fieldLabel('mitgliedsbeitraege', 'mitglieder')} value={Array.isArray(record.fields.mitglieder) ? record.fields.mitglieder.map((u: unknown) => mitgliederList.find(t => t.record_id === extractRecordId(u))?.fields.vorname ?? '—').join(', ') : null} format="text" />
        <RecordField label={fieldLabel('mitgliedsbeitraege', 'zahlungsstatus')} value={record.fields.zahlungsstatus} format="pill" />
      </RecordSection>

      <RecordAttachments appId={APP_IDS.MITGLIEDSBEITRAEGE} recordId={record.record_id} />
    </>
  );
}
