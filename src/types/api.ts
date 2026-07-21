export type ApiSuccess<T> = { data: T };
export type ApiError = { error: { code: string; message: string } };

export type Gender = 'male' | 'female';
export type PersonStatus = 'alive' | 'deceased';
export type PersonRole = 'admin' | 'member';

export type PersonAddress = {
  street?: string | null;
  district?: string | null;
  city?: string | null;
  province?: string | null;
  postalCode?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export type Person = {
  id: number;
  fullName: string;
  nickname: string | null;
  gender: Gender;
  birthDate: string;
  deathDate: string | null;
  status: PersonStatus;
  religion: 'islam' | 'other' | null;
  photoUrl: string | null;
  occupation: string | null;
  phone: string | null;
  phoneAlt: string | null;
  address: PersonAddress | null;
  fatherId: number | null;
  motherId: number | null;
  spouseIds: number[];
  generationLabel: string;
  isSelf: boolean;
  role: PersonRole;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

export type GraphWarning = {
  code: string;
  personId?: number;
  personIds?: number[];
  field?: string;
  message?: string;
};

export type TreeMeta = {
  personCount: number;
  totalFamilyCount?: number;
  maxAncestorDepth?: number;
  filtered?: boolean;
  recommendClientFilter?: boolean;
};

export type TreeFilterParams = {
  lineage: 'both' | 'paternal' | 'maternal';
  generationsUp: number;
  showSpouses: boolean;
  showSiblings: boolean;
  showChildren: boolean;
};

export type TreeFilterMeta = TreeFilterParams & {
  applied: boolean;
};

export type PersonListResponse =
  | {
      view: 'list';
      focusPersonId?: number;
      selfPersonId?: number;
      rootPersonId: number | null;
      persons: Person[];
      pagination: PaginationMeta;
    }
  | {
      view: 'tree';
      focusPersonId: number;
      selfPersonId: number;
      rootPersonId: number | null;
      persons: Person[];
      treeGraph: {
        anchorPersonId: number | null;
        edgeFields: {
          parent: ['fatherId', 'motherId'];
          spouse: 'spouseIds';
        };
        note?: string;
      };
      meta?: TreeMeta;
      filter?: TreeFilterMeta;
      graphWarnings?: GraphWarning[];
    };

export type AuthPerson = Pick<
  Person,
  'id' | 'fullName' | 'nickname' | 'gender' | 'birthDate' | 'status' | 'photoUrl'
> & {
  isMarried: boolean;
  isLegal: boolean;
  spouseIds: number[];
  role?: PersonRole;
};

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  person: AuthPerson;
};

export type AuthMeResponse = AuthPerson & { familyId: number };

export type PersonWritePayload = {
  fullName: string;
  nickname?: string | null;
  gender: Gender;
  birthDate: string;
  deathDate?: string | null;
  status: PersonStatus;
  religion?: 'islam' | 'other' | null;
  photoUrl?: string | null;
  occupation?: string | null;
  phone?: string | null;
  phoneAlt?: string | null;
  address?: PersonAddress | null;
  fatherId?: number | null;
  motherId?: number | null;
  spouseIds?: number[];
  role?: PersonRole;
};

export type RefreshResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};
