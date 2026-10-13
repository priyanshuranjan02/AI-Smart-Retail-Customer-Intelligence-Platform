export const config = {
  api: {
    bodyParser: false,
  },
};

import { proxyToBackend } from "../lib/serverProxy.js";

export default async function handler(req, res) {
  return proxyToBackend(req, res, "/analyze-sentiment");
}
