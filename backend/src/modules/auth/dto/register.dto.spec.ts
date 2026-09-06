import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RegisterDto } from './register.dto';

describe('RegisterDto', () => {
  const validRegistration = {
    name: 'Test Guardian',
    email: 'guardian@example.com',
    password: 'secure-password',
    role: 'guardian',
    lgpdConsent: true,
    consentTimestamp: '2026-09-06T12:00:00.000Z',
    childProfile: {
      name: 'Test Child',
      age: 8,
    },
    childPassword: '1234',
  };

  it('accepts the registration payload sent by the frontend', async () => {
    const dto = plainToInstance(RegisterDto, validRegistration);
    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('rejects legacy uppercase role values', async () => {
    const dto = plainToInstance(RegisterDto, {
      ...validRegistration,
      role: 'GUARDIAN',
    });
    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'role')).toBe(true);
  });
});
