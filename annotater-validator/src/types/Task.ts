export type TaskBody = {
  taskId?: string;
  taskImageId?: string;
  tag?: string;
};

export type Task = {
  id: string;
  iteration_minimum_required: number;
  tags: string[];
  iteration_remain: number;
  iteration_total: number;
  unzip_at: number;
  validated_count: number;
};
