import { Encoder, Profile } from "@garmin/fitsdk";
import type { FileIdMesg, WorkoutMesg, WorkoutStepMesg } from "@garmin/fitsdk";
import type { WorkoutInterval, WorkoutIntervalType } from "./supabase/types";

interface ExportableWorkout {
  title: string;
  discipline: string;
  structuredIntervals: WorkoutInterval[];
}

export function canExportStructuredWorkout(workout: ExportableWorkout): boolean {
  return workout.discipline.toLowerCase().includes("ciclismo") && workout.structuredIntervals.length > 0;
}

// ---------------------------------------------------------------------------
// .ZWO (Zwift structured workout format)
// ---------------------------------------------------------------------------

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function segmentToXml(interval: WorkoutInterval): string {
  const duration = Math.round(interval.durationSeconds);
  const powerLow = (interval.targetLowPct / 100).toFixed(2);
  const powerHigh = (interval.targetHighPct / 100).toFixed(2);
  const isSteady = interval.targetLowPct === interval.targetHighPct;

  if (interval.type === "warmup") {
    return `<Warmup Duration="${duration}" PowerLow="${powerLow}" PowerHigh="${powerHigh}"/>`;
  }

  if (interval.type === "cooldown") {
    return `<Cooldown Duration="${duration}" PowerLow="${powerLow}" PowerHigh="${powerHigh}"/>`;
  }

  if (isSteady) {
    return `<SteadyState Duration="${duration}" Power="${powerHigh}"/>`;
  }

  return `<Ramp Duration="${duration}" PowerLow="${powerLow}" PowerHigh="${powerHigh}"/>`;
}

/**
 * Generates the .ZWO XML (Zwift structured workout format, compatible
 * with import into Garmin and Wahoo watches/platforms via %FTP). Only
 * covers cycling — running/strength would use pace zones, out of current scope.
 */
export function buildZwoXml(workout: ExportableWorkout): string {
  const segments = workout.structuredIntervals.map(segmentToXml).join("\n    ");

  return `<?xml version="1.0" encoding="UTF-8"?>
<workout_file>
  <author>G4 Assessoria Esportiva</author>
  <name>${escapeXml(workout.title)}</name>
  <description>Exportado do painel G4. Potência em %FTP.</description>
  <sportType>bike</sportType>
  <workout>
    ${segments}
  </workout>
</workout_file>
`;
}

// ---------------------------------------------------------------------------
// .FIT (native Garmin binary format, via the official @garmin/fitsdk SDK)
// ---------------------------------------------------------------------------
// The message/field numbers and enum values below come straight from the
// FIT Profile bundled in the package (node_modules/@garmin/fitsdk/src/profile.js),
// not from memory — avoids generating an invalid binary from a wrong field/enum.

const FILE_TYPE_WORKOUT = 5; // Profile.types.file[5] === "workout"
const MANUFACTURER_DEVELOPMENT = 255; // Profile.types.manufacturer[255] === "development"
const SPORT_CYCLING = 2; // Profile.types.sport[2] === "cycling"
const DURATION_TYPE_TIME = 0; // Profile.types.wktStepDuration[0] === "time"
const TARGET_TYPE_POWER = 4; // Profile.types.wktStepTarget[4] === "power"
// capabilities: bit 0x0001 "interval" + bit 0x0800 "power" (power source required)
const WORKOUT_CAPABILITIES_INTERVAL_POWER = 0x0001 | 0x0800;

const INTENSITY_BY_TYPE: Record<WorkoutIntervalType, number> = {
  warmup: 2, // Profile.types.intensity[2] === "warmup"
  cooldown: 3, // "cooldown"
  recovery: 4, // "recovery"
  steady: 0, // "active"
  interval: 0, // "active"
};

// Official FIT convention for a power target (Profile.types.workoutPower):
// { 1000: "wattsOffset" } — values >= 1000 represent 1000 + %FTP; below
// 1000 they'd be absolute watts (not used here, %FTP only).
function ftpPercentToFitPower(pct: number): number {
  return 1000 + Math.round(pct);
}

/**
 * Generates a binary .FIT file (native Garmin structured workout) from
 * `structuredIntervals`, using Garmin's official SDK in the browser —
 * no server round-trip, same logic as the .ZWO. Only covers cycling.
 */
export function buildFitWorkout(workout: ExportableWorkout): Uint8Array {
  const encoder = new Encoder();

  // Each message is declared with the SDK's specific type (FileIdMesg,
  // WorkoutMesg, WorkoutStepMesg) — onMesg() only accepts the generic Mesg
  // type in its signature, so the specific typing catches field errors
  // without needing "as any".
  const fileId: FileIdMesg = {
    type: FILE_TYPE_WORKOUT,
    manufacturer: MANUFACTURER_DEVELOPMENT,
    product: 0,
    serialNumber: 1,
    timeCreated: new Date(),
  };
  encoder.onMesg(Profile.MesgNum.FILE_ID, fileId);

  const workoutMesg: WorkoutMesg = {
    sport: SPORT_CYCLING,
    capabilities: WORKOUT_CAPABILITIES_INTERVAL_POWER,
    numValidSteps: workout.structuredIntervals.length,
    wktName: workout.title,
  };
  encoder.onMesg(Profile.MesgNum.WORKOUT, workoutMesg);

  workout.structuredIntervals.forEach((interval, index) => {
    const step: WorkoutStepMesg = {
      messageIndex: index,
      durationType: DURATION_TYPE_TIME,
      durationValue: Math.round(interval.durationSeconds * 1000), // ms
      targetType: TARGET_TYPE_POWER,
      targetValue: 0, // 0 = usa a faixa customTargetValue low/high abaixo
      customTargetValueLow: ftpPercentToFitPower(interval.targetLowPct),
      customTargetValueHigh: ftpPercentToFitPower(interval.targetHighPct),
      intensity: INTENSITY_BY_TYPE[interval.type],
    };
    encoder.onMesg(Profile.MesgNum.WORKOUT_STEP, step);
  });

  return encoder.close();
}
