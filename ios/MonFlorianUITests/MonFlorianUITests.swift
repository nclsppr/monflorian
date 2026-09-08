import XCTest

@MainActor
final class MonFlorianUITests: XCTestCase {
    var app: XCUIApplication!
    override func setUp() async throws {
        await MainActor.run {
            continueAfterFailure = false
            app = XCUIApplication()
            app.launchArguments = ["--ui-testing", "--reset-state", "--offline"]
            app.launch()
        }
    }
    private func screenshot(_ name: String) {
        let attachment = XCTAttachment(screenshot: app.screenshot()); attachment.name = name; attachment.lifetime = .keepAlways; add(attachment)
    }
    private func reveal(_ element: XCUIElement, maximumSwipes: Int = 12) {
        for _ in 0..<maximumSwipes {
            if element.exists && element.isHittable { return }
            app.swipeUp()
        }
    }
    private func attachPhotoPickerDiagnostics(service: XCUIApplication) {
        for (name, scope) in [("Mon Florian", app!), ("PhotosUIService", service)] {
            let attachment = XCTAttachment(string: "State: \(scope.state.rawValue)\n\(scope.debugDescription)")
            attachment.name = "PhotosPicker · \(name) · hiérarchie"
            attachment.lifetime = .keepAlways
            add(attachment)
        }
        screenshot("PhotosPicker · état à l’échec")
    }
    private func photoPickerBars(in scope: XCUIApplication) -> [XCUIElement] {
        guard scope.state != .notRunning else { return [] }
        return scope.descendants(matching: .navigationBar).allElementsBoundByAccessibilityElement
            .filter { $0.identifier == "Photos" || $0.identifier == "PUPickerUnavailableView" }
    }
    private func waitForPhotoPickerCancel(service: XCUIApplication) async throws -> (bar: XCUIElement, cancel: XCUIElement)? {
        let clock = ContinuousClock()
        let deadline = clock.now.advanced(by: .seconds(30))
        repeat {
            for scope in [app!, service] where scope.state != .notRunning {
                // Both states are present in actual iOS test attachments: the
                // loaded Photos service and its cancellable loading sheet.
                let bars = photoPickerBars(in: scope)
                let matches = bars.flatMap { bar in
                    bar.descendants(matching: .button).allElementsBoundByAccessibilityElement
                        .filter { $0.identifier == "Cancel" || $0.label == "Cancel" || $0.label == "Annuler" }
                        .map { (bar: bar, cancel: $0) }
                }
                if matches.count == 1, let match = matches.first, match.cancel.isHittable { return match }
                if clock.now >= deadline { return nil }
            }
            if clock.now >= deadline { return nil }
            try await Task.sleep(for: .milliseconds(500))
        } while clock.now < deadline
        return nil
    }
    private func waitForPhotoPickerDismissal(service: XCUIApplication, picker: XCUIElement) async throws -> Bool {
        let clock = ContinuousClock()
        let deadline = clock.now.advanced(by: .seconds(10))
        repeat {
            // A system process can retain an offscreen view after dismissal.
            let hasPickerBar = [app!, service].contains { scope in
                photoPickerBars(in: scope).contains { $0.isHittable }
            }
            if !hasPickerBar && picker.exists && picker.isHittable { return true }
            try await Task.sleep(for: .milliseconds(250))
        } while clock.now < deadline
        return false
    }
    func testOfflineCarnetDayAndChecklist() throws {
        XCTAssertTrue(app.buttons["open-example"].waitForExistence(timeout: 10))
        screenshot("Accueil natif")
        app.buttons["open-example"].tap()
        let firstDay = app.buttons["day-1"]
        reveal(firstDay); XCTAssertTrue(firstDay.isHittable); firstDay.tap()
        XCTAssertTrue(app.staticTexts["Atterrir sans courir"].waitForExistence(timeout: 5))
        screenshot("Jour 1 et transfert")
        XCTAssertTrue(app.staticTexts["Transfert · 120 min"].exists)
        app.navigationBars.buttons.element(boundBy: 0).tap()
        let checklist = app.buttons.matching(NSPredicate(format: "label CONTAINS %@", "À vérifier")).firstMatch
        for _ in 0..<8 { if checklist.isHittable { break }; app.swipeDown() }
        checklist.tap()
        let firstCheck = app.buttons["check-verify-airports-flights"]
        XCTAssertTrue(firstCheck.waitForExistence(timeout: 5)); firstCheck.tap()
        XCTAssertEqual(firstCheck.value as? String, "Vérifié")
        screenshot("Checklist locale")
    }
    func testDraftCanBeSavedRestoredExportedAndDeletedWithoutPayment() throws {
        app.tabBars.buttons["Mon voyage"].tap()
        XCTAssertTrue(app.buttons["choose-photos"].exists)
        let destination = app.textFields["destination-field"]
        destination.tap(); destination.typeText("Portugal")
        let next = app.buttons["planner-next"]; reveal(next); next.tap()
        let review = app.buttons["planner-review"]; reveal(review); review.tap()
        let save = app.buttons["save-draft"]; reveal(save)
        XCTAssertTrue(save.isEnabled); save.tap()
        let export = app.buttons["export-draft"]; reveal(export); export.tap()
        XCTAssertTrue(app.otherElements["ActivityListView"].waitForExistence(timeout: 5) || app.buttons["Close"].exists || app.buttons["Fermer"].exists)
        screenshot("Partage natif du brief")
        if app.buttons["Close"].exists { app.buttons["Close"].tap() }
        else if app.buttons["Fermer"].exists { app.buttons["Fermer"].tap() }
        else { app.swipeDown() }
        app.terminate()
        app.launchArguments = ["--ui-testing", "--offline"]; app.launch()
        app.tabBars.buttons["Mon voyage"].tap()
        let restore = app.buttons["restore-draft"]; reveal(restore); restore.tap()
        XCTAssertTrue(app.textFields["destination-field"].waitForExistence(timeout: 5))
        XCTAssertEqual(app.textFields["destination-field"].value as? String, "Portugal")
        let deletion = app.buttons["delete-draft"]; reveal(deletion); deletion.tap()
        app.buttons["Supprimer le brouillon"].tap()
        XCTAssertTrue(restore.waitForNonExistence(timeout: 10))
        let deletedStatus = app.staticTexts["draft-status"]
        XCTAssertTrue(deletedStatus.waitForExistence(timeout: 5))
        XCTAssertEqual(deletedStatus.label, "La copie enregistrée a été supprimée de cet appareil.")
        XCTAssertFalse(app.buttons["delete-draft"].exists)
        screenshot("Brouillon supprimé")
        app.terminate()
        app.launchArguments = ["--ui-testing", "--offline"]; app.launch()
        app.tabBars.buttons["Mon voyage"].tap()
        let reset = app.buttons["Effacer la saisie en cours"]; reveal(reset)
        XCTAssertTrue(reset.isHittable)
        XCTAssertFalse(app.buttons["restore-draft"].exists)
        XCTAssertFalse(app.buttons["delete-draft"].exists)
        screenshot("Suppression conservée après relance")
    }
    func testOptionalPhotoPickerCanBeCancelledBeforeSavingDraft() async throws {
        app.tabBars.buttons["Mon voyage"].tap()
        let picker = app.buttons["choose-photos"]
        reveal(picker); XCTAssertTrue(picker.isHittable); picker.tap()
        // This proxy only observes the system service; the app opens the picker.
        // Bundle identifier verified in the Apple iOS 26.5 runtime's Info.plist.
        let service = XCUIApplication(bundleIdentifier: "com.apple.Photos.PhotosUIService")
        screenshot("Sélecteur Photos · ouverture")
        guard let controls = try await waitForPhotoPickerCancel(service: service) else {
            attachPhotoPickerDiagnostics(service: service)
            XCTFail("Le sélecteur Photos doit présenter un unique bouton Cancel ou Annuler interactif sous 30 secondes.")
            return
        }
        // Tap immediately: the loading sheet can become the Photos service.
        controls.cancel.tap()
        guard try await waitForPhotoPickerDismissal(service: service, picker: picker) else {
            attachPhotoPickerDiagnostics(service: service)
            XCTFail("Annuler doit fermer le sélecteur système et rendre le formulaire interactif.")
            return
        }
        XCTAssertFalse(app.buttons["remove-photos"].exists)
        let next = app.buttons["planner-next"]; reveal(next); next.tap()
        let review = app.buttons["planner-review"]; reveal(review); review.tap()
        let save = app.buttons["save-draft"]; reveal(save)
        XCTAssertTrue(save.isEnabled); save.tap()
        let status = app.staticTexts["draft-status"]; reveal(status)
        XCTAssertTrue(status.label.contains("sans les photos"))
        screenshot("Brouillon enregistré sans photo")
    }
    func testGuidesReadWithoutNetwork() {
        app.tabBars.buttons["Guides"].tap()
        let guide = app.buttons.matching(NSPredicate(format: "label CONTAINS %@", "Préparer un itinéraire qui te laisse le temps de voyager")).firstMatch
        XCTAssertTrue(guide.waitForExistence(timeout: 5)); guide.tap()
        XCTAssertTrue(app.staticTexts["Compte tes journées sur place et tes nuits"].exists)
        screenshot("Guide natif hors ligne")
    }
}
