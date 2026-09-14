describe('VoiceController module initialization', () => {
  it('loads decorated DTO metadata without a temporal dead zone error', () => {
    expect(() => require('./voice.controller')).not.toThrow();
  });
});
