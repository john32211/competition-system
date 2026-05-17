export type UserRole = "admin" | "instructor";
export type CompetitionType = "robotics" | "coding";

export type Group = {
  id: string;
  name: string;
  instructor: string | null;
  instructor_id?: string | null;
  competition_type?: CompetitionType | null;
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
  notes?: string | null;
  issues?: string | null;
  instructor_comments?: string | null;
};

export type ComponentRequirement = {
  id: string;
  group_id: string;
  inventory_item_id?: string | null;
  name: string;
  needed: number;
  available: number;
  shortage?: number | null;
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
  email?: string | null;
  full_name: string | null;
  role: UserRole;
};

export type WorkPlanTask = {
  id: string;
  group_id: string;
  title: string;
  description: string | null;
  phase: string | null;
  task_order: number;
  required: boolean;
  attachment_url?: string | null;
  attachment_type?: string | null;
  created_at?: string;
};

export type SessionTaskUpdate = {
  id: string;
  session_id: string;
  task_id: string;
  planned?: boolean;
  status: "not_started" | "in_progress" | "finished";
  completion_percent?: number;
  comment: string | null;
  assigned_to: string | null;
  attachment_url?: string | null;
  attachment_type?: string | null;
  created_at?: string;
};

export type StudentAssignment = {
  id: string;
  group_id: string;
  title: string;
  description: string | null;
  assigned_to: string | null;
  due_date: string | null;
  status: "open" | "submitted" | "reviewed";
  attachment_url: string | null;
  attachment_type: string | null;
  created_at?: string;
};
