import XCTest
import UIKit
@testable import MonFlorian

@MainActor
final class MonFlorianTests: XCTestCase {
    private func config(_ values: [String: Any] = [:]) throws -> APIConfiguration {
        var data: [String: Any] = [
            "serviceReady": true, "tripCreationEnabled": true, "illustrationEnabled": true,
            "turnstileSiteKey": NSNull(), "accessMode": "public", "bookingMode": "external", "bookingAllowedHosts": ["www.booking.com"],
            "limits": ["maxPhotos": 4, "maxPhotoBytes": 1_500_000, "maxTripDays": 14, "maxTravelers": 8],
            "apiVersion": "v1", "generationReady": true,
            "capabilities": ["publicExamplesEnabled": true, "tripCreationEnabled": true, "photoUploadEnabled": true,
                             "privateSharingEnabled": false, "nativeOrdersEnabled": true, "storeKitPurchasesEnabled": true]
        ]
        data.merge(values) { _, new in new }
        return try JSONDecoder().decode(APIConfiguration.self, from: JSONSerialization.data(withJSONObject: data))
    }
    func testAllPurchaseGuardsMustAgree() throws {
        let ready = try config()
        XCTAssertTrue(PurchaseGate.canPurchase(configuration: ready, productAvailable: true, validatorAvailable: true))
        XCTAssertFalse(PurchaseGate.canPurchase(configuration: ready, productAvailable: false, validatorAvailable: true))
        XCTAssertFalse(PurchaseGate.canPurchase(configuration: ready, productAvailable: true, validatorAvailable: false))
        XCTAssertFalse(PurchaseGate.canPurchase(configuration: nil, productAvailable: true, validatorAvailable: true))
        for field in ["serviceReady", "tripCreationEnabled", "generationReady"] {
            XCTAssertFalse(PurchaseGate.canPurchase(configuration: try config([field: false]), productAvailable: true, validatorAvailable: true))
        }
        XCTAssertFalse(try config(["apiVersion": "v2"]).nativeOrdersReady)
        XCTAssertFalse(PurchaseService().available(configuration: ready))
    }
    func testLegacyCapabilitiesCannotAuthorizeNativeOrders() throws {
        let current = try config()
        let legacy = try JSONDecoder().decode(LegacyAPIConfiguration.self, from: JSONEncoder().encode(current))
        XCTAssertTrue(legacy.serviceReady)
        XCTAssertFalse(legacy.readOnlyConfiguration.nativeOrdersReady)
        XCTAssertFalse(legacy.readOnlyConfiguration.storeKitReady)
        XCTAssertFalse(legacy.readOnlyConfiguration.photoUploadReady)
    }
    func testAcknowledgementMustMatchTransactionAndDurableDelivery() {
        XCTAssertTrue(PurchaseAcknowledgement(transactionID: 12, durableOrderID: "order-12", deliveryAccepted: true).accepts(12))
        XCTAssertFalse(PurchaseAcknowledgement(transactionID: 13, durableOrderID: "order-12", deliveryAccepted: true).accepts(12))
        XCTAssertFalse(PurchaseAcknowledgement(transactionID: 12, durableOrderID: "", deliveryAccepted: true).accepts(12))
        XCTAssertFalse(PurchaseAcknowledgement(transactionID: 12, durableOrderID: "order-12", deliveryAccepted: false).accepts(12))
    }
    func testPublicExampleIsCompleteAndImagesDecodeOffline() throws {
        let url = try XCTUnwrap(Bundle.main.url(forResource: "japan-10-days", withExtension: "json"))
        let data = try Data(contentsOf: url)
        let example = try JSONDecoder().decode(PublicExample.self, from: data).validated()
        XCTAssertEqual(example.guide.days.count, 10)
        XCTAssertEqual(example.guide.chapters.count, 5)
        XCTAssertEqual(example.guide.practicalGuide.count, 9)
        XCTAssertEqual(example.guide.reservationPlan.count, 9)
        XCTAssertEqual(example.guide.verificationItems.count, 20)
        XCTAssertEqual(example.guide.days.last?.transfer.placement, "after_afternoon")
        XCTAssertNil(example.guide.days[1].transfer.durationMinutes)
        XCTAssertFalse(example.guide.days[1].transfer.needed)
        XCTAssertTrue(example.guide.days.allSatisfy { $0.transfer.isValid })
        XCTAssertNotNil(BundledImage.load("florian", extension: "png"))
        XCTAssertNotNil(BundledImage.load("wordmark", extension: "png"))
        for image in example.guide.imageBriefs {
            let path = try XCTUnwrap(Bundle.main.path(forResource: image.id, ofType: "webp"))
            XCTAssertNotNil(UIImage(contentsOfFile: path), image.id)
        }
        var object = try XCTUnwrap(JSONSerialization.jsonObject(with: data) as? [String: Any])
        var guide = try XCTUnwrap(object["guide"] as? [String: Any])
        var images = try XCTUnwrap(guide["imageBriefs"] as? [[String: Any]])
        images[0]["composition"] = "private-field"; guide["imageBriefs"] = images; object["guide"] = guide
        XCTAssertThrowsError(try JSONDecoder().decode(PublicExample.self, from: JSONSerialization.data(withJSONObject: object)))
    }
    func testTransferWithoutADurationCannotBePresentedAsPlanned() throws {
        let absent = #"{"needed":false,"placement":"none","fromPlaceRef":null,"toPlaceRef":null,"modes":["none"],"durationMinutes":null,"reservation":"none","description":null,"luggageAdvice":null,"verificationItemIds":[]}"#
        XCTAssertTrue(try JSONDecoder().decode(TravelGuide.Transfer.self, from: Data(absent.utf8)).isValid)
        var values = try XCTUnwrap(JSONSerialization.jsonObject(with: Data(absent.utf8)) as? [String: Any])
        values["needed"] = true; values["placement"] = "after_morning"; values["modes"] = ["local_train"]
        values["fromPlaceRef"] = "departure"; values["toPlaceRef"] = "arrival"
        values["description"] = "Train entre deux étapes"; values["luggageAdvice"] = "Garder les bagages près de soi"
        for duration: Any in [NSNull(), 0, -1] {
            values["durationMinutes"] = duration
            XCTAssertFalse(try JSONDecoder().decode(TravelGuide.Transfer.self, from: JSONSerialization.data(withJSONObject: values)).isValid)
        }
        values["durationMinutes"] = 90
        XCTAssertTrue(try JSONDecoder().decode(TravelGuide.Transfer.self, from: JSONSerialization.data(withJSONObject: values)).isValid)
    }
    func testCanonicalGuidesIncludeAllSectionsAndSources() throws {
        let url = try XCTUnwrap(Bundle.main.url(forResource: "guides", withExtension: "json"))
        let guides = try JSONDecoder().decode([EditorialGuide].self, from: Data(contentsOf: url))
        XCTAssertEqual(guides.count, 2)
        for guide in guides { XCTAssertGreaterThan(guide.sections.count, 4); XCTAssertFalse(guide.sources.isEmpty) }
    }
    func testDraftStorageIsExplicitBoundedAndScoped() throws {
        let directory = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        defer { try? FileManager.default.removeItem(at: directory) }
        let storage = DraftStorage(url: directory.appendingPathComponent("draft.json"))
        XCTAssertNil(try storage.load())
        var draft = PlannerDraft(); draft.destination = "Japon"; draft.constraints = "Voyager sans voiture"
        try storage.save(draft)
        draft.destination = "Portugal"
        XCTAssertEqual(try storage.load()?.destination, "Japon", "Editing must not silently rewrite the saved draft")
        try storage.save(draft)
        XCTAssertEqual(try storage.load()?.destination, "Portugal")
        let sibling = directory.appendingPathComponent("unrelated.txt"); try Data("preserved".utf8).write(to: sibling)
        let serialized = try String(contentsOf: storage.url, encoding: .utf8)
        XCTAssertFalse(serialized.contains("photos"))
        try storage.delete()
        XCTAssertNil(try storage.load()); XCTAssertTrue(FileManager.default.fileExists(atPath: sibling.path))
        draft.days = 15; XCTAssertThrowsError(try storage.save(draft))
        draft.days = 10; draft.travelers = 0; XCTAssertThrowsError(try storage.save(draft))
        draft.travelers = 2; draft.brief = String(repeating: "a", count: 2001); XCTAssertThrowsError(try storage.save(draft))
        draft.brief = ""; draft.startDate = "2026-02-31"; XCTAssertThrowsError(try storage.save(draft))
    }
    func testOversizedAndUnknownDraftsAreRejected() throws {
        let directory = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        defer { try? FileManager.default.removeItem(at: directory) }
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        let storage = DraftStorage(url: directory.appendingPathComponent("draft.json"))
        try Data(repeating: 65, count: 16385).write(to: storage.url)
        XCTAssertThrowsError(try storage.load())
        var draft = PlannerDraft(); draft.version = 2
        try JSONEncoder().encode(draft).write(to: storage.url)
        XCTAssertThrowsError(try storage.load())
    }
    func testBookingLinksRejectLookalikeHostsAndNonHTTPS() {
        XCTAssertNotNil(ExternalLinks.bookingURL("https://www.booking.com/city/jp/tokyo.fr.html"))
        for link in ["http://www.booking.com/", "https://booking.com.evil.test/", "https://evilbooking.com/", "https://attacker@booking.com/", "javascript:alert(1)", "https://booking.com:444/"] { XCTAssertNil(ExternalLinks.bookingURL(link)) }
    }
    func testChecklistRestoresKnownIDsOnlyAndDoesNotTouchOtherKeys() throws {
        let suite = "MonFlorianUnit-\(UUID().uuidString)"
        let preferences = try XCTUnwrap(UserDefaults(suiteName: suite))
        defer { preferences.removePersistentDomain(forName: suite) }
        preferences.set(["verify-weather", "hostile-unknown"], forKey: "monflorian:japan-checklist:ios:v1")
        preferences.set("keep", forKey: "unrelated")
        let state = AppState(preferences: preferences, offlineMode: true)
        XCTAssertEqual(state.checkedItems, ["verify-weather"])
        state.setChecked("unknown", checked: true); XCTAssertEqual(state.checkedItems.count, 1)
        state.resetChecklist(); XCTAssertEqual(preferences.string(forKey: "unrelated"), "keep")
    }
}

final class StubProtocol: URLProtocol, @unchecked Sendable {
    nonisolated(unsafe) static var handler: ((URLRequest) throws -> (Int, String, Data))?
    override class func canInit(with request: URLRequest) -> Bool { true }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }
    override func startLoading() {
        do {
            let (status, type, data) = try Self.handler!(request)
            let response = HTTPURLResponse(url: request.url!, statusCode: status, httpVersion: nil, headerFields: ["Content-Type": type])!
            client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
            client?.urlProtocol(self, didLoad: data)
            client?.urlProtocolDidFinishLoading(self)
        } catch { client?.urlProtocol(self, didFailWithError: error) }
    }
    override func stopLoading() {}
}

@MainActor
final class APIClientTests: XCTestCase {
    func client() -> APIClient {
        let config = URLSessionConfiguration.ephemeral; config.protocolClasses = [StubProtocol.self]
        return APIClient(baseURL: URL(string: "https://monflorian.test")!, session: URLSession(configuration: config))
    }
    func test404AllowsReadOnlyLegacyFallback() async throws {
        let legacy = #"{"serviceReady":true,"tripCreationEnabled":true,"illustrationEnabled":true,"turnstileSiteKey":null,"accessMode":"public","bookingMode":"external","bookingAllowedHosts":["www.booking.com"],"limits":{"maxPhotos":4,"maxPhotoBytes":1500000,"maxTripDays":14,"maxTravelers":8}}"#
        StubProtocol.handler = { request in
            switch request.url?.path {
            case "/api/v1/config": return (404, "application/json", Data("{}".utf8))
            case "/api/config": return (200, "application/json", Data(legacy.utf8))
            default: throw APIError.invalidContent
            }
        }
        let config = try await client().configuration()
        XCTAssertEqual(config.apiVersion, "legacy"); XCTAssertFalse(config.storeKitReady); XCTAssertFalse(config.nativeOrdersReady)
    }
    func testFailureCannotFallBackToPotentiallyStaleReadiness() async throws {
        StubProtocol.handler = { request in
            XCTAssertEqual(request.url?.path, "/api/v1/config")
            return (503, "application/json", Data("{}".utf8))
        }
        do { _ = try await client().configuration(); XCTFail("503 must not succeed") }
        catch { XCTAssertEqual(error as? APIError, .http(503)) }
    }
    func testHTMLAndOversizedResponsesAreRejected() async throws {
        StubProtocol.handler = { _ in (200, "text/html", Data("<html></html>".utf8)) }
        do { _ = try await client().configuration(); XCTFail() } catch { XCTAssertEqual(error as? APIError, .invalidContent) }
        StubProtocol.handler = { _ in (200, "application/json", Data(repeating: 32, count: 16385)) }
        do { _ = try await client().configuration(); XCTFail() } catch { XCTAssertEqual(error as? APIError, .oversized) }
    }
}
