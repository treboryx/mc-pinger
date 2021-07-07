// Code from the mc-ping package

var net = require("net");
var dns = require("dns");
var mcpc_buffer = require("./buffer");

var ping = function (server, port, callback, timeout, protocol) {
  var MC_DEFAULT_PORT = 25565;

  if (typeof port == "function") {
    callback = port;
    port = MC_DEFAULT_PORT;
  }

  if (typeof port !== "number") {
    port = MC_DEFAULT_PORT;
  }

  if (typeof timeout == "undefined") {
    timeout = 3000;
  }

  // Use the specified protocol version, if supplied
  if (typeof protocol !== "number") {
    protocol = 47;
  }
  let srv;
  dns.resolveSrv("_minecraft._tcp." + server, function (err, record) {
    if (record && record.length > 0)
      srv = { name: record[0].name, port: record[0].port };
    var connectTo = {
      port: port,
      host: server,
    };
    if (!err && 0 < record.length) {
      connectTo = {
        host: record[0].name,
        port: record[0].port,
      };
    }
    var socket = net.connect(connectTo, function () {
      // Write out handshake packet.
      var handshakeBuffer = mcpc_buffer.createBuffer();

      handshakeBuffer.writeVarInt(0);
      handshakeBuffer.writeVarInt(protocol);
      handshakeBuffer.writeString(server);
      handshakeBuffer.writeUShort(port);
      handshakeBuffer.writeVarInt(1);

      writePCBuffer(socket, handshakeBuffer);

      // Write the set connection state packet, we should get the MOTD after this.
      var setModeBuffer = mcpc_buffer.createBuffer();

      setModeBuffer.writeVarInt(0);

      writePCBuffer(socket, setModeBuffer);
    });

    socket.setTimeout(timeout, function () {
      if (callback) {
        callback(
          new Error(
            "Socket timed out when connecting to " + server + ":" + port
          ),
          null
        );
      }

      socket.destroy();
    });

    var readingBuffer = new Buffer.alloc(0);

    socket.on("data", function (data) {
      readingBuffer = Buffer.concat([readingBuffer, data]);

      var buffer = mcpc_buffer.createBuffer(readingBuffer);
      var length;

      try {
        length = buffer.readVarInt();
      } catch (err) {
        // The buffer isn't long enough yet, wait for more data!
        return;
      }

      // Make sure we have the data we need!
      if (readingBuffer.length < length - buffer.offset()) {
        return;
      }

      // Read the packet ID, throw it away.
      buffer.readVarInt();

      try {
        var json = JSON.parse(buffer.readString());
        if (srv) json.srv = srv;

        // We parsed it, send it along!
        callback(null, json);
      } catch (err) {
        // Our data is corrupt? Fail hard.
        callback(err, null);

        return;
      }

      // We're done here.
      socket.destroy();
    });

    socket.once("error", function (err) {
      if (callback) {
        callback(err, null);
      }

      socket.destroy();
    });
  });
};

// Wraps our Buffer into another to fit the Minecraft protocol.
function writePCBuffer(client, buffer) {
  var length = mcpc_buffer.createBuffer();

  length.writeVarInt(buffer.buffer().length);

  client.write(Buffer.concat([length.buffer(), buffer.buffer()]));
}

module.exports = ping;
