import { Injectable, signal } from '@angular/core';

export interface DialogOptions {
  title: string;
  message: string;
  type: 'info' | 'confirm' | 'success';
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  imageUrl?: string;
  thirdOption?: {
    text: string;
    callback: () => void;
  };
  buttonColors?: {
    confirm?: string;
    cancel?: string;
    third?: string;
    confirmTextColor?: string;
    cancelTextColor?: string;
    thirdTextColor?: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class DialogService {
  activeDialog = signal<DialogOptions | null>(null);

  show(options: DialogOptions) {
    this.activeDialog.set(options);
  }

  alert(title: string, message: string, type: 'info' | 'success' = 'info', onConfirm?: () => void, imageUrl?: string) {
    this.show({
      title,
      message,
      type,
      confirmText: 'OK',
      onConfirm,
      imageUrl
    });
  }

  confirm(title: string, message: string, onConfirm: () => void, onCancel?: () => void) {
    this.show({
      title,
      message,
      type: 'confirm',
      confirmText: 'Yes, proceed',
      cancelText: 'Cancel',
      onConfirm,
      onCancel
    });
  }

  close() {
    this.activeDialog.set(null);
  }

  showPaymentMethod(options: {
    studentName: string;
    onWave: () => void;
    onOrangeMoney: () => void;
  }) {
    this.show({
      title: 'Payment Method',
      message: `Select the payment method used by ${options.studentName}:`,
      type: 'confirm',
      confirmText: 'Wave',
      cancelText: 'Orange Money',
      buttonColors: {
        confirm: '#1D4ED8',
        cancel: '#EA580C',
        cancelTextColor: '#FFFFFF'
      },
      onConfirm: () => options.onWave(),
      onCancel: () => options.onOrangeMoney()
    });
  }
}
