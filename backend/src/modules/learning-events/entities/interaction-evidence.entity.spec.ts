import { getMetadataArgsStorage } from 'typeorm';
import { InteractionEvidence } from './interaction-evidence.entity';

describe('InteractionEvidence entity metadata', () => {
  it.each(['motorDemand', 'sensoryLoad', 'languageLoad', 'outcome'])(
    'declares nullable %s as varchar instead of inferred Object',
    (propertyName) => {
      const column = getMetadataArgsStorage().columns.find(
        (item) => item.target === InteractionEvidence && item.propertyName === propertyName,
      );
      expect(column?.options.type).toBe('varchar');
      expect(column?.options.nullable).toBe(true);
    },
  );
});
