import {
    ChangeDetectionStrategy,
    Component,
    OnInit,
    inject,
    signal,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';

import { AdminService } from '../services/admin.service';
import { AdminUser, PendingVet } from '../../../models/admin.model';
import { AppButtonComponent } from '../../../components/app-button/app-button';

@Component({
    selector: 'app-admin-vets',
    standalone: true,
    imports: [CommonModule, DatePipe, AppButtonComponent],
    templateUrl: './admin-vets.component.html',
    styleUrl: './admin-vets.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminVetsComponent implements OnInit {
    private readonly adminService = inject(AdminService);

    readonly pendingVets = signal<PendingVet[]>([]);
    readonly approvedVets = signal<AdminUser[]>([]);

    readonly isLoading = signal(true);
    readonly isApproving = signal<string | null>(null);
    readonly errorMessage = signal('');
    readonly successMessage = signal('');

    ngOnInit(): void {
        this.loadVets();
    }

    loadVets(): void {
        this.isLoading.set(true);
        this.errorMessage.set('');
        this.successMessage.set('');

        this.adminService.getPendingVets().subscribe({
            next: (vets) => {
                this.pendingVets.set(vets);
                this.loadApprovedVets();
            },
            error: (error) => {
                console.error('Error loading pending vets:', error);
                this.errorMessage.set(
                    'Възникна грешка при зареждането на заявките за одобрение.',
                );
                this.isLoading.set(false);
            },
        });
    }

    private loadApprovedVets(): void {
        this.adminService.getUsers().subscribe({
            next: (users) => {
                this.approvedVets.set(
                    users.filter(
                        (user) => user.role === 'VET' && user.vetApproved,
                    ),
                );
                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('Error loading approved vets:', error);
                this.errorMessage.set(
                    'Заявките са заредени, но възникна грешка при зареждането на одобрените ветеринари.',
                );
                this.isLoading.set(false);
            },
        });
    }

    approveVet(vet: PendingVet): void {
        const confirmed = window.confirm(
            `Сигурни ли сте, че искате да одобрите ветеринар ${vet.firstName} ${vet.lastName}?`,
        );

        if (!confirmed) {
            return;
        }

        this.isApproving.set(vet.id);
        this.errorMessage.set('');
        this.successMessage.set('');

        this.adminService.approveVet(vet.id).subscribe({
            next: () => {
                this.successMessage.set(
                    `Ветеринар ${vet.firstName} ${vet.lastName} беше одобрен успешно.`,
                );

                this.adminService.refreshPendingVetCount();
                this.isApproving.set(null);
                this.loadVets();
            },
            error: (error) => {
                console.error('Error approving vet:', error);
                this.errorMessage.set(
                    'Възникна грешка при одобрението на ветеринаря.',
                );
                this.isApproving.set(null);
            },
        });
    }

    getFullName(vet: PendingVet | AdminUser): string {
        return `${vet.firstName} ${vet.lastName}`;
    }
}
