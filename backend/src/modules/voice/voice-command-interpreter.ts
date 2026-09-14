export enum VoiceCommand {
  REQUEST_HELP = 'REQUEST_HELP',
  REPEAT_INSTRUCTION = 'REPEAT_INSTRUCTION',
  CHANGE_ACTIVITY = 'CHANGE_ACTIVITY',
  NEXT = 'NEXT',
  CONFIRM = 'CONFIRM',
  DENY = 'DENY',
  STOP_SPEECH = 'STOP_SPEECH',
  UNKNOWN = 'UNKNOWN',
}

const PHRASES: Record<Exclude<VoiceCommand, VoiceCommand.UNKNOWN>, string[]> = {
  REQUEST_HELP: ['me ajuda', 'nao entendi', 'me da uma ajuda', 'ajuda'],
  REPEAT_INSTRUCTION: ['repete', 'fala de novo', 'de novo'],
  CHANGE_ACTIVITY: ['quero outro', 'outro exercicio', 'troca'],
  NEXT: ['proximo', 'proxima', 'continuar'],
  CONFIRM: ['sim'],
  DENY: ['nao'],
  STOP_SPEECH: ['para', 'pare de falar'],
};

export class VoiceCommandInterpreter {
  interpret(transcript: string): VoiceCommand {
    const normalized = transcript.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
    const matches = Object.entries(PHRASES)
      .filter(([, phrases]) => phrases.includes(normalized))
      .map(([command]) => command as VoiceCommand);
    return matches.length === 1 ? matches[0] : VoiceCommand.UNKNOWN;
  }
}
