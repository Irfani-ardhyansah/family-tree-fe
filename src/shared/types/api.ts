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
  generationsDown: number;
  showSpouses: boolean;
  showSiblings: boolean;
  /** Derived: generationsDown > 0 — kept for BE compatibility */
  showChildren: boolean;
};

export type TreeFilterMeta = TreeFilterParams & {
  applied: boolean;
};

/** List-only query: tree view ignores this and uses lineage filters instead. */
export type PersonListScope = 'branch' | 'family';

export type PersonListResponse =
  | {
      view: 'list';
      focusPersonId?: number;
      selfPersonId?: number;
      rootPersonId: number | null;
      /** Echo of list query; default BE behavior is `branch`. */
      scope?: PersonListScope;
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

export type AllowedFocusPerson = {
  id: number;
  fullName: string;
  nickname: string | null;
  gender: Gender;
  photoUrl: string | null;
  relation: 'self' | 'spouse';
};

export type AuthPerson = Pick<
  Person,
  'id' | 'fullName' | 'nickname' | 'gender' | 'birthDate' | 'status' | 'photoUrl'
> & {
  isMarried: boolean;
  isLegal: boolean;
  spouseIds: number[];
  /** From family_members.role — prefer with `isAdmin` from auth/me */
  role?: PersonRole;
  isAdmin?: boolean;
  /** Self first, then spouses — synced with allowedFocusPersonIds */
  allowedFocusPersons?: AllowedFocusPerson[];
};

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  person: AuthPerson;
};

export type AuthMeResponse = AuthPerson & {
  familyId: number;
  readFocusPersonId?: number;
  allowedFocusPersonIds?: number[];
};

export type PersonOptionsResponse = {
  options: Record<string, string>;
};

export type PatchPersonOptionPayload = {
  setting: string;
  value: string;
};

export type PersonWritePayload = {
  fullName: string;
  nickname?: string | null;
  gender: Gender;
  birthDate: string;
  deathDate?: string | null;
  status: PersonStatus;
  religion?: 'islam' | 'other' | null;
  photoUrl?: string | null;
  mediaId?: string | null;
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

export type EventType =
  | 'wedding'
  | 'birth'
  | 'death'
  | 'birthday'
  | 'reunion'
  | 'other';

export type MapMeta = {
  totalVisible: number;
  withAddress: number;
  withExactCoords: number;
  withCityOnly: number;
};

export type PersonMapResponse = {
  focusPersonId: number;
  selfPersonId: number;
  allowedFocusPersonIds: number[];
  persons: Person[];
  meta: MapMeta;
};

export type ApiEventContribution = {
  id: number;
  photoUrl: string;
  contributorId: number;
  contributorName?: string;
  caption: string | null;
  createdAt: string;
};

export type ApiEvent = {
  id: number;
  title: string;
  type: EventType;
  date: string;
  endDate: string | null;
  location: string | null;
  /** Absen / null pada `view=calendar` (payload ringan) */
  description?: string | null;
  personIds: number[];
  /** Absen pada `view=calendar` */
  photoUrls?: string[];
  /** Absen pada `view=calendar` */
  attendeeIds?: number[];
  contributions?: ApiEventContribution[];
  isRestricted: boolean;
  canAccess: boolean;
  contributionCount?: number;
  /** Person id pembuat acara — absen pada `view=calendar` */
  createdById?: number;
  /** true jika viewer (selfPersonId) === createdById */
  canManage?: boolean;
};

export type EventListResponse = {
  focusPersonId: number;
  selfPersonId: number;
  allowedFocusPersonIds?: number[];
  events: ApiEvent[];
  pagination?: PaginationMeta;
};

export type EventDetailResponse = {
  focusPersonId?: number;
  selfPersonId: number;
  allowedFocusPersonIds?: number[];
  event: ApiEvent;
};

/** POST/PATCH /events — data wrap */
export type EventWriteResponse = {
  focusPersonId?: number;
  selfPersonId: number;
  allowedFocusPersonIds?: number[];
  event: ApiEvent;
};

export type EventWritePayload = {
  title: string;
  type: EventType;
  date: string;
  endDate?: string | null;
  location?: string | null;
  description?: string | null;
  personIds?: number[];
  photoUrls?: string[];
  mediaIds?: string[];
  attendeeIds?: number[];
};

export type ContributionWritePayload = {
  photoUrl?: string | null;
  caption?: string | null;
  mediaIds?: string[];
};

export type MemoriamDeceasedItem = {
  id: number;
  fullName: string;
  nickname: string | null;
  gender: Gender;
  birthDate: string;
  deathDate: string | null;
  status?: PersonStatus;
  photoUrl: string | null;
  generationLabel: string;
  religion?: 'islam' | 'other' | null;
  tributeCount: number;
  prayerCount: number;
  canAccess?: boolean;
};

export type MemoriamDeceasedListResponse = {
  focusPersonId: number;
  selfPersonId: number;
  allowedFocusPersonIds?: number[];
  deceased: MemoriamDeceasedItem[];
};

export type MemoriamDetailResponse = {
  focusPersonId: number;
  selfPersonId: number;
  allowedFocusPersonIds?: number[];
  deceased: MemoriamDeceasedItem;
};

export type MemoriamTributesResponse = {
  focusPersonId: number;
  selfPersonId: number;
  allowedFocusPersonIds?: number[];
  tributes: ApiMemoriamTribute[];
};

/** POST/PATCH tribute — single object */
export type MemoriamTributeWriteResponse = {
  focusPersonId?: number;
  selfPersonId: number;
  allowedFocusPersonIds?: number[];
  tribute: ApiMemoriamTribute;
};

export type MemoriamPrayersResponse = {
  focusPersonId: number;
  selfPersonId: number;
  allowedFocusPersonIds?: number[];
  prayers: ApiPrayerRecord[];
};

export type MemoriamMyPrayerResponse = {
  focusPersonId: number;
  selfPersonId: number;
  allowedFocusPersonIds?: number[];
  hasPrayed: boolean;
  prayer?: ApiPrayerRecord | null;
};

export type ApiMemoriamTribute = {
  id: number;
  deceasedId?: number;
  authorId: number;
  authorName?: string;
  content: string;
  photoUrls: string[];
  createdAt: string;
  updatedAt?: string;
  /** true jika viewer (selfPersonId) === authorId */
  canManage?: boolean;
};

export type ApiPrayerRecord = {
  id: number;
  deceasedId: number;
  authorId: number;
  createdAt: string;
};

export type TributeWritePayload = {
  content: string;
  photoUrls?: string[];
  mediaIds?: string[];
};

export type DashboardFocusPerson = {
  id: number;
  fullName: string;
  nickname: string | null;
  photoUrl: string | null;
  gender: Gender;
};

export type DashboardStats = {
  memberCount: number;
  generationCount: number;
  photoCount: number;
  upcomingEventCount: number;
};

export type DashboardMemoriamItem = MemoriamDeceasedItem & {
  latestTributeAt?: string | null;
};

export type DashboardResponse = {
  focusPersonId: number;
  selfPersonId: number;
  allowedFocusPersonIds?: number[];
  focusPerson: DashboardFocusPerson;
  stats: DashboardStats;
  recentEvents: ApiEvent[];
  upcomingEvents: ApiEvent[];
  recentMemoriam: DashboardMemoriamItem[];
};
