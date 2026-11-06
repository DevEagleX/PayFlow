import axiosInstance from "./axiosInstance.js";

export async function getHistory({ page = 0, size = 20, direction = "ALL", from, to } = {}) {
  const { data } = await axiosInstance.get("/transactions", {
    params: { page, size, direction, from, to }
  });
  return data;
}

export async function getTransactionById(id) {
  const { data } = await axiosInstance.get(`/transactions/${id}`);
  return data;
}
