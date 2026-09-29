# Guia de Integração: Ano Escolar e Cobertura BNCC

## 1. Integração do schoolYear na Progressão

### 1.1 No Controller de Atividades

```typescript
// activities.controller.ts

@Get('islands/:islandId/progress')
async getIslandProgress(
  @Param('islandId') islandId: string,
  @Req() req: Request,
) {
  const userId = req.user.id;
  
  // Buscar perfil da criança para obter schoolYear
  const profile = await this.childProfileService.getProfile(userId);
  
  // Passar schoolYear para o serviço de progressão
  const progress = await this.progressionService.getIslandProgress(
    userId,
    islandId,
    profile.schoolYear, // 0, 1, 2, 3, 4, ou 5
  );
  
  return progress;
}

@Post('activities/:activityId/submit')
async submitActivity(
  @Param('activityId') activityId: string,
  @Body() submission: ActivitySubmissionDto,
  @Req() req: Request,
) {
  const userId = req.user.id;
  
  // Registrar performance
  await this.performanceService.recordPerformance({
    userId,
    activityId,
    isCorrect: submission.isCorrect,
    responseTimeMs: submission.responseTimeMs,
    hintsUsed: submission.hintsUsed,
  });
  
  // Sugerir próximo exercício
  const profile = await this.childProfileService.getProfile(userId);
  const nextSuggestion = await this.progressionService.suggestNextExercise(
    userId,
    submission.islandId,
    submission.sessionId,
    profile.schoolYear, // Passar schoolYear aqui
  );
  
  return {
    success: true,
    nextSuggestion,
    feedback: submission.isCorrect ? 'Parabéns!' : 'Tente novamente!',
  };
}
```

### 1.2 No Serviço de Atividades

```typescript
// activities.service.ts

async suggestNextExercise(
  userId: string,
  islandId: string,
  sessionId: string,
): Promise<ProgressionSuggestion | null> {
  // Buscar perfil
  const profile = await this.childProfileService.getProfile(userId);
  
  // Chamar progressionService com schoolYear
  return this.progressionService.suggestNextExercise(
    userId,
    islandId,
    sessionId,
    profile.schoolYear, // Passar aqui
  );
}
```

---

## 2. Exibição de "Como Jogar" no Frontend

### 2.1 Componente de Exercício

```typescript
// exercise.component.ts

export class ExerciseComponent implements OnInit {
  activity: Activity;
  showHowToPlay = true;
  
  ngOnInit() {
    this.loadActivity();
  }
  
  loadActivity() {
    this.activityService.getActivity(this.activityId).subscribe(
      (activity) => {
        this.activity = activity;
        // Mostrar "Como Jogar" automaticamente
        this.showHowToPlay = true;
        
        // Reproduzir áudio de introdução se disponível
        if (activity.content.spokenIntroduction) {
          this.audioService.play(activity.content.spokenIntroduction);
        }
      }
    );
  }
  
  dismissHowToPlay() {
    this.showHowToPlay = false;
  }
  
  onActivityComplete(isCorrect: boolean) {
    // Reproduzir feedback de sucesso
    if (isCorrect && this.activity.content.spokenSuccessFeedback) {
      this.audioService.play(this.activity.content.spokenSuccessFeedback);
    }
    
    // Mostrar notificação de parabéns
    this.notificationService.show('Parabéns! Você acertou!', 'success');
  }
}
```

### 2.2 Template HTML

```html
<!-- exercise.component.html -->

<div class="exercise-container">
  <!-- "Como Jogar" Modal -->
  <div *ngIf="showHowToPlay" class="how-to-play-modal">
    <div class="modal-content">
      <h2>Como Jogar</h2>
      
      <!-- Pictogramas ARASAAC -->
      <div class="pictograms" *ngIf="activity.content.pictogramConceptIds">
        <arasaac-pictogram 
          *ngFor="let picId of activity.content.pictogramConceptIds"
          [id]="picId">
        </arasaac-pictogram>
      </div>
      
      <!-- Instruções -->
      <p class="instructions">{{ activity.content.howToPlayPt }}</p>
      
      <!-- Botão para começar -->
      <button (click)="dismissHowToPlay()" class="btn-primary">
        Vamos Começar!
      </button>
    </div>
  </div>
  
  <!-- Exercício -->
  <div *ngIf="!showHowToPlay" class="exercise-content">
    <!-- Conteúdo do exercício aqui -->
    <app-activity-renderer 
      [activity]="activity"
      (complete)="onActivityComplete($event)">
    </app-activity-renderer>
  </div>
</div>
```

---

## 3. Renderização de Pictogramas ARASAAC

### 3.1 Componente ARASAAC

```typescript
// arasaac-pictogram.component.ts

import { Component, Input } from '@angular/core';

@Component({
  selector: 'arasaac-pictogram',
  template: `
    <img 
      [src]="pictogramUrl" 
      [alt]="alt"
      class="arasaac-pictogram"
    />
  `,
  styles: [`
    .arasaac-pictogram {
      width: 80px;
      height: 80px;
      margin: 10px;
      object-fit: contain;
    }
  `]
})
export class ArasaacPictogramComponent {
  @Input() id: string;
  
  get pictogramUrl(): string {
    // Remove prefixo 'arasaac.' se existir
    const cleanId = this.id.replace('arasaac.', '');
    return `https://api.arasaac.org/api/pictograms/${cleanId}`;
  }
  
  get alt(): string {
    return `ARASAAC pictogram ${this.id}`;
  }
}
```

### 3.2 Uso no Template

```html
<!-- Exibir pictogramas do exercício -->
<div class="pictograms-container">
  <arasaac-pictogram 
    *ngFor="let picId of activity.content.pictogramConceptIds"
    [id]="picId">
  </arasaac-pictogram>
</div>
```

---

## 4. Reprodução de Audio

### 4.1 Serviço de Audio

```typescript
// audio.service.ts

import { Injectable } from '@nestjs/common';

@Injectable()
export class AudioService {
  private audioContext: AudioContext;
  
  constructor() {
    this.audioContext = new (window as any).AudioContext();
  }
  
  play(text: string, language: string = 'pt-BR'): Promise<void> {
    return new Promise((resolve, reject) => {
      // Usar Web Speech API ou TTS service
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      utterance.rate = 0.9; // Um pouco mais lento para crianças
      
      utterance.onend = () => resolve();
      utterance.onerror = (error) => reject(error);
      
      window.speechSynthesis.speak(utterance);
    });
  }
  
  stop(): void {
    window.speechSynthesis.cancel();
  }
}
```

### 4.2 Uso no Componente

```typescript
// exercise.component.ts

async playIntroduction() {
  if (this.activity.content.spokenIntroduction) {
    await this.audioService.play(
      this.activity.content.spokenIntroduction,
      'pt-BR'
    );
  }
}

async playSuccessFeedback() {
  if (this.activity.content.spokenSuccessFeedback) {
    await this.audioService.play(
      this.activity.content.spokenSuccessFeedback,
      'pt-BR'
    );
  }
}
```

---

## 5. Notificação de Parabéns

### 5.1 Componente de Notificação

```typescript
// notification.component.ts

@Component({
  selector: 'app-notification',
  template: `
    <div [class]="'notification ' + type" *ngIf="visible">
      <div class="notification-content">
        <span class="emoji">🎉</span>
        <p>{{ message }}</p>
      </div>
    </div>
  `,
  styles: [`
    .notification {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 20px;
      border-radius: 8px;
      animation: slideIn 0.3s ease-in-out;
      z-index: 1000;
    }
    
    .notification.success {
      background-color: #4caf50;
      color: white;
    }
    
    .notification.error {
      background-color: #f44336;
      color: white;
    }
    
    .emoji {
      font-size: 24px;
      margin-right: 10px;
    }
    
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `]
})
export class NotificationComponent {
  message: string;
  type: 'success' | 'error' = 'success';
  visible = false;
  
  show(message: string, type: 'success' | 'error' = 'success') {
    this.message = message;
    this.type = type;
    this.visible = true;
    
    // Auto-hide após 3 segundos
    setTimeout(() => {
      this.visible = false;
    }, 3000);
  }
}
```

### 5.2 Uso no Serviço

```typescript
// notification.service.ts

@Injectable()
export class NotificationService {
  constructor(private notificationComponent: NotificationComponent) {}
  
  show(message: string, type: 'success' | 'error' = 'success') {
    this.notificationComponent.show(message, type);
  }
}
```

---

## 6. Checklist de Integração

### Backend:
- [ ] Atualizar controllers para passar `schoolYear` ao `progressionService`
- [ ] Testar `suggestNextExercise` com diferentes valores de `schoolYear`
- [ ] Validar que exercícios BNCC novos estão sendo retornados
- [ ] Testar fallback quando `schoolYear = 0`

### Frontend:
- [ ] Implementar componente de "Como Jogar"
- [ ] Implementar reprodução de audio (spokenIntroduction, spokenSuccessFeedback)
- [ ] Implementar componente ARASAAC para pictogramas
- [ ] Implementar notificação de parabéns
- [ ] Testar exibição de pictogramas ARASAAC
- [ ] Testar audio em diferentes navegadores

### Testes:
- [ ] Teste unitário: progressão com schoolYear = 1
- [ ] Teste unitário: progressão com schoolYear = 3
- [ ] Teste unitário: progressão com schoolYear = 0 (fallback)
- [ ] Teste e2e: Fluxo completo de exercício com "Como Jogar"
- [ ] Teste e2e: Reprodução de audio após conclusão

### Documentação:
- [ ] Atualizar README com informações de schoolYear
- [ ] Documentar novos exercícios BNCC
- [ ] Criar guia para educadores sobre preenchimento de schoolYear

---

## 7. Exemplos de Uso

### Exemplo 1: Criança do 1º ano

```typescript
// Perfil
const profile = {
  userId: 'child-123',
  schoolYear: 1,
  age: 6,
};

// Progressão
const suggestion = await progressionService.suggestNextExercise(
  'child-123',
  'island-sun',
  'session-1',
  1 // schoolYear = 1
);

// Resultado: Thresholds originais (0.85, 0.70, 0.50)
// Se accuracy = 0.75: próxima dificuldade = 'medium'
```

### Exemplo 2: Criança do 3º ano

```typescript
// Perfil
const profile = {
  userId: 'child-456',
  schoolYear: 3,
  age: 8,
};

// Progressão
const suggestion = await progressionService.suggestNextExercise(
  'child-456',
  'island-sun',
  'session-2',
  3 // schoolYear = 3
);

// Resultado: Thresholds ajustados (0.95, 0.80, 0.60)
// Se accuracy = 0.75: próxima dificuldade = 'easy' (mais exigente)
```

### Exemplo 3: Sem schoolYear preenchido

```typescript
// Perfil
const profile = {
  userId: 'child-789',
  schoolYear: null, // Não preenchido
  age: 7,
};

// Progressão
const suggestion = await progressionService.suggestNextExercise(
  'child-789',
  'island-sun',
  'session-3',
  0 // ou undefined
);

// Resultado: Thresholds originais (0.85, 0.70, 0.50)
// Comportamento idêntico ao anterior
```

---

## 8. Troubleshooting

### Pictogramas não aparecem
- Verificar se o ID tem prefixo `arasaac.`
- Verificar conexão com API ARASAAC
- Verificar console do navegador para erros de CORS

### Audio não funciona
- Verificar se `spokenIntroduction` e `spokenSuccessFeedback` estão preenchidos
- Testar Web Speech API em navegadores modernos
- Considerar usar TTS service alternativo (Google Cloud TTS, Azure)

### Progressão não ajusta por schoolYear
- Verificar se `schoolYear` está sendo passado corretamente
- Verificar se `profile.schoolYear` está sendo preenchido no banco
- Testar com valores 1-5 para validar fórmula

---

## 9. Referências

- `SCHOOL_YEAR_PROGRESSION.md` - Documentação técnica da progressão
- `SESSION_SUMMARY_BNCC_COVERAGE.md` - Resumo dos exercícios BNCC
- `EXERCISE_IMPROVEMENTS.md` - Lista completa de melhorias
- API ARASAAC: https://api.arasaac.org/
- Web Speech API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API
