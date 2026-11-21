import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, QueryFailedError, Repository } from 'typeorm';
import { Clinic, normalizeClinicName } from '../entities/clinic.entity';
import { User } from '../entities/user.entity';
import { UserRole } from '../enums/user-role.enum';

export const CLINIC_TAKEN_MESSAGE =
  'Esta clínica já tem uma profissional cadastrada. Por segurança, não é possível criar outra conta para a mesma clínica. Fale com a profissional responsável pela clínica.';

@Injectable()
export class ClinicsService {
  constructor(
    @InjectRepository(Clinic)
    private readonly clinicRepo: Repository<Clinic>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  /** Public list used by guardians to pick the clinic that follows the child. */
  async listForSelection(): Promise<Array<{ id: string; name: string }>> {
    const clinics = await this.clinicRepo.find({
      where: { ownerProfessionalId: Not(IsNull()) },
      order: { name: 'ASC' },
    });
    return clinics.map(({ id, name }) => ({ id, name }));
  }

  validateName(name: string | undefined): { name: string; normalizedName: string } {
    const trimmed = (name ?? '').replace(/\s+/g, ' ').trim();
    const normalizedName = normalizeClinicName(trimmed);
    if (normalizedName.length < 3) {
      throw new BadRequestException('Informe o nome da clínica (pelo menos 3 letras).');
    }
    return { name: trimmed, normalizedName };
  }

  /** Throws when the clinic name is already registered. */
  async assertNameAvailable(name: string | undefined): Promise<void> {
    const { normalizedName } = this.validateName(name);
    const existing = await this.clinicRepo.findOne({ where: { normalizedName } });
    if (existing) throw new ConflictException(CLINIC_TAKEN_MESSAGE);
  }

  /** Creates the clinic owned by this professional and links her to it. */
  async claimForProfessional(professionalId: string, rawName: string | undefined): Promise<Clinic> {
    const professional = await this.userRepo.findOne({ where: { id: professionalId } });
    if (!professional || professional.role !== UserRole.PROFESSIONAL) {
      throw new BadRequestException('Somente profissionais podem cadastrar uma clínica.');
    }
    if (professional.clinicId) {
      throw new ConflictException('Sua conta já está vinculada a uma clínica.');
    }
    const { name, normalizedName } = this.validateName(rawName);

    try {
      const clinic = await this.clinicRepo.save(this.clinicRepo.create({
        name,
        normalizedName,
        ownerProfessionalId: professionalId,
      }));
      await this.userRepo.update(professionalId, { clinicId: clinic.id });
      return clinic;
    } catch (error) {
      // Unique index on normalized_name: another sign-up won the race.
      if (error instanceof QueryFailedError && (error as any).driverError?.code === '23505') {
        throw new ConflictException(CLINIC_TAKEN_MESSAGE);
      }
      throw error;
    }
  }

  async findSelectable(clinicId: string): Promise<Clinic> {
    const clinic = await this.clinicRepo.findOne({ where: { id: clinicId } });
    if (!clinic) throw new NotFoundException('Clínica não encontrada. Escolha uma clínica da lista.');
    return clinic;
  }

  async getForUser(userId: string): Promise<{ id: string; name: string } | null> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user?.clinicId) return null;
    const clinic = await this.clinicRepo.findOne({ where: { id: user.clinicId } });
    return clinic ? { id: clinic.id, name: clinic.name } : null;
  }
}
