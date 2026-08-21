import type { Raeume, Veranstaltungen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';

export interface RaeumeDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Raeume;
  /** 1:N „Veranstaltungen" (raum): VOLLE Liste — der Block filtert auf diesen Record. */
  veranstaltungenList: Veranstaltungen[];
  /** Zeilen-Klick → overlay.push auf das Veranstaltungen-Detail (nie der Edit-Dialog). */
  onOpenVeranstaltungen: (record: Veranstaltungen) => void;
  /** Kontextuelles „+": öffnet den Veranstaltungen-Dialog mit diesem Record vorgesetzt. */
  onAddVeranstaltungen: () => void;
}

export function RaeumeDetails({
  record,
  veranstaltungenList,
  onOpenVeranstaltungen,
  onAddVeranstaltungen,
}: RaeumeDetailsProps) {
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('raeume', 'raumname')} value={record.fields.raumname} format="text" />
        <RecordField label={fieldLabel('raeume', 'kapazitaet')} value={record.fields.kapazitaet} format="text" />
        <RecordField label={fieldLabel('raeume', 'ausstattung')} value={record.fields.ausstattung} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('raeume', 'stockwerk')} value={record.fields.stockwerk} format="text" />
      </RecordSection>

      <SatelliteSection
        title={appLabel('veranstaltungen')}
        items={veranstaltungenList.filter(r => extractRecordId(r.fields.raum) === record.record_id)}
        map={r => ({ name: r.fields.titel ?? appLabel('veranstaltungen'), meta: r.fields.datum })}
        onOpen={onOpenVeranstaltungen}
        onAdd={onAddVeranstaltungen}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.RAEUME} recordId={record.record_id} />
    </>
  );
}
