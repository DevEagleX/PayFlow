import axiosInstance from "./axiosInstance.js";

export async function searchRecipient(identifier) {
  const { data } = await axiosInstance.get("/users/search", {
    params: { identifier }
  });
  return data;
}

export async function sendTransfer(recipientIdentifier, amount, note) {
  const { data } = await axiosInstance.post("/transfer", {
    recipientIdentifier,
    amount,
    note
  });
  return data;
}
