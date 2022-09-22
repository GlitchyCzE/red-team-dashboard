// Import Everything
const express = require('express')

// =================================
// ========= CONFIGURATION =========
// =================================

/** The IP and port that the webserver will listen on. Red Team members will need access to this port.
 * This is NOT for beacons. */
const WEB_SERVER_IP = "0.0.0.0";
const WEBSERVER_PORT = 3000;

/** The port that the beacons will listen on. This is NOT for the webserver. */
const TCP_SERVER_IP = "0.0.0.0";
const PORTS = [123, 21, 8080, 6000]

/** The Teams and IP addresses that the beacons should be coming from. This will populate the dashboard */
const INFRASTRUCTURE = {
    "Blue 1": {
        "Database Server": "10.0.1.1",
        "Web Server": "10.0.1.2",
        "Mail Server": "10.0.1.3"
    },
    "Blue 2": {
        "Database Server": "10.0.2.1",
        "Web Server": "10.0.2.2",
        "Mail Server": "10.0.2.3"
    }
}

// ================================
// ====== END CONFIGURATION =======
// ================================

const app = express();

// Populate beacon data
let beaconData = {};
for (let team in INFRASTRUCTURE) {
    let hosts = INFRASTRUCTURE[team];
    beaconData[team] = {};
    for (let host in hosts) {
        beaconData[team][host] = null;
    }
}

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.get('/api', (req, res) => {
    res.send({
        infrastructure: INFRASTRUCTURE,
        beaconData: beaconData
    });
});

app.use(express.static('public'));

app.listen(WEBSERVER_PORT, WEB_SERVER_IP, () => {
    console.log(`Webserver listening on port ${WEBSERVER_PORT}`);
});

// Set up the beacon servers
const net = require('net');
for (let port of PORTS) {
    const server = net.createServer((socket) => {
        // Normalize the ipv4 address
        let ipAddress = socket.remoteAddress.replace('::ffff:', '');

        console.log("Got beacon from " + ipAddress);

        // Collect last seen
        for (let team in INFRASTRUCTURE) {
            let hosts = INFRASTRUCTURE[team];
            for (let host in hosts) {
                if (hosts[host] === ipAddress) {
                    beaconData[team][host] = new Date();
                }
            }
        }

        // Echo server back to the client
        socket.pipe(socket);
    });

    server.listen(port, TCP_SERVER_IP, () => {
        console.log('TCP server started on port ' + port);
    });
}
