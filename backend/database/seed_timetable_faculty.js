require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const bcrypt = require("bcryptjs");
const db = require("../db");

// Initial Department Timetables data
const DEFAULT_TIMETABLES = {
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
      { code: "ST", name: "Prof. S. Trivedi", email: "strivedi.cse@univ.edu", subject: "Digital Design & Signal Processing (DDSP) / Python" },
      { code: "RM", name: "Prof. R. Mishra", email: "rmishra.cse@univ.edu", subject: "Probability & Statistics (PS)" },
      { code: "MTS", name: "Prof. M. T. Shah", email: "mtshah.cse@univ.edu", subject: "Effective Technical Communication (ETC)" },
      { code: "NP", name: "Prof. N. Patel", email: "npatel.cse@univ.edu", subject: "Data Structures (DS)" },
      { code: "VP", name: "Prof. V. Patel", email: "vpatel.cse@univ.edu", subject: "Data Structures (DS) / Python" },
      { code: "RG", name: "Prof. R. Gupta", email: "rgupta.cse@univ.edu", subject: "Discrete Linear Math & Algebra (DLMA)" },
      { code: "SP", name: "Prof. S. Pandey", email: "spandey.cse@univ.edu", subject: "Discrete Linear Math & Algebra (DLMA)" },
      { code: "DAS", name: "Prof. D. A. Shah", email: "dashah.cse@univ.edu", subject: "Python Programming (PY)" },
      { code: "MS", name: "Prof. M. Sharma", email: "msharma.cse@univ.edu", subject: "Python Programming (PY)" },
      { code: "SY", name: "Prof. S. Yadav", email: "syadav.cse@univ.edu", subject: "Python Programming / DDSP Lab" },
      { code: "AH", name: "Prof. A. Hingorani", email: "ahingorani.cse@univ.edu", subject: "Python Programming (PY)" },
      { code: "KT", name: "Prof. K. Tiwari", email: "ktiwari.cse@univ.edu", subject: "Indian Constitution (IC)" },
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
        p1: { type: "theory", subject: "DDSP", faculty: "ST", room: "503", title: "DDSP (ST)" },
        p2: { type: "theory", subject: "PS", faculty: "RM", room: "503", title: "PS (RM)" },
        lab1: {
          periodSpan: [3, 4],
          timeRange: "11:00 TO 1:00",
          batches: {
            "Sec A": { batch: "Sec A", subject: "ETC", faculty: "MTS", lab: "Lab 512", text: "ETC- MTS (Lab 512)" },
            "Sec B": { batch: "Sec B", subject: "DS", faculty: "NP", lab: "Lab 509", text: "DS- NP (Lab 509)" },
            "Sec C": { batch: "Sec C", subject: "DLMA", faculty: "SP", lab: "Lab 618", text: "DLMA- SP (Lab 618)" },
          },
        },
        p5: { type: "theory", subject: "DLMA", faculty: "RG", room: "503", title: "DLMA (RG)" },
        lab2: {
          periodSpan: [6, 7],
          timeRange: "2:20 TO 4.00",
          batches: {
            "Sec A": { batch: "Sec A", subject: "PY", faculty: "DAS", lab: "Lab-413", text: "PY- DAS (Lab-413)" },
            "Sec B": { batch: "Sec B", subject: "PY", faculty: "MS", lab: "Lab-414-A", text: "PY- MS (Lab-414-A)" },
            "Sec C": { batch: "Sec C", subject: "PY", faculty: "SY", lab: "Lab-509", text: "PY- SY (Lab-509)" },
          },
        },
      },
      Tuesday: {
        p1: { type: "theory", subject: "IC", faculty: "KT", room: "503", title: "IC (KT)" },
        p2: { type: "theory", subject: "PS", faculty: "RM", room: "503", title: "PS (RM)" },
        lab1: {
          periodSpan: [3, 4],
          timeRange: "11:00 TO 1:00",
          batches: {
            "Sec A": { batch: "Sec A", subject: "PY", faculty: "AH", lab: "Lab-414-B", text: "PY- AH (Lab-414-B)" },
            "Sec B": { batch: "Sec B", subject: "PY", faculty: "VP", lab: "Lab-414-A", text: "PY- VP (Lab-414-A)" },
            "Sec C": { batch: "Sec C", subject: "PY", faculty: "ST", lab: "Lab-413", text: "PY- ST (Lab-413)" },
          },
        },
        lab2: {
          periodSpan: [5, 6],
          timeRange: "1:30 TO 3:10",
          batches: {
            "Sec A": { batch: "Sec A", subject: "DDSP", faculty: "ST", lab: "Lab 415", text: "DDSP-ST (Lab 415)" },
            "Sec B": { batch: "Sec B", subject: "DS", faculty: "VP", lab: "Lab 414-B", text: "DS-VP (Lab 414-B)" },
            "Sec C": { batch: "Sec C", subject: "ETC", faculty: "MTS", lab: "Lab 512", text: "ETC- MTS (Lab 512)" },
          },
        },
        p7: { type: "theory", subject: "DDSP", faculty: "ST", room: "503", title: "DDSP (ST)" },
      },
      Wednesday: {
        p1: { type: "theory", subject: "ETC", faculty: "MTS", room: "503", title: "ETC (MTS)" },
        p2: { type: "theory", subject: "DS", faculty: "VP", room: "503", title: "DS (VP)" },
        lab1: {
          periodSpan: [3, 4],
          timeRange: "11:00 TO 1:00",
          batches: {
            "Sec A": { batch: "Sec A", subject: "DLMA", faculty: "SP", lab: "Lab 618", text: "DLMA- SP (Lab 618)" },
            "Sec B": { batch: "Sec B", subject: "DDSP", faculty: "SY", lab: "Lab 508", text: "DDSP- SY (Lab 508)" },
            "Sec C": { batch: "Sec C", subject: "DS", faculty: "VP", lab: "Lab 415", text: "DS- VP (Lab 415)" },
          },
        },
        p5: { type: "theory", subject: "DDSP", faculty: "ST", room: "503", title: "DDSP (ST)" },
        p6: { type: "tutorial", subject: "PS", faculty: "RM", room: "503", title: "PS (RM) T" },
        p7: { type: "library", subject: "LIBRARY", faculty: "-", room: "Central Library", title: "LIBRARY" },
      },
      Thursday: {
        lab1: {
          periodSpan: [1, 2],
          timeRange: "9:00 TO 11:00",
          batches: {
            "Sec A": { batch: "Sec A", subject: "DS", faculty: "NP", lab: "Lab 509", text: "DS- NP (Lab 509)" },
            "Sec B": { batch: "Sec B", subject: "DLMA", faculty: "SP", lab: "Lab 618", text: "DLMA- SP (Lab 618)" },
            "Sec C": { batch: "Sec C", subject: "DDSP", faculty: "ST", lab: "Lab 415", text: "DDSP-ST (Lab 415)" },
          },
        },
        p3: { type: "theory", subject: "DLMA", faculty: "RG", room: "503", title: "DLMA (RG)" },
        p4: { type: "theory", subject: "ETC", faculty: "MTS", room: "503", title: "ETC (MTS)" },
        p5: { type: "theory", subject: "PS", faculty: "RM", room: "503", title: "PS (RM)" },
        p6: { type: "theory", subject: "DS", faculty: "VP", room: "503", title: "DS (VP)" },
        p7: { type: "library", subject: "LIBRARY", faculty: "-", room: "Central Library", title: "LIBRARY" },
      },
      Friday: {
        p1: { type: "theory", subject: "DDSP", faculty: "ST", room: "503", title: "DDSP (ST)" },
        p2: { type: "theory", subject: "DLMA", faculty: "RG", room: "503", title: "DLMA (RG)" },
        p3: { type: "theory", subject: "PS", faculty: "RM", room: "503", title: "PS (RM)" },
        p4: { type: "theory", subject: "IC", faculty: "KT", room: "503", title: "IC (KT)" },
        lab2: {
          periodSpan: [5, 6],
          timeRange: "1:30 TO 3:10",
          batches: {
            "Sec A": { batch: "Sec A", subject: "DS", faculty: "VP", lab: "Lab 513", text: "DS- VP (Lab 513)" },
            "Sec B": { batch: "Sec B", subject: "ETC", faculty: "MTS", lab: "Lab 512", text: "ETC- MTS (Lab 512)" },
            "Sec C": { batch: "Sec C", subject: "DS", faculty: "VP", lab: "Lab 513", text: "DS- VP (Lab 513)" },
          },
        },
        p7: { type: "theory", subject: "DS", faculty: "VP", room: "503", title: "DS (VP)" },
      },
      Saturday: {
        isHoliday: true,
        text: "Non-instructional Day / Weekend Holiday",
      },
    },
  },

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
      { code: "VK", name: "Prof. V. Kumar", email: "vkumar.it@univ.edu", subject: "Digital Electronics (DE - IT-105)" },
      { code: "RM", name: "Prof. R. Mishra", email: "rmishra.it@univ.edu", subject: "Probability & Statistics (PS - IT-101)" },
      { code: "MTS", name: "Prof. M. T. Shah", email: "mtshah.it@univ.edu", subject: "Effective Technical Communication (ETC - IT-102)" },
      { code: "PS", name: "Prof. P. Sharma", email: "psharma.it@univ.edu", subject: "Data Structures (DS - IT-103)" },
      { code: "AK", name: "Dr. A. K. Sharma (HOD)", email: "hod.it@univ.edu", subject: "Basics of Web Technology (WT - IT-104)" },
      { code: "RN", name: "Prof. R. Nair", email: "rnair.it@univ.edu", subject: "Python & Scripting Lab (PY)" },
      { code: "DAS", name: "Prof. D. A. Shah", email: "dashah.it@univ.edu", subject: "Python & Scripting Lab (PY)" },
      { code: "KT", name: "Prof. K. Tiwari", email: "ktiwari.it@univ.edu", subject: "Indian Constitution (IC)" },
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
            "Sec A": { batch: "Sec A", subject: "ETC", faculty: "MTS", lab: "Lab 512", text: "ETC- MTS (Lab 512)" },
            "Sec B": { batch: "Sec B", subject: "DS", faculty: "PS", lab: "Lab 305", text: "DS- PS (Lab 305)" },
            "Sec C": { batch: "Sec C", subject: "DE", faculty: "VK", lab: "Lab 208", text: "DE- VK (Lab 208)" },
          },
        },
        p5: { type: "theory", subject: "WT", faculty: "AK", room: "402", title: "WT (AK)" },
        lab2: {
          periodSpan: [6, 7],
          timeRange: "2:20 TO 4.00",
          batches: {
            "Sec A": { batch: "Sec A", subject: "PY", faculty: "RN", lab: "Lab 304", text: "PY- RN (Lab 304)" },
            "Sec B": { batch: "Sec B", subject: "PY", faculty: "DAS", lab: "Lab 305", text: "PY- DAS (Lab 305)" },
            "Sec C": { batch: "Sec C", subject: "PY", faculty: "RN", lab: "Lab 304", text: "PY- RN (Lab 304)" },
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
            "Sec A": { batch: "Sec A", subject: "PY", faculty: "RN", lab: "Lab 304", text: "PY- RN (Lab 304)" },
            "Sec B": { batch: "Sec B", subject: "PY", faculty: "DAS", lab: "Lab 305", text: "PY- DAS (Lab 305)" },
            "Sec C": { batch: "Sec C", subject: "PY", faculty: "RN", lab: "Lab 304", text: "PY- RN (Lab 304)" },
          },
        },
        lab2: {
          periodSpan: [5, 6],
          timeRange: "1:30 TO 3:10",
          batches: {
            "Sec A": { batch: "Sec A", subject: "WT", faculty: "AK", lab: "Lab 304", text: "WT- AK (Lab 304)" },
            "Sec B": { batch: "Sec B", subject: "DS", faculty: "PS", lab: "Lab 305", text: "DS- PS (Lab 305)" },
            "Sec C": { batch: "Sec C", subject: "ETC", faculty: "MTS", lab: "Lab 512", text: "ETC- MTS (Lab 512)" },
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
            "Sec A": { batch: "Sec A", subject: "DE", faculty: "VK", lab: "Lab 208", text: "DE- VK (Lab 208)" },
            "Sec B": { batch: "Sec B", subject: "WT", faculty: "AK", lab: "Lab 304", text: "WT- AK (Lab 304)" },
            "Sec C": { batch: "Sec C", subject: "DS", faculty: "PS", lab: "Lab 305", text: "DS- PS (Lab 305)" },
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
            "Sec A": { batch: "Sec A", subject: "DS", faculty: "PS", lab: "Lab 305", text: "DS- PS (Lab 305)" },
            "Sec B": { batch: "Sec B", subject: "DE", faculty: "VK", lab: "Lab 208", text: "DE- VK (Lab 208)" },
            "Sec C": { batch: "Sec C", subject: "WT", faculty: "AK", lab: "Lab 304", text: "WT- AK (Lab 304)" },
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
            "Sec A": { batch: "Sec A", subject: "DS", faculty: "PS", lab: "Lab 305", text: "DS- PS (Lab 305)" },
            "Sec B": { batch: "Sec B", subject: "ETC", faculty: "MTS", lab: "Lab 512", text: "ETC- MTS (Lab 512)" },
            "Sec C": { batch: "Sec C", subject: "WT", faculty: "AK", lab: "Lab 304", text: "WT- AK (Lab 304)" },
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
      { code: "MS", name: "Dr. Meenakshi Sundaram (HOD)", email: "hod.ece@univ.edu", subject: "Digital System Design (DSD - ECE-104)" },
      { code: "RK", name: "Prof. R. Kulkarni", email: "rkulkarni.ece@univ.edu", subject: "Mathematics-III (M-III - ECE-101) / HDL Lab" },
      { code: "MTS", name: "Prof. M. T. Shah", email: "mtshah.ece@univ.edu", subject: "Effective Technical Communication (ETC - ECE-102)" },
      { code: "AN", name: "Prof. A. Natarajan", email: "anatarajan.ece@univ.edu", subject: "Network Analysis (NA - ECE-103) / HDL Lab" },
      { code: "SG", name: "Prof. S. Ghosh", email: "sghosh.ece@univ.edu", subject: "Modern Control Systems (MCS - ECE-105)" },
      { code: "KT", name: "Prof. K. Tiwari", email: "ktiwari.ece@univ.edu", subject: "Indian Constitution (IC)" },
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
            "Sec A": { batch: "Sec A", subject: "ETC", faculty: "MTS", lab: "Lab 512", text: "ETC- MTS (Lab 512)" },
            "Sec B": { batch: "Sec B", subject: "NA", faculty: "AN", lab: "Lab 205", text: "NA- AN (Lab 205)" },
            "Sec C": { batch: "Sec C", subject: "MCS", faculty: "SG", lab: "Lab 212", text: "MCS- SG (Lab 212)" },
          },
        },
        p5: { type: "theory", subject: "MCS", faculty: "SG", room: "301", title: "MCS (SG)" },
        lab2: {
          periodSpan: [6, 7],
          timeRange: "2:20 TO 4.00",
          batches: {
            "Sec A": { batch: "Sec A", subject: "HDL", faculty: "RK", lab: "Lab 210", text: "HDL- RK (Lab 210)" },
            "Sec B": { batch: "Sec B", subject: "HDL", faculty: "MS", lab: "Lab 210", text: "HDL- MS (Lab 210)" },
            "Sec C": { batch: "Sec C", subject: "HDL", faculty: "AN", lab: "Lab 210", text: "HDL- AN (Lab 210)" },
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
            "Sec A": { batch: "Sec A", subject: "HDL", faculty: "RK", lab: "Lab 210", text: "HDL- RK (Lab 210)" },
            "Sec B": { batch: "Sec B", subject: "HDL", faculty: "MS", lab: "Lab 210", text: "HDL- MS (Lab 210)" },
            "Sec C": { batch: "Sec C", subject: "HDL", faculty: "AN", lab: "Lab 210", text: "HDL- AN (Lab 210)" },
          },
        },
        lab2: {
          periodSpan: [5, 6],
          timeRange: "1:30 TO 3:10",
          batches: {
            "Sec A": { batch: "Sec A", subject: "DSD", faculty: "MS", lab: "Lab 210", text: "DSD- MS (Lab 210)" },
            "Sec B": { batch: "Sec B", subject: "NA", faculty: "AN", lab: "Lab 205", text: "NA- AN (Lab 205)" },
            "Sec C": { batch: "Sec C", subject: "ETC", faculty: "MTS", lab: "Lab 512", text: "ETC- MTS (Lab 512)" },
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
            "Sec A": { batch: "Sec A", subject: "MCS", faculty: "SG", lab: "Lab 212", text: "MCS- SG (Lab 212)" },
            "Sec B": { batch: "Sec B", subject: "DSD", faculty: "MS", lab: "Lab 210", text: "DSD- MS (Lab 210)" },
            "Sec C": { batch: "Sec C", subject: "NA", faculty: "AN", lab: "Lab 205", text: "NA- AN (Lab 205)" },
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
            "Sec A": { batch: "Sec A", subject: "NA", faculty: "AN", lab: "Lab 205", text: "NA- AN (Lab 205)" },
            "Sec B": { batch: "Sec B", subject: "MCS", faculty: "SG", lab: "Lab 212", text: "MCS- SG (Lab 212)" },
            "Sec C": { batch: "Sec C", subject: "DSD", faculty: "MS", lab: "Lab 210", text: "DSD- MS (Lab 210)" },
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
            "Sec A": { batch: "Sec A", subject: "NA", faculty: "AN", lab: "Lab 205", text: "NA- AN (Lab 205)" },
            "Sec B": { batch: "Sec B", subject: "ETC", faculty: "MTS", lab: "Lab 512", text: "ETC- MTS (Lab 512)" },
            "Sec C": { batch: "Sec C", subject: "NA", faculty: "AN", lab: "Lab 205", text: "NA- AN (Lab 205)" },
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

async function seed() {
  console.log("Starting Department Timetables and Faculty Seeding...");
  const hashedPassword = await bcrypt.hash("faculty123", 10);

  try {
    // 1. Ensure department_timetables table exists
    await db.query(`
      CREATE TABLE IF NOT EXISTS public.department_timetables (
        id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
        department varchar(150) NOT NULL UNIQUE,
        schedule jsonb NOT NULL,
        updated_by bigint REFERENCES public.users(id) ON DELETE SET NULL,
        updated_at timestamptz DEFAULT now()
      );
    `);
    console.log("✓ department_timetables table verified!");

    // 2. Seed default timetables into department_timetables
    for (const [deptName, schedule] of Object.entries(DEFAULT_TIMETABLES)) {
      await db.query(
        `INSERT INTO department_timetables (department, schedule)
         VALUES ($1, $2)
         ON CONFLICT (department) DO UPDATE SET schedule = EXCLUDED.schedule;`,
        [deptName, JSON.stringify(schedule)]
      );
      console.log(`✓ Seeded schedule for [${deptName}]`);
    }

    // 3. Seed all faculty members from the timetables
    for (const [deptName, sched] of Object.entries(DEFAULT_TIMETABLES)) {
      for (const fac of sched.facultyDirectory) {
        if (!fac.email) continue;

        // Skip HOD accounts that already exist to preserve HOD role
        const existing = await db.query("SELECT id, role FROM users WHERE LOWER(email) = LOWER($1)", [fac.email]);

        let userId;
        if (existing && existing.length > 0) {
          userId = existing[0].id;
          console.log(`- Existing user ${fac.email} (Role: ${existing[0].role})`);
        } else {
          const userRes = await db.query(
            `INSERT INTO users (full_name, email, password, role)
             VALUES ($1, $2, $3, 'FACULTY')
             RETURNING id;`,
            [fac.name, fac.email.toLowerCase(), hashedPassword]
          );
          userId = userRes[0].id;
          console.log(`+ Created faculty user ${fac.name} (${fac.email})`);
        }

        // Link faculty record
        const facExist = await db.query("SELECT id FROM faculty WHERE user_id = $1", [userId]);
        if (facExist && facExist.length > 0) {
          await db.query(
            `UPDATE faculty SET department = $1, designation = COALESCE(designation, 'Assistant Professor') WHERE user_id = $2`,
            [deptName, userId]
          );
        } else {
          await db.query(
            `INSERT INTO faculty (user_id, department, designation)
             VALUES ($1, $2, 'Assistant Professor')`,
            [userId, deptName]
          );
        }
      }
    }

    console.log("All department timetables and faculty members seeded successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
}

seed();
