import dns from "dns";
import fetch from "node-fetch";

const isValidIp = (value) =>
  /^(?:(?:^|\.)(?:2(?:5[0-5]|[0-4]\d)|1?\d?\d)){4}$/.test(value) ? true : false;

const dnsLookup = (domain) => {
  return new Promise((res, rej) => {
    dns.lookup(domain, (err, address, family) => {
      res(address);
    });
  });
};

export default async (ip) => {
  let addr;
  let srvip = ip;
  if (ip.includes(":")) srvip = ip.split(":")[0];
  if (isValidIp(srvip)) {
    addr = srvip;
  } else {
    addr = await dnsLookup(srvip);
  }
  const { API_KEY } = process.env;
  let loc = await fetch(`https://ipinfo.io/${addr}?token=${API_KEY}`).then(
    (r) => r.json()
  );
  loc = {
    ip: addr,
    city: loc.city,
    region: loc.region,
    country: loc.country,
  };

  return loc;
};
