import { Component, Input, forwardRef, ElementRef, HostListener } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

interface DropdownOption {
  value: any;
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
export class AppDropdownComponent implements ControlValueAccessor {
  @Input() label: string = '';
  @Input() required: boolean = false;
  @Input() placeholder: string = 'Изберете опция';
  @Input() options: DropdownOption[] = [];
  @Input() disabled: boolean = false;

  selectedValue: any = null;
  selectedLabel: string = '';
  isOpen: boolean = false;

  onChange: any = () => {};
  onTouch: any = () => {};

  constructor(private elementRef: ElementRef) {}

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
    this.onChange(this.selectedValue); // Уведомява Angular формата
  }

  // АВТОМАТИЧНО ЗАТВАРЯНЕ: Ако потребителят кликне извън менюто, го затваряме
  @HostListener('document:click', ['$event'])
  clickOut(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }

  // --- Имплементация на ControlValueAccessor ---
  writeValue(val: any): void {
    this.selectedValue = val;
    const foundOption = this.options.find(opt => opt.value === val);
    this.selectedLabel = foundOption ? foundOption.label : '';
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouch = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
    if (isDisabled) this.isOpen = false;
  }
}
