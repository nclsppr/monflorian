import Foundation

extension APIConfiguration {
    var nativeOrdersReady: Bool {
        apiVersion == APIContract.version && serviceReady && generationReady && tripCreationEnabled
            && capabilities.tripCreationEnabled && capabilities.nativeOrdersEnabled
    }
    var storeKitReady: Bool { nativeOrdersReady && capabilities.storeKitPurchasesEnabled }
    var photoUploadReady: Bool { nativeOrdersReady && illustrationEnabled && capabilities.photoUploadEnabled }
}
extension LegacyAPIConfiguration {
    var readOnlyConfiguration: APIConfiguration {
        APIConfiguration(serviceReady: serviceReady, tripCreationEnabled: tripCreationEnabled,
            illustrationEnabled: illustrationEnabled, turnstileSiteKey: turnstileSiteKey,
            accessMode: accessMode, bookingMode: bookingMode, bookingAllowedHosts: bookingAllowedHosts,
            limits: limits, apiVersion: "legacy", generationReady: false,
            capabilities: APICapabilities(publicExamplesEnabled: true, tripCreationEnabled: false,
                photoUploadEnabled: false, privateSharingEnabled: false, nativeOrdersEnabled: false,
                storeKitPurchasesEnabled: false))
    }
}

struct PublicExample: Codable, Sendable {
    let apiVersion: String
    let exampleId: String
    let kind: String
    let canonicalPath: String
    let guide: TravelGuide
    let imageAssets: [String: ImageAsset]
    let bookingLinks: [String: String]
    struct ImageAsset: Codable, Sendable {
        let src: String
        let mobileSrc: String?
        let overlayLabel: String?
        let width: Int?
        let height: Int?
    }
    func validated() throws -> Self {
        guard apiVersion == "v1", exampleId == "japan-10-days", kind == "public_example",
              canonicalPath == "/carnets/japon-10-jours", guide.schemaVersion == "travel-guide.v1",
              guide.contentTemplateVersion == "monflorian-guide.v1", guide.trip.durationDays == 10,
              guide.days.map(\.day) == Array(1...10), guide.chapters.count == 5,
              guide.accommodations.reduce(0, { $0 + $1.nights }) == 9,
              Set(guide.verificationItems.map(\.id)).count == guide.verificationItems.count else {
            throw APIError.invalidContent
        }
        let chapterIDs = Set(guide.chapters.map(\.id))
        let stayIDs = Set(guide.accommodations.map(\.id))
        let checkIDs = Set(guide.verificationItems.map(\.id))
        guard guide.days.allSatisfy({ chapterIDs.contains($0.chapterId) && ($0.accommodationId == nil || stayIDs.contains($0.accommodationId!)) }),
              guide.allVerificationReferences.allSatisfy(checkIDs.contains),
              bookingLinks.values.allSatisfy({ ExternalLinks.bookingURL($0) != nil }) else { throw APIError.invalidContent }
        return self
    }
}

struct TravelGuide: Codable, Sendable {
    let schemaVersion: String
    let contentTemplateVersion: String
    let trip: Trip
    let budgetGuide: Budget
    let chapters: [Chapter]
    let days: [Day]
    let accommodations: [Accommodation]
    let reservationPlan: [Reservation]
    let practicalGuide: [String: [PracticalItem]]
    let imageBriefs: [PublicImage]
    let verificationItems: [Verification]
    var allVerificationReferences: [String] {
        budgetGuide.verificationItemIds + accommodations.flatMap(\.verificationItemIds)
            + reservationPlan.flatMap(\.verificationItemIds) + practicalGuide.values.flatMap { $0.flatMap(\.verificationItemIds) }
            + days.flatMap { $0.transfer.verificationItemIds + $0.moments.flatMap(\.verificationItemIds) }
    }
    func checks(_ ids: [String]) -> [Verification] { ids.compactMap { id in verificationItems.first { $0.id == id } } }
    func stay(_ id: String?) -> Accommodation? { accommodations.first { $0.id == id } }
    struct Trip: Codable, Sendable {
        let title, subtitle, destination, routeLabel: String
        let startDate, endDate: String?
        let durationDays, travelerCount: Int
        let pace, summary, florianRationale, featuredImageBriefId: String
    }
    struct Budget: Codable, Sendable {
        let currencyCode, approach, summary: String
        let mainVariables, verificationItemIds: [String]
    }
    struct Chapter: Codable, Identifiable, Sendable {
        let id: String
        let dayStart, dayEnd: Int
        let baseRefs: [String]
        let title, summary, whyItWorks, imageBriefId: String
    }
    struct Day: Codable, Identifiable, Sendable {
        var id: Int { day }
        let day: Int
        let date: String?
        let chapterId: String
        let accommodationId: String?
        let baseRefs: [String]
        let title, energy, summary: String
        let moments: [Moment]
        let transfer: Transfer
    }
    struct Moment: Codable, Identifiable, Sendable {
        var id: String { period }
        let period, title, placeRef, description, whyThisFits: String
        let durationMinutes, travelMinutes: Int
        let reservation, costLevel, practicalTip, rainAlternative, fatigueAlternative: String
        let verificationItemIds: [String]
    }
    struct Transfer: Codable, Sendable {
        let needed: Bool
        let placement: String
        let fromPlaceRef, toPlaceRef: String?
        let modes: [String]
        let durationMinutes: Int
        let reservation, description, luggageAdvice: String
        let verificationItemIds: [String]
    }
    struct Accommodation: Codable, Identifiable, Sendable {
        let id, destination: String
        let checkInDay, checkOutDay, nights: Int
        let bookingDestinationRef, propertyType, bookingPriority: String
        let recommendedAreas, selectionCriteria: [String]
        let rationale: String
        let watchFor, verificationItemIds: [String]
    }
    struct Reservation: Codable, Identifiable, Sendable {
        let id: String
        let day: Int?
        let category, title, priority, whenToBook, reason: String
        let accommodationIds, verificationItemIds: [String]
    }
    struct PracticalItem: Codable, Identifiable, Sendable {
        var id: String { title }
        let title, detail, priority: String
        let mustVerify: Bool
        let verificationItemIds: [String]
    }
    struct PublicImage: Codable, Identifiable, Sendable {
        let id, altText: String
        struct Key: CodingKey { var stringValue: String; var intValue: Int? { nil }; init?(stringValue: String) { self.stringValue = stringValue }; init?(intValue: Int) { return nil } }
        init(from decoder: Decoder) throws {
            let container = try decoder.container(keyedBy: Key.self)
            guard Set(container.allKeys.map(\.stringValue)) == ["id", "altText"] else { throw APIError.invalidContent }
            id = try container.decode(String.self, forKey: Key(stringValue: "id")!)
            altText = try container.decode(String.self, forKey: Key(stringValue: "altText")!)
        }
    }
    struct Verification: Codable, Identifiable, Sendable {
        let id, topic, timing, sourceType, sourceHint, reason: String
    }
}

enum ExternalLinks {
    static func bookingURL(_ value: String) -> URL? {
        guard let url = URL(string: value), url.scheme == "https", url.user == nil, url.password == nil,
              url.port == nil || url.port == 443, let host = url.host?.lowercased(),
              host == "booking.com" || host.hasSuffix(".booking.com") else { return nil }
        return url
    }
    static func editorialURL(_ value: String) -> URL? {
        guard let url = URL(string: value), url.scheme == "https", url.host != nil, url.user == nil, url.password == nil else { return nil }
        return url
    }
}

struct EditorialGuide: Codable, Identifiable, Sendable {
    var id: String { path }
    let path, heading, description, category, readTime, updatedDate: String
    let intro: [String]
    let sections: [ArticleSection]
    let sources: [Source]
    let relatedPath: String
    struct ArticleSection: Codable, Identifiable, Sendable {
        let id, heading: String
        let paragraphs: [Paragraph]
        let bullets: [String]?
        let table: ArticleTable?
        let after: [Paragraph]?
    }
    struct Paragraph: Codable, Sendable { let text: String; let source: String? }
    struct ArticleTable: Codable, Sendable { let caption: String; let headings: [String]; let rows: [[String]] }
    struct Source: Codable, Identifiable, Sendable { let id, label, url, detail: String }
}

enum Pace: String, Codable, CaseIterable, Identifiable {
    case calm, balanced, intense
    var id: Self { self }
    var title: String { switch self { case .calm: "Calme"; case .balanced: "Équilibré"; case .intense: "Soutenu" } }
}
enum Comfort: String, Codable, CaseIterable, Identifiable {
    case charm, essential, mixed
    var id: Self { self }
    var title: String { switch self { case .charm: "Hôtels de charme"; case .essential: "Confort essentiel"; case .mixed: "Un mélange" } }
}

// Photos intentionally have no field in this durable contract.
struct PlannerDraft: Codable, Equatable, Sendable {
    var version = 1
    var destination = ""
    var brief = ""
    var departureCity = ""
    var startDate: String?
    var days = 10
    var travelers = 2
    var pace: Pace = .balanced
    var comfort: Comfort = .charm
    var budget = ""
    var constraints = ""
    func validated() throws -> Self {
        let strings = [destination, brief, departureCity, budget, constraints]
        guard version == 1, (2...14).contains(days), (1...8).contains(travelers),
              destination.count <= 120, departureCity.count <= 120, brief.count <= 2000,
              budget.count <= 120, constraints.count <= 1000,
              strings.allSatisfy({ !$0.unicodeScalars.contains { $0.value < 32 && $0.value != 10 && $0.value != 9 } }),
              startDate == nil || (startDate!.count == 10 && Self.parseDate(startDate!) != nil) else { throw DraftError.invalid }
        return self
    }
    static func parseDate(_ text: String) -> Date? {
        let formatter = DateFormatter(); formatter.locale = Locale(identifier: "en_US_POSIX"); formatter.dateFormat = "yyyy-MM-dd"; formatter.isLenient = false
        return formatter.date(from: text)
    }
    static func dateString(_ date: Date) -> String {
        let formatter = DateFormatter(); formatter.locale = Locale(identifier: "en_US_POSIX"); formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: date)
    }
    var exportText: String {
        """
        Mon brief de voyage · Mon Florian

        Destination : \(destination.isEmpty ? "À préciser" : destination)
        Mon envie : \(brief.isEmpty ? "À préciser" : brief)
        Départ : \(departureCity.isEmpty ? "À préciser" : departureCity)
        Date : \(startDate ?? "À préciser")
        Durée : \(days) jours
        Voyageurs : \(travelers)
        Rythme : \(pace.title)
        Hébergement : \(comfort.title)
        Budget : \(budget.isEmpty ? "À préciser" : budget)
        Contraintes : \(constraints.isEmpty ? "À préciser" : constraints)

        Aucune demande ni réservation n’a été envoyée.
        Les photos ne font pas partie de cette fiche.
        """
    }
}
enum DraftError: LocalizedError {
    case invalid, tooLarge
    var errorDescription: String? { "Ce brouillon ne peut pas être lu. Vérifie les champs et leurs limites." }
}

struct DraftStorage {
    let url: URL
    func save(_ draft: PlannerDraft) throws {
        let data = try JSONEncoder().encode(draft.validated())
        guard data.count <= 16384 else { throw DraftError.tooLarge }
        try FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
        try data.write(to: url, options: [.atomic, .completeFileProtection])
        var resource = URLResourceValues(); resource.isExcludedFromBackup = true
        var copy = url; try copy.setResourceValues(resource)
    }
    func load() throws -> PlannerDraft? {
        guard FileManager.default.fileExists(atPath: url.path) else { return nil }
        let data = try Data(contentsOf: url)
        guard data.count <= 16384 else { throw DraftError.tooLarge }
        return try JSONDecoder().decode(PlannerDraft.self, from: data).validated()
    }
    func delete() throws {
        if FileManager.default.fileExists(atPath: url.path) { try FileManager.default.removeItem(at: url) }
    }
}
