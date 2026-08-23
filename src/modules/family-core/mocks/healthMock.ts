import type { MemberHealthProfile } from '@/modules/family-core/types';

function isoDaysFromNow(days: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function isoMonthsAgo(months: number, day = 15): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setMonth(d.getMonth() - months);
  d.setDate(day);
  return d.toISOString().slice(0, 10);
}

export const HEALTH_PROFILES: MemberHealthProfile[] = [
  {
    memberId: 'm-father',
    basics: {
      bloodType: 'O+',
      heightCm: 168,
      weightKg: 72,
      notes: 'Kontrol tekanan darah rutin',
    },
    conditions: [
      {
        id: 'hc-f1',
        name: 'Hipertensi',
        diagnosedAt: '2019-04-10',
        status: 'pantau',
        notes: 'Target < 130/80',
      },
    ],
    surgeries: [],
    allergies: [
      {
        id: 'ha-f1',
        kind: 'obat',
        name: 'Aspirin',
        severity: 'sedang',
        notes: 'Mual',
      },
    ],
    medications: [
      {
        id: 'hm-f1',
        name: 'Amlodipine',
        dose: '5 mg',
        schedule: 'Setiap pagi setelah makan',
        reminderEnabled: true,
        notes: '',
      },
    ],
    appointments: [
      {
        id: 'hap-f1',
        title: 'Kontrol jantung',
        doctor: 'dr. Budi, Sp.JP',
        place: 'RS Harapan',
        at: `${isoDaysFromNow(18)}T09:00:00`,
        reminderEnabled: true,
        notes: 'Bawa hasil lab terakhir',
        calendarEventId: 'cal-dokter-1',
      },
    ],
    vaccines: [
      {
        id: 'hv-f1',
        name: 'Influenza',
        date: isoMonthsAgo(8),
        doseLabel: 'Tahunan',
        notes: '',
      },
    ],
    notes: [
      {
        id: 'hn-f1',
        title: 'Lab lipid',
        kind: 'lab',
        date: isoMonthsAgo(2),
        summary: 'Kolesterol total 198 — pantau diet.',
      },
    ],
    xrays: [
      {
        id: 'hx-f1',
        title: 'Rontgen thorax',
        bodyPart: 'dada',
        date: isoMonthsAgo(3),
        facility: 'RS Harapan',
        notes: 'Hasil dalam batas normal',
        imageUrl: null,
      },
      {
        id: 'hx-f2',
        title: 'Rontgen tulang punggung',
        bodyPart: 'tulang',
        date: isoMonthsAgo(14),
        facility: 'Klinik Radiologi Sehat',
        notes: 'Mild spondylosis',
        imageUrl: null,
      },
    ],
    growth: [],
  },
  {
    memberId: 'm-mother',
    basics: {
      bloodType: 'B+',
      heightCm: 155,
      weightKg: 58,
      notes: '',
    },
    conditions: [],
    surgeries: [
      {
        id: 'hs-m1',
        name: 'Operasi katarak mata kiri',
        date: '2022-11-03',
        hospital: 'RS Mata Nusantara',
        notes: 'Kontrol tahunan',
      },
    ],
    allergies: [
      {
        id: 'ha-m1',
        kind: 'makanan',
        name: 'Udang',
        severity: 'berat',
        notes: 'Ruam & sesak',
      },
    ],
    medications: [],
    appointments: [],
    vaccines: [
      {
        id: 'hv-m1',
        name: 'COVID-19 booster',
        date: '2024-06-12',
        doseLabel: 'Booster 2',
        notes: '',
      },
    ],
    notes: [],
    xrays: [],
    growth: [],
  },
  {
    memberId: 'm-irfani',
    basics: {
      bloodType: 'O+',
      heightCm: 172,
      weightKg: 68,
      notes: '',
    },
    conditions: [
      {
        id: 'hc-i1',
        name: 'Asma ringan',
        diagnosedAt: '2010-08-01',
        status: 'pantau',
        notes: 'Jarang kambuh',
      },
    ],
    surgeries: [],
    allergies: [
      {
        id: 'ha-i1',
        kind: 'obat',
        name: 'Penisilin',
        severity: 'sedang',
        notes: '',
      },
    ],
    medications: [
      {
        id: 'hm-i1',
        name: 'Ventolin',
        dose: '2 puff',
        schedule: 'Saat sesak',
        reminderEnabled: false,
        notes: 'Bawa saat bepergian',
      },
    ],
    appointments: [],
    vaccines: [],
    notes: [
      {
        id: 'hn-i1',
        title: 'Medical check-up',
        kind: 'dokter',
        date: isoMonthsAgo(5),
        summary: 'Hasil normal. Saran olahraga 3x/minggu.',
      },
    ],
    xrays: [],
    growth: [],
  },
  {
    memberId: 'm-ayu',
    basics: {
      bloodType: 'A+',
      heightCm: 160,
      weightKg: 52,
      notes: '',
    },
    conditions: [],
    surgeries: [],
    allergies: [
      {
        id: 'ha-a1',
        kind: 'makanan',
        name: 'Kacang tanah',
        severity: 'berat',
        notes: 'Bawa epipen jika bepergian',
      },
    ],
    medications: [
      {
        id: 'hm-a1',
        name: 'Vitamin D',
        dose: '1000 IU',
        schedule: 'Setiap malam',
        reminderEnabled: true,
        notes: '',
      },
    ],
    appointments: [
      {
        id: 'hap-a1',
        title: 'Kontrol gigi',
        doctor: 'drg. Sari',
        place: 'Klinik Gigi Ceria',
        at: `${isoDaysFromNow(5)}T16:30:00`,
        reminderEnabled: true,
        notes: '',
        calendarEventId: 'cal-dokter-2',
      },
    ],
    vaccines: [],
    notes: [],
    xrays: [],
    growth: [],
  },
  {
    memberId: 'm-zahra',
    basics: {
      bloodType: 'A+',
      heightCm: 86,
      weightKg: 12.2,
      notes: 'Zahra Kirana — pantau tumbuh kembang',
    },
    conditions: [],
    surgeries: [],
    allergies: [],
    medications: [],
    appointments: [
      {
        id: 'hap-zh1',
        title: 'Kontrol tumbuh kembang',
        doctor: 'dr. Lina, Sp.A',
        place: 'Klinik Anak Sehat',
        at: `${isoDaysFromNow(20)}T09:30:00`,
        reminderEnabled: true,
        notes: '',
        calendarEventId: 'cal-dokter-4',
      },
    ],
    vaccines: [
      {
        id: 'hv-zh1',
        name: 'MR',
        date: isoMonthsAgo(8),
        doseLabel: 'Dosis 1',
        notes: '',
      },
    ],
    notes: [],
    xrays: [],
    growth: [
      {
        id: 'g-zh1',
        date: isoMonthsAgo(12),
        heightCm: 78,
        weightKg: 10.1,
      },
      {
        id: 'g-zh2',
        date: isoMonthsAgo(6),
        heightCm: 82,
        weightKg: 11.2,
      },
      {
        id: 'g-zh3',
        date: isoMonthsAgo(0),
        heightCm: 86,
        weightKg: 12.2,
      },
    ],
  },
  {
    memberId: 'm-zaka',
    basics: {
      bloodType: 'O+',
      heightCm: 92,
      weightKg: 13.8,
      notes: 'Zaka — pantau alergi susu',
    },
    conditions: [],
    surgeries: [],
    allergies: [
      {
        id: 'ha-zk1',
        kind: 'makanan',
        name: 'Susu sapi',
        severity: 'ringan',
        notes: 'Gatal ringan',
      },
    ],
    medications: [],
    appointments: [
      {
        id: 'hap-zk1',
        title: 'Imunisasi & tumbuh kembang',
        doctor: 'dr. Lina, Sp.A',
        place: 'Klinik Anak Sehat',
        at: `${isoDaysFromNow(12)}T10:00:00`,
        reminderEnabled: true,
        notes: '',
        calendarEventId: 'cal-dokter-3',
      },
    ],
    vaccines: [
      {
        id: 'hv-zk1',
        name: 'MR',
        date: isoMonthsAgo(14),
        doseLabel: 'Dosis 2',
        notes: '',
      },
      {
        id: 'hv-zk2',
        name: 'DTP',
        date: isoMonthsAgo(20),
        doseLabel: 'Booster',
        notes: '',
      },
    ],
    notes: [],
    xrays: [],
    growth: [
      {
        id: 'g-zk1',
        date: isoMonthsAgo(18),
        heightCm: 84,
        weightKg: 11.5,
      },
      {
        id: 'g-zk2',
        date: isoMonthsAgo(12),
        heightCm: 88,
        weightKg: 12.4,
      },
      {
        id: 'g-zk3',
        date: isoMonthsAgo(6),
        heightCm: 90,
        weightKg: 13.1,
      },
      {
        id: 'g-zk4',
        date: isoMonthsAgo(0),
        heightCm: 92,
        weightKg: 13.8,
      },
    ],
  },
];

export function emptyHealthProfile(memberId: string): MemberHealthProfile {
  return {
    memberId,
    basics: {
      bloodType: null,
      heightCm: null,
      weightKg: null,
      notes: '',
    },
    conditions: [],
    surgeries: [],
    allergies: [],
    medications: [],
    appointments: [],
    vaccines: [],
    notes: [],
    xrays: [],
    growth: [],
  };
}
