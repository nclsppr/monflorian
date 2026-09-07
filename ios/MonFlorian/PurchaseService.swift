import Foundation
import StoreKit

struct PurchaseAcknowledgement: Equatable, Sendable {
    let transactionID: UInt64
    let durableOrderID: String
    let deliveryAccepted: Bool
    func accepts(_ id: UInt64) -> Bool { transactionID == id && !durableOrderID.isEmpty && deliveryAccepted }
}
protocol PurchaseValidating: Sendable {
    var isAvailable: Bool { get }
    func acknowledge(signedTransaction: String, transactionID: UInt64) async throws -> PurchaseAcknowledgement
}
struct ClosedPurchaseValidator: PurchaseValidating {
    let isAvailable = false
    func acknowledge(signedTransaction: String, transactionID: UInt64) async throws -> PurchaseAcknowledgement { throw APIError.unavailable }
}

enum PurchaseGate {
    static func canPurchase(configuration: APIConfiguration?, productAvailable: Bool, validatorAvailable: Bool) -> Bool {
        configuration?.storeKitReady == true && productAvailable && validatorAvailable
    }
}

@MainActor @Observable final class PurchaseService {
    private(set) var product: Product?
    private(set) var message = "L’achat intégré n’est pas disponible. Aucun paiement ne peut être lancé."
    private let validator: any PurchaseValidating
    // No App Store product has been provisioned or approved for this release.
    private let productID: String?
    init(productID: String? = nil, validator: any PurchaseValidating = ClosedPurchaseValidator()) {
        self.productID = productID; self.validator = validator
    }
    func available(configuration: APIConfiguration?) -> Bool {
        PurchaseGate.canPurchase(configuration: configuration, productAvailable: product != nil, validatorAvailable: validator.isAvailable)
    }
    func load(configuration: APIConfiguration?) async {
        product = nil
        guard configuration?.storeKitReady == true, validator.isAvailable, let productID else { return }
        do { product = try await Product.products(for: [productID]).first }
        catch { message = "L’offre App Store ne peut pas être chargée. Aucun paiement n’a été lancé." }
    }
    func purchase(configuration: APIConfiguration?) async {
        guard available(configuration: configuration), let product else { return }
        do {
            switch try await product.purchase() {
            case .success(let verification): try await accept(verification)
            case .pending: message = "L’achat attend une décision de l’App Store. Aucune commande n’est confirmée."
            case .userCancelled: message = "Achat annulé."
            @unknown default: message = "L’état de cet achat doit être vérifié."
            }
        } catch { message = "La commande n’est pas confirmée. La transaction reste à rapprocher avec le service." }
    }
    func reconcileUnfinished(configuration: APIConfiguration?) async {
        guard configuration?.storeKitReady == true, validator.isAvailable, productID != nil else { return }
        for await verification in Transaction.unfinished {
            do { try await accept(verification) }
            catch { message = "Un achat attend la confirmation du service." }
        }
    }
    private func accept(_ verification: VerificationResult<Transaction>) async throws {
        guard case .verified(let transaction) = verification, transaction.productID == productID,
              transaction.revocationDate == nil else { throw APIError.unavailable }
        let ack = try await validator.acknowledge(signedTransaction: verification.jwsRepresentation, transactionID: transaction.id)
        guard ack.accepts(transaction.id) else { throw APIError.unavailable }
        // The server must durably own delivery before StoreKit can finish this transaction.
        await transaction.finish()
        message = "Commande enregistrée par le service."
    }
}
