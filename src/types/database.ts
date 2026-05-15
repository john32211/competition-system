export type UserRole = "admin" | "instructor";

export type Group = {
  id: string;
  name: string;
  instructor: string | null;
  instructor_id?: string | null;
  session: string | null;
  progress: number | null;
  created_at?: string;
};

export type Student = {
  id: string;
  group_id: string;
  name: string;
  age: number | null;
  email?: string | null;
  created_at?: string;
};

export type ProjectStatus =
  | "Planning"
  | "Wiring"
  | "Coding"
  | "Testing"
  | "Finished";

export type Project = {
  id: string;
  group_id: string;
  title: string;
  description: string | null;
  status: ProjectStatus;
  deadline?: string | null;
};

export type Session = {
  id: string;
  group_id: string;
  session_date: string;
  planned: string | null;
  finished: string | null;
};

export type ComponentRequirement = {
  id: string;
  group_id: string;
  name: string;
  needed: number;
  available: number;
};

export type InventoryItem = {
  id: string;
  name: string;
  total_stock: number;
  remaining_stock: number;
  missing_quantity: number;
  low_stock_threshold: number;
  category?: string | null;
};

export type AttendanceRecord = {
  id: string;
  session_id: string;
  student_id: string;
  status: "present" | "absent";
  notes?: string | null;
};

export type Profile = {
  id: string;
  full_name: string | null;
  role: UserRole;
};
