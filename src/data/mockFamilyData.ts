import type { FamilyData, Person } from '@/types/person';

function p(
  id: string,
  fullName: string,
  gender: Person['gender'],
  birthDate: string,
  extra: Partial<Person> = {},
): Person {
  return {
    id,
    fullName,
    gender,
    birthDate,
    status: 'alive',
    spouseIds: [],
    ...extra,
  };
}

function linkCouple(husband: Person, wife: Person): [Person, Person] {
  return [
    { ...husband, spouseIds: [wife.id] },
    { ...wife, spouseIds: [husband.id] },
  ];
}

function withParents(child: Person, fatherId: string, motherId: string): Person {
  return { ...child, fatherId, motherId };
}

export function buildMockFamilyData(): FamilyData {
  const persons: Person[] = [];
  const add = (...items: Person[]) => persons.push(...items);

  // Orang tua Buyut / moyang — pasangan terpisah per orang (bukan satu pasangan untuk semua)
  const [patGgpM, patGgpF] = linkCouple(
    p('pat-ggp-m', 'H. Mulyono Ardhyansah', 'male', '1900-01-01', {
      status: 'deceased',
      deathDate: '1972-06-10',
      generationLabel: 'Orang Tua Buyut (Ayah)',
    }),
    p('pat-ggp-f', 'Hj. Kasuma', 'female', '1902-05-01', {
      status: 'deceased',
      deathDate: '1980-12-25',
      generationLabel: 'Orang Tua Buyut (Ayah)',
    }),
  );
  const [patBuyutFGgpM, patBuyutFGgpF] = linkCouple(
    p('pat-buyut-f-ggp-m', 'H. Harjo Santoso', 'male', '1899-04-12', {
      status: 'deceased',
      deathDate: '1968-02-20',
      generationLabel: 'Orang Tua Buyut (Ayah)',
    }),
    p('pat-buyut-f-ggp-f', 'Hj. Siti Rahayu', 'female', '1903-08-30', {
      status: 'deceased',
      deathDate: '1982-10-05',
      generationLabel: 'Orang Tua Buyut (Ayah)',
    }),
  );
  const [patNbuyutGgpM, patNbuyutGgpF] = linkCouple(
    p('pat-nbuyut-ggp-m', 'H. Prasetyo', 'male', '1897-06-01', {
      status: 'deceased',
      deathDate: '1965-11-11',
      generationLabel: 'Orang Tua Buyut (Ayah)',
    }),
    p('pat-nbuyut-ggp-f', 'Hj. Ani', 'female', '1900-12-15', {
      status: 'deceased',
      deathDate: '1975-03-22',
      generationLabel: 'Orang Tua Buyut (Ayah)',
    }),
  );
  const [patNbuyutFGgpM, patNbuyutFGgpF] = linkCouple(
    p('pat-nbuyut-f-ggp-m', 'H. Basuki', 'male', '1895-01-20', {
      status: 'deceased',
      deathDate: '1960-07-08',
      generationLabel: 'Orang Tua Buyut (Ayah)',
    }),
    p('pat-nbuyut-f-ggp-f', 'Hj. Rukmini', 'female', '1898-09-03', {
      status: 'deceased',
      deathDate: '1978-01-14',
      generationLabel: 'Orang Tua Buyut (Ayah)',
    }),
  );

  const [matGgpM, matGgpF] = linkCouple(
    p('mat-ggp-m', 'H. Surya Wijaya', 'male', '1898-11-01', {
      status: 'deceased',
      deathDate: '1970-03-18',
      generationLabel: 'Orang Tua Buyut (Ibu)',
    }),
    p('mat-ggp-f', 'Hj. Mira', 'female', '1901-08-01', {
      status: 'deceased',
      deathDate: '1985-07-04',
      generationLabel: 'Orang Tua Buyut (Ibu)',
    }),
  );
  const [matBuyutFGgpM, matBuyutFGgpF] = linkCouple(
    p('mat-buyut-f-ggp-m', 'H. Gunawan', 'male', '1896-05-18', {
      status: 'deceased',
      deathDate: '1963-09-25',
      generationLabel: 'Orang Tua Buyut (Ibu)',
    }),
    p('mat-buyut-f-ggp-f', 'Hj. Wulan', 'female', '1900-02-07', {
      status: 'deceased',
      deathDate: '1979-12-01',
      generationLabel: 'Orang Tua Buyut (Ibu)',
    }),
  );
  const [matNbuyutGgpM, matNbuyutGgpF] = linkCouple(
    p('mat-nbuyut-ggp-m', 'H. Iskandar', 'male', '1894-10-10', {
      status: 'deceased',
      deathDate: '1958-04-30',
      generationLabel: 'Orang Tua Buyut (Ibu)',
    }),
    p('mat-nbuyut-ggp-f', 'Hj. Melati', 'female', '1897-07-22', {
      status: 'deceased',
      deathDate: '1971-08-16',
      generationLabel: 'Orang Tua Buyut (Ibu)',
    }),
  );
  const [matNbuyutFGgpM, matNbuyutFGgpF] = linkCouple(
    p('mat-nbuyut-f-ggp-m', 'H. Darma', 'male', '1892-03-05', {
      status: 'deceased',
      deathDate: '1955-06-12',
      generationLabel: 'Orang Tua Buyut (Ibu)',
    }),
    p('mat-nbuyut-f-ggp-f', 'Hj. Sari', 'female', '1895-11-28', {
      status: 'deceased',
      deathDate: '1973-02-09',
      generationLabel: 'Orang Tua Buyut (Ibu)',
    }),
  );

  add(
    patGgpM,
    patGgpF,
    patBuyutFGgpM,
    patBuyutFGgpF,
    patNbuyutGgpM,
    patNbuyutGgpF,
    patNbuyutFGgpM,
    patNbuyutFGgpF,
    matGgpM,
    matGgpF,
    matBuyutFGgpM,
    matBuyutFGgpF,
    matNbuyutGgpM,
    matNbuyutGgpF,
    matNbuyutFGgpM,
    matNbuyutFGgpF,
  );

  // Orang tua Kakek/Nenek — ortu kakek dan ortu nenek terpisah per jalur
  let [patBuyutM, patBuyutF] = linkCouple(
    p('pat-buyut-m', 'H. Ardhyansah', 'male', '1925-03-12', {
      status: 'deceased',
      deathDate: '1998-08-20',
      generationLabel: 'Orang Tua Kakek/Nenek (Ayah)',
      occupation: 'Petani',
    }),
    p('pat-buyut-f', 'Hj. Suminah', 'female', '1928-07-04', {
      status: 'deceased',
      deathDate: '2005-11-15',
      generationLabel: 'Orang Tua Kakek/Nenek (Ayah)',
    }),
  );
  let [patNbuyutM, patNbuyutF] = linkCouple(
    p('pat-nbuyut-m', 'H. Sutrisno', 'male', '1924-11-08', {
      status: 'deceased',
      deathDate: '1996-05-17',
      generationLabel: 'Orang Tua Kakek/Nenek (Ayah)',
      occupation: 'Tukang Kayu',
    }),
    p('pat-nbuyut-f', 'Hj. Kartini', 'female', '1927-02-19', {
      status: 'deceased',
      deathDate: '2003-09-28',
      generationLabel: 'Orang Tua Kakek/Nenek (Ayah)',
    }),
  );

  let [matBuyutM, matBuyutF] = linkCouple(
    p('mat-buyut-m', 'H. Wijaya Kusuma', 'male', '1926-01-18', {
      status: 'deceased',
      deathDate: '2001-04-09',
      generationLabel: 'Orang Tua Kakek/Nenek (Ibu)',
      occupation: 'Guru',
    }),
    p('mat-buyut-f', 'Hj. Dewi Lestari', 'female', '1930-09-22', {
      status: 'deceased',
      deathDate: '2010-06-30',
      generationLabel: 'Orang Tua Kakek/Nenek (Ibu)',
    }),
  );
  let [matNbuyutM, matNbuyutF] = linkCouple(
    p('mat-nbuyut-m', 'H. Hartono', 'male', '1923-08-14', {
      status: 'deceased',
      deathDate: '1994-12-03',
      generationLabel: 'Orang Tua Kakek/Nenek (Ibu)',
      occupation: 'Pedagang',
    }),
    p('mat-nbuyut-f', 'Hj. Sulastri', 'female', '1929-05-06', {
      status: 'deceased',
      deathDate: '2008-07-19',
      generationLabel: 'Orang Tua Kakek/Nenek (Ibu)',
    }),
  );

  patBuyutM = withParents(patBuyutM, patGgpM.id, patGgpF.id);
  patBuyutF = withParents(patBuyutF, patBuyutFGgpM.id, patBuyutFGgpF.id);
  patNbuyutM = withParents(patNbuyutM, patNbuyutGgpM.id, patNbuyutGgpF.id);
  patNbuyutF = withParents(patNbuyutF, patNbuyutFGgpM.id, patNbuyutFGgpF.id);
  matBuyutM = withParents(matBuyutM, matGgpM.id, matGgpF.id);
  matBuyutF = withParents(matBuyutF, matBuyutFGgpM.id, matBuyutFGgpF.id);
  matNbuyutM = withParents(matNbuyutM, matNbuyutGgpM.id, matNbuyutGgpF.id);
  matNbuyutF = withParents(matNbuyutF, matNbuyutFGgpM.id, matNbuyutFGgpF.id);
  add(patBuyutM, patBuyutF, patNbuyutM, patNbuyutF, matBuyutM, matBuyutF, matNbuyutM, matNbuyutF);

  // Saudara buyut (garis ayah)
  const patBuyutSibMeta = [
    { id: 'pat-buyut-sib-1', name: 'H. Karim Ardhyansah', gender: 'male' as const, birth: '1923-06-01', spouseName: 'Hj. Halimah' },
    { id: 'pat-buyut-sib-2', name: 'Hj. Maryam', gender: 'female' as const, birth: '1931-02-14', spouseName: 'H. Yusuf' },
  ];
  for (const meta of patBuyutSibMeta) {
    const sib = withParents(
      p(meta.id, meta.name, meta.gender, meta.birth, {
        generationLabel: 'Saudara Orang Tua Buyut (Ayah)',
        status: 'deceased',
        deathDate: '2015-01-01',
      }),
      patGgpM.id,
      patGgpF.id,
    );
    const spouseGender = meta.gender === 'male' ? 'female' : 'male';
    const [s, sp] = linkCouple(sib, p(`${meta.id}-sp`, meta.spouseName, spouseGender, '1925-01-01'));
    add(s, sp);
  }

  // Saudara buyut (garis ibu)
  const matBuyutSibMeta = [
    { id: 'mat-buyut-sib-1', name: 'H. Slamet Wijaya', gender: 'male' as const, birth: '1924-09-20', spouseName: 'Hj. Kasih' },
    { id: 'mat-buyut-sib-2', name: 'Hj. Siti Aminah', gender: 'female' as const, birth: '1932-12-05', spouseName: 'H. Rahman' },
  ];
  for (const meta of matBuyutSibMeta) {
    const sib = withParents(
      p(meta.id, meta.name, meta.gender, meta.birth, {
        generationLabel: 'Saudara Orang Tua Buyut (Ibu)',
        status: 'deceased',
        deathDate: '2018-03-01',
      }),
      matGgpM.id,
      matGgpF.id,
    );
    const spouseGender = meta.gender === 'male' ? 'female' : 'male';
    const [s, sp] = linkCouple(sib, p(`${meta.id}-sp`, meta.spouseName, spouseGender, '1926-01-01'));
    add(s, sp);
  }

  // Gen 1 — Kakek & Nenek
  let [patGpM, patGpF] = linkCouple(
    withParents(
      p('pat-gp-m', 'H. Wijaya', 'male', '1950-05-08', {
        generationLabel: 'Kakek (Ayah)',
        occupation: 'PNS',
      }),
      patBuyutM.id,
      patBuyutF.id,
    ),
    withParents(
      p('pat-gp-f', 'Hj. Ratna Sari', 'female', '1953-12-01', {
        generationLabel: 'Nenek (Ayah)',
      }),
      patNbuyutM.id,
      patNbuyutF.id,
    ),
  );

  let [matGpM, matGpF] = linkCouple(
    withParents(
      p('mat-gp-m', 'H. Agus Salim', 'male', '1952-02-14', {
        generationLabel: 'Kakek (Ibu)',
        occupation: 'Pedagang',
      }),
      matBuyutM.id,
      matBuyutF.id,
    ),
    withParents(
      p('mat-gp-f', 'Hj. Lestari', 'female', '1955-08-27', {
        generationLabel: 'Nenek (Ibu)',
      }),
      matNbuyutM.id,
      matNbuyutF.id,
    ),
  );

  add(patGpM, patGpF, matGpM, matGpF);

  // Saudara kakek/nenek (garis ayah)
  const patGpSibMeta = [
    { id: 'pat-gp-sib-1', name: 'H. Bambang Wijaya', gender: 'male' as const, birth: '1948-03-22', spouseName: 'Hj. Suryani' },
    { id: 'pat-gp-sib-2', name: 'Hj. Endang', gender: 'female' as const, birth: '1956-07-10', spouseName: 'H. Herman' },
  ];
  for (const meta of patGpSibMeta) {
    const sib = withParents(
      p(meta.id, meta.name, meta.gender, meta.birth, {
        generationLabel: 'Saudara Kakek/Nenek (Ayah)',
      }),
      patBuyutM.id,
      patBuyutF.id,
    );
    const spouseGender = meta.gender === 'male' ? 'female' : 'male';
    const [s, sp] = linkCouple(sib, p(`${meta.id}-sp`, meta.spouseName, spouseGender, '1950-01-01'));
    add(s, sp);
  }

  // Saudara kakek/nenek (garis ibu)
  const matGpSibMeta = [
    { id: 'mat-gp-sib-1', name: 'H. Candra Salim', gender: 'male' as const, birth: '1949-11-05', spouseName: 'Hj. Mirna' },
    { id: 'mat-gp-sib-2', name: 'Hj. Indah', gender: 'female' as const, birth: '1958-04-18', spouseName: 'H. Jaya' },
  ];
  for (const meta of matGpSibMeta) {
    const sib = withParents(
      p(meta.id, meta.name, meta.gender, meta.birth, {
        generationLabel: 'Saudara Kakek/Nenek (Ibu)',
      }),
      matBuyutM.id,
      matBuyutF.id,
    );
    const spouseGender = meta.gender === 'male' ? 'female' : 'male';
    const [s, sp] = linkCouple(sib, p(`${meta.id}-sp`, meta.spouseName, spouseGender, '1952-01-01'));
    add(s, sp);
  }

  // Gen 2 — 6 anak kakek/nenek ayah (Ayah + 5 saudara)
  const patSiblingMeta = [
    { id: 'pat-sib-1', name: 'H. Tono Wijaya', gender: 'male' as const, birth: '1970-04-03', spouseId: 'pat-sib-1-sp', spouseName: 'Hj. Yuni Hartati' },
    { id: 'pat-sib-2', name: 'H. Joko Susilo', gender: 'male' as const, birth: '1972-09-15', spouseId: 'pat-sib-2-sp', spouseName: 'Hj. Wati Indah' },
    { id: 'father', name: 'H. Budi Ardhyansah', gender: 'male' as const, birth: '1975-01-20', spouseId: 'mother', spouseName: 'Hj. Citra Maharani', isFather: true },
    { id: 'pat-sib-3', name: 'Hj. Siti Rahayu', gender: 'female' as const, birth: '1977-06-11', spouseId: 'pat-sib-3-sp', spouseName: 'H. Eko Prasetyo' },
    { id: 'pat-sib-4', name: 'H. Rudi Hartono', gender: 'male' as const, birth: '1979-11-28', spouseId: 'pat-sib-4-sp', spouseName: 'Hj. Nia Permata' },
    { id: 'pat-sib-5', name: 'Hj. Ani Wulandari', gender: 'female' as const, birth: '1982-03-05', spouseId: 'pat-sib-5-sp', spouseName: 'H. Dimas Anggara' },
  ];

  let father!: Person;
  let mother!: Person;

  for (const meta of patSiblingMeta) {
    const sibling = withParents(
      p(meta.id, meta.name, meta.gender, meta.birth, {
        nickname: meta.isFather ? 'Ayah' : undefined,
        generationLabel: meta.isFather ? 'Ayah' : 'Paman/Bibi (Ayah)',
        occupation: meta.isFather ? 'Wiraswasta' : undefined,
      }),
      patGpM.id,
      patGpF.id,
    );

    if (meta.isFather) {
      father = sibling;
      add(sibling);
    } else {
      const spouseGender = meta.gender === 'male' ? 'female' : 'male';
      const [s, sp] = linkCouple(
        sibling,
        p(meta.spouseId, meta.spouseName, spouseGender, '1975-01-01'),
      );
      add(s, sp);
    }
  }

  // Gen 2 — 7 anak kakek/nenek ibu (Ibu + 6 saudara)
  const matSiblingMeta = [
    { id: 'mat-sib-1', name: 'H. Agus Pratama', gender: 'male' as const, birth: '1971-02-18', spouseId: 'mat-sib-1-sp', spouseName: 'Hj. Rina Melati' },
    { id: 'mat-sib-2', name: 'Hj. Dewi Anggraini', gender: 'female' as const, birth: '1973-07-25', spouseId: 'mat-sib-2-sp', spouseName: 'H. Bambang Setiawan' },
    { id: 'mother', name: 'Hj. Citra Maharani', gender: 'female' as const, birth: '1976-10-12', spouseId: 'father', spouseName: 'H. Budi Ardhyansah', isMother: true },
    { id: 'mat-sib-3', name: 'H. Hendra Kusuma', gender: 'male' as const, birth: '1978-04-30', spouseId: 'mat-sib-3-sp', spouseName: 'Hj. Fitri Handayani' },
    { id: 'mat-sib-4', name: 'Hj. Rina Safitri', gender: 'female' as const, birth: '1980-12-08', spouseId: 'mat-sib-4-sp', spouseName: 'H. Yoga Mahendra' },
    { id: 'mat-sib-5', name: 'H. Fajar Nugroho', gender: 'male' as const, birth: '1983-05-17', spouseId: 'mat-sib-5-sp', spouseName: 'Hj. Siska Amelia' },
    { id: 'mat-sib-6', name: 'Hj. Maya Sari', gender: 'female' as const, birth: '1985-09-03', spouseId: 'mat-sib-6-sp', spouseName: 'H. Rizky Aditya' },
  ];

  for (const meta of matSiblingMeta) {
    const sibling = withParents(
      p(meta.id, meta.name, meta.gender, meta.birth, {
        nickname: meta.isMother ? 'Ibu' : undefined,
        generationLabel: meta.isMother ? 'Ibu' : 'Paman/Bibi (Ibu)',
        occupation: meta.isMother ? 'Guru SD' : undefined,
      }),
      matGpM.id,
      matGpF.id,
    );

    if (meta.isMother) {
      mother = sibling;
      add(sibling);
    } else {
      const spouseGender = meta.gender === 'male' ? 'female' : 'male';
      const [s, sp] = linkCouple(
        sibling,
        p(meta.spouseId, meta.spouseName, spouseGender, '1975-01-01'),
      );
      add(s, sp);
    }
  }

  // Link ayah & ibu
  [father, mother] = linkCouple(father, mother);
  const fatherIdx = persons.findIndex((x) => x.id === father.id);
  const motherIdx = persons.findIndex((x) => x.id === mother.id);
  persons[fatherIdx] = father;
  persons[motherIdx] = mother;

  // Garis keluarga pasangan (sederhana — tanpa paman/bibi)
  const [spPatBuyutM, spPatBuyutF] = linkCouple(
    p('sp-pat-buyut-m', 'H. Kirana', 'male', '1927-02-10', {
      status: 'deceased',
      deathDate: '2000-05-12',
      generationLabel: 'Buyut Pasangan (Ayah)',
    }),
    p('sp-pat-buyut-f', 'Hj. Mulyani', 'female', '1930-08-25', {
      status: 'deceased',
      deathDate: '2008-01-03',
      generationLabel: 'Buyut Pasangan (Ayah)',
    }),
  );

  const [spMatBuyutM, spMatBuyutF] = linkCouple(
    p('sp-mat-buyut-m', 'H. Santoso', 'male', '1929-06-18', {
      status: 'deceased',
      deathDate: '2003-09-07',
      generationLabel: 'Buyut Pasangan (Ibu)',
    }),
    p('sp-mat-buyut-f', 'Hj. Wulan', 'female', '1932-11-30', {
      status: 'deceased',
      deathDate: '2012-04-22',
      generationLabel: 'Buyut Pasangan (Ibu)',
    }),
  );

  add(spPatBuyutM, spPatBuyutF, spMatBuyutM, spMatBuyutF);

  const [spPatGpM, spPatGpF] = linkCouple(
    withParents(
      p('sp-pat-gp-m', 'H. Hartono', 'male', '1951-04-05', {
        generationLabel: 'Kakek Pasangan (Ayah)',
      }),
      spPatBuyutM.id,
      spPatBuyutF.id,
    ),
    withParents(
      p('sp-pat-gp-f', 'Hj. Ani', 'female', '1954-10-20', {
        generationLabel: 'Nenek Pasangan (Ayah)',
      }),
      spPatBuyutM.id,
      spPatBuyutF.id,
    ),
  );

  const [spMatGpM, spMatGpF] = linkCouple(
    withParents(
      p('sp-mat-gp-m', 'H. Basuki', 'male', '1953-07-14', {
        generationLabel: 'Kakek Pasangan (Ibu)',
      }),
      spMatBuyutM.id,
      spMatBuyutF.id,
    ),
    withParents(
      p('sp-mat-gp-f', 'Hj. Sari', 'female', '1956-12-02', {
        generationLabel: 'Nenek Pasangan (Ibu)',
      }),
      spMatBuyutM.id,
      spMatBuyutF.id,
    ),
  );

  add(spPatGpM, spPatGpF, spMatGpM, spMatGpF);

  let [spFather, spMother] = linkCouple(
    withParents(
      p('sp-father', 'H. Agus Kirana', 'male', '1978-03-08', {
        nickname: 'Ayah Pasangan',
        generationLabel: 'Ayah Pasangan',
        occupation: 'Dokter',
      }),
      spPatGpM.id,
      spPatGpF.id,
    ),
    withParents(
      p('sp-mother', 'Hj. Melati', 'female', '1980-09-15', {
        nickname: 'Ibu Pasangan',
        generationLabel: 'Ibu Pasangan',
      }),
      spMatGpM.id,
      spMatGpF.id,
    ),
  );

  add(spFather, spMother);

  // Gen 3 — 3 saudara + diri sendiri, masing-masing menikah + 2 anak
  const myGenMeta = [
    {
      id: 'sib-1',
      name: 'H. Andi Pratama',
      gender: 'male' as const,
      birth: '1998-03-14',
      nickname: 'Kak Andi',
      spouseId: 'sib-1-sp',
      spouseName: 'Hj. Rina Oktavia',
      children: [
        { id: 'sib-1-c1', name: 'Fadil Ardhyansah', gender: 'male' as const, birth: '2020-06-01' },
        { id: 'sib-1-c2', name: 'Fira Maharani', gender: 'female' as const, birth: '2022-11-18' },
      ],
    },
    {
      id: 'me',
      name: 'Irfa Ardhyansah',
      gender: 'male' as const,
      birth: '2000-08-22',
      nickname: 'Kamu',
      isSelf: true,
      spouseId: 'me-sp',
      spouseName: 'Hj. Ayu Kirana',
      children: [
        { id: 'me-c1', name: 'Zahra Kirana', gender: 'female' as const, birth: '2024-02-10' },
        { id: 'me-c2', name: 'Zaki Ardhyansah', gender: 'male' as const, birth: '2023-09-05' },
      ],
    },
    {
      id: 'sib-2',
      name: 'Hj. Sari Dewi',
      gender: 'female' as const,
      birth: '2002-01-07',
      nickname: 'Adik Sari',
      spouseId: 'sib-2-sp',
      spouseName: 'H. Doni Saputra',
      children: [
        { id: 'sib-2-c1', name: 'Kevin Saputra', gender: 'male' as const, birth: '2023-04-22' },
        { id: 'sib-2-c2', name: 'Karin Saputra', gender: 'female' as const, birth: '2025-01-30' },
      ],
    },
    {
      id: 'sib-3',
      name: 'H. Bayu Nugroho',
      gender: 'male' as const,
      birth: '2004-12-19',
      nickname: 'Adik Bayu',
      spouseId: 'sib-3-sp',
      spouseName: 'Hj. Lina Permata',
      children: [
        { id: 'sib-3-c1', name: 'Reza Nugroho', gender: 'male' as const, birth: '2024-07-14' },
        { id: 'sib-3-c2', name: 'Rani Nugroho', gender: 'female' as const, birth: '2025-03-08' },
      ],
    },
  ];

  for (const meta of myGenMeta) {
    const person = withParents(
      p(meta.id, meta.name, meta.gender, meta.birth, {
        nickname: meta.nickname,
        isSelf: meta.isSelf,
        generationLabel: meta.isSelf ? 'Kamu' : 'Saudara',
        occupation: meta.isSelf ? 'Software Engineer' : undefined,
      }),
      father.id,
      mother.id,
    );

    const spouseGender = meta.gender === 'male' ? 'female' : 'male';
    const spouseBase =
      meta.spouseId === 'me-sp'
        ? withParents(
            p(meta.spouseId, meta.spouseName, spouseGender, '2001-05-17', {
              nickname: 'Ayu',
              generationLabel: 'Pasangan',
            }),
            spFather.id,
            spMother.id,
          )
        : p(meta.spouseId, meta.spouseName, spouseGender, '2000-01-01', {
            generationLabel: 'Pasangan',
          });

    const [self, spouse] = linkCouple(person, spouseBase);

    add(self, spouse);

    for (const childMeta of meta.children) {
      add(
        withParents(
          p(childMeta.id, childMeta.name, childMeta.gender, childMeta.birth, {
            generationLabel: 'Anak',
          }),
          meta.gender === 'male' ? meta.id : meta.spouseId,
          meta.gender === 'female' ? meta.id : meta.spouseId,
        ),
      );
    }
  }

  return {
    persons,
    rootPersonId: 'me',
  };
}

export const MOCK_FAMILY = buildMockFamilyData();

export function getPersonById(id: string): Person | undefined {
  return MOCK_FAMILY.persons.find((person) => person.id === id);
}

export function getMySpouse(): Person | undefined {
  const me = getPersonById('me');
  const spouseId = me?.spouseIds[0];
  return spouseId ? getPersonById(spouseId) : undefined;
}

export function getFamilyStats() {
  const { persons } = MOCK_FAMILY;
  const generations = new Set<number>();

  const depthCache = new Map<string, number>();

  function getDepth(id: string): number {
    if (depthCache.has(id)) return depthCache.get(id)!;
    const person = persons.find((p) => p.id === id);
    if (!person?.fatherId && !person?.motherId) {
      depthCache.set(id, 0);
      return 0;
    }
    const fatherDepth = person.fatherId ? getDepth(person.fatherId) : -1;
    const motherDepth = person.motherId ? getDepth(person.motherId) : -1;
    const depth = Math.max(fatherDepth, motherDepth) + 1;
    depthCache.set(id, depth);
    return depth;
  }

  for (const person of persons) {
    generations.add(getDepth(person.id));
  }

  return {
    totalMembers: persons.length,
    generations: generations.size,
    alive: persons.filter((p) => p.status === 'alive').length,
    deceased: persons.filter((p) => p.status === 'deceased').length,
  };
}
