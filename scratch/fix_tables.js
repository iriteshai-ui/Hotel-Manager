import { db } from '../server/src/db.js';

async function main() {
  const hotelId = '0a4fabc0-0b95-467b-a22c-252aec59f9c7';
  for (const num of [1, 2, 11]) {
    const existing = await db.getTableByNumber(num, hotelId);
    if (!existing) {
      const added = await db.addTable(num, 4, hotelId);
      console.log(`Added Table ${num}:`, added);
    } else {
      console.log(`Table ${num} already exists`);
    }
  }
  const all = await db.getTables(hotelId);
  console.log('Laybhari tables:', all.map(t => `T${t.number}`).join(', '));
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
