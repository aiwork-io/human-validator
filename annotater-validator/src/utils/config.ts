import qs from "query-string";

import { FilterQuery } from "types/FilterQuery";

const filterNonNull = (obj: any) =>
  obj && Object.fromEntries(Object.entries(obj).filter(([_, v]) => v));

export const apis = {
  profile: {
    key: "profile",
    url: "/me",
  },
  task: (query?: FilterQuery) => ({
    key: "task",
    url: query ? `/tasks?${qs.stringify(filterNonNull(query))}` : "/tasks",
  }),

  listTaskImage: ({
    taskId,
    query,
  }: {
    taskId?: string;
    query?: FilterQuery;
  }) => ({
    key: "list-task-image",
    url: `/tasks/${taskId}/images?${qs.stringify(filterNonNull(query))}`,
  }),
  taskImage: ({ taskId, imageId }: { taskId: string; imageId: string }) => ({
    key: "task-image",
    url: `/tasks/${taskId}/images/${imageId}`,
  }),
  nextTaskImage: ({
    taskId,
    imageId,
  }: {
    taskId: string;
    imageId: string;
  }) => ({
    key: "next-task-image",
    url: `/tasks/${taskId}/images/${imageId}/next`,
  }),
  prevTaskImage: ({
    taskId,
    imageId,
  }: {
    taskId: string;
    imageId: string;
  }) => ({
    key: "prev-task-image",
    url: `/tasks/${taskId}/images/${imageId}/prev`,
  }),
  validateImage: ({
    taskId,
    imageId,
  }: {
    taskId: string;
    imageId: string;
  }) => ({
    key: "validate-image",
    url: `/tasks/${taskId}/images/${imageId}/validation`,
  }),
};
