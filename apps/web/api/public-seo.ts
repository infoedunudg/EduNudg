import {
  PLAIN_TEXT_HEADERS,
  toWebRequest,
  writeWebResponse,
  type NodeLikeReq,
  type NodeLikeRes,
} from "../src/lib/publicSeoVercelAdapter";

export const config = { runtime: "nodejs" };


export default async function handler(req: Request | NodeLikeReq, res?: NodeLikeRes): Promise<Response | void> {
  try {
    const webReq = toWebRequest(req);
    const file = new URL(webReq.url).searchParams.get("file") ?? "";
    const { handlePublicSeoDiscovery } = await import("../src/lib/publicSeoHandlers");
    return await writeWebResponse(res, await handlePublicSeoDiscovery(webReq, file));
  } catch {
    return writeWebResponse(
      res,
      new Response("User-agent: *\nAllow: /\n", { headers: PLAIN_TEXT_HEADERS })
    );
  }
}
