import {PrismaClient} from '@prisma/client';
process.loadEnvFile('.env');
const db=new PrismaClient();
try {console.log(await db.$queryRawUnsafe('SHOW PROCESSLIST')); console.log('Tables:',await db.$queryRawUnsafe('SHOW TABLES'));} finally {await db.$disconnect()}
