import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatabaseService, Payment, UserProfile } from '../../services/database.service';
import { DialogService } from '../../services/dialog.service';

@Component({
  selector: 'app-teacher-payments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <!-- FINANCIAL INDICATORS -->
      <div class="grid3">
        <div class="mcard">
          <div class="mlabel">Collected ({{ getCurrentMonthAbbr() }})</div>
          <div class="mval" style="color:#059669">{{ collectedAmount() | number }} CFA</div>
          <div class="msub">Gross earnings</div>
        </div>
        <div class="mcard">
          <div class="mlabel">Pending</div>
          <div class="mval" style="color:#EF4444">{{ pendingAmount() | number }} CFA</div>
          <div class="msub">{{ pendingCount() }} students overdue</div>
        </div>
        <div class="mcard">
          <div class="mlabel">Paid Ratio</div>
          <div class="mval">{{ paidCount() }}/{{ totalCount() }}</div>
          <div class="msub">Cohort ratio</div>
        </div>
      </div>

      <!-- ISSUE NEW INVOICE CARD -->
      <div class="card" style="margin-top:16px">
        <h3 class="st" style="font-size:15px; margin-bottom:12px; color:#4F46E5">
          <i class="ti ti-receipt" style="margin-right:6px"></i> Issue New Invoice
        </h3>
        
        <div style="display:flex; gap:12px; flex-wrap:wrap; align-items:flex-end">
          <div class="input-row" style="flex:1; min-width:180px; margin-bottom:0">
            <label for="invStudent" class="form-lbl" style="font-size:11px">Student</label>
            <select id="invStudent" [(ngModel)]="invoiceStudentId" class="form-select" style="height:38px; font-size:12px; width:100%; border:1px solid var(--border); border-radius:6px; padding:0 10px; background:var(--surface-1); color:var(--text-primary)">
              <option value="">-- Select Student --</option>
              @for (user of studentUsers(); track user.id) {
                <option [value]="user.id">{{ user.name }} ({{ user.level }})</option>
              }
            </select>
          </div>

          <div class="input-row" style="flex:1.5; min-width:200px; margin-bottom:0">
            <label for="invDesc" class="form-lbl" style="font-size:11px">Invoice Details</label>
            <input id="invDesc" type="text" [(ngModel)]="invoiceDescription" placeholder="e.g., Monthly tuition - July" class="form-input" style="height:38px; font-size:12px; width:100%; border:1px solid var(--border); border-radius:6px; padding:0 10px; background:var(--surface-1); color:var(--text-primary)" />
          </div>

          <div class="input-row" style="flex:1; min-width:130px; margin-bottom:0">
            <label for="invAmount" class="form-lbl" style="font-size:11px">Amount (CFA)</label>
            <input id="invAmount" type="number" [(ngModel)]="invoiceAmount" class="form-input" style="height:38px; font-size:12px; width:100%; border:1px solid var(--border); border-radius:6px; padding:0 10px; background:var(--surface-1); color:var(--text-primary)" />
          </div>

          <div class="input-row" style="flex:1; min-width:130px; margin-bottom:0">
            <label for="invDue" class="form-lbl" style="font-size:11px">Due Date</label>
            <input id="invDue" type="date" [(ngModel)]="invoiceDueDate" class="form-input" style="height:38px; font-size:12px; width:100%; border:1px solid var(--border); border-radius:6px; padding:0 10px; background:var(--surface-1); color:var(--text-primary)" />
          </div>

          <button class="btn-p" [disabled]="!invoiceStudentId || !invoiceDescription || !invoiceAmount" (click)="issueInvoice()" style="height:38px; padding:0 20px; font-size:12px; font-weight:600">
            Issue Invoice
          </button>
        </div>
      </div>

      <!-- PENDING PAYMENTS -->
      <div class="card" style="margin-top:16px">
        <h3 class="st" style="font-size:15px; margin-bottom:12px; color:#EF4444">Pending Invoices</h3>
        @if (pendingPayments().length === 0) {
          <div style="font-size:13px; color:var(--text-secondary); text-align:center; padding:16px 0">
            No pending invoices! All student accounts are fully settled.
          </div>
        } @else {
          <table style="width:100%; border-collapse:collapse; font-size:12px">
            <thead>
              <tr style="text-align:left; border-bottom:2px solid var(--border-weak); color:var(--text-muted)">
                <th style="padding:8px">Student</th>
                <th style="padding:8px">Invoice Details</th>
                <th style="padding:8px">Status</th>
                <th style="padding:8px">Amount</th>
                <th style="padding:8px">Due Date</th>
                <th style="padding:8px; text-align:right">Action</th>
              </tr>
            </thead>
            <tbody>
              @for (pay of pendingPayments(); track pay.id) {
                <tr style="border-bottom:1px solid var(--border-weak)">
                  <td style="padding:8px; display:flex; align-items:center; gap:8px">
                    <div class="avatar" style="width:24px; height:24px; font-size:9px">
                      {{ getStudentAvatar(pay.studentId) }}
                    </div>
                    <span style="font-weight:600; color:var(--text-primary)">{{ pay.studentName }}</span>
                  </td>
                  <td style="padding:8px; color:var(--text-secondary)">
                    {{ pay.description || 'Mensualité' }}
                  </td>
                  <td style="padding:8px">
                    <span class="badge" [style.background]="pay.status === 'Overdue' ? '#FEE2E2' : '#FEF3C7'" [style.color]="pay.status === 'Overdue' ? '#991B1B' : '#92400E'">
                      {{ pay.status }}
                    </span>
                  </td>
                  <td style="padding:8px; font-weight:700; color:#EF4444">{{ pay.amount }}</td>
                  <td style="padding:8px; color:var(--text-secondary)">{{ pay.dueDate }}</td>
                  <td style="padding:8px; text-align:right; display:flex; justify-content:flex-end; gap:6px">
                    <button class="btn-p" style="padding:4px 8px; font-size:11px" (click)="markAsPaid(pay)">
                      Mark Paid
                    </button>
                    <button class="btn-s" style="padding:4px 8px; font-size:11px" (click)="sendReminder(pay.studentName)">
                      Ping
                    </button>
                    <button class="btn-s" style="padding:4px 8px; font-size:11px; background:#FEE2E2; border-color:#FCA5A5; color:#DC2626" (click)="deleteInvoice(pay)" title="Delete Invoice">
                      Delete
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>

      <!-- COMPLETED TRANSACTIONS -->
      <div class="card" style="margin-top:16px">
        <h3 class="st" style="font-size:15px; margin-bottom:12px; color:#059669">Paid Registry</h3>
        @if (paidPayments().length === 0) {
          <div style="font-size:13px; color:var(--text-secondary); text-align:center; padding:16px 0">
            No payments received yet in this cohort.
          </div>
        } @else {
          <table style="width:100%; border-collapse:collapse; font-size:12px">
            <thead>
              <tr style="text-align:left; border-bottom:2px solid var(--border-weak); color:var(--text-muted)">
                <th style="padding:8px">Student</th>
                <th style="padding:8px">Invoice Details</th>
                <th style="padding:8px">Method</th>
                <th style="padding:8px">Amount</th>
                <th style="padding:8px">Settled At</th>
                <th style="padding:8px; text-align:right">Status</th>
              </tr>
            </thead>
            <tbody>
              @for (pay of paidPayments(); track pay.id) {
                <tr style="border-bottom:1px solid var(--border-weak)">
                  <td style="padding:8px; display:flex; align-items:center; gap:8px">
                    <div class="avatar" style="width:24px; height:24px; font-size:9px">
                      {{ getStudentAvatar(pay.studentId) }}
                    </div>
                    <span style="font-weight:600; color:var(--text-primary)">{{ pay.studentName }}</span>
                  </td>
                  <td style="padding:8px; color:var(--text-secondary)">
                    {{ pay.description || 'Mensualité' }}
                  </td>
                  <td style="padding:8px">
                    <span class="payment-method-badge" [class.wave]="pay.method === 'Wave'" [class.orange]="pay.method === 'Orange Money'" [class.cash]="pay.method === 'Cash/Card'">
                      {{ pay.method }}
                    </span>
                  </td>
                  <td style="padding:8px; font-weight:700; color:#059669">{{ pay.amount }}</td>
                  <td style="padding:8px; color:var(--text-secondary)">{{ pay.paidAt || 'Just Now' }}</td>
                  <td style="padding:8px; text-align:right; display:flex; justify-content:flex-end; align-items:center; gap:6px">
                    <span class="badge" style="background:#D1FAE5; color:#065F46">Paid</span>
                    <button class="btn-s" style="padding:4px 8px; font-size:11px; background:#FEE2E2; border-color:#FCA5A5; color:#DC2626" (click)="deleteInvoice(pay)" title="Delete Invoice">
                      Delete
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
    </div>
  `,
  styles: [`
    .payment-method-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 10px;
      font-weight: 600;
      background: #F3F4F6;
      color: #4B5563;
    }
    .payment-method-badge.wave {
      background: #DBEAFE;
      color: #1D4ED8;
    }
    .payment-method-badge.orange {
      background: #FFEDD5;
      color: #EA580C;
    }
    .payment-method-badge.cash {
      background: #F3F4F6;
      color: #4B5563;
    }
  `]
})
export class TeacherPaymentsComponent {
  private db = inject(DatabaseService);
  private dialogService = inject(DialogService);

  payments = signal<Payment[]>([]);
  
  pendingPayments = signal<Payment[]>([]);
  paidPayments = signal<Payment[]>([]);

  // Statistics
  collectedAmount = signal<number>(840000);
  pendingAmount = signal<number>(180000);
  paidCount = signal<number>(28);
  pendingCount = signal<number>(6);
  totalCount = signal<number>(34);

  usersList = signal<UserProfile[]>([]);

  // Invoicing states
  invoiceStudentId = '';
  invoiceDescription = 'Mensualité';
  invoiceAmount = 30000;
  invoiceDueDate = this.getDefaultDueDate();
  
  studentUsers = computed(() => {
    return this.usersList().filter(u => u.role === 'student');
  });

  getDefaultDueDate(): string {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split('T')[0];
  }

  constructor() {
    this.db.observeUsers().subscribe(list => {
      this.usersList.set(list);
    });
    this.db.observePayments().subscribe(list => {
      this.payments.set(list);
      
      const pending = list.filter(p => p.status !== 'Paid');
      const paid = list.filter(p => p.status === 'Paid');
      
      this.pendingPayments.set(pending);
      this.paidPayments.set(paid);
      
      // Update local metrics
      const grossPaid = paid.reduce((acc, p) => acc + this.parseCfa(p.amount), 0);
      const grossPending = pending.reduce((acc, p) => acc + this.parseCfa(p.amount), 0);
      
      this.collectedAmount.set(grossPaid);
      this.pendingAmount.set(grossPending);
      
      this.paidCount.set(paid.length);
      this.pendingCount.set(pending.length);
      this.totalCount.set(list.length);
    });
  }

  private parseCfa(amountStr: string): number {
    // e.g. "30,000 CFA" -> 30000
    try {
      return parseInt(amountStr.replace(/[^0-9]/g, ''), 10) || 0;
    } catch (e) {
      return 0;
    }
  }

  getCurrentMonthAbbr(): string {
    return new Date().toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase().replace('.', '');
  }

  getStudentAvatar(studentId: string): string {
    const user = this.usersList().find(u => u.id === studentId);
    if (user && user.avatar) return user.avatar;
    const payment = this.payments().find(p => p.studentId === studentId);
    if (payment && payment.studentName) {
      return payment.studentName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return 'ST';
  }

  getMethodIcon(method?: string): string {
    return '';
  }

  sendReminder(studentName: string) {
    this.dialogService.alert('Reminder Sent', `Payment reminder notification sent to ${studentName}!`, 'success');
  }

  markAsPaid(pay: Payment) {
    this.dialogService.showPaymentMethod({
      studentName: pay.studentName,
      onWave: () => {
        const method = 'Wave';
        this.db.updatePaymentStatus(pay.id, 'Paid', method);
        this.dialogService.alert('Success', `Payment of ${pay.amount} for ${pay.studentName} marked as Paid via ${method}.`, 'success');
      },
      onOrangeMoney: () => {
        const method = 'Orange Money';
        this.db.updatePaymentStatus(pay.id, 'Paid', method);
        this.dialogService.alert('Success', `Payment of ${pay.amount} for ${pay.studentName} marked as Paid via ${method}.`, 'success');
      }
    });
  }

  issueInvoice() {
    if (!this.invoiceStudentId) return;
    
    const student = this.usersList().find(u => u.id === this.invoiceStudentId);
    if (!student) return;

    const formattedAmount = Number(this.invoiceAmount).toLocaleString('fr-FR') + ' CFA';
    this.db.addPayment({
      studentId: this.invoiceStudentId,
      studentName: student.name,
      amount: formattedAmount,
      description: this.invoiceDescription,
      status: 'Late',
      dueDate: this.invoiceDueDate
    });

    this.dialogService.alert('Success', `Invoice of ${formattedAmount} issued successfully for ${student.name}!`, 'success');
    
    // Reset form fields
    this.invoiceStudentId = '';
    this.invoiceDescription = 'Mensualité';
    this.invoiceAmount = 30000;
    this.invoiceDueDate = this.getDefaultDueDate();
  }

  deleteInvoice(pay: Payment) {
    this.dialogService.show({
      title: 'Confirm Deletion',
      message: `Are you sure you want to delete the invoice of ${pay.amount} for ${pay.studentName}?`,
      type: 'confirm',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: () => {
        this.db.deletePayment(pay.id);
        this.dialogService.alert('Deleted', 'Invoice deleted successfully!', 'success');
      }
    });
  }
}