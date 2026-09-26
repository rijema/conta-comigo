import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

export enum BnccThematicUnit {
  NUMEROS = 'Numeros',
  ALGEBRA = 'Algebra',
  GEOMETRIA = 'Geometria',
  GRANDEZAS_MEDIDAS = 'GrandezasMedidas',
  PROBABILIDADE_ESTATISTICA = 'ProbabilidadeEstatistica',
}

@Entity('bncc_skills')
@Index(['code'], { unique: true })
@Index(['year'])
export class BnccSkill {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 12, unique: true })
  code: string; // e.g., "EF01MA01"

  @Column({ type: 'smallint' })
  year: number; // 1-5

  @Column({ type: 'enum', enum: BnccThematicUnit })
  thematicUnit: BnccThematicUnit;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 255 })
  shortDesc: string;

  @Column({ type: 'text', array: true, default: () => "'{}'" })
  prerequisites: string[];

  @Column({ type: 'jsonb', default: () => "'{}'" })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
