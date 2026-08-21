import type { Mitglieder, Mitgliedsbeitraege } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';

export interface MitgliederDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Mitglieder;
  /** 1:N „Mitgliedsbeiträge" (mitglieder): VOLLE Liste — der Block filtert auf diesen Record. */
  mitgliedsbeitraegeList: Mitgliedsbeitraege[];
  /** Zeilen-Klick → overlay.push auf das Mitgliedsbeitraege-Detail (nie der Edit-Dialog). */
  onOpenMitgliedsbeitraege: (record: Mitgliedsbeitraege) => void;
  /** Kontextuelles „+": öffnet den Mitgliedsbeitraege-Dialog mit diesem Record vorgesetzt. */
  onAddMitgliedsbeitraege: () => void;
}

export function MitgliederDetails({
  record,
  mitgliedsbeitraegeList,
  onOpenMitgliedsbeitraege,
  onAddMitgliedsbeitraege,
}: MitgliederDetailsProps) {
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('mitglieder', 'vorname')} value={record.fields.vorname} format="text" />
        <RecordField label={fieldLabel('mitglieder', 'nachname')} value={record.fields.nachname} format="text" />
        <RecordField label={fieldLabel('mitglieder', 'email')} value={record.fields.email} format="email" />
        <RecordField label={fieldLabel('mitglieder', 'beitrittsdatum')} value={record.fields.beitrittsdatum} format="date" />
        <RecordField label={fieldLabel('mitglieder', 'mitgliedsstatus')} value={record.fields.mitgliedsstatus} format="pill" />
        <RecordField label={fieldLabel('mitglieder', 'telefonnummer')} value={record.fields.telefonnummer} format="text" />
      </RecordSection>

      <SatelliteSection
        title={appLabel('mitgliedsbeitraege')}
        items={mitgliedsbeitraegeList.filter(r => Array.isArray(r.fields.mitglieder) && r.fields.mitglieder.some((u: unknown) => extractRecordId(u) === record.record_id))}
        map={r => ({ name: appLabel('mitgliedsbeitraege'), meta: r.fields.zahlungsdatum })}
        onOpen={onOpenMitgliedsbeitraege}
        onAdd={onAddMitgliedsbeitraege}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.MITGLIEDER} recordId={record.record_id} />
    </>
  );
}
