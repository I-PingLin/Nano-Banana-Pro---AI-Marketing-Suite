
import { Component, inject, signal, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AIService } from '../services/ai.service';

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

@Component({
  selector: 'app-chat-sidebar',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex flex-col h-full bg-white border-l shadow-xl w-80 fixed right-0 top-0 z-50 transition-transform duration-300"
         [class.translate-x-full]="!isOpen()">
      <div class="p-4 bg-yellow-400 flex justify-between items-center shadow-md">
        <h2 class="text-lg font-bold text-gray-900">Marketing Assistant</h2>
        <button (click)="close.emit()" class="text-gray-900 hover:bg-yellow-500 rounded-full p-1">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        @for (msg of messages(); track $index) {
          <div [class]="msg.role === 'user' ? 'text-right' : 'text-left'">
            <div [class]="msg.role === 'user' ? 'bg-yellow-100 text-gray-800' : 'bg-gray-100 text-gray-800'"
                 class="inline-block p-3 rounded-2xl max-w-[90%] text-sm">
              {{ msg.text }}
            </div>
          </div>
        }
        @if (isTyping()) {
          <div class="text-left">
            <div class="bg-gray-100 inline-block p-3 rounded-2xl animate-pulse text-xs text-gray-500">
              Assistant is thinking...
            </div>
          </div>
        }
      </div>

      <div class="p-4 border-t bg-gray-50">
        <div class="flex gap-2">
          <input [(ngModel)]="userInput" 
                 (keyup.enter)="sendMessage()"
                 placeholder="Ask a question..."
                 class="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none text-sm" />
          <button (click)="sendMessage()" 
                  [disabled]="!userInput().trim() || isTyping()"
                  class="bg-yellow-400 hover:bg-yellow-500 p-2 rounded-lg transition-colors disabled:opacity-50">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
          </button>
        </div>
      </div>
    </div>
  `
})
export class ChatSidebarComponent {
  private aiService = inject(AIService);
  
  isOpen = input<boolean>(false);
  close = output<void>();

  messages = signal<ChatMessage[]>([]);
  userInput = signal('');
  isTyping = signal(false);

  async sendMessage() {
    const text = this.userInput().trim();
    if (!text || this.isTyping()) return;

    const newMessages = [...this.messages(), { role: 'user', text } as ChatMessage];
    this.messages.set(newMessages);
    this.userInput.set('');
    this.isTyping.set(true);

    try {
      const chat = this.aiService.getChat();
      const result = await chat.sendMessage({ message: text });
      this.messages.update(m => [...m, { role: 'model', text: result.text } as ChatMessage]);
    } catch (err) {
      this.messages.update(m => [...m, { role: 'model', text: 'Sorry, I encountered an error. Please try again.' } as ChatMessage]);
    } finally {
      this.isTyping.set(false);
    }
  }
}
