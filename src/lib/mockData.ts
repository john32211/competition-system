import type {
  ComponentRequirement,
  Group,
  InventoryItem,
  Project,
  Session,
  Student,
} from "@/types/database";

export const demoGroups: Group[] = [
  {
    id: "demo-alpha",
    name: "Team Alpha",
    instructor: "Mona Hassan",
    session: "Sunday - 5 PM",
    progress: 72,
  },
  {
    id: "demo-circuit",
    name: "Circuit Breakers",
    instructor: "Omar Adel",
    session: "Tuesday - 6 PM",
    progress: 48,
  },
  {
    id: "demo-vector",
    name: "Vector Bots",
    instructor: "Nadine Samir",
    session: "Thursday - 4 PM",
    progress: 88,
  },
];

export const demoStudents: Student[] = [
  { id: "s1", group_id: "demo-alpha", name: "Youssef Ali", age: 13 },
  { id: "s2", group_id: "demo-alpha", name: "Laila Nabil", age: 12 },
  { id: "s3", group_id: "demo-circuit", name: "Karim Tarek", age: 14 },
  { id: "s4", group_id: "demo-vector", name: "Farida Amin", age: 13 },
];

export const demoProjects: Project[] = [
  {
    id: "p1",
    group_id: "demo-alpha",
    title: "Smart Parking Rover",
    description: "Autonomous rover with ultrasonic parking detection.",
    status: "Testing",
  },
  {
    id: "p2",
    group_id: "demo-circuit",
    title: "Line Follower Rescue Bot",
    description: "Arduino robot for path tracking and object pickup.",
    status: "Coding",
  },
  {
    id: "p3",
    group_id: "demo-vector",
    title: "Greenhouse Monitor",
    description: "Sensor station with LDR, humidity, and servo vent control.",
    status: "Finished",
  },
];

export const demoInventory: InventoryItem[] = [
  {
    id: "i1",
    name: "Arduino Uno",
    total_stock: 18,
    remaining_stock: 3,
    missing_quantity: 0,
    low_stock_threshold: 5,
    category: "Controllers",
  },
  {
    id: "i2",
    name: "Servo Motor",
    total_stock: 24,
    remaining_stock: 0,
    missing_quantity: 6,
    low_stock_threshold: 6,
    category: "Actuators",
  },
  {
    id: "i3",
    name: "Ultrasonic Sensor",
    total_stock: 12,
    remaining_stock: 2,
    missing_quantity: 4,
    low_stock_threshold: 4,
    category: "Sensors",
  },
];

export const demoComponents: ComponentRequirement[] = [
  { id: "c1", group_id: "demo-alpha", name: "Arduino Uno", needed: 2, available: 2 },
  { id: "c2", group_id: "demo-alpha", name: "Servo Motor", needed: 6, available: 4 },
  { id: "c3", group_id: "demo-circuit", name: "Ultrasonic Sensor", needed: 3, available: 1 },
];

export const demoSessions: Session[] = [
  {
    id: "session-1",
    group_id: "demo-alpha",
    session_date: "2026-05-10",
    planned: "Calibrate sensors and test obstacle avoidance.",
    finished: "Sensor wiring completed. Avoidance logic needs tuning.",
  },
  {
    id: "session-2",
    group_id: "demo-circuit",
    session_date: "2026-05-12",
    planned: "Upload PID control loop.",
    finished: "Basic line following completed.",
  },
];
