import axios from "axios";

import { apis } from "utils/config";
import { Task, TaskBody } from "types/Task";
import { User } from "types/User";

export const updateWalletAddress = async ({
  token,
  wallet,
}: {
  token?: string;
  wallet: string;
}) => {
  const config = token
    ? {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    : {};
  const res = await axios.post(
    apis.profile.url,
    {
      wallet,
    },
    config
  );
  return res.data;
};

export const getProfile = async () => {
  const res = await axios.get<User>(apis.profile.url);
  return res.data;
};

export const initTask = async () => {
  const res = await axios.post(apis.initTask.url, {});
  return res.data;
};

export const getTaskQuestion = async () => {
  const res = await axios.get<Task>(apis.getTaskQuestion.url);
  return res.data;
};

export const answerTaskQuestion = async (data: TaskBody) => {
  const res = await axios.post(apis.answerTaskQuestion.url, {
    utask_id: data.taskId,
    task_image_id: data.taskImageId,
    tag: data.tag,
  });
  return res.data;
};

export const skipTaskQuestion = async (data: TaskBody) => {
  const res = await axios.post(apis.skipTask.url, {
    utask_id: data.taskId,
    task_image_id: data.taskImageId,
  });
  return res.data;
};
