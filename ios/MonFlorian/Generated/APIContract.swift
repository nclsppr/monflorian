// Généré depuis docs/api/openapi.json par scripts/generate-api-clients.mjs.
// Modifier le contrat puis régénérer.

enum APIContract {
    static let version = "v1"
    static let configurationPath = "/api/v1/config"
    static let japanExamplePath = "/api/v1/examples/japan-10-days"
    static let tripsPath = "/api/v1/trips"
}

struct APIConfiguration: Codable, Equatable, Sendable {
    let serviceReady: Bool
    let tripCreationEnabled: Bool
    let illustrationEnabled: Bool
    let turnstileSiteKey: String?
    let accessMode: String
    let bookingMode: String
    let bookingAllowedHosts: [String]
    let limits: APILimits
    let apiVersion: String
    let generationReady: Bool
    let capabilities: APICapabilities
}

struct LegacyAPIConfiguration: Codable, Equatable, Sendable {
    let serviceReady: Bool
    let tripCreationEnabled: Bool
    let illustrationEnabled: Bool
    let turnstileSiteKey: String?
    let accessMode: String
    let bookingMode: String
    let bookingAllowedHosts: [String]
    let limits: APILimits
}

struct APILimits: Codable, Equatable, Sendable {
    let maxPhotos: Int
    let maxPhotoBytes: Int
    let maxTripDays: Int
    let maxTravelers: Int
}

struct APICapabilities: Codable, Equatable, Sendable {
    let publicExamplesEnabled: Bool
    let tripCreationEnabled: Bool
    let photoUploadEnabled: Bool
    let privateSharingEnabled: Bool
    let nativeOrdersEnabled: Bool
    let storeKitPurchasesEnabled: Bool
}
