import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * A clinic groups the children a professional may see. Each clinic is
 * claimed by exactly one professional account (ownerProfessionalId), so a
 * second sign-up with the same clinic name is refused instead of silently
 * gaining access to that clinic's children.
 */
@Entity('clinics')
export class Clinic {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  /** Lower-case, accent-free, single-spaced name; unique. */
  @Column({ length: 255, unique: true, name: 'normalized_name' })
  normalizedName: string;

  @Column({ type: 'uuid', nullable: true, unique: true, name: 'owner_professional_id' })
  ownerProfessionalId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

export function normalizeClinicName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}
