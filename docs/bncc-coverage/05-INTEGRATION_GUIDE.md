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
  const profile = await this.childProfileService.getProfile(userId);
  
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
        this.showHowToPlay = true;
        
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
    if (isCorrect && this.activity.content.spokenSuccessFeedback) {
      this.audioService.play(this.activity.content.spokenSuccessFeedback);
    }
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
    const cleanId = this.id.replace('arasaac.', '');
    return `https://api.arasaac.org/api/pictograms/${cleanId}`;
  }
  
  get alt(): string {
    return `ARASAAC pictogram ${this.id}`;
  }
}
```

---

## 4. Reprodução de Audio

### 4.1 Serviço de Audio

```typescript
// audio.service.ts

import { Injectable } from '@angular/core';

@Injectable()
export class AudioService {
  play(text: string, language: string = 'pt-BR'): Promise<void> {
    return new Promise((resolve, reject) => {
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

---

## 5. Checklist de Integração

### Backend:
- [ ] Atualizar controllers para passar `schoolYear` ao `progressionService`
- [ ] Testar `suggestNextExercise` com diferentes valores de `schoolYear`
- [ ] Validar que exercícios BNCC novos estão sendo retornados
- [ ] Testar fallback quando `schoolYear = 0`

### Frontend:
- [ ] Implementar componente de "Como Jogar"
- [ ] Implementar reprodução de audio
- [ ] Implementar componente ARASAAC para pictogramas
- [ ] Implementar notificação de parabéns
- [ ] Testar exibição de pictogramas ARASAAC
- [ ] Testar audio em diferentes navegadores
- [ ] Implementar badge visual para exercícios novos

### Testes:
- [ ] Teste unitário: progressão com schoolYear = 1
- [ ] Teste unitário: progressão com schoolYear = 3
- [ ] Teste unitário: progressão com schoolYear = 0 (fallback)
- [ ] Teste e2e: Fluxo completo de exercício com "Como Jogar"
- [ ] Teste e2e: Reprodução de audio após conclusão

---

## 6. Exemplos de Uso

### Exemplo 1: Criança do 1º ano

```typescript
const profile = {
  userId: 'child-123',
  schoolYear: 1,
  age: 6,
};

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
const profile = {
  userId: 'child-456',
  schoolYear: 3,
  age: 8,
};

const suggestion = await progressionService.suggestNextExercise(
  'child-456',
  'island-sun',
  'session-2',
  3 // schoolYear = 3
);

// Resultado: Thresholds ajustados (0.95, 0.80, 0.60)
// Se accuracy = 0.75: próxima dificuldade = 'easy' (mais exigente)
```

---

## 7. Troubleshooting

### Pictogramas não aparecem
- Verificar se o ID tem prefixo `arasaac.`
- Verificar conexão com API ARASAAC
- Verificar console do navegador para erros de CORS

### Audio não funciona
- Verificar se `spokenIntroduction` e `spokenSuccessFeedback` estão preenchidos
- Testar Web Speech API em navegadores modernos
- Considerar usar TTS service alternativo

### Progressão não ajusta por schoolYear
- Verificar se `schoolYear` está sendo passado corretamente
- Verificar se `profile.schoolYear` está sendo preenchido no banco
- Testar com valores 1-5 para validar fórmula

---

## 📚 Próximo Documento

Leia **06-FRONTEND_BADGE.md** para implementar o indicador visual dos exercícios novos.
