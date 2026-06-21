const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // --- STATIONS SEED ---
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
    await prisma.station.createMany({ data: stations, skipDuplicates: true });
    console.log(`✅ Seeded ${stations.length} stations`);

    // --- TRAINS SEED ---
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
    await prisma.train.createMany({ data: trains, skipDuplicates: true });
    console.log(`✅ Seeded ${trains.length} trains`);

    // --- SCHEDULES SEED ---
    // Get valid station codes and train numbers from DB
    const allStations = await prisma.station.findMany({ select: { code: true } });
    const allTrains = await prisma.train.findMany({ select: { number: true } });
    const validStations = new Set(allStations.map(s => s.code));
    const validTrains = new Set(allTrains.map(t => t.number));

    console.log(`${validStations.size} stations, ${validTrains.size} trains in DB`);

    console.log('Loading schedules.json...');
    const schedulesRaw = JSON.parse(fs.readFileSync('./schedules.json', 'utf-8'));
    const schedules = schedulesRaw
        .filter(s => validTrains.has(s.train_number) && validStations.has(s.station_code))
        .map(s => ({
            id: parseInt(s.id),
            trainNumber: s.train_number,
            stationCode: s.station_code,
            day: parseInt(s.day) || 1,
            arrival: s.arrival === "None" ? null : s.arrival,
            departure: s.departure === "None" ? null : s.departure
        }));

    console.log(`Inserting ${schedules.length} schedules in batches...`);
    const BATCH_SIZE = 5000;
    for (let i = 0; i < schedules.length; i += BATCH_SIZE) {
        const batch = schedules.slice(i, i + BATCH_SIZE);
        await prisma.trainSchedule.createMany({ data: batch, skipDuplicates: true });
        console.log(`  Done: ${Math.min(i + BATCH_SIZE, schedules.length)} / ${schedules.length}`);
    }
    console.log('All schedules seeded.');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });