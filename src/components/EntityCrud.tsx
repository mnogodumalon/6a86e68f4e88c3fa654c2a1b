/**
 * EntityCrud — pre-generated CRUD + overlay plumbing for the dashboard.
 * Compose it; NEVER re-roll dialog state, submit handlers, an overlay stack
 * or a RecordOverlayHost in the page — this file owns all of it.
 *
 * API at a glance:
 *   const data = useDashboardData();
 *   const crud = useEntityCrud(data, {
 *     // optional — the ONE semantic slot on the overlay: the record's next
 *     // workflow step. Return undefined for types without one.
 *     footer: (top) => top.type === 'mitgliedsbeitraege'
 *       ? { label: …, onClick: () => … }
 *       : undefined,
 *   });
 *
 *   `top.type` is the SAME camelCase key as `crud.<entity>` — one spelling
 *   per entity, everywhere in this API.
 *   …
 *   crud.mitgliedsbeitraege.openCreate({ …defaults })   // create dialog, prefilled — defaults are
 *                                       // shape-tolerant: bare lookup keys / record ids are fine
 *   crud.mitgliedsbeitraege.openEdit(record)            // edit dialog (recordId + defaults wired)
 *   crud.mitgliedsbeitraege.openDetail(record)          // record overlay — pass the RAW record,
 *                                       // enrichment is resolved inside
 *   crud.overlay                         // RecordOverlayStack<OverlayItem> for drills:
 *                                       // push / pop / replace / close
 *   crud.enriched.mitgliedsbeitraege              // the display-ready array for EVERY entity —
 *                                       // Enriched* where relations exist, the raw array
 *                                       // otherwise. Reuse these; never call enrich*()
 *                                       // in the page, and never guess which entity has
 *                                       // one: they all do.
 *   {crud.surfaces}                      // render ONCE at the end of the page JSX:
 *                                       // all entity dialogs + the overlay host
 *
 * Built in (do NOT re-implement): optimistic update + Rückgängig counter-write
 * on edit, fetchAll-on-error, edit-from-overlay, and per-entity overlay bodies
 * (RecordHeader + <{Entity}Details> with every relation reachable and the
 * contextual "+" prefilled). Drag writes (onEventDrop/onCardMove) stay YOURS:
 * optimistic setter first, PATCH in background, undoToast with counter-write.
 *
 * Overlay content per entity (the host renders these — you never compose
 * Details blocks yourself):
 *   mitgliedsbeitraege: betrag, zahlungsdatum, mitglieder, zahlungsstatus  ·  → mitglieder
 *   mitglieder: vorname, nachname, email, beitrittsdatum, mitgliedsstatus, telefonnummer  ·  ← mitgliedsbeitraege (list + contextual +)
 *   geraeteverwaltung: geraetename, anschaffungsdatum, zustand
 *   raeume: raumname, kapazitaet, ausstattung, stockwerk  ·  ← veranstaltungen (list + contextual +)
 *   veranstaltungen: titel, datum, beschreibung, raum  ·  → raeume
 */
import { useState, useMemo, type ReactNode } from 'react';
import type { Mitgliedsbeitraege, Mitglieder, Geraeteverwaltung, Raeume, Veranstaltungen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { LivingAppsService, createRecordUrl } from '@/services/livingAppsService';
import { enrichMitgliedsbeitraege, enrichVeranstaltungen } from '@/lib/enrich';
import type { EnrichedMitgliedsbeitraege, EnrichedVeranstaltungen } from '@/types/enriched';
import { useDashboardData } from '@/hooks/useDashboardData';
import {
  useRecordOverlayStack, RecordOverlayHost, RecordHeader,
  type RecordOverlayStack,
} from '@/components/widgets/RecordView';
import { MitgliedsbeitraegeDialog, type MitgliedsbeitraegeDialogDefaults } from '@/components/dialogs/MitgliedsbeitraegeDialog';
import { MitgliedsbeitraegeDetails } from '@/components/details/MitgliedsbeitraegeDetails';
import { MitgliederDialog, type MitgliederDialogDefaults } from '@/components/dialogs/MitgliederDialog';
import { MitgliederDetails } from '@/components/details/MitgliederDetails';
import { GeraeteverwaltungDialog, type GeraeteverwaltungDialogDefaults } from '@/components/dialogs/GeraeteverwaltungDialog';
import { GeraeteverwaltungDetails } from '@/components/details/GeraeteverwaltungDetails';
import { RaeumeDialog, type RaeumeDialogDefaults } from '@/components/dialogs/RaeumeDialog';
import { RaeumeDetails } from '@/components/details/RaeumeDetails';
import { VeranstaltungenDialog, type VeranstaltungenDialogDefaults } from '@/components/dialogs/VeranstaltungenDialog';
import { VeranstaltungenDetails } from '@/components/details/VeranstaltungenDetails';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import { t, appLabel } from '@/i18n';
import { undoToast } from '@/lib/polish';
import { formatDate } from '@/lib/formatters';

// The overlay union — one branch per entity, `record` typed the way the data
// flows: Enriched* where enrichment exists, the raw record type otherwise.
// The host resolves enrichment itself; pages pass raw records everywhere.
export type OverlayItem =
  | { type: 'mitgliedsbeitraege'; record: EnrichedMitgliedsbeitraege }
  | { type: 'mitglieder'; record: Mitglieder }
  | { type: 'geraeteverwaltung'; record: Geraeteverwaltung }
  | { type: 'raeume'; record: Raeume }
  | { type: 'veranstaltungen'; record: EnrichedVeranstaltungen };

/** The useDashboardData() return — pass it in, never re-fetch inside. */
export type EntityCrudData = ReturnType<typeof useDashboardData>;

export interface EntityCrudOptions {
  /** Per-type overlay footer — the record's next workflow step. */
  footer?: (top: OverlayItem) => ReactNode | { label: ReactNode; onClick: () => void } | undefined;
  placement?: 'side' | 'center';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface EntityCrudApi<TRecord, TDefaults> {
  /** Open the create dialog, optionally prefilled (shape-tolerant defaults). */
  openCreate: (defaults?: TDefaults) => void;
  /** Open the edit dialog for a record (recordId + defaults are wired). */
  openEdit: (record: TRecord) => void;
  /** Open the record overlay (raw record is fine — enrichment resolved inside). */
  openDetail: (record: TRecord) => void;
}

export interface EntityCrud {
  /** The overlay stack for drills: push / pop / replace / close. */
  overlay: RecordOverlayStack<OverlayItem>;
  /** Render ONCE at the end of the page JSX — all dialogs + the overlay host. */
  surfaces: ReactNode;
  mitgliedsbeitraege: EntityCrudApi<Mitgliedsbeitraege, MitgliedsbeitraegeDialogDefaults>;
  mitglieder: EntityCrudApi<Mitglieder, MitgliederDialogDefaults>;
  geraeteverwaltung: EntityCrudApi<Geraeteverwaltung, GeraeteverwaltungDialogDefaults>;
  raeume: EntityCrudApi<Raeume, RaeumeDialogDefaults>;
  veranstaltungen: EntityCrudApi<Veranstaltungen, VeranstaltungenDialogDefaults>;
  /** The display-ready array per entity: Enriched* where an enrich function
   *  exists, the raw array otherwise. One key per entity so no page has to
   *  know which is which. Reuse these; never re-enrich in the page. */
  enriched: { mitgliedsbeitraege: EnrichedMitgliedsbeitraege[]; mitglieder: Mitglieder[]; geraeteverwaltung: Geraeteverwaltung[]; raeume: Raeume[]; veranstaltungen: EnrichedVeranstaltungen[] };
}

export function useEntityCrud(data: EntityCrudData, options?: EntityCrudOptions): EntityCrud {
  const overlay = useRecordOverlayStack<OverlayItem>();
  const [mitgliedsbeitraegeDialog, setMitgliedsbeitraegeDialog] = useState<{ defaults?: MitgliedsbeitraegeDialogDefaults; editing?: Mitgliedsbeitraege } | null>(null);
  const [mitgliederDialog, setMitgliederDialog] = useState<{ defaults?: MitgliederDialogDefaults; editing?: Mitglieder } | null>(null);
  const [geraeteverwaltungDialog, setGeraeteverwaltungDialog] = useState<{ defaults?: GeraeteverwaltungDialogDefaults; editing?: Geraeteverwaltung } | null>(null);
  const [raeumeDialog, setRaeumeDialog] = useState<{ defaults?: RaeumeDialogDefaults; editing?: Raeume } | null>(null);
  const [veranstaltungenDialog, setVeranstaltungenDialog] = useState<{ defaults?: VeranstaltungenDialogDefaults; editing?: Veranstaltungen } | null>(null);
  const enrichedMitgliedsbeitraege = useMemo(() => enrichMitgliedsbeitraege(data.mitgliedsbeitraege, { mitgliederMap: data.mitgliederMap }), [data.mitgliedsbeitraege, data.mitgliederMap]);
  const enrichedVeranstaltungen = useMemo(() => enrichVeranstaltungen(data.veranstaltungen, { raeumeMap: data.raeumeMap }), [data.veranstaltungen, data.raeumeMap]);

  function detailMitgliedsbeitraege(record: Mitgliedsbeitraege, push = false) {
    const rec = enrichedMitgliedsbeitraege.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'mitgliedsbeitraege', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitMitgliedsbeitraege(fields: Mitgliedsbeitraege['fields']) {
    const editing = mitgliedsbeitraegeDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setMitgliedsbeitraege(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateMitgliedsbeitraegeEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('mitgliedsbeitraege')} — ${t('crud_updated')}`, async () => {
        data.setMitgliedsbeitraege(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateMitgliedsbeitraegeEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createMitgliedsbeitraegeEntry(fields);
      undoToast(`${appLabel('mitgliedsbeitraege')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailMitglieder(record: Mitglieder, push = false) {
    const item: OverlayItem = { type: 'mitglieder', record };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitMitglieder(fields: Mitglieder['fields']) {
    const editing = mitgliederDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setMitglieder(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateMitgliederEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('mitglieder')} — ${t('crud_updated')}`, async () => {
        data.setMitglieder(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateMitgliederEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createMitgliederEntry(fields);
      undoToast(`${appLabel('mitglieder')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailGeraeteverwaltung(record: Geraeteverwaltung, push = false) {
    const item: OverlayItem = { type: 'geraeteverwaltung', record };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitGeraeteverwaltung(fields: Geraeteverwaltung['fields']) {
    const editing = geraeteverwaltungDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setGeraeteverwaltung(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateGeraeteverwaltungEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('geraeteverwaltung')} — ${t('crud_updated')}`, async () => {
        data.setGeraeteverwaltung(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateGeraeteverwaltungEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createGeraeteverwaltungEntry(fields);
      undoToast(`${appLabel('geraeteverwaltung')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailRaeume(record: Raeume, push = false) {
    const item: OverlayItem = { type: 'raeume', record };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitRaeume(fields: Raeume['fields']) {
    const editing = raeumeDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setRaeume(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateRaeumeEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('raeume')} — ${t('crud_updated')}`, async () => {
        data.setRaeume(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateRaeumeEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createRaeumeEntry(fields);
      undoToast(`${appLabel('raeume')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailVeranstaltungen(record: Veranstaltungen, push = false) {
    const rec = enrichedVeranstaltungen.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'veranstaltungen', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitVeranstaltungen(fields: Veranstaltungen['fields']) {
    const editing = veranstaltungenDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setVeranstaltungen(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateVeranstaltungenEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('veranstaltungen')} — ${t('crud_updated')}`, async () => {
        data.setVeranstaltungen(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateVeranstaltungenEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createVeranstaltungenEntry(fields);
      undoToast(`${appLabel('veranstaltungen')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  const surfaces = (
    <>
      <MitgliedsbeitraegeDialog
        open={mitgliedsbeitraegeDialog !== null}
        onClose={() => setMitgliedsbeitraegeDialog(null)}
        onSubmit={submitMitgliedsbeitraege}
        defaultValues={mitgliedsbeitraegeDialog?.defaults}
        recordId={mitgliedsbeitraegeDialog?.editing?.record_id}
        mitgliederList={data.mitglieder}
        enablePhotoScan={AI_PHOTO_SCAN['Mitgliedsbeitraege']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Mitgliedsbeitraege']}
      />
      <MitgliederDialog
        open={mitgliederDialog !== null}
        onClose={() => setMitgliederDialog(null)}
        onSubmit={submitMitglieder}
        defaultValues={mitgliederDialog?.defaults}
        recordId={mitgliederDialog?.editing?.record_id}
        enablePhotoScan={AI_PHOTO_SCAN['Mitglieder']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Mitglieder']}
      />
      <GeraeteverwaltungDialog
        open={geraeteverwaltungDialog !== null}
        onClose={() => setGeraeteverwaltungDialog(null)}
        onSubmit={submitGeraeteverwaltung}
        defaultValues={geraeteverwaltungDialog?.defaults}
        recordId={geraeteverwaltungDialog?.editing?.record_id}
        enablePhotoScan={AI_PHOTO_SCAN['Geraeteverwaltung']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Geraeteverwaltung']}
      />
      <RaeumeDialog
        open={raeumeDialog !== null}
        onClose={() => setRaeumeDialog(null)}
        onSubmit={submitRaeume}
        defaultValues={raeumeDialog?.defaults}
        recordId={raeumeDialog?.editing?.record_id}
        enablePhotoScan={AI_PHOTO_SCAN['Raeume']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Raeume']}
      />
      <VeranstaltungenDialog
        open={veranstaltungenDialog !== null}
        onClose={() => setVeranstaltungenDialog(null)}
        onSubmit={submitVeranstaltungen}
        defaultValues={veranstaltungenDialog?.defaults}
        recordId={veranstaltungenDialog?.editing?.record_id}
        raeumeList={data.raeume}
        enablePhotoScan={AI_PHOTO_SCAN['Veranstaltungen']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Veranstaltungen']}
      />
      <RecordOverlayHost
        overlay={overlay}
        placement={options?.placement}
        size={options?.size}
        footer={options?.footer}
        render={(top) => {
          if (top.type === 'mitgliedsbeitraege') {
            return (
              <>
                <RecordHeader title={appLabel('mitgliedsbeitraege')} subtitle={top.record.fields.zahlungsdatum ? formatDate(top.record.fields.zahlungsdatum) : undefined} />
                <MitgliedsbeitraegeDetails
                  record={top.record}
                  mitgliederList={data.mitglieder}
                />
              </>
            );
          }
          if (top.type === 'mitglieder') {
            return (
              <>
                <RecordHeader title={top.record.fields.vorname ?? appLabel('mitglieder')} subtitle={top.record.fields.beitrittsdatum ? formatDate(top.record.fields.beitrittsdatum) : undefined} />
                <MitgliederDetails
                  record={top.record}
                  mitgliedsbeitraegeList={data.mitgliedsbeitraege}
                  onOpenMitgliedsbeitraege={(r) => detailMitgliedsbeitraege(r, true)}
                  onAddMitgliedsbeitraege={() => setMitgliedsbeitraegeDialog({ defaults: { mitglieder: [createRecordUrl(APP_IDS.MITGLIEDER, top.record.record_id)] } })}
                />
              </>
            );
          }
          if (top.type === 'geraeteverwaltung') {
            return (
              <>
                <RecordHeader title={top.record.fields.geraetename ?? appLabel('geraeteverwaltung')} subtitle={top.record.fields.anschaffungsdatum ? formatDate(top.record.fields.anschaffungsdatum) : undefined} />
                <GeraeteverwaltungDetails
                  record={top.record}
                />
              </>
            );
          }
          if (top.type === 'raeume') {
            return (
              <>
                <RecordHeader title={top.record.fields.raumname ?? appLabel('raeume')} subtitle={undefined} />
                <RaeumeDetails
                  record={top.record}
                  veranstaltungenList={data.veranstaltungen}
                  onOpenVeranstaltungen={(r) => detailVeranstaltungen(r, true)}
                  onAddVeranstaltungen={() => setVeranstaltungenDialog({ defaults: { raum: createRecordUrl(APP_IDS.RAEUME, top.record.record_id) } })}
                />
              </>
            );
          }
          if (top.type === 'veranstaltungen') {
            return (
              <>
                <RecordHeader title={top.record.fields.titel ?? appLabel('veranstaltungen')} subtitle={top.record.fields.datum ? formatDate(top.record.fields.datum) : undefined} />
                <VeranstaltungenDetails
                  record={top.record}
                  raeumeList={data.raeume}
                  onOpenRaeume={(r) => detailRaeume(r, true)}
                />
              </>
            );
          }
          return null;
        }}
        onEdit={(top) => {
          overlay.close();
          if (top.type === 'mitgliedsbeitraege') setMitgliedsbeitraegeDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'mitglieder') setMitgliederDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'geraeteverwaltung') setGeraeteverwaltungDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'raeume') setRaeumeDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'veranstaltungen') setVeranstaltungenDialog({ editing: top.record, defaults: top.record.fields });
        }}
      />
    </>
  );

  return {
    overlay,
    surfaces,
    mitgliedsbeitraege: {
      openCreate: (defaults?: MitgliedsbeitraegeDialogDefaults) => setMitgliedsbeitraegeDialog({ defaults }),
      openEdit: (record: Mitgliedsbeitraege) => setMitgliedsbeitraegeDialog({ editing: record, defaults: record.fields }),
      openDetail: (record: Mitgliedsbeitraege) => detailMitgliedsbeitraege(record, false),
    },
    mitglieder: {
      openCreate: (defaults?: MitgliederDialogDefaults) => setMitgliederDialog({ defaults }),
      openEdit: (record: Mitglieder) => setMitgliederDialog({ editing: record, defaults: record.fields }),
      openDetail: (record: Mitglieder) => detailMitglieder(record, false),
    },
    geraeteverwaltung: {
      openCreate: (defaults?: GeraeteverwaltungDialogDefaults) => setGeraeteverwaltungDialog({ defaults }),
      openEdit: (record: Geraeteverwaltung) => setGeraeteverwaltungDialog({ editing: record, defaults: record.fields }),
      openDetail: (record: Geraeteverwaltung) => detailGeraeteverwaltung(record, false),
    },
    raeume: {
      openCreate: (defaults?: RaeumeDialogDefaults) => setRaeumeDialog({ defaults }),
      openEdit: (record: Raeume) => setRaeumeDialog({ editing: record, defaults: record.fields }),
      openDetail: (record: Raeume) => detailRaeume(record, false),
    },
    veranstaltungen: {
      openCreate: (defaults?: VeranstaltungenDialogDefaults) => setVeranstaltungenDialog({ defaults }),
      openEdit: (record: Veranstaltungen) => setVeranstaltungenDialog({ editing: record, defaults: record.fields }),
      openDetail: (record: Veranstaltungen) => detailVeranstaltungen(record, false),
    },
    enriched: { mitgliedsbeitraege: enrichedMitgliedsbeitraege, mitglieder: data.mitglieder, geraeteverwaltung: data.geraeteverwaltung, raeume: data.raeume, veranstaltungen: enrichedVeranstaltungen },
  };
}
