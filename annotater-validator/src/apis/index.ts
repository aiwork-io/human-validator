import axios from "axios";

import { apis } from "utils/config";
import { Task } from "types/Task";
import { TaskImage } from "types/TaskImage";
import { FilterQuery } from "types/FilterQuery";

export const updateWalletAddress = async (wallet: string) => {
  const res = await axios.post(apis.profile.url, {
    wallet,
  });
  return res.data;
};

export const getProfile = async () => {
  const res = await axios.get(apis.profile.url);
  return res.data;
};

export const getTasks = async (query?: FilterQuery) => {
  const res = await axios.get<{ data: Task[]; cursor: number }>(
    apis.task(query).url
  );
  return res.data;
};

export const getListTaskImages = async ({
  taskId,
  query,
}: {
  taskId: string;
  query?: FilterQuery;
}) => {
  const res = await axios.get<{ data: TaskImage[]; cursor: number }>(
    apis.listTaskImage({ taskId, query }).url
  );
  return res.data;
};

export const getTaskImage = async ({
  taskId,
  imageId,
}: {
  taskId: string;
  imageId: string;
}) => {
  const res = await axios.get<TaskImage>(
    apis.taskImage({ taskId, imageId }).url
  );
  return res.data;
};

export const getNextTaskImage = async ({
  taskId,
  imageId,
}: {
  taskId: string;
  imageId: string;
}) => {
  const res = await axios.get(apis.nextTaskImage({ taskId, imageId }).url);
  return res.data;
};

export const getPrevTaskImage = async ({
  taskId,
  imageId,
}: {
  taskId: string;
  imageId: string;
}) => {
  const res = await axios.get(apis.prevTaskImage({ taskId, imageId }).url);
  return res.data;
};

export const validateImage = async ({
  taskId,
  imageId,
  data,
}: {
  taskId: string;
  imageId: string;
  data: {
    tag: string;
  };
}) => {
  const res = await axios.post(
    apis.validateImage({ taskId, imageId }).url,
    data
  );
  return res.data.data;
};
