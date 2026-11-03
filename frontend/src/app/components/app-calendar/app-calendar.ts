import { Component, Input, forwardRef, ElementRef, HostListener, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app-calendar.html',
  styleUrls: ['./app-calendar.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AppCalendarComponent),
      multi: true
    }
  ]
})

export class AppCalendarComponent implements ControlValueAccessor, OnInit, OnChanges {
  @Input() label: string = '';
  @Input() placeholder: string = 'Изберете дата';
  @Input() disabled: boolean = false;
  @Input() required: boolean = false;

  // Новите параметри (приемат Date или стринг "YYYY-MM-DD")
  @Input() min: Date | string | null = null;
  @Input() max: Date | string | null = null;

  private minDate: Date | null = null;
  private maxDate: Date | null = null;

  selectedDate: Date | null = null;
  formattedDate: string = '';
  isOpen: boolean = false;

  currentYear = new Date().getFullYear();
  currentMonth = new Date().getMonth();
  daysInMonth: (number | null)[] = [];

  todayYear!: number;
  todayMonth!: number;
  todayDay!: number;

  years: number[] = [];
  monthNames = ['Януари', 'Февруари', 'Март', 'Април', 'Май', 'Юни', 'Юли', 'Август', 'Септември', 'Октомври', 'Ноември', 'Декември'];
  weekDays = ['Пн', 'Вв', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

  onChange: (value: string) => void = () => { };
  onTouch: () => void = () => { };

  constructor(private elementRef: ElementRef) { }

  ngOnInit(): void {
    const today = new Date();
    this.todayYear = today.getFullYear();
    this.todayMonth = today.getMonth();
    this.todayDay = today.getDate();

    this.currentYear = this.todayYear;
    this.currentMonth = this.todayMonth;

    this.normalizeLimits();
    this.generateYearList();
    this.generateCalendar();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['min'] || changes['max']) {
      this.normalizeLimits();
      this.generateYearList();
      this.generateCalendar();
    }
  }

  private normalizeLimits(): void {
    if (this.min) {
      this.minDate = this.parseDate(this.min);
      this.minDate.setHours(0, 0, 0, 0);
    } else {
      this.minDate = null;
    }

    if (this.max) {
      this.maxDate = this.parseDate(this.max);
      this.maxDate.setHours(23, 59, 59, 999);
    } else {
      this.maxDate = null;
    }
  }

  private generateYearList(): void {
    this.years = [];
    const startYear = this.minDate ? this.minDate.getFullYear() : 1950;
    const endYear = this.maxDate ? this.maxDate.getFullYear() : this.todayYear + 10;

    for (let y = endYear; y >= startYear; y--) {
      this.years.push(y);
    }
  }

  generateCalendar(): void {
    this.daysInMonth = [];
    const firstDayOfMonth = new Date(this.currentYear, this.currentMonth, 1);
    let startDayIndex = firstDayOfMonth.getDay();
    startDayIndex = startDayIndex === 0 ? 6 : startDayIndex - 1;

    const totalDays = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();

    for (let i = 0; i < startDayIndex; i++) {
      this.daysInMonth.push(null);
    }
    for (let day = 1; day <= totalDays; day++) {
      this.daysInMonth.push(day);
    }
  }

  isDayDisabled(day: number | null): boolean {
    if (!day) return true;
    const checkDate = new Date(this.currentYear, this.currentMonth, day);

    if (this.minDate && checkDate < this.minDate) return true;
    if (this.maxDate && checkDate > this.maxDate) return true;

    return false;
  }

  onYearChange(): void {
    if (this.minDate && this.currentYear === this.minDate.getFullYear() && this.currentMonth < this.minDate.getMonth()) {
      this.currentMonth = this.minDate.getMonth();
    }
    if (this.maxDate && this.currentYear === this.maxDate.getFullYear() && this.currentMonth > this.maxDate.getMonth()) {
      this.currentMonth = this.maxDate.getMonth();
    }
    this.generateCalendar();
  }

  prevMonth(event: MouseEvent): void {
    event.stopPropagation();
    if (this.minDate && this.currentYear === this.minDate.getFullYear() && this.currentMonth <= this.minDate.getMonth()) {
      return;
    }

    this.currentMonth--;
    if (this.currentMonth < 0) {
      this.currentMonth = 11;
      this.currentYear--;
    }
    this.generateCalendar();
  }

  nextMonth(event: MouseEvent): void {
    event.stopPropagation();
    if (this.maxDate && this.currentYear === this.maxDate.getFullYear() && this.currentMonth >= this.maxDate.getMonth()) {
      return;
    }

    this.currentMonth++;
    if (this.currentMonth > 11) {
      this.currentMonth = 0;
      this.currentYear++;
    }
    this.generateCalendar();
  }

  selectDay(day: number | null): void {
    if (!day || this.isDayDisabled(day)) return; // Блокираме клика

    this.selectedDate = new Date(this.currentYear, this.currentMonth, day);
    this.formattedDate = `${day.toString().padStart(2, '0')}.${(this.currentMonth + 1).toString().padStart(2, '0')}.${this.currentYear}`;
    this.isOpen = false;
    this.onChange(this.toDateInputValue(this.selectedDate));
    this.onTouch();
  }

  formatDateLabel(day: number): string {
    return `${day} ${this.monthNames[this.currentMonth]} ${this.currentYear}`;
  }

  isSelected(day: number | null): boolean {
    if (!day || !this.selectedDate) return false;
    return this.selectedDate.getDate() === day &&
      this.selectedDate.getMonth() === this.currentMonth &&
      this.selectedDate.getFullYear() === this.currentYear;
  }

  isToday(day: number | null): boolean {
    if (!day) return false;
    return this.todayDay === day && this.todayMonth === this.currentMonth && this.todayYear === this.currentYear;
  }

  toggleCalendar(): void {
    if (!this.disabled) {
      this.isOpen = !this.isOpen;
      this.onTouch();
    }
  }

  @HostListener('document:click', ['$event'])
  clickOut(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }

  writeValue(val: Date | string | null): void {
    if (val) {
      const date = this.parseDate(val);
      if (!isNaN(date.getTime())) {
        this.selectedDate = date;
        this.currentYear = date.getFullYear();
        this.currentMonth = date.getMonth();
        this.formattedDate = `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
        this.generateCalendar();
        return;
      }
    }
    this.selectedDate = null;
    this.formattedDate = '';
  }

  registerOnChange(fn: (value: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouch = fn; }
  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
    if (isDisabled) this.isOpen = false;
  }

  private parseDate(value: Date | string): Date {
    if (value instanceof Date) return new Date(value);

    const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (dateOnlyMatch) {
      const [, year, month, day] = dateOnlyMatch;
      return new Date(Number(year), Number(month) - 1, Number(day));
    }

    return new Date(value);
  }

  private toDateInputValue(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
