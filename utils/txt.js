import dns from "dns";

export default (domain) => {
  return new Promise((res, rej) => {
    const c = domain.split(".");
    const topDomain = c.length
      ? `crafty.${c[c.length - 2]}.${c[c.length - 1]}`
      : null;
    dns.resolveTxt(topDomain, (err, records) => {
      if (!records) return res(undefined);
      res(records[0][0]);
    });
  });
};
