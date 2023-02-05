export type TaskBody = {
  taskId?: string;
  taskImageId?: string;
  tag?: string;
};

export type Task = {
  image_url: string;
  tags: string[];
  utask: {
    id: string;
  };
  task_image_id: string;
};
