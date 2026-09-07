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
        XCTAssertEqual(app.textFields["destination-field"].value as? String, "Portugal")
        let deletion = app.buttons["delete-draft"]; reveal(deletion); deletion.tap()
        app.buttons["Supprimer le brouillon"].tap()
        XCTAssertFalse(app.buttons["restore-draft"].exists)
        screenshot("Brouillon supprimé")
    }
    func testGuidesReadWithoutNetwork() {
        app.tabBars.buttons["Guides"].tap()
        let guide = app.buttons.matching(NSPredicate(format: "label CONTAINS %@", "Préparer un itinéraire qui te laisse le temps de voyager")).firstMatch
        XCTAssertTrue(guide.waitForExistence(timeout: 5)); guide.tap()
        XCTAssertTrue(app.staticTexts["Compte tes journées sur place et tes nuits"].exists)
        screenshot("Guide natif hors ligne")
    }
}
