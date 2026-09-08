import SwiftUI
import PhotosUI

struct PlannerView: View {
    @Environment(AppState.self) private var state
    @State private var step = 0
    @State private var selectedItems: [PhotosPickerItem] = []
    @State private var hasDates = false
    @State private var date = Date()
    @State private var confirmReset = false
    @State private var confirmDelete = false
    @State private var scrollRequest = 0
    var body: some View {
        @Bindable var state = state
        let photoButtonLabel = state.photos.isEmpty ? "Choisir des photos" : "Modifier les photos"
        ScrollViewReader { scroll in
        Form {
            Section {
                Text("Prends le temps de poser tes envies. Ce brief reste sur ton appareil : aucune commande n’est envoyée.").font(.subheadline).foregroundStyle(.secondary).id("planner-top")
                Picker("Étape", selection: $step) {
                    Text("1. Envie").tag(0); Text("2. Détails").tag(1); Text("3. Mon brief").tag(2)
                }.pickerStyle(.segmented).accessibilityIdentifier("planner-step")
            }
            if step == 0 {
                Section("Ton point de départ") {
                    TextField("Destination ou région", text: $state.draft.destination).textInputAutocapitalization(.words).accessibilityIdentifier("destination-field")
                    TextField("Ce qui te ferait plaisir…", text: $state.draft.brief, axis: .vertical).lineLimit(4...8).accessibilityIdentifier("brief-field")
                    Text("Destination : 120 caractères maximum. Envie : 2 000 caractères maximum.").font(.caption).foregroundStyle(.secondary)
                }
                Section {
                    PhotosPicker(selection: $selectedItems, maxSelectionCount: 4, matching: .images) {
                        Label(photoButtonLabel, systemImage: "photo.badge.plus")
                    }.accessibilityIdentifier("choose-photos")
                    if state.isLoadingPhotos { ProgressView("Préparation locale des photos…") }
                    if !state.photos.isEmpty {
                        ScrollView(.horizontal) {
                            HStack(spacing: 10) {
                                ForEach(Array(state.photos.enumerated()), id: \.element.id) { index, photo in
                                    Image(uiImage: photo.image).resizable().scaledToFill().frame(width: 90, height: 110).clipped().clipShape(RoundedRectangle(cornerRadius: 10)).accessibilityLabel("Photo sélectionnée \(index + 1)")
                                }
                            }
                        }
                    }
                    if !selectedItems.isEmpty || !state.photos.isEmpty || state.isLoadingPhotos {
                        Button("Retirer les photos", role: .destructive) { selectedItems = []; state.clearPhotos() }.accessibilityIdentifier("remove-photos")
                    }
                    if let message = state.photoMessage { Text(message).font(.footnote).accessibilityIdentifier("photo-status") }
                } header: { Text("Tes voyageurs · photos facultatives") } footer: {
                    Text("Jusqu’à 4 photos. Elles servent seulement à préparer une future illustration. Elles restent en mémoire, sans envoi ni copie dans le brouillon. Tu peux continuer sans photo.")
                }
                Section("Avant un éventuel envoi") {
                    Text("Choisir une photo n’autorise pas son envoi à une IA. Quand ce service sera ouvert, une confirmation distincte nommera le fournisseur, l’usage et la durée de conservation. Choisis uniquement des photos que les personnes concernées t’autorisent à utiliser.")
                    Text("Rétention prévue après envoi : suppression des photos après traitement, au plus tard sous 24 h ; carnet privé limité à 30 jours. Ce flux est actuellement fermé.").font(.footnote).foregroundStyle(.secondary)
                }
                Section { Button("Continuer vers les détails") { step = 1 }.accessibilityIdentifier("planner-next") }
            } else if step == 1 {
                Section("Dates et voyageurs") {
                    TextField("Ville de départ", text: $state.draft.departureCity).textInputAutocapitalization(.words)
                    Toggle("Je connais ma date de départ", isOn: $hasDates)
                        .onChange(of: hasDates) { _, enabled in state.draft.startDate = enabled ? PlannerDraft.dateString(date) : nil }
                    if hasDates {
                        DatePicker("Départ", selection: $date, displayedComponents: .date).onChange(of: date) { _, value in state.draft.startDate = PlannerDraft.dateString(value) }
                    }
                    Stepper("\(state.draft.days) jours", value: $state.draft.days, in: 2...14)
                    Stepper("\(state.draft.travelers) voyageur\(state.draft.travelers > 1 ? "s" : "")", value: $state.draft.travelers, in: 1...8)
                }
                Section("Rythme et confort") {
                    Picker("Rythme", selection: $state.draft.pace) { ForEach(Pace.allCases) { Text($0.title).tag($0) } }
                    Picker("Hébergement", selection: $state.draft.comfort) { ForEach(Comfort.allCases) { Text($0.title).tag($0) } }
                    TextField("Budget du groupe, avec devise", text: $state.draft.budget)
                    TextField("Mobilité, repas, envies à éviter…", text: $state.draft.constraints, axis: .vertical).lineLimit(3...6)
                    Text("Écris seulement ce qui aide à préparer le voyage. Aucun document d’identité ni détail médical n’est nécessaire. Contraintes : 1 000 caractères maximum.").font(.footnote).foregroundStyle(.secondary)
                }
                Section { Button("Voir mon brief") { step = 2 }.accessibilityIdentifier("planner-review") }
            } else {
                Section("Ta fiche de préparation") {
                    Text(state.draft.exportText).textSelection(.enabled).accessibilityIdentifier("draft-summary")
                    if !state.photos.isEmpty { Text("\(state.photos.count) photo(s) prête(s) dans cette session uniquement.").font(.footnote).foregroundStyle(.secondary) }
                }
                Section {
                    Button("Garder sur cet appareil", systemImage: "square.and.arrow.down") { state.saveDraft() }.disabled(!validDraft).accessibilityIdentifier("save-draft")
                    ShareLink(item: state.draft.exportText) { Label("Partager la fiche texte", systemImage: "square.and.arrow.up") }.disabled(!validDraft).accessibilityIdentifier("export-draft")
                } footer: { Text("Seul le texte est enregistré après ton clic. Les modifications suivantes demandent un nouvel enregistrement. Le partage ouvre les options d’iOS et ne joint aucune photo.") }
                Section("Voyage personnalisé") {
                    Label("Création et achat indisponibles", systemImage: "lock").font(.headline)
                    Text("Cette fiche ne crée pas encore de voyage personnalisé. Aucun prix ni délai de livraison n’est proposé tant que le service et l’offre App Store ne sont pas ouverts.").font(.subheadline).foregroundStyle(.secondary)
                    Text(state.purchaseService.message).font(.footnote)
                }
            }
            if !validDraft { Section { Label("Vérifie les limites des textes, des jours et des voyageurs avant d’enregistrer.", systemImage: "exclamationmark.circle").foregroundStyle(.red) } }
            if let message = state.draftMessage { Section { Text(message).font(.subheadline).accessibilityIdentifier("draft-status") } }
            if state.hasSavedDraft {
                Section("La copie sur cet appareil") {
                    Button("Reprendre le brouillon enregistré") {
                        if state.restoreDraft() { selectedItems = []; syncDates(); step = 0; scrollRequest += 1 }
                    }.accessibilityIdentifier("restore-draft")
                    Button("Supprimer la copie enregistrée", role: .destructive) { confirmDelete = true }.accessibilityIdentifier("delete-draft")
                }
            }
            Section { Button("Effacer la saisie en cours", role: .destructive) { confirmReset = true } }
        }.scrollDismissesKeyboard(.interactively).navigationTitle("Mon voyage")
            .task(id: selectedItems) { await state.loadPhotos(selectedItems) }
            .onAppear { syncDates() }
            .onChange(of: step) { _, _ in scroll.scrollTo("planner-top", anchor: .top) }
            .onChange(of: scrollRequest) { _, _ in scroll.scrollTo("planner-top", anchor: .top) }
            .confirmationDialog("Effacer la saisie en cours et les photos de cette session ?", isPresented: $confirmReset, titleVisibility: .visible) {
                Button("Effacer la saisie", role: .destructive) { state.resetDraft(); selectedItems = []; hasDates = false; step = 0; scrollRequest += 1 }
            } message: { Text("La copie déjà enregistrée restera disponible jusqu’à sa suppression séparée.") }
            .confirmationDialog("Supprimer le brouillon enregistré sur cet appareil ?", isPresented: $confirmDelete, titleVisibility: .visible) {
                Button("Supprimer le brouillon", role: .destructive) { state.deleteSavedDraft() }
            } message: { Text("Cette action efface uniquement la copie enregistrée. Le texte actuellement affiché reste disponible.") }
        }
    }
    private var validDraft: Bool { (try? state.draft.validated()) != nil }
    private func syncDates() { hasDates = state.draft.startDate != nil; if let text = state.draft.startDate, let value = PlannerDraft.parseDate(text) { date = value } }
}

struct GuideHubView: View {
    @Environment(AppState.self) private var state
    var body: some View {
        ReadablePage {
            Text("Du temps pour\nvoyager.").font(.largeTitle.bold())
            Text("Des guides pour répartir tes nuits, compter les trajets et garder de la place à l’imprévu.").font(.title3).foregroundStyle(.secondary)
            ForEach(state.articles) { article in
                NavigationLink { ArticleView(article: article) } label: {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("\(article.category.uppercased()) · \(article.readTime)").font(.caption.bold()).foregroundStyle(Brand.blue)
                        Text(article.heading).font(.title2.bold())
                        Text(article.description).foregroundStyle(.secondary)
                        Label("Lire le guide", systemImage: "arrow.up.right").font(.headline).foregroundStyle(Brand.blue)
                    }.padding(.vertical, 12).contentShape(Rectangle())
                }.buttonStyle(.plain)
                Divider()
            }
            if let error = state.articlesError { Note(title: "Guides indisponibles", text: error) }
            else { Note(title: "Inclus dans l’app", text: "Ces deux guides restent consultables sans connexion. Leurs sources externes demandent un accès à Internet.", systemImage: "arrow.down.circle") }
        }.navigationTitle("Guides")
    }
}
struct ArticleView: View {
    let article: EditorialGuide
    var body: some View {
        ReadablePage {
            Text(article.heading).font(.largeTitle.bold())
            Text("Mon Florian · \(article.readTime) de lecture\nMis à jour le \(article.updatedDate)").font(.subheadline).foregroundStyle(.secondary)
            ForEach(article.intro, id: \.self) { Text($0).font(.title3) }
            ForEach(article.sections) { section in
                VStack(alignment: .leading, spacing: 16) {
                    Text(section.heading).font(.title2.bold()).accessibilityAddTraits(.isHeader)
                    ParagraphsView(paragraphs: section.paragraphs, sources: article.sources)
                    if let bullets = section.bullets { BulletList(items: bullets) }
                    if let table = section.table {
                        Text(table.caption).font(.headline)
                        ForEach(Array(table.rows.enumerated()), id: \.offset) { _, row in
                            VStack(alignment: .leading, spacing: 8) {
                                ForEach(Array(row.enumerated()), id: \.offset) { index, value in
                                    if index == 0 { Text(value).font(.headline) }
                                    else { Text("\(table.headings.indices.contains(index) ? table.headings[index] : "") : \(value)") }
                                }
                            }.padding(14).frame(maxWidth: .infinity, alignment: .leading).background(.quaternary.opacity(0.5), in: RoundedRectangle(cornerRadius: 12))
                        }
                    }
                    if let after = section.after { ParagraphsView(paragraphs: after, sources: article.sources) }
                }
                Divider()
            }
            Text("Sources et vérifications").font(.title2.bold())
            Text("Pages consultées le \(article.updatedDate). Vérifie les informations de transport et de réservation pour tes dates auprès des organismes concernés.").foregroundStyle(.secondary)
            ForEach(article.sources) { source in
                if let url = ExternalLinks.editorialURL(source.url) { Link(source.label, destination: url).font(.headline) }
                Text(source.detail).font(.subheadline).foregroundStyle(.secondary)
            }
        }.navigationTitle(article.category).navigationBarTitleDisplayMode(.inline)
    }
}
struct ParagraphsView: View {
    let paragraphs: [EditorialGuide.Paragraph]
    let sources: [EditorialGuide.Source]
    var body: some View {
        ForEach(Array(paragraphs.enumerated()), id: \.offset) { _, paragraph in
            Text(paragraph.text)
            if let id = paragraph.source, let source = sources.first(where: { $0.id == id }), let url = ExternalLinks.editorialURL(source.url) { Link(source.label, destination: url).font(.subheadline) }
        }
    }
}
struct AboutView: View {
    @Environment(AppState.self) private var state
    @Environment(\.dismiss) private var dismiss
    var body: some View {
        List {
            Section("Sur cet appareil") {
                Label("Carnet Japon et guides hors ligne", systemImage: "book.closed")
                Text("Le brouillon est enregistré seulement à ta demande. Les cases cochées sont conservées après chaque changement. Les photos sélectionnées restent en mémoire et ne sont jamais enregistrées avec le brouillon.")
            }
            Section("Service") {
                Text(state.connectionMessage).accessibilityIdentifier("service-status")
                Button("Vérifier l’état du service") { Task { await state.refreshConfiguration() } }
                Button { Task { await state.refreshExample() } } label: {
                    if state.isRefreshing { ProgressView("Actualisation de l’exemple…") } else { Text("Actualiser l’exemple public") }
                }.disabled(state.isRefreshing)
                Text("Aucune commande, aucun paiement et aucun envoi de photos ne sont disponibles dans cette version.").font(.footnote).foregroundStyle(.secondary)
            }
            Section("À propos") {
                Link("Site Mon Florian", destination: URL(string: "https://monflorian.com")!)
                Link("Traitement des données", destination: URL(string: "https://monflorian.com/confidentialite")!)
                Text("Les images du Japon sont des illustrations synthétiques avec des personnages fictifs. Les recherches d’hébergement sont externes. Mon Florian ne réserve rien.").font(.footnote)
                Text("Version 0.1 · aperçu natif").font(.footnote).foregroundStyle(.secondary)
            }
        }.navigationTitle("Mon Florian").toolbar { ToolbarItem(placement: .confirmationAction) { Button("Fermer") { dismiss() } } }
    }
}
