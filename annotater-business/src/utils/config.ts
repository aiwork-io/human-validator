import qs from "query-string";

import { FilterQuery } from "types/FilterQuery";

const filterNonNull = (obj: any) =>
  obj && Object.fromEntries(Object.entries(obj).filter(([_, v]) => v));

export const apis = {
  profile: {
    key: "profile",
    url: "/me",
  },
  role: {
    key: "role",
    url: "/role",
  },
  task: (query?: FilterQuery) => ({
    key: "task",
    url: query ? `/tasks?${qs.stringify(filterNonNull(query))}` : "/tasks",
  }),
  uploadImage: ({
    taskId,
    filename,
    contentType,
  }: {
    taskId: string;
    filename: string;
    contentType: string;
  }) => ({
    key: "upload-image",
    url: `/files/upload/png?task_id=${taskId}&filename=${filename}&content_type=${contentType}`,
  }),
  downloadReport: (taskId: string) => ({
    key: "download-report",
    url: `tasks/${taskId}/report`,
  }),
};
