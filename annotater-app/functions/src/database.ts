export const COLLECTION_USERS = "users";
export const COLLECTION_TASKS = "tasks";
export const COLLECTION_TASK_IMAGES = "task_images";
export const COLLECTION_USER_TASKS = "user_tasks";
export const COLLECTION_USER_TASK_HISTORIES = "user_task_histories";

export interface User {
  id: string;
  points: number;
  wallet: string;
  name?: string;
  email?: string;
  avatar?: string;
  role?: string;
  metadata: any;
}

export interface Task {
  id: string;
  user_id: string;
  tags: string[];
  unzip_at: number;
  iteration_minimum_required: number;
  iteration_total: number;
  iteration_remain: number;
  validated_count: number;
  created_at: number;
}

export interface TaskImage {
  id: string;
  task_id: string;
  user_id: string;
  key: string;
  tag: string;
  tag_validated_by: string;
  tag_validated_at: number;
  iteration_minimum_required: number;
  iteration_remain: number;

  answer_hash: { [name: string]: number };
  answer_correct: number;
  answer_incorrect: number;
  answer_incorrect_hash: { [name: string]: number };

  created_at: number;
  task?: Task;
}

export interface UserTask {
  id: string;
  user_id: string;
  task_id: string;
  uncompleted_task_image_ids: string[];
  completed_task_image_ids: string[];
  completed_at: 0;
}

export interface UserTaskHistory {
  id: string;
  user_id: string;
  task_id: string;
  user_task_id: string;
  task_image_id: string;
  task_image_tag_validated_at: number;
  tag: string;
  created_at: string;
  ok: number;
}
