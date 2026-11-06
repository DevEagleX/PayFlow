import axiosInstance from "./axiosInstance.js";

export async function getBalance() {
  const { data } = await axiosInstance.get("/wallet/balance");
  return data;
}

export async function getProfile() {
  const { data } = await axiosInstance.get("/profile");
  return data;
}

export async function updateProfile(fullName) {
  const { data } = await axiosInstance.put("/profile", { fullName });
  return data;
}
