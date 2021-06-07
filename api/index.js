import ping from "../utils/ping";
import loc from "../utils/location";

export default async function (req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");

  const { address, version, location } = req.query;

  if (!address || !version)
    return res.status(400).json({
      success: false,
      message: "Bad Request - Address or version not provided",
    });

  const request = await ping(version.toLowerCase(), address.toLowerCase());
  if (!request || request.error) {
    return res
      .status(200)
      .json({ success: false, error: request.error || "Something went wrong" });
  }

  if (location) {
    const data = await loc(
      request.srv ? `${request.srv.name}:${request.srv.port}` : address
    );
    request.loc = data;
  }

  return res.status(200).json({ success: true, data: request });
}
