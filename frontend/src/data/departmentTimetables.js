/**
 * Centralized Department Class Timetables
 * Replicating the BMU Faculty of Engineering Class Time Table (Winter 2026, 3rd Div-A)
 * 
 * Batch-Section Mapping:
 * - BATCH A1 -> Sec A
 * - BATCH A2 -> Sec B
 * - BATCH A3 -> Sec C
 */

export const PERIOD_SLOTS = [
  { id: 1, period: "1", time: "9:00 TO 10:00", label: "Period 1 (09:00 - 10:00)" },
  { id: 2, period: "2", time: "10:00 TO 11:00", label: "Period 2 (10:00 - 11:00)" },
  { id: 3, period: "3", time: "11:00 TO 12:00", label: "Period 3 (11:00 - 12:00)" },
  { id: 4, period: "4", time: "12:00 TO 1:00", label: "Period 4 (12:00 - 13:00)" },
  { id: "lunch", period: "LUNCH", time: "01:00 TO 01:30", label: "Recess (13:00 - 13:30)", isLunch: true },
  { id: 5, period: "5", time: "1:30 TO 2:20", label: "Period 5 (13:30 - 14:20)" },
  { id: 6, period: "6", time: "2:20 TO 3:10", label: "Period 6 (14:20 - 15:10)" },
  { id: 7, period: "7", time: "3:10 TO 4.00", label: "Period 7 (15:10 - 16:00)" },
];

export const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const DEPARTMENT_TIMETABLES = {
  // 1. Computer Science & Engineering (Exact replica of user's uploaded official timetable)
  "Department of Computer Science & Engineering": {
    deptKey: "CSE",
    deptFullName: "DEPARTMENT OF COMPUTER ENGINEERING",
    facultyName: "FACULTY OF ENGINEERING",
    term: "WINTER 2026",
    effectiveFrom: "29.06.2026",
    revisionNo: "0",
    issueNo: "1",
    docNo: "FOE/CSE/TT/2026/01",
    semester: "3rd Div-A",
    class: "CSE",
    roomNo: "503",
    facultyDirectory: [
      { code: "ST", name: "Prof. S. Trivedi", subject: "Digital Design & Signal Processing (DDSP) / Python" },
      { code: "RM", name: "Prof. R. Mishra", subject: "Probability & Statistics (PS)" },
      { code: "MTS", name: "Prof. M. T. Shah", subject: "Effective Technical Communication (ETC)" },
      { code: "NP", name: "Prof. N. Patel", subject: "Data Structures (DS)" },
      { code: "VP", name: "Prof. V. Patel", subject: "Data Structures (DS) / Python" },
      { code: "RG", name: "Prof. R. Gupta", subject: "Discrete Linear Math & Algebra (DLMA)" },
      { code: "SP", name: "Prof. S. Pandey", subject: "Discrete Linear Math & Algebra (DLMA)" },
      { code: "DAS", name: "Prof. D. A. Shah", subject: "Python Programming (PY)" },
      { code: "MS", name: "Prof. M. Sharma", subject: "Python Programming (PY)" },
      { code: "SY", name: "Prof. S. Yadav", subject: "Python Programming / DDSP Lab" },
      { code: "AH", name: "Prof. A. Hingorani", subject: "Python Programming (PY)" },
      { code: "KT", name: "Prof. K. Tiwari", subject: "Indian Constitution (IC)" },
    ],
    subjectDirectory: [
      { code: "DDSP", name: "Database Design and SQL Programming / Digital Design", type: "Theory & Lab" },
      { code: "PS", name: "Probability and Statistics", type: "Theory & Tutorial" },
      { code: "ETC", name: "Effective Technical Communication", type: "Theory & Lab" },
      { code: "DS", name: "Data Structures using C/C++", type: "Theory & Lab" },
      { code: "DLMA", name: "Discrete Linear Math & Algebra", type: "Theory & Lab" },
      { code: "PY", name: "Python Programming Laboratory", type: "Lab Only" },
      { code: "IC", name: "Indian Constitution", type: "Theory Only" },
      { code: "LIBRARY", name: "Library & Self-Study Reference Session", type: "Non-instructional" },
    ],
    days: {
      Monday: {
        // P1: DDSP(ST)
        p1: { type: "theory", subject: "DDSP", faculty: "ST", room: "503", title: "DDSP (ST)" },
        // P2: PS(RM)
        p2: { type: "theory", subject: "PS", faculty: "RM", room: "503", title: "PS (RM)" },
        // P3 & P4 (11:00 - 1:00): Combined 2-Hour Lab Block
        lab1: {
          periodSpan: [3, 4],
          timeRange: "11:00 TO 1:00",
          batches: {
            "Sec A": { batch: "BATCH A1", subject: "ETC", faculty: "MTS", lab: "Lab 512", text: "ETC (BATCH A1)- MTS (Lab 512)" },
            "Sec B": { batch: "BATCH A2", subject: "DS", faculty: "NP", lab: "Lab 509", text: "DS (BATCH A2)- NP (Lab 509)" },
            "Sec C": { batch: "BATCH A3", subject: "DLMA", faculty: "SP", lab: "Lab 618", text: "DLMA (BATCH A3)- SP (Lab 618)" },
          },
        },
        // P5: DLMA(RG)
        p5: { type: "theory", subject: "DLMA", faculty: "RG", room: "503", title: "DLMA (RG)" },
        // P6 & P7 (2:20 - 4:00): Combined 2-Hour Lab Block
        lab2: {
          periodSpan: [6, 7],
          timeRange: "2:20 TO 4.00",
          batches: {
            "Sec A": { batch: "BATCH A1", subject: "PY", faculty: "DAS", lab: "Lab-413", text: "PY (BATCH A1)-DAS (Lab-413)" },
            "Sec B": { batch: "BATCH A2", subject: "PY", faculty: "MS", lab: "Lab-414-A", text: "PY (BATCH A2)-MS (Lab-414-A)" },
            "Sec C": { batch: "BATCH A3", subject: "PY", faculty: "SY", lab: "Lab-509", text: "PY (BATCH A3)-SY (Lab-509)" },
          },
        },
      },
      Tuesday: {
        // P1: IC(KT)
        p1: { type: "theory", subject: "IC", faculty: "KT", room: "503", title: "IC (KT)" },
        // P2: PS(RM)
        p2: { type: "theory", subject: "PS", faculty: "RM", room: "503", title: "PS (RM)" },
        // P3 & P4 (11:00 - 1:00): Combined 2-Hour Lab Block
        lab1: {
          periodSpan: [3, 4],
          timeRange: "11:00 TO 1:00",
          batches: {
            "Sec A": { batch: "BATCH A1", subject: "PY", faculty: "AH", lab: "Lab-414-B", text: "PY (BATCH A1)-AH (Lab-414-B)" },
            "Sec B": { batch: "BATCH A2", subject: "PY", faculty: "VP", lab: "Lab-414-A", text: "PY (BATCH A2)-VP (Lab-414-A)" },
            "Sec C": { batch: "BATCH A3", subject: "PY", faculty: "ST", lab: "Lab-413", text: "PY (BATCH A3)-ST (Lab-413)" },
          },
        },
        // P5 & P6 (1:30 - 3:10): Combined 2-Hour Lab Block
        lab2: {
          periodSpan: [5, 6],
          timeRange: "1:30 TO 3:10",
          batches: {
            "Sec A": { batch: "BATCH A1", subject: "DDSP", faculty: "ST", lab: "Lab 415", text: "DDSP (BATCH A1)-ST (Lab 415)" },
            "Sec B": { batch: "BATCH A2", subject: "DS", faculty: "VP", lab: "Lab 414-B", text: "DS (BATCH A2)-VP (Lab 414-B)" },
            "Sec C": { batch: "BATCH A3", subject: "ETC", faculty: "MTS", lab: "Lab 512", text: "ETC (BATCH A3)- MTS (Lab 512)" },
          },
        },
        // P7: DDSP(ST)
        p7: { type: "theory", subject: "DDSP", faculty: "ST", room: "503", title: "DDSP (ST)" },
      },
      Wednesday: {
        // P1: ETC(MTS)
        p1: { type: "theory", subject: "ETC", faculty: "MTS", room: "503", title: "ETC (MTS)" },
        // P2: DS(VP)
        p2: { type: "theory", subject: "DS", faculty: "VP", room: "503", title: "DS (VP)" },
        // P3 & P4 (11:00 - 1:00): Combined 2-Hour Lab Block
        lab1: {
          periodSpan: [3, 4],
          timeRange: "11:00 TO 1:00",
          batches: {
            "Sec A": { batch: "BATCH A1", subject: "DLMA", faculty: "SP", lab: "Lab 618", text: "DLMA (BATCH A1)- SP (Lab 618)" },
            "Sec B": { batch: "BATCH A2", subject: "DDSP", faculty: "SY", lab: "Lab 508", text: "DDSP (BATCH A2)- SY (Lab 508)" },
            "Sec C": { batch: "BATCH A3", subject: "DS", faculty: "VP", lab: "Lab 415", text: "DS (BATCH A3)- VP (Lab 415)" },
          },
        },
        // P5: DDSP(ST)
        p5: { type: "theory", subject: "DDSP", faculty: "ST", room: "503", title: "DDSP (ST)" },
        // P6: PS(RM) T (Tutorial)
        p6: { type: "tutorial", subject: "PS", faculty: "RM", room: "503", title: "PS (RM) T" },
        // P7: LIBRARY
        p7: { type: "library", subject: "LIBRARY", faculty: "-", room: "Central Library", title: "LIBRARY" },
      },
      Thursday: {
        // P1 & P2 (9:00 - 11:00): Combined 2-Hour Lab Block
        lab1: {
          periodSpan: [1, 2],
          timeRange: "9:00 TO 11:00",
          batches: {
            "Sec A": { batch: "BATCH A1", subject: "DS", faculty: "NP", lab: "Lab 509", text: "DS (BATCH A1)- NP (Lab 509)" },
            "Sec B": { batch: "BATCH A2", subject: "DLMA", faculty: "SP", lab: "Lab 618", text: "DLMA (BATCH A2)- SP (Lab 618)" },
            "Sec C": { batch: "BATCH A3", subject: "DDSP", faculty: "ST", lab: "Lab 415", text: "DDSP (BATCH A3)-ST (Lab 415)" },
          },
        },
        // P3: DLMA(RG)
        p3: { type: "theory", subject: "DLMA", faculty: "RG", room: "503", title: "DLMA (RG)" },
        // P4: ETC(MTS)
        p4: { type: "theory", subject: "ETC", faculty: "MTS", room: "503", title: "ETC (MTS)" },
        // P5: PS(RM)
        p5: { type: "theory", subject: "PS", faculty: "RM", room: "503", title: "PS (RM)" },
        // P6: DS(VP)
        p6: { type: "theory", subject: "DS", faculty: "VP", room: "503", title: "DS (VP)" },
        // P7: LIBRARY
        p7: { type: "library", subject: "LIBRARY", faculty: "-", room: "Central Library", title: "LIBRARY" },
      },
      Friday: {
        // P1: DDSP(ST)
        p1: { type: "theory", subject: "DDSP", faculty: "ST", room: "503", title: "DDSP (ST)" },
        // P2: DLMA(RG)
        p2: { type: "theory", subject: "DLMA", faculty: "RG", room: "503", title: "DLMA (RG)" },
        // P3: PS(RM)
        p3: { type: "theory", subject: "PS", faculty: "RM", room: "503", title: "PS (RM)" },
        // P4: IC(KT)
        p4: { type: "theory", subject: "IC", faculty: "KT", room: "503", title: "IC (KT)" },
        // P5 & P6 (1:30 - 3:10): Combined 2-Hour Lab Block
        lab2: {
          periodSpan: [5, 6],
          timeRange: "1:30 TO 3:10",
          batches: {
            "Sec A": { batch: "BATCH A1", subject: "DS", faculty: "VP", lab: "Lab 513", text: "DS (BATCH A1)- VP (Lab 513)" },
            "Sec B": { batch: "BATCH A2", subject: "ETC", faculty: "MTS", lab: "Lab 512", text: "ETC (BATCH A2)- MTS (Lab 512)" },
            "Sec C": { batch: "BATCH A3", subject: "DS", faculty: "VP", lab: "Lab 513", text: "DS (BATCH A3)- VP (Lab 513)" },
          },
        },
        // P7: DS(VP)
        p7: { type: "theory", subject: "DS", faculty: "VP", room: "503", title: "DS (VP)" },
      },
      Saturday: {
        isHoliday: true,
        text: "Non-instructional Day / Weekend Holiday",
      },
    },
  },

  // 2. Information Technology (IT) - Synchronized with IT subjects & room allocations
  "Department of Information Technology": {
    deptKey: "IT",
    deptFullName: "DEPARTMENT OF INFORMATION TECHNOLOGY",
    facultyName: "FACULTY OF ENGINEERING",
    term: "WINTER 2026",
    effectiveFrom: "29.06.2026",
    revisionNo: "0",
    issueNo: "1",
    docNo: "FOE/IT/TT/2026/01",
    semester: "3rd Div-A",
    class: "IT",
    roomNo: "402",
    facultyDirectory: [
      { code: "VK", name: "Prof. V. Kumar", subject: "Digital Electronics (DE - IT-105)" },
      { code: "RM", name: "Prof. R. Mishra", subject: "Probability & Statistics (PS - IT-101)" },
      { code: "MTS", name: "Prof. M. T. Shah", subject: "Effective Technical Communication (ETC - IT-102)" },
      { code: "PS", name: "Prof. P. Sharma", subject: "Data Structures (DS - IT-103)" },
      { code: "AK", name: "Dr. A. K. Sharma (HOD)", subject: "Basics of Web Technology (WT - IT-104)" },
      { code: "RN", name: "Prof. R. Nair", subject: "Python & Scripting Lab (PY)" },
      { code: "DAS", name: "Prof. D. A. Shah", subject: "Python & Scripting Lab (PY)" },
      { code: "KT", name: "Prof. K. Tiwari", subject: "Indian Constitution (IC)" },
    ],
    subjectDirectory: [
      { code: "DE", name: "Digital Electronics – Theory & Lab", type: "Theory & Lab" },
      { code: "PS", name: "Probability and Statistics", type: "Theory & Tutorial" },
      { code: "ETC", name: "Effective Technical Communication", type: "Theory & Lab" },
      { code: "DS", name: "Data Structures – Theory & Lab", type: "Theory & Lab" },
      { code: "WT", name: "Basics of Web Technology", type: "Theory & Lab" },
      { code: "PY", name: "Python & Web Scripting Lab", type: "Lab Only" },
      { code: "IC", name: "Indian Constitution", type: "Theory Only" },
      { code: "LIBRARY", name: "Library & Research Reference Session", type: "Non-instructional" },
    ],
    days: {
      Monday: {
        p1: { type: "theory", subject: "DE", faculty: "VK", room: "402", title: "DE (VK)" },
        p2: { type: "theory", subject: "PS", faculty: "RM", room: "402", title: "PS (RM)" },
        lab1: {
          periodSpan: [3, 4],
          timeRange: "11:00 TO 1:00",
          batches: {
            "Sec A": { batch: "BATCH A1", subject: "ETC", faculty: "MTS", lab: "Lab 512", text: "ETC (BATCH A1)- MTS (Lab 512)" },
            "Sec B": { batch: "BATCH A2", subject: "DS", faculty: "PS", lab: "Lab 305", text: "DS (BATCH A2)- PS (Lab 305)" },
            "Sec C": { batch: "BATCH A3", subject: "DE", faculty: "VK", lab: "Lab 208", text: "DE (BATCH A3)- VK (Lab 208)" },
          },
        },
        p5: { type: "theory", subject: "WT", faculty: "AK", room: "402", title: "WT (AK)" },
        lab2: {
          periodSpan: [6, 7],
          timeRange: "2:20 TO 4.00",
          batches: {
            "Sec A": { batch: "BATCH A1", subject: "PY", faculty: "RN", lab: "Lab 304", text: "PY (BATCH A1)- RN (Lab 304)" },
            "Sec B": { batch: "BATCH A2", subject: "PY", faculty: "DAS", lab: "Lab 305", text: "PY (BATCH A2)- DAS (Lab 305)" },
            "Sec C": { batch: "BATCH A3", subject: "PY", faculty: "RN", lab: "Lab 304", text: "PY (BATCH A3)- RN (Lab 304)" },
          },
        },
      },
      Tuesday: {
        p1: { type: "theory", subject: "IC", faculty: "KT", room: "402", title: "IC (KT)" },
        p2: { type: "theory", subject: "PS", faculty: "RM", room: "402", title: "PS (RM)" },
        lab1: {
          periodSpan: [3, 4],
          timeRange: "11:00 TO 1:00",
          batches: {
            "Sec A": { batch: "BATCH A1", subject: "PY", faculty: "RN", lab: "Lab 304", text: "PY (BATCH A1)- RN (Lab 304)" },
            "Sec B": { batch: "BATCH A2", subject: "PY", faculty: "DAS", lab: "Lab 305", text: "PY (BATCH A2)- DAS (Lab 305)" },
            "Sec C": { batch: "BATCH A3", subject: "PY", faculty: "RN", lab: "Lab 304", text: "PY (BATCH A3)- RN (Lab 304)" },
          },
        },
        lab2: {
          periodSpan: [5, 6],
          timeRange: "1:30 TO 3:10",
          batches: {
            "Sec A": { batch: "BATCH A1", subject: "WT", faculty: "AK", lab: "Lab 304", text: "WT (BATCH A1)- AK (Lab 304)" },
            "Sec B": { batch: "BATCH A2", subject: "DS", faculty: "PS", lab: "Lab 305", text: "DS (BATCH A2)- PS (Lab 305)" },
            "Sec C": { batch: "BATCH A3", subject: "ETC", faculty: "MTS", lab: "Lab 512", text: "ETC (BATCH A3)- MTS (Lab 512)" },
          },
        },
        p7: { type: "theory", subject: "DE", faculty: "VK", room: "402", title: "DE (VK)" },
      },
      Wednesday: {
        p1: { type: "theory", subject: "ETC", faculty: "MTS", room: "402", title: "ETC (MTS)" },
        p2: { type: "theory", subject: "DS", faculty: "PS", room: "402", title: "DS (PS)" },
        lab1: {
          periodSpan: [3, 4],
          timeRange: "11:00 TO 1:00",
          batches: {
            "Sec A": { batch: "BATCH A1", subject: "DE", faculty: "VK", lab: "Lab 208", text: "DE (BATCH A1)- VK (Lab 208)" },
            "Sec B": { batch: "BATCH A2", subject: "WT", faculty: "AK", lab: "Lab 304", text: "WT (BATCH A2)- AK (Lab 304)" },
            "Sec C": { batch: "BATCH A3", subject: "DS", faculty: "PS", lab: "Lab 305", text: "DS (BATCH A3)- PS (Lab 305)" },
          },
        },
        p5: { type: "theory", subject: "WT", faculty: "AK", room: "402", title: "WT (AK)" },
        p6: { type: "tutorial", subject: "PS", faculty: "RM", room: "402", title: "PS (RM) T" },
        p7: { type: "library", subject: "LIBRARY", faculty: "-", room: "Central Library", title: "LIBRARY" },
      },
      Thursday: {
        lab1: {
          periodSpan: [1, 2],
          timeRange: "9:00 TO 11:00",
          batches: {
            "Sec A": { batch: "BATCH A1", subject: "DS", faculty: "PS", lab: "Lab 305", text: "DS (BATCH A1)- PS (Lab 305)" },
            "Sec B": { batch: "BATCH A2", subject: "DE", faculty: "VK", lab: "Lab 208", text: "DE (BATCH A2)- VK (Lab 208)" },
            "Sec C": { batch: "BATCH A3", subject: "WT", faculty: "AK", lab: "Lab 304", text: "WT (BATCH A3)- AK (Lab 304)" },
          },
        },
        p3: { type: "theory", subject: "WT", faculty: "AK", room: "402", title: "WT (AK)" },
        p4: { type: "theory", subject: "ETC", faculty: "MTS", room: "402", title: "ETC (MTS)" },
        p5: { type: "theory", subject: "PS", faculty: "RM", room: "402", title: "PS (RM)" },
        p6: { type: "theory", subject: "DS", faculty: "PS", room: "402", title: "DS (PS)" },
        p7: { type: "library", subject: "LIBRARY", faculty: "-", room: "Central Library", title: "LIBRARY" },
      },
      Friday: {
        p1: { type: "theory", subject: "DE", faculty: "VK", room: "402", title: "DE (VK)" },
        p2: { type: "theory", subject: "WT", faculty: "AK", room: "402", title: "WT (AK)" },
        p3: { type: "theory", subject: "PS", faculty: "RM", room: "402", title: "PS (RM)" },
        p4: { type: "theory", subject: "IC", faculty: "KT", room: "402", title: "IC (KT)" },
        lab2: {
          periodSpan: [5, 6],
          timeRange: "1:30 TO 3:10",
          batches: {
            "Sec A": { batch: "BATCH A1", subject: "DS", faculty: "PS", lab: "Lab 305", text: "DS (BATCH A1)- PS (Lab 305)" },
            "Sec B": { batch: "BATCH A2", subject: "ETC", faculty: "MTS", lab: "Lab 512", text: "ETC (BATCH A2)- MTS (Lab 512)" },
            "Sec C": { batch: "BATCH A3", subject: "WT", faculty: "AK", lab: "Lab 304", text: "WT (BATCH A3)- AK (Lab 304)" },
          },
        },
        p7: { type: "theory", subject: "DS", faculty: "PS", room: "402", title: "DS (PS)" },
      },
      Saturday: {
        isHoliday: true,
        text: "Non-instructional Day / Weekend Holiday",
      },
    },
  },

  // 3. Electronics & Communication (ECE) - Synchronized with ECE subjects & circuit/VLSI labs
  "Department of Electronics & Communication": {
    deptKey: "ECE",
    deptFullName: "DEPARTMENT OF ELECTRONICS & COMMUNICATION",
    facultyName: "FACULTY OF ENGINEERING",
    term: "WINTER 2026",
    effectiveFrom: "29.06.2026",
    revisionNo: "0",
    issueNo: "1",
    docNo: "FOE/ECE/TT/2026/01",
    semester: "3rd Div-A",
    class: "ECE",
    roomNo: "301",
    facultyDirectory: [
      { code: "MS", name: "Dr. Meenakshi Sundaram (HOD)", subject: "Digital System Design (DSD - ECE-104)" },
      { code: "RK", name: "Prof. R. Kulkarni", subject: "Mathematics-III (M-III - ECE-101) / HDL Lab" },
      { code: "MTS", name: "Prof. M. T. Shah", subject: "Effective Technical Communication (ETC - ECE-102)" },
      { code: "AN", name: "Prof. A. Natarajan", subject: "Network Analysis (NA - ECE-103) / HDL Lab" },
      { code: "SG", name: "Prof. S. Ghosh", subject: "Modern Control Systems (MCS - ECE-105)" },
      { code: "KT", name: "Prof. K. Tiwari", subject: "Indian Constitution (IC)" },
    ],
    subjectDirectory: [
      { code: "DSD", name: "Digital System Design – Theory & VLSI Lab", type: "Theory & Lab" },
      { code: "M-III", name: "Mathematics-III", type: "Theory & Tutorial" },
      { code: "ETC", name: "Effective Technical Communication", type: "Theory & Lab" },
      { code: "NA", name: "Network Analysis – Theory & Circuits Lab", type: "Theory & Lab" },
      { code: "MCS", name: "Modern Control Systems – Theory & Lab", type: "Theory & Lab" },
      { code: "HDL", name: "Hardware Description & Simulation Lab", type: "Lab Only" },
      { code: "IC", name: "Indian Constitution", type: "Theory Only" },
      { code: "LIBRARY", name: "Library & Simulation Reference Session", type: "Non-instructional" },
    ],
    days: {
      Monday: {
        p1: { type: "theory", subject: "DSD", faculty: "MS", room: "301", title: "DSD (MS)" },
        p2: { type: "theory", subject: "M-III", faculty: "RK", room: "301", title: "M-III (RK)" },
        lab1: {
          periodSpan: [3, 4],
          timeRange: "11:00 TO 1:00",
          batches: {
            "Sec A": { batch: "BATCH A1", subject: "ETC", faculty: "MTS", lab: "Lab 512", text: "ETC (BATCH A1)- MTS (Lab 512)" },
            "Sec B": { batch: "BATCH A2", subject: "NA", faculty: "AN", lab: "Lab 205", text: "NA (BATCH A2)- AN (Lab 205)" },
            "Sec C": { batch: "BATCH A3", subject: "MCS", faculty: "SG", lab: "Lab 212", text: "MCS (BATCH A3)- SG (Lab 212)" },
          },
        },
        p5: { type: "theory", subject: "MCS", faculty: "SG", room: "301", title: "MCS (SG)" },
        lab2: {
          periodSpan: [6, 7],
          timeRange: "2:20 TO 4.00",
          batches: {
            "Sec A": { batch: "BATCH A1", subject: "HDL", faculty: "RK", lab: "Lab 210", text: "HDL (BATCH A1)- RK (Lab 210)" },
            "Sec B": { batch: "BATCH A2", subject: "HDL", faculty: "MS", lab: "Lab 210", text: "HDL (BATCH A2)- MS (Lab 210)" },
            "Sec C": { batch: "BATCH A3", subject: "HDL", faculty: "AN", lab: "Lab 210", text: "HDL (BATCH A3)- AN (Lab 210)" },
          },
        },
      },
      Tuesday: {
        p1: { type: "theory", subject: "IC", faculty: "KT", room: "301", title: "IC (KT)" },
        p2: { type: "theory", subject: "M-III", faculty: "RK", room: "301", title: "M-III (RK)" },
        lab1: {
          periodSpan: [3, 4],
          timeRange: "11:00 TO 1:00",
          batches: {
            "Sec A": { batch: "BATCH A1", subject: "HDL", faculty: "RK", lab: "Lab 210", text: "HDL (BATCH A1)- RK (Lab 210)" },
            "Sec B": { batch: "BATCH A2", subject: "HDL", faculty: "MS", lab: "Lab 210", text: "HDL (BATCH A2)- MS (Lab 210)" },
            "Sec C": { batch: "BATCH A3", subject: "HDL", faculty: "AN", lab: "Lab 210", text: "HDL (BATCH A3)- AN (Lab 210)" },
          },
        },
        lab2: {
          periodSpan: [5, 6],
          timeRange: "1:30 TO 3:10",
          batches: {
            "Sec A": { batch: "BATCH A1", subject: "DSD", faculty: "MS", lab: "Lab 210", text: "DSD (BATCH A1)- MS (Lab 210)" },
            "Sec B": { batch: "BATCH A2", subject: "NA", faculty: "AN", lab: "Lab 205", text: "NA (BATCH A2)- AN (Lab 205)" },
            "Sec C": { batch: "BATCH A3", subject: "ETC", faculty: "MTS", lab: "Lab 512", text: "ETC (BATCH A3)- MTS (Lab 512)" },
          },
        },
        p7: { type: "theory", subject: "DSD", faculty: "MS", room: "301", title: "DSD (MS)" },
      },
      Wednesday: {
        p1: { type: "theory", subject: "ETC", faculty: "MTS", room: "301", title: "ETC (MTS)" },
        p2: { type: "theory", subject: "NA", faculty: "AN", room: "301", title: "NA (AN)" },
        lab1: {
          periodSpan: [3, 4],
          timeRange: "11:00 TO 1:00",
          batches: {
            "Sec A": { batch: "BATCH A1", subject: "MCS", faculty: "SG", lab: "Lab 212", text: "MCS (BATCH A1)- SG (Lab 212)" },
            "Sec B": { batch: "BATCH A2", subject: "DSD", faculty: "MS", lab: "Lab 210", text: "DSD (BATCH A2)- MS (Lab 210)" },
            "Sec C": { batch: "BATCH A3", subject: "NA", faculty: "AN", lab: "Lab 205", text: "NA (BATCH A3)- AN (Lab 205)" },
          },
        },
        p5: { type: "theory", subject: "DSD", faculty: "MS", room: "301", title: "DSD (MS)" },
        p6: { type: "tutorial", subject: "M-III", faculty: "RK", room: "301", title: "M-III (RK) T" },
        p7: { type: "library", subject: "LIBRARY", faculty: "-", room: "Central Library", title: "LIBRARY" },
      },
      Thursday: {
        lab1: {
          periodSpan: [1, 2],
          timeRange: "9:00 TO 11:00",
          batches: {
            "Sec A": { batch: "BATCH A1", subject: "NA", faculty: "AN", lab: "Lab 205", text: "NA (BATCH A1)- AN (Lab 205)" },
            "Sec B": { batch: "BATCH A2", subject: "MCS", faculty: "SG", lab: "Lab 212", text: "MCS (BATCH A2)- SG (Lab 212)" },
            "Sec C": { batch: "BATCH A3", subject: "DSD", faculty: "MS", lab: "Lab 210", text: "DSD (BATCH A3)- MS (Lab 210)" },
          },
        },
        p3: { type: "theory", subject: "MCS", faculty: "SG", room: "301", title: "MCS (SG)" },
        p4: { type: "theory", subject: "ETC", faculty: "MTS", room: "301", title: "ETC (MTS)" },
        p5: { type: "theory", subject: "M-III", faculty: "RK", room: "301", title: "M-III (RK)" },
        p6: { type: "theory", subject: "NA", faculty: "AN", room: "301", title: "NA (AN)" },
        p7: { type: "library", subject: "LIBRARY", faculty: "-", room: "Central Library", title: "LIBRARY" },
      },
      Friday: {
        p1: { type: "theory", subject: "DSD", faculty: "MS", room: "301", title: "DSD (MS)" },
        p2: { type: "theory", subject: "MCS", faculty: "SG", room: "301", title: "MCS (SG)" },
        p3: { type: "theory", subject: "M-III", faculty: "RK", room: "301", title: "M-III (RK)" },
        p4: { type: "theory", subject: "IC", faculty: "KT", room: "301", title: "IC (KT)" },
        lab2: {
          periodSpan: [5, 6],
          timeRange: "1:30 TO 3:10",
          batches: {
            "Sec A": { batch: "BATCH A1", subject: "NA", faculty: "AN", lab: "Lab 205", text: "NA (BATCH A1)- AN (Lab 205)" },
            "Sec B": { batch: "BATCH A2", subject: "ETC", faculty: "MTS", lab: "Lab 512", text: "ETC (BATCH A2)- MTS (Lab 512)" },
            "Sec C": { batch: "BATCH A3", subject: "NA", faculty: "AN", lab: "Lab 205", text: "NA (BATCH A3)- AN (Lab 205)" },
          },
        },
        p7: { type: "theory", subject: "NA", faculty: "AN", room: "301", title: "NA (AN)" },
      },
      Saturday: {
        isHoliday: true,
        text: "Non-instructional Day / Weekend Holiday",
      },
    },
  },
};

/**
 * Standardize department key lookup
 */
export function getDepartmentTimetable(deptName) {
  if (!deptName) return DEPARTMENT_TIMETABLES["Department of Computer Science & Engineering"];
  
  if (deptName.includes("Computer") || deptName.includes("CSE")) {
    return DEPARTMENT_TIMETABLES["Department of Computer Science & Engineering"];
  }
  if (deptName.includes("Information") || deptName.includes("IT")) {
    return DEPARTMENT_TIMETABLES["Department of Information Technology"];
  }
  if (deptName.includes("Electronics") || deptName.includes("ECE")) {
    return DEPARTMENT_TIMETABLES["Department of Electronics & Communication"];
  }
  return DEPARTMENT_TIMETABLES["Department of Computer Science & Engineering"];
}

/**
 * Helper to convert Section name to Batch Name
 */
export function getBatchLabel(section) {
  const s = (section || "Sec A").trim().toUpperCase();
  if (s.includes("A") || s === "1") return { section: "Sec A", batch: "BATCH A1" };
  if (s.includes("B") || s === "2") return { section: "Sec B", batch: "BATCH A2" };
  if (s.includes("C") || s === "3") return { section: "Sec C", batch: "BATCH A3" };
  return { section: "Sec A", batch: "BATCH A1" };
}
