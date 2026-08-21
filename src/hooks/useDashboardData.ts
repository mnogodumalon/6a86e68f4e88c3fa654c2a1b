import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Mitgliedsbeitraege, Mitglieder, Geraeteverwaltung, Raeume, Veranstaltungen } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';
import { t } from '@/i18n';

/** Dashboard data + the OPTIMISTIC-WRITE API.
 *
 *  The per-entity setters (`set<Entity>`) are exported for exactly one job:
 *  optimistic updates on drag writes (onEventDrop / onEventResize /
 *  onCardMove). Call the setter FIRST — the bar/card lands instantly — then
 *  fire the PATCH in the background and call `fetchAll()` ONLY in the catch.
 *  Never await the PATCH before updating state (the UI freezes for the full
 *  round-trip on every drag) and never refetch after a successful write.
 *  There is no other mechanism (no `__optimistic`, no `mutate`).
 */
export function useDashboardData() {
  const [mitgliedsbeitraege, setMitgliedsbeitraege] = useState<Mitgliedsbeitraege[]>([]);
  const [mitglieder, setMitglieder] = useState<Mitglieder[]>([]);
  const [geraeteverwaltung, setGeraeteverwaltung] = useState<Geraeteverwaltung[]>([]);
  const [raeume, setRaeume] = useState<Raeume[]>([]);
  const [veranstaltungen, setVeranstaltungen] = useState<Veranstaltungen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const [mitgliedsbeitraegeData, mitgliederData, geraeteverwaltungData, raeumeData, veranstaltungenData] = await Promise.all([
        LivingAppsService.getMitgliedsbeitraege(),
        LivingAppsService.getMitglieder(),
        LivingAppsService.getGeraeteverwaltung(),
        LivingAppsService.getRaeume(),
        LivingAppsService.getVeranstaltungen(),
      ]);
      setMitgliedsbeitraege(mitgliedsbeitraegeData);
      setMitglieder(mitgliederData);
      setGeraeteverwaltung(geraeteverwaltungData);
      setRaeume(raeumeData);
      setVeranstaltungen(veranstaltungenData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(t('data_load_failed')));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Silent background refresh (no loading state change → no flicker)
  useEffect(() => {
    async function silentRefresh() {
      try {
        const [mitgliedsbeitraegeData, mitgliederData, geraeteverwaltungData, raeumeData, veranstaltungenData] = await Promise.all([
          LivingAppsService.getMitgliedsbeitraege(),
          LivingAppsService.getMitglieder(),
          LivingAppsService.getGeraeteverwaltung(),
          LivingAppsService.getRaeume(),
          LivingAppsService.getVeranstaltungen(),
        ]);
        setMitgliedsbeitraege(mitgliedsbeitraegeData);
        setMitglieder(mitgliederData);
        setGeraeteverwaltung(geraeteverwaltungData);
        setRaeume(raeumeData);
        setVeranstaltungen(veranstaltungenData);
      } catch {
        // silently ignore — stale data is better than no data
      }
    }
    function handleRefresh() { void silentRefresh(); }
    window.addEventListener('dashboard-refresh', handleRefresh);
    return () => window.removeEventListener('dashboard-refresh', handleRefresh);
  }, []);

  const mitgliederMap = useMemo(() => {
    const m = new Map<string, Mitglieder>();
    mitglieder.forEach(r => m.set(r.record_id, r));
    return m;
  }, [mitglieder]);

  const raeumeMap = useMemo(() => {
    const m = new Map<string, Raeume>();
    raeume.forEach(r => m.set(r.record_id, r));
    return m;
  }, [raeume]);

  return { mitgliedsbeitraege, setMitgliedsbeitraege, mitglieder, setMitglieder, geraeteverwaltung, setGeraeteverwaltung, raeume, setRaeume, veranstaltungen, setVeranstaltungen, loading, error, fetchAll, mitgliederMap, raeumeMap };
}