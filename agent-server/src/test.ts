import "dotenv/config";
import {
    askAwn,
    getBookedAppointments,
    resetConversation,
} from "./agent.js";

const demoUserId = "agent-test-user";

async function main() {
  resetConversation();

  // Step 1: Patient searches for an appointment
  const message1 = "أبغى موعد عيون في جدة";

  console.log("Patient:", message1);
  const response1 = await askAwn(message1, demoUserId);
  console.log("\nAwn:", response1);


  // Step 2: Patient chooses one of the appointments
  const message2 = "أفضل الموعد الأول";

  console.log("\nPatient:", message2);
  const response2 = await askAwn(message2, demoUserId);
  console.log("\nAwn:", response2);


  // Step 3: Patient explicitly confirms the booking
  const message3 = "نعم، أؤكد الحجز";

  console.log("\nPatient:", message3);
  const response3 = await askAwn(message3, demoUserId);
  console.log("\nAwn:", response3);
  console.log("\n----------------------------");
console.log("BOOKED APPOINTMENTS:");
console.log(getBookedAppointments());
}

main().catch((error) => {
  console.error("Error:", error);
});
