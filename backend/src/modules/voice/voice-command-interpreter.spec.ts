import { VoiceCommand, VoiceCommandInterpreter } from './voice-command-interpreter';

describe('VoiceCommandInterpreter', () => {
  const interpreter = new VoiceCommandInterpreter();
  it.each([['me ajuda', VoiceCommand.REQUEST_HELP], ['não entendi', VoiceCommand.REQUEST_HELP],
    ['fala de novo', VoiceCommand.REPEAT_INSTRUCTION], ['quero outro', VoiceCommand.CHANGE_ACTIVITY],
    ['sim', VoiceCommand.CONFIRM], ['não', VoiceCommand.DENY]])('maps %s conservatively', (text, expected) => {
    expect(interpreter.interpret(text)).toBe(expected);
  });
  it('does not guess an ambiguous or unsupported meaning', () => {
    expect(interpreter.interpret('acho que talvez')).toBe(VoiceCommand.UNKNOWN);
  });
});
