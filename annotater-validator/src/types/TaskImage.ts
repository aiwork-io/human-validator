import { Task } from "./Task";

export type TaskImage = {
  id: string;
  image_url: string;
  task: Task;
  answer_hash: {
    [answer: string]: number;
  };
  tag: string;
  tag_validated_at: number;
};
