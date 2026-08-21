import type { Geraeteverwaltung } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';

export interface GeraeteverwaltungDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Geraeteverwaltung;
}

export function GeraeteverwaltungDetails({
  record,
}: GeraeteverwaltungDetailsProps) {
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('geraeteverwaltung', 'geraetename')} value={record.fields.geraetename} format="text" />
        <RecordField label={fieldLabel('geraeteverwaltung', 'anschaffungsdatum')} value={record.fields.anschaffungsdatum} format="date" />
        <RecordField label={fieldLabel('geraeteverwaltung', 'zustand')} value={record.fields.zustand} format="pill" />
      </RecordSection>

      <RecordAttachments appId={APP_IDS.GERAETEVERWALTUNG} recordId={record.record_id} />
    </>
  );
}
