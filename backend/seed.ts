import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
    console.log('Connecting to database...');
    
    // Clear existing data (in order of relations)
    console.log('Clearing existing data...');
    await prisma.route.deleteMany({});
    await prisma.train.deleteMany({});
    await prisma.station.deleteMany({});

    // 1. Seed Stations
    const stationsPath = path.join(__dirname, '../stations.json');
    console.log(`Loading ${stationsPath}...`);
    
    const stationsRaw = fs.readFileSync(stationsPath, 'utf8');
    const stationsData = JSON.parse(stationsRaw);
    
    const stations = [];
    const stationMap = new Map<string, string>(); // code -> id
    
    for (let i = 0; i < stationsData.features.length; i++) {
        const feature = stationsData.features[i];
        if (!feature || typeof feature !== 'object') continue;
        
        const props = feature.properties || {};
        const geom = feature.geometry || {};
        
        const code = (props.code || i.toString()).toUpperCase();
        const name = props.name || 'Unknown';
        const city = props.state || 'Unknown';
        
        const coords = geom.coordinates || [0, 0];
        const lon = coords.length >= 2 ? coords[0] : 0;
        const lat = coords.length >= 2 ? coords[1] : 0;
        
        const id = `st_${code}_${i}`;
        stationMap.set(code, id);
        
        stations.push({
            id,
            name,
            code,
            city,
            latitude: lat,
            longitude: lon
        });
    }

    console.log(`Inserting ${stations.length} stations...`);
    await prisma.station.createMany({
        data: stations,
        skipDuplicates: true
    });
    
    // Re-fetch to get valid station IDs
    const validStations = await prisma.station.findMany({ select: { id: true, code: true } });
    validStations.forEach(s => stationMap.set(s.code, s.id));

    // 2. Seed Trains
    const trainsPath = path.join(__dirname, '../trains.json');
    console.log(`Loading ${trainsPath}...`);
    const trainsRaw = fs.readFileSync(trainsPath, 'utf8');
    const trainsData = JSON.parse(trainsRaw);
    
    const trains = [];
    const routes = [];
    
    for (let i = 0; i < trainsData.features.length; i++) {
        const feature = trainsData.features[i];
        if (!feature || typeof feature !== 'object') continue;
        
        const props = feature.properties || {};
        
        const number = (props.number || i.toString()).toString();
        const name = props.name || 'Unknown Train';
        let type = (props.type || 'express').toLowerCase();
        if (!type || type === 'null') type = 'express';
        
        const seats = (props.sleeper || 0) + (props.third_ac || 0) * 2 + 100;
        const id = `tr_${number}_${i}`;
        
        trains.push({
            id,
            name,
            number,
            type,
            totalSeats: seats > 0 ? seats : 500,
            amenities: ['Wifi', 'Meals'],
            active: true
        });
        
        const fromCode = (props.from_station_code || '').toString().toUpperCase();
        const toCode = (props.to_station_code || '').toString().toUpperCase();
        const distance = props.distance || 0;
        
        const originId = stationMap.get(fromCode);
        const destinationId = stationMap.get(toCode);
        
        if (originId && destinationId) {
            routes.push({
                id: `rt_${number}_${i}`,
                trainId: id,
                originId,
                destinationId,
                distanceKm: distance ? parseFloat(distance) : 100.0,
                basePrice: Math.max(150.0, (distance ? parseFloat(distance) : 100) * 1.5)
            });
        }
    }
    
    console.log(`Inserting ${trains.length} trains...`);
    await prisma.train.createMany({
        data: trains,
        skipDuplicates: true
    });
    
    const validTrainsDb = await prisma.train.findMany({ select: { id: true } });
    const validTrainIds = new Set(validTrainsDb.map(t => t.id));
    
    const validRoutes = routes.filter(r => validTrainIds.has(r.trainId));
    console.log(`Inserting ${validRoutes.length} routes...`);
    
    await prisma.route.createMany({
        data: validRoutes,
        skipDuplicates: true
    });

    console.log('✅ Database successfully seeded with JS/TS Prisma Script!');
}

main()
    .catch((e) => {
        console.error('Fatal error during seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
