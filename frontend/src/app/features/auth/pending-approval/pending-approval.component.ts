import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-pending-approval',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './pending-approval.component.html',
  styleUrl: '../auth-page.scss',
})
export class PendingApprovalComponent {}
