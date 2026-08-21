/**
 * Veranstaltung planen — 2-Schritt-Wizard.
 * Steps: 1) Raum wählen → 2) Veranstaltungsdetails eingeben & speichern.
 * Reads: raeume. Writes: veranstaltungen (createVeranstaltungenEntry).
 * Composes: IntentWizardShell, EntitySelectStep.
 */

import { useState } from 'react';
import { IntentWizardShell } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { useDashboardData } from '@/hooks/useDashboardData';
import { LivingAppsService, createRecordUrl } from '@/services/livingAppsService';
import { tx } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { IconBuilding, IconCalendar, IconCheck } from '@tabler/icons-react';

const RAUM_APP_ID = '6a86e67c8c67641c7cc5d89b';

export default function VeranstaltungPlanenPage() {
  const data = useDashboardData();
  const { raeume, loading, error, fetchAll } = data;

  const [step, setStep] = useState(1);
  const [selectedRaumId, setSelectedRaumId] = useState<string | null>(null);

  // Step 2 form state
  const [titel, setTitel] = useState('');
  const [datum, setDatum] = useState('');
  const [beschreibung, setBeschreibung] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const selectedRaum = raeume.find(r => r.record_id === selectedRaumId);

  const handleSave = async () => {
    if (!titel || !datum || !selectedRaumId) return;
    setSaving(true);
    setSaveError(null);
    try {
      await LivingAppsService.createVeranstaltungenEntry({
        titel,
        datum,
        beschreibung: beschreibung || undefined,
        raum: createRecordUrl(RAUM_APP_ID, selectedRaumId),
      });
      setDone(true);
    } catch {
      setSaveError(tx('Speichern fehlgeschlagen. Bitte erneut versuchen.'));
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setSelectedRaumId(null);
    setTitel('');
    setDatum('');
    setBeschreibung('');
    setSaveError(null);
    setDone(false);
  };

  return (
    <IntentWizardShell
      title={tx('Veranstaltung planen')}
      subtitle={tx('Raum wählen und Veranstaltung anlegen')}
      steps={[{ label: tx('Raum wählen') }, { label: tx('Details') }]}
      currentStep={step}
      onStepChange={setStep}
      loading={loading}
      error={error}
      onRetry={fetchAll}
    >
      {/* Step 1: Raum wählen */}
      {step === 1 && (
        <EntitySelectStep
          items={raeume.map(r => ({
            id: r.record_id,
            title: r.fields.raumname ?? tx('Unbenannter Raum'),
            subtitle: [
              r.fields.kapazitaet ? tx`Kapazität: ${r.fields.kapazitaet}` : null,
              r.fields.stockwerk ? tx`Stockwerk: ${r.fields.stockwerk}` : null,
            ]
              .filter(Boolean)
              .join(' · '),
            icon: <IconBuilding size={20} className="text-primary" />,
          }))}
          onSelect={(id) => {
            setSelectedRaumId(id);
            setStep(2);
          }}
          searchPlaceholder={tx('Raum suchen …')}
          emptyText={tx('Keine Räume gefunden')}
        />
      )}

      {/* Step 2: Veranstaltungsdetails */}
      {step === 2 && (
        selectedRaumId ? (
          done ? (
            <div className="flex flex-col items-center gap-6 py-12">
              <div className="rounded-full bg-emerald-100 p-4">
                <IconCheck size={40} className="text-emerald-600" />
              </div>
              <div className="text-center space-y-1">
                <h2 className="text-xl font-semibold">{tx('Veranstaltung angelegt!')}</h2>
                <p className="text-sm text-muted-foreground">
                  {tx`„${titel}" wurde erfolgreich erstellt.`}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={handleReset} variant="outline">
                  {tx('Weitere Veranstaltung planen')}
                </Button>
                <Button asChild>
                  <a href="#/">{tx('Zurück zum Dashboard')}</a>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 max-w-lg mx-auto">
              {/* Selected room summary */}
              <div className="rounded-2xl border bg-secondary/40 px-4 py-3 flex items-center gap-3">
                <IconBuilding size={20} className="text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {selectedRaum?.fields.raumname ?? tx('Raum')}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {[
                      selectedRaum?.fields.kapazitaet
                        ? tx`Kapazität: ${selectedRaum.fields.kapazitaet}`
                        : null,
                      selectedRaum?.fields.stockwerk
                        ? tx`Stockwerk: ${selectedRaum.fields.stockwerk}`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto shrink-0"
                  onClick={() => setStep(1)}
                >
                  {tx('Ändern')}
                </Button>
              </div>

              {/* Form fields */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium" htmlFor="titel">
                    {tx('Titel')} <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="titel"
                    value={titel}
                    onChange={e => setTitel(e.target.value)}
                    placeholder={tx('z. B. Mitgliederversammlung 2026')}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium" htmlFor="datum">
                    {tx('Datum & Uhrzeit')} <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <IconCalendar
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                    />
                    <Input
                      id="datum"
                      type="datetime-local"
                      value={datum}
                      onChange={e => setDatum(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium" htmlFor="beschreibung">
                    {tx('Beschreibung')}
                    <span className="text-muted-foreground text-xs font-normal ml-1">
                      ({tx('optional')})
                    </span>
                  </label>
                  <Textarea
                    id="beschreibung"
                    value={beschreibung}
                    onChange={e => setBeschreibung(e.target.value)}
                    placeholder={tx('Was sollen die Teilnehmer wissen?')}
                    rows={3}
                  />
                </div>
              </div>

              {saveError && (
                <p className="text-sm text-destructive">{saveError}</p>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="sm:w-auto w-full"
                >
                  {tx('Zurück')}
                </Button>
                <Button
                  disabled={!titel || !datum || saving}
                  onClick={handleSave}
                  className="sm:w-auto w-full"
                >
                  {saving ? tx('Wird gespeichert …') : tx('Veranstaltung anlegen')}
                </Button>
              </div>
            </div>
          )
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
