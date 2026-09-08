import { NextResponse } from 'next/server';
import { route } from '@/lib/server/http';
import { getVehicles } from '@/lib/server/vehicle-data';
export const GET=route(async()=>NextResponse.json({items:await getVehicles()}));
