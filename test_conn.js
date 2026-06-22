const { Client } = require('pg');

const run = async () => {
    const connectionString = "postgresql://postgres.fmxfceaoohlsqejsamyo:A1m%40ndshef@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true";
    const client = new Client({ connectionString });
    try {
        await client.connect();
        const res = await client.query('SELECT 1');
        console.log("6543 Connection successful:", res.rows);
        await client.end();
    } catch (err) {
        console.error("6543 Connection failed:", err.message);
    }

    const connectionString2 = "postgresql://postgres.fmxfceaoohlsqejsamyo:A1m%40ndshef@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres";
    const client2 = new Client({ connectionString: connectionString2 });
    try {
        await client2.connect();
        const res = await client2.query('SELECT 1');
        console.log("5432 Connection successful:", res.rows);
        await client2.end();
    } catch (err) {
        console.error("5432 Connection failed:", err.message);
    }
};

run();
