import { getMetadataArgsStorage } from 'typeorm';
import { LearningEvent } from './learning-event.entity';

describe('LearningEvent entity', () => {
  it('declares recommendationId with a PostgreSQL-supported type', () => {
    const column = getMetadataArgsStorage().columns.find(
      (metadata) => metadata.target === LearningEvent && metadata.propertyName === 'recommendationId',
    );

    expect(column?.options).toEqual(expect.objectContaining({
      type: 'varchar',
      nullable: true,
    }));
  });
});