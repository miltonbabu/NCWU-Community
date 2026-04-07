export interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  event_date: string;
  event_time: string | null;
  images: string[];
  category: string;
  max_participants: number | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_active: number;
  interest_count?: number;
  user_interested?: boolean;
}

export interface EventInterest {
  id: string;
  event_id: string;
  user_id: string;
  user_name: string;
  user_email: string | null;
  student_id: string | null;
  interested_at: string;
}

export interface EventGoing {
  id: string;
  event_id: string;
  user_id: string;
  user_name: string;
  user_email: string | null;
  student_id: string | null;
  status: string;
  going_at: string;
}

export interface CreateEventData {
  title: string;
  description: string;
  location: string;
  event_date: string;
  event_time?: string;
  category: string;
  max_participants?: number;
  images?: string[];
}

export interface UpdateEventData extends CreateEventData {
  is_active?: boolean;
}
