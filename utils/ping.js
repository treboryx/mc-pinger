const peping = require("mc-hermes");
const mcping = require("./mc-ping");

export default async (version, address) => {
  if (!/^[0-9a-zA-Z.-_]/i.test(address))
    return {
      success: false,
      error: "invalid address: " + address,
    };
  if (version === "pc") {
    //java edition
    return new Promise((resolve) => {
      if (address.includes(":")) {
        address = address.split(":");
      } else {
        address = [address, 25565];
      }
      try {
        mcping(address[0], Number(address[1]), async function (err, res) {
          if (err) {
            return resolve({ error: err });
          }
          if (res) {
            const cleanDescription = [];
            const cleanInformation = [];
            const modList = [];
            if (
              res.players &&
              res.players.sample &&
              res.players.sample.length > 0
            ) {
              for (let i = 0; i < res.players.sample.length; i++) {
                if (res.players.sample[i].name)
                  cleanInformation.push(
                    res.players.sample[i].name.replace(/\xA7[0-9A-FK-OR]/gi, "")
                  );
              }
            }
            if (res.description) {
              if (
                res.description.text &&
                res.description.text.trim().length > 0
              ) {
                cleanDescription.push(
                  res.description.text.trim().replace(/\xA7[0-9A-FK-OR]/gi, "")
                );
              } else if (
                res.description.extra &&
                res.description.extra.length >= 1
              ) {
                for (let i = 0; i < res.description.extra.length; i++) {
                  cleanDescription.push(res.description.extra[i].text);
                }
              } else if (
                res.description.translate &&
                res.description.translate.length > 0
              ) {
                cleanDescription.push(
                  res.description.text.replace(/\xA7[0-9A-FK-OR]/gi, "")
                );
              } else {
                cleanDescription.push(
                  res.description.toString().replace(/\xA7[0-9A-FK-OR]/gi, "")
                );
              }
            }
            if (res.modinfo) {
              if (res.modinfo.modList && res.modinfo.modList.length > 1) {
                for (let i = 0; i < res.modinfo.modList.length; i++) {
                  modList.push(
                    `${res.modinfo.modList[i].modid} - ${res.modinfo.modList[i].version}`
                  );
                }
              }
            }

            if (res.version)
              res.version.cleanName =
                res.version && res.version.name
                  ? res.version.name.replace(/\xA7[0-9A-FK-OR]/gi, "")
                  : "Unknown";
            res.cleanDescription = cleanDescription
              .toString()
              .replace(/,/g, "")
              .replace(/^\s+/, "")
              .replace(/\s+$/, "");
            res.information = cleanInformation;
            res.modList = modList;
            return resolve(res);
          }
        });
      } catch (err) {
        return resolve({ error: err });
      }
    });
  }
  if (version === "pe") {
    // bedrock edition
    return new Promise((resolve) => {
      if (address.includes(":")) {
        address = address.split(":");
      } else {
        address = [address, 19132];
      }
      try {
        peping
          .pe({
            server: address[0],
            port: Number(address[1]),
          })
          .then((data) => {
            data.cleanDescription = data.description.replace(
              /\xA7[0-9A-FK-OR]/gi,
              ""
            );
            return resolve(data);
          })
          .catch((err) => {
            return resolve({ error: err });
          });
      } catch (err) {
        return resolve({ error: err });
      }
    });
  }
};
