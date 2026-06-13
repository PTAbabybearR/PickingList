import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

// 附录 A.1 等级
const GRADES: { name: string; sortOrder: number }[] = [
  { name: "SD", sortOrder: 10 },
  { name: "EG", sortOrder: 20 },
  { name: "HG", sortOrder: 30 },
  { name: "RG", sortOrder: 40 },
  { name: "MG", sortOrder: 50 },
  { name: "PG", sortOrder: 60 },
  { name: "FM", sortOrder: 70 },
  { name: "其他", sortOrder: 99 },
];

// 附录 A.2 作品系列（挂到常见等级下）
const SERIES = [
  "UC（宇宙世纪）",
  "SEED",
  "00",
  "Wing（飞翼）",
  "铁血的奥尔芬斯",
  "水星的魔女",
  "其他/原创",
];
const SERIES_UNDER = ["HG", "RG", "MG"];

async function main() {
  for (const g of GRADES) {
    const grade = await prisma.grade.upsert({
      where: { name: g.name },
      update: { sortOrder: g.sortOrder },
      create: g,
    });

    if (SERIES_UNDER.includes(g.name)) {
      for (let i = 0; i < SERIES.length; i++) {
        await prisma.series.upsert({
          where: { gradeId_name: { gradeId: grade.id, name: SERIES[i] } },
          update: { sortOrder: i * 10 },
          create: { gradeId: grade.id, name: SERIES[i], sortOrder: i * 10 },
        });
      }
    }
  }

  const grades = await prisma.grade.count();
  const series = await prisma.series.count();
  console.log(`Seed 完成：${grades} 个等级，${series} 个系列`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
