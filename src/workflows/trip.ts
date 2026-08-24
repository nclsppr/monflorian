import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from "cloudflare:workers";

export interface TripWorkflowParams {
  tripId: string;
}

export class TripWorkflow extends WorkflowEntrypoint<Env, TripWorkflowParams> {
  async run(event: WorkflowEvent<TripWorkflowParams>, step: WorkflowStep) {
    const gate = await step.do(
      "verify-generation-gate",
      {
        retries: {
          limit: 0,
          delay: "1 second",
        },
        timeout: "10 seconds",
      },
      async () => ({
        enabled:
          String(this.env.MONFLORIAN_GENERATION_ENABLED) === "true" &&
          String(this.env.MONFLORIAN_ILLUSTRATION_ENABLED) === "true",
        tripId: event.payload.tripId,
      }),
    );

    if (!gate.enabled) {
      return {
        status: "generation-disabled",
        tripId: gate.tripId,
      };
    }

    throw new Error("Le workflow de génération n’est pas encore activé.");
  }
}
