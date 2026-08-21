import { useMemo, useState } from 'react';
import { format, parseISO, isAfter, isBefore, startOfDay, endOfDay, addDays } from 'date-fns';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useEntityCrud } from '@/components/EntityCrud';
import { DashboardSkeleton, DashboardError } from '@/components/DashboardStates';
import { DashboardGrid } from '@/components/DashboardGrid';
import { WorkList } from '@/components/WorkList';
import { StatStrip, StatStripItem } from '@/components/StatCard';
import { CalendarWidget, type CalendarEvent, type CalendarTone } from '@/components/widgets/CalendarWidget';
import { tx, appLabel } from '@/i18n';
import { formatDate, formatCurrency, lookupKey } from '@/lib/formatters';
import { lookupOption } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';
import { useClock, gruss, namen, undoToast } from '@/lib/polish';
import { dateFnsLocale } from '@/i18n';
import { IconCalendarEvent, IconUsers, IconCurrencyEuro, IconAlertCircle, IconPlus } from '@tabler/icons-react';

export default function DashboardOverview() {
  const data = useDashboardData();
  const {
    mitgliedsbeitraege, setMitgliedsbeitraege,
    mitglieder,
    veranstaltungen, setVeranstaltungen,
    raeume,
    raeumeMap,
    loading, error, fetchAll,
  } = data;

  const crud = useEntityCrud(data, {
    footer: (top) => {
      if (top.type === 'mitgliedsbeitraege') {
        const rec = top.record;
        const status = lookupKey(rec.fields.zahlungsstatus);
        if (status === 'offen') {
          return {
            label: tx('Als bezahlt markieren'),
            onClick: async () => {
              const prev = rec.fields.zahlungsstatus;
              const next = lookupOption('mitgliedsbeitraege', 'zahlungsstatus', 'bezahlt');
              setMitgliedsbeitraege(bs =>
                bs.map(b => b.record_id === rec.record_id ? { ...b, fields: { ...b.fields, zahlungsstatus: next } } : b)
              );
              undoToast(tx`${rec.fields.betrag != null ? formatCurrency(rec.fields.betrag) : ''} — als bezahlt markiert`, async () => {
                setMitgliedsbeitraege(bs =>
                  bs.map(b => b.record_id === rec.record_id ? { ...b, fields: { ...b.fields, zahlungsstatus: prev } } : b)
                );
                await LivingAppsService.updateMitgliedsbeitraegeEntry(rec.record_id, { zahlungsstatus: 'offen' });
              });
              await LivingAppsService.updateMitgliedsbeitraegeEntry(rec.record_id, { zahlungsstatus: 'bezahlt' });
            },
          };
        }
      }
      return undefined;
    },
  });

  const enrichedVeranstaltungen = crud.enriched.veranstaltungen;
  const enrichedMitgliedsbeitraege = crud.enriched.mitgliedsbeitraege;

  const clock = useClock();
  const [filterActive, setFilterActive] = useState<'offen' | 'aktiv' | null>(null);

  const today = format(clock, 'yyyy-MM-dd');
  const todayStart = startOfDay(clock);
  const weekEnd = endOfDay(addDays(clock, 7));

  // Veranstaltungen als CalendarEvents
  const events = useMemo<CalendarEvent[]>(() => {
    return enrichedVeranstaltungen
      .filter(v => !!v.fields.datum)
      .map(v => {
        const tone: CalendarTone = v.fields.datum && v.fields.datum.slice(0, 10) === today
          ? 'primary'
          : v.fields.datum && isAfter(parseISO(v.fields.datum), clock)
          ? 'default'
          : 'default';
        return {
          id: `veranstaltungen:${v.record_id}`,
          start: v.fields.datum!,
          title: v.fields.titel ?? tx('Ohne Titel'),
          subtitle: v.raumName || undefined,
          tone,
        };
      });
  }, [enrichedVeranstaltungen, today, clock]);

  // Beiträge — offen
  const offeneBeitraege = useMemo(
    () => enrichedMitgliedsbeitraege.filter(b => lookupKey(b.fields.zahlungsstatus) === 'offen'),
    [enrichedMitgliedsbeitraege]
  );

  // Aktive Mitglieder
  const aktiveMitglieder = useMemo(
    () => mitglieder.filter(m => lookupKey(m.fields.mitgliedsstatus) === 'aktiv'),
    [mitglieder]
  );

  // Veranstaltungen diese Woche
  const veranstaltungenDieseWoche = useMemo(
    () => enrichedVeranstaltungen.filter(v => {
      if (!v.fields.datum) return false;
      const d = parseISO(v.fields.datum);
      return isAfter(d, todayStart) && isBefore(d, weekEnd);
    }),
    [enrichedVeranstaltungen, todayStart, weekEnd]
  );

  // Kontext-Satz: heute anfangende Veranstaltungen
  const heuteVeranstaltungen = useMemo(
    () => enrichedVeranstaltungen.filter(v => v.fields.datum && v.fields.datum.slice(0, 10) === today),
    [enrichedVeranstaltungen, today]
  );

  // Neue Mitglieder (letzte 30 Tage)
  const neueMitglieder = useMemo(() => {
    const vor30 = format(addDays(clock, -30), 'yyyy-MM-dd');
    return mitglieder.filter(m => m.fields.beitrittsdatum && m.fields.beitrittsdatum >= vor30);
  }, [mitglieder, clock]);

  // Schnell-Bezahlen Helper für WorkList
  const markiereAlsBezahlt = async (beitrag: typeof enrichedMitgliedsbeitraege[0]) => {
    const prev = beitrag.fields.zahlungsstatus;
    const next = lookupOption('mitgliedsbeitraege', 'zahlungsstatus', 'bezahlt');
    setMitgliedsbeitraege(bs =>
      bs.map(b => b.record_id === beitrag.record_id ? { ...b, fields: { ...b.fields, zahlungsstatus: next } } : b)
    );
    undoToast(tx`${beitrag.mitgliederName || formatCurrency(beitrag.fields.betrag)} — als bezahlt markiert`, async () => {
      setMitgliedsbeitraege(bs =>
        bs.map(b => b.record_id === beitrag.record_id ? { ...b, fields: { ...b.fields, zahlungsstatus: prev } } : b)
      );
      await LivingAppsService.updateMitgliedsbeitraegeEntry(beitrag.record_id, { zahlungsstatus: 'offen' });
    });
    try {
      await LivingAppsService.updateMitgliedsbeitraegeEntry(beitrag.record_id, { zahlungsstatus: 'bezahlt' });
    } catch {
      fetchAll();
    }
  };

  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} onRetry={fetchAll} />;

  // Kontext-Satz aufbauen
  const kontextSatz = heuteVeranstaltungen.length > 0
    ? tx`Heute: ${namen(heuteVeranstaltungen.map(v => v.fields.titel ?? ''))} — ${veranstaltungenDieseWoche.length.toString()} ${tx('diese Woche')}.`
    : veranstaltungenDieseWoche.length > 0
    ? tx`Diese Woche: ${namen(veranstaltungenDieseWoche.map(v => v.fields.titel ?? ''))} — ${offeneBeitraege.length.toString()} ${tx('Beiträge offen')}.`
    : tx`${aktiveMitglieder.length.toString()} ${tx('aktive Mitglieder')} — ${offeneBeitraege.length.toString()} ${tx('Beiträge offen')}.`;

  const isFiltered = filterActive !== null;
  const filteredOffeneBeitraege = filterActive === 'offen' ? offeneBeitraege : enrichedMitgliedsbeitraege.filter(b => lookupKey(b.fields.zahlungsstatus) === 'offen');

  return (
    <div className="space-y-6">
      {/* Seiten-Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{gruss(clock)}</h1>
          <p className="text-muted-foreground mt-1">{kontextSatz}</p>
        </div>
        <button
          onClick={() => crud.veranstaltungen.openCreate({ datum: format(clock, "yyyy-MM-dd'T'HH:mm") })}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shrink-0"
        >
          <IconPlus size={16} className="shrink-0" />
          {tx('Veranstaltung')}
        </button>
      </div>

      <DashboardGrid
        variant="wide"
        kpis={
          <StatStrip>
            <StatStripItem
              title={tx('Veranstaltungen diese Woche')}
              value={veranstaltungenDieseWoche.length}
              icon={<IconCalendarEvent size={16} />}
              tone={veranstaltungenDieseWoche.length > 0 ? 'primary' : 'default'}
            />
            <StatStripItem
              title={tx('Aktive Mitglieder')}
              value={aktiveMitglieder.length}
              icon={<IconUsers size={16} />}
              tone="default"
              onClick={() => setFilterActive(f => f === 'aktiv' ? null : 'aktiv')}
              active={filterActive === 'aktiv'}
            />
            <StatStripItem
              title={tx('Offene Beiträge')}
              value={offeneBeitraege.length}
              icon={<IconCurrencyEuro size={16} />}
              tone={offeneBeitraege.length > 0 ? 'warning' : 'default'}
              onClick={() => setFilterActive(f => f === 'offen' ? null : 'offen')}
              active={filterActive === 'offen'}
            />
            <StatStripItem
              title={tx('Neue Mitglieder (30 Tage)')}
              value={neueMitglieder.length}
              icon={<IconUsers size={16} />}
              tone={neueMitglieder.length > 0 ? 'success' : 'default'}
            />
          </StatStrip>
        }
        primary={
          <CalendarWidget
            events={events}
            locale={dateFnsLocale()}
            onEventClick={ev => {
              const id = ev.id.split(':')[1];
              const rec = veranstaltungen.find(v => v.record_id === id);
              if (rec) crud.veranstaltungen.openDetail(rec);
            }}
            onEmptyClick={date => {
              crud.veranstaltungen.openCreate({ datum: format(date, "yyyy-MM-dd'T'HH:mm") });
            }}
            onEventDrop={async (eventId, newStart) => {
              const id = eventId.split(':')[1];
              if (!id) return;
              const prev = veranstaltungen.find(v => v.record_id === id);
              if (!prev) return;
              const prevDatum = prev.fields.datum;
              setVeranstaltungen(vs =>
                vs.map(v => v.record_id === id ? { ...v, fields: { ...v.fields, datum: newStart } } : v)
              );
              undoToast(tx`${prev.fields.titel ?? ''} — verschoben`, async () => {
                setVeranstaltungen(vs =>
                  vs.map(v => v.record_id === id ? { ...v, fields: { ...v.fields, datum: prevDatum } } : v)
                );
                await LivingAppsService.updateVeranstaltungenEntry(id, { datum: prevDatum });
              });
              try {
                await LivingAppsService.updateVeranstaltungenEntry(id, { datum: newStart });
              } catch {
                fetchAll();
              }
            }}
          />
        }
        aside={
          <>
            <WorkList
              title={tx('Offene Beiträge')}
              items={(isFiltered && filterActive === 'offen' ? offeneBeitraege : offeneBeitraege).slice(0, 8).map(b => ({
                id: b.record_id,
                title: b.mitgliederName || tx('Unbekanntes Mitglied'),
                secondLine: (
                  <span>
                    <span className="font-medium text-amber-600">{tx('Offen')}</span>
                    {b.fields.betrag != null && (
                      <span className="text-muted-foreground"> · {formatCurrency(b.fields.betrag)}</span>
                    )}
                    {b.fields.zahlungsdatum && (
                      <span className="text-muted-foreground"> · {formatDate(b.fields.zahlungsdatum)}</span>
                    )}
                  </span>
                ),
                action: {
                  label: tx('Bezahlt'),
                  onClick: () => void markiereAlsBezahlt(b),
                },
              }))}
              onItemClick={id => {
                const rec = mitgliedsbeitraege.find(b => b.record_id === id);
                if (rec) crud.mitgliedsbeitraege.openDetail(rec);
              }}
              empty={{
                text: tx('Alle Beiträge sind bezahlt.'),
                action: {
                  label: tx('Beitrag erfassen'),
                  onClick: () => crud.mitgliedsbeitraege.openCreate({}),
                },
              }}
            />
            <WorkList
              title={tx('Mitglieder')}
              items={mitglieder.slice(0, 6).map(m => ({
                id: m.record_id,
                title: [m.fields.vorname, m.fields.nachname].filter(Boolean).join(' ') || tx('Ohne Name'),
                secondLine: (
                  <span>
                    {m.fields.mitgliedsstatus?.label && (
                      <span className={
                        lookupKey(m.fields.mitgliedsstatus) === 'aktiv'
                          ? 'font-medium text-emerald-600'
                          : lookupKey(m.fields.mitgliedsstatus) === 'ausgetreten'
                          ? 'text-muted-foreground'
                          : 'font-medium text-amber-600'
                      }>{m.fields.mitgliedsstatus.label}</span>
                    )}
                    {m.fields.beitrittsdatum && (
                      <span className="text-muted-foreground"> · {tx('seit')} {formatDate(m.fields.beitrittsdatum)}</span>
                    )}
                  </span>
                ),
              }))}
              onItemClick={id => {
                const rec = mitglieder.find(m => m.record_id === id);
                if (rec) crud.mitglieder.openDetail(rec);
              }}
              empty={{
                text: tx('Noch keine Mitglieder erfasst.'),
                action: {
                  label: tx('Mitglied hinzufügen'),
                  onClick: () => crud.mitglieder.openCreate({}),
                },
              }}
            />
          </>
        }
      />

      {/* Leerstand-CTA wenn keine Daten */}
      {veranstaltungen.length === 0 && mitglieder.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <IconCalendarEvent size={48} className="text-muted-foreground" stroke={1.5} />
          <div>
            <h3 className="font-semibold text-foreground mb-1">{tx('Willkommen im Vereinsmanagement')}</h3>
            <p className="text-muted-foreground text-sm">{tx('Lege deine erste Veranstaltung oder dein erstes Mitglied an.')}</p>
          </div>
          <div className="flex gap-2 flex-wrap justify-center">
            <button
              onClick={() => crud.veranstaltungen.openCreate({})}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {tx('Erste Veranstaltung anlegen')}
            </button>
            <button
              onClick={() => crud.mitglieder.openCreate({})}
              className="rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
            >
              {tx('Erstes Mitglied aufnehmen')}
            </button>
          </div>
        </div>
      )}

      {crud.surfaces}
    </div>
  );
}
