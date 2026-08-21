/**
 * Beitrag erfassen — 2-Schritt-Wizard.
 * Steps: 1) Mitglieder wählen (multi-select) → 2) Zahlungsdetails eingeben & speichern.
 * Reads: mitglieder. Writes: mitgliedsbeitraege (createMitgliedsbeitraegeEntry).
 * Composes: IntentWizardShell, EntitySelectStep.
 */

import { useState } from 'react';
import { format } from 'date-fns';
import { IconCurrencyEuro, IconCalendar, IconCheck, IconUsers } from '@tabler/icons-react';
import { tx } from '@/i18n';
import { useDashboardData } from '@/hooks/useDashboardData';
import { LivingAppsService, createRecordUrl } from '@/services/livingAppsService';
import { LOOKUP_OPTIONS } from '@/types/app';
import { IntentWizardShell } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { StatusBadge } from '@/components/blocks/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';

export default function BeitragErfassenPage() {
  const data = useDashboardData();
  const { mitglieder, loading, error, fetchAll } = data;

  const ZAHLUNGSSTATUS_OPTIONS = LOOKUP_OPTIONS['mitgliedsbeitraege']?.['zahlungsstatus'] ?? [];

  const [step, setStep] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Step 2 form state
  const [betrag, setBetrag] = useState('');
  const [zahlungsdatum, setZahlungsdatum] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [zahlungsstatusKey, setZahlungsstatusKey] = useState(ZAHLUNGSSTATUS_OPTIONS[0]?.key ?? 'offen');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const toggleMember = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!betrag || !zahlungsdatum || selectedIds.size === 0) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const urls = Array.from(selectedIds).map(id =>
        createRecordUrl('6a86e67954b55a30ffb358d9', id)
      );
      await LivingAppsService.createMitgliedsbeitraegeEntry({
        betrag: Number(betrag),
        zahlungsdatum: zahlungsdatum,
        mitglieder: urls,
        zahlungsstatus: zahlungsstatusKey,
      });
      await fetchAll();
      setSuccess(true);
    } catch (e) {
      setSubmitError(tx('Fehler beim Speichern. Bitte erneut versuchen.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setSelectedIds(new Set());
    setBetrag('');
    setZahlungsdatum(format(new Date(), 'yyyy-MM-dd'));
    setZahlungsstatusKey(ZAHLUNGSSTATUS_OPTIONS[0]?.key ?? 'offen');
    setSubmitError(null);
    setSuccess(false);
  };

  if (success) {
    return (
      <IntentWizardShell
        title={tx('Beitrag erfassen')}
        subtitle={tx('Mitgliedsbeitrag wurde erfolgreich gespeichert')}
        steps={[{ label: tx('Mitglieder') }, { label: tx('Zahlungsdetails') }]}
        currentStep={2}
        onStepChange={setStep}
        loading={loading}
        error={error}
        onRetry={fetchAll}
      >
        <div className="flex flex-col items-center py-12 space-y-6">
          <div className="rounded-full bg-emerald-100 p-4">
            <IconCheck size={40} className="text-emerald-600" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold">{tx('Beitrag erfasst!')}</h2>
            <p className="text-muted-foreground">
              {tx('Der Beitrag wurde erfolgreich für')} {selectedIds.size} {tx('Mitglied(er) gespeichert.')}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={handleReset} variant="outline">
              {tx('Weiteren Beitrag erfassen')}
            </Button>
            <Button asChild>
              <a href="#/">{tx('Zurück zum Dashboard')}</a>
            </Button>
          </div>
        </div>
      </IntentWizardShell>
    );
  }

  return (
    <IntentWizardShell
      title={tx('Beitrag erfassen')}
      subtitle={tx('Mitgliedsbeitrag anlegen — Schritt für Schritt')}
      steps={[{ label: tx('Mitglieder') }, { label: tx('Zahlungsdetails') }]}
      currentStep={step}
      onStepChange={setStep}
      loading={loading}
      error={error}
      onRetry={fetchAll}
    >
      {/* Step 1: Mitglieder wählen */}
      {step === 1 && (
        <div className="space-y-4">
          <EntitySelectStep
            items={mitglieder.map(m => ({
              id: m.record_id,
              title: [m.fields.vorname, m.fields.nachname].filter(Boolean).join(' ') || m.record_id,
              subtitle: m.fields.mitgliedsstatus?.label,
              status: m.fields.mitgliedsstatus
                ? { key: m.fields.mitgliedsstatus.key, label: m.fields.mitgliedsstatus.label }
                : undefined,
              icon: <IconUsers size={20} className="text-primary" />,
            }))}
            onSelect={(id) => {
              toggleMember(id);
            }}
            searchPlaceholder={tx('Mitglied suchen …')}
            emptyText={tx('Keine Mitglieder gefunden')}
          />

          {/* Selected members summary */}
          {selectedIds.size > 0 && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <IconUsers size={16} className="text-primary shrink-0" />
                    <span className="text-sm font-medium">
                      {selectedIds.size} {tx('Mitglied(er) ausgewählt')}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {Array.from(selectedIds).map(id => {
                      const m = mitglieder.find(x => x.record_id === id);
                      if (!m) return null;
                      const name = [m.fields.vorname, m.fields.nachname].filter(Boolean).join(' ') || id;
                      return (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary font-medium cursor-pointer"
                          role="button"
                          onClick={() => toggleMember(id)}
                          title={tx('Abwählen')}
                        >
                          {name}
                          <span className="opacity-60">×</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end pt-2">
            <Button
              disabled={selectedIds.size === 0}
              onClick={() => setStep(2)}
            >
              {tx('Weiter zu Zahlungsdetails')}
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Zahlungsdetails */}
      {step === 2 && (
        selectedIds.size > 0 ? (
          <div className="space-y-6 max-w-lg">
            {/* Context: selected members */}
            <Card className="bg-secondary/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <IconUsers size={16} className="text-muted-foreground shrink-0" />
                  <span className="text-sm text-muted-foreground font-medium">
                    {tx('Beitrag für')} {selectedIds.size} {tx('Mitglied(er)')}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {Array.from(selectedIds).map(id => {
                    const m = mitglieder.find(x => x.record_id === id);
                    if (!m) return null;
                    const name = [m.fields.vorname, m.fields.nachname].filter(Boolean).join(' ') || id;
                    return (
                      <span key={id} className="inline-flex items-center gap-1">
                        <span className="text-sm font-medium">{name}</span>
                        {m.fields.mitgliedsstatus && (
                          <StatusBadge
                            statusKey={m.fields.mitgliedsstatus.key}
                            label={m.fields.mitgliedsstatus.label}
                          />
                        )}
                      </span>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Betrag */}
            <div className="space-y-2">
              <Label htmlFor="betrag" className="flex items-center gap-1.5">
                <IconCurrencyEuro size={14} className="shrink-0" />
                {tx('Betrag')}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="betrag"
                type="number"
                min="0"
                step="0.01"
                value={betrag}
                onChange={e => setBetrag(e.target.value)}
                placeholder="0.00"
                className="max-w-xs"
              />
            </div>

            {/* Zahlungsdatum */}
            <div className="space-y-2">
              <Label htmlFor="zahlungsdatum" className="flex items-center gap-1.5">
                <IconCalendar size={14} className="shrink-0" />
                {tx('Zahlungsdatum')}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="zahlungsdatum"
                type="date"
                value={zahlungsdatum}
                onChange={e => setZahlungsdatum(e.target.value)}
                className="max-w-xs"
              />
            </div>

            {/* Zahlungsstatus */}
            <div className="space-y-2">
              <Label htmlFor="zahlungsstatus">{tx('Zahlungsstatus')}</Label>
              <Select value={zahlungsstatusKey} onValueChange={setZahlungsstatusKey}>
                <SelectTrigger id="zahlungsstatus" className="max-w-xs">
                  <SelectValue placeholder={tx('Status wählen')} />
                </SelectTrigger>
                <SelectContent>
                  {ZAHLUNGSSTATUS_OPTIONS.map(opt => (
                    <SelectItem key={opt.key} value={opt.key}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {submitError && (
              <p className="text-sm text-destructive">{submitError}</p>
            )}

            <div className="flex flex-wrap gap-3 pt-2">
              <Button variant="outline" onClick={() => setStep(1)} disabled={submitting}>
                {tx('Zurück')}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting || !betrag || !zahlungsdatum}
              >
                {submitting ? tx('Wird gespeichert …') : tx('Beitrag speichern')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 space-y-3">
            <p className="text-sm text-muted-foreground">
              {tx('Dieser Schritt braucht die Auswahl aus Schritt 1.')}
            </p>
            <Button variant="outline" onClick={() => setStep(1)}>
              {tx('Neu starten')}
            </Button>
          </div>
        )
      )}
    </IntentWizardShell>
  );
}
