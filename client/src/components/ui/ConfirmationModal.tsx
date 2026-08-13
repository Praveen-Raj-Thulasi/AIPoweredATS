import React from 'react';
import { AlertTriangle, Info, Trash2, CheckCircle2 } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success' | 'default';
  isLoading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'warning',
  isLoading = false,
}) => {
  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return <Trash2 className="w-6 h-6 text-zinc-300" />;
      case 'info':
        return <Info className="w-6 h-6 text-white" />;
      case 'success':
        return <CheckCircle2 className="w-6 h-6 text-white" />;
      case 'warning':
      default:
        return <AlertTriangle className="w-6 h-6 text-zinc-200" />;
    }
  };

  const getIconBg = () => {
    return 'bg-zinc-900 border-zinc-700';
  };

  const getConfirmButtonVariant = (): 'primary' | 'danger' => {
    switch (variant) {
      case 'danger':
        return 'danger';
      case 'success':
      case 'info':
      case 'warning':
      default:
        return 'primary';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="md">
      <div className="space-y-4 pt-1">
        <div className="flex items-start gap-3.5">
          <div className={`w-11 h-11 rounded-xl border flex items-center justify-center flex-shrink-0 ${getIconBg()}`}>
            {getIcon()}
          </div>
          <div>
            <p className="text-sm text-zinc-300 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            variant={getConfirmButtonVariant()}
            size="sm"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

