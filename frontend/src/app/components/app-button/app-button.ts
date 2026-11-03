import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app-button.html',
  styleUrl: './app-button.scss',
})
export class AppButtonComponent {
  // Параметри за персонализация на бутона
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() block: boolean = false;
  @Input() small: boolean = false;
  @Input() disabled: boolean = false;
  @Input() isLoading: boolean = false; // Показва спинер за зареждане

  // Изпраща събитие нагоре към родителя при клик
  @Output() btnClick = new EventEmitter<MouseEvent>();

  onButtonClick(event: MouseEvent): void {
    if (!this.disabled && !this.isLoading) {
      this.btnClick.emit(event);
    }
  }
}
