import type { Mitgliedsbeitraege, Mitglieder } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { APP_IDS } from '@/types/app';
import { AttachmentsSection } from '@/components/AttachmentsSection';
import { Badge } from '@/components/ui/badge';
import { IconPencil } from '@tabler/icons-react';
import { t, appLabel, fieldLabel, lookupLabel, dateFnsLocale, dateFormat } from '@/i18n';
import { format, parseISO } from 'date-fns';

function formatDate(d?: string) {
  if (!d) return '—';
  try { return format(parseISO(d), dateFormat(), { locale: dateFnsLocale() }); } catch { return d; }
}

interface MitgliedsbeitraegeViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: Mitgliedsbeitraege | null;
  onEdit: (record: Mitgliedsbeitraege) => void;
  mitgliederList: Mitglieder[];
}

export function MitgliedsbeitraegeViewDialog({ open, onClose, record, onEdit, mitgliederList }: MitgliedsbeitraegeViewDialogProps) {
  function getMitgliederDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return mitgliederList.find(r => r.record_id === id)?.fields.vorname ?? '—';
  }

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('view_entity', { entity: appLabel('mitgliedsbeitraege') })}</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <IconPencil className="h-3.5 w-3.5 mr-1.5" />
            {t('edit_button')}
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('mitgliedsbeitraege', 'betrag')}</Label>
            <p className="text-sm">{record.fields.betrag ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('mitgliedsbeitraege', 'zahlungsdatum')}</Label>
            <p className="text-sm">{formatDate(record.fields.zahlungsdatum)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('mitgliedsbeitraege', 'mitglieder')}</Label>
            {Array.isArray(record.fields.mitglieder) && record.fields.mitglieder.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {record.fields.mitglieder.map((url: any, i: number) => (
                  <span key={i} className="inline-flex items-center bg-secondary border border-[#bfdbfe] text-[#2563eb] rounded-[10px] px-2 py-1 text-sm font-medium">{getMitgliederDisplayName(url)}</span>
                ))}
              </div>
            ) : <p className="text-sm">—</p>}
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('mitgliedsbeitraege', 'zahlungsstatus')}</Label>
            <Badge variant="secondary">{lookupLabel('mitgliedsbeitraege', 'zahlungsstatus', record.fields.zahlungsstatus?.key) ?? record.fields.zahlungsstatus?.label ?? '—'}</Badge>
          </div>
          <div className="pt-2 border-t border-border">
            <AttachmentsSection appId={APP_IDS.MITGLIEDSBEITRAEGE} recordId={record.record_id} readOnly />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}