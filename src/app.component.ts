
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AIService, EmailCampaign } from './services/ai.service';
import { ChatSidebarComponent } from './components/chat-sidebar.component';

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule, ChatSidebarComponent],
  templateUrl: './app.component.html'
})
export class AppComponent {
  private aiService = inject(AIService);

  // UI State
  prompt = signal('');
  loading = signal(false);
  campaign = signal<EmailCampaign | null>(null);
  currentImage = signal<string | null>(null);
  imageSize = signal('1K');
  isChatOpen = signal(false);
  imageLoading = signal(false);

  // Computed state
  canGenerate = computed(() => this.prompt().length > 10 && !this.loading());

  async generateAll() {
    if (!this.canGenerate()) return;
    
    this.loading.set(true);
    this.campaign.set(null);
    this.currentImage.set(null);

    try {
      const result = await this.aiService.generateCampaign(this.prompt());
      this.campaign.set(result);
      
      // Auto-generate initial image
      await this.regenerateImage();
    } catch (err) {
      console.error(err);
      alert("Failed to generate campaign. Please try again.");
    } finally {
      this.loading.set(false);
    }
  }

  async regenerateImage() {
    const currentCampaign = this.campaign();
    if (!currentCampaign) return;

    this.imageLoading.set(true);
    try {
      // Map size UI to model specifics if needed, here we just pass the label
      const img = await this.aiService.generateImage(currentCampaign.visualPrompt, this.imageSize());
      this.currentImage.set(img);
    } catch (err) {
      console.error(err);
    } finally {
      this.imageLoading.set(false);
    }
  }

  toggleChat() {
    this.isChatOpen.update(v => !v);
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    // Simple visual feedback could be added here
  }
}
