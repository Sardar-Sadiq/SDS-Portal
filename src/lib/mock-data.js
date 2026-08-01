export const INITIAL_OFFICE_SETTINGS = {
  companyName: "Spirit Data Solutions",
  officeStartTime: "09:00",
  officeEndTime: "18:00",
  gracePeriodMinutes: 15,
  geoFence: {
    address: "SDS Tech Tower, Suite 400, Financial District, CA",
    lat: 37.7749,
    lng: -122.4194,
    radiusMeters: 250,
  },
  departments: ["Engineering", "Data Science", "Product & Design", "Human Resources", "DevOps & Infrastructure", "Sales & Solutions"],
  roles: ["ADMIN", "EMPLOYEE"],
  holidayCalendar: [
    { date: "2026-01-01", name: "New Year's Day", type: "PUBLIC" },
    { date: "2026-05-25", name: "Memorial Day", type: "PUBLIC" },
    { date: "2026-07-04", name: "Independence Day", type: "PUBLIC" },
    { date: "2026-09-07", name: "Labor Day", type: "PUBLIC" },
    { date: "2026-11-26", name: "Thanksgiving Day", type: "PUBLIC" },
    { date: "2026-12-25", name: "Christmas Day", type: "PUBLIC" },
  ]
};

export const INITIAL_EMPLOYEES = [
  {
    id: "emp-001",
    employeeId: "SDS-1001",
    name: "Sardar Sadiq",
    email: "sardar.sadiq@spiritdatasolutions.com",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    role: "ADMIN",
    department: "Engineering",
    designation: "Principal Architect",
    joiningDate: "2022-03-15",
    phone: "+1 (555) 234-5678",
    manager: "Executive Board",
    officeLocation: {
      lat: 37.7749,
      lng: -122.4194,
      radiusMeters: 250
    },
    leaveBalance: { casual: 7, sick: 10, annual: 14 }
  },
  {
    id: "emp-002",
    employeeId: "SDS-1002",
    name: "Elena Rostova",
    email: "elena.r@spiritdatasolutions.com",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    role: "EMPLOYEE",
    department: "Data Science",
    designation: "Lead AI Engineer",
    joiningDate: "2023-01-10",
    phone: "+1 (555) 345-6789",
    manager: "Sardar Sadiq",
    officeLocation: {
      lat: 37.7749,
      lng: -122.4194,
      radiusMeters: 250
    },
    leaveBalance: { casual: 5, sick: 8, annual: 12 }
  },
  {
    id: "emp-003",
    employeeId: "SDS-1003",
    name: "Marcus Vance",
    email: "marcus.v@spiritdatasolutions.com",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    role: "EMPLOYEE",
    department: "DevOps & Infrastructure",
    designation: "Senior Cloud Engineer",
    joiningDate: "2023-06-01",
    phone: "+1 (555) 456-7890",
    manager: "Sardar Sadiq",
    officeLocation: {
      lat: 37.7749,
      lng: -122.4194,
      radiusMeters: 250
    },
    leaveBalance: { casual: 8, sick: 11, annual: 15 }
  },
  {
    id: "emp-004",
    employeeId: "SDS-1004",
    name: "Aaliyah Chen",
    email: "aaliyah.c@spiritdatasolutions.com",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    role: "EMPLOYEE",
    department: "Product & Design",
    designation: "Senior Staff Product Designer",
    joiningDate: "2023-09-18",
    phone: "+1 (555) 567-8901",
    manager: "Sardar Sadiq",
    officeLocation: {
      lat: 37.7749,
      lng: -122.4194,
      radiusMeters: 250
    },
    leaveBalance: { casual: 4, sick: 6, annual: 10 }
  },
  {
    id: "emp-005",
    employeeId: "SDS-1005",
    name: "David Sterling",
    email: "david.s@spiritdatasolutions.com",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    role: "EMPLOYEE",
    department: "Human Resources",
    designation: "HR People Partner",
    joiningDate: "2024-02-01",
    phone: "+1 (555) 678-9012",
    manager: "Sardar Sadiq",
    officeLocation: {
      lat: 37.7749,
      lng: -122.4194,
      radiusMeters: 250
    },
    leaveBalance: { casual: 6, sick: 12, annual: 18 }
  }
];

export const INITIAL_ATTENDANCE = [
  {
    id: "att-101",
    employeeId: "SDS-1001",
    employeeName: "Sardar Sadiq",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    department: "Engineering",
    date: "2026-08-01",
    checkIn: "08:52:14",
    checkOut: null,
    workingHours: 7.2,
    status: "PRESENT",
    locationVerified: true,
    coordinates: { lat: 37.7750, lng: -122.4193 },
    distanceFromOfficeMeters: 18,
    isLate: false
  },
  {
    id: "att-102",
    employeeId: "SDS-1002",
    employeeName: "Elena Rostova",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    department: "Data Science",
    date: "2026-08-01",
    checkIn: "09:22:05",
    checkOut: null,
    workingHours: 6.8,
    status: "LATE",
    locationVerified: true,
    coordinates: { lat: 37.7748, lng: -122.4195 },
    distanceFromOfficeMeters: 32,
    isLate: true
  },
  {
    id: "att-103",
    employeeId: "SDS-1003",
    employeeName: "Marcus Vance",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    department: "DevOps & Infrastructure",
    date: "2026-08-01",
    checkIn: "08:45:30",
    checkOut: null,
    workingHours: 7.5,
    status: "PRESENT",
    locationVerified: true,
    coordinates: { lat: 37.7749, lng: -122.4194 },
    distanceFromOfficeMeters: 5,
    isLate: false
  },
  {
    id: "att-104",
    employeeId: "SDS-1004",
    employeeName: "Aaliyah Chen",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    department: "Product & Design",
    date: "2026-08-01",
    checkIn: null,
    checkOut: null,
    workingHours: 0,
    status: "ON_LEAVE",
    locationVerified: false,
    isLate: false
  },
  {
    id: "att-105",
    employeeId: "SDS-1005",
    employeeName: "David Sterling",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    department: "Human Resources",
    date: "2026-08-01",
    checkIn: "08:58:10",
    checkOut: null,
    workingHours: 7.1,
    status: "PRESENT",
    locationVerified: true,
    coordinates: { lat: 37.7751, lng: -122.4192 },
    distanceFromOfficeMeters: 45,
    isLate: false
  },
  {
    id: "att-090",
    employeeId: "SDS-1001",
    employeeName: "Sardar Sadiq",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    department: "Engineering",
    date: "2026-07-31",
    checkIn: "08:50:00",
    checkOut: "18:05:00",
    workingHours: 9.25,
    status: "PRESENT",
    locationVerified: true,
    isLate: false
  },
  {
    id: "att-091",
    employeeId: "SDS-1002",
    employeeName: "Elena Rostova",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    department: "Data Science",
    date: "2026-07-31",
    checkIn: "08:55:00",
    checkOut: "17:50:00",
    workingHours: 8.9,
    status: "PRESENT",
    locationVerified: true,
    isLate: false
  }
];

export const INITIAL_LEAVES = [
  {
    id: "leave-301",
    employeeId: "SDS-1004",
    employeeName: "Aaliyah Chen",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    department: "Product & Design",
    leaveType: "ANNUAL",
    startDate: "2026-08-01",
    endDate: "2026-08-04",
    totalDays: 4,
    reason: "Attending Design Systems Conference and taking scheduled annual leave.",
    status: "APPROVED",
    appliedOn: "2026-07-20",
    reviewedBy: "Sardar Sadiq",
    reviewedOn: "2026-07-21",
    adminNote: "Approved. Marcus will cover urgent Figma reviews."
  },
  {
    id: "leave-302",
    employeeId: "SDS-1002",
    employeeName: "Elena Rostova",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    department: "Data Science",
    leaveType: "CASUAL",
    startDate: "2026-08-10",
    endDate: "2026-08-11",
    totalDays: 2,
    reason: "Family event out of town.",
    status: "PENDING",
    appliedOn: "2026-07-28"
  },
  {
    id: "leave-303",
    employeeId: "SDS-1003",
    employeeName: "Marcus Vance",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    department: "DevOps & Infrastructure",
    leaveType: "SICK",
    startDate: "2026-07-15",
    endDate: "2026-07-15",
    totalDays: 1,
    reason: "Severe migraine, doctor rest recommendation.",
    status: "APPROVED",
    appliedOn: "2026-07-15",
    reviewedBy: "Sardar Sadiq",
    reviewedOn: "2026-07-15",
    adminNote: "Approved. Take rest."
  }
];

export const INITIAL_REMARKS = [
  {
    id: "rem-501",
    employeeId: "SDS-1002",
    authorId: "SDS-1001",
    authorName: "Sardar Sadiq",
    authorRole: "ADMIN",
    content: "Outstanding work leading the v2 model deployment under tight SLA constraints. Great initiative.",
    category: "PRAISE",
    createdAt: "2026-07-25T14:30:00Z"
  },
  {
    id: "rem-502",
    employeeId: "SDS-1003",
    authorId: "SDS-1001",
    authorName: "Sardar Sadiq",
    authorRole: "ADMIN",
    content: "Reduced Kubernetes cluster cost by 22% with automated pod auto-scaling policy optimizations.",
    category: "PRAISE",
    createdAt: "2026-07-20T10:15:00Z"
  },
  {
    id: "rem-503",
    employeeId: "SDS-1002",
    authorId: "SDS-1001",
    authorName: "Sardar Sadiq",
    authorRole: "ADMIN",
    content: "Please ensure morning standup check-ins adhere strictly to the 9:15 AM SLA threshold.",
    category: "IMPROVEMENT",
    createdAt: "2026-07-10T09:45:00Z"
  }
];
