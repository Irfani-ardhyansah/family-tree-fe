import type { Person as ApiPerson, PersonWritePayload } from '@/types/api';
import type { Person as LocalPerson } from '@/types/person';

export function apiPersonToLocal(person: ApiPerson): LocalPerson {
  return {
    id: String(person.id),
    fullName: person.fullName,
    nickname: person.nickname ?? undefined,
    gender: person.gender,
    birthDate: person.birthDate,
    deathDate: person.deathDate ?? undefined,
    status: person.status,
    religion: person.religion ?? undefined,
    photoUrl: person.photoUrl ?? undefined,
    occupation: person.occupation ?? undefined,
    phone: person.phone ?? undefined,
    phoneAlt: person.phoneAlt ?? undefined,
    address: person.address
      ? {
          street: person.address.street ?? undefined,
          district: person.address.district ?? undefined,
          city: person.address.city ?? undefined,
          province: person.address.province ?? undefined,
          postalCode: person.address.postalCode ?? undefined,
          country: person.address.country ?? undefined,
          latitude: person.address.latitude ?? undefined,
          longitude: person.address.longitude ?? undefined,
        }
      : undefined,
    fatherId: person.fatherId != null ? String(person.fatherId) : undefined,
    motherId: person.motherId != null ? String(person.motherId) : undefined,
    spouseIds: person.spouseIds.map(String),
    generationLabel: person.generationLabel,
    isSelf: person.isSelf,
    role: person.role,
  };
}

export function localFormToApiPayload(
  data: Omit<LocalPerson, 'id'>,
): PersonWritePayload {
  const hasAddress =
    data.address &&
    (data.address.street ||
      data.address.district ||
      data.address.city ||
      data.address.province ||
      data.address.postalCode ||
      data.address.latitude != null ||
      data.address.longitude != null);

  return {
    fullName: data.fullName.trim(),
    nickname: data.nickname?.trim() || null,
    gender: data.gender,
    birthDate: data.birthDate,
    deathDate:
      data.status === 'deceased' && data.deathDate ? data.deathDate : null,
    status: data.status,
    religion: data.religion ?? null,
    photoUrl: data.photoUrl ?? null,
    occupation: data.occupation?.trim() || null,
    phone: data.phone?.trim() || null,
    phoneAlt: data.phoneAlt?.trim() || null,
    address: hasAddress
      ? {
          street: data.address?.street ?? null,
          district: data.address?.district ?? null,
          city: data.address?.city ?? null,
          province: data.address?.province ?? null,
          postalCode: data.address?.postalCode ?? null,
          country: data.address?.country ?? 'Indonesia',
          latitude: data.address?.latitude ?? null,
          longitude: data.address?.longitude ?? null,
        }
      : null,
    fatherId: data.fatherId ? Number(data.fatherId) : null,
    motherId: data.motherId ? Number(data.motherId) : null,
    spouseIds: data.spouseIds.map(Number),
    role: data.role ?? 'member',
  };
}

export function authPersonToLocal(
  person: Pick<
    ApiPerson,
    'id' | 'fullName' | 'nickname' | 'gender' | 'birthDate' | 'status' | 'photoUrl'
  > & { spouseIds?: number[] },
): LocalPerson {
  return {
    id: String(person.id),
    fullName: person.fullName,
    nickname: person.nickname ?? undefined,
    gender: person.gender,
    birthDate: person.birthDate,
    status: person.status,
    photoUrl: person.photoUrl ?? undefined,
    spouseIds: (person.spouseIds ?? []).map(String),
    isSelf: true,
  };
}
