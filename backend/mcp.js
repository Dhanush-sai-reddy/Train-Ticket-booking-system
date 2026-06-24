/**
 * MCP Server — Model Context Protocol tools for RailRover
 *
 * Exposes the database via standardised tools so any MCP-compatible
 * LLM client (Claude Desktop, Cursor, etc.) can query live data.
 *
 * Mount in server.js:
 *   app.use('/mcp', require('./mcp'));
 */

const express  = require('express');
const jwt      = require('jsonwebtoken');
const { McpServer }                    = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StreamableHTTPServerTransport} = require('@modelcontextprotocol/sdk/server/streamableHttp.js');
const { z }    = require('zod');
const { prisma } = require('./lib/prisma');

// ─── Resolve user from Bearer token (returns null if missing/invalid) ─────────
async function resolveUser(req) {
  try {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) return null;
    const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    return await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, firstName: true, lastName: true, phone: true },
    });
  } catch { return null; }
}

const AUTH_REQUIRED = { content: [{ type: 'text', text: 'Authentication required. Pass your JWT as: Authorization: Bearer <token>' }] };

// ─── Build McpServer (one per request, user context injected) ─────────────────
function buildServer(user) {
  const server = new McpServer({ name: 'railrover', version: '1.0.0' });

  // ── PUBLIC TOOLS ─────────────────────────────────────────────────────────────

  server.tool(
    'search_trains',
    'Find trains running between two stations. Returns train name, number, type, departure/arrival times, and available seat classes.',
    { from: z.string().describe('Origin station code e.g. NDLS'), to: z.string().describe('Destination station code e.g. MAS') },
    async ({ from, to }) => {
      const fromCode = from.toUpperCase();
      const toCode   = to.toUpperCase();

      const direct = await prisma.train.findMany({
        where: { fromStationCode: fromCode, toStationCode: toCode },
        include: { fromStation: true, toStation: true },
        take: 20,
      });

      // Widen search to intermediate stops when direct results are sparse
      // Uses mapped DB column names as stored in Supabase (via Prisma @@map / @map)
      const indirect = direct.length < 5
        ? await prisma.$queryRaw`
            SELECT DISTINCT
              t.number,
              t.name,
              t.type,
              t.departure,
              t.arrival,
              t.sleeper,
              t.chair_car,
              t.second_ac,
              t.third_ac,
              t.first_class,
              t.from_station_code,
              t.to_station_code
            FROM trains t
            JOIN train_schedules s1 ON s1.train_number = t.number
            JOIN train_schedules s2 ON s2.train_number = t.number
            WHERE s1.station_code = ${fromCode}
              AND s2.station_code = ${toCode}
              AND (s1.day < s2.day OR (s1.day = s2.day AND s1.id < s2.id))
            LIMIT 15`
        : [];

      return { content: [{ type: 'text', text: JSON.stringify({ direct, indirect }, null, 2) }] };
    },
  );

  server.tool(
    'get_train',
    'Get full details of a train including all schedule stops, seat counts, and route info.',
    { number: z.string().describe('Train number e.g. 12301') },
    async ({ number }) => {
      const train = await prisma.train.findUnique({
        where: { number },
        include: {
          fromStation: true, toStation: true,
          trainSchedules: { orderBy: [{ day: 'asc' }, { id: 'asc' }], include: { station: true } },
        },
      });
      if (!train) return { content: [{ type: 'text', text: `Train ${number} not found.` }] };
      return { content: [{ type: 'text', text: JSON.stringify(train, null, 2) }] };
    },
  );

  server.tool(
    'search_stations',
    'Search railway stations by name, code, or state.',
    { query: z.string().describe('Partial name, code, or state e.g. "Delhi", "NDLS", "Maharashtra"') },
    async ({ query }) => {
      const stations = await prisma.station.findMany({
        where: { OR: [
          { name:  { contains: query, mode: 'insensitive' } },
          { code:  { contains: query, mode: 'insensitive' } },
          { state: { contains: query, mode: 'insensitive' } },
        ]},
        take: 20,
        orderBy: { name: 'asc' },
      });
      return { content: [{ type: 'text', text: JSON.stringify(stations, null, 2) }] };
    },
  );

  // ── USER-SPECIFIC TOOLS ───────────────────────────────────────────────────────

  server.tool(
    'get_my_profile',
    'Returns the authenticated user\'s profile — name, email, loyalty points, tier, and booking count.',
    {},   // no params needed; user comes from the JWT
    async () => {
      if (!user) return AUTH_REQUIRED;
      const profile = await prisma.userProfile.findUnique({
        where: { userId: user.id },
      });
      return { content: [{ type: 'text', text: JSON.stringify({ ...user, profile }, null, 2) }] };
    },
  );

  server.tool(
    'get_my_bookings',
    'List the authenticated user\'s bookings — train, route, travel date, class, price, and status.',
    {
      status: z.enum(['confirmed', 'cancelled']).optional().describe('Filter by status'),
      limit:  z.number().int().min(1).max(50).default(10).describe('Max results to return'),
    },
    async ({ status, limit = 10 }) => {
      if (!user) return AUTH_REQUIRED;
      const where = { userId: user.id, ...(status && { status }) };
      const bookings = await prisma.booking.findMany({
        where,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { train: true, fromStation: true, toStation: true },
      });
      return { content: [{ type: 'text', text: JSON.stringify(bookings, null, 2) }] };
    },
  );

  server.tool(
    'get_my_booking',
    'Fetch a single booking by ID — only succeeds if it belongs to the authenticated user.',
    { bookingId: z.string().uuid().describe('Booking UUID') },
    async ({ bookingId }) => {
      if (!user) return AUTH_REQUIRED;
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { train: true, fromStation: true, toStation: true },
      });
      if (!booking)              return { content: [{ type: 'text', text: 'Booking not found.' }] };
      if (booking.userId !== user.id) return { content: [{ type: 'text', text: 'Not your booking.' }] };
      return { content: [{ type: 'text', text: JSON.stringify(booking, null, 2) }] };
    },
  );

  server.tool(
    'cancel_my_booking',
    'Cancel a confirmed booking that belongs to the authenticated user.',
    { bookingId: z.string().uuid().describe('Booking UUID to cancel') },
    async ({ bookingId }) => {
      if (!user) return AUTH_REQUIRED;
      const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
      if (!booking)                    return { content: [{ type: 'text', text: 'Booking not found.' }] };
      if (booking.userId !== user.id)  return { content: [{ type: 'text', text: 'Not your booking.' }] };
      if (booking.status !== 'confirmed') return { content: [{ type: 'text', text: `Cannot cancel — status is "${booking.status}".` }] };
      const updated = await prisma.booking.update({ where: { id: bookingId }, data: { status: 'cancelled' } });
      return { content: [{ type: 'text', text: `Booking ${bookingId} cancelled. ${JSON.stringify(updated)}` }] };
    },
  );

  return server;
}

// ─── Express Router ───────────────────────────────────────────────────────────
const router = express.Router();

async function handleMcp(req, res) {
  const user      = await resolveUser(req);   // null if no/bad token — tools handle it
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  await buildServer(user).connect(transport);
  await transport.handleRequest(req, res, req.body);
}

router.post('/', handleMcp);
router.get('/',  handleMcp);

module.exports = router;
