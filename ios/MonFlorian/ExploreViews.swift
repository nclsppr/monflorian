import SwiftUI

struct ExploreView: View {
    @Environment(AppState.self) private var state
    @Binding var tab: AppTab
    @State private var showingSettings = false
    var body: some View {
        ReadablePage {
            HStack(spacing: 4) {
                Image(uiImage: BundledImage.load("florian", extension: "png") ?? UIImage()).resizable().scaledToFit().frame(width: 55, height: 55).accessibilityHidden(true)
                Image(uiImage: BundledImage.load("wordmark", extension: "png") ?? UIImage()).resizable().scaledToFit().frame(width: 125, height: 62).accessibilityLabel("Mon Florian")
                Spacer()
            }.padding(8).background(Color(red: 1, green: 0.973, blue: 0.922), in: RoundedRectangle(cornerRadius: 16))
            VStack(alignment: .leading, spacing: 12) {
                Text("Ton voyage,\nà ton rythme.").font(.system(.largeTitle, design: .default, weight: .bold)).accessibilityAddTraits(.isHeader)
                Text("Un carnet pour te projeter. Des repères pour préparer le tien.").font(.title3).foregroundStyle(.secondary)
            }
            if let example = state.example {
                NavigationLink {
                    CarnetView(example: example)
                } label: {
                    VStack(alignment: .leading, spacing: 12) {
                        SceneImage(id: example.guide.trip.featuredImageBriefId, label: "Scène synthétique d’un couple fictif à Tokyo", title: example.guide.trip.title)
                        HStack { Label("10 jours · 3 étapes", systemImage: "map"); Spacer(); Image(systemName: "arrow.up.right") }.font(.headline)
                        Text(example.guide.trip.routeLabel).foregroundStyle(.secondary)
                        Text("Lire le carnet d’exemple").font(.headline).foregroundStyle(Brand.blue)
                    }.contentShape(Rectangle())
                }.buttonStyle(.plain).accessibilityIdentifier("open-example")
            } else if let error = state.contentError { Note(title: "Carnet indisponible", text: error) }
            Button { tab = .planner } label: { Label("Préparer mon voyage", systemImage: "pencil").frame(maxWidth: .infinity).padding(.vertical, 8) }.buttonStyle(.borderedProminent)
            Note(title: "Un exemple, déjà dans ta poche", text: "Le carnet Japon et les guides sont inclus dans l’app. Tu peux les lire sans connexion. Les images sont synthétiques et les voyageurs fictifs.", systemImage: "arrow.down.circle")
            ReadingBlock(title: "Le sur-mesure se prépare", text: "Tu peux rédiger ton brief et choisir des photos facultatives. La création personnalisée, l’envoi de photos et les achats ne sont pas encore ouverts.")
        }.navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .topBarTrailing) { Button("À propos", systemImage: "info.circle") { showingSettings = true } } }
            .sheet(isPresented: $showingSettings) { NavigationStack { AboutView() } }
    }
}

struct CarnetView: View {
    let example: PublicExample
    var guide: TravelGuide { example.guide }
    var body: some View {
        ReadablePage {
            Text("CARNET D’EXEMPLE").font(.caption.weight(.bold)).foregroundStyle(.secondary)
            Text(guide.trip.title).font(.largeTitle.bold()).accessibilityAddTraits(.isHeader)
            Text(guide.trip.subtitle).font(.title3)
            Label(guide.trip.routeLabel, systemImage: "map").font(.headline)
            SceneImage(id: guide.trip.featuredImageBriefId, label: "Illustration synthétique d’un couple fictif au Japon")
            Text(guide.trip.summary)
            Note(title: "Le choix de Florian", text: guide.trip.florianRationale, systemImage: "sparkle")
            VStack(spacing: 0) {
                NavigationLink { AccommodationsView(example: example) } label: { MenuRow(title: "Hébergements", detail: "3 bases · 9 nuits", icon: "bed.double") }
                Divider()
                NavigationLink { ChecklistView(guide: guide) } label: { MenuRow(title: "À vérifier", detail: "\(guide.verificationItems.count) points avant de partir", icon: "checklist") }
                Divider()
                NavigationLink { BudgetView(guide: guide) } label: { MenuRow(title: "Budget & réservations", detail: "Les choix qui structurent le voyage", icon: "eurosign.circle") }
                Divider()
                NavigationLink { PracticalView(guide: guide) } label: { MenuRow(title: "Conseils pratiques", detail: "9 rubriques pour préparer le départ", icon: "suitcase.rolling") }
            }.buttonStyle(.plain)
            Text("Les dix journées").font(.title2.bold()).accessibilityAddTraits(.isHeader)
            ForEach(guide.chapters) { chapter in
                VStack(alignment: .leading, spacing: 16) {
                    SceneImage(id: chapter.imageBriefId, label: guide.imageBriefs.first { $0.id == chapter.imageBriefId }?.altText ?? "Illustration synthétique", title: "Jours \(chapter.dayStart)–\(chapter.dayEnd)")
                    Text(chapter.title).font(.title2.bold())
                    Text(chapter.summary).foregroundStyle(.secondary)
                    DisclosureGroup("Pourquoi cette étape") { Text(chapter.whyItWorks).padding(.top, 8).frame(maxWidth: .infinity, alignment: .leading) }
                    ForEach(guide.days.filter { $0.chapterId == chapter.id }) { day in
                        NavigationLink { DayView(day: day, example: example) } label: {
                            HStack(alignment: .top, spacing: 14) {
                                Text(String(format: "%02d", day.day)).font(.title2.monospacedDigit().bold()).foregroundStyle(Brand.blue).frame(width: 36)
                                VStack(alignment: .leading, spacing: 4) { Text(day.title).font(.headline); Text(Labels.value(day.energy)).font(.subheadline).foregroundStyle(.secondary) }
                                Spacer(minLength: 0); Image(systemName: "chevron.right").font(.caption.weight(.semibold)).foregroundStyle(.secondary)
                            }.padding(.vertical, 12).contentShape(Rectangle())
                        }.buttonStyle(.plain).accessibilityIdentifier("day-\(day.day)")
                        Divider()
                    }
                }.padding(.bottom, 12)
            }
            Note(title: "Avant de réserver", text: "Ce parcours est une projection éditoriale sans dates confirmées. Les hôtels, prix, horaires et disponibilités doivent être vérifiés pour ton voyage.")
            ShareLink(item: URL(string: "https://monflorian.com/carnets/japon-10-jours")!) { Label("Partager le carnet public", systemImage: "square.and.arrow.up") }
            Text("Le partage transmet uniquement le lien public, sans ton brouillon ni tes cases cochées.").font(.footnote).foregroundStyle(.secondary)
        }.navigationTitle("Le Japon à deux").navigationBarTitleDisplayMode(.inline)
    }
}
struct MenuRow: View {
    let title, detail, icon: String
    var body: some View {
        HStack(spacing: 14) {
            Image(systemName: icon).font(.title3).foregroundStyle(Brand.blue).frame(width: 28)
            VStack(alignment: .leading, spacing: 4) { Text(title).font(.headline); Text(detail).font(.subheadline).foregroundStyle(.secondary) }
            Spacer(minLength: 2); Image(systemName: "chevron.right").font(.caption).foregroundStyle(.secondary)
        }.padding(.vertical, 14).contentShape(Rectangle())
    }
}
struct DayView: View {
    let day: TravelGuide.Day
    let example: PublicExample
    var body: some View {
        ReadablePage {
            Text("JOUR \(day.day) · \(Labels.value(day.energy).uppercased())").font(.caption.bold()).foregroundStyle(Brand.blue)
            Text(day.title).font(.largeTitle.bold())
            Text(day.summary).font(.title3)
            if day.transfer.needed && day.transfer.placement == "before_morning" { TransferView(transfer: day.transfer, guide: example.guide) }
            ForEach(day.moments) { moment in
                VStack(alignment: .leading, spacing: 14) {
                    Text(Labels.value(moment.period)).font(.subheadline.bold()).foregroundStyle(Brand.blue)
                    Text(moment.title).font(.title2.bold())
                    Text("\(moment.durationMinutes) min sur place · \(moment.travelMinutes) min de trajet").font(.subheadline).foregroundStyle(.secondary)
                    Text(moment.description)
                    ReadingBlock(title: "Pourquoi ce choix", text: moment.whyThisFits)
                    Text("\(Labels.value(moment.reservation)) · \(Labels.value(moment.costLevel))").font(.subheadline.weight(.medium))
                    ReadingBlock(title: "Le conseil pratique", text: moment.practicalTip)
                    DisclosureGroup("S’il pleut ou si tu es fatigué") {
                        VStack(alignment: .leading, spacing: 16) {
                            ReadingBlock(title: "S’il pleut", text: moment.rainAlternative)
                            ReadingBlock(title: "Si tu es fatigué", text: moment.fatigueAlternative)
                        }.padding(.top, 12)
                    }
                    VerificationLinks(ids: moment.verificationItemIds, guide: example.guide)
                }
                if day.transfer.needed && day.transfer.placement == "after_\(moment.period)" { TransferView(transfer: day.transfer, guide: example.guide) }
                Divider()
            }
            if let stay = example.guide.stay(day.accommodationId) {
                NavigationLink { AccommodationView(stay: stay, example: example) } label: { MenuRow(title: "La nuit à \(stay.destination)", detail: stay.recommendedAreas.joined(separator: " ou "), icon: "bed.double") }.buttonStyle(.plain)
            } else { Text("Pas de nuit prévue dans le carnet après cette journée.").foregroundStyle(.secondary) }
        }.navigationTitle("Jour \(day.day)").navigationBarTitleDisplayMode(.inline)
    }
}
struct TransferView: View {
    let transfer: TravelGuide.Transfer
    let guide: TravelGuide
    var body: some View {
        if let duration = transfer.durationMinutes, let description = transfer.description, let luggageAdvice = transfer.luggageAdvice {
            VStack(alignment: .leading, spacing: 12) {
                Label("Transfert · \(duration) min", systemImage: "tram").font(.headline)
                Text(transfer.modes.map(Labels.value).joined(separator: " / ")).font(.subheadline)
                Text(description)
                ReadingBlock(title: "Avec les bagages", text: luggageAdvice)
                Text(Labels.value(transfer.reservation)).font(.subheadline.weight(.medium))
                VerificationLinks(ids: transfer.verificationItemIds, guide: guide)
            }.padding(18).background(.quaternary.opacity(0.5), in: RoundedRectangle(cornerRadius: 16))
        }
    }
}

struct VerificationLinks: View {
    let ids: [String]
    let guide: TravelGuide
    var body: some View {
        if !ids.isEmpty {
            DisclosureGroup("À vérifier (\(ids.count))") {
                ForEach(guide.checks(ids)) { check in
                    NavigationLink { VerificationDetail(check: check) } label: { Text(check.topic).frame(maxWidth: .infinity, alignment: .leading).padding(.vertical, 8) }
                }
            }.font(.subheadline)
        }
    }
}

struct AccommodationsView: View {
    let example: PublicExample
    var body: some View {
        ReadablePage {
            Text("Trois bases,\nneuf nuits.").font(.largeTitle.bold())
            Text("Des quartiers et des critères pour chercher un hébergement. Aucun établissement précis n’est recommandé ou réservé dans cet exemple.").foregroundStyle(.secondary)
            ForEach(example.guide.accommodations) { stay in
                NavigationLink { AccommodationView(stay: stay, example: example) } label: {
                    MenuRow(title: stay.destination, detail: "\(stay.nights) nuit\(stay.nights > 1 ? "s" : "") · \(Labels.value(stay.propertyType))", icon: "bed.double")
                }.buttonStyle(.plain)
                Divider()
            }
        }.navigationTitle("Hébergements").navigationBarTitleDisplayMode(.inline)
    }
}
struct AccommodationView: View {
    let stay: TravelGuide.Accommodation
    let example: PublicExample
    var body: some View {
        ReadablePage {
            Text(stay.destination).font(.largeTitle.bold())
            Label("\(stay.nights) nuit\(stay.nights > 1 ? "s" : "") · du jour \(stay.checkInDay) au jour \(stay.checkOutDay)", systemImage: "moon").font(.headline)
            Text("\(Labels.value(stay.propertyType)) · \(Labels.value(stay.bookingPriority))").foregroundStyle(.secondary)
            ReadingBlock(title: "Où chercher", text: stay.recommendedAreas.joined(separator: " ou "))
            Text(stay.rationale)
            Text("Les critères à garder").font(.title2.bold()); BulletList(items: stay.selectionCriteria)
            Text("À regarder de près").font(.title2.bold()); BulletList(items: stay.watchFor)
            VerificationLinks(ids: stay.verificationItemIds, guide: example.guide)
            if let raw = example.bookingLinks[stay.bookingDestinationRef], let url = ExternalLinks.bookingURL(raw) {
                Link(destination: url) { Label("Chercher à \(stay.destination) sur Booking.com", systemImage: "arrow.up.right").frame(maxWidth: .infinity).padding(.vertical, 6) }.buttonStyle(.borderedProminent)
                Text("Recherche externe sans affiliation annoncée. Les dates, prix et disponibilités sont à vérifier chez Booking.com. Aucun achat n’est fait par Mon Florian.").font(.footnote).foregroundStyle(.secondary)
            }
        }.navigationTitle(stay.destination).navigationBarTitleDisplayMode(.inline)
    }
}
struct ChecklistView: View {
    @Environment(AppState.self) private var state
    let guide: TravelGuide
    var body: some View {
        List {
            Section {
                Text("Cocher signifie que tu as vérifié ce point. Chaque changement est gardé sur cet appareil, sans être partagé ni envoyé.").font(.subheadline).foregroundStyle(.secondary)
                Text("\(state.checkedItems.count) sur \(guide.verificationItems.count) vérifiés").font(.headline)
            }
            ForEach(Labels.timings, id: \.self) { timing in
                Section(Labels.value(timing)) {
                    ForEach(guide.verificationItems.filter { $0.timing == timing }) { check in
                        HStack(alignment: .top, spacing: 12) {
                            Button { state.setChecked(check.id, checked: !state.checkedItems.contains(check.id)) } label: {
                                Image(systemName: state.checkedItems.contains(check.id) ? "checkmark.circle.fill" : "circle").font(.title2).frame(width: 44, height: 44)
                            }.buttonStyle(.borderless).accessibilityLabel(check.topic).accessibilityValue(state.checkedItems.contains(check.id) ? "Vérifié" : "À vérifier").accessibilityIdentifier("check-\(check.id)")
                            NavigationLink { VerificationDetail(check: check) } label: {
                                VStack(alignment: .leading, spacing: 5) { Text(check.topic); Text(check.sourceHint).font(.footnote).foregroundStyle(.secondary) }.padding(.vertical, 4)
                            }
                        }
                    }
                }
            }
            Section { Button("Tout décocher", role: .destructive) { state.resetChecklist() }.disabled(state.checkedItems.isEmpty) }
        }.navigationTitle("À vérifier")
    }
}
struct VerificationDetail: View {
    let check: TravelGuide.Verification
    var body: some View {
        ReadablePage {
            Text(check.topic).font(.largeTitle.bold())
            Text(Labels.value(check.timing)).font(.headline).foregroundStyle(Brand.blue)
            Text(check.reason)
            ReadingBlock(title: Labels.value(check.sourceType), text: check.sourceHint)
            Note(title: "Une vérification à faire", text: "Cette indication désigne la source à consulter. Elle ne signifie pas que Mon Florian a vérifié les informations pour tes dates.")
        }.navigationTitle("Vérification").navigationBarTitleDisplayMode(.inline)
    }
}
struct BudgetView: View {
    let guide: TravelGuide
    var body: some View {
        ReadablePage {
            Text("Ce qui fait varier\nle budget.").font(.largeTitle.bold())
            Text(guide.budgetGuide.summary)
            Text("Repère : \(Labels.value(guide.budgetGuide.approach)) · \(guide.budgetGuide.currencyCode)").font(.headline)
            BulletList(items: guide.budgetGuide.mainVariables)
            VerificationLinks(ids: guide.budgetGuide.verificationItemIds, guide: guide)
            Text("Dans quel ordre réserver").font(.title2.bold())
            ForEach(guide.reservationPlan) { item in
                VStack(alignment: .leading, spacing: 10) {
                    Text(item.title).font(.headline)
                    Text("\(Labels.value(item.priority)) · \(Labels.value(item.category))\(item.day.map { " · Jour \($0)" } ?? "")").font(.subheadline).foregroundStyle(Brand.blue)
                    ReadingBlock(title: item.whenToBook, text: item.reason)
                    VerificationLinks(ids: item.verificationItemIds, guide: guide)
                }
                Divider()
            }
        }.navigationTitle("Budget & réservations").navigationBarTitleDisplayMode(.inline)
    }
}
struct PracticalView: View {
    let guide: TravelGuide
    var body: some View {
        List {
            ForEach(Labels.practicalKeys, id: \.self) { key in
                NavigationLink(Labels.value(key)) {
                    ReadablePage {
                        ForEach(guide.practicalGuide[key] ?? []) { item in
                            VStack(alignment: .leading, spacing: 12) {
                                Text(item.title).font(.title2.bold())
                                Text(item.detail)
                                Text(Labels.value(item.priority)).font(.subheadline).foregroundStyle(.secondary)
                                if item.mustVerify { VerificationLinks(ids: item.verificationItemIds, guide: guide) }
                            }
                            Divider()
                        }
                    }.navigationTitle(Labels.value(key)).navigationBarTitleDisplayMode(.inline)
                }
            }
        }.navigationTitle("Conseils pratiques")
    }
}

enum Labels {
    static let timings = ["before_booking", "before_departure", "last_72_hours", "on_site"]
    static let practicalKeys = ["documents", "reservations", "transport", "money", "connectivity", "healthComfort", "packingWeather", "localEtiquette", "last72Hours"]
    static func value(_ key: String) -> String {
        ["light": "Léger", "balanced": "Équilibré", "full": "Soutenu", "calm": "Calme", "intense": "Soutenu", "morning": "Matin", "afternoon": "Après-midi", "evening": "Soir", "none": "Sans réservation", "recommended": "Conseillé", "required": "Réservation nécessaire", "free": "Gratuit", "low": "Budget léger", "medium": "Budget intermédiaire", "high": "Budget élevé", "variable": "Coût variable", "walk": "À pied", "metro": "Métro", "local_train": "Train local", "high_speed_train": "Train à grande vitesse", "bus": "Bus", "ferry": "Ferry", "car": "Voiture", "flight": "Vol", "lean": "Essentiel", "comfort": "Confort", "premium": "Premium", "hotel": "Hôtel", "ryokan": "Ryokan", "guesthouse": "Maison d’hôtes", "apartment": "Appartement", "mixed": "Hébergements variés", "essential": "Essentiel", "optional": "Facultatif", "accommodation": "Hébergement", "transport": "Transports", "luggage": "Bagages", "activity": "Activité", "restaurant": "Restaurant", "entry": "Entrée", "documents": "Documents", "reservations": "Réservations", "money": "Argent", "connectivity": "Connexion", "healthComfort": "Santé et confort", "packingWeather": "Valise et météo", "localEtiquette": "Usages locaux", "last72Hours": "Les 72 dernières heures", "before_booking": "Avant de réserver", "before_departure": "Avant le départ", "last_72_hours": "Dans les 72 dernières heures", "on_site": "Sur place", "official_operator": "Opérateur officiel", "accommodation_provider": "Hébergement", "booking_provider": "Plateforme de réservation", "local_authority": "Autorité locale", "manual_review": "Vérification personnelle"][key] ?? key
    }
}
