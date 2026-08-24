import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from "cloudflare:workers";

import { AppError, buildAccommodationSuggestions, parseBookingConfiguration } from "../../app/core.mjs";
import { buildTripReadyEmail } from "../../app/email.mjs";
import { generateIllustration, generateItinerary } from "../../app/openai.mjs";
import {
  decryptJson,
  encryptJson,
  generatedObjectKey,
  sha256Hex,
} from "../../app/trips.mjs";
import {
  deleteGeneratedAssets,
  deleteSourceAssets,
  findTripById,
  listTripAssets,
  markNotificationFailed,
  markNotificationSent,
  markTripFailed,
  saveTripResult,
  upsertGeneratedAsset,
} from "../trips/repository";

export interface TripWorkflowParams {
  tripId: string;
}

type WorkflowEnv = Env & { OPENAI_API_KEY?: string };

interface StoredRequestEnvelope {
  publicToken: string;
  itinerary: {
    brief: string;
    startDate: string | null;
    endDate: string | null;
    requestedDays: number | null;
    travelers: number;
    pace: string;
  };
  photoCount: number;
  safetyIdentifier: string;
}

interface StoredEmailEnvelope {
  email: string;
}

const NO_RETRY = {
  retries: { limit: 0, delay: "1 second" },
} as const;

function workflowErrorCode(error: unknown): string {
  if (error instanceof AppError) return error.code;
  return "WORKFLOW_FAILED";
}

function storedRequest(value: unknown): StoredRequestEnvelope {
  if (!value || typeof value !== "object") {
    throw new AppError(500, "TRIP_DATA_UNREADABLE", "La demande privée est illisible.");
  }
  const envelope = value as Partial<StoredRequestEnvelope>;
  if (
    !envelope.itinerary ||
    typeof envelope.publicToken !== "string" ||
    typeof envelope.itinerary.brief !== "string" ||
    !Number.isInteger(envelope.photoCount) ||
    typeof envelope.safetyIdentifier !== "string"
  ) {
    throw new AppError(500, "TRIP_DATA_UNREADABLE", "La demande privée est incomplète.");
  }
  return envelope as StoredRequestEnvelope;
}

function storedEmail(value: unknown): StoredEmailEnvelope {
  if (!value || typeof value !== "object" || !("email" in value) || typeof value.email !== "string") {
    throw new AppError(500, "TRIP_DATA_UNREADABLE", "L’adresse de notification est illisible.");
  }
  return { email: value.email };
}

function illustrationBytes(dataUrl: string): Uint8Array {
  const match = /^data:image\/webp;base64,([A-Za-z0-9+/]+={0,2})$/u.exec(dataUrl);
  if (!match) throw new AppError(502, "PROVIDER_INVALID_RESPONSE", "L’illustration produite est illisible.");
  const binary = atob(match[1]);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

export class TripWorkflow extends WorkflowEntrypoint<WorkflowEnv, TripWorkflowParams> {
  async run(event: WorkflowEvent<TripWorkflowParams>, step: WorkflowStep) {
    const tripId = event.payload.tripId;
    const gate = await step.do(
      "verify-generation-gate",
      { ...NO_RETRY, timeout: "10 seconds" },
      async () => ({
        enabled:
          String(this.env.MONFLORIAN_GENERATION_ENABLED) === "true" &&
          String(this.env.MONFLORIAN_ILLUSTRATION_ENABLED) === "true" &&
          String(this.env.MONFLORIAN_EMAIL_ENABLED) === "true" &&
          Boolean(this.env.EMAIL) &&
          Boolean(this.env.MONFLORIAN_EMAIL_FROM) &&
          Boolean(this.env.MONFLORIAN_PUBLIC_ORIGIN) &&
          Boolean(this.env.OPENAI_API_KEY),
        tripId,
      }),
    );

    if (!gate.enabled) return { status: "generation-disabled", tripId };

    let itineraryProviderRequestId: string | null = null;
    let imageProviderRequestId: string | null = null;
    try {
      const itineraryStep = await step.do(
        "generate-and-encrypt-itinerary",
        { ...NO_RETRY, timeout: "90 seconds" },
        async () => {
          const trip = await findTripById(this.env.DB, tripId);
          if (!trip || !trip.request_ciphertext || !trip.request_nonce) {
            throw new AppError(404, "TRIP_NOT_FOUND", "Le voyage à préparer est introuvable.");
          }
          if (["deleted", "expired"].includes(trip.status)) {
            throw new AppError(409, "TRIP_CLOSED", "Le voyage a été supprimé ou a expiré.");
          }
          if (trip.status === "ready") return { status: "ready", hasPhotos: false, providerRequestId: null };

          const request = storedRequest(await decryptJson(
            this.env.TRIP_DATA_KEY,
            trip.request_ciphertext,
            trip.request_nonce,
            `${tripId}:request`,
          ));
          const apiKey = this.env.OPENAI_API_KEY;
          if (!apiKey) throw new AppError(503, "PROVIDER_CONFIGURATION", "OpenAI n’est pas configuré.");
          const generated = await generateItinerary({
            apiKey,
            model: this.env.OPENAI_TEXT_MODEL,
            request: request.itinerary,
            requestId: crypto.randomUUID(),
            safetyIdentifier: request.safetyIdentifier,
            signal: undefined,
          });
          const result = {
            itinerary: generated.itinerary,
            accommodationSuggestions: buildAccommodationSuggestions(
              generated.itinerary,
              request.itinerary,
              parseBookingConfiguration(this.env),
            ),
            generatedImages: [],
            meta: { itineraryProviderRequestId: generated.providerRequestId },
          };
          const encrypted = await encryptJson(this.env.TRIP_DATA_KEY, result, `${tripId}:result`);
          const hasPhotos = request.photoCount > 0;
          await saveTripResult(
            this.env.DB,
            tripId,
            hasPhotos ? "generating_images" : "ready",
            encrypted.ciphertext,
            encrypted.nonce,
            Date.now(),
          );
          return {
            status: hasPhotos ? "generating_images" : "ready",
            hasPhotos,
            providerRequestId: generated.providerRequestId,
          };
        },
      );
      itineraryProviderRequestId = itineraryStep.providerRequestId;

      if (itineraryStep.hasPhotos) {
        const imageStep = await step.do(
          "generate-store-and-encrypt-image",
          { ...NO_RETRY, timeout: "3 minutes" },
          async () => {
            const trip = await findTripById(this.env.DB, tripId);
            if (
              !trip ||
              !trip.request_ciphertext ||
              !trip.request_nonce ||
              !trip.result_ciphertext ||
              !trip.result_nonce
            ) {
              throw new AppError(404, "TRIP_NOT_FOUND", "Le voyage à illustrer est introuvable.");
            }
            const request = storedRequest(await decryptJson(
              this.env.TRIP_DATA_KEY,
              trip.request_ciphertext,
              trip.request_nonce,
              `${tripId}:request`,
            ));
            const partialResult = await decryptJson(
              this.env.TRIP_DATA_KEY,
              trip.result_ciphertext,
              trip.result_nonce,
              `${tripId}:result`,
            ) as Record<string, unknown>;
            const itinerary = partialResult.itinerary as Record<string, unknown>;
            const sourceAssets = (await listTripAssets(this.env.DB, tripId))
              .filter((asset) => asset.kind === "source_photo")
              .sort((left, right) => left.position - right.position);
            if (sourceAssets.length !== request.photoCount) {
              throw new AppError(409, "SOURCE_PHOTOS_MISSING", "Les photos du voyage sont incomplètes.");
            }
            const photos = await Promise.all(sourceAssets.map(async (asset) => {
              const object = await this.env.MEDIA.get(asset.object_key);
              if (!object) throw new AppError(409, "SOURCE_PHOTOS_MISSING", "Une photo du voyage est introuvable.");
              return {
                buffer: new Uint8Array(await object.arrayBuffer()),
                mimeType: asset.content_type,
              };
            }));
            const destination = typeof itinerary.destination === "string"
              ? itinerary.destination
              : "le voyage proposé";
            const days = Array.isArray(itinerary.days) ? itinerary.days : [];
            const firstDay = days[0] && typeof days[0] === "object"
              ? days[0] as Record<string, unknown>
              : null;
            const scene = typeof firstDay?.summary === "string"
              ? firstDay.summary
              : "Les voyageurs découvrent calmement un lieu emblématique de leur itinéraire.";
            const apiKey = this.env.OPENAI_API_KEY;
            if (!apiKey) throw new AppError(503, "PROVIDER_CONFIGURATION", "OpenAI n’est pas configuré.");
            const generated = await generateIllustration({
              apiKey,
              model: this.env.OPENAI_IMAGE_MODEL,
              request: { destination, scene, photos },
              requestId: crypto.randomUUID(),
              signal: undefined,
            });
            const image = illustrationBytes(generated.imageDataUrl);
            const objectKey = generatedObjectKey(tripId, 0);
            const now = Date.now();
            await this.env.MEDIA.put(objectKey, image, {
              httpMetadata: { contentType: "image/webp" },
              customMetadata: { kind: "generated_image", position: "0", tripId },
            });
            await upsertGeneratedAsset(this.env.DB, {
              id: crypto.randomUUID(),
              tripId,
              kind: "generated_image",
              position: 0,
              objectKey,
              contentType: "image/webp",
              sizeBytes: image.byteLength,
              checksumSha256: await sha256Hex(image),
              createdAt: now,
              expiresAt: trip.expires_at,
            });
            await deleteSourceAssets(this.env.DB, this.env.MEDIA, tripId, now);

            const previousMeta = partialResult.meta && typeof partialResult.meta === "object"
              ? partialResult.meta as Record<string, unknown>
              : {};
            const finalResult = {
              ...partialResult,
              generatedImages: [{ position: 0, alt: generated.alt }],
              meta: { ...previousMeta, imageProviderRequestId: generated.providerRequestId },
            };
            const encrypted = await encryptJson(this.env.TRIP_DATA_KEY, finalResult, `${tripId}:result`);
            await saveTripResult(this.env.DB, tripId, "ready", encrypted.ciphertext, encrypted.nonce, now);
            return { status: "ready", providerRequestId: generated.providerRequestId };
          },
        );
        imageProviderRequestId = imageStep.providerRequestId;
      }
    } catch (error) {
      const errorCode = workflowErrorCode(error);
      await step.do(
        "fail-and-clean-trip",
        { ...NO_RETRY, timeout: "30 seconds" },
        async () => {
          await markTripFailed(this.env.DB, tripId, errorCode, Date.now());
          await deleteSourceAssets(this.env.DB, this.env.MEDIA, tripId, Date.now());
          await deleteGeneratedAssets(this.env.DB, this.env.MEDIA, tripId, Date.now());
          return { errorCode };
        },
      );
      return { status: "failed", tripId, errorCode };
    }

    const notification = await step.do(
      "send-private-link-email",
      { ...NO_RETRY, timeout: "30 seconds" },
      async () => {
        try {
          const trip = await findTripById(this.env.DB, tripId);
          if (!trip || trip.status !== "ready") {
            throw new AppError(409, "TRIP_NOT_READY", "Le voyage n’est pas prêt à être envoyé.");
          }
          if (trip.notification_status === "sent") {
            return { status: "sent", messageId: null };
          }
          if (!trip.request_ciphertext || !trip.request_nonce || !trip.email_ciphertext || !trip.email_nonce) {
            throw new AppError(500, "TRIP_DATA_UNREADABLE", "Les données de notification sont incomplètes.");
          }
          const request = storedRequest(await decryptJson(
            this.env.TRIP_DATA_KEY,
            trip.request_ciphertext,
            trip.request_nonce,
            `${tripId}:request`,
          ));
          const recipient = storedEmail(await decryptJson(
            this.env.TRIP_DATA_KEY,
            trip.email_ciphertext,
            trip.email_nonce,
            `${tripId}:email`,
          ));
          const response = await this.env.EMAIL.send(buildTripReadyEmail({
            to: recipient.email,
            from: this.env.MONFLORIAN_EMAIL_FROM,
            origin: this.env.MONFLORIAN_PUBLIC_ORIGIN,
            publicToken: request.publicToken,
            expiresAt: trip.expires_at,
          }));
          await markNotificationSent(this.env.DB, tripId, Date.now());
          return { status: "sent", messageId: response.messageId };
        } catch {
          try {
            await markNotificationFailed(this.env.DB, tripId, Date.now());
          } catch {
            // Le voyage reste prêt. Une panne de notification ne supprime jamais son résultat.
          }
          return { status: "failed", messageId: null };
        }
      },
    );

    return {
      status: "ready",
      tripId,
      itineraryProviderRequestId,
      imageProviderRequestId,
      notificationStatus: notification.status,
      notificationMessageId: notification.messageId,
    };
  }
}
