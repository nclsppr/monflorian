import SwiftUI
import PhotosUI
import ImageIO

struct SelectedPhoto: Identifiable {
    let id = UUID()
    let data: Data
    let image: UIImage
}

@MainActor @Observable final class AppState {
    var example: PublicExample?
    var articles: [EditorialGuide] = []
    var configuration: APIConfiguration?
    var connectionMessage = "Le carnet et les guides inclus sont lisibles hors ligne."
    var isRefreshing = false
    var contentError: String?
    var articlesError: String?
    var draft = PlannerDraft()
    var draftMessage: String?
    var hasSavedDraft = false
    var photos: [SelectedPhoto] = []
    var photoMessage: String?
    var isLoadingPhotos = false
    private var photoSelectionID = UUID()
    var checkedItems: Set<String> = []
    let purchaseService = PurchaseService()
    let api: APIClient
    private let storage: DraftStorage
    private let preferences: UserDefaults
    private let checklistKey = "monflorian:japan-checklist:ios:v1"
    let offlineMode: Bool

    init(api: APIClient = APIClient(), preferences: UserDefaults = .standard, draftURL: URL? = nil, offlineMode: Bool = false) {
        self.api = api; self.preferences = preferences; self.offlineMode = offlineMode
        let directory = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
        storage = DraftStorage(url: draftURL ?? directory.appendingPathComponent("MonFlorian/planner-v1.json"))
        hasSavedDraft = FileManager.default.fileExists(atPath: storage.url.path)
        do {
            guard let url = Bundle.main.url(forResource: "japan-10-days", withExtension: "json") else { throw APIError.invalidContent }
            example = try JSONDecoder().decode(PublicExample.self, from: Data(contentsOf: url)).validated()
            let allowed = Set(example?.guide.verificationItems.map(\.id) ?? [])
            checkedItems = Set(preferences.stringArray(forKey: checklistKey) ?? []).intersection(allowed)
        } catch { contentError = "Le carnet inclus n’a pas pu être ouvert. Tu peux toujours préparer ton brouillon." }
        do {
            guard let articlesURL = Bundle.main.url(forResource: "guides", withExtension: "json") else { throw APIError.invalidContent }
            articles = try JSONDecoder().decode([EditorialGuide].self, from: Data(contentsOf: articlesURL))
        } catch { articlesError = "Les guides inclus n’ont pas pu être ouverts. Le reste de l’app reste disponible." }
    }
    func refreshConfiguration() async {
        guard !offlineMode else { return }
        do {
            configuration = try await api.configuration()
            connectionMessage = "État du service vérifié. La création et les achats restent indisponibles dans cette version."
        } catch {
            configuration = nil
            connectionMessage = error.localizedDescription
        }
        await purchaseService.load(configuration: configuration)
    }
    func refreshExample() async {
        guard !offlineMode, !isRefreshing else { return }
        isRefreshing = true; defer { isRefreshing = false }
        do {
            example = try await api.example()
            connectionMessage = "L’exemple public a été actualisé pour cette session. Le carnet inclus reste disponible hors ligne."
        } catch { connectionMessage = error.localizedDescription }
    }
    func saveDraft() {
        do { try storage.save(draft); hasSavedDraft = true; draftMessage = "Brouillon enregistré sur cet appareil, sans les photos. Enregistre à nouveau après tes modifications." }
        catch { draftMessage = "L’enregistrement a échoué. Tu peux conserver le texte avec Partager." }
    }
    @discardableResult func restoreDraft() -> Bool {
        do {
            guard let value = try storage.load() else { hasSavedDraft = false; draftMessage = "Aucun brouillon enregistré sur cet appareil."; return false }
            draft = value; clearPhotos(); draftMessage = "Brouillon repris. Les photos ne sont jamais enregistrées avec lui."
            return true
        } catch { draftMessage = error.localizedDescription; return false }
    }
    func deleteSavedDraft() {
        do { try storage.delete(); hasSavedDraft = false; draftMessage = "La copie enregistrée a été supprimée de cet appareil." }
        catch { draftMessage = "La copie n’a pas pu être supprimée. Réessaie après avoir déverrouillé l’appareil." }
    }
    func resetDraft() { draft = PlannerDraft(); clearPhotos(); draftMessage = "La saisie en cours a été effacée." }
    func setChecked(_ id: String, checked: Bool) {
        guard example?.guide.verificationItems.contains(where: { $0.id == id }) == true else { return }
        if checked { checkedItems.insert(id) } else { checkedItems.remove(id) }
        preferences.set(checkedItems.sorted(), forKey: checklistKey)
    }
    func resetChecklist() { checkedItems.removeAll(); preferences.removeObject(forKey: checklistKey) }
    func clearPhotos() { photoSelectionID = UUID(); photos.removeAll(); photoMessage = nil; isLoadingPhotos = false }
    func loadPhotos(_ items: [PhotosPickerItem]) async {
        guard !Task.isCancelled else { return }
        let selectionID = UUID(); photoSelectionID = selectionID
        isLoadingPhotos = true; photoMessage = nil; photos.removeAll()
        defer { if selectionID == photoSelectionID { isLoadingPhotos = false } }
        var loaded: [SelectedPhoto] = []
        do {
            guard items.count <= 4 else { throw APIError.oversized }
            for item in items {
                guard let source = try await item.loadTransferable(type: Data.self) else { throw APIError.invalidContent }
                guard !Task.isCancelled, selectionID == photoSelectionID else { return }
                let processing = Task.detached(priority: .userInitiated) {
                    try Task.checkCancellation()
                    let data = try PhotoPreparer.prepare(source).data
                    try Task.checkCancellation()
                    return data
                }
                let preparedData = try await withTaskCancellationHandler {
                    try await processing.value
                } onCancel: {
                    processing.cancel()
                }
                guard !Task.isCancelled, selectionID == photoSelectionID else { return }
                guard let image = UIImage(data: preparedData) else { throw PhotoPreparationError.unreadable }
                loaded.append(SelectedPhoto(data: preparedData, image: image))
            }
            guard !Task.isCancelled, selectionID == photoSelectionID else { return }
            photos = loaded
            photoMessage = loaded.isEmpty ? nil : "\(loaded.count) photo\(loaded.count > 1 ? "s" : "") préparée\(loaded.count > 1 ? "s" : "") en mémoire. Aucun envoi n’a eu lieu."
        } catch {
            guard !Task.isCancelled, selectionID == photoSelectionID else { return }
            photos.removeAll(); photoMessage = error.localizedDescription
        }
    }
}
