import axios from "axios";

export const API = axios.create({
  baseURL: "https://media-sequencer-r03b.onrender.com/api"
});
