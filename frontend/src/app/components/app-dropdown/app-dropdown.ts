import { Component, Input, forwardRef, ElementRef, HostListener, OnChanges, SimpleChanges } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

interface DropdownOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-dropdown',
  standalone: true,
  imports: [],
  templateUrl: './app-dropdown.html',
  styleUrls: ['./app-dropdown.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AppDropdownComponent),
      multi: true
    }
  ]
})
export class AppDropdownComponent implements ControlValueAccessor, OnChanges {
  @Input() label: string = '';
  @Input() required: boolean = false;
  @Input() placeholder: string = 'Изберете опция';
  @Input() options: DropdownOption[] = [];
  @Input() disabled: boolean = false;

  selectedValue: string | null = null;
  selectedLabel: string = '';
  isOpen: boolean = false;

  private onChange: (value: string | null) => void = () => {};
  private onTouch: () => void = () => {};

  constructor(private elementRef: ElementRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['options']) this.updateSelectedLabel();
  }

  // Превключва отварянето/затварянето на менюто
  toggleDropdown(): void {
    if (!this.disabled) {
      this.isOpen = !this.isOpen;
      this.onTouch();
    }
  }

  // Избиране на опция от списъка
  selectOption(option: DropdownOption): void {
    this.selectedValue = option.value;
    this.selectedLabel = option.label;
    this.isOpen = false;
    this.onChange(this.selectedValue);
    this.onTouch();
  }

  // АВТОМАТИЧНО ЗАТВАРЯНЕ: Ако потребителят кликне извън менюто, го затваряме
  @HostListener('document:click', ['$event'])
  clickOut(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }

  // --- Имплементация на ControlValueAccessor ---
  writeValue(val: unknown): void {
    this.selectedValue = typeof val === 'string' ? val : null;
    this.updateSelectedLabel();
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouch = fn;
  }

  private updateSelectedLabel(): void {
    this.selectedLabel = this.options.find((option) => option.value === this.selectedValue)?.label ?? '';
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    if (isDisabled) this.isOpen = false;
  }
}
