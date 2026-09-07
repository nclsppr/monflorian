import SwiftUI

@main
struct MonFlorianApp: App {
    @State private var state: AppState
    init() {
        let arguments = ProcessInfo.processInfo.arguments
        let testing = arguments.contains("--ui-testing")
        let preferences = testing ? UserDefaults(suiteName: "MonFlorianUITests")! : .standard
        if testing && arguments.contains("--reset-state") { preferences.removePersistentDomain(forName: "MonFlorianUITests") }
        let testURL = testing ? FileManager.default.temporaryDirectory.appendingPathComponent("MonFlorianUITests/planner.json") : nil
        if testing && arguments.contains("--reset-state"), let testURL { try? FileManager.default.removeItem(at: testURL) }
        _state = State(initialValue: AppState(preferences: preferences, draftURL: testURL, offlineMode: arguments.contains("--offline")))
    }
    var body: some Scene {
        WindowGroup {
            RootView().environment(state).tint(Brand.blue).task { await state.refreshConfiguration() }
        }
    }
}

enum Brand {
    static let ink = Color(red: 6 / 255, green: 26 / 255, blue: 59 / 255)
    static let blue = Color("ActionBlue")
    static let cream = Color("Paper")
}

enum AppTab: Hashable { case explore, planner, guides }
struct RootView: View {
    @State private var tab: AppTab = .explore
    var body: some View {
        TabView(selection: $tab) {
            Tab("Carnet", systemImage: "book.closed", value: .explore) { NavigationStack { ExploreView(tab: $tab) } }
            Tab("Mon voyage", systemImage: "pencil.and.list.clipboard", value: .planner) { NavigationStack { PlannerView() } }
            Tab("Guides", systemImage: "safari", value: .guides) { NavigationStack { GuideHubView() } }
        }
    }
}

struct ReadablePage<Content: View>: View {
    @ViewBuilder var content: Content
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) { content }
                .frame(maxWidth: 700, alignment: .leading).padding(20).frame(maxWidth: .infinity)
        }.background(Brand.cream)
    }
}
struct Note: View {
    let title: String
    let text: String
    var systemImage = "info.circle"
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label(title, systemImage: systemImage).font(.headline)
            Text(text).font(.subheadline).foregroundStyle(.secondary).fixedSize(horizontal: false, vertical: true)
        }.padding(16).frame(maxWidth: .infinity, alignment: .leading).background(.quaternary.opacity(0.45), in: RoundedRectangle(cornerRadius: 16))
    }
}
struct ReadingBlock: View {
    let title: String
    let text: String
    var body: some View {
        VStack(alignment: .leading, spacing: 8) { Text(title).font(.headline); Text(text).foregroundStyle(.secondary) }
    }
}
struct BulletList: View {
    let items: [String]
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            ForEach(Array(items.enumerated()), id: \.offset) { _, item in
                HStack(alignment: .top, spacing: 10) { Text("•").foregroundStyle(.secondary); Text(item).frame(maxWidth: .infinity, alignment: .leading) }
            }
        }
    }
}
struct SceneImage: View {
    let id: String
    let label: String
    var title: String? = nil
    static func load(_ id: String) -> UIImage {
        guard let path = Bundle.main.path(forResource: id, ofType: "webp"), let image = UIImage(contentsOfFile: path) else { return UIImage(systemName: "photo") ?? UIImage() }
        return image
    }

    var body: some View {
        ZStack(alignment: .bottomLeading) {
            Image(uiImage: SceneImage.load(id)).resizable().scaledToFill().frame(height: 236).clipped().accessibilityLabel(label)
            if let title {
                LinearGradient(colors: [.clear, .black.opacity(0.65)], startPoint: .center, endPoint: .bottom)
                Text(title).font(.system(.largeTitle, design: .rounded, weight: .bold)).foregroundStyle(.white).padding(20)
            }
        }.frame(height: 236).clipShape(RoundedRectangle(cornerRadius: 18))
    }
}
