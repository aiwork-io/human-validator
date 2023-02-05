import axios from "axios";

import { apis } from "utils/config";
import { Task } from "types/Task";
import { FilterQuery } from "types/FilterQuery";

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

export const updateRole = async ({
  token,
  uid,
}: {
  token: string;
  uid: string;
}) => {
  const res = await axios.post(
    apis.role.url,
    {
      uid,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
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

export const createTask = async ({
  interationNumber,
  tags,
}: {
  interationNumber: number;
  tags: string[];
}) => {
  const res = await axios.post(apis.task().url, {
    iteration_minimum_required: interationNumber,
    tags,
  });
  return res.data;
};

export const uploadImage = async (data: {
  taskId: string;
  filename: string;
  contentType: string;
}) => {
  const res = await axios.get(apis.uploadImage(data).url);
  return res.data;
};

export const downloadReport = async (taskId: string) => {
  const res = await axios.get(apis.downloadReport(taskId).url);
  return res;
};

export const uploadImageToStore = async ({
  file,
  url,
}: {
  file: File;
  url: string;
}) => {
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  return res;
};
