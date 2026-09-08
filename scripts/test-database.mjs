import {spawnSync} from 'node:child_process';
process.loadEnvFile('.env');
const url=process.env.TEST_DATABASE_URL;
if(!url||!new URL(url).pathname.endsWith('_test'))throw new Error('Set TEST_DATABASE_URL to a dedicated database ending in _test.');
const migrate=spawnSync(process.execPath,['node_modules/prisma/build/index.js','migrate','deploy'],{stdio:'inherit',env:{...process.env,DATABASE_URL:url}});
if(migrate.status!==0)process.exit(migrate.status||1);
const test=spawnSync(process.execPath,['--import','tsx','--test','tests/backend.integration.test.ts'],{stdio:'inherit',env:process.env});
process.exitCode=test.status||0;
