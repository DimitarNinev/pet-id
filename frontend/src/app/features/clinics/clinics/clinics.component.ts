import {
    Component,
    DestroyRef,
    OnInit,
    computed,
    inject,
    signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, finalize, switchMap } from 'rxjs';

import { HeaderComponent } from '../../../components/header/header.component';
import { VetsService } from '../../../core/services/vets.service';
import { Vet } from '../../../models/vet.model';
import { AppInputComponent } from "../../../components/app-input/app-input";

@Component({
    selector: 'app-clinics',
    standalone: true,
    imports: [CommonModule, FormsModule, HeaderComponent, AppInputComponent],
    templateUrl: './clinics.component.html',
    styleUrl: './clinics.component.scss',
})
export class ClinicsComponent implements OnInit {
    private readonly destroyRef = inject(DestroyRef);
    private readonly vetsService = inject(VetsService);

    private readonly searchSubject = new Subject<string>();

    readonly vets = signal<Vet[]>([]);
    readonly searchQuery = signal('');
    readonly isLoading = signal(true);
    readonly errorMessage = signal('');

    readonly currentPage = signal(1);
    readonly pageSize = 10;
    readonly total = signal(0);
    readonly totalPages = signal(0);

    readonly hasResults = computed(() => this.vets().length > 0);

    readonly cities = ['София', 'Пловдив', 'Варна', 'Бургас'];
    readonly selectedCity = signal('');

    ngOnInit(): void {
        this.searchSubject
            .pipe(
                debounceTime(350),
                switchMap((query) => {
                    this.isLoading.set(true);
                    this.errorMessage.set('');

                    return this.vetsService
                        .getAll(query, this.currentPage(), this.pageSize, this.selectedCity())
                        .pipe(finalize(() => this.isLoading.set(false)));
                }),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe({
                next: (response) => {
                    this.vets.set(response.data);
                    this.total.set(response.pagination.total);
                    this.totalPages.set(response.pagination.totalPages);
                },
                error: () => {
                    this.vets.set([]);
                    this.total.set(0);
                    this.totalPages.set(0);
                    this.errorMessage.set(
                        'Възникна грешка при зареждането на ветеринарните специалисти. Опитай отново.',
                    );
                },
            });

        this.loadVets();
    }

    loadVets(): void {
        this.searchSubject.next(this.searchQuery().trim());
    }

    onSearch(value: string): void {
        this.searchQuery.set(value);
        this.currentPage.set(1);
        this.searchSubject.next(value.trim());
    }

    changePage(page: number): void {
        if (page < 1 || page > this.totalPages() || page === this.currentPage()) {
            return;
        }

        this.currentPage.set(page);
        this.loadVets();
    }

    trackByVetId(_: number, vet: Vet): string {
        return vet.id;
    }

    selectCity(city: string): void {
        if (this.selectedCity() === city) {
            return;
        }

        this.selectedCity.set(city);
        this.currentPage.set(1);
        this.loadVets();
    }
}