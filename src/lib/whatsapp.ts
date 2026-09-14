import { formatDistance, formatDuration } from "./workout-metrics";
import type { MockWorkoutDetail } from "./mock-data";

/** Builds a wa.me link with the text pre-filled (URL-encoded). */
export function buildWhatsAppLink(phone: string, text: string): string {
  const digitsOnly = phone.replace(/\D/g, "");
  return `https://wa.me/${digitsOnly}?text=${encodeURIComponent(text)}`;
}

/** Formatted text for the day's workout, sent by the coach to the athlete. */
export function buildWorkoutWhatsAppMessage(workout: MockWorkoutDetail): string {
  const lines = [
    `*Treino de hoje — ${workout.title}*`,
    `${workout.discipline} · ${workout.scheduledDateLabel}`,
    workout.description,
    "",
    `🔥 Aquecimento: ${workout.prescription.warmup}`,
    `💪 Parte principal: ${workout.prescription.mainSet}`,
    `🧊 Desaquecimento: ${workout.prescription.cooldown}`,
    "",
    `Duração prevista: ${formatDuration(workout.planned.durationSeconds)}`,
    `Distância prevista: ${formatDistance(workout.planned.distanceMeters)}`,
  ];

  if (workout.prescription.videoUrl) {
    lines.push("", `Vídeo/preleção: ${workout.prescription.videoUrl}`);
  }

  return lines.join("\n");
}
