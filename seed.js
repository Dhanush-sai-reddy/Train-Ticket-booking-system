const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const stationsRaw = JSON.parse(fs.readFileSync('./stations.json', 'utf-8'));
    const stations = stationsRaw.features.map(f => ({
        code: f.properties.code,
        name: f.properties.name,
        state: f.properties.state,
        zone: f.properties.zone,
        address: f.properties.address,
        longitude: f.geometry?.coordinates?.[0] || null,
        latitude: f.geometry?.coordinates?.[1] || null
    }));

    await prisma.station.createMany({
        data: stations,
        skipDuplicates: true
    });

    const trainsRaw = JSON.parse(fs.readFileSync('./trains.json', 'utf-8'));
    const trains = trainsRaw.features.map(f => ({
        number: f.properties.number,
        name: f.properties.name,
        type: f.properties.type,
        zone: f.properties.zone,
        returnTrain: f.properties.return_train,
        classes: f.properties.classes,
        thirdAc: f.properties.third_ac || 0,
        chairCar: f.properties.chair_car || 0,
        firstClass: f.properties.first_class || 0,
        sleeper: f.properties.sleeper || 0,
        secondAc: f.properties.second_ac || 0,
        durationH: f.properties.duration_h || null,
        durationM: f.properties.duration_m || null,
        departure: f.properties.departure,
        arrival: f.properties.arrival,
        fromStationCode: f.properties.from_station_code,
        toStationCode: f.properties.to_station_code
    }));

    await prisma.train.createMany({
        data: trains,
        skipDuplicates: true
    });

    const validStations = new Set(stations.map(s => s.code));
    const validTrains = new Set(trains.map(t => t.number));

    const schedulesRaw = JSON.parse(fs.readFileSync('./schedules.json', 'utf-8'));
    const schedules = schedulesRaw
        .filter(s => validTrains.has(s.train_number) && validStations.has(s.station_code))
        .map(s => ({
            id: parseInt(s.id),
            trainNumber: s.train_number,
            stationCode: s.station_code,
            day: parseInt(s.day),
            arrival: s.arrival === "None" ? null : s.arrival,
            departure: s.departure === "None" ? null : s.departure
        }));

    await prisma.trainSchedule.createMany({
        data: schedules,
        skipDuplicates: true
    });
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });