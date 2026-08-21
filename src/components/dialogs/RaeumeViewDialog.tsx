import type { Raeume } from '@/types/app';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { APP_IDS } from '@/types/app';
import { AttachmentsSection } from '@/components/AttachmentsSection';
import { IconPencil } from '@tabler/icons-react';
import { t, appLabel, fieldLabel, lookupLabel } from '@/i18n';

interface RaeumeViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: Raeume | null;
  onEdit: (record: Raeume) => void;
}

export function RaeumeViewDialog({ open, onClose, record, onEdit }: RaeumeViewDialogProps) {
  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('view_entity', { entity: appLabel('raeume') })}</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <IconPencil className="h-3.5 w-3.5 mr-1.5" />
            {t('edit_button')}
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('raeume', 'raumname')}</Label>
            <p className="text-sm">{record.fields.raumname ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('raeume', 'kapazitaet')}</Label>
            <p className="text-sm">{record.fields.kapazitaet ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('raeume', 'ausstattung')}</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.ausstattung ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('raeume', 'stockwerk')}</Label>
            <p className="text-sm">{record.fields.stockwerk ?? '—'}</p>
          </div>
          <div className="pt-2 border-t border-border">
            <AttachmentsSection appId={APP_IDS.RAEUME} recordId={record.record_id} readOnly />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}